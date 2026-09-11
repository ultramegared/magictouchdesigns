import { Router } from "express";
import { getCurrentUser } from "../controllers/user.controller";
import { listMyOrders } from "../controllers/user.order.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

router.get("/me", authenticateToken, getCurrentUser);
router.get("/orders", authenticateToken, listMyOrders);

export default router;
