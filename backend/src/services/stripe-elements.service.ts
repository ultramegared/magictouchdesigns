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
import { getShippingQuote } from "./shipping.service";

const FRONTEND_URL = process.env.FRONTEND_URL || "https://jqydesigns.com";
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
    params.set("payment_method_types[0]", "card");
    params.set("return_url", `${FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`);
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

export const createStripeApplePayCheckout = async (
    customer: CheckoutCustomerInput,
    items: CheckoutItemInput[],
) => {
    const snapshot = await buildOrderSnapshot(customer, items, { skipShipping: true });
    const params = new URLSearchParams();

    params.set("mode", "payment");
    params.set("ui_mode", "custom");
    params.set("managed_payments[enabled]", "false");
    params.set("payment_method_types[0]", "card");
    params.set("return_url", `${FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`);
    params.set("billing_address_collection", "auto");
    params.set("phone_number_collection[enabled]", "true");
    params.set("shipping_address_collection[allowed_countries][0]", "US");
    params.set("shipping_options[0][shipping_rate_data][type]", "fixed_amount");
    params.set("shipping_options[0][shipping_rate_data][fixed_amount][amount]", "0");
    params.set("shipping_options[0][shipping_rate_data][fixed_amount][currency]", "usd");
    params.set("shipping_options[0][shipping_rate_data][display_name]", "Shipping calculated from your delivery address");
    params.set("shipping_options[0][shipping_rate_data][tax_behavior]", "exclusive");
    params.set("automatic_tax[enabled]", "true");
    params.set("permissions[update_shipping_details]", "server_only");
    params.set("metadata[order_id]", snapshot.orderId);
    params.set("metadata[order_code]", snapshot.orderCode);

    snapshot.normalizedItems.forEach((item, index) => {
        params.set(`line_items[${index}][price_data][currency]`, "usd");
        params.set(`line_items[${index}][price_data][product_data][name]`, item.name);
        if (item.image_url) params.set(`line_items[${index}][price_data][product_data][images][0]`, item.image_url);
        params.set(`line_items[${index}][price_data][unit_amount]`, String(Math.round(item.unit_price * 100)));
        params.set(`line_items[${index}][quantity]`, String(item.quantity));
    });

    try {
        const session = await stripeRequest(params);
        if (!session.id || !session.client_secret) throw new Error("Stripe did not return an Apple Pay checkout client secret.");

        await pool.query(
            `UPDATE orders SET stripe_checkout_session_id = $1, payment_provider = 'stripe', payment_method = 'apple_pay', updated_at = NOW() WHERE id = $2`,
            [session.id, snapshot.orderId],
        );

        return {
            orderCode: snapshot.orderCode,
            sessionId: session.id,
            clientSecret: session.client_secret,
        };
    } catch (error) {
        await pool.query(
            `UPDATE orders SET status = 'payment_setup_failed', updated_at = NOW() WHERE id = $1`,
            [snapshot.orderId],
        );
        throw error;
    }
};

export const updateStripeApplePayShipping = async (
    sessionId: string,
    shippingDetails: any,
) => {
    const normalizedSessionId = String(sessionId || "").trim();
    if (!normalizedSessionId) throw new Error("Stripe checkout session is required.");

    const address = shippingDetails?.address || {};
    const postalCode = String(address.postal_code || "").trim();
    const city = String(address.city || "").trim();
    const state = String(address.state || "").trim();
    const country = String(address.country || "US").trim().toUpperCase();

    if (country !== "US" || !postalCode || !city || !state) {
        throw new Error("A complete US delivery destination is required.");
    }

    const orderResult = await pool.query(
        `SELECT * FROM orders WHERE stripe_checkout_session_id = $1 LIMIT 1`,
        [normalizedSessionId],
    );
    const order = orderResult.rows[0];
    if (!order) throw new Error("Apple Pay checkout order was not found.");

    const itemResult = await pool.query(
        `SELECT product_id, product_name, quantity FROM order_items WHERE order_id = $1 ORDER BY id ASC`,
        [order.id],
    );
    const items = itemResult.rows.map((item: any) => ({
        productId: String(item.product_id),
        quantity: Number(item.quantity),
    }));

    const currentAddress = order.shipping_address || {};
    const street = String(currentAddress.address || "").trim();
    const apartment = String(currentAddress.apartment || "").trim();

    if (!street) {
        throw new Error("Enter your street address in checkout before using Apple Pay.");
    }

    const shippingQuote = await getShippingQuote(
        {
            firstName: String(order.customer_first_name || ""),
            lastName: String(order.customer_last_name || ""),
            email: String(order.customer_email || ""),
            phone: String(order.customer_phone || ""),
            address: street,
            apartment,
            city,
            state,
            zip: postalCode,
            country,
        },
        items,
    );

    const params = new URLSearchParams();
    params.set("collected_information[shipping_details][name]", `${order.customer_first_name || ""} ${order.customer_last_name || ""}`.trim() || "Customer");
    params.set("collected_information[shipping_details][address][country]", country);
    params.set("collected_information[shipping_details][address][line1]", street);
    if (apartment) params.set("collected_information[shipping_details][address][line2]", apartment);
    params.set("collected_information[shipping_details][address][city]", city);
    params.set("collected_information[shipping_details][address][state]", state);
    params.set("collected_information[shipping_details][address][postal_code]", postalCode);
    params.set("shipping_options[0][shipping_rate_data][type]", "fixed_amount");
    params.set("shipping_options[0][shipping_rate_data][fixed_amount][amount]", String(shippingQuote.shippingCents));
    params.set("shipping_options[0][shipping_rate_data][fixed_amount][currency]", "usd");
    params.set("shipping_options[0][shipping_rate_data][display_name]", `${shippingQuote.carrier} ${shippingQuote.service}`.trim() || "Standard Shipping");
    if (shippingQuote.deliveryDays && shippingQuote.deliveryDays > 0) {
        params.set("shipping_options[0][shipping_rate_data][delivery_estimate][minimum][unit]", "business_day");
        params.set("shipping_options[0][shipping_rate_data][delivery_estimate][minimum][value]", String(Math.max(1, shippingQuote.deliveryDays)));
        params.set("shipping_options[0][shipping_rate_data][delivery_estimate][maximum][unit]", "business_day");
        params.set("shipping_options[0][shipping_rate_data][delivery_estimate][maximum][value]", String(Math.max(1, shippingQuote.deliveryDays + 2)));
    }
    params.set("shipping_options[0][shipping_rate_data][tax_behavior]", "exclusive");

    const response = await fetch(`${STRIPE_API}/checkout/sessions/${encodeURIComponent(normalizedSessionId)}`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${requireStripeKey()}`,
            "Content-Type": "application/x-www-form-urlencoded",
            "Stripe-Version": STRIPE_API_VERSION,
        },
        body: params,
    });
    const data = await response.json() as any;
    if (!response.ok) throw new Error(data?.error?.message || "Stripe could not update Apple Pay shipping.");

    const shippingAddress = {
        deliveryType: currentAddress.deliveryType || "house",
        address: street,
        apartment,
        city,
        state,
        zip: postalCode,
    };

    await pool.query(
        `UPDATE orders SET customer_first_name = COALESCE(NULLIF($1, ''), customer_first_name), customer_last_name = COALESCE(NULLIF($2, ''), customer_last_name), customer_email = COALESCE(NULLIF($3, ''), customer_email), shipping_address = $4, shipping = $5, total = subtotal + $5, carrier = $6, updated_at = NOW() WHERE stripe_checkout_session_id = $7`,
        [
            String(shippingDetails?.name || "").trim().split(/\s+/)[0] || String(order.customer_first_name || ""),
            String(shippingDetails?.name || "").trim().split(/\s+/).slice(1).join(" ") || String(order.customer_last_name || ""),
            String(order.customer_email || "").trim().toLowerCase(),
            JSON.stringify(shippingAddress),
            shippingQuote.shipping,
            shippingQuote.carrier,
            normalizedSessionId,
        ],
    );

    return {
        shipping: shippingQuote.shipping,
        shippingCents: shippingQuote.shippingCents,
        carrier: shippingQuote.carrier,
        service: shippingQuote.service,
        deliveryDays: shippingQuote.deliveryDays,
    };
};
