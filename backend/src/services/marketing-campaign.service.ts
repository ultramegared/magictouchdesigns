import { randomUUID } from "crypto";
import { pool } from "../config/database";
import { getConnections, publishMeta, publishPinterest, publishTikTokPhoto, publishTikTokVideo, publishYouTube, type SocialChannel } from "./social-connections.service";
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
    await pool.query(`ALTER TABLE marketing_campaign_runs ADD COLUMN IF NOT EXISTS owner_user_id TEXT`);
    await pool.query(`ALTER TABLE marketing_campaign_runs ADD COLUMN IF NOT EXISTS run_token TEXT`);
    await pool.query(`ALTER TABLE marketing_campaign_runs ADD COLUMN IF NOT EXISTS publication_key TEXT`);
    await pool.query(`ALTER TABLE marketing_campaign_runs ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'FAILED'`);
    await pool.query(`ALTER TABLE marketing_campaign_runs ADD COLUMN IF NOT EXISTS external_id TEXT`);
    await pool.query(`ALTER TABLE marketing_campaign_runs ADD COLUMN IF NOT EXISTS external_url TEXT`);
    await pool.query(`ALTER TABLE marketing_campaign_runs ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ`);
    await pool.query(`ALTER TABLE marketing_campaign_runs ADD COLUMN IF NOT EXISTS decision JSONB NOT NULL DEFAULT '{}'::jsonb`);
    await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS marketing_campaign_runs_publication_key_idx ON marketing_campaign_runs(publication_key) WHERE publication_key IS NOT NULL`);
    await pool.query(`CREATE INDEX IF NOT EXISTS marketing_campaign_runs_owner_idx ON marketing_campaign_runs(owner_user_id, created_at DESC)`);
    // Normalize existing active Autopilot campaigns to the new 6-hour operating window.
    // This is intentionally scoped to Marketing campaigns only.
    await pool.query(`UPDATE marketing_campaigns SET recurrence_hours=6 WHERE autopilot_enabled=TRUE AND recurrence_hours > 7`);
    await pool.query(`UPDATE marketing_campaigns SET next_run_at=NOW() + INTERVAL '6 hours' WHERE autopilot_enabled=TRUE AND next_run_at IS NOT NULL AND next_run_at > NOW() + INTERVAL '6 hours' AND (starts_at IS NULL OR starts_at <= NOW())`);
    await pool.query(`
        CREATE TABLE IF NOT EXISTS marketing_campaign_runs (
            id BIGSERIAL PRIMARY KEY,
            campaign_id TEXT NOT NULL,
            channel TEXT NOT NULL,
            run_type TEXT NOT NULL DEFAULT 'campaign',
            published BOOLEAN NOT NULL DEFAULT FALSE,
            result JSONB NOT NULL DEFAULT '{}'::jsonb,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS marketing_campaign_runs_campaign_idx ON marketing_campaign_runs(campaign_id, created_at DESC)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS marketing_campaign_runs_created_idx ON marketing_campaign_runs(created_at DESC)`);
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
        const publicationKey = `${campaignId}:${runToken}:${channel}`;
        const inserted = await pool.query(
            `INSERT INTO marketing_campaign_runs
                (campaign_id, owner_user_id, channel, run_type, run_token, publication_key, status, published, external_id, external_url, published_at, decision, result)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13::jsonb)
             ON CONFLICT (publication_key) DO UPDATE SET result=EXCLUDED.result, status=EXCLUDED.status,
                 published=EXCLUDED.published, external_id=EXCLUDED.external_id, external_url=EXCLUDED.external_url,
                 published_at=EXCLUDED.published_at
             RETURNING id`,
            [
                campaignId, ownerUserId, channel, runType, runToken, publicationKey, status, published,
                externalId, externalUrl, published ? new Date() : null,
                JSON.stringify({ stage: "PUBLICATION", channel, status, runToken }),
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
    const campaignType = input.campaignType || "manual";
    const requestedRecurrenceHours = Number(input.recurrenceHours) || 6;
    // Marketing Autopilot operates on a tight 5–7 hour learning cadence.
    // The hourly cron remains the queue/check mechanism; this is the campaign publish interval.
    const recurrenceHours = Math.min(Math.max(requestedRecurrenceHours, 5), 7);
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
    const firstRunAt = startsAt && startsAt > new Date() ? startsAt : new Date(Date.now() + 60 * 60 * 1000);
    const trackedLink = withCampaignTracking(input.link?.trim() || undefined, campaignId, "jqydesigns");
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
    await pool.query(
        `INSERT INTO marketing_campaigns (id, name, objective, target_area, message, subject, channels, results, idempotency_key, owner_user_id, autopilot_enabled, next_run_at, campaign_type, starts_at, ends_at, recurrence_hours)
         VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9,$10,$11,$12,$13,$14,$15,$16)`,
        [campaignId, name, objective, targetArea, message, input.subject?.trim() || name, JSON.stringify(selected), JSON.stringify(initialResults), idempotencyKey, userId, Boolean(input.autopilot), input.autopilot ? firstRunAt : null, campaignType, startsAt, endsAt, recurrenceHours]
    );

    let social: Record<string, unknown> = {};
    let email: PromotionResult | undefined;
    let publishError: string | undefined;

    if (selected.length && !input.autopilot) {
        try {
            social = await publishSocialCampaign(userId, selected, socialInput);
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

export const getMarketingLearning = async (targetArea?: string, objective?: string, ownerUserId?: string) => getMarketingLearningInsights(targetArea, objective, ownerUserId);

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
            result: { ...raw, ...(url ? { url } : {}) },
            created_at: row.created_at,
        };
    });
};

export const listMarketingCampaigns = async (ownerUserId: string, limit = 20) => {
    await ensureCampaignTable();
    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);
    const result = await pool.query(
        `SELECT id, name, objective, target_area, subject, channels, results, created_at, autopilot_enabled, next_run_at, last_run_at, run_count, campaign_type, starts_at, ends_at, recurrence_hours
         FROM marketing_campaigns
         WHERE owner_user_id=$1
         ORDER BY created_at DESC
         LIMIT $2`,
        [ownerUserId, safeLimit]
    );
    return result.rows;
};


const getAdaptiveNextSlot = async (targetArea: string, objective: string, channels: SocialChannel[]) => {
    const result = await pool.query(
        `SELECT hour, weekday, SUM(sessions)::int sessions, SUM(conversions)::int conversions, COALESCE(SUM(revenue),0)::numeric revenue, COUNT(*)::int observations
         FROM marketing_learning_observations
         WHERE target_area ILIKE '%' || $1 || '%'
           AND objective ILIKE '%' || $2 || '%'
           AND channel = ANY($3::text[])
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
        [targetArea, objective, channels]
    );
    const slot = result.rows[0];
    if (!slot) return null;
    const total = await pool.query(
        `SELECT COUNT(*)::int AS observations
         FROM marketing_learning_observations
         WHERE target_area ILIKE '%' || $1 || '%'
           AND objective ILIKE '%' || $2 || '%'
           AND channel = ANY($3::text[])`,
        [targetArea, objective, channels]
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

const runMarketingAutopilotOnce = async () => {
    await ensureCampaignTable();
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
        await pool.query(`UPDATE marketing_campaigns SET next_run_at = NOW() + INTERVAL '6 hours', claim_token=NULL, claim_expires_at=NULL WHERE id=$1 AND claim_token=$2`, [campaign.id, claimToken]);
        return { ran: false, reason: "No selected channel is currently connected.", campaignId: campaign.id };
    }

    const assets = campaign.results?.assets || {};

    const recent = await pool.query(
        `SELECT channel FROM marketing_learning_observations WHERE campaign_id=$1 AND updated_at >= NOW() - INTERVAL '24 hours'`,
        [campaign.id]
    );
    const recentlyUsed = new Set(recent.rows.map((r: any) => String(r.channel)));
    const adaptiveSlot = await getAdaptiveNextSlot(campaign.target_area, campaign.objective, eligible);
    if (adaptiveSlot) {
        // Never delay beyond the 5–7 hour operating window just because a historical
        // best slot falls on another day. The Brain may still use the learned slot
        // when it is inside the normal cadence, otherwise the next cycle runs on time.
        const maxAdaptiveDelayMs = 7 * 60 * 60 * 1000;
        if (adaptiveSlot.getTime() - Date.now() <= maxAdaptiveDelayMs) {
            await pool.query(`UPDATE marketing_campaigns SET next_run_at=$2, claim_token=NULL, claim_expires_at=NULL WHERE id=$1 AND claim_token=$3`, [campaign.id, adaptiveSlot, claimToken]);
            return { ran: false, reason: "Waiting for the learned best publication window.", campaignId: campaign.id, nextRunAt: adaptiveSlot.toISOString() };
        }
    }

    const insights = await getMarketingLearningInsights(campaign.target_area, campaign.objective);
    const score = new Map(insights.map((r: any) => [r.channel, Number(r.score || 0)]));
    const ranked = eligible.slice().sort((a, b) => {
        const aRecent = recentlyUsed.has(a) ? 1 : 0;
        const bRecent = recentlyUsed.has(b) ? 1 : 0;
        if (aRecent !== bRecent) return aRecent - bRecent;
        return (score.get(b) || 0) - (score.get(a) || 0);
    });
    const channelsToPublish = ranked;
    const firstRun = Number(campaign.run_count || 0) === 0;
    const social: Record<string, unknown> = {};
    for (const channel of channelsToPublish) {
        const trackedLink = withCampaignTracking(assets.landingLink || undefined, campaign.id, channel);
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
        Object.assign(social, await publishSocialCampaign(userId, [channel], input));
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

    const cadenceHours = Math.min(Math.max(Number(campaign.recurrence_hours) || 6, 5), 7);
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
    };
};
