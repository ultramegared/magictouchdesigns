/**
 * Magic Touch Designs - Admin Order Routes
 */

import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware";
import { requireAdmin } from "../middleware/admin.middleware";
import {
    listAdminOrders,
    updateAdminOrder,
} from "../controllers/order.admin.controller";

const router = Router();

router.use(authenticateToken);
router.use(requireAdmin);

router.get("/", listAdminOrders);
router.patch("/:id", updateAdminOrder);

export default router;
