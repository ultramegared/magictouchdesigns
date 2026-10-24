import type { Request, Response } from "express";
import { syncMarketingLearningFromAnalytics } from "../services/marketing-autopilot.service";
import { runMarketingAutopilot } from "../services/marketing-campaign.service";
import { recordAutopilotRunEvent } from "../services/marketing-catalog.service";

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
    await recordAutopilotRunEvent(workspaceId, "cron_midnight", { ran: false, processed: 0, reason: "Skipped: not midnight in Houston." });
    return res.status(200).json({
      status: "success",
      skipped: true,
      reason: "Marketing Autopilot runs at midnight Houston time.",
      timezone: "America/Chicago",
    });
  }

  // Isolate the two stages: an analytics/provider outage must not prevent the
  // other stage from running, and a successful publication must not be reported
  // as a total cron failure merely because analytics synchronization failed.
  const errors: Record<string, string> = {};
  let autopilot: unknown = null;
  let learning: unknown = null;

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
