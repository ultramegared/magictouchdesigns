import { randomUUID } from "crypto";
import { pool } from "../config/database";
import { getConnections, publishMeta, publishPinterest, publishTikTokPhoto, publishTikTokVideo, publishYouTube, type SocialChannel } from "./social-connections.service";
import { sendPromotion, type PromotionResult } from "./promotion.service";
import { recordCampaignLaunchLearning, getMarketingLearningInsights } from "./marketing-learning.service";

export interface MarketingCampaignInput {
    name: string;
    objective?: string;
    targetArea?: string;
    message: string;
    subject?: string;
    imageUrl?: string;
    videoUrl?: string;
    link?: string;
    whatsappTo?: string;
    channels?: SocialChannel[];
    sendEmail?: boolean;
    idempotencyKey?: string;
    autopilot?: boolean;
}

export interface MarketingCampaignResult {
    campaignId: string;
    name: string;
    targetArea: string;
    objective: string;
    connectedChannels: SocialChannel[];
    social: Record<string, unknown>;
    email?: PromotionResult;
    google: {
        status: "tracking_only";
        message: string;
        focus: string[];
    };
}

const allowedChannels: SocialChannel[] = ["facebook", "instagram", "whatsapp", "tiktok", "youtube", "pinterest"];

const ensureCampaignTable = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS marketing_campaigns (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            objective TEXT NOT NULL,
            target_area TEXT NOT NULL,
            message TEXT NOT NULL,
            subject TEXT,
            channels JSONB NOT NULL DEFAULT '[]'::jsonb,
            results JSONB NOT NULL DEFAULT '{}'::jsonb,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            idempotency_key TEXT UNIQUE,
            owner_user_id TEXT,
            autopilot_enabled BOOLEAN NOT NULL DEFAULT FALSE,
            next_run_at TIMESTAMPTZ,
            last_run_at TIMESTAMPTZ,
            run_count INTEGER NOT NULL DEFAULT 0
        )
    `);
    await pool.query(`ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS idempotency_key TEXT`);
    await pool.query(`ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS owner_user_id TEXT`);
    await pool.query(`ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS autopilot_enabled BOOLEAN NOT NULL DEFAULT FALSE`);
    await pool.query(`ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS next_run_at TIMESTAMPTZ`);
    await pool.query(`ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS last_run_at TIMESTAMPTZ`);
    await pool.query(`ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS run_count INTEGER NOT NULL DEFAULT 0`);
    await pool.query(`CREATE INDEX IF NOT EXISTS marketing_campaigns_autopilot_idx ON marketing_campaigns(autopilot_enabled, next_run_at)`);
    await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS marketing_campaigns_idempotency_idx ON marketing_campaigns(idempotency_key) WHERE idempotency_key IS NOT NULL`);
    await pool.query(`CREATE INDEX IF NOT EXISTS marketing_campaigns_created_at_idx ON marketing_campaigns(created_at DESC)`);
};

const connectedSocialChannels = async (userId: string): Promise<SocialChannel[]> => {
    const state = await getConnections(userId);
    return allowedChannels.filter(channel => Boolean(state.channels?.[channel]));
};

const publishSocialCampaign = async (
    userId: string,
    channels: SocialChannel[],
    input: MarketingCampaignInput
): Promise<Record<string, unknown>> => {
    const results: Record<string, unknown> = {};
    const metaChannels = channels.filter(channel => ["facebook", "instagram", "whatsapp"].includes(channel));
    if (metaChannels.length) {
        Object.assign(
            results,
            await publishMeta(userId, metaChannels, input.message.trim(), input.imageUrl?.trim() || undefined, input.link?.trim() || undefined, input.whatsappTo?.trim() || undefined, input.videoUrl?.trim() || undefined)
        );
    }
    if (channels.includes("pinterest")) {
        try {
            results.pinterest = await publishPinterest(userId, input.message.trim(), input.imageUrl?.trim() || undefined, input.link?.trim() || undefined);
        } catch (error) {
            results.pinterest = { ok: false, error: error instanceof Error ? error.message : "Pinterest publication failed." };
        }
    }
    if (channels.includes("tiktok")) {
        try {
            results.tiktok = input.videoUrl
                ? await publishTikTokVideo(userId, input.message.trim(), input.videoUrl.trim())
                : await publishTikTokPhoto(userId, input.message.trim(), input.imageUrl?.trim());
        } catch (error) {
            results.tiktok = { ok: false, error: error instanceof Error ? error.message : "TikTok publication failed." };
        }
    }
    if (channels.includes("youtube")) {
        try {
            results.youtube = await publishYouTube(userId, input.message.trim(), input.videoUrl?.trim(), input.link?.trim());
        } catch (error) {
            results.youtube = { ok: false, error: error instanceof Error ? error.message : "YouTube publication failed." };
        }
    }
    return results;
};

const withCampaignTracking = (url: string | undefined, campaignId: string, source: string) => {
    if (!url) return undefined;
    try {
        const parsed = new URL(url);
        parsed.searchParams.set("utm_id", campaignId);
        parsed.searchParams.set("utm_campaign", campaignId);
        parsed.searchParams.set("utm_source", source);
        parsed.searchParams.set("utm_medium", "organic");
        return parsed.toString();
    } catch { return url; }
};

const seoFocus = (targetArea: string) => [
    `custom mugs ${targetArea}`,
    `personalized mugs ${targetArea}`,
    `custom gifts ${targetArea}`,
    "personalized gifts",
    "custom mugs",
    "custom tumblers",
];

export const launchMarketingCampaign = async (userId: string, input: MarketingCampaignInput): Promise<MarketingCampaignResult> => {
    const name = input.name.trim();
    const message = input.message.trim();
    if (!name) throw new Error("Campaign name is required.");
    if (!message) throw new Error("Campaign message is required.");

    const targetArea = input.targetArea?.trim() || "Houston, Texas + United States";
    const objective = input.objective?.trim() || "Brand awareness and sales";
    const connected = await connectedSocialChannels(userId);
    const requested = Array.isArray(input.channels) && input.channels.length
        ? input.channels.filter(channel => allowedChannels.includes(channel))
        : connected;
    const selected = requested.filter(channel => connected.includes(channel));

    if (!selected.length && !input.sendEmail) {
        throw new Error("Connect at least one social channel or enable Email Campaign.");
    }

    const idempotencyKey = input.idempotencyKey?.trim() || undefined;
    if (idempotencyKey) {
        await ensureCampaignTable();
        const existing = await pool.query(`SELECT id, name, objective, target_area, channels, results FROM marketing_campaigns WHERE idempotency_key = $1 LIMIT 1`, [idempotencyKey]);
        if (existing.rows[0]) {
            const row = existing.rows[0];
            const previous = row.results || {};
            return {
                campaignId: row.id,
                name: row.name,
                targetArea: row.target_area,
                objective: row.objective,
                connectedChannels: connected,
                social: previous.social || {},
                email: previous.email,
                google: previous.google || { status: "tracking_only", message: "Campaign already launched.", focus: seoFocus(targetArea) },
            };
        }
    }

    const campaignId = randomUUID();
    const trackedLink = withCampaignTracking(input.link?.trim() || undefined, campaignId, "jqydesigns");
    const socialInput: MarketingCampaignInput = { ...input, link: trackedLink };
    const social = selected.length && !input.autopilot
        ? await publishSocialCampaign(userId, selected, socialInput)
        : {};

    let email: PromotionResult | undefined;
    if (input.sendEmail && !input.autopilot) {
        email = await sendPromotion({
            subject: input.subject?.trim() || name,
            message,
            imageUrl: input.imageUrl?.trim() || undefined,
        });
    }

    const google = {
        status: "tracking_only" as const,
        message: "Google Search Console and Analytics are used to measure discovery and search performance. They do not provide an API that can guarantee or directly force higher organic rankings.",
        focus: seoFocus(targetArea),
    };

    if (!input.autopilot) await recordCampaignLaunchLearning({
        campaignId,
        channels: [...selected, ...(input.sendEmail ? ["email" as const] : [])],
        objective,
        targetArea,
        hasImage: Boolean(input.imageUrl?.trim()),
        hasVideo: Boolean(input.videoUrl?.trim()),
        results: { ...social, ...(email ? { email: { ok: true } } : {}) },
    });

    await ensureCampaignTable();
    await pool.query(
        `INSERT INTO marketing_campaigns (id, name, objective, target_area, message, subject, channels, results, idempotency_key, owner_user_id, autopilot_enabled, next_run_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9,$10,$11,$12)`,
        [campaignId, name, objective, targetArea, message, input.subject?.trim() || name, JSON.stringify(selected), JSON.stringify({
            social,
            email,
            google,
            assets: {
                imageUrl: input.imageUrl?.trim() || undefined,
                videoUrl: input.videoUrl?.trim() || undefined,
                landingLink: input.link?.trim() || undefined,
            },
            autopilot: input.autopilot ? { enabled: true, queued: true } : undefined,
        }), idempotencyKey, userId, Boolean(input.autopilot), input.autopilot ? new Date(Date.now() + 60 * 60 * 1000) : null]
    );

    return { campaignId, name, targetArea, objective, connectedChannels: connected, social, email, google };
};

export const getMarketingLearning = async (targetArea?: string, objective?: string) => getMarketingLearningInsights(targetArea, objective);

export const listMarketingCampaigns = async (limit = 20) => {
    await ensureCampaignTable();
    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);
    const result = await pool.query(
        `SELECT id, name, objective, target_area, subject, channels, results, created_at, autopilot_enabled, next_run_at, last_run_at, run_count
         FROM marketing_campaigns
         ORDER BY created_at DESC
         LIMIT $1`,
        [safeLimit]
    );
    return result.rows;
};


export const runMarketingAutopilot = async () => {
    await ensureCampaignTable();
    const due = await pool.query(`
        SELECT *
        FROM marketing_campaigns
        WHERE autopilot_enabled = TRUE
          AND next_run_at IS NOT NULL
          AND next_run_at <= NOW()
        ORDER BY next_run_at ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
    `);
    if (!due.rows[0]) return { ran: false, reason: "No campaign is due." };

    const campaign = due.rows[0];
    const userId = String(campaign.owner_user_id || "");
    if (!userId) {
        await pool.query(`UPDATE marketing_campaigns SET autopilot_enabled=FALSE, results=results || $2::jsonb WHERE id=$1`, [campaign.id, JSON.stringify({ autopilot: { error: "Campaign has no owner." } })]);
        return { ran: false, reason: "Campaign has no owner." };
    }

    const connected = await connectedSocialChannels(userId);
    const configuredChannels = Array.isArray(campaign.channels) ? campaign.channels.filter((x: any) => allowedChannels.includes(x)) : [];
    const eligible = configuredChannels.filter((channel: SocialChannel) => connected.includes(channel));
    if (!eligible.length) {
        await pool.query(`UPDATE marketing_campaigns SET next_run_at = NOW() + INTERVAL '6 hours' WHERE id=$1`, [campaign.id]);
        return { ran: false, reason: "No selected channel is currently connected.", campaignId: campaign.id };
    }

    const recent = await pool.query(
        `SELECT channel FROM marketing_learning_observations WHERE campaign_id=$1 AND updated_at >= NOW() - INTERVAL '24 hours'`,
        [campaign.id]
    );
    const recentlyUsed = new Set(recent.rows.map((r: any) => String(r.channel)));
    const insights = await getMarketingLearningInsights(campaign.target_area, campaign.objective);
    const score = new Map(insights.map((r: any) => [r.channel, Number(r.score || 0)]));
    const ranked = eligible.slice().sort((a, b) => {
        const aRecent = recentlyUsed.has(a) ? 1 : 0;
        const bRecent = recentlyUsed.has(b) ? 1 : 0;
        if (aRecent !== bRecent) return aRecent - bRecent;
        return (score.get(b) || 0) - (score.get(a) || 0);
    });
    const channel = ranked[0];
    const source = channel;
    const trackedLink = withCampaignTracking(campaign.results?.google?.landingLink || undefined, campaign.id, source);
    const input: MarketingCampaignInput = {
        name: campaign.name,
        objective: campaign.objective,
        targetArea: campaign.target_area,
        message: campaign.message,
        subject: campaign.subject,
        channels: [channel],
        imageUrl: campaign.results?.assets?.imageUrl,
        videoUrl: campaign.results?.assets?.videoUrl,
        link: trackedLink,
    };
    const social = await publishSocialCampaign(userId, [channel], input);
    await recordCampaignLaunchLearning({
        campaignId: campaign.id,
        channels: [channel],
        objective: campaign.objective,
        targetArea: campaign.target_area,
        hasImage: Boolean(input.imageUrl),
        hasVideo: Boolean(input.videoUrl),
        results: social,
    });

    const nextRun = new Date(Date.now() + 60 * 60 * 1000);
    const mergedResults = {
        ...(campaign.results || {}),
        autopilot: { lastChannel: channel, lastRunAt: new Date().toISOString(), runCount: Number(campaign.run_count || 0) + 1, result: social },
    };
    await pool.query(
        `UPDATE marketing_campaigns
         SET results=$2::jsonb, last_run_at=NOW(), next_run_at=$3, run_count=run_count+1
         WHERE id=$1`,
        [campaign.id, JSON.stringify(mergedResults), nextRun]
    );
    return { ran: true, campaignId: campaign.id, channel, social, nextRunAt: nextRun.toISOString() };
};
