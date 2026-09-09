import { Router } from "express";
import {
    capturePayPalCheckout,
    createCheckout,
    createPayPalCheckout,
    createStripeElements,
    getOrder,
    getOrderByCheckoutSession,
    getPayPalConfig,
    getStripeConfig,
} from "../controllers/order.controller";
import { getMyOrders } from "../controllers/my-order.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

router.get("/stripe/config", getStripeConfig);
router.post("/stripe/custom", createStripeElements);
router.get("/paypal/config", getPayPalConfig);
router.post("/paypal/create", createPayPalCheckout);
router.post("/paypal/:paypalOrderId/capture", capturePayPalCheckout);
router.post("/checkout", createCheckout);
router.get("/session/:sessionId", getOrderByCheckoutSession);
router.get("/mine", authenticateToken, getMyOrders);
router.get("/:code", getOrder);

export default router;
