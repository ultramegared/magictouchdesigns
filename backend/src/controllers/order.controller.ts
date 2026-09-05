/**
 * Magic Touch Designs - Order Controllers
 */

import type { Request, Response } from "express";
import {
    createCheckoutSession,
    getOrderByCode,
    getOrderBySessionId,
    handleStripeWebhook,
    verifyStripeSignature,
    type CheckoutCustomerInput,
    type CheckoutItemInput,
} from "../services/order.service";

export const createCheckout = async (req: Request, res: Response): Promise<void> => {
    try {
        const customer = req.body?.customer as CheckoutCustomerInput;
        const items = req.body?.items as CheckoutItemInput[];

        if (!customer?.firstName || !customer?.lastName || !customer?.email) {
            res.status(400).json({ message: "Customer information is required." });
            return;
        }
        if (!customer.address || !customer.city || !customer.state || !customer.zip) {
            res.status(400).json({ message: "A complete shipping address is required." });
            return;
        }

        res.status(201).json(await createCheckoutSession(customer, items || []));
    } catch (error) {
        console.error("Create checkout error:", error);
        res.status(400).json({
            message: error instanceof Error ? error.message : "Unable to start checkout.",
        });
    }
};

export const getOrder = async (req: Request, res: Response): Promise<void> => {
    try {
        const code = String(req.params.code || "").trim();
        if (!code) {
            res.status(400).json({ message: "Order code is required." });
            return;
        }
        const order = await getOrderByCode(code);
        if (!order) {
            res.status(404).json({ message: "Order not found." });
            return;
        }
        res.json(order);
    } catch (error) {
        console.error("Get order error:", error);
        res.status(500).json({ message: "Unable to retrieve order." });
    }
};

export const getOrderByCheckoutSession = async (req: Request, res: Response): Promise<void> => {
    try {
        const sessionId = String(req.params.sessionId || "").trim();
        if (!sessionId) {
            res.status(400).json({ message: "Checkout session is required." });
            return;
        }
        const order = await getOrderBySessionId(sessionId);
        if (!order) {
            res.status(404).json({ message: "Order not found." });
            return;
        }
        res.json(order);
    } catch (error) {
        console.error("Get checkout order error:", error);
        res.status(500).json({ message: "Unable to retrieve order." });
    }
};

export const stripeWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
        const payload = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body));
        const signature = String(req.headers["stripe-signature"] || "");
        if (!verifyStripeSignature(payload, signature)) {
            res.status(400).send("Invalid Stripe signature.");
            return;
        }
        await handleStripeWebhook(JSON.parse(payload.toString("utf8")));
        res.json({ received: true });
    } catch (error) {
        console.error("Stripe webhook error:", error);
        res.status(400).send("Webhook processing failed.");
    }
};
