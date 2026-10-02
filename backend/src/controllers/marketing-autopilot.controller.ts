import type { Request, Response } from "express";
import { syncMarketingLearningFromAnalytics } from "../services/marketing-autopilot.service";

export async function marketingAutopilotCron(req: Request, res: Response) {
  const expected = process.env.CRON_SECRET?.trim();
  const authorization = String(req.headers.authorization || "");
  if (!expected || authorization !== `Bearer ${expected}`) {
    return res.status(401).json({ status: "error", error: "Unauthorized cron request." });
  }

  try {
    const result = await syncMarketingLearningFromAnalytics(30);
    return res.json({ status: "success", engine: "JQY Marketing Adaptive Engine v1", ...result });
  } catch (error) {
    console.error("Marketing autopilot sync failed:", error);
    return res.status(503).json({ status: "error", error: error instanceof Error ? error.message : "Marketing learning sync failed." });
  }
}
