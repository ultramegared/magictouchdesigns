/**
 * ================================================================
 * Magic Touch Designs - Stripe Elements Checkout
 * Custom Checkout Session for Card + Apple Pay.
 * ================================================================
 */

import { pool } from "../config/database";
import {
    buildOrderSnapshot,
    type CheckoutCustomerInput,
    type CheckoutItemInput,
} from "./order.service";

const FRONTEND_URL = process.env.FRONTEND_URL || "https://magictouchdesigns.com";
const STRIPE_API = "https://api.stripe.com/v1";
const STRIPE_API_VERSION = "2025-09-30.clover";

const requireStripeKey = (): string => {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not configured.");
    return key;
};

const stripeRequest = async (body: URLSearchParams): Promise<any> => {
    const response = await fetch(`${STRIPE_API}/checkout/sessions`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${requireStripeKey()}`,
            "Content-Type": "application/x-www-form-urlencoded",
            "Stripe-Version": STRIPE_API_VERSION,
        },
        body,
    });
    const data = await response.json() as any;
    if (!response.ok) throw new Error(data?.error?.message || "Stripe checkout could not be created.");
    return data;
};

export const getStripeElementsPublicConfig = () => ({
    enabled: Boolean(process.env.STRIPE_PUBLISHABLE_KEY),
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null,
});

export const createStripeElementsCheckout = async (
    customer: CheckoutCustomerInput,
    items: CheckoutItemInput[],
) => {
    const snapshot = await buildOrderSnapshot(customer, items);
    const params = new URLSearchParams();

    params.set("mode", "payment");
    params.set("ui_mode", "custom");
    params.set("managed_payments[enabled]", "false");
    params.set("return_url", `${FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`);
    params.set("customer_email", customer.email.trim().toLowerCase());
    params.set("billing_address_collection", "auto");
    params.set("phone_number_collection[enabled]", "true");
    params.set("shipping_address_collection[allowed_countries][0]", "US");
    params.set("shipping_options[0][shipping_rate_data][type]", "fixed_amount");
    params.set("shipping_options[0][shipping_rate_data][fixed_amount][amount]", String(snapshot.shippingCents));
    params.set("shipping_options[0][shipping_rate_data][fixed_amount][currency]", "usd");
    params.set("shipping_options[0][shipping_rate_data][display_name]", "Standard Shipping");
    params.set("automatic_tax[enabled]", "true");
    params.set("metadata[order_id]", snapshot.orderId);
    params.set("metadata[order_code]", snapshot.orderCode);

    snapshot.normalizedItems.forEach((item, index) => {
        params.set(`line_items[${index}][price_data][currency]`, "usd");
        params.set(`line_items[${index}][price_data][product_data][name]`, item.name);
        if (item.image_url) {
            params.set(`line_items[${index}][price_data][product_data][images][0]`, item.image_url);
        }
        params.set(`line_items[${index}][price_data][unit_amount]`, String(Math.round(item.unit_price * 100)));
        params.set(`line_items[${index}][quantity]`, String(item.quantity));
    });

    try {
        const session = await stripeRequest(params);
        if (!session.id || !session.client_secret) {
            throw new Error("Stripe did not return a checkout client secret.");
        }

        await pool.query(
            `UPDATE orders SET stripe_checkout_session_id = $1, payment_provider = 'stripe', payment_method = 'card_or_apple_pay', updated_at = NOW() WHERE id = $2`,
            [session.id, snapshot.orderId],
        );

        return {
            orderCode: snapshot.orderCode,
            sessionId: session.id,
            clientSecret: session.client_secret,
            shipping: snapshot.shipping,
        };
    } catch (error) {
        await pool.query(
            `UPDATE orders SET status = 'payment_setup_failed', updated_at = NOW() WHERE id = $1`,
            [snapshot.orderId],
        );
        throw error;
    }
};
