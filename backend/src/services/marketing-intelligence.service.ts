/**
 * Marketing Intelligence — nivel ULTRA (2026-11-14, orden del dueño)
 *
 * El robot pasa de "aprender una vez por noche" a un aprendizaje ABIERTO y
 * CONTINUO, con la lógica de un asistente que experimenta, analiza, crea y
 * proyecta:
 *
 *  - Aprende de TODAS las señales del sistema a medida que aparecen:
 *    publicaciones orgánicas (IG/FB), Google (Search Console + GA4),
 *    consultas de WhatsApp del panel (preguntas y objeciones reales),
 *    pedidos/ventas reales de la tienda y — cuando exista el token de
 *    System User — las campañas pagas de Meta Ads. Sin token, ese hueco
 *    se declara; jamás se inventan datos pagos.
 *  - Aprende DEL DUEÑO: cada «sí», cada «no» y cada motivo de rechazo en
 *    el panel es una señal de primer orden (su gusto) que ajusta las
 *    próximas propuestas.
 *  - La cadencia de la casa NO se toca: aire mínimo de 3 días entre
 *    propuestas (2 en ventana de fecha-regalo), como quedó aprobado.
 *    Lo abierto es el APRENDIZAJE, no el ritmo de publicación.
 *  - Cada propuesta trae: puntaje con evidencia, pronóstico honesto
 *    (rango esperado según su historial, o "base insuficiente"),
 *    experimento A/B secuencial con hipótesis, y variantes de texto
 *    adaptadas por canal (Instagram ≠ Facebook ≠ Marketplace ≠ YouTube).
 *  - Alertas de problemas (publicación aprobada que falló, canal caído,
 *    token por vencer/revocado, campaña sin datos) y un informe
 *    ejecutivo con lo aprendido y la próxima jugada recomendada.
 *  - Comprador de anuncios: la estructura de recomendaciones de
 *    presupuesto (escalar / mantener / matar) queda lista y se activa
 *    sola cuando haya observaciones reales de Meta Ads.
 *
 * LÍMITE QUE NO SE MUEVE: "abierto" es el APRENDIZAJE. La publicación
 * sigue saliendo SOLO con el «sí» del dueño en el panel.
 */
import { pool } from "../config/database";
import { getConnections, getYouTubeDiagnosis, getMarketplaceDiagnosis } from "./social-connections.service";
import { getMarketingLearningInsights } from "./marketing-learning.service";
import { getHeatMap, getCadenceState, measureRecentPublications } from "./marketing-schedule.service";

const TZ = "America/Chicago";

export async function ensureIntelligenceTables() {
  await pool.query(`CREATE TABLE IF NOT EXISTS marketing_owner_feedback (
    id BIGSERIAL PRIMARY KEY,
    owner_user_id TEXT NOT NULL,
    proposal_id TEXT NOT NULL,
    decision TEXT NOT NULL,
    scope TEXT,
    variant TEXT,
    reason_code TEXT,
    reason_text TEXT,
    source_type TEXT,
    source_id TEXT,
    title TEXT,
    channels JSONB NOT NULL DEFAULT '[]'::jsonb,
    scheduled_weekday INTEGER,
    scheduled_hour INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  await pool.query(`ALTER TABLE marketing_owner_feedback ADD COLUMN IF NOT EXISTS variant TEXT`);
  await pool.query(`CREATE INDEX IF NOT EXISTS marketing_owner_feedback_owner_idx ON marketing_owner_feedback(owner_user_id, created_at DESC)`);
  await pool.query(`CREATE TABLE IF NOT EXISTS marketing_intelligence_snapshots (
    id BIGSERIAL PRIMARY KEY,
    owner_user_id TEXT NOT NULL,
    kind TEXT NOT NULL DEFAULT 'fast_cycle',
    report JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  await pool.query(`CREATE INDEX IF NOT EXISTS marketing_intelligence_snap_owner_idx ON marketing_intelligence_snapshots(owner_user_id, created_at DESC)`);
}

/* ------------------------- gusto del dueño (sí / no) ------------------------ */

export const REJECTION_REASONS = [
  { code: "product", label: "No me gusta el producto elegido" },
  { code: "text", label: "El texto no me convence" },
  { code: "timing", label: "El día/hora no me cierra" },
  { code: "too_soon", label: "Muy seguido / todavía no" },
  { code: "price_offer", label: "Precio u oferta a ajustar" },
  { code: "other", label: "Otro motivo" },
] as const;

export async function recordOwnerFeedback(ownerUserId: string, input: {
  proposalId: string;
  decision: "approved" | "rejected";
  scope?: string | null;
  variant?: string | null;
  reasonCode?: string | null;
  reasonText?: string | null;
  proposal?: any;
}) {
  await ensureIntelligenceTables();
  const proposal = input.proposal || {};
  const scheduled = proposal.scheduled_for ? new Date(proposal.scheduled_for) : null;
  const local = scheduled ? new Date(scheduled.toLocaleString("en-US", { timeZone: TZ })) : null;
  await pool.query(
    `INSERT INTO marketing_owner_feedback
       (owner_user_id, proposal_id, decision, scope, variant, reason_code, reason_text, source_type, source_id, title, channels, scheduled_weekday, scheduled_hour)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11,$12,$13)`,
    [
      ownerUserId, input.proposalId, input.decision, input.scope || null, input.variant || null,
      input.reasonCode || null, input.reasonText || null,
      proposal.source_type || null, proposal.source_id || null, proposal.title || null,
      JSON.stringify(proposal.channels || []),
      local ? local.getDay() : null, local ? local.getHours() : null,
    ],
  ).catch(() => undefined);
  // La decisión TAMBIÉN entra al motor de aprendizaje como observación
  // (source='user_feedback'): es la señal del gusto del dueño y cuenta en
  // el mismo acumulado que el resto de las fuentes. Idempotente por
  // propuesta+decisión: corregir la decisión no duplica la señal.
  try {
    const channels = Array.isArray(proposal.channels) ? proposal.channels.map(String) : [];
    const known = ["instagram", "facebook", "marketplace", "youtube", "whatsapp", "tiktok", "pinterest", "email"];
    const channel = channels.find((c: string) => known.includes(c)) || "instagram";
    const nowLocal = new Date(new Date().toLocaleString("en-US", { timeZone: TZ }));
    await pool.query(
      `INSERT INTO marketing_learning_observations
         (campaign_id, channel, objective, target_area, hour, weekday, published,
          attribution_key, source, medium, attribution_evidence, observation_date, decision, adjustment)
       VALUES ($1,$2,'owner_feedback','panel',$3,$4,FALSE,$5,'user_feedback','owner',FALSE,$6,$7::jsonb,$8::jsonb)
       ON CONFLICT (attribution_key) DO UPDATE SET
         decision=EXCLUDED.decision, adjustment=EXCLUDED.adjustment, updated_at=NOW()`,
      [
        proposal.materialized_campaign_id ? String(proposal.materialized_campaign_id) : `proposal:${input.proposalId}`,
        channel,
        local ? local.getHours() : nowLocal.getHours(),
        local ? local.getDay() : nowLocal.getDay(),
        `feedback:${input.proposalId}:${input.decision}`,
        nowLocal.toISOString().slice(0, 10).replace(/-/g, ""),
        JSON.stringify({
          stage: "OWNER_FEEDBACK", decision: input.decision, scope: input.scope || null,
          variant: input.variant || null, reasonCode: input.reasonCode || null,
          reasonText: input.reasonText || null, proposalId: input.proposalId,
          sourceType: proposal.source_type || null, sourceId: proposal.source_id || null,
          title: proposal.title || null, observedAt: new Date().toISOString(),
        }),
        JSON.stringify({ stage: "ADJUSTMENT", signal: "owner_taste", decision: input.decision }),
      ],
    );
  } catch { /* la tabla de feedback ya guardó la señal; la observación es el espejo del motor */ }
}

export type OwnerTasteProfile = {
  decisions: number;
  approvals: number;
  rejections: number;
  approvalRate: number | null;
  topRejectionReasons: { code: string; label: string; count: number }[];
  rejectedSourceIds: string[];
  approvedSourceIds: string[];
  preferredWeekdays: { weekday: number; approvals: number }[];
  note: string;
};

export async function getOwnerTasteProfile(ownerUserId: string): Promise<OwnerTasteProfile> {
  await ensureIntelligenceTables();
  const empty: OwnerTasteProfile = {
    decisions: 0, approvals: 0, rejections: 0, approvalRate: null,
    topRejectionReasons: [], rejectedSourceIds: [], approvedSourceIds: [],
    preferredWeekdays: [], note: "Todavía no hay decisiones del dueño registradas: el gusto se empieza a aprender con el primer sí o no en el panel.",
  };
  try {
    const totals = await pool.query(
      `SELECT COUNT(*)::int AS n,
              COUNT(*) FILTER (WHERE decision='approved')::int AS ok,
              COUNT(*) FILTER (WHERE decision='rejected')::int AS no
       FROM marketing_owner_feedback WHERE owner_user_id=$1`,
      [ownerUserId],
    );
    const n = Number(totals.rows[0]?.n || 0);
    if (!n) return empty;
    const reasons = await pool.query(
      `SELECT reason_code, COUNT(*)::int AS n FROM marketing_owner_feedback
       WHERE owner_user_id=$1 AND decision='rejected' AND reason_code IS NOT NULL
       GROUP BY reason_code ORDER BY n DESC LIMIT 4`,
      [ownerUserId],
    );
    const sources = await pool.query(
      `SELECT decision, source_id FROM marketing_owner_feedback
       WHERE owner_user_id=$1 AND source_id IS NOT NULL ORDER BY created_at DESC LIMIT 60`,
      [ownerUserId],
    );
    const weekdays = await pool.query(
      `SELECT scheduled_weekday, COUNT(*)::int AS n FROM marketing_owner_feedback
       WHERE owner_user_id=$1 AND decision='approved' AND scheduled_weekday IS NOT NULL
       GROUP BY scheduled_weekday ORDER BY n DESC LIMIT 3`,
      [ownerUserId],
    );
    const labelOf = (code: string) => REJECTION_REASONS.find((r) => r.code === code)?.label || code;
    const approvals = Number(totals.rows[0]?.ok || 0);
    const rejections = Number(totals.rows[0]?.no || 0);
    return {
      decisions: n,
      approvals,
      rejections,
      approvalRate: n ? Number((approvals / n).toFixed(2)) : null,
      topRejectionReasons: reasons.rows.map((r: any) => ({ code: String(r.reason_code), label: labelOf(String(r.reason_code)), count: Number(r.n) })),
      rejectedSourceIds: sources.rows.filter((r: any) => r.decision === "rejected").map((r: any) => String(r.source_id)),
      approvedSourceIds: sources.rows.filter((r: any) => r.decision === "approved").map((r: any) => String(r.source_id)),
      preferredWeekdays: weekdays.rows.map((r: any) => ({ weekday: Number(r.scheduled_weekday), approvals: Number(r.n) })),
      note: `El dueño decidió ${n} propuesta(s): ${approvals} sí y ${rejections} no. Ese gusto ya pesa en el puntaje de las próximas propuestas.`,
    };
  } catch {
    return empty;
  }
}

/* --------------------------- señales de WhatsApp --------------------------- */

const WHATSAPP_TOPICS: { code: string; label: string; kind: "pregunta" | "objecion"; patterns: string[] }[] = [
  { code: "price", label: "Precio / cuánto cuesta", kind: "objecion", patterns: ["precio", "cuesta", "cuanto vale", "cuánto vale", "cost", "price", "how much"] },
  { code: "shipping", label: "Envío / entrega a domicilio", kind: "pregunta", patterns: ["envio", "envío", "shipping", "delivery", "entregan", "llega a"] },
  { code: "time", label: "Tiempo de preparación", kind: "objecion", patterns: ["cuanto tarda", "cuánto tarda", "cuando esta", "cuándo está", "how long", "ready", "demora", "tardan"] },
  { code: "custom", label: "Personalización (foto, nombre, diseño)", kind: "pregunta", patterns: ["foto", "personaliz", "nombre", "diseno", "diseño", "custom", "photo", "logo"] },
  { code: "payment", label: "Formas de pago", kind: "pregunta", patterns: ["pago", "pagar", "tarjeta", "zelle", "cash", "payment", "pay"] },
  { code: "sizes", label: "Tamaños / cantidades", kind: "pregunta", patterns: ["tamano", "tamaño", "medida", "docena", "cantidad", "size", "bulk", "mayoreo"] },
];

export async function getWhatsappSignals(ownerUserId: string, days = 30) {
  try {
    const result = await pool.query(
      `SELECT body, created_at FROM marketing_whatsapp_messages
       WHERE direction='in' AND COALESCE(auto_reply, FALSE)=FALSE AND body <> ''
         AND created_at >= NOW() - ($1::int || ' days')::interval
       ORDER BY created_at DESC LIMIT 800`,
      [days],
    );
    const counts = new Map<string, number>();
    let total = 0;
    for (const row of result.rows as any[]) {
      total += 1;
      const text = ` ${String(row.body || "").toLowerCase()} `;
      for (const topic of WHATSAPP_TOPICS) {
        if (topic.patterns.some((p) => text.includes(p))) counts.set(topic.code, (counts.get(topic.code) || 0) + 1);
      }
    }
    const topics = WHATSAPP_TOPICS
      .map((t) => ({ code: t.code, label: t.label, kind: t.kind, count: counts.get(t.code) || 0 }))
      .filter((t) => t.count > 0)
      .sort((a, b) => b.count - a.count);
    return {
      windowDays: days,
      inboundMessages: total,
      topics,
      note: total
        ? "Temas reales detectados en las consultas que llegan al WhatsApp del negocio (sin guardar datos personales: solo conteos por tema)."
        : "Sin consultas de WhatsApp registradas en la ventana: esta señal se activa sola cuando entren mensajes.",
    };
  } catch {
    return { windowDays: days, inboundMessages: 0, topics: [], note: "La bandeja de WhatsApp todavía no tiene mensajes registrados en el sistema." };
  }
}

/* ------------------------------ ventas reales ------------------------------ */

export async function getSalesSignals(days = 30) {
  try {
    const totals = await pool.query(
      `SELECT COUNT(*)::int AS orders, COALESCE(SUM(total),0)::numeric AS revenue
       FROM orders
       WHERE created_at >= NOW() - ($1::int || ' days')::interval
         AND payment_status IN ('paid','completed','succeeded')`,
      [days],
    );
    const byProduct = await pool.query(
      `SELECT COALESCE(oi.product_name, 'Producto') AS name,
              SUM(oi.quantity)::int AS units, COALESCE(SUM(oi.quantity * oi.unit_price),0)::numeric AS revenue
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE o.created_at >= NOW() - ($1::int || ' days')::interval
         AND o.payment_status IN ('paid','completed','succeeded')
       GROUP BY 1 ORDER BY revenue DESC LIMIT 6`,
      [days],
    ).catch(() => ({ rows: [] }));
    return {
      windowDays: days,
      orders: Number(totals.rows[0]?.orders || 0),
      revenue: Number(totals.rows[0]?.revenue || 0),
      topProducts: byProduct.rows.map((r: any) => ({ name: String(r.name), units: Number(r.units || 0), revenue: Number(r.revenue || 0) })),
      note: "Ventas reales de la tienda (pedidos pagados). La tarjeta de «ventas» del panel muestra $0 cuando no hay pedidos pagados en el período: no es un error, es la caja real.",
    };
  } catch {
    return { windowDays: days, orders: 0, revenue: 0, topProducts: [], note: "Sin acceso a pedidos en esta ventana." };
  }
}

/* ------------------------- pronóstico y puntaje ---------------------------- */

async function channelHistory(ownerUserId: string, channel: string) {
  try {
    const result = await pool.query(
      `SELECT impressions,
              (COALESCE((decision->'metrics'->>'likes')::int,0) + COALESCE((decision->'metrics'->>'comments')::int,0)
               + COALESCE((decision->'metrics'->>'shares')::int,0) + COALESCE((decision->'metrics'->>'saved')::int,0)) AS interactions
       FROM marketing_learning_observations
       WHERE channel=$1 AND attribution_key LIKE 'social:%' AND impressions > 0
       ORDER BY created_at DESC LIMIT 60`,
      [channel],
    );
    const rows = result.rows.map((r: any) => ({ reach: Number(r.impressions || 0), interactions: Number(r.interactions || 0) }));
    return rows;
  } catch {
    return [] as { reach: number; interactions: number }[];
  }
}

const rangeOf = (values: number[]) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const pick = (q: number) => sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor(q * sorted.length)))];
  return { low: pick(0.25), mid: pick(0.5), high: pick(0.75) };
};

export type ProposalIntelligence = {
  score: number;
  scoreLabel: string;
  components: { key: string; label: string; points: number; max: number; evidence: string }[];
  forecast: { channel: string; sampleSize: number; reach: { low: number; mid: number; high: number } | null; interactions: { low: number; mid: number; high: number } | null; note: string };
  experiment: { id: string; designatedVariant: "A" | "B"; hypothesis: string; variantA: string; variantB: string; measureWith: string };
  channelVariants: { channel: string; format: string; text: string; hypothesis: string }[];
  tasteApplied: string[];
};

/** Variantes de texto por canal: cada red lee distinto y la propuesta lo respeta. */
export function buildChannelVariants(input: {
  title: string;
  baseCaption: string;
  productLink: string;
  whatsappLink: string;
  price?: number | null;
  seoTags?: string;
}) {
  const firstLine = String(input.baseCaption || "").split("\n").filter(Boolean)[0] || input.title;
  return [
    {
      channel: "instagram",
      format: "Pie de foto con gancho en la primera línea + hashtags reales de búsqueda",
      text: `${firstLine}\n\n${input.baseCaption}${input.seoTags ? `\n\n${input.seoTags}` : ""}`,
      hypothesis: "En Instagram el gancho visual de la primera línea y los términos que la gente ya busca en Google deciden el alcance.",
    },
    {
      channel: "facebook",
      format: "Texto conversacional con link directo a la tienda y a WhatsApp",
      text: `${input.baseCaption}\n\n🛒 Shop here: ${input.productLink}\n💬 Or message us on WhatsApp: ${input.whatsappLink}`,
      hypothesis: "En Facebook el link visible y el camino corto a WhatsApp convierten mejor que un texto largo.",
    },
    {
      channel: "marketplace",
      format: "Ficha estructurada: título claro, qué es y cómo se pide",
      text: `${input.title}\n\n${firstLine}\n\nPersonalized just for you. Order on WhatsApp or from the store: ${input.productLink}`,
      hypothesis: "En Marketplace la gente compara la claridad de la ficha antes de escribir: estructura corta y pedido por WhatsApp o tienda. Sin precio en el texto (el precio real va por mensaje).",
    },
    {
      channel: "youtube",
      format: "Título + descripción para video (sale cuando la propuesta tenga video)",
      text: `${input.title} | JQYDesigns\n\n${firstLine}\n\nOrder here: ${input.productLink}\nWhatsApp: ${input.whatsappLink}`,
      hypothesis: "En YouTube el título con el nombre exacto del producto captura la búsqueda; la descripción lleva el link.",
    },
  ];
}

/** Inserta una línea antes del bloque final de hashtags (o al final si no hay). */
const insertBeforeHashtags = (caption: string, line: string): string => {
  const blocks = String(caption || "").split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  const last = blocks[blocks.length - 1] || "";
  if (/^#/.test(last)) blocks.splice(blocks.length - 1, 0, line);
  else blocks.push(line);
  return blocks.join("\n\n");
};

export async function buildProposalIntelligence(ownerUserId: string, input: {
  title: string;
  caption: string;
  sourceType: string;
  sourceId: string;
  primaryChannel: string;
  channels: string[];
  slot: { mode: string; evidenceText: string; weekday: number; hour: number } | null;
  seoMatchedQueries: number;
  seasonalMatch: boolean;
  productLink: string;
  whatsappLink: string;
  price?: number | null;
  seoTags?: string;
  rotationSeed: number;
}): Promise<ProposalIntelligence> {
  const components: ProposalIntelligence["components"] = [];
  const insights = await getMarketingLearningInsights(undefined, undefined, ownerUserId).catch(() => []);
  const channelInsight = insights.find((row: any) => row.channel === input.primaryChannel) as any;
  const channelScore = channelInsight ? Number(channelInsight.score || 0) : 0;
  components.push({
    key: "channel", label: "Canal con mejor aprendizaje", points: Math.round(channelScore * 25), max: 25,
    evidence: channelInsight
      ? `${input.primaryChannel}: puntaje del motor ${channelScore.toFixed(2)} con ${channelInsight.evidenceObservations} observaciones con evidencia.`
      : `Sin puntaje del motor para ${input.primaryChannel} todavía.`,
  });
  components.push({
    key: "slot", label: "Día y hora", points: input.slot ? (input.slot.mode === "data" ? 25 : input.slot.mode === "weak" ? 15 : 8) : 5, max: 25,
    evidence: input.slot ? input.slot.evidenceText : "Sin recomendación de horario calculada.",
  });
  components.push({
    key: "demand", label: "Demanda real (Google)", points: input.seoMatchedQueries > 0 ? 20 : 6, max: 20,
    evidence: input.seoMatchedQueries > 0
      ? `El producto coincide con ${input.seoMatchedQueries} búsqueda(s) reales de Search Console.`
      : "El producto no coincide aún con búsquedas registradas: se propone por catálogo, no por demanda medida.",
  });
  components.push({
    key: "season", label: "Momento / temporada", points: input.seasonalMatch ? 15 : 8, max: 15,
    evidence: input.seasonalMatch ? "El producto es de la fecha-regalo que se viene: publicar ANTES del evento." : "Sin fecha-regalo inmediata para este producto.",
  });

  const taste = await getOwnerTasteProfile(ownerUserId);
  const tasteApplied: string[] = [];
  let tastePoints = 8;
  if (taste.rejectedSourceIds.includes(input.sourceId)) {
    tastePoints = 2;
    tasteApplied.push("Ojo: el dueño ya rechazó este mismo producto antes; el puntaje baja y conviene mirar el motivo registrado.");
  } else if (taste.approvedSourceIds.includes(input.sourceId)) {
    tastePoints = 15;
    tasteApplied.push("El dueño ya aprobó este producto antes: su gusto suma a favor.");
  } else if (taste.decisions > 0) {
    tasteApplied.push(`Gusto del dueño: ${taste.decisions} decisiones registradas (aprobación ${(taste.approvalRate !== null ? Math.round(taste.approvalRate * 100) : 0)}%) ya forman parte del criterio.`);
  }
  components.push({ key: "taste", label: "Gusto del dueño", points: tastePoints, max: 15, evidence: tasteApplied[0] || "Sin decisiones previas sobre este producto." });

  const score = components.reduce((sum, c) => sum + c.points, 0);
  const scoreLabel = score >= 75 ? "Fuerte" : score >= 55 ? "Buena" : score >= 40 ? "Regular" : "Débil (experimento)";

  const history = await channelHistory(ownerUserId, input.primaryChannel);
  const forecast = {
    channel: input.primaryChannel,
    sampleSize: history.length,
    reach: rangeOf(history.map((h) => h.reach)),
    interactions: rangeOf(history.map((h) => h.interactions)),
    note: history.length >= 3
      ? `Pronóstico desde ${history.length} publicaciones reales de ${input.primaryChannel} (rango entre el 25% y el 75% de sus resultados). No es promesa: es su historial.`
      : `Base insuficiente en ${input.primaryChannel} (${history.length} publicaciones medidas): no se pronostica sin datos. Esta publicación también sirve para medir.`,
  };

  const designatedVariant: "A" | "B" = input.rotationSeed % 2 === 0 ? "A" : "B";
  // Variante B: el mismo texto base con un llamado directo insertado
  // ANTES de los hashtags. No agrega links: el caption ya lleva la URL
  // de la tienda y el WhatsApp (ensureOrderingBlock en buildProposal),
  // así que repetirlos aquí duplicaría el bloque de pedido.
  const variantB = insertBeforeHashtags(
    input.caption,
    "💬 Want one like this? Message us today — we make it just for you.",
  );
  const experiment = {
    id: `exp-${input.sourceType}-${input.rotationSeed}`,
    // La variante sugerida rota entre propuestas, pero la que se publica
    // la ELIGE el dueño al aprobar (A o B) en el panel: nada se cambia solo.
    designatedVariant,
    hypothesis: designatedVariant === "B"
      ? "Hipótesis: cerrar el texto con un llamado directo a escribirnos (variante B) genera más consultas que el texto base (variante A). Sugerida esta vez: B — el dueño elige cuál sale al aprobar."
      : "Hipótesis: el texto base (variante A) rinde igual o mejor que el cierre con llamado directo. Sugerida esta vez: A — el dueño elige cuál sale al aprobar.",
    variantA: input.caption,
    variantB,
    measureWith: "Se compara con la medición de 24–48 h (y la señal temprana de 4–20 h) de las publicaciones según la variante que el dueño eligió al aprobar: alcance, interacciones, sesiones y consultas.",
  };

  return {
    score, scoreLabel, components, forecast, experiment,
    channelVariants: buildChannelVariants({
      title: input.title, baseCaption: input.caption, productLink: input.productLink,
      whatsappLink: input.whatsappLink, price: input.price, seoTags: input.seoTags,
    }),
    tasteApplied,
  };
}

/* ------------------------------ alertas ULTRA ------------------------------ */

export type RobotAlert = { level: "critical" | "warning" | "info"; title: string; detail: string };

export async function buildAlerts(ownerUserId: string): Promise<RobotAlert[]> {
  const alerts: RobotAlert[] = [];
  // Publicación aprobada que falló.
  try {
    const failed = await pool.query(
      `SELECT r.campaign_id, r.channel, r.error, r.created_at, c.name
       FROM marketing_campaign_runs r JOIN marketing_campaigns c ON c.id = r.campaign_id
       WHERE c.owner_user_id=$1 AND c.campaign_type='proposal' AND r.published=FALSE
         AND r.created_at >= NOW() - INTERVAL '7 days'
       ORDER BY r.created_at DESC LIMIT 3`,
      [ownerUserId],
    );
    for (const row of failed.rows as any[]) {
      alerts.push({
        level: "critical",
        title: `Una publicación aprobada falló en ${row.channel}`,
        detail: `«${row.name}» no salió (${row.created_at}). ${row.error ? `Motivo registrado: ${String(row.error).slice(0, 180)}` : "Sin motivo registrado: revisar la conexión del canal."}`,
      });
    }
  } catch { /* sin tabla de corridas accesible: no se inventa la alerta */ }
  // Canales y tokens.
  try {
    const connections: any = await getConnections(ownerUserId);
    const channels = connections?.channels || {};
    if (!channels.meta && !channels.facebook && !channels.instagram) {
      alerts.push({ level: "critical", title: "Meta no está conectado", detail: "Sin Meta no hay Instagram ni Facebook: hay que reconectar desde Cuentas conectadas." });
    }
    if (channels.youtube) {
      const diagnosis: any = await getYouTubeDiagnosis(ownerUserId).catch(() => null);
      // Solo es "revocado" si la última falla es POSTERIOR a la última
      // actualización de la conexión (si el dueño reconectó después de la
      // falla, el token actual es el nuevo y no hay que asustar de más).
      const failedAt = diagnosis?.lastRefreshFailedAt ? new Date(diagnosis.lastRefreshFailedAt).getTime() : 0;
      const updatedAt = diagnosis?.updatedAt ? new Date(diagnosis.updatedAt).getTime() : 0;
      if (failedAt && failedAt > updatedAt) {
        alerts.push({ level: "critical", title: "El token de YouTube está revocado", detail: "La renovación automática falló y no hubo reconexión posterior: hay que reconectarlo con un clic en el panel. Además, mientras la app de Google siga en modo Testing, el token vence a los ~7 días." });
      } else {
        alerts.push({ level: "warning", title: "YouTube: el token puede vencer hacia el 21-nov", detail: "La app OAuth de Google sigue en modo Testing y en ese modo los tokens mueren a los 7 días. El arreglo permanente es del dueño: publicar la app en Google Cloud y reconectar una vez más, en ese orden." });
      }
    }
    const marketplace: any = await getMarketplaceDiagnosis(ownerUserId).catch(() => null);
    if (marketplace && !marketplace.ready) {
      alerts.push({ level: "warning", title: "Marketplace sigue bloqueado", detail: marketplace.note || "Falta el permiso de catálogo de Commerce: es un paso del dueño en Meta." });
    }
  } catch { /* conexiones no legibles: sin alerta inventada */ }
  // Datos pagos.
  try {
    const ads = await pool.query(
      `SELECT COUNT(*)::int AS n FROM marketing_learning_observations WHERE source='meta_ads'`,
    ).catch(() => ({ rows: [{ n: 0 }] }));
    if (!process.env.META_ADS_SYSTEM_USER_TOKEN?.trim()) {
      alerts.push({ level: "warning", title: "La campaña paga todavía no entra al aprendizaje", detail: `Falta el token de System User de Meta (META_ADS_SYSTEM_USER_TOKEN): el puente está construido y responde missing_token. Observaciones pagas ingeridas hasta ahora: ${Number(ads.rows[0]?.n || 0)}. Es un paso guiado del dueño en Business Settings.` });
    }
  } catch { /* sin lectura: sin alerta */ }
  // Propuesta aprobada sin medición tras 72 h.
  try {
    const stale = await pool.query(
      `SELECT c.id, c.name FROM marketing_campaigns c
       WHERE c.owner_user_id=$1 AND c.campaign_type='proposal' AND c.created_at < NOW() - INTERVAL '72 hours'
         AND EXISTS (SELECT 1 FROM marketing_campaign_runs r WHERE r.campaign_id=c.id AND r.published=TRUE)
         AND NOT EXISTS (SELECT 1 FROM marketing_schedule_measurements m WHERE m.campaign_id=c.id)
       ORDER BY c.created_at DESC LIMIT 2`,
      [ownerUserId],
    );
    for (const row of stale.rows as any[]) {
      alerts.push({ level: "info", title: "Publicación sin medición todavía", detail: `«${row.name}» salió hace más de 72 h y aún no tiene medición registrada: el ciclo rápido la sigue buscando; si el canal no entrega datos, queda declarado acá y no se rellena con estimaciones.` });
    }
  } catch { /* sin datos: sin alerta */ }
  return alerts;
}

/* --------------------------- comprador de anuncios -------------------------- */

export async function buildMediaBuyerBrief(ownerUserId: string) {
  let campaigns: any[] = [];
  try {
    const result = await pool.query(
      `SELECT campaign_id,
              SUM(impressions)::int AS impressions, SUM(clicks)::int AS clicks,
              SUM(conversions)::int AS conversions, SUM(revenue)::numeric AS revenue
       FROM marketing_learning_observations
       WHERE source='meta_ads'
       GROUP BY campaign_id ORDER BY impressions DESC LIMIT 10`,
    );
    campaigns = result.rows.map((r: any) => {
      const impressions = Number(r.impressions || 0);
      const clicks = Number(r.clicks || 0);
      return {
        campaignId: String(r.campaign_id), impressions, clicks,
        ctr: impressions ? Number((clicks / impressions).toFixed(4)) : 0,
        conversions: Number(r.conversions || 0), revenue: Number(r.revenue || 0),
      };
    });
  } catch { campaigns = []; }
  const spendRows = await pool.query(
    `SELECT id, results->'metaAds'->>'spend' AS spend FROM marketing_campaigns WHERE campaign_type='paid' LIMIT 10`,
  ).catch(() => ({ rows: [] }));
  const spendByCampaign = new Map(spendRows.rows.map((r: any) => [String(r.id), Number(r.spend || 0)]));
  const recommendations = campaigns.map((c) => {
    const spend = spendByCampaign.get(c.campaignId) || 0;
    let action = "mantener y seguir midiendo";
    if (c.impressions >= 1000 && c.ctr < 0.005) action = "matar o cambiar el creativo: mucha muestra y CTR muy bajo";
    else if (c.ctr >= 0.015 && spend > 0) action = "escalar de a poco (+20%): CTR sano con gasto real";
    else if (spend >= 25 && c.conversions === 0) action = "pausar y revisar destino/oferta: gastó un ciclo completo sin conversiones";
    return { ...c, spend, recommendation: action };
  });
  const active = campaigns.length > 0;
  return {
    status: active ? "active" : "blocked",
    reason: active ? null : "Sin datos pagos todavía: falta el token de System User de Meta. La estructura está lista y se activa sola cuando entren las primeras observaciones de Meta Ads — no se recomienda presupuesto sin datos reales.",
    policy: [
      "Cada dólar va primero a la campaña con mejor CTR y costo por resultado medido, no a la más nueva.",
      "Escalar de a poco (+20%) solo con CTR sano y conversiones reales; nunca duplicar de golpe.",
      "Matar lo que gasta un ciclo completo sin conversiones o con CTR muy bajo tras 1.000+ impresiones.",
      "Lo que gana en pago se convierte en propuesta orgánica: lograr gratis lo que hoy se paga.",
    ],
    campaigns: recommendations,
    transferToOrganic: active
      ? "Con datos pagos presentes, la próxima propuesta orgánica debe espejar el creativo/ángulo ganador de la campaña paga mejor medida."
      : "Cuando entre el primer dato pago, su ángulo ganador pasa a ser la base de la siguiente propuesta orgánica.",
  };
}

/* --------------- ingestión de señales: WhatsApp y ventas ------------------ */

/**
 * Las señales del negocio (consultas de WhatsApp y ventas reales) entran
 * al motor como observaciones diarias, con su source/medium propios e
 * idempotencia por día. Solo se escribe un día si hubo actividad REAL:
 * un día en cero no se rellena con una fila inventada — la ausencia
 * también se declara en el informe, no se disfraza.
 */
export async function syncStoreSignalsLearning(ownerUserId: string) {
  const result = { whatsappDays: 0, whatsappMessages: 0, salesDays: 0, salesOrders: 0, salesRevenue: 0 };
  // WhatsApp: un agregado por día (últimos 7 días) con el desglose por tema.
  try {
    const rows = await pool.query(
      `SELECT (created_at AT TIME ZONE '${TZ}')::date::text AS day, body
       FROM marketing_whatsapp_messages
       WHERE direction='in' AND COALESCE(auto_reply, FALSE)=FALSE AND body <> ''
         AND created_at >= NOW() - INTERVAL '7 days'`,
    );
    const byDay = new Map<string, { total: number; topics: Map<string, number> }>();
    for (const row of rows.rows as any[]) {
      const day = String(row.day);
      if (!byDay.has(day)) byDay.set(day, { total: 0, topics: new Map() });
      const entry = byDay.get(day)!;
      entry.total += 1;
      const text = ` ${String(row.body || "").toLowerCase()} `;
      for (const topic of WHATSAPP_TOPICS) {
        if (topic.patterns.some((p) => text.includes(p))) entry.topics.set(topic.code, (entry.topics.get(topic.code) || 0) + 1);
      }
    }
    for (const [day, entry] of byDay) {
      const [y, m, d] = day.split("-").map(Number);
      const local = new Date(y, (m || 1) - 1, d || 1);
      await pool.query(
        `INSERT INTO marketing_learning_observations
           (campaign_id, channel, objective, target_area, hour, weekday, published, sessions,
            attribution_key, source, medium, attribution_evidence, observation_date, decision, adjustment)
         VALUES ('store-whatsapp','whatsapp','customer_questions','store',12,$1,FALSE,$2,$3,'whatsapp','organic',TRUE,$4,$5::jsonb,$6::jsonb)
         ON CONFLICT (attribution_key) DO UPDATE SET
           sessions=EXCLUDED.sessions, decision=EXCLUDED.decision, adjustment=EXCLUDED.adjustment, updated_at=NOW()`,
        [
          local.getDay(), entry.total, `whatsapp:topics:${day.replace(/-/g, "")}`, day.replace(/-/g, ""),
          JSON.stringify({ stage: "RESULT", kind: "whatsapp_daily", inboundMessages: entry.total, topics: Object.fromEntries(entry.topics), observedAt: new Date().toISOString() }),
          JSON.stringify({ stage: "ADJUSTMENT", kind: "whatsapp_daily", topTopic: [...entry.topics.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || null }),
        ],
      );
      result.whatsappDays += 1;
      result.whatsappMessages += entry.total;
    }
  } catch { /* sin bandeja accesible: la señal queda declarada en el informe */ }
  // Ventas: un agregado por día con pedidos pagados (conversiones e
  // ingresos reales de la tienda, hasta el dólar).
  try {
    const rows = await pool.query(
      `SELECT (created_at AT TIME ZONE '${TZ}')::date::text AS day,
              COUNT(*)::int AS orders, COALESCE(SUM(total),0)::numeric AS revenue
       FROM orders
       WHERE created_at >= NOW() - INTERVAL '30 days'
         AND payment_status IN ('paid','completed','succeeded')
       GROUP BY 1 ORDER BY 1`,
    );
    for (const row of rows.rows as any[]) {
      const day = String(row.day);
      const [y, m, d] = day.split("-").map(Number);
      const local = new Date(y, (m || 1) - 1, d || 1);
      const orders = Number(row.orders || 0);
      const revenue = Number(row.revenue || 0);
      if (!orders) continue;
      await pool.query(
        `INSERT INTO marketing_learning_observations
           (campaign_id, channel, objective, target_area, hour, weekday, published, conversions, revenue,
            attribution_key, source, medium, attribution_evidence, observation_date, decision, adjustment)
         VALUES ('store-sales','store','store_sales','store',12,$1,FALSE,$2,$3,$4,'store_sales','direct',TRUE,$5,$6::jsonb,$7::jsonb)
         ON CONFLICT (attribution_key) DO UPDATE SET
           conversions=EXCLUDED.conversions, revenue=EXCLUDED.revenue, decision=EXCLUDED.decision, adjustment=EXCLUDED.adjustment, updated_at=NOW()`,
        [
          local.getDay(), orders, revenue, `sales:daily:${day.replace(/-/g, "")}`, day.replace(/-/g, ""),
          JSON.stringify({ stage: "RESULT", kind: "store_sales_daily", orders, revenue, observedAt: new Date().toISOString() }),
          JSON.stringify({ stage: "ADJUSTMENT", kind: "store_sales_daily", revenuePerOrder: orders ? Number((revenue / orders).toFixed(2)) : 0 }),
        ],
      );
      result.salesDays += 1;
      result.salesOrders += orders;
      result.salesRevenue += revenue;
    }
  } catch { /* sin pedidos accesibles: se declara en el informe */ }
  return result;
}

/* ------------------------- ciclo rápido de aprendizaje ---------------------- */

/**
 * Medición temprana: además de la ventana clásica de 24–48 h, mide las
 * publicaciones con 4–20 h cuando el canal ya entregó señal (la fila de
 * medición se sigue actualizando en la ventana completa; la marca
 * age_hours deja claro que es señal temprana, no el resultado final).
 */
export async function measureEarlyPublications(ownerUserId: string) {
  try {
    const pubs = await pool.query(
      `SELECT r.campaign_id, r.channel, r.external_id, COALESCE(r.published_at, r.created_at) AS published_at,
              c.results->'source'->>'proposalId' AS proposal_id
       FROM marketing_campaign_runs r JOIN marketing_campaigns c ON c.id = r.campaign_id
       WHERE c.owner_user_id=$1 AND c.campaign_type='proposal' AND r.published=TRUE AND r.external_id IS NOT NULL
         AND COALESCE(r.published_at, r.created_at) BETWEEN NOW() - INTERVAL '20 hours' AND NOW() - INTERVAL '4 hours'
         AND NOT EXISTS (SELECT 1 FROM marketing_schedule_measurements m WHERE m.campaign_id=r.campaign_id AND m.channel=r.channel)`,
      [ownerUserId],
    );
    let measured = 0;
    for (const pub of pubs.rows as any[]) {
      const social = await pool.query(
        `SELECT impressions,
                (COALESCE((decision->'metrics'->>'likes')::int,0) + COALESCE((decision->'metrics'->>'comments')::int,0)
                 + COALESCE((decision->'metrics'->>'shares')::int,0) + COALESCE((decision->'metrics'->>'saved')::int,0)) AS interactions
         FROM marketing_learning_observations WHERE attribution_key=$1 LIMIT 1`,
        [`social:${pub.channel}:${pub.external_id}`],
      );
      const impressions = Number(social.rows[0]?.impressions || 0);
      const interactions = Number(social.rows[0]?.interactions || 0);
      if (!impressions && !interactions) continue;
      const publishedAt = new Date(pub.published_at);
      const local = new Date(publishedAt.toLocaleString("en-US", { timeZone: TZ }));
      await pool.query(
        `INSERT INTO marketing_schedule_measurements
           (owner_user_id, campaign_id, proposal_id, channel, external_id, published_at, weekday, hour, measured_at, age_hours, impressions, interactions, sessions, conversions, revenue, response_score)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),$9,$10,$11,0,0,0,$12)
         ON CONFLICT (campaign_id, channel) DO NOTHING`,
        [ownerUserId, pub.campaign_id, pub.proposal_id || null, pub.channel, String(pub.external_id), publishedAt,
         local.getDay(), local.getHours(), Number(((Date.now() - publishedAt.getTime()) / 3600000).toFixed(1)),
         impressions, interactions, impressions + 3 * interactions],
      );
      measured += 1;
    }
    return { measured };
  } catch {
    return { measured: 0 };
  }
}

export async function runFastLearningCycle(ownerUserId: string) {
  await ensureIntelligenceTables();
  const early = await measureEarlyPublications(ownerUserId);
  const full = await measureRecentPublications(ownerUserId).catch(() => ({ measured: 0 }));
  // Señales del negocio (WhatsApp + ventas) al motor, como etapa aislada.
  const signals = await syncStoreSignalsLearning(ownerUserId).catch(() => null);
  const report = await getIntelligenceReport(ownerUserId).catch(() => null);
  if (report) {
    await pool.query(
      `INSERT INTO marketing_intelligence_snapshots (owner_user_id, kind, report) VALUES ($1,'fast_cycle',$2::jsonb)`,
      [ownerUserId, JSON.stringify(report)],
    ).catch(() => undefined);
  }
  return { earlyMeasured: early.measured, fullMeasured: (full as any)?.measured ?? 0, signals, snapshotSaved: Boolean(report) };
}

/* ------------------------------ informe ULTRA ------------------------------ */

export async function getIntelligenceReport(ownerUserId: string) {
  await ensureIntelligenceTables();
  const insights = await getMarketingLearningInsights(undefined, undefined, ownerUserId).catch(() => []);
  const observations = insights.reduce((sum: number, row: any) => sum + Number(row.observations || 0), 0);
  const bySource = await pool.query(
    `SELECT COALESCE(source,'legacy') AS source, COUNT(*)::int AS n FROM marketing_learning_observations GROUP BY 1 ORDER BY n DESC`,
  ).catch(() => ({ rows: [] }));
  const taste = await getOwnerTasteProfile(ownerUserId);
  const whatsapp = await getWhatsappSignals(ownerUserId);
  const sales = await getSalesSignals(30);
  const alerts = await buildAlerts(ownerUserId);
  const mediaBuyer = await buildMediaBuyerBrief(ownerUserId);
  const cadence = await getCadenceState(ownerUserId).catch(() => null);
  const heatMap = await getHeatMap(ownerUserId).catch(() => null);

  // Lecciones con evidencia (nada de frases vacías).
  const lessons: string[] = [];
  const bestChannel = [...insights].filter((r: any) => r.evidenceObservations > 0).sort((a: any, b: any) => b.score - a.score)[0] as any;
  if (bestChannel) lessons.push(`Canal con mejor puntaje del motor: ${bestChannel.channel} (${Number(bestChannel.score).toFixed(2)}) con ${bestChannel.evidenceObservations} observaciones con evidencia.`);
  if (heatMap) {
    for (const channel of Object.keys(heatMap) as (keyof typeof heatMap)[]) {
      const heat: any = (heatMap as any)[channel];
      if (heat?.mode === "data" && heat?.summary) lessons.push(heat.summary);
    }
  }
  if (whatsapp.topics[0]) lessons.push(`Lo que más preguntan por WhatsApp: «${whatsapp.topics[0].label}» (${whatsapp.topics[0].count} consultas en ${whatsapp.windowDays} días). Las propuestas deben responder eso en el texto.`);
  if (sales.topProducts[0]) lessons.push(`Lo que más se vende de verdad: ${sales.topProducts[0].name} (${sales.topProducts[0].units} unidades, $${sales.topProducts[0].revenue.toFixed(2)} en ${sales.windowDays} días).`);
  if (taste.decisions) lessons.push(taste.note);
  if (cadence) lessons.push(`Cadencia de la casa: aire de ${cadence.gapDays} día(s) entre propuestas. ${cadence.reason}`);

  // Atribución publicación → sesiones → consultas → pedidos (ventanas honestas).
  let attribution: any[] = [];
  try {
    const rows = await pool.query(
      `SELECT m.campaign_id, m.channel, m.impressions, m.interactions, m.sessions, m.conversions, m.revenue,
              m.published_at, m.age_hours, p.title, p.source_id
       FROM marketing_schedule_measurements m
       LEFT JOIN marketing_proposals p ON p.id = m.proposal_id
       WHERE m.owner_user_id=$1 ORDER BY m.published_at DESC LIMIT 8`,
      [ownerUserId],
    );
    attribution = rows.rows.map((r: any) => ({
      title: r.title || r.campaign_id, channel: r.channel, publishedAt: r.published_at,
      ageHours: Number(r.age_hours || 0), impressions: Number(r.impressions || 0),
      interactions: Number(r.interactions || 0), sessions: Number(r.sessions || 0),
      conversions: Number(r.conversions || 0), revenue: Number(r.revenue || 0),
      note: Number(r.age_hours || 0) < 20 ? "Señal temprana (4–20 h): orienta, no cierra el resultado." : "Medición 24–48 h.",
    }));
  } catch { attribution = []; }

  // Capacidades ULTRA: activas solo si su fuente real existe en el sistema.
  const metaAdsObs = bySource.rows.find((r: any) => r.source === "meta_ads");
  const capabilities = [
    { key: "continuous_learning", label: "Aprendizaje continuo de todas las señales (orgánico + Google)", active: observations > 0, detail: `${observations} observaciones acumuladas.` },
    { key: "owner_taste", label: "Aprende del gusto del dueño (sí / no / motivo)", active: true, detail: taste.decisions ? taste.note : "Activo y esperando la primera decisión con motivo: se aprende desde el primer sí o no." },
    { key: "fast_measurement", label: "Medición rápida (señal 4–20 h + cierre 24–48 h)", active: true, detail: "El ciclo rápido corre con el despertador horario y en el ciclo diario." },
    { key: "house_cadence", label: "Cadencia de la casa respetada (publicar poco y bien)", active: true, detail: cadence ? `Aire vigente: ${cadence.gapDays} día(s) entre propuestas — regla fija aprobada por el dueño, el robot no la cambia solo.` : "Aire mínimo de 3 días entre propuestas (2 en ventana de fecha-regalo): regla fija aprobada por el dueño." },
    { key: "scored_proposals", label: "Propuestas con puntaje, evidencia, pronóstico y experimento A/B", active: true, detail: "Cada propuesta nueva nace con su ficha de inteligencia en el panel." },
    { key: "channel_variants", label: "Variantes de texto adaptadas por canal (IG / FB / Marketplace / YouTube)", active: true, detail: "Preparadas en cada propuesta; cada canal publica su formato cuando el canal está listo." },
    { key: "whatsapp_signals", label: "Señales de WhatsApp (preguntas y objeciones reales)", active: whatsapp.inboundMessages > 0, detail: whatsapp.inboundMessages ? `${whatsapp.inboundMessages} consultas en ${whatsapp.windowDays} días.` : "Sin consultas registradas todavía: se activa con el primer mensaje." },
    { key: "sales_attribution", label: "Atribución a ventas reales de la tienda", active: sales.orders > 0, detail: sales.orders ? `${sales.orders} pedidos pagados en ${sales.windowDays} días.` : "Sin pedidos pagados en la ventana: la caja marca $0 y eso también es un dato." },
    { key: "alerts", label: "Alertas de problemas con aviso en el panel", active: true, detail: `${alerts.length} alerta(s) ahora mismo.` },
    { key: "media_buyer", label: "Comprador de anuncios (presupuesto: escalar / mantener / matar)", active: mediaBuyer.status === "active", detail: mediaBuyer.status === "active" ? "Activo con datos pagos reales." : "Estructura lista; se activa con el token de System User de Meta (paso del dueño)." },
    { key: "marketplace", label: "Publicación en Marketplace", active: false, detail: "Bloqueado por el permiso de catálogo de Commerce (paso del dueño en Meta); las propuestas ya salen preparadas para el canal." },
  ];
  const activeCount = capabilities.filter((c) => c.active).length;

  const nextMove = mediaBuyer.status !== "active"
    ? "Próxima jugada: seguir publicando orgánico con experimento A/B y medición rápida mientras se destraba el token de System User; cuando entre el primer dato pago, su ángulo ganador pasa a orgánico."
    : "Próxima jugada: aplicar la recomendación del comprador de anuncios y espejar el ángulo pago ganador en la siguiente propuesta orgánica.";

  return {
    engine: "JQY Marketing Intelligence ULTRA",
    generatedAt: new Date().toISOString(),
    capabilityTier: "ULTRA",
    capabilitiesActive: activeCount,
    capabilitiesTotal: capabilities.length,
    capabilities,
    learning: {
      observations,
      bySource: bySource.rows.map((r: any) => ({ source: String(r.source), observations: Number(r.n || 0) })),
      channels: insights,
      taste,
    },
    alerts,
    lessons,
    attribution,
    whatsapp,
    sales,
    mediaBuyer,
    cadence: cadence ? { gapDays: cadence.gapDays, eligible: cadence.eligible, reason: cadence.reason, nextEligibleKey: cadence.nextEligibleKey } : null,
    nextMove,
    rule: "Aprendizaje abierto y continuo; publicación SOLO con el sí del dueño en el panel. Sin gasto publicitario. Sin datos inventados: cada hueco se declara.",
  };
}
