import type { Request, Response } from "express";
import { getAnalyticsReport, getAnalyticsStatus, getSearchAnalytics, getSearchConsoleStatus, verifySearchConsoleAccess } from "../services/google-search-console.service";

export function getSearchConsoleConfig(_req: Request, res: Response) { res.json(getSearchConsoleStatus()); }
export async function verifySearchConsole(_req: Request, res: Response) { try { res.json(await verifySearchConsoleAccess()); } catch (error) { console.error("Search Console verification error:", error); res.status(502).json({ connected: false, error: error instanceof Error ? error.message : "Unable to connect to Google Search Console" }); } }
export async function getSearchConsoleAnalytics(req: Request, res: Response) { try { const days = Number(req.query.days || 28); res.json(await getSearchAnalytics(Number.isFinite(days) ? days : 28)); } catch (error) { console.error("Search Console analytics error:", error); res.status(502).json({ error: error instanceof Error ? error.message : "Unable to load Search Console analytics" }); } }
export function getAnalyticsConfig(_req: Request, res: Response) { res.json(getAnalyticsStatus()); }
export async function getAnalytics(_req: Request, res: Response) { try { const days = Number(_req.query.days || 28); res.json(await getAnalyticsReport(Number.isFinite(days) ? days : 28)); } catch (error) { console.error("Google Analytics error:", error); res.status(502).json({ error: error instanceof Error ? error.message : "Unable to load Google Analytics" }); } }
