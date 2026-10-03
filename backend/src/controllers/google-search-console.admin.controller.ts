import type { Request, Response } from "express";
import { getAnalyticsReport, getAnalyticsRealtimeReport, getAnalyticsStatus, getSearchAnalytics, getSearchConsoleStatus, verifyGoogleIntegration, verifySearchConsoleAccess } from "../services/google-search-console.service";

export function getSearchConsoleConfig(_req: Request, res: Response) { res.json(getSearchConsoleStatus()); }
export async function verifySearchConsole(_req: Request, res: Response) { try { res.json(await verifySearchConsoleAccess()); } catch (error) { console.error("Search Console verification error:", error); res.status(502).json({ connected: false, error: error instanceof Error ? error.message : "Unable to connect to Google Search Console" }); } }
export async function getSearchConsoleAnalytics(req: Request, res: Response) { try { const days = Number(req.query.days || 28); res.json(await getSearchAnalytics(Number.isFinite(days) ? days : 28)); } catch (error) { console.error("Search Console analytics error:", error); res.status(502).json({ error: error instanceof Error ? error.message : "Unable to load Search Console analytics" }); } }
export function getAnalyticsConfig(_req: Request, res: Response) { res.json(getAnalyticsStatus()); }
export async function getAnalytics(_req: Request, res: Response) { try { const days = Number(_req.query.days || 28); res.json(await getAnalyticsReport(Number.isFinite(days) ? days : 28)); } catch (error) { console.error("Google Analytics error:", error); res.status(502).json({ error: error instanceof Error ? error.message : "Unable to load Google Analytics" }); } }

export async function verifyGoogle(_req: Request, res: Response) {
    try {
        res.json(await verifyGoogleIntegration());
    } catch (error) {
        console.error("Google integration verification error:", error);
        res.status(502).json({ connected: false, error: error instanceof Error ? error.message : "Unable to verify Google integration" });
    }
}

export async function getAnalyticsRealtime(_req: Request, res: Response) { try { res.json(await getAnalyticsRealtimeReport()); } catch (error) { console.error("Google Analytics realtime error:", error); res.status(502).json({ error: error instanceof Error ? error.message : "Unable to load Google Analytics realtime data" }); } }

export async function getAnalyticsCampaign(_req: Request, res: Response) { try { const days = Number(_req.query.days || 30); const { getAnalyticsCampaignReport } = await import("../services/google-search-console.service"); res.json(await getAnalyticsCampaignReport(Number.isFinite(days) ? days : 30)); } catch (error) { console.error("Google Analytics campaign attribution error:", error); res.status(502).json({ error: error instanceof Error ? error.message : "Unable to load Google Analytics campaign attribution" }); } }
