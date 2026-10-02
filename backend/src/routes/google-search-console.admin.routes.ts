import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware";
import { requireAdmin } from "../middleware/admin.middleware";
import { getAnalytics, getAnalyticsConfig, getSearchConsoleAnalytics, getSearchConsoleConfig, verifyGoogle, verifySearchConsole } from "../controllers/google-search-console.admin.controller";

const router = Router();
router.use(authenticateToken, requireAdmin);
router.get("/status", getSearchConsoleConfig);
router.get("/verify", verifySearchConsole);
router.get("/verify-all", verifyGoogle);
router.get("/analytics", getSearchConsoleAnalytics);
router.get("/google-analytics/status", getAnalyticsConfig);
router.get("/google-analytics/report", getAnalytics);
export default router;
