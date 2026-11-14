/**
 * Marketing SEO Learning — el robot también aprende de Google (2026-11-14)
 *
 * Orden del dueño: el robot tiene que aprender del SEO de Google, no solo
 * de las redes. Google ya está conectado en este servidor (Search Console
 * con cuenta de servicio y GA4), así que este servicio no conecta nada
 * nuevo: verifica el acceso en vivo e ingiere la evidencia real —
 * consultas que la gente busca, clics, impresiones, CTR, posiciones y las
 * páginas/productos más buscados y visitados — como observaciones de
 * aprendizaje, con el mismo patrón que el aprendizaje social
 * (campañas "seo" sin autopilot: desde acá JAMÁS se publica ni se aplica
 * ningún cambio SEO; todo queda como evidencia para las propuestas).
 *
 * Lo que Google no entrega se guarda en cero: nunca se inventa.
 */
import { createHash } from "crypto";
import { pool } from "../config/database";
import { ensureMarketingLearningTables } from "./marketing-learning.service";
import {
  verifyGoogleIntegration,
  getSearchAnalyticsBreakdown,
  getAnalyticsTopPages,
} from "./google-search-console.service";

const TARGET_AREA = "Houston, Texas + United States";
const OBJECTIVE = "Google organic search learning";
const MAX_PAGE_OBSERVATIONS = 8;
const OPPORTUNITY_MIN_IMPRESSIONS = 20;
const LOW_CTR_THRESHOLD = 0.02;
const NOT_RANKING_POSITION = 10;

export type SeoOpportunity = {
  type: "low_ctr" | "not_ranking";
  page: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
  detail: string;
};

export type SeoInsights = {
  siteUrl: string;
  periodStart: string;
  periodEnd: string;
  totals: { clicks: number; impressions: number; ctr: number };
  topQueries: Array<{ key: string; clicks: number; impressions: number; ctr: number; position: number }>;
  topPages: Array<{ key: string; clicks: number; impressions: number; ctr: number; position: number }>;
  ga4TopPages: Array<{ pagePath: string; screenPageViews: number; sessions: number; conversions: number; totalRevenue: number }>;
  ga4Totals: { sessions: number; conversions: number; totalRevenue: number } | null;
  opportunities: SeoOpportunity[];
  syncedAt: string;
};

const dateDigits = (isoDate: string) => isoDate.replace(/-/g, "");
const hashOf = (value: string) => createHash("md5").update(value).digest("hex").slice(0, 10);

export async function ensureSeoTables() {
  await pool.query(`CREATE TABLE IF NOT EXISTS marketing_seo_snapshots (
    id BIGSERIAL PRIMARY KEY,
    owner_user_id TEXT NOT NULL,
    period_start TEXT NOT NULL,
    period_end TEXT NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(owner_user_id, period_end)
  )`);
}

function detectOpportunities(pages: SeoInsights["topPages"]): SeoOpportunity[] {
  const opportunities: SeoOpportunity[] = [];
  for (const page of pages) {
    if (page.impressions < OPPORTUNITY_MIN_IMPRESSIONS) continue;
    if (page.ctr < LOW_CTR_THRESHOLD) {
      opportunities.push({
        type: "low_ctr",
        page: page.key,
        impressions: page.impressions,
        clicks: page.clicks,
        ctr: page.ctr,
        position: page.position,
        detail: `La página aparece mucho en Google (${page.impressions} impresiones) pero casi nadie hace clic (CTR ${(page.ctr * 100).toFixed(1)}%, posición ${page.position.toFixed(1)}). Revisar título y descripción de esa página puede traer visitas gratis.`,
      });
    } else if (page.position > NOT_RANKING_POSITION) {
      opportunities.push({
        type: "not_ranking",
        page: page.key,
        impressions: page.impressions,
        clicks: page.clicks,
        ctr: page.ctr,
        position: page.position,
        detail: `La página ya aparece en Google (${page.impressions} impresiones) pero está en la posición ${page.position.toFixed(1)}: todavía no rankea en la primera página. Reforzar su contenido y su título la puede subir.`,
      });
    }
  }
  return opportunities.sort((a, b) => b.impressions - a.impressions).slice(0, 5);
}

async function ingestObservation(row: {
  campaignId: string;
  channel: string;
  clicks: number;
  sessions: number;
  conversions: number;
  revenue: number;
  impressions: number;
  attributionKey: string;
  evidence: boolean;
  observationDate: string;
  decision: Record<string, unknown>;
  adjustment: Record<string, unknown>;
}) {
  const now = new Date();
  await pool.query(
    `INSERT INTO marketing_learning_observations
       (campaign_id, channel, objective, target_area, hour, weekday, has_image, has_video, published,
        clicks, sessions, conversions, revenue, impressions,
        attribution_key, source, medium, attribution_evidence, observation_date, decision, adjustment)
     VALUES ($1,$2,$3,$4,$5,$6,FALSE,FALSE,TRUE,$7,$8,$9,$10,$11,$12,$13,'organic',$14,$15,$16::jsonb,$17::jsonb)
     ON CONFLICT (attribution_key) DO UPDATE SET
       clicks=EXCLUDED.clicks,
       sessions=EXCLUDED.sessions,
       conversions=EXCLUDED.conversions,
       revenue=EXCLUDED.revenue,
       impressions=EXCLUDED.impressions,
       attribution_evidence=EXCLUDED.attribution_evidence,
       decision=EXCLUDED.decision,
       adjustment=EXCLUDED.adjustment,
       updated_at=NOW()`,
    [
      row.campaignId, row.channel, OBJECTIVE, TARGET_AREA,
      now.getUTCHours(), now.getUTCDay(),
      row.clicks, row.sessions, row.conversions, row.revenue, row.impressions,
      row.attributionKey, row.channel, row.evidence, row.observationDate,
      JSON.stringify(row.decision), JSON.stringify(row.adjustment),
    ],
  );
}

async function upsertSeoCampaign(row: {
  id: string;
  name: string;
  message: string;
  channels: string[];
  results: Record<string, unknown>;
  ownerUserId: string;
}) {
  await pool.query(
    `INSERT INTO marketing_campaigns
       (id, name, objective, target_area, message, subject, channels, results, idempotency_key, owner_user_id, autopilot_enabled, next_run_at, campaign_type)
     VALUES ($1,$2,$3,$4,$5,NULL,$6::jsonb,$7::jsonb,$8,$9,FALSE,NULL,'seo')
     ON CONFLICT (id) DO UPDATE SET
       name=EXCLUDED.name,
       message=EXCLUDED.message,
       channels=EXCLUDED.channels,
       results=EXCLUDED.results`,
    [
      row.id, row.name, OBJECTIVE, TARGET_AREA, row.message.slice(0, 4000),
      JSON.stringify(row.channels), JSON.stringify(row.results),
      `seo:${row.id}`, row.ownerUserId,
    ],
  );
}

export async function syncSeoLearning(ownerUserId: string) {
  await ensureMarketingLearningTables();
  await ensureSeoTables();

  // Live verification first: nothing is ingested from an unverified source.
  const verification = await verifyGoogleIntegration();
  if (!verification.searchConsole.connected) {
    return {
      ownerUserId,
      observations: 0,
      error: verification.searchConsole.error || "Search Console is not connected.",
      verification: { searchConsole: verification.searchConsole.status, analytics: verification.analytics.status },
      syncedAt: new Date().toISOString(),
    };
  }

  const breakdown = await getSearchAnalyticsBreakdown(28);
  let ga4: Awaited<ReturnType<typeof getAnalyticsTopPages>> | null = null;
  let ga4Error: string | undefined;
  try {
    ga4 = await getAnalyticsTopPages(28);
  } catch (error) {
    ga4Error = error instanceof Error ? error.message : "GA4 top pages failed.";
  }

  const totals = {
    clicks: breakdown.queries.reduce((sum, row) => sum + row.clicks, 0),
    impressions: breakdown.pages.reduce((sum, row) => sum + row.impressions, 0),
    ctr: 0,
  };
  totals.ctr = totals.impressions > 0 ? Number((totals.clicks / totals.impressions).toFixed(4)) : 0;

  const insights: SeoInsights = {
    siteUrl: breakdown.siteUrl,
    periodStart: breakdown.startDate,
    periodEnd: breakdown.endDate,
    totals,
    topQueries: breakdown.queries,
    topPages: breakdown.pages,
    ga4TopPages: ga4?.rows || [],
    ga4Totals: ga4
      ? {
          sessions: ga4.rows.reduce((sum, row) => sum + row.sessions, 0),
          conversions: ga4.rows.reduce((sum, row) => sum + row.conversions, 0),
          totalRevenue: Number(ga4.rows.reduce((sum, row) => sum + row.totalRevenue, 0).toFixed(2)),
        }
      : null,
    opportunities: detectOpportunities(breakdown.pages),
    syncedAt: new Date().toISOString(),
  };

  await pool.query(
    `INSERT INTO marketing_seo_snapshots (owner_user_id, period_start, period_end, payload)
     VALUES ($1,$2,$3,$4::jsonb)
     ON CONFLICT (owner_user_id, period_end) DO UPDATE SET payload=EXCLUDED.payload, created_at=NOW()`,
    [ownerUserId, insights.periodStart, insights.periodEnd, JSON.stringify(insights)],
  );

  let observations = 0;
  const periodKey = dateDigits(insights.periodEnd);

  // Aggregate Search Console evidence.
  const aggregateId = `seo-gsc-${periodKey}`;
  await upsertSeoCampaign({
    id: aggregateId,
    name: `Google Search Console · ${insights.periodStart} → ${insights.periodEnd}`,
    message: `Consultas reales de Google (${insights.periodStart} a ${insights.periodEnd}): ${insights.topQueries.slice(0, 5).map((q) => `"${q.key}"`).join(", ")}`,
    channels: ["google_search"],
    results: {
      source: { type: "seo", provider: "search_console", siteUrl: insights.siteUrl },
      seo: { totals: insights.totals, topQueries: insights.topQueries.slice(0, 10), topPages: insights.topPages.slice(0, 10), opportunities: insights.opportunities },
      autopilot: { enabled: false, source: "seo-learning" },
    },
    ownerUserId,
  });
  await ingestObservation({
    campaignId: aggregateId,
    channel: "google_search",
    clicks: totals.clicks,
    sessions: 0,
    conversions: 0,
    revenue: 0,
    impressions: totals.impressions,
    attributionKey: `seo:gsc:${insights.periodEnd}`,
    evidence: totals.impressions > 0 || totals.clicks > 0,
    observationDate: periodKey,
    decision: {
      stage: "RESULT",
      source: "search_console",
      siteUrl: insights.siteUrl,
      period: { start: insights.periodStart, end: insights.periodEnd },
      topQueries: insights.topQueries.slice(0, 5),
      topPages: insights.topPages.slice(0, 5),
      opportunities: insights.opportunities.slice(0, 3),
      observedAt: new Date().toISOString(),
    },
    adjustment: { stage: "ADJUSTMENT", ctr: totals.ctr, observedAt: new Date().toISOString() },
  });
  observations += 1;

  // Per-page Search Console evidence (the pages/products Google actually shows).
  for (const page of insights.topPages.slice(0, MAX_PAGE_OBSERVATIONS)) {
    const pageHash = hashOf(page.key);
    const campaignId = `seo-page-${pageHash}`;
    await upsertSeoCampaign({
      id: campaignId,
      name: `Google · ${page.key.replace(/^https?:\/\//, "").slice(0, 80)}`,
      message: `Página que Google muestra (${insights.periodStart} a ${insights.periodEnd}): ${page.impressions} impresiones, ${page.clicks} clics, CTR ${(page.ctr * 100).toFixed(1)}%, posición ${page.position.toFixed(1)}.`,
      channels: ["google_search"],
      results: {
        source: { type: "seo", provider: "search_console", page: page.key },
        seo: { page },
        autopilot: { enabled: false, source: "seo-learning" },
      },
      ownerUserId,
    });
    await ingestObservation({
      campaignId,
      channel: "google_search",
      clicks: page.clicks,
      sessions: 0,
      conversions: 0,
      revenue: 0,
      impressions: page.impressions,
      attributionKey: `seo:page:${insights.periodEnd}:${pageHash}`,
      evidence: page.impressions > 0 || page.clicks > 0,
      observationDate: periodKey,
      decision: {
        stage: "RESULT",
        source: "search_console",
        page: page.key,
        ctr: page.ctr,
        position: page.position,
        opportunity: insights.opportunities.find((item) => item.page === page.key) || null,
        observedAt: new Date().toISOString(),
      },
      adjustment: { stage: "ADJUSTMENT", ctr: page.ctr, position: page.position, observedAt: new Date().toISOString() },
    });
    observations += 1;
  }

  // GA4 evidence: the pages/products with the most real visits.
  if (ga4 && ga4.rows.length) {
    const ga4Id = `seo-ga4-${dateDigits(ga4.endDate)}`;
    await upsertSeoCampaign({
      id: ga4Id,
      name: `Google Analytics · ${ga4.startDate} → ${ga4.endDate}`,
      message: `Páginas más visitadas según GA4: ${ga4.rows.slice(0, 5).map((row) => `${row.pagePath} (${row.screenPageViews} vistas)`).join(", ")}`,
      channels: ["google_analytics"],
      results: {
        source: { type: "seo", provider: "google_analytics", propertyId: ga4.propertyId },
        seo: { topPages: ga4.rows, totals: insights.ga4Totals },
        autopilot: { enabled: false, source: "seo-learning" },
      },
      ownerUserId,
    });
    await ingestObservation({
      campaignId: ga4Id,
      channel: "google_analytics",
      clicks: 0,
      sessions: insights.ga4Totals?.sessions || 0,
      conversions: insights.ga4Totals?.conversions || 0,
      revenue: insights.ga4Totals?.totalRevenue || 0,
      impressions: 0,
      attributionKey: `seo:ga4:${ga4.endDate}`,
      evidence: (insights.ga4Totals?.sessions || 0) > 0 || (insights.ga4Totals?.conversions || 0) > 0,
      observationDate: dateDigits(ga4.endDate),
      decision: {
        stage: "RESULT",
        source: "google_analytics",
        period: { start: ga4.startDate, end: ga4.endDate },
        topPages: ga4.rows.slice(0, 8),
        observedAt: new Date().toISOString(),
      },
      adjustment: { stage: "ADJUSTMENT", observedAt: new Date().toISOString() },
    });
    observations += 1;
  }

  const topQuery = insights.topQueries[0];
  return {
    ownerUserId,
    observations,
    totals: insights.totals,
    topQueries: insights.topQueries.length,
    topPages: insights.topPages.length,
    ga4Pages: insights.ga4TopPages.length,
    ga4Error: ga4Error || null,
    opportunities: insights.opportunities,
    example: topQuery
      ? `La búsqueda real más fuerte del período es "${topQuery.key}": ${topQuery.impressions} impresiones, ${topQuery.clicks} clics, posición ${topQuery.position.toFixed(1)} en Google.`
      : null,
    verification: { searchConsole: verification.searchConsole.status, analytics: verification.analytics.status },
    syncedAt: new Date().toISOString(),
  };
}

export async function getSeoInsights(ownerUserId: string): Promise<SeoInsights | null> {
  await ensureSeoTables();
  const result = await pool.query<{ payload: SeoInsights }>(
    `SELECT payload FROM marketing_seo_snapshots WHERE owner_user_id=$1 ORDER BY period_end DESC LIMIT 1`,
    [ownerUserId],
  );
  return result.rows[0]?.payload || null;
}

/** Slugs of the products Google actually shows (from the top searched pages). */
export function seoSearchedSlugs(insights: SeoInsights | null): Set<string> {
  const slugs = new Set<string>();
  if (!insights) return slugs;
  for (const page of insights.topPages) {
    try {
      const url = new URL(page.key);
      const productParam = url.searchParams.get("product");
      if (productParam) { slugs.add(productParam); continue; }
      const segments = url.pathname.split("/").filter(Boolean);
      const last = segments[segments.length - 1];
      if (last && last !== "products" && last !== "portfolio") slugs.add(last);
    } catch { /* not a URL: ignore */ }
  }
  return slugs;
}

const STOP_WORDS = new Set(["the", "a", "an", "for", "with", "and", "gift", "gifts", "de", "la", "el", "para", "con", "personalized", "custom"]);

/** Real Google search queries that match a product (by meaningful words). */
export function seoQueriesForProduct(insights: SeoInsights | null, product: { name?: string; slug?: string }): string[] {
  if (!insights) return [];
  const nameTokens = new Set(
    String(product.name || "").toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length >= 3 && !STOP_WORDS.has(token)),
  );
  const matches: string[] = [];
  for (const query of insights.topQueries) {
    const queryTokens = query.key.toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length >= 3 && !STOP_WORDS.has(token));
    const overlap = queryTokens.filter((token) => nameTokens.has(token)).length;
    if (overlap >= 1 && queryTokens.length && overlap / queryTokens.length >= 0.5) matches.push(query.key);
    if (matches.length >= 3) break;
  }
  return matches;
}

/** Hashtags built from real search terms (never invented keywords). */
export function seoHashtags(queries: string[]): string {
  const tags: string[] = [];
  for (const query of queries) {
    const words = query.replace(/[^a-zA-Z0-9 ]/g, " ").split(/\s+/).filter((word) => word.length >= 3).slice(0, 4);
    if (!words.length) continue;
    const tag = "#" + words.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join("");
    if (!tags.includes(tag)) tags.push(tag);
    if (tags.length >= 4) break;
  }
  return tags.join(" ");
}
