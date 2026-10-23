import { randomUUID } from "crypto";
import { pool } from "../config/database";
import { getConnections, checkTikTokPublicationStatus, checkYouTubePublicationStatus, publishMeta, publishInstagram, publishPinterest, publishTikTokPhoto, publishTikTokVideo, publishYouTube, type SocialChannel } from "./social-connections.service";
import { sendPromotion, type PromotionResult } from "./promotion.service";
import { recordCampaignLaunchLearning, getMarketingLearningInsights } from "./marketing-learning.service";
import { getCatalogOwners, queueNextContent } from "./marketing-catalog.service";

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
    campaignType?: "manual" | "catalog" | "event";
    startsAt?: string;
    endsAt?: string;
    recurrenceHours?: number;
    youtubePrivacy?: "public" | "unlisted" | "private";
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
            run_count INTEGER NOT NULL DEFAULT 0,
            campaign_type TEXT NOT NULL DEFAULT 'manual',
            starts_at TIMESTAMPTZ,
            ends_at TIMESTAMPTZ,
            recurrence_hours INTEGER NOT NULL DEFAULT 24
        )
    `);
    await pool.query(`ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS idempotency_key TEXT`);
    await pool.query(`ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS owner_user_id TEXT`);
    await pool.query(`ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS autopilot_enabled BOOLEAN NOT NULL DEFAULT FALSE`);
    await pool.query(`ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS next_run_at TIMESTAMPTZ`);
    await pool.query(`ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS last_run_at TIMESTAMPTZ`);
    await pool.query(`ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS run_count INTEGER NOT NULL DEFAULT 0`);
    await pool.query(`ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS campaign_type TEXT NOT NULL DEFAULT 'manual'`);
    await pool.query(`ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ`);
    await pool.query(`ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS ends_at TIMESTAMPTZ`);
    await pool.query(`ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS recurrence_hours INTEGER NOT NULL DEFAULT 24`);
    await pool.query(`ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS claim_token TEXT`);
    await pool.query(`ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS claim_expires_at TIMESTAMPTZ`);
    await pool.query(`CREATE INDEX IF NOT EXISTS marketing_campaigns_claim_idx ON marketing_campaigns(autopilot_enabled, claim_expires_at)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS marketing_campaigns_autopilot_idx ON marketing_campaigns(autopilot_enabled, next_run_at)`);
    await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS marketing_campaigns_idempotency_idx ON marketing_campaigns(idempotency_key) WHERE idempotency_key IS NOT NULL`);
    await pool.query(`CREATE INDEX IF NOT EXISTS marketing_campaigns_created_at_idx ON marketing_campaigns(created_at DESC)`);
    await pool.query(`CREATE TABLE IF NOT EXISTS marketing_campaign_runs (
            id BIGSERIAL PRIMARY KEY,
            campaign_id TEXT NOT NULL,
            channel TEXT NOT NULL,
            run_type TEXT NOT NULL DEFAULT 'campaign',
            published BOOLEAN NOT NULL DEFAULT FALSE,
            result JSONB NOT NULL DEFAULT '{}'::jsonb,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )`);
    await pool.query(`ALTER TABLE marketing_campaign_runs ADD COLUMN IF NOT EXISTS owner_user_id TEXT`);
    await pool.query(`ALTER TABLE marketing_campaign_runs ADD COLUMN IF NOT EXISTS run_token TEXT`);
    await pool.query(`ALTER TABLE marketing_campaign_runs ADD COLUMN IF NOT EXISTS publication_key TEXT`);
    await pool.query(`ALTER TABLE marketing_campaign_runs ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'FAILED'`);
    await pool.query(`ALTER TABLE marketing_campaign_runs ADD COLUMN IF NOT EXISTS external_id TEXT`);
    await pool.query(`ALTER TABLE marketing_campaign_runs ADD COLUMN IF NOT EXISTS external_url TEXT`);
    await pool.query(`ALTER TABLE marketing_campaign_runs ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ`);
    await pool.query(`ALTER TABLE marketing_campaign_runs ADD COLUMN IF NOT EXISTS decision JSONB NOT NULL DEFAULT '{}'::jsonb`);
    await pool.query(`ALTER TABLE marketing_campaign_runs ADD COLUMN IF NOT EXISTS requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`);
    await pool.query(`ALTER TABLE marketing_campaign_runs ADD COLUMN IF NOT EXISTS provider_status TEXT`);
    await pool.query(`ALTER TABLE marketing_campaign_runs ADD COLUMN IF NOT EXISTS internal_status TEXT`);
    await pool.query(`ALTER TABLE marketing_campaign_runs ADD COLUMN IF NOT EXISTS last_checked_at TIMESTAMPTZ`);
    await pool.query(`ALTER TABLE marketing_campaign_runs ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0`);
    await pool.query(`ALTER TABLE marketing_campaign_runs ADD COLUMN IF NOT EXISTS error TEXT`);
    await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS marketing_campaign_runs_publication_key_idx ON marketing_campaign_runs(publication_key) WHERE publication_key IS NOT NULL`);
    await pool.query(`CREATE INDEX IF NOT EXISTS marketing_campaign_runs_owner_idx ON marketing_campaign_runs(owner_user_id, created_at DESC)`);
    // Normalize active Marketing Autopilot campaigns to the requested 12-hour cadence.
    // This is scoped to marketing campaigns only and does not publish anything by itself.
    await pool.query(`UPDATE marketing_campaigns SET recurrence_hours=12 WHERE autopilot_enabled=TRUE AND recurrence_hours <> 12`);
    await pool.query(`UPDATE marketing_campaigns SET next_run_at=NOW() + INTERVAL '12 hours' WHERE autopilot_enabled=TRUE AND next_run_at IS NOT NULL AND next_run_at > NOW() + INTERVAL '12 hours' AND (starts_at IS NULL OR starts_at <= NOW())`);
    await pool.query(`CREATE INDEX IF NOT EXISTS marketing_campaign_runs_campaign_idx ON marketing_campaign_runs(campaign_id, created_at DESC)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS marketing_campaign_runs_created_idx ON marketing_campaign_runs(created_at DESC)`);
};

const connectedSocialChannels = async (userId: string): Promise<SocialChannel[]> => {
    const state = await getConnections(userId);
    return allowedChannels.filter(channel => Boolean(state.channels?.[channel]));
};

// Keep price details out of social captions while preserving useful numbers such as
// product sizes, dates, and model names. This applies only at the social publishing
// boundary; catalog prices and the original campaign record remain unchanged.
const sanitizeSocialCaption = (message: string): string => {
    const pricePattern = /(?:\$\s?\d+(?:[.,]\d{1,2})?|\bUSD\s?\d+(?:[.,]\d{1,2})?|\b\d+(?:[.,]\d{1,2})?\s?(?:USD|dollars?)\b|\b(?:price|priced at|only)\s*:?\s*\$?\s?\d+(?:[.,]\d{1,2})?\b)/i;
    return message
        .replace(/\*{1,3}/g, "")
        .split(/(?<=[.!?])\s+|\n+/)
        .filter(part => !pricePattern.test(part))
        .filter(part => !/\[object Object\]|design details:|^details:/i.test(part))
        .filter(part => !/^(?:ceramic mug|dishwasher and microwave safe|features?:)/i.test(part.trim()))
        .join("\n\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
};

const generateAutopilotCaption = async (productName: string, imageUrl?: string): Promise<string> => {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) throw new Error("OPENAI_API_KEY is required for image-aware autopilot captions.");
    const name = productName.replace(/\s+/g, " ").trim() || "Personalized design";
    const content: any[] = [{
        type: "input_text",
        text: [
            "Write a fresh, professional, inviting English social media caption for JQYDesigns based on the attached product image and product name.",
            "Inspect the image to understand the visual design and personalize the caption to what is visibly shown. Use the product name as the only product metadata.",
            "Do not mention product descriptions, features, materials, sizes, care instructions, options, prices, or any details not clearly visible in the image.",
            "Do not output Markdown formatting, headings, explanations, or labels. Never output [object Object].",
            "Invite people to shop or request a custom design. Include this URL exactly: https://www.jqydesigns.com/",
            "Finish with a small set of relevant hashtags including #JQYDesigns.",
            "Return only the final caption, ready to publish.",
            `Product name: ${name}`
        ].join("\n")
    }];
    if (imageUrl && /^https:\/\//i.test(imageUrl)) content.push({ type: "input_image", image_url: imageUrl, detail: "high" });
    const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
            model: process.env.MARKETING_CAPTION_MODEL?.trim() || "gpt-4.1-mini",
            input: [{ role: "user", content }],
            max_output_tokens: 350
        }),
    });
    if (!response.ok) {
        // Preserve actionable provider diagnostics without ever logging credentials or request headers.
        const rawError = await response.text().catch(() => "");
        let providerError: any = {};
        try {
            providerError = rawError ? JSON.parse(rawError) : {};
        } catch {
            providerError = {};
        }
        const details = providerError?.error || providerError;
        const errorCode = typeof details?.code === "string" ? details.code : "unknown_code";
        const errorType = typeof details?.type === "string" ? details.type : "unknown_type";
        const errorMessage = typeof details?.message === "string"
            ? details.message.replace(/\\s+/g, " ").slice(0, 500)
            : rawError.replace(/\\s+/g, " ").slice(0, 500);
        console.error("[marketing-autopilot] OpenAI caption request failed", {
            httpStatus: response.status,
            code: errorCode,
            type: errorType,
            message: errorMessage || "No provider error message returned",
            model: process.env.MARKETING_CAPTION_MODEL?.trim() || "gpt-4.1-mini",
        });
        throw new Error(`Caption generation failed (OpenAI HTTP ${response.status}; ${errorCode}; ${errorType}): ${errorMessage || "No provider error message returned"}`);
    }
    const payload: any = await response.json();
    const generated = typeof payload.output_text === "string" ? payload.output_text.trim() : "";
    if (!generated || /\[object Object\]/i.test(generated)) {
        console.error("[marketing-autopilot] Caption validation failed", {
            hasOutput: Boolean(generated),
            containsObjectPlaceholder: /\[object Object\]/i.test(generated),
            reason: !generated ? "empty_output" : "object_placeholder",
        });
        throw new Error("Generated caption failed content validation: empty or invalid output.");
    }

    // Models may omit "www" or return the same domain with a different URL form.
    // Canonicalize the shop URL instead of discarding an otherwise usable caption.
    let caption = sanitizeSocialCaption(generated).replace(
        /https?:\/\/(?:www\.)?jqydesigns\.com\/?/gi,
        "https://www.jqydesigns.com/",
    );
    if (!caption.includes("https://www.jqydesigns.com/")) {
        caption = caption ? `${caption}\n\nShop or request a custom design: https://www.jqydesigns.com/`
            : "Shop or request a custom design: https://www.jqydesigns.com/";
    }
    if (!caption.trim() || /\[object Object\]/i.test(caption)) {
        throw new Error("Generated caption failed content validation after sanitization.");
    }
    return caption;
};

const publishSocialCampaign = async (
    userId: string,
    channels: SocialChannel[],
    input: MarketingCampaignInput,
    campaignId: string,
): Promise<Record<string, unknown>> => {
    const results: Record<string, unknown> = {};
    const socialCaption = sanitizeSocialCaption(input.message.trim());
    const metaChannels = channels.filter(channel => ["facebook", "whatsapp"].includes(channel));
    for (const channel of metaChannels) {
        Object.assign(
            results,
            await publishMeta(userId, [channel], socialCaption, input.imageUrl?.trim() || undefined, withCampaignTracking(input.link?.trim(), campaignId, channel), input.whatsappTo?.trim() || undefined, input.videoUrl?.trim() || undefined)
        );
    }
    if (channels.includes("instagram")) {
        try {
            results.instagram = await publishInstagram(userId, socialCaption, input.imageUrl?.trim() || undefined, input.videoUrl?.trim() || undefined, withCampaignTracking(input.link?.trim(), campaignId, "instagram"));
        } catch (error) {
            results.instagram = { ok: false, error: error instanceof Error ? error.message : "Instagram publication failed." };
        }
    }
    if (channels.includes("pinterest")) {
        try {
            results.pinterest = await publishPinterest(userId, socialCaption, input.imageUrl?.trim() || undefined, withCampaignTracking(input.link?.trim(), campaignId, "pinterest"));
        } catch (error) {
            results.pinterest = { ok: false, error: error instanceof Error ? error.message : "Pinterest publication failed." };
        }
    }
    if (channels.includes("tiktok")) {
        try {
            results.tiktok = input.videoUrl
                ? await publishTikTokVideo(userId, socialCaption, input.videoUrl.trim())
                : await publishTikTokPhoto(userId, socialCaption, input.imageUrl?.trim());
        } catch (error) {
            results.tiktok = { ok: false, error: error instanceof Error ? error.message : "TikTok publication failed." };
        }
    }
    if (channels.includes("youtube")) {
        try {
            results.youtube = await publishYouTube(userId, socialCaption, input.videoUrl?.trim(), withCampaignTracking(input.link?.trim(), campaignId, "youtube"), input.youtubePrivacy || "public");
        } catch (error) {
            results.youtube = { ok: false, error: error instanceof Error ? error.message : "YouTube publication failed." };
        }
    }
    return results;
};

const recordCampaignRuns = async (
    campaignId: string,
    ownerUserId: string,
    results: Record<string, unknown>,
    runType: "campaign" | "autopilot",
    runToken: string,
) => {
    const entries = Object.entries(results);
    const runIds: Record<string, number> = {};
    for (const [channel, result] of entries) {
        const payload = result as any;
        const status = payload?.status === "PROCESSING" || payload?.status === "QUEUED"
            ? "PROCESSING"
            : payload?.ok
                ? "PUBLISHED"
                : "FAILED";
        const published = status === "PUBLISHED";
        const externalId = payload?.id ? String(payload.id) : null;
        const externalUrl = typeof payload?.url === "string" ? payload.url : null;
        const providerStatus = payload?.status ? String(payload.status) : status;
        const internalStatus = status;
        const providerError = payload?.error ? String(payload.error) : null;
        const publicationKey = `${campaignId}:${runToken}:${channel}`;
        const inserted = await pool.query(
            `INSERT INTO marketing_campaign_runs
                (campaign_id, owner_user_id, channel, run_type, run_token, publication_key, status, internal_status, provider_status, published, requested_at, external_id, external_url, published_at, error, last_checked_at, decision, result)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW(),$11,$12,$13,$14,$15,$16::jsonb,$17::jsonb)
             ON CONFLICT (publication_key) WHERE publication_key IS NOT NULL DO UPDATE SET result=EXCLUDED.result, status=EXCLUDED.status,
                 internal_status=EXCLUDED.internal_status, provider_status=EXCLUDED.provider_status,
                 published=EXCLUDED.published, external_id=EXCLUDED.external_id, external_url=EXCLUDED.external_url,
                 published_at=EXCLUDED.published_at, error=EXCLUDED.error, last_checked_at=EXCLUDED.last_checked_at
             RETURNING id`,
            [
                campaignId, ownerUserId, channel, runType, runToken, publicationKey, status, internalStatus, providerStatus, published,
                externalId, externalUrl, published ? new Date() : null, providerError, null,
                JSON.stringify({ stage: "PUBLICATION", channel, status, providerStatus, runToken }),
                JSON.stringify(payload || {}),
            ]
        );
        runIds[channel] = Number(inserted.rows[0]?.id);
    }
    return runIds;
};

const withCampaignTracking = (url: string | undefined, campaignId: string, source: string) => {
    if (!url) return undefined;
    try {
        const parsed = new URL(url);
        parsed.searchParams.set("utm_id", campaignId);
        parsed.searchParams.set("utm_campaign", campaignId);
        const normalizedSource = source.trim().toLowerCase() || "jqydesigns";
        const medium = normalizedSource === "email" ? "email" : normalizedSource === "google" ? "organic_search" : "social";
        parsed.searchParams.set("utm_source", normalizedSource);
        parsed.searchParams.set("utm_medium", medium);
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
    const campaignType = input.campaignType || "manual";
    const requestedRecurrenceHours = Number(input.recurrenceHours) || 12;
    // Twice-daily publishing is the default. The learning engine may prefer a better slot
    // only when real attributed observations support that decision.
    const recurrenceHours = Math.min(Math.max(requestedRecurrenceHours, 12), 12);
    const startsAt = input.startsAt ? new Date(input.startsAt) : null;
    const endsAt = input.endsAt ? new Date(input.endsAt) : null;
    if (startsAt && Number.isNaN(startsAt.getTime())) throw new Error("Invalid campaign start date.");
    if (endsAt && Number.isNaN(endsAt.getTime())) throw new Error("Invalid campaign end date.");
    if (startsAt && endsAt && endsAt <= startsAt) throw new Error("Campaign end must be after campaign start.");
    const connected = await connectedSocialChannels(userId);
    const requested = Array.isArray(input.channels) && input.channels.length
        ? input.channels.filter(channel => allowedChannels.includes(channel))
        : connected;
    const selected = requested.filter(channel => connected.includes(channel));

    if (!selected.length && !input.sendEmail) {
        throw new Error("Connect at least one social channel or enable Email Campaign.");
    }

    if (selected.includes("youtube") && !input.videoUrl?.trim()) {
        throw new Error("YouTube campaigns require a hosted video URL. Upload the video creative before launching.");
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

    await ensureCampaignTable();

    const campaignId = randomUUID();
    const firstRunAt = startsAt && startsAt > new Date() ? startsAt : new Date();
    const trackedLink = withCampaignTracking(input.link?.trim() || undefined, campaignId, "campaign");
    const socialInput: MarketingCampaignInput = { ...input, link: trackedLink };

    const google = {
        status: "tracking_only" as const,
        message: "Google Search Console and Analytics are used to measure discovery and search performance. They do not provide an API that can guarantee or directly force higher organic rankings.",
        focus: seoFocus(targetArea),
    };

    const initialResults = {
        social: {},
        email: undefined,
        google,
        assets: {
            imageUrl: input.imageUrl?.trim() || undefined,
            videoUrl: input.videoUrl?.trim() || undefined,
            landingLink: trackedLink,
        },
        campaignType,
        sendEmail: Boolean(input.sendEmail),
        schedule: {
            startsAt: startsAt?.toISOString(),
            endsAt: endsAt?.toISOString(),
            recurrenceHours,
        },
        autopilot: input.autopilot ? { enabled: true, queued: true } : undefined,
        lifecycle: { stage: "DECISION", status: "QUEUED", createdAt: new Date().toISOString() },
    };

    // Create the campaign record before contacting external providers. This gives every
    // manual/autopilot publication a durable owner, idempotency key and audit trail even
    // when a provider or the process fails after the campaign has been accepted.
    const insertedCampaign = await pool.query(
        `INSERT INTO marketing_campaigns (id, name, objective, target_area, message, subject, channels, results, idempotency_key, owner_user_id, autopilot_enabled, next_run_at, campaign_type, starts_at, ends_at, recurrence_hours)
         VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9,$10,$11,$12,$13,$14,$15,$16)
         ON CONFLICT (idempotency_key) DO NOTHING
         RETURNING id`,
        [campaignId, name, objective, targetArea, message, input.subject?.trim() || name, JSON.stringify(selected), JSON.stringify(initialResults), idempotencyKey, userId, Boolean(input.autopilot), input.autopilot ? firstRunAt : null, campaignType, startsAt, endsAt, recurrenceHours]
    );

    // Two rapid requests can pass the initial lookup before either insert commits.
    // The unique idempotency index is the final authority: the losing request must
    // return the already-created campaign instead of creating a duplicate or failing.
    if (!insertedCampaign.rows[0] && idempotencyKey) {
        const existing = await pool.query(
            `SELECT id, name, objective, target_area, channels, results
             FROM marketing_campaigns
             WHERE idempotency_key = $1
             LIMIT 1`,
            [idempotencyKey]
        );
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
        throw new Error("Campaign submission was already accepted but could not be recovered safely. Please refresh Campaign History before retrying.");
    }

    let social: Record<string, unknown> = {};
    let email: PromotionResult | undefined;
    let publishError: string | undefined;

    if (selected.length && !input.autopilot) {
        try {
            social = await publishSocialCampaign(userId, selected, socialInput, campaignId);
        } catch (error) {
            publishError = error instanceof Error ? error.message : "Social publication failed.";
        }
    }

    if (input.sendEmail && !input.autopilot) {
        try {
            email = await sendPromotion({
                subject: input.subject?.trim() || name,
                message,
                imageUrl: input.imageUrl?.trim() || undefined,
            });
        } catch (error) {
            social.email = { ok: false, error: error instanceof Error ? error.message : "Email promotion failed." };
        }
    }

    const finalResults = {
        ...initialResults,
        social,
        email: email ? { ok: true, totalRecipients: email.totalRecipients } : (social.email || undefined),
        lifecycle: {
            stage: input.autopilot ? "DECISION" : "PUBLICATION",
            status: input.autopilot ? "QUEUED" : (publishError ? "ERROR" : "RECORDED"),
            updatedAt: new Date().toISOString(),
            ...(publishError ? { error: publishError } : {}),
        },
    };

    await pool.query(
        `UPDATE marketing_campaigns SET results=$2::jsonb WHERE id=$1`,
        [campaignId, JSON.stringify(finalResults)]
    );

    if (!input.autopilot) {
        const publicationResults = { ...social, ...(email ? { email: { ok: true, totalRecipients: email.totalRecipients } } : {}) };
        const runIds = await recordCampaignRuns(campaignId, userId, publicationResults, "campaign", randomUUID());
        await recordCampaignLaunchLearning({
            campaignId,
            runIds,
            channels: [...selected, ...(input.sendEmail ? ["email" as const] : [])],
            objective,
            targetArea,
            hasImage: Boolean(input.imageUrl?.trim()),
            hasVideo: Boolean(input.videoUrl?.trim()),
            results: publicationResults,
        });
    }

    return { campaignId, name, targetArea, objective, connectedChannels: connected, social, email, google };

};


export const retryMarketingCampaign = async (userId: string, campaignId: string) => {
    await ensureCampaignTable();
    const campaignResult = await pool.query(
        `SELECT id, name, objective, target_area, message, subject, channels, results, autopilot_enabled
         FROM marketing_campaigns
         WHERE id=$1 AND owner_user_id=$2
         LIMIT 1`,
        [campaignId, userId]
    );
    if (!campaignResult.rows[0]) throw new Error("Campaign not found.");
    const campaign = campaignResult.rows[0] as any;
    if (Boolean(campaign.autopilot_enabled)) throw new Error("Autopilot campaigns are not manually retried from this action.");

    const existingRuns = await pool.query(
        `SELECT published, internal_status
         FROM marketing_campaign_runs
         WHERE campaign_id=$1 AND owner_user_id=$2`,
        [campaignId, userId]
    );
    if (existingRuns.rows.some((row: any) => row.published)) throw new Error("This campaign is already published.");
    if (existingRuns.rows.some((row: any) => String(row.internal_status) === "PROCESSING")) throw new Error("This campaign is still processing.");

    const connected = await connectedSocialChannels(userId);
    const storedChannels = Array.isArray(campaign.channels) ? campaign.channels : [];
    const selected = storedChannels.filter((channel: string) => allowedChannels.includes(channel as any) && connected.includes(channel as any));
    if (!selected.length) throw new Error("No configured channel for this campaign is currently connected.");

    const assets = campaign.results?.assets || {};
    const trackedLink = typeof assets.landingLink === "string" ? assets.landingLink : undefined;
    const socialInput: MarketingCampaignInput = {
        name: String(campaign.name),
        objective: String(campaign.objective || "Brand awareness and sales"),
        targetArea: String(campaign.target_area || "Houston, Texas + United States"),
        message: String(campaign.message || ""),
        subject: String(campaign.subject || campaign.name),
        imageUrl: typeof assets.imageUrl === "string" ? assets.imageUrl : undefined,
        videoUrl: typeof assets.videoUrl === "string" ? assets.videoUrl : undefined,
        link: trackedLink,
        channels: selected,
        autopilot: false,
    };

    const social = await publishSocialCampaign(userId, selected, socialInput, campaignId);
    const failedChannels = Object.entries(social)
        .filter(([, result]) => !(result as any)?.ok)
        .map(([channel, result]) => `${channel}: ${(result as any)?.error || "publication failed"}`);
    if (failedChannels.length) {
        throw new Error(failedChannels.join(" | "));
    }
    const currentResults = campaign.results && typeof campaign.results === "object" ? campaign.results : {};
    const finalResults = {
        ...currentResults,
        social,
        lifecycle: {
            ...(currentResults.lifecycle || {}),
            stage: "PUBLICATION",
            status: Object.values(social).some((result: any) => result?.ok) ? "RECORDED" : "ERROR",
            updatedAt: new Date().toISOString(),
        },
    };
    await pool.query(`UPDATE marketing_campaigns SET results=$2::jsonb, last_run_at=NOW() WHERE id=$1`, [campaignId, JSON.stringify(finalResults)]);

    const runIds = await recordCampaignRuns(campaignId, userId, social, "campaign", randomUUID());
    await recordCampaignLaunchLearning({
        campaignId,
        runIds,
        channels: selected,
        objective: String(campaign.objective || "Brand awareness and sales"),
        targetArea: String(campaign.target_area || "Houston, Texas + United States"),
        hasImage: Boolean(socialInput.imageUrl),
        hasVideo: Boolean(socialInput.videoUrl),
        results: social,
    });

    return { campaignId, social, connectedChannels: connected };
};

export const getMarketingLearning = async (targetArea?: string, objective?: string, ownerUserId?: string) => getMarketingLearningInsights(targetArea, objective, ownerUserId);

export const getMarketingCampaignResults = async (ownerUserId: string, days = 30) => {
    await ensureCampaignTable();
    const safeDays = Math.min(Math.max(Number(days) || 30, 1), 90);
    const campaignResult = await pool.query(
        `SELECT id, name, channels, results, created_at, autopilot_enabled, next_run_at, last_run_at
         FROM marketing_campaigns
         WHERE owner_user_id=$1
         ORDER BY created_at DESC
         LIMIT 100`,
        [ownerUserId]
    );
    const runsResult = await pool.query(
        `SELECT campaign_id, channel, status, internal_status, provider_status, published, external_id, external_url, created_at, published_at
         FROM marketing_campaign_runs
         WHERE owner_user_id=$1
           AND created_at >= NOW() - ($2::int || ' days')::interval
         ORDER BY created_at DESC`,
        [ownerUserId, safeDays]
    );

    const runMap = new Map<string, any[]>();
    for (const row of runsResult.rows) {
        const key = String(row.campaign_id);
        const bucket = runMap.get(key) || [];
        bucket.push(row);
        runMap.set(key, bucket);
    }

    return campaignResult.rows.map((campaign: any) => {
        const runs = runMap.get(String(campaign.id)) || [];
        const publishedRuns = runs.filter((row: any) => row.published);
        const processingRuns = runs.filter((row: any) => row.internal_status === "PROCESSING");
        const failedRuns = runs.filter((row: any) => row.internal_status === "FAILED");
        return {
            campaignId: String(campaign.id),
            campaignName: String(campaign.name),
            channels: Array.isArray(campaign.channels) ? campaign.channels : [],
            publicationStatus: failedRuns.length ? "FAILED" : processingRuns.length ? "PROCESSING" : publishedRuns.length ? "PUBLISHED" : "QUEUED",
            publications: runs.length,
            published: publishedRuns.length,
            processing: processingRuns.length,
            failed: failedRuns.length,
            autopilot: Boolean(campaign.autopilot_enabled),
            lastRunAt: campaign.last_run_at,
            nextRunAt: campaign.next_run_at,
            firstPublicationAt: publishedRuns.length ? publishedRuns[publishedRuns.length - 1].published_at : null,
            lastPublicationAt: publishedRuns.length ? publishedRuns[0].published_at : null,
            metrics: {
                sessions: null,
                activeUsers: null,
                conversions: null,
                revenue: null,
                transactions: null,
                clicks: null,
                impressions: null,
            },
            publicationLedger: runs.map((row: any) => ({
                runId: Number(row.id || 0),
                channel: String(row.channel),
                status: String(row.internal_status || row.status || "UNKNOWN"),
                providerStatus: row.provider_status || null,
                providerId: row.external_id || null,
                externalUrl: row.external_url || null,
                publishedAt: row.published_at || null,
                createdAt: row.created_at,
            })),
        };
    });
};

export const listMarketingPublicationActivity = async (ownerUserId: string, limit = 50) => {
    await ensureCampaignTable();
    const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
    const result = await pool.query(
        `SELECT
            r.id AS run_id,
            r.campaign_id,
            c.name AS campaign_name,
            c.campaign_type,
            c.target_area,
            c.results->'assets'->>'landingLink' AS landing_link,
            r.channel,
            r.run_type,
            r.published,
            r.status,
            r.external_id,
            r.external_url,
            r.result,
            r.created_at
         FROM marketing_campaign_runs r
         LEFT JOIN marketing_campaigns c ON c.id = r.campaign_id
         WHERE c.owner_user_id=$1
         ORDER BY r.created_at DESC
         LIMIT $2`,
        [ownerUserId, safeLimit]
    );

    return result.rows.map((row: any) => {
        const raw = row.result && typeof row.result === "object" ? row.result : {};
        let url = typeof raw.url === "string" ? raw.url : undefined;
        const id = raw.id ? String(raw.id) : undefined;
        const channel = String(row.channel || "");
        if (!url && id && channel === "pinterest") {
            url = "https://www.pinterest.com/pin/" + encodeURIComponent(id) + "/";
        }
        if (!url && id && channel === "youtube") {
            url = "https://www.youtube.com/watch?v=" + encodeURIComponent(id);
        }
        return {
            run_id: Number(row.run_id),
            campaign_id: String(row.campaign_id),
            campaign_name: row.campaign_name || String(row.campaign_id),
            campaign_type: row.campaign_type || "manual",
            target_area: row.target_area || "",
            landing_link: row.landing_link || null,
            channel,
            run_type: row.run_type,
            published: Boolean(row.published),
            status: row.status || (row.published ? "PUBLISHED" : "FAILED"),
            external_id: row.external_id || id || null,
            external_url: row.external_url || url || null,
            result: { ...raw, ...(url ? { url } : {}) },
            created_at: row.created_at,
        };
    });
};

export const listMarketingCampaigns = async (ownerUserId: string, limit = 20) => {
    await ensureCampaignTable();
    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);
    const result = await pool.query(
        `SELECT id, name, objective, target_area, message, subject, channels, results, created_at, autopilot_enabled, next_run_at, last_run_at, run_count, campaign_type, starts_at, ends_at, recurrence_hours
         FROM marketing_campaigns
         WHERE owner_user_id=$1
         ORDER BY created_at DESC
         LIMIT $2`,
        [ownerUserId, safeLimit]
    );
    return result.rows;
};

export const deleteMarketingCampaign = async (ownerUserId: string, campaignId: string) => {
    await ensureCampaignTable();
    const id = String(campaignId || "").trim();
    if (!id) throw new Error("Campaign ID is required.");

    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const existing = await client.query(
            `SELECT id, name
             FROM marketing_campaigns
             WHERE id=$1 AND owner_user_id=$2
             FOR UPDATE`,
            [id, ownerUserId]
        );
        if (!existing.rows[0]) {
            await client.query("ROLLBACK");
            return null;
        }

        const learningDeleted = await client.query(
            `DELETE FROM marketing_learning_observations WHERE campaign_id=$1`,
            [id]
        );
        const runsDeleted = await client.query(
            `DELETE FROM marketing_campaign_runs WHERE campaign_id=$1`,
            [id]
        );
        await client.query(
            `DELETE FROM marketing_campaigns WHERE id=$1 AND owner_user_id=$2`,
            [id, ownerUserId]
        );
        await client.query("COMMIT");

        return {
            id,
            name: String(existing.rows[0].name || id),
            deletedRuns: runsDeleted.rowCount || 0,
            deletedLearningObservations: learningDeleted.rowCount || 0,
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};


const getAdaptiveNextSlot = async (targetArea: string, objective: string, channels: SocialChannel[], ownerUserId: string) => {
    const result = await pool.query(
        `SELECT hour, weekday, SUM(sessions)::int sessions, SUM(conversions)::int conversions, COALESCE(SUM(revenue),0)::numeric revenue, COUNT(*)::int observations
         FROM marketing_learning_observations
         WHERE target_area ILIKE '%' || $1 || '%'
           AND objective ILIKE '%' || $2 || '%'
           AND channel = ANY($3::text[])
           AND (attribution_evidence = TRUE OR sessions > 0 OR conversions > 0 OR revenue > 0)
           AND EXISTS (SELECT 1 FROM marketing_campaigns c WHERE c.id=marketing_learning_observations.campaign_id AND c.owner_user_id=$4)
         GROUP BY hour, weekday
         HAVING COUNT(*) >= 2
         ORDER BY
           (
             (SUM(conversions)::numeric / GREATEST(SUM(sessions), 1)) * 0.8
             + LEAST((COALESCE(SUM(revenue),0)::numeric / GREATEST(SUM(sessions), 1)) / 50, 1) * 0.2
           ) DESC,
           SUM(conversions) DESC,
           SUM(sessions) DESC
         LIMIT 1`,
        [targetArea, objective, channels, ownerUserId]
    );
    const slot = result.rows[0];
    if (!slot) return null;
    const total = await pool.query(
        `SELECT COUNT(*)::int AS observations
         FROM marketing_learning_observations
         WHERE target_area ILIKE '%' || $1 || '%'
           AND objective ILIKE '%' || $2 || '%'
           AND channel = ANY($3::text[])
           AND (attribution_evidence = TRUE OR sessions > 0 OR conversions > 0 OR revenue > 0)
           AND EXISTS (SELECT 1 FROM marketing_campaigns c WHERE c.id=marketing_learning_observations.campaign_id AND c.owner_user_id=$4)`,
        [targetArea, objective, channels, ownerUserId]
    );
    if (Number(total.rows[0]?.observations || 0) < 10) return null;

    const now = new Date();
    const desiredWeekday = Number(slot.weekday);
    const desiredHour = Number(slot.hour);
    if (now.getUTCDay() === desiredWeekday && now.getUTCHours() === desiredHour) return null;

    const next = new Date(now);
    next.setUTCMinutes(0, 0, 0);
    let daysAhead = (desiredWeekday - now.getUTCDay() + 7) % 7;
    if (daysAhead === 0 && desiredHour <= now.getUTCHours()) daysAhead = 7;
    next.setUTCDate(next.getUTCDate() + daysAhead);
    next.setUTCHours(desiredHour, 0, 0, 0);
    return next;
};

const syncPendingPublicationStatuses = async () => {
    await ensureCampaignTable();
    const pending = await pool.query(
        `SELECT id, campaign_id, owner_user_id, channel, external_id
         FROM marketing_campaign_runs
         WHERE status='PROCESSING' AND external_id IS NOT NULL
           AND created_at >= NOW() - INTERVAL '24 hours'
           AND channel IN ('tiktok','youtube')
         ORDER BY created_at ASC LIMIT 50`
    );
    let updated = 0;
    for (const row of pending.rows) {
        try {
            const result = row.channel === "tiktok"
                ? await checkTikTokPublicationStatus(String(row.owner_user_id), String(row.external_id))
                : await checkYouTubePublicationStatus(String(row.owner_user_id), String(row.external_id));
            const published = Boolean(result.published);
            const status = published ? "PUBLISHED" : (result.status === "FAILED" ? "FAILED" : "PROCESSING");
            const externalUrl = (result as any).url || ((result as any).publicPostId ? "https://www.tiktok.com/@/video/" + encodeURIComponent(String((result as any).publicPostId)) : null);
            await pool.query(
                `UPDATE marketing_campaign_runs
                 SET status=$2, published=$3, external_url=COALESCE($4, external_url), result=result || $5::jsonb
                 WHERE id=$1`,
                [Number(row.id), status, published, externalUrl, JSON.stringify({ stage: "RESULT", providerStatus: result.status, checkedAt: new Date().toISOString(), ...(result as any).failReason ? { error: (result as any).failReason } : {} })]
            );
            await pool.query(
                `UPDATE marketing_learning_observations SET published=$2, decision=decision || $3::jsonb, updated_at=NOW() WHERE run_id=$1`,
                [Number(row.id), published, JSON.stringify({ stage: "RESULT", status })]
            );
            updated += 1;
        } catch (error) {
            await pool.query(
                `UPDATE marketing_campaign_runs SET result=result || $2::jsonb WHERE id=$1`,
                [Number(row.id), JSON.stringify({ statusCheckError: error instanceof Error ? error.message : "Status check failed.", checkedAt: new Date().toISOString() })]
            );
        }
    }
    return { checked: pending.rows.length, updated };
};
const runMarketingAutopilotOnce = async () => {
    await ensureCampaignTable();
    // Shared global pause gate: do not queue content or publish unless explicitly active.
    const workspaceId = process.env.MARKETING_WORKSPACE_OWNER_ID?.trim() || "a720d444-d23c-45ca-9086-d0d4dde26a1f";
    const pauseState = await pool.query(
        `SELECT enabled FROM marketing_catalog_autopilot WHERE owner_user_id=$1 LIMIT 1`,
        [workspaceId]
    );
    if (!pauseState.rows[0] || pauseState.rows[0].enabled !== true) {
        return { ran: false, paused: true, reason: "Marketing Autopilot is paused; no content was queued or published." };
    }
    const contentOwners = await getCatalogOwners();
    const contentQueue = [];
    for (const ownerId of contentOwners) {
        try { contentQueue.push(await queueNextContent(ownerId)); }
        catch (error) { contentQueue.push({ queued: false, reason: error instanceof Error ? error.message : "Content scan failed." }); }
    }
    const claimToken = randomUUID();
    const due = await pool.query(`
        UPDATE marketing_campaigns
        SET claim_token=$1,
            claim_expires_at=NOW() + INTERVAL '20 minutes'
        WHERE id = (
            SELECT id
            FROM marketing_campaigns
            WHERE autopilot_enabled = TRUE
              AND next_run_at IS NOT NULL
              AND next_run_at <= NOW()
              AND (claim_expires_at IS NULL OR claim_expires_at < NOW())
            ORDER BY next_run_at ASC
            LIMIT 1
            FOR UPDATE SKIP LOCKED
        )
        RETURNING *
    `, [claimToken]);
    if (!due.rows[0]) return { ran: false, reason: "No campaign is due.", contentQueue };

    const campaign = due.rows[0];
    const userId = String(campaign.owner_user_id || "");

    // Never publish placeholder/test catalog items, inactive products, or products
    // without a real positive price and a usable image. This also protects against
    // campaigns that were queued before the eligibility rules were tightened.
    const source = campaign.results?.source || {};
    if (source.type === "catalog") {
        const productId = String(source.productId || "");
        const productCheck = productId
            ? await pool.query(
                `SELECT name, price, is_active, COALESCE(NULLIF(BTRIM(image_url), ''), NULLIF(BTRIM(image_urls->>0), '')) AS image_url
                 FROM products WHERE product_id::text=$1 LIMIT 1`,
                [productId]
              )
            : { rows: [] };
        const product = productCheck.rows[0];
        const isPlaceholder = !product || !product.is_active || Number(product.price) <= 0
            || !String(product.name || "").trim()
            || /(^|[^a-z])(test|sample|demo|placeholder)([^a-z]|$)/i.test(String(product.name || ""))
            || !String(product.image_url || "").trim();
        if (isPlaceholder) {
            await pool.query(
                `UPDATE marketing_campaigns
                 SET autopilot_enabled=FALSE, next_run_at=NULL, claim_token=NULL, claim_expires_at=NULL,
                     results=results || $2::jsonb
                 WHERE id=$1 AND claim_token=$3`,
                [campaign.id, JSON.stringify({ autopilot: { blocked: true, reason: "Catalog item failed production eligibility checks; no social post was sent." } }), claimToken]
            );
            return { ran: false, reason: "Catalog item failed production eligibility checks; no social post was sent.", campaignId: campaign.id };
        }
    }
    if (campaign.ends_at && new Date(campaign.ends_at) <= new Date()) {
        await pool.query(`UPDATE marketing_campaigns SET autopilot_enabled=FALSE, next_run_at=NULL, claim_token=NULL, claim_expires_at=NULL WHERE id=$1 AND claim_token=$2`, [campaign.id, claimToken]);
        return { ran: false, reason: "Campaign window ended.", campaignId: campaign.id };
    }
    if (campaign.starts_at && new Date(campaign.starts_at) > new Date()) {
        await pool.query(`UPDATE marketing_campaigns SET next_run_at=$2, claim_token=NULL, claim_expires_at=NULL WHERE id=$1 AND claim_token=$3`, [campaign.id, campaign.starts_at, claimToken]);
        return { ran: false, reason: "Campaign has not started yet.", campaignId: campaign.id };
    }
    if (!userId) {
        await pool.query(`UPDATE marketing_campaigns SET autopilot_enabled=FALSE, results=results || $2::jsonb, claim_token=NULL, claim_expires_at=NULL WHERE id=$1 AND claim_token=$3`, [campaign.id, JSON.stringify({ autopilot: { error: "Campaign has no owner." } }), claimToken]);
        return { ran: false, reason: "Campaign has no owner." };
    }

    const connected = await connectedSocialChannels(userId);
    const configuredChannels = Array.isArray(campaign.channels) ? campaign.channels.filter((x: any) => allowedChannels.includes(x)) : [];
    const eligible = configuredChannels.filter((channel: SocialChannel) => connected.includes(channel));
    if (!eligible.length) {
        await pool.query(`UPDATE marketing_campaigns SET next_run_at = NOW() + INTERVAL '12 hours', claim_token=NULL, claim_expires_at=NULL WHERE id=$1 AND claim_token=$2`, [campaign.id, claimToken]);
        return { ran: false, reason: "No selected channel is currently connected.", campaignId: campaign.id };
    }

    const assets = campaign.results?.assets || {};

    const recent = await pool.query(
        `SELECT channel FROM marketing_learning_observations WHERE campaign_id=$1 AND updated_at >= NOW() - INTERVAL '24 hours'`,
        [campaign.id]
    );
    const recentlyUsed = new Set(recent.rows.map((r: any) => String(r.channel)));
    const adaptiveSlot = await getAdaptiveNextSlot(campaign.target_area, campaign.objective, eligible, userId);
    if (adaptiveSlot) {
        // Use learned publication windows only when enough attributed evidence exists.
        // Timing optimization must never exceed one standard 12-hour cycle.
        const maxAdaptiveDelayMs = 12 * 60 * 60 * 1000;
        if (adaptiveSlot.getTime() - Date.now() <= maxAdaptiveDelayMs) {
            await pool.query(`UPDATE marketing_campaigns SET next_run_at=$2, claim_token=NULL, claim_expires_at=NULL WHERE id=$1 AND claim_token=$3`, [campaign.id, adaptiveSlot, claimToken]);
            return { ran: false, reason: "Waiting for the learned best publication window.", campaignId: campaign.id, nextRunAt: adaptiveSlot.toISOString() };
        }
    }

    const insights = await getMarketingLearningInsights(campaign.target_area, campaign.objective, userId);
    const score = new Map(insights.map((r: any) => [r.channel, Number(r.score || 0)]));
    const ranked = eligible.slice().sort((a: string, b: string) => {
        const aRecent = recentlyUsed.has(a) ? 1 : 0;
        const bRecent = recentlyUsed.has(b) ? 1 : 0;
        if (aRecent !== bRecent) return aRecent - bRecent;
        return (score.get(b) || 0) - (score.get(a) || 0);
    });
    const channelsToPublish = ranked;
    // Recheck pause immediately before making outbound provider calls.
    const publishGate = await pool.query(
        `SELECT enabled FROM marketing_catalog_autopilot WHERE owner_user_id=$1 LIMIT 1`,
        [workspaceId]
    );
    if (!publishGate.rows[0] || publishGate.rows[0].enabled !== true) {
        await pool.query(
            `UPDATE marketing_campaigns SET claim_token=NULL, claim_expires_at=NULL, next_run_at=NOW() + INTERVAL '12 hours' WHERE id=$1 AND claim_token=$2`,
            [campaign.id, claimToken]
        );
        return { ran: false, paused: true, reason: "Marketing Autopilot was paused before publication; nothing was sent.", campaignId: campaign.id };
    }
    const firstRun = Number(campaign.run_count || 0) === 0;
    const social: Record<string, unknown> = {};
    for (const channel of channelsToPublish) {
        const trackedLink = withCampaignTracking(assets.landingLink || undefined, campaign.id, channel);
        const input: MarketingCampaignInput = {
            name: campaign.name,
            objective: campaign.objective,
            targetArea: campaign.target_area,
            message: (source.type === "catalog" || source.type === "portfolio")
                ? await generateAutopilotCaption(
                    String(source.productName || source.portfolioTitle || campaign.name || "Personalized design"),
                    String(assets.imageUrl || "")
                  )
                : campaign.message,
            subject: campaign.subject,
            channels: [channel],
            imageUrl: campaign.results?.assets?.imageUrl,
            videoUrl: campaign.results?.assets?.videoUrl,
            link: trackedLink,
        };
        Object.assign(social, await publishSocialCampaign(userId, [channel], input, campaign.id));
    }
    let autopilotEmail: PromotionResult | undefined;
    if (firstRun && Boolean(campaign.results?.sendEmail)) {
        try {
            autopilotEmail = await sendPromotion({
                subject: campaign.subject || campaign.name,
                message: campaign.message,
                imageUrl: assets.imageUrl || undefined,
            });
        } catch (error) {
            social.email = { ok: false, error: error instanceof Error ? error.message : "Email promotion failed." };
        }
    }
    if (autopilotEmail) social.email = { ok: true, totalRecipients: autopilotEmail.totalRecipients };

    const runToken = randomUUID();
    const publicationResults = { ...social };
    const runIds = await recordCampaignRuns(campaign.id, userId, publicationResults, "autopilot", runToken);
    await recordCampaignLaunchLearning({
        campaignId: campaign.id,
        runIds,
        channels: [...channelsToPublish, ...(autopilotEmail ? ["email" as const] : [])],
        objective: campaign.objective,
        targetArea: campaign.target_area,
        hasImage: Boolean(assets.imageUrl),
        hasVideo: Boolean(assets.videoUrl),
        results: publicationResults,
    });

    const cadenceHours = 12;
    const nextRun = new Date(Date.now() + cadenceHours * 60 * 60 * 1000);
    const mergedResults = {
        ...(campaign.results || {}),
        autopilot: { lastChannels: channelsToPublish, lastRunAt: new Date().toISOString(), runCount: Number(campaign.run_count || 0) + 1, result: social },
    };
    await pool.query(
        `UPDATE marketing_campaigns
         SET results=$2::jsonb, last_run_at=NOW(), next_run_at=$3, run_count=run_count+1,
             claim_token=NULL, claim_expires_at=NULL
         WHERE id=$1 AND claim_token=$4`,
        [campaign.id, JSON.stringify(mergedResults), nextRun, claimToken]
    );
    return { ran: true, campaignId: campaign.id, channels: channelsToPublish, social, nextRunAt: nextRun.toISOString(), contentQueue };
};

export const runMarketingAutopilot = async (maxRuns = 10) => {
    const publicationSync = await syncPendingPublicationStatuses();
    const safeMaxRuns = Math.min(Math.max(Number(maxRuns) || 1, 1), 10);
    const runs: any[] = [];

    for (let index = 0; index < safeMaxRuns; index += 1) {
        const result = await runMarketingAutopilotOnce();
        runs.push(result);

        // Stop as soon as there is no due work. A single hourly invocation can
        // therefore drain several independent campaigns without letting one
        // manual/catalog/portfolio campaign replace the others.
        if (!result?.ran && result?.reason === "No campaign is due.") {
            break;
        }
    }

    const successful = runs.filter(result => result?.ran);
    const last = runs[runs.length - 1] || { ran: false, reason: "No campaign is due." };

    return {
        ...last,
        ran: successful.length > 0,
        processed: successful.length,
        runs,
        publicationSync,
    };
};
