import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware";
import { requireAdmin } from "../middleware/admin.middleware";
import {
    getSearchConsoleAnalytics,
    getSearchConsoleConfig,
    verifySearchConsole,
} from "../controllers/google-search-console.admin.controller";

const router = Router();
router.use(authenticateToken, requireAdmin);
router.get("/status", getSearchConsoleConfig);
router.get("/verify", verifySearchConsole);
router.get("/analytics", getSearchConsoleAnalytics);

export default router;
