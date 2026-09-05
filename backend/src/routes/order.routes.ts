/**
 * Magic Touch Designs - Order Routes
 */

import { Router } from "express";
import {
    capturePayPalCheckout,
    createCheckout,
    createPayPalCheckout,
    getOrder,
    getOrderByCheckoutSession,
    getPayPalConfig,
} from "../controllers/order.controller";

const router = Router();

router.get("/paypal/config", getPayPalConfig);
router.post("/paypal/create", createPayPalCheckout);
router.post("/paypal/:paypalOrderId/capture", capturePayPalCheckout);
router.post("/checkout", createCheckout);
router.get("/session/:sessionId", getOrderByCheckoutSession);
router.get("/:code", getOrder);

export default router;
