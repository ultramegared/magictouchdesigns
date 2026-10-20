import type { Request, Response } from "express";
import { syncMarketingLearningFromAnalytics } from "../services/marketing-autopilot.service";
import { runMarketingAutopilot } from "../services/marketing-campaign.service";

export async function marketingAutopilotCron(req: Request, res: Response) {
  const expected = process.env.CRON_SECRET?.trim();
  const authorization = String(req.headers.authorization || "");
  if (!expected || authorization !== `Bearer ${expected}`) {
    return res.status(401).json({ status: "error", error: "Unauthorized cron request." });
  }

  // Isolate the two stages: an analytics/provider outage must not prevent the
  // other stage from running, and a successful publication must not be reported
  // as a total cron failure merely because analytics synchronization failed.
  const errors: Record<string, string> = {};
  let autopilot: unknown = null;
  let learning: unknown = null;

  try {
    // Drain due campaign work and reconcile provider statuses first.
    autopilot = await runMarketingAutopilot(10);
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

  const failedStages = Object.keys(errors);
  const status = failedStages.length ? "partial" : "success";
  return res.status(failedStages.length === 2 ? 503 : 200).json({
    status,
    engine: "JQY Marketing Adaptive Engine v1",
    autopilot: autopilot ?? (errors.autopilot ? { status: "error", error: errors.autopilot } : null),
    learning: learning ?? (errors.learning ? { status: "error", error: errors.learning } : null),
    ...(failedStages.length ? { errors, failedStages } : {}),
  });
}
