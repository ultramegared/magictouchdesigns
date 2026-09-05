/**
 * Magic Touch Designs - Order Routes
 */

import { Router } from "express";
import {
    createCheckout,
    getOrder,
    getOrderByCheckoutSession,
} from "../controllers/order.controller";

const router = Router();

router.post("/checkout", createCheckout);
router.get("/session/:sessionId", getOrderByCheckoutSession);
router.get("/:code", getOrder);

export default router;
