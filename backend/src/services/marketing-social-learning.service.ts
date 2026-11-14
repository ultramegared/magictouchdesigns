/**
 * Marketing Social Learning — Fase 2 (2026-11-14)
 *
 * Hasta hoy el motor de aprendizaje solo recibía resultados vía GA4, y GA4
 * únicamente atribuye tráfico a campañas registradas en el panel: sin
 * campañas no había nada que aprender (el robot quedó en nivel 1).
 *
 * Este servicio conecta el aprendizaje con las campañas reales que el
 * negocio ya hace en sus redes: lee el rendimiento de las publicaciones
 * orgánicas de Instagram y de la Página de Facebook con las conexiones ya
 * autorizadas, registra cada publicación como una campaña "organic" (sin
 * autopilot: jamás se publica desde acá) y guarda sus resultados reales
 * (alcance/vistas, interacciones) como observaciones de aprendizaje.
 *
 * Datos que estas APIs NO entregan (clics a enlace por publicación, ventas)
 * se guardan en cero — nunca se inventan ni se infieren.
 */
import { pool } from "../config/database";
import { ensureMarketingLearningTables } from "./marketing-learning.service";
import { getAccessToken } from "./social-connections.service";

const META_VERSION = process.env.META_GRAPH_API_VERSION || "v26.0";
const TARGET_AREA = "Houston, Texas + United States";
const OBJECTIVE = "Organic social learning";
const MAX_ITEMS = 25;

type SocialMetrics = {
  views: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saved: number;
};

type SocialItem = {
  channel: "instagram" | "facebook";
  externalId: string;
  text: string;
  permalink?: string;
  imageUrl?: string;
  hasVideo: boolean;
  publishedAt: Date;
  metrics: SocialMetrics;
};

const zeroMetrics = (): SocialMetrics => ({ views: 0, reach: 0, likes: 0, comments: 0, shares: 0, saved: 0 });

async function graphJson(url: string, token: string): Promise<any> {
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || (data as any)?.error) {
    const detail = (data as any)?.error?.message || `Graph request failed (HTTP ${response.status}).`;
    const code = (data as any)?.error?.code ? ` (code ${(data as any).error.code})` : "";
    throw new Error(detail + code);
  }
  return data;
}

const metricValue = (metric: any): number => {
  if (!metric) return 0;
  if (metric.total_value && typeof metric.total_value.value === "number") return Number(metric.total_value.value) || 0;
  if (Array.isArray(metric.values)) {
    return metric.values.reduce((sum: number, entry: any) => {
      const value = entry?.value;
      if (typeof value === "number") return sum + value;
      if (value && typeof value === "object") {
        return sum + Object.values(value).reduce((inner: number, leaf: any) => inner + (typeof leaf === "number" ? leaf : 0), 0);
      }
      return sum;
    }, 0);
  }
  return 0;
};

const insightsToMap = (data: any): Map<string, number> => {
  const map = new Map<string, number>();
  for (const metric of (data?.data || []) as any[]) {
    map.set(String(metric.name), metricValue(metric));
  }
  return map;
};

/* ------------------------------- Instagram ------------------------------- */

async function fetchInstagramItems(ownerUserId: string): Promise<SocialItem[]> {
  const token = await getAccessToken(ownerUserId, "instagram");
  const base = "https://graph.instagram.com";
  const me = await graphJson(`${base}/me?fields=id,username`, token);
  const igUserId = String(me?.id || "");
  if (!igUserId) throw new Error("Instagram account ID is unavailable.");

  const mediaUrl = new URL(`${base}/${encodeURIComponent(igUserId)}/media`);
  mediaUrl.searchParams.set("fields", "id,caption,media_type,media_product_type,timestamp,permalink,like_count,comments_count,media_url,thumbnail_url");
  mediaUrl.searchParams.set("limit", String(MAX_ITEMS));
  const mediaData = await graphJson(mediaUrl.toString(), token);
  const media = Array.isArray(mediaData?.data) ? mediaData.data : [];

  const items = await Promise.all(media.map(async (item: any): Promise<SocialItem> => {
    const metrics = zeroMetrics();
    metrics.likes = Number(item.like_count || 0);
    metrics.comments = Number(item.comments_count || 0);
    const isVideo = String(item.media_type || "") === "VIDEO" || String(item.media_product_type || "") === "REELS";
    try {
      const metricNames = isVideo ? "views,reach,likes,comments,shares,saved" : "reach,likes,comments,shares,saved";
      const insightsUrl = new URL(`${base}/${encodeURIComponent(String(item.id))}/insights`);
      insightsUrl.searchParams.set("metric", metricNames);
      const insights = insightsToMap(await graphJson(insightsUrl.toString(), token));
      metrics.views = insights.get("views") || 0;
      metrics.reach = insights.get("reach") || 0;
      metrics.likes = insights.get("likes") ?? metrics.likes;
      metrics.comments = insights.get("comments") ?? metrics.comments;
      metrics.shares = insights.get("shares") || 0;
      metrics.saved = insights.get("saved") || 0;
    } catch {
      // Per-media insights can be unavailable for very old or non-business
      // items; the media row itself (likes/comments) is still real evidence.
    }
    return {
      channel: "instagram",
      externalId: String(item.id),
      text: String(item.caption || ""),
      permalink: item.permalink || undefined,
      imageUrl: String(item.thumbnail_url || item.media_url || "") || undefined,
      hasVideo: isVideo,
      publishedAt: new Date(item.timestamp || Date.now()),
      metrics,
    };
  }));
  return items;
}

/* -------------------------------- Facebook ------------------------------- */

async function fetchFacebookItems(ownerUserId: string): Promise<SocialItem[]> {
  const token = await getAccessToken(ownerUserId, "meta");
  const base = `https://graph.facebook.com/${META_VERSION}`;
  const accounts = await graphJson(`${base}/me/accounts?fields=id,name,access_token`, token);
  const pages = Array.isArray(accounts?.data) ? accounts.data : [];
  if (!pages.length) throw new Error("Meta is connected, but no Facebook Page is authorized.");
  const selection = await pool.query<{ external_id: string }>(
    `SELECT external_id FROM marketing_social_selections WHERE user_id=$1 AND provider='meta' AND channel='facebook' LIMIT 1`,
    [ownerUserId],
  );
  const selectedId = selection.rows[0]?.external_id;
  const page = (selectedId ? pages.find((item: any) => String(item.id) === String(selectedId)) : undefined)
    || (pages.length === 1 ? pages[0] : undefined);
  if (!page?.id || !page?.access_token) throw new Error("Meta returned the Pages but no usable Page access token.");
  const pageToken = String(page.access_token);

  const postsUrl = new URL(`${base}/${encodeURIComponent(String(page.id))}/posts`);
  postsUrl.searchParams.set("fields", "id,created_time,message,permalink_url,full_picture");
  postsUrl.searchParams.set("limit", String(MAX_ITEMS));
  const postsData = await graphJson(postsUrl.toString(), pageToken);
  const posts = Array.isArray(postsData?.data) ? postsData.data : [];

  const items = await Promise.all(posts.map(async (post: any): Promise<SocialItem> => {
    const metrics = zeroMetrics();
    try {
      const insightsUrl = new URL(`${base}/${encodeURIComponent(String(post.id))}/insights`);
      insightsUrl.searchParams.set("metric", "post_media_view,post_total_media_view_unique,post_reactions_by_type_total");
      const insights = insightsToMap(await graphJson(insightsUrl.toString(), pageToken));
      metrics.views = insights.get("post_media_view") || 0;
      metrics.reach = insights.get("post_total_media_view_unique") || metrics.views;
      metrics.likes = insights.get("post_reactions_by_type_total") || 0;
    } catch {
      // Post insights are best-effort: the post itself still counts as a
      // registered publication, just without measured reach.
    }
    return {
      channel: "facebook",
      externalId: String(post.id),
      text: String(post.message || ""),
      permalink: post.permalink_url || undefined,
      imageUrl: String(post.full_picture || "") || undefined,
      hasVideo: false,
      publishedAt: new Date(post.created_time || Date.now()),
      metrics,
    };
  }));
  return items;
}

/* --------------------------------- Ingest -------------------------------- */

async function ingestItem(ownerUserId: string, item: SocialItem): Promise<{ evidence: boolean }> {
  const campaignId = `social-${item.channel === "instagram" ? "ig" : "fb"}-${item.externalId}`;
  const firstLine = item.text.replace(/\s+/g, " ").trim();
  const excerpt = (firstLine || "Publicación sin texto").slice(0, 90);
  const name = `${item.channel === "instagram" ? "Instagram" : "Facebook"} · ${excerpt}`;
  const interactions = item.metrics.likes + item.metrics.comments + item.metrics.shares + item.metrics.saved;
  const impressions = item.channel === "instagram"
    ? (item.metrics.reach || item.metrics.views)
    : (item.metrics.reach || item.metrics.views);
  const evidence = impressions > 0 || interactions > 0;

  await pool.query(
    `INSERT INTO marketing_campaigns
       (id, name, objective, target_area, message, subject, channels, results, idempotency_key, owner_user_id, autopilot_enabled, next_run_at, campaign_type, created_at)
     VALUES ($1,$2,$3,$4,$5,NULL,$6::jsonb,$7::jsonb,$8,$9,FALSE,NULL,'organic',$10)
     ON CONFLICT (id) DO UPDATE SET
       name=EXCLUDED.name,
       message=EXCLUDED.message,
       channels=EXCLUDED.channels,
       results=EXCLUDED.results`,
    [
      campaignId,
      name,
      OBJECTIVE,
      TARGET_AREA,
      (item.text || excerpt).slice(0, 4000),
      JSON.stringify([item.channel]),
      JSON.stringify({
        source: { type: "social", platform: item.channel, externalId: item.externalId, permalink: item.permalink || null },
        social: { ...item.metrics, interactions, impressions },
        assets: { imageUrl: item.imageUrl || undefined, videoUrl: undefined, landingLink: item.permalink || undefined },
        autopilot: { enabled: false, source: "social-learning" },
      }),
      `social:${item.channel}:${item.externalId}`,
      ownerUserId,
      item.publishedAt,
    ],
  );

  const observationDate = item.publishedAt.toISOString().slice(0, 10).replace(/-/g, "");
  await pool.query(
    `INSERT INTO marketing_learning_observations
       (campaign_id, channel, objective, target_area, hour, weekday, has_image, has_video, published,
        clicks, sessions, conversions, revenue, impressions,
        attribution_key, source, medium, attribution_evidence, observation_date, decision, adjustment)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,TRUE,0,0,0,0,$9,$10,$11,$12,$13,$14,$15::jsonb,$16::jsonb)
     ON CONFLICT (attribution_key) DO UPDATE SET
       impressions=EXCLUDED.impressions,
       attribution_evidence=EXCLUDED.attribution_evidence,
       decision=EXCLUDED.decision,
       adjustment=EXCLUDED.adjustment,
       updated_at=NOW()`,
    [
      campaignId,
      item.channel,
      OBJECTIVE,
      TARGET_AREA,
      item.publishedAt.getUTCHours(),
      item.publishedAt.getUTCDay(),
      Boolean(item.imageUrl),
      item.hasVideo,
      impressions,
      `social:${item.channel}:${item.externalId}`,
      item.channel,
      "social",
      evidence,
      observationDate,
      JSON.stringify({
        stage: "RESULT",
        source: "social_api",
        platform: item.channel,
        externalId: item.externalId,
        permalink: item.permalink || null,
        metrics: { ...item.metrics, interactions, impressions },
        observedAt: new Date().toISOString(),
      }),
      JSON.stringify({
        stage: "ADJUSTMENT",
        interactions,
        engagementRate: impressions > 0 ? Number((interactions / impressions).toFixed(4)) : 0,
        observedAt: new Date().toISOString(),
      }),
    ],
  );
  return { evidence };
}

export async function syncSocialLearning(ownerUserId: string) {
  await ensureMarketingLearningTables();
  const result: Record<string, { items: number; evidence: number; error?: string }> = {};
  let observations = 0;

  const sources: Array<{ key: string; run: () => Promise<SocialItem[]> }> = [
    { key: "instagram", run: () => fetchInstagramItems(ownerUserId) },
    { key: "facebook", run: () => fetchFacebookItems(ownerUserId) },
  ];
  for (const source of sources) {
    try {
      const items = await source.run();
      let evidence = 0;
      for (const item of items) {
        const ingested = await ingestItem(ownerUserId, item);
        observations += 1;
        if (ingested.evidence) evidence += 1;
      }
      result[source.key] = { items: items.length, evidence };
    } catch (error) {
      result[source.key] = { items: 0, evidence: 0, error: error instanceof Error ? error.message : "Social learning source failed." };
    }
  }

  return { ownerUserId, observations, sources: result, syncedAt: new Date().toISOString() };
}
