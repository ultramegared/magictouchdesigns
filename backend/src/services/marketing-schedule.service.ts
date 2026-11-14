/**
 * Marketing Schedule — lógica de horarios del robot (orden del dueño, 2026-11-14)
 *
 * Su frase: «lo vamos a aplicar; no me importa si publica algo nuevo cada
 * varios días». Esta es la capa de horarios del modo propuesta:
 *
 *  1. MAPA DE CALOR día × hora POR RED (Instagram, Facebook, Marketplace,
 *     YouTube) construido SOLO desde las publicaciones reales de la tienda
 *     (observaciones ya ingeridas por el aprendizaje social): día/hora de
 *     cada publicación (hora de Houston) cruzados con su resultado —
 *     alcance y reacción (me gusta, comentarios, compartidos, guardados) —
 *     normalizado por publicación. Nada de tablas genéricas de internet.
 *     Las APIs sociales entregan métricas acumuladas, no la curva de la
 *     primera hora; la reacción (interacciones por alcance) es el indicador
 *     de respuesta rápida disponible, y se declara como tal.
 *  2. PRIMERA HORA: la publicación aprobada sale al INICIO de su ventana
 *     ganadora (en punto, HH:00 Houston).
 *  3. CADENCIA — publicar POCO Y BIEN: aire mínimo de 3 días calendario
 *     entre propuestas/publicaciones (2 días solo cuando una fecha de
 *     regalo está cerca). Si un día no toca, no se propone nada.
 *  4. CALENDARIO: los productos-regalo se casan con sus fechas (Navidad,
 *     San Valentín, Día de la Madre, Día del Padre) y se publican ANTES
 *     del evento, cruzado con lo que la gente busca en Google (SEO).
 *  5. CICLO DE APRENDIZAJE: cada publicación del robot se mide a las
 *     24–48 h (alcance, reacción, sesiones/conversiones GA4 si las hay) y
 *     el resultado alimenta el mapa (las observaciones se re-ingenian cada
 *     noche y el mapa se reconstruye con ellas).
 *  6. DATOS INSUFICIENTES: si una red no tiene historial medido, el robot
 *     lo dice y propone 2–3 horarios candidatos A PROBAR (experimento).
 *     Jamás inventa una «hora perfecta».
 *
 * Nada de esto publica ni programa solo: la propuesta (con su día y hora)
 * espera el sí del dueño, como todo el modo propuesta.
 */
import { pool } from "../config/database";
import { getSeoInsights } from "./marketing-seo-learning.service";

const TZ = "America/Chicago";
export const SCHEDULE_CHANNELS = ["instagram", "facebook", "marketplace", "youtube"] as const;
export type ScheduleChannel = (typeof SCHEDULE_CHANNELS)[number];

export const CHANNEL_LABELS: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  marketplace: "Marketplace",
  youtube: "YouTube",
};

const WEEKDAY_NAMES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

/** Aire mínimo entre propuestas/publicaciones (días calendario de Houston). */
export const MIN_GAP_DAYS = 3;
/** Con una fecha de regalo encima, el aire puede bajar a 2 días. Nunca diario. */
export const EVENT_GAP_DAYS = 2;
/** Publicaciones medidas mínimas para que el mapa de una red sea confiable. */
const MIN_EVIDENCE_FOR_DATA = 5;
/** Con menos, pero algo medido, la señal se declara débil. */
const MIN_EVIDENCE_FOR_WEAK = 3;

/* ------------------------------ utilidades ------------------------------ */

export const houstonDateKey = (date = new Date()) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);

const addDaysToKey = (key: string, days: number) => {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d) + days * 86400000);
  return dt.toISOString().slice(0, 10);
};

const weekdayOfKey = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
};

const dayDiff = (fromKey: string, toKey: string) => {
  const parse = (k: string) => {
    const [y, m, d] = k.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((parse(toKey) - parse(fromKey)) / 86400000);
};

/** Instante UTC que corresponde a una fecha de Houston a una hora en punto. */
function houstonInstant(dateKey: string, hour: number): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  const target = Date.UTC(y, m - 1, d, hour, 0, 0);
  let utcMs = target;
  for (let i = 0; i < 3; i++) {
    const local = new Date(new Date(utcMs).toLocaleString("en-US", { timeZone: TZ }));
    const drift = target - Date.UTC(local.getFullYear(), local.getMonth(), local.getDate(), local.getHours(), local.getMinutes(), local.getSeconds());
    if (drift === 0) break;
    utcMs += drift;
  }
  return new Date(utcMs);
}

const slotLabel = (dateKey: string, hour: number) =>
  `${WEEKDAY_NAMES[weekdayOfKey(dateKey)]} ${dateKey} a las ${String(hour).padStart(2, "0")}:00`;

/* ------------------------------- tablas --------------------------------- */

export async function ensureScheduleTables() {
  await pool.query(`CREATE TABLE IF NOT EXISTS marketing_schedule_heatmap (
    owner_user_id TEXT NOT NULL,
    channel TEXT NOT NULL,
    mode TEXT NOT NULL,
    payload JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (owner_user_id, channel)
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS marketing_schedule_measurements (
    id BIGSERIAL PRIMARY KEY,
    owner_user_id TEXT NOT NULL,
    campaign_id TEXT NOT NULL,
    proposal_id TEXT,
    channel TEXT NOT NULL,
    external_id TEXT,
    published_at TIMESTAMPTZ NOT NULL,
    weekday INTEGER NOT NULL,
    hour INTEGER NOT NULL,
    measured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    age_hours NUMERIC,
    impressions INTEGER NOT NULL DEFAULT 0,
    interactions INTEGER NOT NULL DEFAULT 0,
    sessions INTEGER NOT NULL DEFAULT 0,
    conversions INTEGER NOT NULL DEFAULT 0,
    revenue NUMERIC(14,2) NOT NULL DEFAULT 0,
    response_score NUMERIC NOT NULL DEFAULT 0,
    UNIQUE (campaign_id, channel)
  )`);
}

/* ---------------------------- mapa de calor ----------------------------- */

export type HeatCell = {
  weekday: number;
  hour: number;
  posts: number;
  avgReach: number;
  avgInteractions: number;
  avgResponse: number;
};

export type ExperimentSlot = { weekday: number; hour: number; label: string };

export type ChannelHeat = {
  channel: ScheduleChannel;
  mode: "data" | "weak" | "experiment";
  totalPosts: number;
  evidencePosts: number;
  cells: HeatCell[];
  weekdayBest: Record<number, { hour: number; avgResponse: number; avgReach: number; posts: number; confirmed: boolean }>;
  bestWindow: (HeatCell & { confirmed: boolean }) | null;
  candidates: ExperimentSlot[];
  summary: string;
  updatedAt: string;
};

export type HeatMap = Record<ScheduleChannel, ChannelHeat>;

/**
 * Horarios candidatos a probar cuando una red no tiene datos medidos.
 * NO son "la hora perfecta": son experimentos en franjas distintas, dos de
 * ellos espejo de las horas con mejor reacción observada en las redes de
 * la tienda que sí tienen datos, para comparar con evidencia propia.
 */
const EXPERIMENT_CANDIDATES: Record<ScheduleChannel, ExperimentSlot[]> = {
  instagram: [
    { weekday: 3, hour: 22, label: "miércoles 22:00" },
    { weekday: 6, hour: 12, label: "sábado 12:00" },
    { weekday: 5, hour: 19, label: "viernes 19:00" },
  ],
  facebook: [
    { weekday: 3, hour: 22, label: "miércoles 22:00 (espejo de la mejor ventana observada en Instagram)" },
    { weekday: 6, hour: 12, label: "sábado 12:00 (hora fuerte observada en Instagram)" },
    { weekday: 5, hour: 19, label: "viernes 19:00 (franja de noche, distinta a probar)" },
  ],
  marketplace: [
    { weekday: 6, hour: 10, label: "sábado 10:00 (fin de semana: la gente busca y compra con tiempo)" },
    { weekday: 0, hour: 12, label: "domingo 12:00" },
    { weekday: 3, hour: 20, label: "miércoles 20:00 (noche de semana, franja distinta)" },
  ],
  youtube: [
    { weekday: 6, hour: 12, label: "sábado 12:00" },
    { weekday: 0, hour: 18, label: "domingo 18:00" },
    { weekday: 3, hour: 20, label: "miércoles 20:00" },
  ],
};

/**
 * Respuesta de una publicación: alcance + reacción ponderada. Una
 * interacción (me gusta, comentario, compartido, guardado) vale más que
 * una vista pasiva porque indica que la audiencia reaccionó — es el
 * indicador de "primera hora" que las APIs realmente entregan.
 */
const responseOf = (impressions: number, interactions: number) => impressions + 3 * interactions;

export async function rebuildHeatMaps(ownerUserId: string): Promise<HeatMap> {
  await ensureScheduleTables();
  const result = await pool.query(
    `SELECT o.channel AS channel,
            EXTRACT(DOW FROM c.created_at AT TIME ZONE '${TZ}')::int AS weekday,
            EXTRACT(HOUR FROM c.created_at AT TIME ZONE '${TZ}')::int AS hour,
            o.impressions AS impressions,
            (COALESCE((o.decision->'metrics'->>'likes')::int, 0)
             + COALESCE((o.decision->'metrics'->>'comments')::int, 0)
             + COALESCE((o.decision->'metrics'->>'shares')::int, 0)
             + COALESCE((o.decision->'metrics'->>'saved')::int, 0)) AS interactions
     FROM marketing_learning_observations o
     JOIN marketing_campaigns c ON c.id = o.campaign_id
     WHERE c.owner_user_id = $1
       AND c.campaign_type = 'organic'
       AND o.medium = 'social'
       AND o.source = o.channel
       AND o.channel = ANY($2::text[])`,
    [ownerUserId, [...SCHEDULE_CHANNELS]],
  );

  const postsByChannel = new Map<string, Array<{ weekday: number; hour: number; impressions: number; interactions: number }>>();
  for (const channel of SCHEDULE_CHANNELS) postsByChannel.set(channel, []);
  for (const row of result.rows as any[]) {
    const list = postsByChannel.get(String(row.channel));
    if (list) list.push({ weekday: Number(row.weekday), hour: Number(row.hour), impressions: Number(row.impressions || 0), interactions: Number(row.interactions || 0) });
  }

  const map = {} as HeatMap;
  for (const channel of SCHEDULE_CHANNELS) {
    const posts = postsByChannel.get(channel) || [];
    const evidence = posts.filter((p) => p.impressions > 0 || p.interactions > 0);

    const cellMap = new Map<string, { weekday: number; hour: number; posts: number; reach: number; interactions: number; response: number }>();
    for (const post of evidence) {
      const key = `${post.weekday}-${post.hour}`;
      const cell = cellMap.get(key) || { weekday: post.weekday, hour: post.hour, posts: 0, reach: 0, interactions: 0, response: 0 };
      cell.posts += 1;
      cell.reach += post.impressions;
      cell.interactions += post.interactions;
      cell.response += responseOf(post.impressions, post.interactions);
      cellMap.set(key, cell);
    }
    const cells: HeatCell[] = [...cellMap.values()].map((cell) => ({
      weekday: cell.weekday,
      hour: cell.hour,
      posts: cell.posts,
      avgReach: Number((cell.reach / cell.posts).toFixed(1)),
      avgInteractions: Number((cell.interactions / cell.posts).toFixed(1)),
      avgResponse: Number((cell.response / cell.posts).toFixed(1)),
    })).sort((a, b) => b.avgResponse - a.avgResponse);

    const weekdayBest: ChannelHeat["weekdayBest"] = {};
    for (const cell of cells) {
      const current = weekdayBest[cell.weekday];
      if (!current || cell.avgResponse > current.avgResponse) {
        weekdayBest[cell.weekday] = { hour: cell.hour, avgResponse: cell.avgResponse, avgReach: cell.avgReach, posts: cell.posts, confirmed: cell.posts >= 2 };
      }
    }

    const confirmedCells = cells.filter((cell) => cell.posts >= 2);
    let mode: ChannelHeat["mode"];
    let bestWindow: ChannelHeat["bestWindow"] = null;
    if (evidence.length >= MIN_EVIDENCE_FOR_DATA && confirmedCells.length) {
      mode = "data";
      bestWindow = { ...confirmedCells[0], confirmed: true };
    } else if (evidence.length >= MIN_EVIDENCE_FOR_WEAK && cells.length) {
      mode = "weak";
      bestWindow = { ...cells[0], confirmed: cells[0].posts >= 2 };
    } else {
      mode = "experiment";
    }

    const label = CHANNEL_LABELS[channel];
    const summary = mode === "data" && bestWindow
      ? `${label}: mejor ventana ${WEEKDAY_NAMES[bestWindow.weekday]} ${String(bestWindow.hour).padStart(2, "0")}:00 — ${bestWindow.posts} publicaciones en ese horario rindieron en promedio ${bestWindow.avgReach} de alcance y ${bestWindow.avgInteractions} interacciones c/u (${evidence.length} publicaciones medidas en total).`
      : mode === "weak" && bestWindow
        ? `${label}: señal todavía débil (${evidence.length} publicaciones medidas, pocas por horario). La mejor pista: ${WEEKDAY_NAMES[bestWindow.weekday]} ${String(bestWindow.hour).padStart(2, "0")}:00 con ${bestWindow.avgReach} de alcance promedio — a confirmar con más publicaciones.`
        : `${label}: sin datos medidos suficientes (${evidence.length} publicaciones con resultado) — no hay hora "perfecta" que inventar; se proponen horarios a probar y se mide cada resultado.`;

    const heat: ChannelHeat = {
      channel,
      mode,
      totalPosts: posts.length,
      evidencePosts: evidence.length,
      cells,
      weekdayBest,
      bestWindow,
      candidates: EXPERIMENT_CANDIDATES[channel],
      summary,
      updatedAt: new Date().toISOString(),
    };
    map[channel] = heat;
    await pool.query(
      `INSERT INTO marketing_schedule_heatmap (owner_user_id, channel, mode, payload, updated_at)
       VALUES ($1,$2,$3,$4::jsonb,NOW())
       ON CONFLICT (owner_user_id, channel) DO UPDATE SET mode=EXCLUDED.mode, payload=EXCLUDED.payload, updated_at=NOW()`,
      [ownerUserId, channel, mode, JSON.stringify(heat)],
    );
  }
  return map;
}

export async function getHeatMap(ownerUserId: string): Promise<HeatMap> {
  await ensureScheduleTables();
  const result = await pool.query(
    `SELECT channel, payload FROM marketing_schedule_heatmap WHERE owner_user_id=$1`,
    [ownerUserId],
  );
  const found = new Map(result.rows.map((row: any) => [String(row.channel), row.payload as ChannelHeat]));
  if (SCHEDULE_CHANNELS.every((channel) => found.has(channel))) {
    return Object.fromEntries(SCHEDULE_CHANNELS.map((channel) => [channel, found.get(channel)])) as HeatMap;
  }
  return rebuildHeatMaps(ownerUserId);
}

/* ------------------------------ calendario ------------------------------ */

export type GiftEvent = {
  key: string;
  name: string;
  eventDateKey: string;
  daysUntil: number;
  keywords: string[];
};

const nthWeekdayOfMonth = (year: number, month: number, weekday: number, n: number) => {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const shift = (weekday - first.getUTCDay() + 7) % 7;
  return new Date(Date.UTC(year, month - 1, 1 + shift + (n - 1) * 7)).toISOString().slice(0, 10);
};

function giftEvents(year: number): Array<GiftEvent & { leadStartKey: string }> {
  const raw: Array<{ key: string; name: string; eventDateKey: string; leadStartKey: string; keywords: string[] }> = [
    { key: "valentines", name: "San Valentín", eventDateKey: `${year}-02-14`, leadStartKey: `${year}-02-01`, keywords: ["valentine", "valentin", "amor", "love", "heart", "corazon", "corazón", "couple", "pareja"] },
    { key: "mothers", name: "Día de la Madre", eventDateKey: nthWeekdayOfMonth(year, 5, 0, 2), leadStartKey: `${year}-05-01`, keywords: ["mother", "mom", "madre", "mama", "mamá"] },
    { key: "fathers", name: "Día del Padre", eventDateKey: nthWeekdayOfMonth(year, 6, 0, 3), leadStartKey: `${year}-06-01`, keywords: ["father", "dad", "padre", "papa", "papá"] },
    { key: "christmas", name: "Navidad", eventDateKey: `${year}-12-25`, leadStartKey: `${year}-11-20`, keywords: ["christmas", "navidad", "xmas", "santa", "holiday", "noel"] },
  ];
  return raw.map((event) => ({ ...event, daysUntil: 0 }));
}

/**
 * La fecha de regalo activa: hoy está dentro de su ventana previa
 * (lead) y todavía se llega a publicar ANTES del evento. Si hay búsquedas
 * reales de Google con palabras de la fecha, la evidencia lo dice.
 */
export async function upcomingGiftEvent(ownerUserId?: string): Promise<GiftEvent | null> {
  const today = houstonDateKey();
  const year = Number(today.slice(0, 4));
  for (const candidate of [...giftEvents(year), ...giftEvents(year + 1)]) {
    const daysUntil = dayDiff(today, candidate.eventDateKey);
    if (today >= candidate.leadStartKey && daysUntil >= 2) {
      const event: GiftEvent = { key: candidate.key, name: candidate.name, eventDateKey: candidate.eventDateKey, daysUntil, keywords: candidate.keywords };
      if (ownerUserId) {
        try {
          const seo = await getSeoInsights(ownerUserId);
          const searched = (seo?.topQueries || []).some((query) =>
            candidate.keywords.some((keyword) => query.key.toLowerCase().includes(keyword)));
          if (searched) (event as any).googleSearchEvidence = true;
        } catch { /* sin SEO disponible, el evento vale igual */ }
      }
      return event;
    }
  }
  return null;
}

export const matchesGiftEvent = (event: GiftEvent, text: string) => {
  const haystack = ` ${text.toLowerCase()} `;
  return event.keywords.some((keyword) => haystack.includes(keyword));
};

/* ------------------------------- cadencia ------------------------------- */

export type CadenceState = {
  eligible: boolean;
  gapDays: number;
  eventActive: boolean;
  lastActivityKey: string | null;
  nextEligibleKey: string | null;
  reason: string;
  adaptiveNote?: string;
};

/**
 * Cadencia ADAPTATIVA (nivel ULTRA, 2026-11-14): el aire entre propuestas
 * ya no es un número fijo clavado en el código. Se deriva de la respuesta
 * REAL medida de las últimas publicaciones: si la audiencia viene
 * respondiendo fuerte, el robot puede proponer más seguido (2 días); si
 * la respuesta cae, se espacia solo (4–5 días) para no quemar la cuenta.
 * Sin mediciones suficientes se usa el aire base y se declara. El ajuste
 * y su motivo quedan escritos en el estado (adaptiveNote) y en el
 * informe, para que el dueño vea qué cambió y por qué.
 */
export async function adaptiveGapDays(ownerUserId: string): Promise<{ gap: number; note: string }> {
  try {
    await ensureScheduleTables();
    const rows = await pool.query(
      `SELECT response_score FROM marketing_schedule_measurements
       WHERE owner_user_id=$1 ORDER BY published_at DESC LIMIT 6`,
      [ownerUserId],
    );
    const scores = rows.rows.map((r: any) => Number(r.response_score || 0)).filter((n: number) => n > 0);
    if (scores.length < 2) {
      return { gap: MIN_GAP_DAYS, note: `Sin mediciones suficientes todavía (${scores.length}): aire base de ${MIN_GAP_DAYS} días; se ajusta solo cuando haya respuesta medida.` };
    }
    const recent = scores.slice(0, Math.min(3, scores.length));
    const recentAvg = recent.reduce((a: number, b: number) => a + b, 0) / recent.length;
    const rest = scores.slice(recent.length);
    const baseline = rest.length ? rest.reduce((a: number, b: number) => a + b, 0) / rest.length : recentAvg;
    if (baseline > 0 && recentAvg >= baseline * 1.2) {
      return { gap: 2, note: `Cadencia adaptativa: la respuesta reciente (prom. ${Math.round(recentAvg)}) viene ≥20% sobre la base (${Math.round(baseline)}): el aire baja a 2 días.` };
    }
    if (baseline > 0 && recentAvg <= baseline * 0.6) {
      return { gap: 5, note: `Cadencia adaptativa: la respuesta reciente (prom. ${Math.round(recentAvg)}) cayó a ≤60% de la base (${Math.round(baseline)}): el aire sube a 5 días para no quemar la cuenta.` };
    }
    if (baseline > 0 && recentAvg <= baseline * 0.85) {
      return { gap: 4, note: `Cadencia adaptativa: la respuesta reciente (prom. ${Math.round(recentAvg)}) viene por debajo de la base (${Math.round(baseline)}): el aire sube a 4 días.` };
    }
    return { gap: MIN_GAP_DAYS, note: `Cadencia adaptativa: respuesta reciente (prom. ${Math.round(recentAvg)}) en línea con la base (${Math.round(baseline)}): aire de ${MIN_GAP_DAYS} días.` };
  } catch {
    return { gap: MIN_GAP_DAYS, note: `Aire base de ${MIN_GAP_DAYS} días (no se pudo leer la respuesta medida).` };
  }
}

export async function getCadenceState(ownerUserId: string): Promise<CadenceState> {
  const today = houstonDateKey();
  const event = await upcomingGiftEvent(ownerUserId);
  const adaptive = await adaptiveGapDays(ownerUserId);
  const gapDays = event ? Math.min(EVENT_GAP_DAYS, adaptive.gap) : adaptive.gap;

  const proposalRow = await pool.query(
    `SELECT MAX((created_at AT TIME ZONE '${TZ}')::date::text) AS last_key
     FROM marketing_proposals WHERE owner_user_id=$1`,
    [ownerUserId],
  ).catch(() => ({ rows: [{ last_key: null }] }));
  const runRow = await pool.query(
    `SELECT MAX((COALESCE(r.published_at, r.created_at) AT TIME ZONE '${TZ}')::date::text) AS last_key
     FROM marketing_campaign_runs r
     JOIN marketing_campaigns c ON c.id = r.campaign_id
     WHERE c.owner_user_id=$1 AND c.campaign_type='proposal' AND r.published=TRUE`,
    [ownerUserId],
  ).catch(() => ({ rows: [{ last_key: null }] }));

  const keys = [proposalRow.rows[0]?.last_key, runRow.rows[0]?.last_key].filter(Boolean) as string[];
  const lastActivityKey = keys.length ? keys.sort().slice(-1)[0] : null;
  if (!lastActivityKey) {
    return { eligible: true, gapDays, eventActive: Boolean(event), lastActivityKey: null, nextEligibleKey: today, reason: "Sin propuestas ni publicaciones previas: se puede proponer.", adaptiveNote: adaptive.note };
  }
  const nextEligibleKey = addDaysToKey(lastActivityKey, gapDays);
  const eligible = today >= nextEligibleKey;
  return {
    eligible,
    gapDays,
    eventActive: Boolean(event),
    lastActivityKey,
    nextEligibleKey,
    adaptiveNote: adaptive.note,
    reason: eligible
      ? `Pasaron ${dayDiff(lastActivityKey, today)} días desde la última actividad (aire mínimo: ${gapDays}): toca proponer. ${adaptive.note}`
      : `Publicar poco y bien: la última actividad fue el ${lastActivityKey} y el aire mínimo es de ${gapDays} días — la próxima propuesta puede salir el ${nextEligibleKey}. ${adaptive.note}`,
  };
}

/* ------------------------- recomendación de horario ---------------------- */

export type SlotRecommendation = {
  channel: ScheduleChannel;
  mode: ChannelHeat["mode"];
  dateKey: string;
  weekday: number;
  hour: number;
  scheduledFor: string;
  label: string;
  evidenceText: string;
  experimentIndex: number | null;
  eventApplied: { name: string; eventDateKey: string } | null;
  perChannel: Array<{ channel: ScheduleChannel; mode: ChannelHeat["mode"]; line: string }>;
};

/**
 * El día y la hora recomendados para la próxima publicación: el inicio de
 * la mejor ventana próxima de la red principal, con su evidencia. En modo
 * experimento rota los candidatos para ir probando franjas distintas.
 */
export async function recommendSlot(
  ownerUserId: string,
  primaryChannel: ScheduleChannel,
  opts: { event?: GiftEvent | null; rotationSeed?: number } = {},
): Promise<SlotRecommendation> {
  const heatMap = await getHeatMap(ownerUserId);
  const heat = heatMap[primaryChannel];
  const now = new Date();
  const today = houstonDateKey(now);
  const perChannel = SCHEDULE_CHANNELS.map((channel) => ({
    channel,
    mode: heatMap[channel].mode,
    line: heatMap[channel].summary,
  }));
  const event = opts.event || null;
  const deadlineKey = event ? addDaysToKey(event.eventDateKey, -2) : null;

  let dateKey: string | null = null;
  let hour = 12;
  let mode: ChannelHeat["mode"] = heat.mode;
  let evidenceText = "";
  let experimentIndex: number | null = null;

  if (heat.mode === "data" || heat.mode === "weak") {
    // Una ventana confirmada (2+ publicaciones) pesa más que una sola
    // publicación con suerte: las celdas de una sola publicación compiten
    // con descuento, para no coronar una "ventana ganadora" sin respaldo.
    let best: { dateKey: string; hour: number; score: number; cellPosts: number; avgReach: number; avgInteractions: number } | null = null;
    for (let offset = 0; offset <= 6; offset++) {
      const key = addDaysToKey(today, offset);
      if (deadlineKey && key > deadlineKey) break;
      const weekdayBest = heat.weekdayBest[weekdayOfKey(key)];
      if (!weekdayBest) continue;
      const slot = houstonInstant(key, weekdayBest.hour);
      if (slot.getTime() < now.getTime() + 2 * 3600000) continue;
      const cell = heat.cells.find((c) => c.weekday === weekdayOfKey(key) && c.hour === weekdayBest.hour);
      const candidate = {
        dateKey: key,
        hour: weekdayBest.hour,
        score: weekdayBest.avgResponse * (weekdayBest.posts >= 2 ? 1 : 0.7),
        cellPosts: weekdayBest.posts,
        avgReach: weekdayBest.avgReach,
        avgInteractions: cell?.avgInteractions || 0,
      };
      if (!best || candidate.score > best.score) best = candidate;
    }
    if (best) {
      dateKey = best.dateKey;
      hour = best.hour;
      const dayName = WEEKDAY_NAMES[weekdayOfKey(best.dateKey)];
      evidenceText = heat.mode === "data"
        ? `Tu mejor ventana en ${CHANNEL_LABELS[primaryChannel]} es el ${dayName} a las ${String(best.hour).padStart(2, "0")}:00: ${best.cellPosts} publicación(es) en ese horario rindieron en promedio ${best.avgReach} de alcance y ${best.avgInteractions} interacciones por publicación (datos reales de tu cuenta, ${heat.evidencePosts} publicaciones medidas). La publicación sale al inicio de esa ventana.${best.cellPosts < 2 ? " Ojo: esa ventana tiene una sola publicación medida — es la mejor pista disponible, no una certeza; la medición de esta publicación la confirma o la corrige." : ""}`
        : `Señal todavía débil en ${CHANNEL_LABELS[primaryChannel]} (${heat.evidencePosts} publicaciones medidas): la mejor pista es el ${dayName} a las ${String(best.hour).padStart(2, "0")}:00, con ${best.avgReach} de alcance promedio en ${best.cellPosts} publicación(es). Se confirma o se corrige con la medición de las próximas publicaciones.`;
    }
  }

  if (!dateKey) {
    // Experimento (o respaldo): rotar candidatos y tomar la próxima
    // ocurrencia con aire suficiente para que el dueño decida.
    mode = "experiment";
    const candidates = heat.candidates.length ? heat.candidates : EXPERIMENT_CANDIDATES[primaryChannel];
    const seed = Math.max(0, Math.floor(opts.rotationSeed || 0));
    experimentIndex = seed % candidates.length;
    const candidate = candidates[experimentIndex];
    hour = candidate.hour;
    for (let offset = 0; offset <= 7; offset++) {
      const key = addDaysToKey(today, offset);
      if (weekdayOfKey(key) !== candidate.weekday) continue;
      if (deadlineKey && key > deadlineKey) continue;
      const slot = houstonInstant(key, candidate.hour);
      if (slot.getTime() < now.getTime() + 12 * 3600000) continue;
      dateKey = key;
      break;
    }
    if (!dateKey) {
      dateKey = addDaysToKey(today, 2);
      hour = candidate.hour;
    }
    evidenceText = `En ${CHANNEL_LABELS[primaryChannel]} todavía no hay datos medidos suficientes para un mapa confiable (${heat.evidencePosts} publicaciones con resultado): no invento una hora perfecta. Propongo probar el ${candidate.label} (experimento ${experimentIndex + 1} de ${candidates.length}) y medir el resultado a las 24–48 h para ir armando el mapa con datos propios.`;
  }

  if (event && dateKey > (deadlineKey || dateKey)) {
    dateKey = deadlineKey || dateKey;
  }
  const scheduled = houstonInstant(dateKey, hour);
  const eventApplied = event && dateKey <= (deadlineKey || dateKey)
    ? { name: event.name, eventDateKey: event.eventDateKey }
    : null;
  if (eventApplied) {
    evidenceText += ` Fecha en el calendario: ${eventApplied.name} es el ${eventApplied.eventDateKey} — se publica ANTES, como conviene con los regalos${(event as any)?.googleSearchEvidence ? ", y Google ya muestra búsquedas de esta fecha" : ""}.`;
  }

  return {
    channel: primaryChannel,
    mode,
    dateKey,
    weekday: weekdayOfKey(dateKey),
    hour,
    scheduledFor: scheduled.toISOString(),
    label: slotLabel(dateKey, hour),
    evidenceText,
    experimentIndex,
    eventApplied,
    perChannel,
  };
}

/* --------------------- ciclo de medición (24–48 h) ----------------------- */

/**
 * Mide las publicaciones del robot que ya cumplieron 24–48 h: cruza cada
 * publicación aprobada con su observación social re-ingerida (alcance y
 * reacción actuales del posteo real) y con la atribución GA4 de su
 * campaña (sesiones, conversiones, ingresos). El resultado queda en
 * marketing_schedule_measurements y alimenta el mapa vía las
 * observaciones, que el ciclo nocturno mantiene frescas.
 */
export async function measureRecentPublications(ownerUserId: string) {
  await ensureScheduleTables();
  const pubs = await pool.query(
    `SELECT r.campaign_id, r.channel, r.external_id,
            COALESCE(r.published_at, r.created_at) AS published_at,
            c.results->'source'->>'proposalId' AS proposal_id
     FROM marketing_campaign_runs r
     JOIN marketing_campaigns c ON c.id = r.campaign_id
     WHERE c.owner_user_id=$1 AND c.campaign_type='proposal' AND r.published=TRUE
       AND r.external_id IS NOT NULL
       AND COALESCE(r.published_at, r.created_at) BETWEEN NOW() - INTERVAL '72 hours' AND NOW() - INTERVAL '20 hours'`,
    [ownerUserId],
  );
  let measured = 0;
  for (const pub of pubs.rows as any[]) {
    const channel = String(pub.channel || "");
    if (!(SCHEDULE_CHANNELS as readonly string[]).includes(channel)) continue;
    const social = await pool.query(
      `SELECT impressions,
              (COALESCE((decision->'metrics'->>'likes')::int, 0)
               + COALESCE((decision->'metrics'->>'comments')::int, 0)
               + COALESCE((decision->'metrics'->>'shares')::int, 0)
               + COALESCE((decision->'metrics'->>'saved')::int, 0)) AS interactions
       FROM marketing_learning_observations
       WHERE attribution_key = $1 LIMIT 1`,
      [`social:${channel}:${pub.external_id}`],
    );
    const ga4 = await pool.query(
      `SELECT COALESCE(SUM(sessions),0)::int AS sessions,
              COALESCE(SUM(conversions),0)::int AS conversions,
              COALESCE(SUM(revenue),0)::numeric AS revenue
       FROM marketing_learning_observations
       WHERE campaign_id=$1 AND attribution_key IS NOT NULL`,
      [pub.campaign_id],
    );
    const impressions = Number(social.rows[0]?.impressions || 0);
    const interactions = Number(social.rows[0]?.interactions || 0);
    const sessions = Number(ga4.rows[0]?.sessions || 0);
    const conversions = Number(ga4.rows[0]?.conversions || 0);
    const revenue = Number(ga4.rows[0]?.revenue || 0);
    const publishedAt = new Date(pub.published_at);
    const local = new Date(publishedAt.toLocaleString("en-US", { timeZone: TZ }));
    await pool.query(
      `INSERT INTO marketing_schedule_measurements
         (owner_user_id, campaign_id, proposal_id, channel, external_id, published_at, weekday, hour,
          measured_at, age_hours, impressions, interactions, sessions, conversions, revenue, response_score)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),$9,$10,$11,$12,$13,$14,$15)
       ON CONFLICT (campaign_id, channel) DO UPDATE SET
         measured_at=NOW(), age_hours=EXCLUDED.age_hours, impressions=EXCLUDED.impressions,
         interactions=EXCLUDED.interactions, sessions=EXCLUDED.sessions, conversions=EXCLUDED.conversions,
         revenue=EXCLUDED.revenue, response_score=EXCLUDED.response_score`,
      [
        ownerUserId, pub.campaign_id, pub.proposal_id || null, channel, String(pub.external_id),
        publishedAt, local.getDay(), local.getHours(),
        Number(((Date.now() - publishedAt.getTime()) / 3600000).toFixed(1)),
        impressions, interactions, sessions, conversions, revenue,
        responseOf(impressions, interactions) + sessions + 25 * conversions,
      ],
    );
    measured += 1;
  }
  return { measured };
}

/* ------------------------------ resumen breve ---------------------------- */

export async function getScheduleBrief(ownerUserId: string) {
  const heatMap = await getHeatMap(ownerUserId);
  const cadence = await getCadenceState(ownerUserId);
  const event = await upcomingGiftEvent(ownerUserId);
  return {
    channels: SCHEDULE_CHANNELS.map((channel) => ({
      channel,
      mode: heatMap[channel].mode,
      evidencePosts: heatMap[channel].evidencePosts,
      line: heatMap[channel].summary,
    })),
    cadence: {
      eligible: cadence.eligible,
      gapDays: cadence.gapDays,
      lastActivityKey: cadence.lastActivityKey,
      nextEligibleKey: cadence.nextEligibleKey,
      line: cadence.reason,
    },
    event: event ? { name: event.name, eventDateKey: event.eventDateKey, daysUntil: event.daysUntil } : null,
  };
}
