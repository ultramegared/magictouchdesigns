import type { Request, Response } from "express";
import { randomUUID } from "crypto";
import { disconnect, getConnectUrl, getConnections, handleCallback, isSocialProvider, verifySocialConnection, publishMeta, publishPinterest, publishTikTokPhoto, publishTikTokVideo, publishYouTube, type SocialChannel } from "../services/social-connections.service";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";
import { launchMarketingCampaign, listMarketingCampaigns, listMarketingPublicationActivity, getMarketingLearning, runMarketingAutopilot } from "../services/marketing-campaign.service";
import { recordCampaignLearningFeedback, type LearningChannel } from "../services/marketing-learning.service";
import { getMarketingDailySummary, sendMarketingDailySummary } from "../services/marketing-autopilot.service";
import { getContentAutopilotStatus, setCatalogAutopilot } from "../services/marketing-catalog.service";
import { uploadImageAsset } from "../services/upload.service";

export async function socialConnections(req: AuthenticatedRequest, res: Response) {
    try { res.json(await getConnections(String(req.user!.userId))); }
    catch (error) { res.status(500).json({ error: error instanceof Error ? error.message : "Unable to load social connections." }); }
}

export function socialAuthorize(req: AuthenticatedRequest, res: Response) {
    try {
        const provider = String(req.params.provider);
        if (!isSocialProvider(provider)) return res.status(400).json({ error: "Unsupported social provider." });
        res.json({ url: getConnectUrl(provider, String(req.user!.userId)) });
    } catch (error) { res.status(503).json({ error: error instanceof Error ? error.message : "Social integration is not configured." }); }
}

export async function socialVerify(req: AuthenticatedRequest, res: Response) {
    try {
        const provider = String(req.params.provider);
        if (!isSocialProvider(provider)) return res.status(400).json({ error: "Unsupported social provider." });
        const result = await verifySocialConnection(String(req.user!.userId), provider);
        res.json({ status: "success", ...result });
    } catch (error) {
        res.status(503).json({ status: "error", verified: false, error: error instanceof Error ? error.message : "Social connection verification failed." });
    }
}

export function socialConnect(req: AuthenticatedRequest, res: Response) {
    try {
        const provider = String(req.params.provider);
        if (!isSocialProvider(provider)) return res.status(400).json({ error: "Unsupported social provider." });
        res.redirect(getConnectUrl(provider, String(req.user!.userId)));
    } catch (error) { res.status(503).json({ error: error instanceof Error ? error.message : "Social integration is not configured." }); }
}

export async function socialCallback(req: Request, res: Response) {
    try {
        const provider = String(req.params.provider);
        if (!isSocialProvider(provider)) throw new Error("Unsupported social provider.");
        const code = String(req.query.code || "");
        const state = String(req.query.state || "");
        if (!code || !state) throw new Error(String(req.query.error_description || req.query.error || "Authorization was cancelled."));
        await handleCallback(provider, code, state);
        res.redirect(`${process.env.FRONTEND_PUBLIC_URL || "https://jqydesigns.com"}/admin/marketing?social=connected&provider=${encodeURIComponent(provider)}`);
    } catch (error) {
        const message = error instanceof Error ? error.message : "Social authorization failed.";
        res.redirect(`${process.env.FRONTEND_PUBLIC_URL || "https://jqydesigns.com"}/admin/marketing?social=error&message=${encodeURIComponent(message)}`);
    }
}

export async function socialDisconnect(req: AuthenticatedRequest, res: Response) {
    try {
        const provider = String(req.params.provider);
        if (!isSocialProvider(provider)) return res.status(400).json({ error: "Unsupported social provider." });
        await disconnect(String(req.user!.userId), provider);
        res.json({ ok: true });
    } catch (error) { res.status(500).json({ error: error instanceof Error ? error.message : "Unable to disconnect social account." }); }
}

export async function marketingMediaUpload(req: AuthenticatedRequest, res: Response) {
    try {
        if (!req.file) {
            return res.status(400).json({ status: "error", message: "Marketing image file is required." });
        }

        const asset = await uploadImageAsset(req.file.buffer, "promotions");
        return res.status(200).json({
            status: "success",
            message: "Marketing image uploaded successfully.",
            image_url: asset.imageUrl,
            public_id: asset.publicId,
        });
    } catch (error) {
        console.error("Marketing media upload failed:", error);
        return res.status(500).json({
            status: "error",
            message: error instanceof Error ? error.message : "Unable to upload Marketing image.",
        });
    }
}

export async function marketingCampaignLaunch(req: AuthenticatedRequest, res: Response) {
    try {
        const result = await launchMarketingCampaign(String(req.user!.userId), {
            name: String(req.body?.name || ""),
            objective: typeof req.body?.objective === "string" ? req.body.objective : undefined,
            targetArea: typeof req.body?.targetArea === "string" ? req.body.targetArea : undefined,
            message: String(req.body?.message || ""),
            subject: typeof req.body?.subject === "string" ? req.body.subject : undefined,
            imageUrl: typeof req.body?.imageUrl === "string" ? req.body.imageUrl : undefined,
            videoUrl: typeof req.body?.videoUrl === "string" ? req.body.videoUrl : undefined,
            link: typeof req.body?.link === "string" ? req.body.link : undefined,
            whatsappTo: typeof req.body?.whatsappTo === "string" ? req.body.whatsappTo : undefined,
            channels: Array.isArray(req.body?.channels) ? req.body.channels as SocialChannel[] : undefined,
            sendEmail: Boolean(req.body?.sendEmail),
            idempotencyKey: typeof req.body?.idempotencyKey === "string" ? req.body.idempotencyKey : undefined,
            autopilot: Boolean(req.body?.autopilot),
            campaignType: req.body?.campaignType === "catalog" || req.body?.campaignType === "event" ? req.body.campaignType : "manual",
            startsAt: typeof req.body?.startsAt === "string" ? req.body.startsAt : undefined,
            endsAt: typeof req.body?.endsAt === "string" ? req.body.endsAt : undefined,
            recurrenceHours: Number(req.body?.recurrenceHours || 24),
            youtubePrivacy: req.body?.youtubePrivacy === "unlisted" || req.body?.youtubePrivacy === "private" ? req.body.youtubePrivacy : "public",
        });
        res.json({ status: "success", data: result });
    } catch (error) {
        res.status(502).json({ status: "error", error: error instanceof Error ? error.message : "Unable to launch marketing campaign." });
    }
}

export async function marketingAutopilotRunNow(req: AuthenticatedRequest, res: Response) {
    try {
        res.json({ status: "success", data: await runMarketingAutopilot() });
    } catch (error) {
        console.error("Manual Marketing autopilot run failed:", error);
        res.status(503).json({ status: "error", error: error instanceof Error ? error.message : "Marketing autopilot failed." });
    }
}

export async function marketingCampaignHistory(req: AuthenticatedRequest, res: Response) {
    try {
        res.json({ status: "success", campaigns: await listMarketingCampaigns(String(req.user!.userId), Number(req.query.limit || 20)) });
    } catch (error) {
        res.status(500).json({ status: "error", error: error instanceof Error ? error.message : "Unable to load marketing campaign history." });
    }
}

export async function marketingPublicationActivity(req: AuthenticatedRequest, res: Response) {
    try {
        res.json({ status: "success", publications: await listMarketingPublicationActivity(String(req.user!.userId), Number(req.query.limit || 50)) });
    } catch (error) {
        res.status(500).json({ status: "error", error: error instanceof Error ? error.message : "Unable to load Marketing publication activity." });
    }
}

export async function socialPublish(req: AuthenticatedRequest, res: Response) {
    try {
        const channels = Array.isArray(req.body?.channels) ? req.body.channels as SocialChannel[] : [];
        const allowed: SocialChannel[] = ["facebook", "instagram", "whatsapp", "tiktok", "youtube", "pinterest"];
        const selected = channels.filter((channel): channel is SocialChannel => allowed.includes(channel));
        if (!selected.length) return res.status(400).json({ error: "Select at least one social channel." });
        const text = String(req.body?.text || "").trim();
        if (!text) return res.status(400).json({ error: "Publication text is required." });
        const userId = String(req.user!.userId);
        const idempotencyKey = String(req.body?.idempotencyKey || req.headers["x-idempotency-key"] || randomUUID()).trim();
        const result = await launchMarketingCampaign(userId, {
            name: typeof req.body?.campaignName === "string" && req.body.campaignName.trim() ? req.body.campaignName.trim() : `Manual Publication ${new Date().toISOString()}`,
            objective: "Manual publication",
            targetArea: typeof req.body?.targetArea === "string" && req.body.targetArea.trim() ? req.body.targetArea.trim() : "Marketing Center",
            message: text,
            subject: typeof req.body?.subject === "string" ? req.body.subject : undefined,
            imageUrl: typeof req.body?.imageUrl === "string" ? req.body.imageUrl : undefined,
            videoUrl: typeof req.body?.videoUrl === "string" ? req.body.videoUrl : undefined,
            link: typeof req.body?.link === "string" ? req.body.link : undefined,
            whatsappTo: typeof req.body?.whatsappTo === "string" ? req.body.whatsappTo : undefined,
            channels: selected,
            sendEmail: false,
            idempotencyKey,
            autopilot: false,
            campaignType: "manual",
            youtubePrivacy: req.body?.youtubePrivacy === "unlisted" || req.body?.youtubePrivacy === "private" ? req.body.youtubePrivacy : "public",
        });
        res.json({ status: "success", campaignId: result.campaignId, results: result.social, lifecycle: "RECORDED" });
    } catch (error) {
        res.status(502).json({ status: "error", error: error instanceof Error ? error.message : "Unable to publish social campaign." });
    }
}
export async function marketingLearning(req: AuthenticatedRequest, res: Response) {
    try {
        const targetArea = typeof req.query.targetArea === "string" ? req.query.targetArea : undefined;
        const objective = typeof req.query.objective === "string" ? req.query.objective : undefined;
        res.json({ status: "success", insights: await getMarketingLearning(targetArea, objective, String(req.user!.userId)) });
    } catch (error) {
        res.status(500).json({ status: "error", error: error instanceof Error ? error.message : "Unable to load marketing learning." });
    }
}

export async function marketingLearningFeedback(req: AuthenticatedRequest, res: Response) {
    try {
        const channel = String(req.body?.channel || "") as LearningChannel;
        const allowed: LearningChannel[] = ["facebook","instagram","whatsapp","tiktok","youtube","pinterest","email"];
        if (!allowed.includes(channel)) return res.status(400).json({ error: "Unsupported learning channel." });
        if (!req.body?.campaignId) return res.status(400).json({ error: "Campaign ID is required." });
        const result = await recordCampaignLearningFeedback({
            campaignId: String(req.body.campaignId),
            ownerUserId: String(req.user!.userId),
            channel,
            clicks: Number(req.body?.clicks || 0),
            sessions: Number(req.body?.sessions || 0),
            conversions: Number(req.body?.conversions || 0),
            revenue: Number(req.body?.revenue || 0),
            impressions: Number(req.body?.impressions || 0),
        });
        res.json({ status: "success", data: result });
    } catch (error) {
        res.status(500).json({ status: "error", error: error instanceof Error ? error.message : "Unable to record learning feedback." });
    }
}


export async function marketingAutopilotRun(req: Request, res: Response) {
    const expected = process.env.CRON_SECRET?.trim();
    const authorization = String(req.headers.authorization || "");
    if (!expected || authorization !== `Bearer ${expected}`) {
        return res.status(401).json({ error: "Unauthorized cron request." });
    }
    try {
        res.json(await runMarketingAutopilot());
    } catch (error) {
        console.error("Marketing autopilot run failed:", error);
        res.status(503).json({ error: error instanceof Error ? error.message : "Marketing autopilot failed." });
    }
}


export async function marketingDailySummary(req: AuthenticatedRequest, res: Response) {
    try {
        res.json({ status: "success", summary: await getMarketingDailySummary(String(req.user!.userId)) });
    } catch (error) {
        res.status(500).json({ status: "error", error: error instanceof Error ? error.message : "Unable to load daily Marketing summary." });
    }
}

export async function marketingDailySummaryCron(req: Request, res: Response) {
    const expected = process.env.CRON_SECRET?.trim();
    const authorization = String(req.headers.authorization || "");
    if (!expected || authorization !== `Bearer ${expected}`) {
        return res.status(401).json({ error: "Unauthorized cron request." });
    }
    try {
        res.json(await sendMarketingDailySummary());
    } catch (error) {
        console.error("Marketing daily summary failed:", error);
        res.status(503).json({ error: error instanceof Error ? error.message : "Marketing daily summary failed." });
    }
}


export async function marketingCatalogStatus(req: AuthenticatedRequest, res: Response) {
    try {
        res.json({ status: "success", catalog: await getContentAutopilotStatus(String(req.user!.userId)) });
    } catch (error) {
        console.error("Unable to load Content Autopilot status:", error);
        res.status(500).json({ status: "error", error: error instanceof Error ? error.message : "Unable to load Catalog Autopilot." });
    }
}

export async function marketingCatalogToggle(req: AuthenticatedRequest, res: Response) {
    try {
        const enabled = Boolean(req.body?.enabled);
        res.json({ status: "success", catalog: await setCatalogAutopilot(String(req.user!.userId), enabled) });
    } catch (error) {
        console.error("Unable to update Content Autopilot:", error);
        res.status(500).json({ status: "error", error: error instanceof Error ? error.message : "Unable to update Catalog Autopilot." });
    }
}
