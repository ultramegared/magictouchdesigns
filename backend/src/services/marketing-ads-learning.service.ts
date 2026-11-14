/**
 * Marketing Ads Learning — puente Meta Ads (2026-11-14)
 *
 * Hasta hoy el motor de aprendizaje solo recibía resultados orgánicos
 * (Instagram/Facebook vía marketing-social-learning) y atribución de Google
 * (GA4/Search Console). Las campañas PAGAS de Meta Ads — creadas a mano en
 * Ads Manager, fuera del panel — eran invisibles: no aparecían en la
 * pestaña Campañas ni alimentaban ninguna observación.
 *
 * Este servicio cierra ese puente en modo SOLO LECTURA (jamás crea, edita,
 * pausa ni toca el gasto de ningún anuncio): lee las campañas de la cuenta
 * publicitaria con el token de Meta ya autorizado, registra cada una como
 * campaña "paid" en marketing_campaigns y guarda sus resultados reales
 * acumulados (impresiones, clics, alcance y gasto) como observaciones de
 * aprendizaje con source "meta_ads" y medium "paid", reutilizando el mismo
 * scoring que ya consume impresiones/clics por canal.
 *
 * Requiere el permiso ads_read en el token de Meta. Si el token vigente
 * todavía no lo tiene (falta reconectar Meta en el panel), el sync se
 * detiene con un log claro y un estado "missing_scope" — sin lanzar, sin
 * romper el cron de aprendizaje ni las demás fuentes.
 */
import { pool } from "../config/database";
import { ensureMarketingLearningTables } from "./marketing-learning.service";
import { getAccessToken } from "./social-connections.service";

const META_VERSION = process.env.META_GRAPH_API_VERSION || "v26.0";
const TARGET_AREA = "Houston, Texas + United States";
const CHANNEL = "facebook";
const SOURCE = "meta_ads";
const MEDIUM = "paid";
const DEFAULT_AD_ACCOUNT_ID = "act_2496391330846489";
const MAX_CAMPAIGNS = 100;

type AdsMetrics = {
  impressions: number;
  clicks: number;
  spend: number;
  reach: number;
  ctr: number;
  cpc: number;
};

type AdsCampaign = {
  externalId: string;
  name: string;
  objective: string;
  status: string;
  effectiveStatus: string;
  dailyBudget: number | null;
  lifetimeBudget: number | null;
  startTime: Date | null;
  stopTime: Date | null;
  createdTime: Date;
  metrics: AdsMetrics;
};

const zeroMetrics = (): AdsMetrics => ({ impressions: 0, clicks: 0, spend: 0, reach: 0, ctr: 0, cpc: 0 });

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

const isMissingAdsPermission = (message: string) =>
  /ads_read|ads_management|permission|\(#200\)|code 200/i.test(message);

/**
 * Cuenta publicitaria a leer: primero la variable META_AD_ACCOUNT_ID; si no
 * está, se descubre vía /me/adaccounts (preferiendo la cuenta conocida del
 * negocio si aparece); si el descubrimiento falla, se usa la cuenta del
 * negocio por defecto. Es la única cuenta de la tienda.
 */
async function resolveAdAccountId(token: string): Promise<string> {
  const configured = process.env.META_AD_ACCOUNT_ID?.trim();
  if (configured) return configured.startsWith("act_") ? configured : `act_${configured}`;
  try {
    const base = `https://graph.facebook.com/${META_VERSION}`;
    const data = await graphJson(`${base}/me/adaccounts?fields=id,name,account_status&limit=25`, token);
    const accounts = Array.isArray(data?.data) ? data.data : [];
    const known = accounts.find((account: any) => String(account.id) === DEFAULT_AD_ACCOUNT_ID);
    if (known) return String(known.id);
    const active = accounts.find((account: any) => Number(account.account_status) === 1) || accounts[0];
    if (active?.id) return String(active.id);
  } catch {
    // Sin descubrimiento (p. ej. el token aún no tiene ads_read) se cae a la
    // cuenta por defecto y la llamada de campañas produce el error real.
  }
  return DEFAULT_AD_ACCOUNT_ID;
}

async function fetchCampaigns(token: string, adAccountId: string): Promise<AdsCampaign[]> {
  const base = `https://graph.facebook.com/${META_VERSION}`;
  const campaignsUrl = new URL(`${base}/${encodeURIComponent(adAccountId)}/campaigns`);
  campaignsUrl.searchParams.set("fields", "id,name,objective,status,effective_status,daily_budget,lifetime_budget,start_time,stop_time,created_time");
  campaignsUrl.searchParams.set("limit", String(MAX_CAMPAIGNS));
  const campaignsData = await graphJson(campaignsUrl.toString(), token);
  const campaigns = Array.isArray(campaignsData?.data) ? campaignsData.data : [];

  return Promise.all(campaigns.map(async (campaign: any): Promise<AdsCampaign> => {
    const metrics = zeroMetrics();
    try {
      const insightsUrl = new URL(`${base}/${encodeURIComponent(String(campaign.id))}/insights`);
      insightsUrl.searchParams.set("fields", "impressions,clicks,spend,reach,ctr,cpc");
      insightsUrl.searchParams.set("date_preset", "maximum");
      const insightsData = await graphJson(insightsUrl.toString(), token);
      const row = Array.isArray(insightsData?.data) ? insightsData.data[0] : undefined;
      if (row) {
        metrics.impressions = Math.round(Number(row.impressions || 0));
        metrics.clicks = Math.round(Number(row.clicks || 0));
        metrics.spend = Number(row.spend || 0);
        metrics.reach = Math.round(Number(row.reach || 0));
        metrics.ctr = Number(row.ctr || 0);
        metrics.cpc = Number(row.cpc || 0);
      }
    } catch {
      // Una campaña recién publicada puede no tener insights todavía (Meta
      // la está procesando): la campaña se registra igual, con métricas en
      // cero — nunca se inventan números.
    }
    const centsToUnits = (value: unknown): number | null => {
      const parsed = Number(value);
      return Number.isFinite(parsed) && parsed > 0 ? parsed / 100 : null;
    };
    const parseDate = (value: unknown): Date | null => {
      if (!value) return null;
      const date = new Date(String(value));
      return Number.isNaN(date.getTime()) ? null : date;
    };
    return {
      externalId: String(campaign.id),
      name: String(campaign.name || "Meta Ads campaign"),
      objective: String(campaign.objective || "Meta Ads"),
      status: String(campaign.status || ""),
      effectiveStatus: String(campaign.effective_status || ""),
      dailyBudget: centsToUnits(campaign.daily_budget),
      lifetimeBudget: centsToUnits(campaign.lifetime_budget),
      startTime: parseDate(campaign.start_time),
      stopTime: parseDate(campaign.stop_time),
      createdTime: parseDate(campaign.created_time) || new Date(),
      metrics,
    };
  }));
}

async function ingestCampaign(
  ownerUserId: string,
  adAccountId: string,
  currency: string,
  campaign: AdsCampaign,
): Promise<{ evidence: boolean }> {
  const campaignId = `meta-ads-${campaign.externalId}`;
  const { metrics } = campaign;
  const published = campaign.effectiveStatus === "ACTIVE" || campaign.status === "ACTIVE";
  const evidence = metrics.impressions > 0 || metrics.clicks > 0 || metrics.spend > 0;

  await pool.query(
    `INSERT INTO marketing_campaigns
       (id, name, objective, target_area, message, subject, channels, results, idempotency_key, owner_user_id, autopilot_enabled, next_run_at, campaign_type, starts_at, ends_at, created_at)
     VALUES ($1,$2,$3,$4,$5,NULL,$6::jsonb,$7::jsonb,$8,$9,FALSE,NULL,'paid',$10,$11,$12)
     ON CONFLICT (id) DO UPDATE SET
       name=EXCLUDED.name,
       objective=EXCLUDED.objective,
       channels=EXCLUDED.channels,
       results=EXCLUDED.results,
       starts_at=EXCLUDED.starts_at,
       ends_at=EXCLUDED.ends_at`,
    [
      campaignId,
      campaign.name,
      campaign.objective,
      TARGET_AREA,
      campaign.name,
      JSON.stringify([CHANNEL, "instagram"]),
      JSON.stringify({
        source: { type: SOURCE, platform: "meta", externalId: campaign.externalId, adAccountId },
        metaAds: {
          status: campaign.status,
          effectiveStatus: campaign.effectiveStatus,
          objective: campaign.objective,
          dailyBudget: campaign.dailyBudget,
          lifetimeBudget: campaign.lifetimeBudget,
          currency,
          startTime: campaign.startTime?.toISOString() || null,
          stopTime: campaign.stopTime?.toISOString() || null,
        },
        ads: { ...metrics },
        autopilot: { enabled: false, source: "meta-ads-learning" },
      }),
      `meta-ads:${campaign.externalId}`,
      ownerUserId,
      campaign.startTime,
      campaign.stopTime,
      campaign.createdTime,
    ],
  );

  const observationDate = campaign.createdTime.toISOString().slice(0, 10).replace(/-/g, "");
  await pool.query(
    `INSERT INTO marketing_learning_observations
       (campaign_id, channel, objective, target_area, hour, weekday, has_image, has_video, published,
        clicks, sessions, conversions, revenue, impressions,
        attribution_key, source, medium, attribution_evidence, observation_date, decision, adjustment)
     VALUES ($1,$2,$3,$4,$5,$6,FALSE,FALSE,$7,$8,0,0,0,$9,$10,$11,$12,$13,$14,$15::jsonb,$16::jsonb)
     ON CONFLICT (attribution_key) DO UPDATE SET
       clicks=EXCLUDED.clicks,
       impressions=EXCLUDED.impressions,
       published=EXCLUDED.published,
       attribution_evidence=EXCLUDED.attribution_evidence,
       decision=EXCLUDED.decision,
       adjustment=EXCLUDED.adjustment,
       updated_at=NOW()`,
    [
      campaignId,
      CHANNEL,
      campaign.objective,
      TARGET_AREA,
      campaign.createdTime.getUTCHours(),
      campaign.createdTime.getUTCDay(),
      published,
      metrics.clicks,
      metrics.impressions,
      `meta_ads:${campaign.externalId}`,
      SOURCE,
      MEDIUM,
      evidence,
      observationDate,
      JSON.stringify({
        stage: "RESULT",
        source: "meta_ads_api",
        platform: "meta",
        externalId: campaign.externalId,
        adAccountId,
        metrics: { ...metrics },
        observedAt: new Date().toISOString(),
      }),
      JSON.stringify({
        stage: "ADJUSTMENT",
        spend: metrics.spend,
        ctr: metrics.ctr,
        cpc: metrics.cpc,
        costPerThousandImpressions: metrics.impressions > 0 ? Number(((metrics.spend / metrics.impressions) * 1000).toFixed(4)) : 0,
        observedAt: new Date().toISOString(),
      }),
    ],
  );
  return { evidence };
}

export async function syncMetaAdsLearning(ownerUserId: string) {
  await ensureMarketingLearningTables();
  const summary: {
    ownerUserId: string;
    status: "ok" | "missing_scope" | "error";
    adAccountId: string | null;
    campaigns: number;
    observations: number;
    evidence: number;
    error?: string;
    syncedAt: string;
  } = {
    ownerUserId,
    status: "ok",
    adAccountId: null,
    campaigns: 0,
    observations: 0,
    evidence: 0,
    syncedAt: new Date().toISOString(),
  };

  try {
    const token = await getAccessToken(ownerUserId, "meta");
    const adAccountId = await resolveAdAccountId(token);
    summary.adAccountId = adAccountId;

    const base = `https://graph.facebook.com/${META_VERSION}`;
    let currency = "USD";
    try {
      const account = await graphJson(`${base}/${encodeURIComponent(adAccountId)}?fields=currency`, token);
      if (account?.currency) currency = String(account.currency);
    } catch {
      // La moneda es un dato de presentación; si falla, se asume la de la
      // cuenta conocida (USD) y el sync de campañas sigue su curso.
    }

    let campaigns: AdsCampaign[];
    try {
      campaigns = await fetchCampaigns(token, adAccountId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Meta Ads sync failed.";
      if (isMissingAdsPermission(message)) {
        summary.status = "missing_scope";
        summary.error = message;
        console.warn(
          `[marketing-ads] El token de Meta todavía no tiene el permiso ads_read: "${message}". ` +
          "Para activarlo hay que reconectar Meta en el panel de Marketing (Disconnect → Connect). " +
          "Sync de campañas pagas omitido por esta vez; el resto del aprendizaje no se ve afectado.",
        );
        return summary;
      }
      throw error;
    }

    for (const campaign of campaigns) {
      try {
        const ingested = await ingestCampaign(ownerUserId, adAccountId, currency, campaign);
        summary.campaigns += 1;
        summary.observations += 1;
        if (ingested.evidence) summary.evidence += 1;
      } catch (error) {
        console.error(`[marketing-ads] No se pudo registrar la campaña ${campaign.externalId}:`, error);
      }
    }
    return summary;
  } catch (error) {
    summary.status = "error";
    summary.error = error instanceof Error ? error.message : "Meta Ads learning sync failed.";
    console.error("[marketing-ads] Sync de campañas pagas falló (el cron sigue con las demás fuentes):", summary.error);
    return summary;
  }
}
