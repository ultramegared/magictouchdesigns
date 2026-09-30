import { pool } from "../config/database";
import { getAnalyticsCampaignReport } from "./google-search-console.service";
import { recordCampaignLearningFeedback } from "./marketing-learning.service";

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
