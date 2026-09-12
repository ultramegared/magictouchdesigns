import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware";
import { requireAdmin } from "../middleware/admin.middleware";
import { getAdminReports } from "../controllers/reports.controller";

const router = Router();
router.use(authenticateToken);
router.use(requireAdmin);
router.get("/", getAdminReports);
export default router;
