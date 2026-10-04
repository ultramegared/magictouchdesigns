import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware";
import { requireAdmin } from "../middleware/admin.middleware";
import { getAnalytics, getAnalyticsRealtime, getAnalyticsCampaign, getAnalyticsConfig, getSearchConsoleAnalytics, getSearchConsoleConfig, verifyGoogle, verifySearchConsole } from "../controllers/google-search-console.admin.controller";

const router = Router();
router.use(authenticateToken, requireAdmin);
router.get("/status", getSearchConsoleConfig);
router.get("/verify", verifySearchConsole);
router.get("/verify-all", verifyGoogle);
router.get("/analytics", getSearchConsoleAnalytics);
router.get("/google-analytics/status", getAnalyticsConfig);
router.get("/google-analytics/report", getAnalytics);
router.get("/google-analytics/realtime", getAnalyticsRealtime);
router.get("/google-analytics/campaigns", getAnalyticsCampaign);
export default router;
