import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware";
import { requireAdmin } from "../middleware/admin.middleware";
import { getAdminSales } from "../controllers/sales.admin.controller";

const router = Router();
router.use(authenticateToken);
router.use(requireAdmin);
router.get("/", getAdminSales);
export default router;
