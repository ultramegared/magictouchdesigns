/**
 * Marketing Proposals — modelo del dueño (2026-11-14)
 *
 * El robot trabaja como un asistente: observa el contexto (qué aprendió de
 * las campañas reales, qué día/temporada es, qué contenido nuevo hay) y
 * arma UNA propuesta completa por día: qué publicar, con su imagen, su
 * texto, el link de la página web y el link de WhatsApp.
 *
 * El robot NO publica solo. Publica únicamente dentro de una autorización
 * vigente del dueño:
 *  - "once": el dueño aprueba ESA propuesta y se publica esa sola.
 *  - "week": el dueño autoriza una semana; las propuestas de esa ventana
 *    se publican solas, una por día, hasta que la ventana vence.
 * Sin autorización, la propuesta espera (y vence al día siguiente).
 *
 * La publicación se materializa como una campaña normal del motor
 * existente (una sola vez: ends_at corto para que el motor no la repita),
 * así todo el camino de publicación, registro y aprendizaje ya probado se
 * reutiliza sin cambios.
 */
import { randomUUID } from "crypto";
import { pool } from "../config/database";
import { getConnections } from "./social-connections.service";
import { getMarketingLearningInsights } from "./marketing-learning.service";
import {
  evaluateProductPromotability,
  evaluatePortfolioPromotability,
  buildProductMessage,
  buildPortfolioMessage,
} from "./marketing-catalog.service";

const PUBLIC_SITE = process.env.FRONTEND_PUBLIC_URL?.trim() || "https://www.jqydesigns.com";
// WhatsApp del negocio JQYDesigns (+1 346-760-3007), para el link de contacto
// que acompaña cada propuesta.
const WHATSAPP_NUMBER = "13467603007";
const TARGET_AREA = "Houston, Texas + United States";
// Canales donde una propuesta puede salir como publicación pública.
// YouTube queda fuera hasta que su token reviva (revocado el 2026-11-14) y
// WhatsApp no es canal de publicación pública (es el link de contacto).
const PROPOSAL_CHANNELS = ["facebook", "instagram"] as const;

export type ProposalScope = "once" | "week";

const ensureProposalTables = async () => {
  // The weekly authorization window lives on the catalog autopilot row; make
  // sure its columns exist even if this service runs before the catalog one.
  await pool.query(`ALTER TABLE marketing_catalog_autopilot ADD COLUMN IF NOT EXISTS publish_enabled BOOLEAN NOT NULL DEFAULT FALSE`);
  await pool.query(`ALTER TABLE marketing_catalog_autopilot ADD COLUMN IF NOT EXISTS auto_publish_until TIMESTAMPTZ`);
  await pool.query(`CREATE TABLE IF NOT EXISTS marketing_proposals (
    id TEXT PRIMARY KEY,
    owner_user_id TEXT NOT NULL,
    proposal_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    scope TEXT,
    source_type TEXT NOT NULL,
    source_id TEXT NOT NULL,
    title TEXT NOT NULL,
    caption TEXT NOT NULL,
    image_url TEXT,
    product_link TEXT,
    whatsapp_link TEXT,
    channels JSONB NOT NULL DEFAULT '[]'::jsonb,
    occasion TEXT,
    reasoning JSONB NOT NULL DEFAULT '{}'::jsonb,
    materialized_campaign_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    decided_at TIMESTAMPTZ,
    UNIQUE(owner_user_id, proposal_date)
  )`);
  await pool.query(`CREATE INDEX IF NOT EXISTS marketing_proposals_owner_date_idx ON marketing_proposals(owner_user_id, proposal_date DESC)`);
};

const houstonNow = () => new Date(new Date().toLocaleString("en-US", { timeZone: "America/Chicago" }));

export const houstonDateKey = (date = new Date()) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);

const buildOccasion = () => {
  const now = houstonNow();
  const label = new Intl.DateTimeFormat("es-MX", { timeZone: "America/Chicago", weekday: "long", day: "numeric", month: "long" }).format(new Date());
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const weekday = now.getDay();
  let context = "Día de semana: publicación de presencia para que la tienda siga visible y sumando alcance.";
  if (month === 12 || (month === 11 && day >= 15)) {
    context = "Temporada navideña: la gente está buscando regalos personalizados; es el momento fuerte del catálogo.";
  } else if (weekday === 0 || weekday === 6) {
    context = "Fin de semana: más gente mirando redes y comprando regalos con tiempo.";
  } else if (month === 2 && day <= 14) {
    context = "Cerca de San Valentín: los regalos personalizados tienen demanda especial.";
  } else if (month === 5 && day <= 12) {
    context = "Cerca del Día de las Madres: fecha fuerte para regalos personalizados.";
  }
  return { label, context, occasion: `${label} · ${context}` };
};

const whatsappLink = (title: string, link: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hola, me interesa este producto: ${title}. ${link}`)}`;

type Candidate =
  | { type: "catalog"; product: any; decision: { eligible: boolean; score: number; reasons: string[] } }
  | { type: "portfolio"; item: any; decision: { eligible: boolean; score: number; reasons: string[] } };

async function pickCandidate(ownerUserId: string): Promise<Candidate | null> {
  // Never re-propose what was already proposed in the last 3 days.
  const recentExclusion = (alias: string, idExpr: string, sourceType: string) =>
    `AND NOT EXISTS (SELECT 1 FROM marketing_proposals mp
       WHERE mp.owner_user_id=$1 AND mp.source_type='${sourceType}'
         AND mp.source_id=${idExpr} AND mp.created_at >= NOW() - INTERVAL '3 days')`;

  const productResult = await pool.query(
    `SELECT p.product_id,p.name,p.slug,p.description,p.price,p.image_url,p.image_urls,p.features,p.created_at
     FROM products p
     JOIN collection_products cp ON cp.product_id=p.product_id
     JOIN collections col ON col.id=cp.collection_id AND col.is_active=TRUE
     WHERE p.is_active=TRUE
       AND p.price > 0
       AND NULLIF(BTRIM(p.name), '') IS NOT NULL
       AND p.name !~* '(^|[^a-z])(test|sample|demo|placeholder)([^a-z]|$)'
       AND NULLIF(BTRIM(COALESCE(p.image_url, p.image_urls->>0, '')), '') IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM marketing_catalog_promotions mcp WHERE mcp.product_id=p.product_id::text)
       AND NOT EXISTS (
         SELECT 1 FROM portfolio_items pi
         WHERE pi.is_active=TRUE
           AND NULLIF(BTRIM(COALESCE(pi.image_url,'')), '') = NULLIF(BTRIM(COALESCE(p.image_url, p.image_urls->>0, '')), '')
       )
       AND NOT EXISTS (
         SELECT 1 FROM marketing_campaigns mc
         WHERE mc.autopilot_enabled=TRUE AND mc.next_run_at IS NOT NULL
           AND (mc.results->'assets'->>'imageUrl') = NULLIF(BTRIM(COALESCE(p.image_url, p.image_urls->>0, '')), '')
       )
       ${recentExclusion("p", "p.product_id::text", "catalog")}
     ORDER BY p.created_at ASC
     LIMIT 5`,
    [ownerUserId],
  );
  for (const product of productResult.rows) {
    const decision = await evaluateProductPromotability(product);
    if (decision.eligible) return { type: "catalog", product, decision };
  }

  const portfolioResult = await pool.query(
    `SELECT p.portfolio_id,p.image_url,p.title_en,p.description_en,p.characteristics_en,p.created_at
     FROM portfolio_items p
     WHERE p.is_active=TRUE
       AND NULLIF(BTRIM(COALESCE(p.image_url,'')), '') IS NOT NULL
       AND NULLIF(BTRIM(COALESCE(p.title_en,'')), '') IS NOT NULL
       AND p.title_en !~* '(^|[^a-z])(test|sample|demo|placeholder|completed work)([^a-z]|$)'
       AND (
         NOT EXISTS (SELECT 1 FROM marketing_portfolio_promotions mpp WHERE mpp.portfolio_id=p.portfolio_id::text)
         OR EXISTS (
           SELECT 1 FROM marketing_portfolio_promotions mpp
           WHERE mpp.portfolio_id=p.portfolio_id::text
             AND COALESCE(mpp.last_promoted_at, mpp.created_at) <= NOW() - INTERVAL '7 days'
         )
       )
       ${recentExclusion("p", "p.portfolio_id::text", "portfolio")}
     ORDER BY p.created_at ASC
     LIMIT 5`,
    [ownerUserId],
  );
  for (const item of portfolioResult.rows) {
    const decision = await evaluatePortfolioPromotability(item);
    if (decision.eligible) return { type: "portfolio", item, decision };
  }
  return null;
}

async function proposalChannels(ownerUserId: string) {
  const connections = await getConnections(ownerUserId).catch(() => null);
  const available = PROPOSAL_CHANNELS.filter((channel) => Boolean((connections as any)?.channels?.[channel]));
  let recommended: string | null = null;
  let scores: Record<string, number> = {};
  try {
    const insights = await getMarketingLearningInsights(undefined, undefined, ownerUserId);
    scores = Object.fromEntries(insights.map((row: any) => [row.channel, Number(row.score || 0)]));
    const ranked = [...available].sort((a, b) => (scores[b] || 0) - (scores[a] || 0));
    recommended = ranked[0] || null;
    return { channels: ranked, recommended, scores };
  } catch {
    return { channels: [...available], recommended: available[0] || null, scores };
  }
}

export async function generateDailyProposal(ownerUserId: string) {
  await ensureProposalTables();
  const state = await pool.query(`SELECT enabled FROM marketing_catalog_autopilot WHERE owner_user_id=$1 LIMIT 1`, [ownerUserId]);
  if (!state.rows[0] || state.rows[0].enabled !== true) {
    return { generated: false, reason: "The robot is off; no proposal was prepared." };
  }
  const today = houstonDateKey();
  // Yesterday's unanswered proposals expire: without authorization, nothing moves.
  await pool.query(
    `UPDATE marketing_proposals SET status='expired' WHERE owner_user_id=$1 AND status='pending' AND proposal_date < $2`,
    [ownerUserId, today],
  );
  const existing = await pool.query(`SELECT * FROM marketing_proposals WHERE owner_user_id=$1 AND proposal_date=$2 LIMIT 1`, [ownerUserId, today]);
  if (existing.rows[0]) return { generated: false, existing: true, proposal: existing.rows[0] };

  const candidate = await pickCandidate(ownerUserId);
  if (!candidate) return { generated: false, reason: "No eligible new content to propose today." };

  const { channels, recommended, scores } = await proposalChannels(ownerUserId);
  const { occasion, context } = buildOccasion();

  let title: string;
  let caption: string;
  let imageUrl: string | undefined;
  let link: string;
  let sourceId: string;
  if (candidate.type === "catalog") {
    const product = candidate.product;
    title = String(product.name || "Personalized design");
    caption = buildProductMessage(product);
    const imageUrls = Array.isArray(product.image_urls) ? product.image_urls.filter(Boolean) : [];
    imageUrl = String(product.image_url || imageUrls[0] || "").trim() || undefined;
    link = `${PUBLIC_SITE.replace(/\/$/, "")}/products?product=${encodeURIComponent(String(product.slug || product.product_id))}`;
    sourceId = String(product.product_id);
  } else {
    const item = candidate.item;
    title = String(item.title_en || "Custom work");
    caption = buildPortfolioMessage(item);
    imageUrl = String(item.image_url || "").trim() || undefined;
    link = `${PUBLIC_SITE.replace(/\/$/, "")}/portfolio`;
    sourceId = String(item.portfolio_id);
  }

  const proposal = {
    id: `prop-${today}-${randomUUID().slice(0, 8)}`,
    owner_user_id: ownerUserId,
    proposal_date: today,
    status: "pending",
    scope: null as string | null,
    source_type: candidate.type,
    source_id: sourceId,
    title,
    caption,
    image_url: imageUrl || null,
    product_link: link,
    whatsapp_link: whatsappLink(title, link),
    channels,
    occasion,
    reasoning: {
      context,
      candidateScore: candidate.decision.score,
      candidateReasons: candidate.decision.reasons,
      recommendedChannel: recommended,
      channelScores: scores,
      rule: "One proposal per day. It publishes only with the owner's authorization (once, or inside an approved weekly window).",
    },
  };

  await pool.query(
    `INSERT INTO marketing_proposals
       (id, owner_user_id, proposal_date, status, scope, source_type, source_id, title, caption, image_url, product_link, whatsapp_link, channels, occasion, reasoning)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$14,$15::jsonb)`,
    [
      proposal.id, proposal.owner_user_id, proposal.proposal_date, proposal.status, proposal.scope,
      proposal.source_type, proposal.source_id, proposal.title, proposal.caption, proposal.image_url,
      proposal.product_link, proposal.whatsapp_link, JSON.stringify(proposal.channels), proposal.occasion,
      JSON.stringify(proposal.reasoning),
    ],
  );
  return { generated: true, proposal };
}

export async function getTodayProposal(ownerUserId: string) {
  await ensureProposalTables();
  const result = await pool.query(
    `SELECT * FROM marketing_proposals WHERE owner_user_id=$1 AND proposal_date=$2 LIMIT 1`,
    [ownerUserId, houstonDateKey()],
  );
  return result.rows[0] || null;
}

export async function listProposals(ownerUserId: string, limit = 14) {
  await ensureProposalTables();
  const result = await pool.query(
    `SELECT * FROM marketing_proposals WHERE owner_user_id=$1 ORDER BY proposal_date DESC LIMIT $2`,
    [ownerUserId, Math.max(1, Math.min(60, limit))],
  );
  return result.rows;
}

async function materializeProposal(ownerUserId: string, proposal: any, scope: ProposalScope) {
  if (proposal.materialized_campaign_id) {
    return { campaignId: String(proposal.materialized_campaign_id), alreadyMaterialized: true };
  }
  const campaignId = `proposal-${proposal.id}`;
  const isCatalog = proposal.source_type === "catalog";
  const now = new Date();
  const endsAt = new Date(now.getTime() + 6 * 60 * 60 * 1000);
  await pool.query(
    `INSERT INTO marketing_campaigns
       (id,name,objective,target_area,message,subject,channels,results,idempotency_key,owner_user_id,autopilot_enabled,next_run_at,campaign_type,recurrence_hours,ends_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9,$10,TRUE,$11,'proposal',12,$12)
     ON CONFLICT (id) DO NOTHING`,
    [
      campaignId,
      `Propuesta · ${proposal.title}`,
      isCatalog ? "New product launch" : "Portfolio awareness and lead generation",
      TARGET_AREA,
      proposal.caption,
      `JQYDesigns · ${proposal.title}`,
      JSON.stringify(proposal.channels || []),
      JSON.stringify({
        social: {},
        google: { status: "tracking_only", message: "Proposal publication will be measured through Google Analytics/Search Console." },
        assets: { imageUrl: proposal.image_url || undefined, videoUrl: undefined, landingLink: proposal.product_link },
        source: { type: "proposal", proposalId: proposal.id, sourceType: proposal.source_type, sourceId: proposal.source_id },
        autopilot: { enabled: true, queued: true, source: "proposal", scope },
      }),
      `proposal:${proposal.id}`,
      ownerUserId,
      now,
      endsAt,
    ],
  );
  // The house dedup rule: once approved for publication, the item counts as
  // promoted so the robot never proposes/publishes it again on its own.
  if (isCatalog) {
    await pool.query(
      `INSERT INTO marketing_catalog_promotions (product_id,campaign_id,product_name,last_promoted_at,promotion_count)
       VALUES ($1,$2,$3,NOW(),1)
       ON CONFLICT (product_id) DO UPDATE SET campaign_id=EXCLUDED.campaign_id, product_name=EXCLUDED.product_name, last_promoted_at=NOW(), promotion_count=marketing_catalog_promotions.promotion_count+1`,
      [proposal.source_id, campaignId, proposal.title],
    );
  } else {
    await pool.query(
      `INSERT INTO marketing_portfolio_promotions (portfolio_id,campaign_id,title,last_promoted_at,promotion_count)
       VALUES ($1,$2,$3,NOW(),1)
       ON CONFLICT (portfolio_id) DO UPDATE SET campaign_id=EXCLUDED.campaign_id, title=EXCLUDED.title, last_promoted_at=NOW(), promotion_count=marketing_portfolio_promotions.promotion_count+1`,
      [proposal.source_id, campaignId, proposal.title],
    );
  }
  await pool.query(
    `UPDATE marketing_proposals SET status='approved', scope=$2, decided_at=NOW(), materialized_campaign_id=$3 WHERE id=$1`,
    [proposal.id, scope, campaignId],
  );
  return { campaignId, alreadyMaterialized: false };
}

export async function approveProposal(ownerUserId: string, proposalId: string, scope: ProposalScope) {
  await ensureProposalTables();
  const result = await pool.query(`SELECT * FROM marketing_proposals WHERE id=$1 AND owner_user_id=$2 LIMIT 1`, [proposalId, ownerUserId]);
  const proposal = result.rows[0];
  if (!proposal) throw new Error("Proposal not found for this Marketing account.");
  if (proposal.status !== "pending") throw new Error(`Proposal is ${proposal.status}; only a pending proposal can be approved.`);
  if (!(proposal.channels || []).length) throw new Error("Proposal has no connected channel to publish to.");

  let autoPublishUntil: string | null = null;
  if (scope === "week") {
    const updated = await pool.query(
      `UPDATE marketing_catalog_autopilot
       SET publish_enabled=TRUE, auto_publish_until=NOW() + INTERVAL '7 days', updated_at=NOW()
       WHERE owner_user_id=$1
       RETURNING auto_publish_until`,
      [ownerUserId],
    );
    autoPublishUntil = updated.rows[0]?.auto_publish_until ?? null;
  }
  const materialized = await materializeProposal(ownerUserId, proposal, scope);
  return { approved: true, scope, proposalId, autoPublishUntil, ...materialized };
}

export async function rejectProposal(ownerUserId: string, proposalId: string) {
  await ensureProposalTables();
  const result = await pool.query(
    `UPDATE marketing_proposals SET status='rejected', decided_at=NOW()
     WHERE id=$1 AND owner_user_id=$2 AND status='pending' RETURNING id`,
    [proposalId, ownerUserId],
  );
  if (!result.rows[0]) throw new Error("Proposal not found or no longer pending.");
  return { rejected: true, proposalId };
}

export async function closeExpiredWeeklyWindow(ownerUserId: string) {
  const result = await pool.query(
    `UPDATE marketing_catalog_autopilot
     SET publish_enabled=FALSE, auto_publish_until=NULL, updated_at=NOW()
     WHERE owner_user_id=$1 AND publish_enabled=TRUE AND auto_publish_until IS NOT NULL AND auto_publish_until <= NOW()
     RETURNING owner_user_id`,
    [ownerUserId],
  );
  return { closed: Boolean(result.rows[0]) };
}

export async function runDailyProposals(ownerUserId: string) {
  await ensureProposalTables();
  const closed = await closeExpiredWeeklyWindow(ownerUserId);
  const generated = await generateDailyProposal(ownerUserId);
  let autoPublished: { campaignId: string } | null = null;
  const proposal: any = (generated as any).proposal || null;
  if (proposal && proposal.status === "pending") {
    const state = await pool.query(`SELECT publish_enabled FROM marketing_catalog_autopilot WHERE owner_user_id=$1 LIMIT 1`, [ownerUserId]);
    if (state.rows[0]?.publish_enabled === true && (proposal.channels || []).length) {
      const materialized = await materializeProposal(ownerUserId, proposal, "week");
      autoPublished = { campaignId: materialized.campaignId };
    }
  }
  return {
    windowClosed: closed.closed,
    generated: Boolean((generated as any).generated),
    existing: Boolean((generated as any).existing),
    reason: (generated as any).reason || null,
    proposalId: proposal?.id || null,
    proposalStatus: autoPublished ? "approved" : proposal?.status || null,
    autoPublished,
  };
}
