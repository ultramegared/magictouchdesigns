import type { Request, Response } from "express";
import { randomUUID } from "crypto";
import { disconnect, getConnectUrl, getConnections, handleCallback, isSocialProvider, verifySocialConnection, selectSocialAccount, publishMeta, publishPinterest, publishTikTokPhoto, publishTikTokVideo, publishYouTube, type SocialChannel } from "../services/social-connections.service";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";
import { launchMarketingCampaign, listMarketingCampaigns, deleteMarketingCampaign, listMarketingPublicationActivity, getMarketingLearning, runMarketingAutopilot, getMarketingCampaignResults } from "../services/marketing-campaign.service";
import { recordCampaignLearningFeedback, type LearningChannel } from "../services/marketing-learning.service";
import { getMarketingDailySummary, getMarketingAutopilotStatus, sendMarketingDailySummary } from "../services/marketing-autopilot.service";
import { getContentAutopilotStatus, setCatalogAutopilot } from "../services/marketing-catalog.service";
import { uploadImageAsset, uploadVideoAsset } from "../services/upload.service";
import cloudinary from "../config/cloudinary";

export async function marketingEmailStatus(req: AuthenticatedRequest, res: Response) {
    void req;
    const apiKeyConfigured = Boolean(process.env.RESEND_API_KEY?.trim());
    const fromEmail = (process.env.RESEND_FROM_EMAIL || "ventas@magictouchdesigns.com").trim();
    const fromName = (process.env.RESEND_FROM_NAME || "Magic Touch Designs").trim();
    res.json({
        status: "success",
        provider: "resend",
        configured: apiKeyConfigured,
        senderConfigured: Boolean(fromEmail),
        fromEmail,
        fromName,
        connected: false,
        verified: false,
        verificationNote: "Email credentials are configured for sending, but the Marketing UI does not claim provider connectivity until a real provider verification or successful test send is confirmed.",
    });
}

export async function socialConnections(req: AuthenticatedRequest, res: Response) {
    // Connection state changes immediately after OAuth; never replay a stale disconnected state.
    res.set({
        "Cache-Control": "no-store, no-cache, must-revalidate, private",
        "Pragma": "no-cache",
        "Expires": "0",
    });
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

export async function socialSelectAccount(req: AuthenticatedRequest, res: Response) {
    try {
        const provider = String(req.params.provider);
        const channel = String(req.body?.channel) as SocialChannel;
        const externalId = String(req.body?.externalId || "");
        if (!isSocialProvider(provider)) return res.status(400).json({ error: "Unsupported social provider." });
        const allowed: SocialChannel[] = ["facebook","instagram","whatsapp","tiktok","youtube","pinterest"];
        if (!allowed.includes(channel)) return res.status(400).json({ error: "Unsupported social channel." });
        const result = await selectSocialAccount(String(req.user!.userId), provider, channel, externalId);
        res.json({ status: "success", ...result });
    } catch (error) { res.status(400).json({ status: "error", error: error instanceof Error ? error.message : "Unable to select social account." }); }
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

export function marketingMediaSignature(req: AuthenticatedRequest, res: Response) {
    void req;
    try {
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
        const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
        const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
        if (!cloudName || !apiKey || !apiSecret) {
            return res.status(503).json({ status: "error", message: "Cloudinary media storage is not configured." });
        }

        const timestamp = Math.floor(Date.now() / 1000);
        const folder = "magic-touch-designs/promotions";
        const signature = cloudinary.utils.api_sign_request({ folder, timestamp }, apiSecret);
        return res.json({
            status: "success",
            cloudName,
            apiKey,
            timestamp,
            folder,
            signature,
        });
    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: error instanceof Error ? error.message : "Unable to prepare secure media upload.",
        });
    }
}

export async function marketingMediaUpload(req: AuthenticatedRequest, res: Response) {
    try {
        if (!req.file) {
            return res.status(400).json({ status: "error", message: "Marketing image or video file is required." });
        }

        if (req.file.mimetype.startsWith("video/")) {
            const asset = await uploadVideoAsset(req.file.buffer, "promotions");
            return res.status(200).json({
                status: "success",
                message: "Marketing video uploaded successfully.",
                media_type: "video",
                video_url: asset.videoUrl,
                url: asset.videoUrl,
                public_id: asset.publicId,
            });
        }

        const asset = await uploadImageAsset(req.file.buffer, "promotions");
        return res.status(200).json({
            status: "success",
            message: "Marketing image uploaded successfully.",
            media_type: "image",
            image_url: asset.imageUrl,
            url: asset.imageUrl,
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

export async function marketingGoogleAdsStatus(_req: AuthenticatedRequest, res: Response) {
    try {
        const { getGoogleAdsStatus } = await import("../services/google-ads.service");
        res.json(getGoogleAdsStatus());
    } catch (error) {
        res.status(500).json({ provider: "Google Ads", state: "ERROR", configured: false, connected: false, liveVerified: false, dataAvailable: false, error: error instanceof Error ? error.message : "Google Ads status failed." });
    }
}

export async function marketingGoogleAdsVerify(_req: AuthenticatedRequest, res: Response) {
    try {
        const { verifyGoogleAdsConfiguration } = await import("../services/google-ads.service");
        res.json(await verifyGoogleAdsConfiguration());
    } catch (error) {
        res.status(503).json({ provider: "Google Ads", state: "ERROR", configured: false, connected: false, liveVerified: false, dataAvailable: false, error: error instanceof Error ? error.message : "Google Ads verification failed." });
    }
}

export async function marketingAutopilotStatus(req: AuthenticatedRequest, res: Response) {
    try {
        res.json({ status: "success", data: await getMarketingAutopilotStatus(String(req.user!.userId)) });
    } catch (error) {
        res.status(500).json({ status: "error", error: error instanceof Error ? error.message : "Unable to load Marketing Autopilot status." });
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

export async function marketingCampaignDelete(req: AuthenticatedRequest, res: Response) {
    try {
        const campaignId = String(req.params.campaignId || "").trim();
        const deleted = await deleteMarketingCampaign(String(req.user!.userId), campaignId);
        if (!deleted) {
            return res.status(404).json({ status: "error", error: "Marketing campaign not found." });
        }
        return res.json({ status: "success", data: deleted });
    } catch (error) {
        console.error("Marketing campaign deletion failed:", error);
        return res.status(500).json({ status: "error", error: error instanceof Error ? error.message : "Unable to delete marketing campaign." });
    }
}

export async function marketingCampaignResults(req: AuthenticatedRequest, res: Response) {
    try {
        const days = Number(req.query.days || 30);
        res.json({ status: "success", results: await getMarketingCampaignResults(String(req.user!.userId), Number.isFinite(days) ? days : 30) });
    } catch (error) {
        res.status(500).json({ status: "error", error: error instanceof Error ? error.message : "Unable to load Marketing campaign results." });
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
