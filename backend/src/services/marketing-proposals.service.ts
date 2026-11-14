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
 *
 * Ampliaciones del mismo día, por orden del dueño:
 *  - Cada propuesta se prepara para los 4 medios de la casa (Instagram,
 *    Facebook, Marketplace y YouTube) con su estado real por medio
 *    (channel_plan): listo o bloqueado, y por qué.
 *  - El robot también aprende del SEO de Google (marketing-seo-learning):
 *    el ciclo diario ingiere Search Console + GA4 antes de proponer, las
 *    propuestas usan los términos reales de búsqueda, y una oportunidad
 *    SEO clara puede ser la propuesta del día (source_type "seo": es una
 *    recomendación con evidencia; aprobarla no publica ni aplica nada).
 *  - Lógica de horarios (marketing-schedule): mapa de calor día × hora
 *    por red desde los datos reales, cadencia de publicar poco y bien
 *    (aire mínimo entre propuestas; si un día no toca, no se propone),
 *    calendario de fechas de regalo, y cada propuesta trae su DÍA Y HORA
 *    recomendados con la evidencia. Al aprobarla, la publicación queda
 *    programada para el inicio de esa ventana (next_run_at), nunca antes.
 */
import { randomUUID } from "crypto";
import { pool } from "../config/database";
import { getConnections, getMarketplaceDiagnosis, getYouTubeDiagnosis } from "./social-connections.service";
import { getMarketingLearningInsights } from "./marketing-learning.service";
import {
  syncSeoLearning,
  getSeoInsights,
  seoSearchedSlugs,
  seoQueriesForProduct,
  seoHashtags,
  type SeoInsights,
} from "./marketing-seo-learning.service";
import {
  evaluateProductPromotability,
  evaluatePortfolioPromotability,
  buildProductMessage,
  buildPortfolioMessage,
} from "./marketing-catalog.service";
import {
  rebuildHeatMaps,
  getCadenceState,
  recommendSlot,
  measureRecentPublications,
  upcomingGiftEvent,
  matchesGiftEvent,
  SCHEDULE_CHANNELS,
  type GiftEvent,
  type ScheduleChannel,
  type SlotRecommendation,
} from "./marketing-schedule.service";
import {
  buildProposalIntelligence,
  recordOwnerFeedback,
  runFastLearningCycle,
  type ProposalIntelligence,
} from "./marketing-intelligence.service";

const PUBLIC_SITE = process.env.FRONTEND_PUBLIC_URL?.trim() || "https://www.jqydesigns.com";
// WhatsApp del negocio JQYDesigns (+1 346-760-3007), para el link de contacto
// que acompaña cada propuesta.
const WHATSAPP_NUMBER = "13467603007";
const TARGET_AREA = "Houston, Texas + United States";
// Regla del dueño (2026-11-14): TODA publicación de la tienda sale siempre
// por los mismos 4 medios — Instagram, Facebook, Marketplace y YouTube —
// así que cada propuesta diaria se prepara para los 4 y declara con
// honestidad cuáles están listos y cuáles bloqueados (y por qué).
// WhatsApp no es medio de publicación: es el link de contacto.
// De los 4, el motor publica la imagen de la propuesta en Facebook e
// Instagram; YouTube publica con video, y Marketplace publica el producto
// en el catálogo de Meta Commerce (ruta oficial). Cada medio queda en el
// plan con su estado real según su diagnóstico, hasta que esté operativo.
const PROPOSAL_MEDIA = ["instagram", "facebook", "marketplace", "youtube"] as const;
const PUBLISHABLE_CHANNELS = ["facebook", "instagram", "marketplace"] as const;

export type ProposalChannelPlanEntry = {
  channel: (typeof PROPOSAL_MEDIA)[number];
  status: "ready" | "blocked";
  note: string;
};

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
  await pool.query(`ALTER TABLE marketing_proposals ADD COLUMN IF NOT EXISTS channel_plan JSONB NOT NULL DEFAULT '[]'::jsonb`);
  // Lógica de horarios: cada propuesta guarda su día/hora recomendados
  // (scheduled_for) y la evidencia completa del horario (schedule).
  await pool.query(`ALTER TABLE marketing_proposals ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ`);
  await pool.query(`ALTER TABLE marketing_proposals ADD COLUMN IF NOT EXISTS schedule JSONB`);
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

async function pickCandidate(
  ownerUserId: string,
  preferredSlugs: Set<string> = new Set(),
  seasonalKeywords: string[] = [],
): Promise<Candidate | null> {
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
  // Lo que la gente ya busca en Google va primero: si uno de los productos
  // candidatos es de los que Google ya muestra, se propone ese.
  if (preferredSlugs.size) {
    productResult.rows.sort((a: any, b: any) =>
      Number(preferredSlugs.has(String(b.slug || ""))) - Number(preferredSlugs.has(String(a.slug || ""))));
  }
  // Calendario de regalos: en la ventana previa a una fecha (Navidad, San
  // Valentín, Día de la Madre/Padre), el producto de esa fecha va primero.
  if (seasonalKeywords.length) {
    const matchesSeason = (name: string) => {
      const haystack = ` ${String(name || "").toLowerCase()} `;
      return seasonalKeywords.some((keyword) => haystack.includes(keyword));
    };
    productResult.rows.sort((a: any, b: any) =>
      Number(matchesSeason(b.name)) - Number(matchesSeason(a.name)));
  }
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

/**
 * El plan de medios de cada propuesta: los 4 medios de la casa, cada uno
 * con su estado real (listo o bloqueado, y por qué). Nunca se declara
 * listo un medio que hoy no puede recibir la publicación.
 */
export async function buildChannelPlan(ownerUserId: string): Promise<ProposalChannelPlanEntry[]> {
  const connections = await getConnections(ownerUserId).catch(() => null);
  const channels = ((connections as any)?.channels || {}) as Record<string, boolean>;

  let youtubeReady = false;
  let youtubeNote = "YouTube no está conectado: hay que conectarlo desde el panel de Marketing.";
  if (channels.youtube) {
    try {
      const diagnosis: any = await getYouTubeDiagnosis(ownerUserId);
      if (diagnosis?.lastRefreshFailedAt) {
        youtubeNote = "El token de YouTube está revocado (la renovación automática falló): hay que reconectarlo con un clic en el panel de Marketing. Cuando reviva, las propuestas salen también ahí (con video).";
      } else if (diagnosis?.rowExists && diagnosis?.hasRefreshToken) {
        youtubeReady = true;
        youtubeNote = "Conectado y listo. En YouTube la publicación sale como video.";
      }
    } catch {
      youtubeNote = "No se pudo verificar el estado de YouTube; se marca bloqueado por seguridad.";
    }
  }

  let marketplaceStatus: "ready" | "blocked" = "blocked";
  let marketplaceNote = "Marketplace todavía no está conectado al sistema (no hay publicador de Marketplace): la propuesta queda preparada para este medio y saldrá por ahí cuando se conecte.";
  try {
    const mpDiagnosis: any = await getMarketplaceDiagnosis(ownerUserId);
    marketplaceStatus = mpDiagnosis?.ready ? "ready" : "blocked";
    if (mpDiagnosis?.note) marketplaceNote = String(mpDiagnosis.note);
  } catch {
    marketplaceNote = "No se pudo verificar el estado de Marketplace; se marca bloqueado por seguridad.";
  }

  const plan: ProposalChannelPlanEntry[] = [
    {
      channel: "instagram",
      status: channels.instagram ? "ready" : "blocked",
      note: channels.instagram ? "Conectado y listo para publicar." : "Instagram no está conectado.",
    },
    {
      channel: "facebook",
      status: channels.facebook ? "ready" : "blocked",
      note: channels.facebook ? "Conectado y listo para publicar." : "La página de Facebook no está conectada.",
    },
    {
      channel: "marketplace",
      status: marketplaceStatus,
      note: marketplaceNote,
    },
    {
      channel: "youtube",
      status: youtubeReady ? "ready" : "blocked",
      note: youtubeNote,
    },
  ];
  return plan;
}

async function proposalChannels(ownerUserId: string) {
  const channelPlan = await buildChannelPlan(ownerUserId);
  const available = PUBLISHABLE_CHANNELS.filter((channel) =>
    channelPlan.some((entry) => entry.channel === channel && entry.status === "ready"));
  let recommended: string | null = null;
  let scores: Record<string, number> = {};
  try {
    const insights = await getMarketingLearningInsights(undefined, undefined, ownerUserId);
    scores = Object.fromEntries(insights.map((row: any) => [row.channel, Number(row.score || 0)]));
    const ranked = [...available].sort((a, b) => (scores[b] || 0) - (scores[a] || 0));
    recommended = ranked[0] || null;
    return { channels: ranked, recommended, scores, channelPlan };
  } catch {
    return { channels: [...available], recommended: available[0] || null, scores, channelPlan };
  }
}

/**
 * Arma la propuesta del día SIN guardarla (la usa generateDailyProposal
 * para insertarla y previewDailyProposal para mostrarla/verificarla).
 * Usa lo aprendido de Google: prefiere productos que la gente ya busca,
 * suma hashtags de términos reales de búsqueda y, si no hay contenido
 * nuevo que proponer pero Google muestra una oportunidad clara, la
 * propuesta del día ES esa oportunidad SEO, con su evidencia.
 */
async function buildProposal(ownerUserId: string) {
  const today = houstonDateKey();
  const { channels, recommended, scores, channelPlan } = await proposalChannels(ownerUserId);
  const { occasion, context } = buildOccasion();
  const seo: SeoInsights | null = await getSeoInsights(ownerUserId).catch(() => null);
  const searchedSlugs = seoSearchedSlugs(seo);
  const giftEvent: GiftEvent | null = await upcomingGiftEvent(ownerUserId).catch(() => null);

  const candidate = await pickCandidate(ownerUserId, searchedSlugs, giftEvent?.keywords || []);

  if (!candidate) {
    const opportunity = seo?.opportunities?.[0];
    if (seo && opportunity) {
      let imageUrl: string | undefined;
      let pageProductName = "";
      try {
        const pageUrl = new URL(opportunity.page);
        const slug = pageUrl.searchParams.get("product") || pageUrl.pathname.split("/").filter(Boolean).pop() || "";
        if (slug) {
          const found = await pool.query(
            `SELECT name, image_url FROM products WHERE slug=$1 AND is_active=TRUE LIMIT 1`,
            [slug],
          );
          if (found.rows[0]) {
            pageProductName = String(found.rows[0].name || "");
            imageUrl = String(found.rows[0].image_url || "").trim() || undefined;
          }
        }
      } catch { /* la página no mapea a un producto: la propuesta va sin imagen */ }
      const title = `Oportunidad SEO en Google${pageProductName ? ` · ${pageProductName}` : ""}`;
      const caption = [
        `📈 Oportunidad detectada en Google (${seo.periodStart} a ${seo.periodEnd}):`,
        opportunity.detail,
        `Evidencia: ${opportunity.impressions} impresiones, ${opportunity.clicks} clics, CTR ${(opportunity.ctr * 100).toFixed(1)}%, posición promedio ${opportunity.position.toFixed(1)}.`,
        `Página: ${opportunity.page}`,
        "Esto es una recomendación: el robot no aplica cambios SEO ni publica nada por su cuenta. Si la aprobás, queda registrada como aceptada para trabajarla.",
      ].join("\n");
      return {
        proposal: {
          id: `prop-${today}-${randomUUID().slice(0, 8)}`,
          owner_user_id: ownerUserId,
          proposal_date: today,
          status: "pending",
          scope: null as string | null,
          source_type: "seo",
          source_id: opportunity.page,
          title,
          caption,
          image_url: imageUrl || null,
          product_link: opportunity.page,
          whatsapp_link: whatsappLink(title, opportunity.page),
          channels: [] as string[],
          channel_plan: channelPlan,
          occasion,
          reasoning: {
            kind: "seo_opportunity",
            context,
            opportunity,
            seoEvidence: {
              source: "search_console",
              period: { start: seo.periodStart, end: seo.periodEnd },
              totals: seo.totals,
              topQueries: seo.topQueries.slice(0, 5),
            },
            recommendedChannel: null,
            channelScores: scores,
            channelPlan,
            rule: "SEO opportunity proposal: it never publishes and never applies changes. Approval only records the owner's acceptance of the recommendation.",
          },
        },
      };
    }
    return { reason: "No eligible new content to propose today." };
  }

  let title: string;
  let caption: string;
  let imageUrl: string | undefined;
  let link: string;
  let sourceId: string;
  let seoEvidence: Record<string, unknown> | null = null;
  if (candidate.type === "catalog") {
    const product = candidate.product;
    title = String(product.name || "Personalized design");
    caption = buildProductMessage(product);
    const imageUrls = Array.isArray(product.image_urls) ? product.image_urls.filter(Boolean) : [];
    imageUrl = String(product.image_url || imageUrls[0] || "").trim() || undefined;
    link = `${PUBLIC_SITE.replace(/\/$/, "")}/products?product=${encodeURIComponent(String(product.slug || product.product_id))}`;
    sourceId = String(product.product_id);
    if (seo) {
      const matchedQueries = seoQueriesForProduct(seo, { name: title, slug: String(product.slug || "") });
      const onSearchedPage = searchedSlugs.has(String(product.slug || ""));
      if (matchedQueries.length || onSearchedPage) {
        const tags = seoHashtags(matchedQueries.length ? matchedQueries : seo.topQueries.slice(0, 2).map((q) => q.key));
        if (tags) caption = `${caption}\n\n${tags}`;
        seoEvidence = {
          source: "search_console",
          period: { start: seo.periodStart, end: seo.periodEnd },
          matchedQueries,
          productAlreadyShownByGoogle: onSearchedPage,
          topQueries: seo.topQueries.slice(0, 5),
          note: "Search terms and hashtags come from real Google queries (Search Console), not invented keywords.",
        };
      }
    }
  } else {
    const item = candidate.item;
    title = String(item.title_en || "Custom work");
    caption = buildPortfolioMessage(item);
    imageUrl = String(item.image_url || "").trim() || undefined;
    link = `${PUBLIC_SITE.replace(/\/$/, "")}/portfolio`;
    sourceId = String(item.portfolio_id);
  }

  // Día y hora recomendados (lógica de horarios): la ventana ganadora de
  // la red principal según el mapa de calor real — o un horario de
  // experimento honesto si la red no tiene datos — casado con el
  // calendario de regalos cuando el producto es de la fecha que viene.
  const primaryChannel: ScheduleChannel =
    (SCHEDULE_CHANNELS as readonly string[]).includes(String(recommended || ""))
      ? (recommended as ScheduleChannel)
      : (SCHEDULE_CHANNELS as readonly string[]).includes(String(channels[0] || ""))
        ? (channels[0] as ScheduleChannel)
        : "instagram";
  const seasonalMatch = giftEvent ? matchesGiftEvent(giftEvent, title) : false;
  const proposalCount = await pool.query(
    `SELECT COUNT(*)::int AS n FROM marketing_proposals WHERE owner_user_id=$1`,
    [ownerUserId],
  ).catch(() => ({ rows: [{ n: 0 }] }));
  let slot: SlotRecommendation | null = null;
  try {
    slot = await recommendSlot(ownerUserId, primaryChannel, {
      event: seasonalMatch ? giftEvent : null,
      rotationSeed: Number(proposalCount.rows[0]?.n || 0),
    });
  } catch { /* sin recomendación de horario, la propuesta igual se arma */ }
  const schedule = slot
    ? {
        channel: slot.channel,
        mode: slot.mode,
        dateKey: slot.dateKey,
        weekday: slot.weekday,
        hour: slot.hour,
        scheduledFor: slot.scheduledFor,
        label: slot.label,
        evidenceText: slot.evidenceText,
        experimentIndex: slot.experimentIndex,
        eventApplied: slot.eventApplied,
        seasonalProduct: seasonalMatch,
        perChannel: slot.perChannel,
        rule: "Recommended day/time from the store's real per-network heat map (or an honest experiment when a network lacks data). If approved, the publication goes out at the start of that window — never before, never on its own.",
      }
    : null;

  // Inteligencia ULTRA: puntaje con evidencia, pronóstico desde su
  // historial, experimento A/B y variantes por canal. Las variantes son
  // BORRADORES para que el dueño elija al aprobar (A = texto base,
  // B = cierre con llamado directo): el texto de la propuesta NO se
  // cambia solo; sale la variante que el dueño marque con su «sí».
  let intelligence: ProposalIntelligence | null = null;
  try {
    intelligence = await buildProposalIntelligence(ownerUserId, {
      title,
      caption,
      sourceType: candidate.type as string,
      sourceId,
      primaryChannel,
      channels,
      slot: slot ? { mode: slot.mode, evidenceText: slot.evidenceText, weekday: slot.weekday, hour: slot.hour } : null,
      seoMatchedQueries: Array.isArray((seoEvidence as any)?.matchedQueries) ? (seoEvidence as any).matchedQueries.length : 0,
      seasonalMatch,
      productLink: link,
      whatsappLink: whatsappLink(title, link),
      price: candidate.type === "catalog" ? Number((candidate as any).product?.price || 0) || null : null,
      rotationSeed: Number(proposalCount.rows[0]?.n || 0),
    });
  } catch { /* sin inteligencia calculada, la propuesta igual se arma */ }

  return {
    proposal: {
      id: `prop-${today}-${randomUUID().slice(0, 8)}`,
      owner_user_id: ownerUserId,
      proposal_date: today,
      status: "pending",
      scope: null as string | null,
      source_type: candidate.type as string,
      source_id: sourceId,
      title,
      caption,
      image_url: imageUrl || null,
      product_link: link,
      whatsapp_link: whatsappLink(title, link),
      channels,
      channel_plan: channelPlan,
      occasion,
      scheduled_for: slot?.scheduledFor || null,
      schedule,
      reasoning: {
        context,
        candidateScore: candidate.decision.score,
        candidateReasons: candidate.decision.reasons,
        recommendedChannel: recommended,
        channelScores: scores,
        channelPlan,
        ...(seoEvidence ? { seoEvidence } : {}),
        ...(schedule ? { schedule } : {}),
        ...(intelligence ? { intelligence } : {}),
        rule: "Proposals follow the house cadence (publish little and well: a minimum gap between proposals, never daily spam), prepared for the store's 4 media (Instagram, Facebook, Marketplace, YouTube). A proposal publishes only with the owner's authorization (once, or inside an approved weekly window), only through the media marked ready, and at the start of its recommended window.",
      },
    },
  };
}

/** La propuesta que el robot armaría hoy, sin guardarla ni publicar nada. */
export async function previewDailyProposal(ownerUserId: string) {
  await ensureProposalTables();
  const built = await buildProposal(ownerUserId);
  return built.proposal ? { preview: true, proposal: built.proposal } : { preview: false, reason: built.reason };
}

export async function generateDailyProposal(ownerUserId: string) {
  await ensureProposalTables();
  const state = await pool.query(`SELECT enabled FROM marketing_catalog_autopilot WHERE owner_user_id=$1 LIMIT 1`, [ownerUserId]);
  if (!state.rows[0] || state.rows[0].enabled !== true) {
    return { generated: false, reason: "The robot is off; no proposal was prepared." };
  }
  const today = houstonDateKey();
  // Unanswered proposals expire only once their recommended window has
  // passed (+24 h of grace): a proposal waiting for its winning window
  // stays alive until then. Without authorization, nothing ever moves.
  await pool.query(
    `UPDATE marketing_proposals SET status='expired'
     WHERE owner_user_id=$1 AND status='pending' AND proposal_date < $2
       AND (scheduled_for IS NULL OR scheduled_for < NOW() - INTERVAL '24 hours')`,
    [ownerUserId, today],
  );
  // A live pending proposal (waiting for its window) blocks new ones:
  // one proposal at a time, with air between publications.
  const live = await pool.query(
    `SELECT * FROM marketing_proposals
     WHERE owner_user_id=$1 AND status='pending'
       AND (scheduled_for IS NULL OR scheduled_for >= NOW() - INTERVAL '24 hours')
     ORDER BY proposal_date DESC LIMIT 1`,
    [ownerUserId],
  );
  if (live.rows[0]) return { generated: false, existing: true, proposal: live.rows[0] };
  const existing = await pool.query(`SELECT * FROM marketing_proposals WHERE owner_user_id=$1 AND proposal_date=$2 LIMIT 1`, [ownerUserId, today]);
  if (existing.rows[0]) return { generated: false, existing: true, proposal: existing.rows[0] };

  // Cadencia — publicar poco y bien: si el aire mínimo desde la última
  // propuesta/publicación no se cumplió, hoy no se propone nada.
  const cadence = await getCadenceState(ownerUserId).catch(() => null);
  if (cadence && !cadence.eligible) {
    return { generated: false, reason: cadence.reason, cadence };
  }

  const built = await buildProposal(ownerUserId);
  if (!built.proposal) return { generated: false, reason: built.reason };
  const proposal = built.proposal;

  await pool.query(
    `INSERT INTO marketing_proposals
       (id, owner_user_id, proposal_date, status, scope, source_type, source_id, title, caption, image_url, product_link, whatsapp_link, channels, channel_plan, occasion, reasoning, scheduled_for, schedule)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$14::jsonb,$15,$16::jsonb,$17,$18::jsonb)`,
    [
      proposal.id, proposal.owner_user_id, proposal.proposal_date, proposal.status, proposal.scope,
      proposal.source_type, proposal.source_id, proposal.title, proposal.caption, proposal.image_url,
      proposal.product_link, proposal.whatsapp_link, JSON.stringify(proposal.channels),
      JSON.stringify(proposal.channel_plan), proposal.occasion,
      JSON.stringify(proposal.reasoning),
      (proposal as any).scheduled_for || null,
      JSON.stringify((proposal as any).schedule || null),
    ],
  );
  return { generated: true, proposal, cadence };
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
  if (proposal.source_type === "seo") {
    // An SEO opportunity is a recommendation, never a publication: approving
    // it must not create a campaign or post anything anywhere.
    return { campaignId: "", alreadyMaterialized: true };
  }
  if (proposal.materialized_campaign_id) {
    return { campaignId: String(proposal.materialized_campaign_id), alreadyMaterialized: true };
  }
  const campaignId = `proposal-${proposal.id}`;
  const isCatalog = proposal.source_type === "catalog";
  const now = new Date();
  // Horario aprobado: la publicación sale al inicio de la ventana
  // recomendada de la propuesta. Si la ventana ya pasó cuando el dueño
  // aprueba, sale en cuanto aprueba (nunca antes de su sí).
  const scheduledFor = proposal.scheduled_for ? new Date(proposal.scheduled_for) : null;
  const runAt = scheduledFor && scheduledFor.getTime() > now.getTime() ? scheduledFor : now;
  const endsAt = new Date(runAt.getTime() + 6 * 60 * 60 * 1000);
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
        schedule: proposal.schedule || null,
      }),
      `proposal:${proposal.id}`,
      ownerUserId,
      runAt,
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
  return { campaignId, alreadyMaterialized: false, scheduledFor: runAt.toISOString() };
}

export async function approveProposal(ownerUserId: string, proposalId: string, scope: ProposalScope, variant?: "A" | "B" | null) {
  await ensureProposalTables();
  const result = await pool.query(`SELECT * FROM marketing_proposals WHERE id=$1 AND owner_user_id=$2 LIMIT 1`, [proposalId, ownerUserId]);
  const proposal = result.rows[0];
  if (!proposal) throw new Error("Proposal not found for this Marketing account.");
  if (proposal.status !== "pending") throw new Error(`Proposal is ${proposal.status}; only a pending proposal can be approved.`);
  if (proposal.source_type === "seo") {
    // Approving an SEO recommendation only records the owner's acceptance.
    // Nothing is published and no SEO change is applied automatically, and
    // it never opens a weekly auto-publish window.
    await pool.query(
      `UPDATE marketing_proposals SET status='approved', scope='once', decided_at=NOW() WHERE id=$1`,
      [proposal.id],
    );
    await recordOwnerFeedback(ownerUserId, { proposalId, decision: "approved", scope: "once", proposal }).catch(() => undefined);
    return {
      approved: true,
      scope: "once" as ProposalScope,
      proposalId,
      autoPublishUntil: null,
      campaignId: "",
      alreadyMaterialized: true,
      seoRecommendation: true,
      note: "SEO recommendation approved and recorded. Nothing was published and no change was applied automatically.",
    };
  }
  if (!(proposal.channels || []).length) throw new Error("Proposal has no connected channel to publish to.");

  // Experimento A/B: si el dueño eligió la variante B al aprobar, ESE es
  // el texto que se materializa. Sin elección expresa sale la A (el
  // texto base de la propuesta, tal como lo revisó).
  const chosenVariant = variant === "B" ? "B" : "A";
  if (chosenVariant === "B") {
    const variantB = proposal.reasoning?.intelligence?.experiment?.variantB;
    if (typeof variantB === "string" && variantB.trim()) {
      proposal.caption = variantB;
      await pool.query(`UPDATE marketing_proposals SET caption=$2 WHERE id=$1`, [proposal.id, variantB]).catch(() => undefined);
    }
  }

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
  // El «sí» del dueño es señal de aprendizaje de primer orden (su gusto):
  // queda registrado con la variante que eligió y con la campaña creada.
  await recordOwnerFeedback(ownerUserId, { proposalId, decision: "approved", scope, variant: chosenVariant, proposal: { ...proposal, materialized_campaign_id: materialized.campaignId || null } }).catch(() => undefined);
  return { approved: true, scope, proposalId, autoPublishUntil, variant: chosenVariant, ...materialized };
}

export async function rejectProposal(ownerUserId: string, proposalId: string, reason?: { reasonCode?: string | null; reasonText?: string | null }) {
  await ensureProposalTables();
  const before = await pool.query(`SELECT * FROM marketing_proposals WHERE id=$1 AND owner_user_id=$2 LIMIT 1`, [proposalId, ownerUserId]);
  const result = await pool.query(
    `UPDATE marketing_proposals SET status='rejected', decided_at=NOW()
     WHERE id=$1 AND owner_user_id=$2 AND status='pending' RETURNING id`,
    [proposalId, ownerUserId],
  );
  if (!result.rows[0]) throw new Error("Proposal not found or no longer pending.");
  // El «no» del dueño — con su motivo si lo dio — es la señal que más
  // enseña: queda guardada y pesa en las próximas propuestas.
  await recordOwnerFeedback(ownerUserId, {
    proposalId, decision: "rejected",
    reasonCode: reason?.reasonCode || null, reasonText: reason?.reasonText || null,
    proposal: before.rows[0] || {},
  }).catch(() => undefined);
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

/**
 * La propuesta vigente para mostrarle al dueño: la pendiente que espera
 * su decisión (puede haberse generado días atrás para una ventana
 * futura), o si no hay pendiente, la de hoy en cualquier estado.
 */
export async function getCurrentProposal(ownerUserId: string) {
  await ensureProposalTables();
  const pending = await pool.query(
    `SELECT * FROM marketing_proposals WHERE owner_user_id=$1 AND status='pending'
     ORDER BY proposal_date DESC LIMIT 1`,
    [ownerUserId],
  );
  if (pending.rows[0]) return pending.rows[0];
  return getTodayProposal(ownerUserId);
}

export async function runDailyProposals(ownerUserId: string) {
  await ensureProposalTables();
  const closed = await closeExpiredWeeklyWindow(ownerUserId);
  // Learn from Google first, so today's proposal is built with fresh
  // Search Console / GA4 evidence. A Google outage must not block the
  // proposal, so this stage is isolated.
  let seoLearning: unknown = null;
  try {
    seoLearning = await syncSeoLearning(ownerUserId);
  } catch (error) {
    seoLearning = { error: error instanceof Error ? error.message : "SEO learning sync failed." };
  }
  // Lógica de horarios, antes de proponer: reconstruir el mapa de calor
  // con las observaciones frescas de la noche y medir las publicaciones
  // del robot que ya cumplieron 24–48 h (ese resultado refina el mapa).
  let schedule: unknown = null;
  try {
    const heatMap = await rebuildHeatMaps(ownerUserId);
    const measurements = await measureRecentPublications(ownerUserId);
    schedule = {
      heatmap: Object.fromEntries(
        SCHEDULE_CHANNELS.map((channel) => [channel, { mode: heatMap[channel].mode, evidencePosts: heatMap[channel].evidencePosts, summary: heatMap[channel].summary }]),
      ),
      measurements,
    };
  } catch (error) {
    schedule = { error: error instanceof Error ? error.message : "Schedule stage failed." };
  }
  const generated = await generateDailyProposal(ownerUserId);
  let autoPublished: { campaignId: string } | null = null;
  const proposal: any = (generated as any).proposal || null;
  if (proposal && proposal.status === "pending" && proposal.source_type !== "seo") {
    const state = await pool.query(`SELECT publish_enabled FROM marketing_catalog_autopilot WHERE owner_user_id=$1 LIMIT 1`, [ownerUserId]);
    if (state.rows[0]?.publish_enabled === true && (proposal.channels || []).length) {
      const materialized = await materializeProposal(ownerUserId, proposal, "week");
      autoPublished = { campaignId: materialized.campaignId };
    }
  }
  // Ciclo rápido ULTRA: medición temprana (4–20 h) de lo ya publicado y
  // foto fresca del informe de inteligencia. Aislado: si falla, el resto
  // del ciclo diario no se entera.
  let intelligence: unknown = null;
  try {
    intelligence = await runFastLearningCycle(ownerUserId);
  } catch (error) {
    intelligence = { error: error instanceof Error ? error.message : "Fast learning cycle failed." };
  }
  return {
    windowClosed: closed.closed,
    seoLearning,
    schedule,
    intelligence,
    cadence: (generated as any).cadence || null,
    generated: Boolean((generated as any).generated),
    existing: Boolean((generated as any).existing),
    reason: (generated as any).reason || null,
    proposalId: proposal?.id || null,
    proposalScheduledFor: proposal?.scheduled_for || null,
    proposalStatus: autoPublished ? "approved" : proposal?.status || null,
    autoPublished,
  };
}
