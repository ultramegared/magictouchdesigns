import { pool } from "../config/database";
import { getActivePortfolio } from "./portfolio.service";

const PUBLIC_SITE = process.env.FRONTEND_PUBLIC_URL?.trim() || "https://www.jqydesigns.com";
const PUBLIC_CHANNELS = ["facebook","instagram","tiktok","pinterest"] as const;

const ensureCatalogTables = async () => {
  await pool.query(`CREATE TABLE IF NOT EXISTS marketing_catalog_autopilot (
    owner_user_id TEXT PRIMARY KEY,
    enabled BOOLEAN NOT NULL DEFAULT FALSE,
    initialized_at TIMESTAMPTZ,
    last_scan_at TIMESTAMPTZ,
    last_product_id TEXT,
    last_product_name TEXT,
    last_campaign_id TEXT,
    last_run_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS marketing_catalog_promotions (
    product_id TEXT PRIMARY KEY,
    campaign_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_promoted_at TIMESTAMPTZ,
    promotion_count INTEGER NOT NULL DEFAULT 0
  )`);
  await pool.query(`ALTER TABLE marketing_catalog_promotions ADD COLUMN IF NOT EXISTS last_promoted_at TIMESTAMPTZ`);
  await pool.query(`ALTER TABLE marketing_catalog_promotions ADD COLUMN IF NOT EXISTS promotion_count INTEGER NOT NULL DEFAULT 0`);
  await pool.query(`CREATE INDEX IF NOT EXISTS marketing_catalog_promotions_campaign_idx ON marketing_catalog_promotions(campaign_id)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS marketing_catalog_promotions_due_idx ON marketing_catalog_promotions(last_promoted_at)`);
  await pool.query(`CREATE TABLE IF NOT EXISTS marketing_portfolio_promotions (
    portfolio_id TEXT PRIMARY KEY,
    campaign_id TEXT NOT NULL,
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_promoted_at TIMESTAMPTZ,
    promotion_count INTEGER NOT NULL DEFAULT 0
  )`);
  await pool.query(`CREATE INDEX IF NOT EXISTS marketing_portfolio_promotions_due_idx ON marketing_portfolio_promotions(last_promoted_at)`);
};

const ensureOwnerState = async (ownerUserId: string) => {
  await ensureCatalogTables();
  const result = await pool.query(`SELECT * FROM marketing_catalog_autopilot WHERE owner_user_id=$1 LIMIT 1`, [ownerUserId]);
  if (result.rows[0]) return result.rows[0];
  const created = await pool.query(
    `INSERT INTO marketing_catalog_autopilot (owner_user_id, enabled, initialized_at)
     VALUES ($1,FALSE,NOW()) RETURNING *`,
    [ownerUserId],
  );
  return created.rows[0];
};

export async function getCatalogAutopilotStatus(ownerUserId: string) {
  const state = await ensureOwnerState(ownerUserId);
  const pending = state.enabled && state.initialized_at
    ? await pool.query(
        `SELECT COUNT(*)::int AS count
         FROM products p
         WHERE p.is_active=TRUE
           AND NOT EXISTS (SELECT 1 FROM marketing_catalog_promotions mcp WHERE mcp.product_id=p.product_id::text)`,
      )
    : { rows: [{ count: 0 }] };
  return {
    enabled: Boolean(state.enabled),
    initializedAt: state.initialized_at,
    lastScanAt: state.last_scan_at,
    lastProductId: state.last_product_id,
    lastProductName: state.last_product_name,
    lastCampaignId: state.last_campaign_id,
    lastRunAt: state.last_run_at,
    pendingProducts: Number(pending.rows[0]?.count || 0),
  };
}

export async function setCatalogAutopilot(ownerUserId: string, enabled: boolean) {
  const state = await ensureOwnerState(ownerUserId);
  const initializedAt = enabled && !state.initialized_at ? new Date() : state.initialized_at;
  await pool.query(
    `UPDATE marketing_catalog_autopilot
     SET enabled=$2,
         initialized_at=COALESCE($3, initialized_at),
         updated_at=NOW()
     WHERE owner_user_id=$1`,
    [ownerUserId, enabled, initializedAt],
  );

  const status = await getCatalogAutopilotStatus(ownerUserId);
  if (!enabled) return status;

  // Activation performs the first real scan immediately. The cron continues
  // subsequent scans, but activation must not leave the user waiting for it.
  const scan = await queueNextCatalogProduct(ownerUserId);
  return {
    ...status,
    ...(scan.queued ? {
      lastProductId: scan.productId,
      lastProductName: scan.productName,
      lastCampaignId: scan.campaignId,
      lastScanAt: new Date().toISOString(),
    } : {}),
    scan,
  };
}

const productLink = (slug: string) => `${PUBLIC_SITE.replace(/\/$/, "")}/products?product=${encodeURIComponent(slug)}`;

type PromotionDecision = {
  eligible: boolean;
  score: number;
  reasons: string[];
};

const promotionHistory = async (sourceType: "catalog" | "portfolio", sourceId: string) => {
  const idField = sourceType === "catalog" ? "productId" : "portfolioId";
  const result = await pool.query(
    `SELECT COUNT(DISTINCT mc.id)::int AS campaigns,
            COALESCE(SUM(ml.sessions),0)::int AS sessions,
            COALESCE(SUM(ml.conversions),0)::int AS conversions,
            COALESCE(SUM(ml.revenue),0)::numeric AS revenue,
            COALESCE(AVG(CASE WHEN ml.published THEN 1 ELSE 0 END),0)::numeric AS success_rate
     FROM marketing_campaigns mc
     LEFT JOIN marketing_learning_observations ml ON ml.campaign_id=mc.id
     WHERE (mc.results->'source'->>'type')=$1
       AND (mc.results->'source'->>'${idField}')=$2`,
    [sourceType, sourceId],
  );
  return result.rows[0] || { campaigns: 0, sessions: 0, conversions: 0, revenue: 0, success_rate: 0 };
};

const evaluateProductPromotability = async (product: any): Promise<PromotionDecision> => {
  let score = 0;
  const reasons: string[] = [];
  const imageUrls = Array.isArray(product.image_urls) ? product.image_urls.filter(Boolean) : [];
  if (String(product.image_url || imageUrls[0] || "").trim()) { score += 30; reasons.push("has product image"); } else reasons.push("missing product image");
  if (String(product.name || "").trim().length >= 4) { score += 20; reasons.push("has usable product name"); } else reasons.push("weak product name");
  if (String(product.description || "").trim().length >= 30) { score += 15; reasons.push("has descriptive copy"); } else reasons.push("description is too short");
  const rawFeatures = product.features;
  if ((Array.isArray(rawFeatures) && rawFeatures.length) || (rawFeatures && typeof rawFeatures === "object" && Object.keys(rawFeatures).length)) { score += 10; reasons.push("has product characteristics"); }
  else reasons.push("no product characteristics");
  if (Number(product.price) > 0) { score += 10; reasons.push("has valid price"); } else reasons.push("missing valid price");
  if (product.is_active) score += 5;
  const ageDays = Math.max(0, (Date.now() - new Date(product.created_at || Date.now()).getTime()) / 86400000);
  if (ageDays <= 30) { score += 10; reasons.push("recent product"); }
  else if (ageDays <= 90) score += 5;
  const history = await promotionHistory("catalog", String(product.product_id));
  if (Number(history.campaigns) === 0) { score += 5; reasons.push("new promotion opportunity"); }
  else {
    const sessions = Number(history.sessions || 0);
    const conversions = Number(history.conversions || 0);
    const conversionRate = sessions > 0 ? conversions / sessions : 0;
    if (conversionRate >= 0.03) { score += 10; reasons.push("strong historical conversion"); }
    else if (conversionRate >= 0.01) { score += 5; reasons.push("positive historical conversion"); }
    else if (sessions >= 20 && conversions === 0) { score -= 10; reasons.push("weak historical conversion"); }
  }
  score = Math.max(0, Math.min(100, Math.round(score)));
  return { eligible: score >= 60, score, reasons };
};

const evaluatePortfolioPromotability = async (item: any): Promise<PromotionDecision> => {
  let score = 0;
  const reasons: string[] = [];
  if (String(item.image_url || "").trim()) { score += 35; reasons.push("has portfolio image"); } else reasons.push("missing portfolio image");
  if (String(item.title_en || "").trim().length >= 4) { score += 25; reasons.push("has portfolio title"); } else reasons.push("weak portfolio title");
  if (String(item.description_en || "").trim().length >= 30) { score += 20; reasons.push("has descriptive copy"); } else if (String(item.description_en || "").trim()) score += 8;
  else reasons.push("no description");
  if (String(item.characteristics_en || "").trim()) { score += 10; reasons.push("has work characteristics"); }
  const ageDays = Math.max(0, (Date.now() - new Date(item.created_at || Date.now()).getTime()) / 86400000);
  if (ageDays <= 30) { score += 10; reasons.push("recent work"); }
  else if (ageDays <= 90) score += 5;
  const history = await promotionHistory("portfolio", String(item.portfolio_id));
  if (Number(history.campaigns) === 0) { score += 5; reasons.push("new promotion opportunity"); }
  else {
    const sessions = Number(history.sessions || 0);
    const conversions = Number(history.conversions || 0);
    const conversionRate = sessions > 0 ? conversions / sessions : 0;
    if (conversionRate >= 0.03) { score += 10; reasons.push("strong historical conversion"); }
    else if (conversionRate >= 0.01) { score += 5; reasons.push("positive historical conversion"); }
    else if (sessions >= 20 && conversions === 0) { score -= 10; reasons.push("weak historical conversion"); }
  }
  score = Math.max(0, Math.min(100, Math.round(score)));
  return { eligible: score >= 60, score, reasons };
};

const buildProductMessage = (product: any) => {
  const description = String(product.description || "").replace(/\s+/g, " ").trim();
  const shortDescription = description.length > 120 ? `${description.slice(0,117)}...` : description;
  const price = Number(product.price || 0).toFixed(2);
  const rawFeatures = product.features;
  const features = Array.isArray(rawFeatures)
    ? rawFeatures.filter(Boolean).slice(0, 5).join(" · ")
    : rawFeatures && typeof rawFeatures === "object"
      ? Object.entries(rawFeatures).slice(0, 5).map(([key, value]) => `${key}: ${String(value)}`).join(" · ")
      : "";
  return [
    "✨ New at JQYDesigns",
    `**${String(product.name || "New product")}**`,
    shortDescription || "Personalized design made by JQYDesigns.",
    features ? `Details: ${features}` : "",
    `Only ${price}`,
    "Shop now and discover the full design.",
  ].filter(Boolean).join("\n\n");
};

export async function queueNextCatalogProduct(ownerUserId: string) {
  const state = await ensureOwnerState(ownerUserId);
  if (!state.enabled || !state.initialized_at) return { queued: false, reason: "Catalog Autopilot is disabled." };

  const existingQueued = await pool.query(
    `SELECT id FROM marketing_campaigns
     WHERE owner_user_id=$1 AND autopilot_enabled=TRUE
       AND next_run_at IS NOT NULL AND next_run_at >= NOW() - INTERVAL '6 hours'
       AND (results->'source'->>'type')='catalog'
     LIMIT 1`,
    [ownerUserId],
  );
  if (existingQueued.rows[0]) return { queued: false, reason: "A catalog promotion is already queued.", campaignId: existingQueued.rows[0].id };

  const productResult = await pool.query(
    `SELECT p.product_id,p.name,p.slug,p.description,p.price,p.image_url,p.image_urls,p.features,p.created_at
     FROM products p
     WHERE p.is_active=TRUE
       AND (
         NOT EXISTS (SELECT 1 FROM marketing_catalog_promotions mcp WHERE mcp.product_id=p.product_id::text)
         OR EXISTS (
           SELECT 1 FROM marketing_catalog_promotions mcp
           WHERE mcp.product_id=p.product_id::text
             AND COALESCE(mcp.last_promoted_at, mcp.created_at) <= NOW() - INTERVAL '7 days'
         )
       )
       AND NOT EXISTS (
         SELECT 1 FROM marketing_campaigns mc
         WHERE mc.owner_user_id=$1
           AND (mc.results->'source'->>'type')='catalog'
           AND (mc.results->'source'->>'productId')=p.product_id::text
           AND mc.autopilot_enabled=TRUE
           AND mc.next_run_at IS NOT NULL
           AND mc.next_run_at > NOW()
       )
     ORDER BY
       CASE WHEN NOT EXISTS (SELECT 1 FROM marketing_catalog_promotions mcp WHERE mcp.product_id=p.product_id::text) THEN 0 ELSE 1 END,
       p.created_at ASC
     LIMIT 1`,
    [ownerUserId],
  );
  const product = productResult.rows[0];
  await pool.query(`UPDATE marketing_catalog_autopilot SET last_scan_at=NOW(), updated_at=NOW() WHERE owner_user_id=$1`, [ownerUserId]);
  if (!product) return { queued: false, reason: "No new unpromoted product found." };
  const decision = await evaluateProductPromotability(product);
  if (!decision.eligible) return { queued: false, reason: "Product was evaluated but is not strong enough to promote yet.", productId: String(product.product_id), productName: String(product.name || ""), decision };

  const imageUrls = Array.isArray(product.image_urls) ? product.image_urls.filter(Boolean) : [];
  const imageUrl = String(product.image_url || imageUrls[0] || "").trim() || undefined;
  const campaignId = `catalog-${product.product_id}-${Date.now()}`;
  const link = productLink(String(product.slug || product.product_id));
  const message = buildProductMessage(product);
  const now = new Date();

  await pool.query(
    `INSERT INTO marketing_campaigns
      (id,name,objective,target_area,message,subject,channels,results,idempotency_key,owner_user_id,autopilot_enabled,next_run_at,campaign_type,recurrence_hours)
     VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9,$10,TRUE,$11,'catalog',6)`,
    [
      campaignId,
      `Catalog · ${String(product.name || "New product")}`,
      "New product launch",
      "Houston, Texas + United States",
      message,
      `New at JQYDesigns · ${String(product.name || "New product")}`,
      JSON.stringify(imageUrl ? [...PUBLIC_CHANNELS] : ["facebook"]),
      JSON.stringify({
        social: {},
        google: {
          status: "tracking_only",
          message: "Catalog product promotion will be measured through Google Analytics/Search Console.",
          focus: ["custom mugs Houston", "personalized gifts Houston", String(product.name || "")],
        },
        assets: { imageUrl, videoUrl: undefined, landingLink: link },
        source: {
          type: "catalog",
          productId: String(product.product_id),
          productSlug: String(product.slug || ""),
          productName: String(product.name || ""),
          price: Number(product.price || 0),
          decision,
        },
        autopilot: { enabled: true, queued: true, source: "catalog" },
      }),
      `catalog:${product.product_id}:${Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000))}`,
      ownerUserId,
      now,
    ],
  );

  await pool.query(
    `INSERT INTO marketing_catalog_promotions (product_id,campaign_id,product_name,last_promoted_at,promotion_count)
     VALUES ($1,$2,$3,NOW(),1)
     ON CONFLICT (product_id) DO UPDATE SET campaign_id=EXCLUDED.campaign_id, product_name=EXCLUDED.product_name, last_promoted_at=NOW(), promotion_count=marketing_catalog_promotions.promotion_count+1`,
    [String(product.product_id), campaignId, String(product.name || "New product")],
  );
  await pool.query(
    `UPDATE marketing_catalog_autopilot
     SET last_product_id=$2,last_product_name=$3,last_campaign_id=$4,last_scan_at=NOW(),updated_at=NOW()
     WHERE owner_user_id=$1`,
    [ownerUserId, String(product.product_id), String(product.name || "New product"), campaignId],
  );
  return { queued: true, campaignId, productId: String(product.product_id), productName: String(product.name || "New product"), decision };
}

export async function getCatalogOwners() {
  await ensureCatalogTables();
  const result = await pool.query(`SELECT owner_user_id FROM marketing_catalog_autopilot WHERE enabled=TRUE`);
  return result.rows.map((row: any) => String(row.owner_user_id));
}



const buildPortfolioMessage = (item: any) => {
  const description = String(item.description_en || "").replace(/\s+/g, " ").trim();
  const characteristics = String(item.characteristics_en || "").replace(/\s+/g, " ").trim();
  return [
    "✨ Featured work by JQYDesigns",
    `**${String(item.title_en || "Custom work")}**`,
    description.length > 180 ? `${description.slice(0,177)}...` : description,
    characteristics ? `Details: ${characteristics}` : "",
    "See more of our work and request your own custom design.",
  ].filter(Boolean).join("\n\n");
};

export async function queueNextPortfolioWork(ownerUserId: string) {
  const state = await ensureOwnerState(ownerUserId);
  if (!state.enabled || !state.initialized_at) return { queued: false, reason: "Content Autopilot is disabled." };

  const existingQueued = await pool.query(
    `SELECT id FROM marketing_campaigns
     WHERE owner_user_id=$1 AND autopilot_enabled=TRUE
       AND next_run_at IS NOT NULL AND next_run_at >= NOW() - INTERVAL '6 hours'
       AND (results->'source'->>'type')='portfolio'
     LIMIT 1`,
    [ownerUserId],
  );
  if (existingQueued.rows[0]) return { queued: false, reason: "A portfolio promotion is already queued.", campaignId: existingQueued.rows[0].id };

  const result = await pool.query(
    `SELECT p.portfolio_id,p.image_url,p.title_en,p.description_en,p.characteristics_en,p.created_at
     FROM portfolio_items p
     WHERE p.is_active=TRUE
       AND (
         NOT EXISTS (SELECT 1 FROM marketing_portfolio_promotions mpp WHERE mpp.portfolio_id=p.portfolio_id::text)
         OR EXISTS (
           SELECT 1 FROM marketing_portfolio_promotions mpp
           WHERE mpp.portfolio_id=p.portfolio_id::text
             AND COALESCE(mpp.last_promoted_at,mpp.created_at) <= NOW() - INTERVAL '7 days'
         )
       )
       AND NOT EXISTS (
         SELECT 1 FROM marketing_campaigns mc
         WHERE mc.owner_user_id=$1
           AND (mc.results->'source'->>'type')='portfolio'
           AND (mc.results->'source'->>'portfolioId')=p.portfolio_id::text
           AND mc.autopilot_enabled=TRUE
           AND mc.next_run_at IS NOT NULL
           AND mc.next_run_at >= NOW() - INTERVAL '6 hours'
       )
     ORDER BY
       CASE WHEN NOT EXISTS (SELECT 1 FROM marketing_portfolio_promotions mpp WHERE mpp.portfolio_id=p.portfolio_id::text) THEN 0 ELSE 1 END,
       p.created_at ASC
     LIMIT 1`,
    [ownerUserId],
  );
  const item = result.rows[0];
  if (!item) return { queued: false, reason: "No portfolio work is due for promotion." };
  const decision = await evaluatePortfolioPromotability(item);
  if (!decision.eligible) return { queued: false, reason: "Portfolio work was evaluated but is not strong enough to promote yet.", portfolioId: String(item.portfolio_id), title: String(item.title_en || ""), decision };

  const campaignId = `portfolio-${item.portfolio_id}-${Date.now()}`;
  const link = `${PUBLIC_SITE.replace(/\/$/,"")}/portfolio`;
  const message = buildPortfolioMessage(item);
  const now = new Date();

  await pool.query(
    `INSERT INTO marketing_campaigns
      (id,name,objective,target_area,message,subject,channels,results,idempotency_key,owner_user_id,autopilot_enabled,next_run_at,campaign_type,recurrence_hours)
     VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9,$10,TRUE,$11,'portfolio',6)`,
    [
      campaignId,
      `Portfolio · ${String(item.title_en || "Featured work")}`,
      "Portfolio awareness and lead generation",
      "Houston, Texas + United States",
      message,
      `Featured JQYDesigns work · ${String(item.title_en || "Custom work")}`,
      JSON.stringify(PUBLIC_CHANNELS),
      JSON.stringify({
        social: {},
        google: { status: "tracking_only", message: "Portfolio promotion will be measured through campaign analytics.", focus: ["custom mugs Houston", "custom gifts Houston", String(item.title_en || "")] },
        assets: { imageUrl: String(item.image_url || ""), videoUrl: undefined, landingLink: link },
        source: { type: "portfolio", portfolioId: String(item.portfolio_id), portfolioTitle: String(item.title_en || ""), decision },
        autopilot: { enabled: true, queued: true, source: "portfolio" },
      }),
      `portfolio:${item.portfolio_id}:${Math.floor(Date.now()/(7*24*60*60*1000))}`,
      ownerUserId,
      now,
    ],
  );

  await pool.query(
    `INSERT INTO marketing_portfolio_promotions (portfolio_id,campaign_id,title,last_promoted_at,promotion_count)
     VALUES ($1,$2,$3,NOW(),1)
     ON CONFLICT (portfolio_id) DO UPDATE SET campaign_id=EXCLUDED.campaign_id,title=EXCLUDED.title,last_promoted_at=NOW(),promotion_count=marketing_portfolio_promotions.promotion_count+1`,
    [String(item.portfolio_id), campaignId, String(item.title_en || "Featured work")],
  );

  return { queued: true, campaignId, portfolioId: String(item.portfolio_id), title: String(item.title_en || "Featured work"), decision };
}

export async function getContentAutopilotStatus(ownerUserId: string) {
  const catalog = await getCatalogAutopilotStatus(ownerUserId);
  await ensureOwnerState(ownerUserId);

  let pendingPortfolio = 0;
  try {
    const portfolio = await pool.query(
      `SELECT COUNT(*)::int AS count FROM portfolio_items p
       WHERE p.is_active=TRUE
         AND (
           NOT EXISTS (SELECT 1 FROM marketing_portfolio_promotions mpp WHERE mpp.portfolio_id=p.portfolio_id::text)
           OR COALESCE((SELECT mpp.last_promoted_at FROM marketing_portfolio_promotions mpp WHERE mpp.portfolio_id=p.portfolio_id::text), 'epoch'::timestamptz) <= NOW() - INTERVAL '7 days'
         )`
    );
    pendingPortfolio = Number(portfolio.rows[0]?.count || 0);
  } catch (error) {
    console.error("Unable to read Content Autopilot portfolio status:", error);
  }

  return { ...catalog, pendingPortfolio };
}

export async function queueNextContent(ownerUserId: string) {
  const catalog = await queueNextCatalogProduct(ownerUserId);
  const portfolio = await queueNextPortfolioWork(ownerUserId);
  return { catalog, portfolio };
}
