import type { Request, Response } from "express";
import { syncMarketingLearningFromAnalytics } from "../services/marketing-autopilot.service";
import { runMarketingAutopilot } from "../services/marketing-campaign.service";

export async function marketingAutopilotCron(req: Request, res: Response) {
  const expected = process.env.CRON_SECRET?.trim();
  const authorization = String(req.headers.authorization || "");
  if (!expected || authorization !== `Bearer ${expected}`) {
    return res.status(401).json({ status: "error", error: "Unauthorized cron request." });
  }

  try {
    // One hourly entry point drains due campaign work and reconciles provider statuses.
    // Learning runs afterward so it can observe the publication ledger updated above.
    const autopilot = await runMarketingAutopilot(10);
    const learning = await syncMarketingLearningFromAnalytics(30);
    return res.json({
      status: "success",
      engine: "JQY Marketing Adaptive Engine v1",
      autopilot,
      learning,
    });
  } catch (error) {
    console.error("Marketing autopilot cron failed:", error);
    return res.status(503).json({
      status: "error",
      error: error instanceof Error ? error.message : "Marketing autopilot cron failed.",
    });
  }
}
