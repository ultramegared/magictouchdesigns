import { pool } from "../config/database";

export type LearningChannel = "facebook" | "instagram" | "whatsapp" | "tiktok" | "youtube" | "pinterest" | "email";
export interface LearningFeedback {
  campaignId: string;
  channel: LearningChannel;
  clicks?: number;
  sessions?: number;
  conversions?: number;
  revenue?: number;
  impressions?: number;
}
export interface LearningInsight {
  channel: LearningChannel;
  score: number;
  observations: number;
  successRate: number;
  clicks: number;
  sessions: number;
  conversions: number;
  revenue: number;
  recommended: boolean;
}
const channels: LearningChannel[] = ["facebook","instagram","whatsapp","tiktok","youtube","pinterest","email"];

const ensureLearningTables = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS marketing_learning_observations (
      id BIGSERIAL PRIMARY KEY,
      campaign_id TEXT NOT NULL,
      channel TEXT NOT NULL,
      objective TEXT NOT NULL,
      target_area TEXT NOT NULL,
      hour INTEGER NOT NULL,
      weekday INTEGER NOT NULL,
      has_image BOOLEAN NOT NULL DEFAULT FALSE,
      has_video BOOLEAN NOT NULL DEFAULT FALSE,
      published BOOLEAN NOT NULL DEFAULT FALSE,
      clicks INTEGER NOT NULL DEFAULT 0,
      sessions INTEGER NOT NULL DEFAULT 0,
      conversions INTEGER NOT NULL DEFAULT 0,
      revenue NUMERIC(14,2) NOT NULL DEFAULT 0,
      impressions INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(campaign_id, channel)
    )
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS marketing_learning_channel_idx ON marketing_learning_observations(channel, created_at DESC)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS marketing_learning_context_idx ON marketing_learning_observations(target_area, objective, hour, weekday)`);
};

export const recordCampaignLaunchLearning = async (input: {
  campaignId: string;
  channels: LearningChannel[];
  objective: string;
  targetArea: string;
  hasImage: boolean;
  hasVideo: boolean;
  results: Record<string, any>;
}) => {
  await ensureLearningTables();
  const now = new Date();
  const hour = now.getHours();
  const weekday = now.getDay();
  for (const channel of input.channels) {
    const result = input.results[channel];
    const published = Boolean(result?.ok);
    await pool.query(
      `INSERT INTO marketing_learning_observations
       (campaign_id, channel, objective, target_area, hour, weekday, has_image, has_video, published)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (campaign_id, channel) DO UPDATE SET published=EXCLUDED.published, updated_at=NOW()`,
      [input.campaignId, channel, input.objective, input.targetArea, hour, weekday, input.hasImage, input.hasVideo, published]
    );
  }
};

export const recordCampaignLearningFeedback = async (feedback: LearningFeedback) => {
  await ensureLearningTables();
  const result = await pool.query(
    `UPDATE marketing_learning_observations
     SET clicks = GREATEST(clicks, $3),
         sessions = GREATEST(sessions, $4),
         conversions = GREATEST(conversions, $5),
         revenue = GREATEST(revenue, $6),
         impressions = GREATEST(impressions, $7),
         updated_at = NOW()
     WHERE campaign_id=$1 AND channel=$2
     RETURNING id`,
    [feedback.campaignId, feedback.channel, Math.max(0, Number(feedback.clicks || 0)), Math.max(0, Number(feedback.sessions || 0)), Math.max(0, Number(feedback.conversions || 0)), Math.max(0, Number(feedback.revenue || 0)), Math.max(0, Number(feedback.impressions || 0))]
  );
  return { updated: result.rowCount || 0 };
};

export const getMarketingLearningInsights = async (targetArea?: string, objective?: string) => {
  await ensureLearningTables();
  const params: any[] = [];
  const filters: string[] = [];
  if (targetArea?.trim()) { params.push(targetArea.trim()); filters.push(`target_area ILIKE '%' || $${params.length} || '%'`); }
  if (objective?.trim()) { params.push(objective.trim()); filters.push(`objective ILIKE '%' || $${params.length} || '%'`); }
  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const result = await pool.query(
    `SELECT channel,
            COUNT(*)::int observations,
            AVG(CASE WHEN published THEN 1 ELSE 0 END) success_rate,
            SUM(clicks)::int clicks,
            SUM(sessions)::int sessions,
            SUM(conversions)::int conversions,
            SUM(revenue)::numeric revenue,
            SUM(impressions)::int impressions,
            AVG(hour)::numeric avg_hour,
            AVG(weekday)::numeric avg_weekday
     FROM marketing_learning_observations
     ${where}
     GROUP BY channel
     ORDER BY channel`,
    params
  );
  const rows = result.rows.map((row: any) => {
    const observations = Number(row.observations || 0);
    const successRate = Number(row.success_rate || 0);
    const clicks = Number(row.clicks || 0);
    const sessions = Number(row.sessions || 0);
    const conversions = Number(row.conversions || 0);
    const revenue = Number(row.revenue || 0);
    const impressions = Number(row.impressions || 0);
    // Own adaptive score: performance + reliability + a small exploration bonus.
    // Only score metrics that this engine actually receives from real sources.
    // GA4 campaign sync provides sessions, conversions and revenue; it does not
    // provide social/ad clicks or impressions, so those fields must not be inferred.
    const conversionRate = sessions > 0 ? Math.min(conversions / sessions, 1) : 0;
    const revenuePerSession = sessions > 0 ? Math.min((revenue / sessions) / 25, 1) : 0;
    const exploration = 1 / Math.sqrt(Math.max(observations, 1));
    const score = Number(((successRate * 0.30) + (conversionRate * 0.45) + (revenuePerSession * 0.20) + (exploration * 0.05)).toFixed(4));
    return { channel: row.channel as LearningChannel, score, observations, successRate: Number(successRate.toFixed(4)), clicks, sessions, conversions, revenue, impressions, recommended: false, avgHour: Number(Number(row.avg_hour || 0).toFixed(1)), avgWeekday: Number(Number(row.avg_weekday || 0).toFixed(1)) };
  });
  const maxScore = Math.max(...rows.map((row: any) => row.score), 0);
  return rows.map((row: any) => ({ ...row, recommended: row.score === maxScore && row.observations > 0 }));
};

export const getMarketingLearningSummary = async () => {
  const insights = await getMarketingLearningInsights();
  const learnedChannels = insights.filter((row: any) => row.observations > 0).sort((a: any,b: any) => b.score-a.score);
  return {
    algorithm: "JQY Marketing Adaptive Engine v1",
    observations: insights.reduce((sum: number, row: any) => sum + row.observations, 0),
    campaignsLearned: learnedChannels.reduce((sum: number, row: any) => sum + row.observations, 0),
    insights,
    nextAction: learnedChannels.length ? `Prioritize ${learnedChannels[0].channel} while continuing controlled exploration of other connected channels.` : "Collect the first campaign results; the engine will begin learning immediately.",
  };
};
