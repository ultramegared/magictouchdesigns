import type { Request, Response } from "express";
import { disconnect, getConnectUrl, getConnections, handleCallback, isSocialProvider, publishMeta, type SocialChannel } from "../services/social-connections.service";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";

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

export async function socialPublish(req: AuthenticatedRequest, res: Response) {
    try {
        const channels = Array.isArray(req.body?.channels) ? req.body.channels as SocialChannel[] : [];
        const allowed: SocialChannel[] = ["facebook", "instagram", "whatsapp", "tiktok", "youtube", "pinterest"];
        const selected = channels.filter((channel): channel is SocialChannel => allowed.includes(channel));
        if (!selected.length) return res.status(400).json({ error: "Select at least one social channel." });
        const metaChannels = selected.filter(channel => ["facebook", "instagram", "whatsapp"].includes(channel));
        const results: Record<string, unknown> = metaChannels.length
            ? await publishMeta(String(req.user!.userId), metaChannels, String(req.body?.text || ""), req.body?.imageUrl, req.body?.link, req.body?.whatsappTo)
            : {};
        for (const channel of selected.filter(channel => !metaChannels.includes(channel))) results[channel] = { ok: false, error: `${channel} publishing requires its channel-specific media workflow.` };
        res.json({ results });
    } catch (error) { res.status(502).json({ error: error instanceof Error ? error.message : "Unable to publish social campaign." }); }
}