import { randomUUID } from "crypto";
import { pool } from "../config/database";
import { getConnections, publishMeta, publishPinterest, publishTikTokPhoto, publishTikTokVideo, publishYouTube, type SocialChannel } from "./social-connections.service";
import { sendPromotion, type PromotionResult } from "./promotion.service";

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
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `);
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

    const campaignId = randomUUID();
    const social = selected.length
        ? await publishSocialCampaign(userId, selected, input)
        : {};

    let email: PromotionResult | undefined;
    if (input.sendEmail) {
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

    await ensureCampaignTable();
    await pool.query(
        `INSERT INTO marketing_campaigns (id, name, objective, target_area, message, subject, channels, results)
         VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb)`,
        [campaignId, name, objective, targetArea, message, input.subject?.trim() || name, JSON.stringify(selected), JSON.stringify({ social, email, google })]
    );

    return { campaignId, name, targetArea, objective, connectedChannels: connected, social, email, google };
};

export const listMarketingCampaigns = async (limit = 20) => {
    await ensureCampaignTable();
    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);
    const result = await pool.query(
        `SELECT id, name, objective, target_area, subject, channels, results, created_at
         FROM marketing_campaigns
         ORDER BY created_at DESC
         LIMIT $1`,
        [safeLimit]
    );
    return result.rows;
};
