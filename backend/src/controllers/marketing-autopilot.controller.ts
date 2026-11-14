import type { Request, Response } from "express";
import { syncMarketingLearningFromAnalytics } from "../services/marketing-autopilot.service";
import { runMarketingAutopilot } from "../services/marketing-campaign.service";
import { recordAutopilotRunEvent } from "../services/marketing-catalog.service";
import { syncSocialLearning } from "../services/marketing-social-learning.service";
import { syncMetaAdsLearning } from "../services/marketing-ads-learning.service";
import { runDailyProposals } from "../services/marketing-proposals.service";
import { runFastLearningCycle } from "../services/marketing-intelligence.service";

export async function marketingAutopilotCron(req: Request, res: Response) {
  const expected = process.env.CRON_SECRET?.trim();
  const authorization = String(req.headers.authorization || "");
  if (!expected || authorization !== `Bearer ${expected}`) {
    return res.status(401).json({ status: "error", error: "Unauthorized cron request." });
  }

  // Vercel cron uses UTC. Trigger at 05:00 and 06:00 UTC, but run the robot
  // only when it is midnight in Houston (America/Chicago), including DST changes.
  const houstonHour = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    hour: "2-digit",
    hourCycle: "h23",
  }).format(new Date());
  if (houstonHour !== "00") {
    const workspaceId = process.env.MARKETING_WORKSPACE_OWNER_ID?.trim() || "a720d444-d23c-45ca-9086-d0d4dde26a1f";
    // Nivel ULTRA — aprendizaje abierto y continuo: el despertador
    // horario ya no pasa de largo. Corre el ciclo RÁPIDO de aprendizaje
    // (re-ingesta social liviana + medición temprana 4–20 h + foto del
    // informe). NO genera propuestas nuevas y NO publica nada: publicar
    // sigue siendo solo con el sí del dueño, y el ciclo completo sigue
    // a medianoche de Houston. Cada etapa aislada.
    let fastCycle: unknown = null;
    try {
      await syncSocialLearning(workspaceId);
      fastCycle = await runFastLearningCycle(workspaceId);
    } catch (error) {
      fastCycle = { error: error instanceof Error ? error.message : "Fast learning cycle failed." };
    }
    await recordAutopilotRunEvent(workspaceId, "cron_fast_learning", { ran: true, processed: 0, reason: "Fast learning cycle (hourly): fresh social signals + early measurement. No proposal generated, nothing published." });
    return res.status(200).json({
      status: "success",
      skipped: true,
      reason: "Marketing Autopilot full cycle runs at midnight Houston time; hourly hits run the fast learning cycle only.",
      timezone: "America/Chicago",
      fastCycle,
    });
  }

  // Isolate the stages: an analytics/provider outage must not prevent the
  // other stages from running, and a successful publication must not be
  // reported as a total cron failure merely because a sync stage failed.
  const errors: Record<string, string> = {};
  let autopilot: unknown = null;
  let learning: unknown = null;
  let socialLearning: unknown = null;
  let adsLearning: unknown = null;
  const workspaceId = process.env.MARKETING_WORKSPACE_OWNER_ID?.trim() || "a720d444-d23c-45ca-9086-d0d4dde26a1f";

  try {
    // Drain due campaign work and reconcile provider statuses first.
    autopilot = await runMarketingAutopilot(10, "cron_midnight");
  } catch (error) {
    errors.autopilot = error instanceof Error ? error.message : "Marketing Autopilot failed.";
    console.error("Marketing Autopilot stage failed:", error);
  }

  try {
    // Always attempt analytics synchronization independently.
    learning = await syncMarketingLearningFromAnalytics(30);
  } catch (error) {
    errors.learning = error instanceof Error ? error.message : "Marketing learning sync failed.";
    console.error("Marketing learning stage failed:", error);
  }

  try {
    // Social learning: ingest real Instagram/Facebook publication results so
    // the engine learns from the campaigns the business actually runs, not
    // only from GA4 attribution.
    socialLearning = await syncSocialLearning(workspaceId);
  } catch (error) {
    errors.socialLearning = error instanceof Error ? error.message : "Marketing social learning sync failed.";
    console.error("Marketing social learning stage failed:", error);
  }

  try {
    // Meta Ads learning: ingest real paid campaign results (read-only) so the
    // engine also learns from the ads the business runs in Ads Manager. If
    // the Meta token still lacks ads_read, the service reports
    // "missing_scope" without failing this stage or the whole cron.
    adsLearning = await syncMetaAdsLearning(workspaceId);
  } catch (error) {
    errors.adsLearning = error instanceof Error ? error.message : "Marketing ads learning sync failed.";
    console.error("Marketing ads learning stage failed:", error);
  }

  let proposals: unknown = null;
  try {
    // Daily proposal: prepare today's complete proposal; it publishes by
    // itself only inside an owner-approved weekly window.
    proposals = await runDailyProposals(workspaceId);
  } catch (error) {
    errors.proposals = error instanceof Error ? error.message : "Marketing daily proposal stage failed.";
    console.error("Marketing daily proposal stage failed:", error);
  }

  const failedStages = Object.keys(errors);
  const status = failedStages.length ? "partial" : "success";
  return res.status(failedStages.length === 5 ? 503 : 200).json({
    status,
    engine: "JQY Marketing Adaptive Engine v1",
    autopilot: autopilot ?? (errors.autopilot ? { status: "error", error: errors.autopilot } : null),
    learning: learning ?? (errors.learning ? { status: "error", error: errors.learning } : null),
    socialLearning: socialLearning ?? (errors.socialLearning ? { status: "error", error: errors.socialLearning } : null),
    adsLearning: adsLearning ?? (errors.adsLearning ? { status: "error", error: errors.adsLearning } : null),
    proposals: proposals ?? (errors.proposals ? { status: "error", error: errors.proposals } : null),
    ...(failedStages.length ? { errors, failedStages } : {}),
  });
}
