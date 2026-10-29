/**
 * ================================================================
 * Project: Magic Touch Designs
 * File: marketing-creative.service.ts
 * Module: Autopilot Phase 2 — robot-generated advertising posters
 * Description:
 * When the catalog and portfolio queues are both empty, the robot
 * creates a genuinely new advertising poster from a REAL catalog
 * product photo instead of staying silent or re-posting an old
 * photo. v1 uses Cloudinary transformation URLs only: a new frame,
 * a seasonal headline overlay, a small logo watermark, and a
 * jqydesigns.com footer line on the poster. The mug itself is
 * never redrawn, cropped, or replaced, so the poster always shows
 * the exact product the customer receives.
 *
 * Cadence (owner rule): the robot publishes at most ONE autopilot
 * campaign every 3 days across ALL types (catalog, portfolio,
 * generated). See isAutopilotCadenceBlocked — "every 3 days" means
 * at least 3 calendar days (America/Chicago) since the last
 * autopilot publication.
 *
 * GUARDRAILS (never):
 * - No new store products; no price/name/description changes.
 * - No fake products, prices, or claims; no prices anywhere in
 *   the poster or the caption (real price only via message,
 *   WhatsApp, or website).
 * - No customer-uploaded photos (custom-request artwork is BYTEA,
 *   never marketing material); no $0/test/sample products.
 * - No videos; no publishing while paused; no bypassing the
 *   30-day dedup guard; no auto-deletion of anything.
 * - No unattended AI-redrawn product photos (no AI path in v1).
 * - No new secrets or env vars in v1 (Cloudinary transforms
 *   need none).
 * ================================================================
 */

import { randomUUID } from "crypto";
import { pool } from "../config/database";

const PUBLIC_SITE = process.env.FRONTEND_PUBLIC_URL?.trim() || "https://www.jqydesigns.com";
const PUBLIC_CHANNELS = ["facebook", "instagram", "tiktok", "youtube", "pinterest"] as const;
const STORE_FOLDER_PREFIX = "magic-touch-designs/";
// Site logo (gold JQ&YD monogram, transparent) — same Cloudinary
// account as the product photos, so it resolves as a transform
// overlay. If it ever goes missing, poster verification fails and
// generation is skipped that night instead of publishing broken art.
const LOGO_PUBLIC_ID = "magic-touch-designs/logos/nneyxqq6xylcxciw3om7";
const FRAME_COLOR = "C62828";
const MUTED_COLOR = "5B6573";
const ORDER_WHATSAPP_LINE = "📱 Order on WhatsApp: 346-760-3007";

const productLink = (slug: string) => `${PUBLIC_SITE.replace(/\/$/, "")}/products?product=${encodeURIComponent(slug)}`;

/**
 * Same transformation-tolerant parsing as cleanup.service.ts, copied
 * here so the marketing path does not import the admin cleanup
 * module (which drags settings + email-template services with it).
 * When the store folder appears in the path, everything from that
 * folder onward is the public_id, so transformed live URLs still
 * resolve to their asset instead of breaking the transform chain.
 */
const extractPublicIdFromUrl = (url: string): string | null => {
    const folderIndex = url.indexOf(`/${STORE_FOLDER_PREFIX}`);
    if (folderIndex >= 0) {
        const raw = url.slice(folderIndex + 1).split("?")[0];
        const withoutExtension = raw.replace(/\.[a-zA-Z0-9]+$/, "");
        try {
            return decodeURIComponent(withoutExtension);
        } catch {
            return withoutExtension;
        }
    }
    const match = url.match(
        /res\.cloudinary\.com\/[^/]+\/image\/upload\/(?:v\d+\/)?(.+)$/
    );
    if (!match) return null;
    const withoutQuery = match[1].split("?")[0];
    const withoutExtension = withoutQuery.replace(/\.[a-zA-Z0-9]+$/, "");
    try {
        return decodeURIComponent(withoutExtension);
    } catch {
        return withoutExtension;
    }
};

const parseCloudinaryPhoto = (url: string): { cloud: string; publicId: string } | null => {
    const cloudMatch = url.match(/^https:\/\/res\.cloudinary\.com\/([^/]+)\/image\/upload\//);
    if (!cloudMatch) return null;
    const publicId = extractPublicIdFromUrl(url);
    if (!publicId) return null;
    return { cloud: cloudMatch[1], publicId };
};

// ---------------------------------------------------------------------------
// Global 3-day autopilot cadence
// ---------------------------------------------------------------------------

/**
 * True when an autopilot campaign (catalog, portfolio, or generated)
 * has published within the last 3 calendar days (America/Chicago).
 * "Every 3 days" is measured in calendar days, not 72h of wall time,
 * so a midnight publication on Oct 28 allows the next one on Oct 31
 * at midnight, and blocks Oct 29 and Oct 30.
 *
 * Published runs are the source of truth (marketing_campaign_runs
 * with run_type='autopilot' and published=TRUE), NOT campaigns
 * .last_run_at — the retry path also stamps last_run_at on failed
 * runs, which must never count as a publication.
 */
export async function isAutopilotCadenceBlocked(): Promise<boolean> {
    const result = await pool.query(
        `SELECT 1 FROM marketing_campaign_runs r
         JOIN marketing_campaigns c ON c.id = r.campaign_id
         WHERE r.run_type = 'autopilot'
           AND r.published = TRUE
           AND c.campaign_type IN ('catalog','portfolio','generated')
           AND DATE(COALESCE(r.published_at, r.created_at) AT TIME ZONE 'America/Chicago')
               >= ((CURRENT_TIMESTAMP AT TIME ZONE 'America/Chicago')::date - INTERVAL '2 days')
         LIMIT 1`
    );
    return Boolean(result.rows[0]);
}

// ---------------------------------------------------------------------------
// Generated-creatives ledger
// ---------------------------------------------------------------------------

export async function ensureGeneratedTables() {
    await pool.query(`CREATE TABLE IF NOT EXISTS marketing_generated_creatives (
        id UUID PRIMARY KEY,
        product_id TEXT NOT NULL,
        variant_key TEXT NOT NULL,
        image_url TEXT NOT NULL,
        status TEXT NOT NULL,
        campaign_id TEXT NULL,
        consumed_at TIMESTAMPTZ NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);
    await pool.query(`CREATE INDEX IF NOT EXISTS marketing_generated_creatives_product_idx ON marketing_generated_creatives(product_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS marketing_generated_creatives_campaign_idx ON marketing_generated_creatives(campaign_id)`);
}

/**
 * A variant is consumed ONLY on publish success, never on queue.
 * A blocked generated campaign releases its variant (mirror of the
 * catalog blocked-path rollback), so a fixed product can generate
 * again instead of being stuck behind a dead reservation.
 */
export async function consumeGeneratedVariant(campaignId: string) {
    try {
        await pool.query(
            `UPDATE marketing_generated_creatives
             SET status='consumed', consumed_at=NOW()
             WHERE campaign_id=$1 AND status='queued'`,
            [campaignId]
        );
    } catch { /* Ledger upkeep must never break the autopilot. */ }
}

export async function releaseGeneratedVariant(campaignId: string) {
    try {
        await pool.query(
            `UPDATE marketing_generated_creatives
             SET status='released', campaign_id=NULL, consumed_at=NULL
             WHERE campaign_id=$1 AND status='queued'`,
            [campaignId]
        );
    } catch { /* Ledger upkeep must never break the autopilot. */ }
}

export interface LastGenerated {
    variantKey: string;
    imageUrl: string;
    status: string;
    productId: string;
    productName: string | null;
    consumedAt: string | null;
    createdAt: string | null;
}

export async function getLastGenerated(): Promise<LastGenerated | null> {
    try {
        await ensureGeneratedTables();
        const result = await pool.query(
            `SELECT g.variant_key, g.image_url, g.status, g.product_id, g.consumed_at, g.created_at,
                    p.name AS product_name
             FROM marketing_generated_creatives g
             LEFT JOIN products p ON p.product_id::text = g.product_id
             ORDER BY g.created_at DESC
             LIMIT 1`
        );
        const row = result.rows[0];
        if (!row) return null;
        return {
            variantKey: String(row.variant_key || ""),
            imageUrl: String(row.image_url || ""),
            status: String(row.status || ""),
            productId: String(row.product_id || ""),
            productName: row.product_name ? String(row.product_name) : null,
            consumedAt: row.consumed_at ? new Date(row.consumed_at).toISOString() : null,
            createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
        };
    } catch {
        return null;
    }
}

// ---------------------------------------------------------------------------
// Seasonal angle library + poster transform builder
// ---------------------------------------------------------------------------

interface GeneratedAngle {
    key: string;
    headline: string;
    /** Months (1-12, America/Chicago) this angle is seasonal for; empty = year-round. */
    months: number[];
}

// Seasonal angles come first in selection order; generic gift angles
// are the year-round fallback. Headlines carry no commas, apostrophes,
// prices, or phone numbers — commas would break the Cloudinary text
// transform, and prices must never be baked into the poster.
const GENERATED_ANGLES: GeneratedAngle[] = [
    { key: "christmas-early", headline: "Order Early for Christmas", months: [10, 11, 12] },
    { key: "christmas-gift", headline: "A Gift They Will Actually Use", months: [11, 12] },
    { key: "teacher", headline: "A Gift for a Great Teacher", months: [5, 8, 9] },
    { key: "love", headline: "Made With Love", months: [2] },
    { key: "birthday", headline: "Make Their Birthday Personal", months: [] },
    { key: "name", headline: "Add Your Name", months: [] },
    { key: "business", headline: "Your Logo. Your Mug.", months: [] },
    { key: "gift", headline: "A Gift Made Personal", months: [] },
    { key: "evergreen", headline: "Personalized Just for You", months: [] },
];

const chicagoMonth = (): number =>
    Number(new Date().toLocaleString("en-US", { timeZone: "America/Chicago", month: "numeric" }));

const chicagoYear = (): number =>
    Number(new Date().toLocaleString("en-US", { timeZone: "America/Chicago", year: "numeric" }));

const eligibleAngles = (month: number): GeneratedAngle[] => {
    const seasonal = GENERATED_ANGLES.filter((angle) => angle.months.length > 0 && angle.months.includes(month));
    const generic = GENERATED_ANGLES.filter((angle) => angle.months.length === 0);
    return [...seasonal, ...generic];
};

/**
 * Builds a poster delivery URL from the real product photo.
 * c_pad ONLY — the mug is never cropped, only padded onto a square
 * 4:5 poster canvas (1200x1500, inside Instagram's 1.91:1–4:5 range)
 * with a white background, a brand-red frame, a seasonal headline
 * on top, the gold logo watermark at bottom-right, and a small
 * jqydesigns.com footer line. No price and no phone number are
 * baked into the image; ordering data lives in the caption.
 * Returns null when the photo is not a Cloudinary delivery URL.
 */
const buildPosterUrl = (photoUrl: string, headline: string): string | null => {
    const parsed = parseCloudinaryPhoto(photoUrl);
    if (!parsed) return null;
    const headlineEnc = encodeURIComponent(headline);
    const logoOverlay = LOGO_PUBLIC_ID.replace(/\//g, ":");
    const transforms = [
        "c_pad,w_1200,h_1500,b_rgb:FFFFFF",
        `bo_20px_solid_rgb:${FRAME_COLOR}`,
        `l_text:arial_72_bold:${headlineEnc},co_rgb:${FRAME_COLOR},g_north,y_48,fl_layer_apply`,
        `l_${logoOverlay},w_140,g_south_east,x_40,y_40,fl_layer_apply`,
        `l_text:arial_36:jqydesigns.com,co_rgb:${MUTED_COLOR},g_south,y_52,fl_layer_apply`,
        "f_jpg,q_auto",
    ].join("/");
    return `https://res.cloudinary.com/${parsed.cloud}/image/upload/${transforms}/${parsed.publicId}.jpg`;
};

/**
 * Appends ordering data to a generated caption, preserving the
 * owner's caption format: the shop URL stays completely alone on
 * its own line, the WhatsApp line follows it, and the hashtags stay
 * alone on the final line. No price is added anywhere.
 */
export function withOrderingData(caption: string): string {
    if (caption.includes("346-760-3007")) return caption;
    const blocks = caption.split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean);
    const last = blocks[blocks.length - 1] || "";
    if (/^#/.test(last)) blocks.splice(blocks.length - 1, 0, ORDER_WHATSAPP_LINE);
    else blocks.push(ORDER_WHATSAPP_LINE);
    return blocks.join("\n\n");
}

// ---------------------------------------------------------------------------
// Creative queue: the Phase 2 fallback
// ---------------------------------------------------------------------------

export async function queueNextCreativePost(ownerUserId: string) {
    await ensureGeneratedTables();

    // Generation also refuses while the global 3-day cadence is closed,
    // so nothing unpublishable gets queued (the run path checks the
    // same gate before queueing, this is defense for other callers).
    if (await isAutopilotCadenceBlocked()) {
        return { queued: false, reason: "Autopilot cadence: a campaign published within the last 3 days; generation waits for the next window." };
    }

    // At most one generated campaign waiting at a time. The drain
    // publishes one autopilot campaign per 3-day window, so a waiting
    // generated campaign must resolve before a new one is created.
    const waiting = await pool.query(
        `SELECT id FROM marketing_campaigns
         WHERE owner_user_id=$1 AND campaign_type='generated'
           AND autopilot_enabled=TRUE AND next_run_at IS NOT NULL
         LIMIT 1`,
        [ownerUserId]
    );
    if (waiting.rows[0]) {
        return { queued: false, reason: "A generated campaign is already queued.", campaignId: waiting.rows[0].id };
    }

    // Variety rule 1: never the same angle twice in a row for
    // generated posts (checked against the most recent generated
    // campaign, queued or published).
    const lastAngleRow = await pool.query(
        `SELECT results->'assets'->'generated'->>'angle' AS angle FROM marketing_campaigns
         WHERE campaign_type='generated' ORDER BY created_at DESC LIMIT 1`
    );
    const lastAngle = String(lastAngleRow.rows[0]?.angle || "");

    // Candidate base products: real catalog products only, oldest
    // last-generated first (never-generated first). Excluded:
    // - products generated within the last 30 days (per-product cooldown)
    // - products with a live 'queued' generation reservation
    // - products whose original photo published via autopilot within
    //   the last 30 days (a poster variant right after the original
    //   post would look repetitive to the audience)
    // - products whose original photo is already in a waiting
    //   autopilot campaign (same photo about to go out)
    const candidates = await pool.query(
        `SELECT p.product_id,p.name,p.slug,p.price,p.image_url,p.image_urls
         FROM products p
         JOIN collection_products cp ON cp.product_id=p.product_id
         JOIN collections col ON col.id=cp.collection_id AND col.is_active=TRUE
         WHERE p.is_active=TRUE
           AND p.price > 0
           AND NULLIF(BTRIM(p.name), '') IS NOT NULL
           AND p.name !~* '(^|[^a-z])(test|sample|demo|placeholder)([^a-z]|$)'
           AND NULLIF(BTRIM(COALESCE(p.image_url, p.image_urls->>0, '')), '') IS NOT NULL
           AND COALESCE(p.image_url, p.image_urls->>0, '') LIKE '%res.cloudinary.com%'
           AND NOT EXISTS (
             SELECT 1 FROM marketing_generated_creatives g
             WHERE g.product_id=p.product_id::text AND g.status='consumed'
               AND g.consumed_at >= NOW() - INTERVAL '30 days'
           )
           AND NOT EXISTS (
             SELECT 1 FROM marketing_generated_creatives g
             JOIN marketing_campaigns mc ON mc.id = g.campaign_id
             WHERE g.product_id=p.product_id::text AND g.status='queued'
               AND mc.autopilot_enabled=TRUE AND mc.next_run_at IS NOT NULL
           )
           AND NOT EXISTS (
             SELECT 1 FROM marketing_campaign_runs r
             JOIN marketing_campaigns mc ON mc.id = r.campaign_id
             WHERE r.run_type='autopilot' AND r.published=TRUE
               AND r.created_at >= NOW() - INTERVAL '30 days'
               AND (mc.results->'assets'->>'imageUrl') = NULLIF(BTRIM(COALESCE(p.image_url, p.image_urls->>0, '')), '')
           )
           AND NOT EXISTS (
             SELECT 1 FROM marketing_campaigns mc
             WHERE mc.autopilot_enabled=TRUE AND mc.next_run_at IS NOT NULL
               AND (mc.results->'assets'->>'imageUrl') = NULLIF(BTRIM(COALESCE(p.image_url, p.image_urls->>0, '')), '')
           )
         ORDER BY (
           SELECT MAX(g.consumed_at) FROM marketing_generated_creatives g
           WHERE g.product_id=p.product_id::text AND g.status='consumed'
         ) ASC NULLS FIRST, p.created_at ASC
         LIMIT 10`
    );
    if (!candidates.rows[0]) {
        return { queued: false, reason: "No catalog product is eligible for a generated poster right now." };
    }

    const month = chicagoMonth();
    const year = chicagoYear();
    const angles = eligibleAngles(month);
    let lastVerifyError = "";
    for (const product of candidates.rows) {
        const productId = String(product.product_id);
        const productName = String(product.name || "New product");
        const imageUrls = Array.isArray(product.image_urls) ? product.image_urls.filter(Boolean) : [];
        const baseImage = String(product.image_url || imageUrls[0] || "").trim();
        if (!baseImage) continue;

        // Variety rule 2: a variant (template:angle:year) used within
        // 90 days is not regenerated for this product, so the same
        // poster never repeats inside a season. 'consumed' rows are
        // published posters; 'queued' rows count too, so deleting a
        // generated campaign cannot resurrect its identical poster
        // (other angles stay available). 'released' rows (blocked
        // campaigns that never published) do not block. Annual
        // rotation stays possible because the year is part of the key.
        const consumedKeys = await pool.query(
            `SELECT variant_key FROM marketing_generated_creatives
             WHERE product_id=$1 AND status IN ('consumed','queued') AND created_at >= NOW() - INTERVAL '90 days'`,
            [productId]
        );
        const usedKeys = new Set(consumedKeys.rows.map((row: any) => String(row.variant_key)));
        const angle = angles.find((candidate) => candidate.key !== lastAngle && !usedKeys.has(`poster:${candidate.key}:${year}`));
        if (!angle) continue;

        const posterUrl = buildPosterUrl(baseImage, angle.headline);
        if (!posterUrl) continue;

        // Verify the transformed URL actually renders BEFORE inserting
        // the campaign. Transforms are computed on delivery, so a bad
        // parameter set must be caught here, not at publish time.
        let verified = false;
        try {
            const head = await fetch(posterUrl, { method: "HEAD" });
            verified = head.ok;
            if (!verified) {
                const get = await fetch(posterUrl);
                verified = get.ok;
            }
        } catch (error) {
            lastVerifyError = error instanceof Error ? error.message : "Poster verification failed.";
            verified = false;
        }
        if (!verified) {
            lastVerifyError = `Poster URL did not verify for ${productName}.`;
            continue;
        }

        const variantKey = `poster:${angle.key}:${year}`;
        const campaignId = `generated-${productId}-${Date.now()}`;
        const link = productLink(String(product.slug || productId));
        const now = new Date();
        const message = [
            `✨ ${productName} ✨`,
            "🎁 A personalized gift made just for you.",
            "💬 Who would you gift this to? Tell us in the comments!",
            "👇 Order yours here:",
            "https://www.jqydesigns.com/",
            ORDER_WHATSAPP_LINE,
            "#JQYDesigns #PersonalizedGifts #CustomDesign",
        ].join("\n\n");

        await pool.query(
            `INSERT INTO marketing_campaigns
              (id,name,objective,target_area,message,subject,channels,results,idempotency_key,owner_user_id,autopilot_enabled,next_run_at,campaign_type,recurrence_hours)
             VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9,$10,TRUE,$11,'generated',12)`,
            [
                campaignId,
                `Generated · ${productName}`,
                "Seasonal advertising poster",
                "Houston, Texas + United States",
                message,
                `New poster · ${productName}`,
                JSON.stringify(PUBLIC_CHANNELS),
                JSON.stringify({
                    social: {},
                    google: {
                        status: "tracking_only",
                        message: "Generated poster promotion will be measured through Google Analytics/Search Console.",
                        focus: ["custom mugs Houston", "personalized gifts Houston", productName],
                    },
                    assets: {
                        imageUrl: posterUrl,
                        videoUrl: undefined,
                        landingLink: link,
                        generated: {
                            baseProductId: productId,
                            baseProductName: productName,
                            variantKey,
                            angle: angle.key,
                            generatedAt: now.toISOString(),
                        },
                    },
                    source: {
                        type: "generated",
                        productId,
                        productSlug: String(product.slug || ""),
                        productName,
                        baseImageUrl: baseImage,
                    },
                    autopilot: { enabled: true, queued: true, source: "generated" },
                }),
                `generated:${productId}:${variantKey}:${Date.now()}`,
                ownerUserId,
                now,
            ]
        );

        await pool.query(
            `INSERT INTO marketing_generated_creatives (id,product_id,variant_key,image_url,status,campaign_id)
             VALUES ($1,$2,$3,$4,'queued',$5)`,
            [randomUUID(), productId, variantKey, posterUrl, campaignId]
        );

        return { queued: true, campaignId, productId, productName, variantKey, angle: angle.key, imageUrl: posterUrl };
    }

    return { queued: false, reason: lastVerifyError || "No catalog product has an unused seasonal angle right now." };
}
