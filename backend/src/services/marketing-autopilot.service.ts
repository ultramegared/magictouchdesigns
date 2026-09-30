import { pool } from "../config/database";
import { getAnalyticsCampaignReport } from "./google-search-console.service";
import { recordCampaignLearningFeedback, getMarketingLearningInsights } from "./marketing-learning.service";
import { sendEmail } from "./email.service";

const sourceToChannel: Record<string, "facebook"|"instagram"|"whatsapp"|"tiktok"|"youtube"|"pinterest"|"email"> = {
  facebook: "facebook",
  instagram: "instagram",
  whatsapp: "whatsapp",
  tiktok: "tiktok",
  youtube: "youtube",
  pinterest: "pinterest",
  email: "email",
  newsletter: "email",
  jqydesigns: "email",
};

const numberAt = (values: Array<{value?: string}>|undefined, index: number) => Number(values?.[index]?.value || 0);

export async function syncMarketingLearningFromAnalytics(days = 30) {
  const report = await getAnalyticsCampaignReport(days);
  const campaigns = await pool.query(`SELECT id FROM marketing_campaigns WHERE created_at >= NOW() - INTERVAL '90 days'`);
  const known = new Set(campaigns.rows.map((row: any) => String(row.id)));
  let updated = 0;

  for (const row of report.rows) {
    const dimensions = row.dimensionValues || [];
    const campaignId = String(dimensions[0]?.value || "");
    const source = String(dimensions[1]?.value || "").toLowerCase();
    const channel = sourceToChannel[source];
    if (!campaignId || !known.has(campaignId) || !channel) continue;

    const result = await recordCampaignLearningFeedback({
      campaignId,
      channel,
      sessions: numberAt(row.metricValues, 0),
      clicks: numberAt(row.metricValues, 0),
      conversions: numberAt(row.metricValues, 2),
      revenue: numberAt(row.metricValues, 3),
      impressions: numberAt(row.metricValues, 1),
    });
    updated += result.updated;
  }

  return { checkedRows: report.rows.length, updated, days };
}


type DailyChannel = {
  channel: string;
  publications: number;
  successful: number;
  sessions: number;
  conversions: number;
  revenue: number;
};

export async function getMarketingDailySummary() {
  const campaigns = await pool.query(`
    SELECT COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours')::int AS last24
    FROM marketing_campaigns
  `);
  const runs = await pool.query(`
    SELECT channel,
           COUNT(*)::int AS publications,
           COUNT(*) FILTER (WHERE published)::int AS successful
    FROM marketing_campaign_runs
    WHERE created_at >= NOW() - INTERVAL '24 hours'
    GROUP BY channel
    ORDER BY successful DESC, publications DESC, channel
  `);
  const performance = await pool.query(`
    SELECT channel,
           SUM(sessions)::int AS sessions,
           SUM(conversions)::int AS conversions,
           COALESCE(SUM(revenue),0)::numeric AS revenue
    FROM marketing_learning_observations
    WHERE updated_at >= NOW() - INTERVAL '24 hours'
    GROUP BY channel
  `);
  const performanceMap = new Map(performance.rows.map((row: any) => [
    String(row.channel),
    {
      sessions: Number(row.sessions || 0),
      conversions: Number(row.conversions || 0),
      revenue: Number(row.revenue || 0),
    },
  ]));
  const byChannel: DailyChannel[] = runs.rows.map((row: any) => {
    const p = performanceMap.get(String(row.channel)) || { sessions: 0, conversions: 0, revenue: 0 };
    return {
      channel: String(row.channel),
      publications: Number(row.publications || 0),
      successful: Number(row.successful || 0),
      sessions: p.sessions,
      conversions: p.conversions,
      revenue: p.revenue,
    };
  });
  const totals = byChannel.reduce((sum, row) => ({
    publications: sum.publications + row.publications,
    successful: sum.successful + row.successful,
    sessions: sum.sessions + row.sessions,
    conversions: sum.conversions + row.conversions,
    revenue: sum.revenue + row.revenue,
  }), { publications: 0, successful: 0, sessions: 0, conversions: 0, revenue: 0 });

  const insights = await getMarketingLearningInsights();
  const observations = insights.reduce((sum, item) => sum + Number(item.observations || 0), 0);
  const lifetimeConversions = insights.reduce((sum, item) => sum + Number(item.conversions || 0), 0);
  const lifetimeRevenue = insights.reduce((sum, item) => sum + Number(item.revenue || 0), 0);
  const level =
    observations >= 100 && lifetimeConversions >= 25 ? 5 :
    observations >= 50 && lifetimeConversions >= 10 ? 4 :
    observations >= 25 && lifetimeConversions >= 5 ? 3 :
    observations >= 10 ? 2 : 1;
  const levelNames = {
    1: "Semilla",
    2: "Aprendiendo",
    3: "Detectando patrones",
    4: "Optimizando",
    5: "Autónomo",
  } as const;
  const nextTargets = {
    1: "Conseguir 10 observaciones reales.",
    2: "Llegar a 25 observaciones y empezar a comparar conversiones.",
    3: "Llegar a 50 observaciones y 10 conversiones acumuladas.",
    4: "Llegar a 100 observaciones y 25 conversiones acumuladas.",
    5: "Seguir aprendiendo sin dejar de experimentar y validar clientes reales.",
  } as const;

  return {
    generatedAt: new Date().toISOString(),
    campaigns: { total: Number(campaigns.rows[0]?.total || 0), last24: Number(campaigns.rows[0]?.last24 || 0) },
    last24: totals,
    channels: byChannel,
    learning: {
      observations,
      conversions: lifetimeConversions,
      revenue: lifetimeRevenue,
      level,
      levelName: levelNames[level as keyof typeof levelNames],
      nextTarget: nextTargets[level as keyof typeof nextTargets],
    },
  };
}

export async function sendMarketingDailySummary() {
  const summary = await getMarketingDailySummary();
  if (summary.campaigns.total < 1) return { sent: false, reason: "No Marketing campaign exists yet.", summary };

  const recipient = process.env.MARKETING_DAILY_REPORT_EMAIL?.trim() || "jqydesigns@gmail.com";
  const dateKey = new Date().toISOString().slice(0, 10);
  const channelRows = summary.channels.length
    ? summary.channels.map(row => `<tr><td>${row.channel}</td><td>${row.publications}</td><td>${row.successful}</td><td>${row.sessions}</td><td>${row.conversions}</td><td>$${row.revenue.toFixed(2)}</td></tr>`).join("")
    : "<tr><td colspan='6'>No publications in the last 24 hours.</td></tr>";
  const subject = `JQY Marketing · Daily Growth Report · ${dateKey}`;
  await sendEmail({
    to: recipient,
    subject,
    idempotencyKey: `marketing-daily-report:${dateKey}`,
    text: [
      `JQY Marketing Daily Growth Report ${dateKey}`,
      `Campaigns total: ${summary.campaigns.total}`,
      `Publications last 24h: ${summary.last24.publications}`,
      `Successful publications: ${summary.last24.successful}`,
      `Sessions: ${summary.last24.sessions}`,
      `Conversions: ${summary.last24.conversions}`,
      `Revenue: $${summary.last24.revenue.toFixed(2)}`,
      `Learning level: ${summary.learning.level} — ${summary.learning.levelName}`,
      `Observations: ${summary.learning.observations}`,
      `Next target: ${summary.learning.nextTarget}`,
    ].join("\n"),
    html: `<div style="font-family:Arial,sans-serif;max-width:760px;margin:auto"><h1>JQY Marketing Daily Growth Report</h1><p>${dateKey}</p><h2>Nivel ${summary.learning.level} · ${summary.learning.levelName}</h2><p>${summary.learning.nextTarget}</p><table cellpadding="8" cellspacing="0" border="1" style="border-collapse:collapse;width:100%"><thead><tr><th>Canal</th><th>Publicaciones</th><th>OK</th><th>Sesiones</th><th>Conversiones</th><th>Ingresos</th></tr></thead><tbody>${channelRows}</tbody></table><p><b>Últimas 24h:</b> ${summary.last24.publications} publicaciones · ${summary.last24.sessions} sesiones · ${summary.last24.conversions} conversiones · $${summary.last24.revenue.toFixed(2)}.</p><p><b>Aprendizaje acumulado:</b> ${summary.learning.observations} observaciones · ${summary.learning.conversions} conversiones · $${summary.learning.revenue.toFixed(2)}.</p></div>`,
  });
  return { sent: true, recipient, summary };
}
