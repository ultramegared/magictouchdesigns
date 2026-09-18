/**
 * Magic Touch Designs - Order Routes
 */

import { Router } from "express";
import { capturePayPalCheckout, createCheckout, createPayPalCheckout, createStripeApplePay, createStripeElements, getCheckoutQuote, getOrder, getOrderByCheckoutSession, getPayPalClientToken, getPayPalConfig, getStripeConfig, updateApplePayShipping } from "../controllers/order.controller";

const router = Router();

router.get("/stripe/config", getStripeConfig);
router.post("/stripe/custom", createStripeElements);
router.post("/stripe/apple-pay", createStripeApplePay);
router.post("/stripe/apple-pay/shipping", updateApplePayShipping);
router.post("/quote", getCheckoutQuote);
router.get("/paypal/config", getPayPalConfig);
router.get("/paypal/client-token", getPayPalClientToken);
router.post("/paypal/create", createPayPalCheckout);
router.post("/paypal/:paypalOrderId/capture", capturePayPalCheckout);
router.post("/checkout", createCheckout);
router.get("/session/:sessionId", getOrderByCheckoutSession);
router.get("/:code", getOrder);

export default router;