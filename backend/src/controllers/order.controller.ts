/**
 * Magic Touch Designs - Order Controllers
 */

import type { Request, Response } from "express";
import {
    createCheckoutSession,
    getOrderByCode,
    getOrderBySessionId,
    handleStripeWebhook,
    sendCustomOrderNotification,
    verifyStripeSignature,
    type CheckoutCustomerInput,
    type CheckoutItemInput,
} from "../services/order.service";
import { capturePayPalOrder, createPayPalOrder, getPayPalPublicConfig } from "../services/paypal.service";
import { createStripeElementsCheckout, getStripeElementsPublicConfig } from "../services/stripe-elements.service";

export const createCheckout = async (req: Request, res: Response): Promise<void> => {
    try {
        const customer = req.body?.customer as CheckoutCustomerInput;
        const items = req.body?.items as CheckoutItemInput[];
        if (!customer?.firstName || !customer?.lastName || !customer?.email) return void res.status(400).json({ message: "Customer information is required." });
        if (!customer.address || !customer.city || !customer.state || !customer.zip) return void res.status(400).json({ message: "A complete shipping address is required." });
        res.status(201).json(await createCheckoutSession(customer, items || []));
    } catch (error) { console.error("Create checkout error:", error); res.status(400).json({ message: error instanceof Error ? error.message : "Unable to start checkout." }); }
};

export const getStripeConfig = (_req: Request, res: Response): void => { res.json(getStripeElementsPublicConfig()); };

export const createStripeElements = async (req: Request, res: Response): Promise<void> => {
    try {
        const customer = req.body?.customer as CheckoutCustomerInput;
        const items = req.body?.items as CheckoutItemInput[];
        if (!customer?.firstName || !customer?.lastName || !customer?.email) return void res.status(400).json({ message: "Customer information is required." });
        if (!customer.address || !customer.city || !customer.state || !customer.zip) return void res.status(400).json({ message: "A complete shipping address is required." });
        res.status(201).json(await createStripeElementsCheckout(customer, items || []));
    } catch (error) { console.error("Create Stripe Elements checkout error:", error); res.status(400).json({ message: error instanceof Error ? error.message : "Unable to start card checkout." }); }
};

export const getPayPalConfig = (_req: Request, res: Response): void => { res.json(getPayPalPublicConfig()); };

export const createPayPalCheckout = async (req: Request, res: Response): Promise<void> => {
    try {
        const customer = req.body?.customer as CheckoutCustomerInput;
        const items = req.body?.items as CheckoutItemInput[];
        if (!customer?.firstName || !customer?.lastName || !customer?.email) return void res.status(400).json({ message: "Customer information is required." });
        if (!customer.address || !customer.city || !customer.state || !customer.zip) return void res.status(400).json({ message: "A complete shipping address is required." });
        res.status(201).json(await createPayPalOrder(customer, items || []));
    } catch (error) { console.error("Create PayPal checkout error:", error); res.status(400).json({ message: error instanceof Error ? error.message : "Unable to start PayPal checkout." }); }
};

export const capturePayPalCheckout = async (req: Request, res: Response): Promise<void> => {
    try {
        const paypalOrderId = String(req.params.paypalOrderId || "").trim();
        if (!paypalOrderId) return void res.status(400).json({ message: "PayPal order is required." });
        const result = await capturePayPalOrder(paypalOrderId);
        if (result.orderCode) await sendCustomOrderNotification(result.orderCode);
        res.json(result);
    } catch (error) { console.error("Capture PayPal checkout error:", error); res.status(400).json({ message: error instanceof Error ? error.message : "Unable to capture PayPal payment." }); }
};

export const getOrder = async (req: Request, res: Response): Promise<void> => {
    try {
        const code = String(req.params.code || "").trim();
        const email = String(req.query.email || "").trim().toLowerCase();
        if (!code || !email) return void res.status(400).json({ message: "Order code and email are required." });
        const order = await getOrderByCode(code);
        if (!order || String(order.customer_email).toLowerCase() !== email) return void res.status(404).json({ message: "Order not found." });
        res.json(order);
    } catch (error) { console.error("Get order error:", error); res.status(500).json({ message: "Unable to retrieve order." }); }
};

export const getOrderByCheckoutSession = async (req: Request, res: Response): Promise<void> => {
    try {
        const sessionId = String(req.params.sessionId || "").trim();
        if (!sessionId) return void res.status(400).json({ message: "Checkout session is required." });
        const order = await getOrderBySessionId(sessionId);
        if (!order) return void res.status(404).json({ message: "Order not found." });
        res.json(order);
    } catch (error) { console.error("Get checkout order error:", error); res.status(500).json({ message: "Unable to retrieve order." }); }
};

export const stripeWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
        const payload = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body));
        const signature = String(req.headers["stripe-signature"] || "");
        if (!verifyStripeSignature(payload, signature)) return void res.status(400).send("Invalid Stripe signature.");
        await handleStripeWebhook(JSON.parse(payload.toString("utf8")));
        res.json({ received: true });
    } catch (error) { console.error("Stripe webhook error:", error); res.status(400).send("Webhook processing failed."); }
};
