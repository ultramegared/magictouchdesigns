/**
 * ================================================================
 * Project: Magic Touch Designs
 * File: order.service.ts
 * Module: Orders / Payments
 * ================================================================
 */

import crypto from "crypto";
import { pool } from "../config/database";
import { getProductById } from "./product.service";

const FRONTEND_URL = process.env.FRONTEND_URL || "https://magictouchdesigns.com";
const STRIPE_API = "https://api.stripe.com/v1";
const SHIPPING_AMOUNT_CENTS = 599;

export interface CheckoutItemInput {
    productId: string;
    quantity: number;
    model?: string;
    size?: string;
    color?: string;
}

export interface CheckoutCustomerInput {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    deliveryType?: "house" | "apartment";
    address?: string;
    apartment?: string;
    city?: string;
    state?: string;
    zip?: string;
}

interface OrderItemSnapshot {
    product_id: string;
    name: string;
    image_url: string | null;
    unit_price: number;
    quantity: number;
    variant: Record<string, string>;
}

let initialized = false;

export const ensureOrderTables = async (): Promise<void> => {
    if (initialized) return;
    await pool.query(`
        CREATE EXTENSION IF NOT EXISTS pgcrypto;
        CREATE SEQUENCE IF NOT EXISTS mtd_order_sequence START 1;
        CREATE TABLE IF NOT EXISTS orders (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            order_code VARCHAR(32) NOT NULL UNIQUE,
            stripe_checkout_session_id VARCHAR(255) UNIQUE,
            stripe_payment_intent_id VARCHAR(255),
            customer_first_name VARCHAR(120) NOT NULL,
            customer_last_name VARCHAR(120) NOT NULL,
            customer_email VARCHAR(320) NOT NULL,
            customer_phone VARCHAR(40),
            shipping_address JSONB NOT NULL DEFAULT '{}'::jsonb,
            subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
            shipping NUMERIC(12,2) NOT NULL DEFAULT 0,
            tax NUMERIC(12,2) NOT NULL DEFAULT 0,
            total NUMERIC(12,2) NOT NULL DEFAULT 0,
            currency VARCHAR(3) NOT NULL DEFAULT 'USD',
            payment_status VARCHAR(32) NOT NULL DEFAULT 'pending',
            status VARCHAR(32) NOT NULL DEFAULT 'pending_payment',
            carrier VARCHAR(40),
            tracking_number VARCHAR(120),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS order_items (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
            product_id VARCHAR(120) NOT NULL,
            product_name VARCHAR(255) NOT NULL,
            image_url TEXT,
            unit_price NUMERIC(12,2) NOT NULL,
            quantity INTEGER NOT NULL CHECK (quantity > 0),
            variant JSONB NOT NULL DEFAULT '{}'::jsonb
        );
        CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
        CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
        CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
    `);
    initialized = true;
};

const requireStripeKey = (): string => {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not configured.");
    return key;
};

const stripeRequest = async (path: string, body: URLSearchParams): Promise<any> => {
    const response = await fetch(`${STRIPE_API}${path}`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${requireStripeKey()}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
    });
    const data = await response.json() as any;
    if (!response.ok) throw new Error(data?.error?.message || "Stripe request failed.");
    return data;
};

const makeOrderCode = async (): Promise<string> => {
    const result = await pool.query<{ sequence: string }>(
        "SELECT nextval('mtd_order_sequence')::text AS sequence"
    );
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    return `#MTD-${date}-${result.rows[0].sequence.padStart(4, "0")}`;
};

export const createCheckoutSession = async (
    customer: CheckoutCustomerInput,
    items: CheckoutItemInput[],
) => {
    await ensureOrderTables();
    if (!items.length) throw new Error("Your cart is empty.");

    const normalizedItems: OrderItemSnapshot[] = [];
    for (const input of items) {
        const quantity = Math.floor(Number(input.quantity));
        if (!input.productId || quantity < 1 || quantity > 99) throw new Error("Invalid cart item.");

        const product = await getProductById(input.productId);
        if (!product || !product.is_active) throw new Error("One of the products is no longer available.");

        normalizedItems.push({
            product_id: String(product.product_id),
            name: String(product.name),
            image_url: product.image_url || null,
            unit_price: Number(product.price),
            quantity,
            variant: {
                ...(input.model ? { model: input.model } : {}),
                ...(input.size ? { size: input.size } : {}),
                ...(input.color ? { color: input.color } : {}),
            },
        });
    }

    const subtotal = normalizedItems.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
    const orderCode = await makeOrderCode();
    const shippingAddress = {
        deliveryType: customer.deliveryType || "house",
        address: customer.address || "",
        apartment: customer.apartment || "",
        city: customer.city || "",
        state: customer.state || "",
        zip: customer.zip || "",
    };

    const orderResult = await pool.query(
        `INSERT INTO orders (
            order_code, customer_first_name, customer_last_name, customer_email,
            customer_phone, shipping_address, subtotal, shipping, tax, total,
            status, payment_status
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,0,$9,'pending_payment','pending')
        RETURNING id, order_code`,
        [
            orderCode,
            customer.firstName.trim(),
            customer.lastName.trim(),
            customer.email.trim().toLowerCase(),
            customer.phone?.trim() || null,
            JSON.stringify(shippingAddress),
            subtotal,
            SHIPPING_AMOUNT_CENTS / 100,
            subtotal + SHIPPING_AMOUNT_CENTS / 100,
        ],
    );

    const orderId = orderResult.rows[0].id as string;
    for (const item of normalizedItems) {
        await pool.query(
            `INSERT INTO order_items (
                order_id, product_id, product_name, image_url, unit_price, quantity, variant
            ) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
            [orderId, item.product_id, item.name, item.image_url, item.unit_price, item.quantity, JSON.stringify(item.variant)],
        );
    }

    const params = new URLSearchParams();
    params.set("mode", "payment");
    params.set("success_url", `${FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`);
    params.set("cancel_url", `${FRONTEND_URL}/checkout`);
    params.set("customer_email", customer.email.trim().toLowerCase());
    params.set("billing_address_collection", "auto");
    params.set("shipping_address_collection[allowed_countries][0]", "US");
    params.set("shipping_options[0][shipping_rate_data][type]", "fixed_amount");
    params.set("shipping_options[0][shipping_rate_data][fixed_amount][amount]", String(SHIPPING_AMOUNT_CENTS));
    params.set("shipping_options[0][shipping_rate_data][fixed_amount][currency]", "usd");
    params.set("shipping_options[0][shipping_rate_data][display_name]", "Standard Shipping");
    params.set("automatic_tax[enabled]", "true");
    params.set("metadata[order_id]", orderId);
    params.set("metadata[order_code]", orderCode);

    normalizedItems.forEach((item, index) => {
        params.set(`line_items[${index}][price_data][currency]`, "usd");
        params.set(`line_items[${index}][price_data][product_data][name]`, item.name);
        if (item.image_url) params.set(`line_items[${index}][price_data][product_data][images][0]`, item.image_url);
        params.set(`line_items[${index}][price_data][unit_amount]`, String(Math.round(item.unit_price * 100)));
        params.set(`line_items[${index}][quantity]`, String(item.quantity));
    });

    try {
        const session = await stripeRequest("/checkout/sessions", params);
        await pool.query(
            `UPDATE orders SET stripe_checkout_session_id = $1, updated_at = NOW() WHERE id = $2`,
            [session.id, orderId],
        );
        return { orderCode, checkoutUrl: session.url };
    } catch (error) {
        await pool.query(
            `UPDATE orders SET status = 'payment_setup_failed', updated_at = NOW() WHERE id = $1`,
            [orderId],
        );
        throw error;
    }
};

const getOrderWithItems = async (where: string, values: unknown[]) => {
    const orderResult = await pool.query(`SELECT * FROM orders ${where}`, values);
    if (!orderResult.rows[0]) return null;
    const items = await pool.query(`SELECT * FROM order_items WHERE order_id = $1 ORDER BY id ASC`, [orderResult.rows[0].id]);
    return { ...orderResult.rows[0], items: items.rows };
};

export const getOrderByCode = async (orderCode: string) => {
    await ensureOrderTables();
    return getOrderWithItems("WHERE order_code = $1", [orderCode]);
};

export const getOrderBySessionId = async (sessionId: string) => {
    await ensureOrderTables();
    return getOrderWithItems("WHERE stripe_checkout_session_id = $1", [sessionId]);
};

export const verifyStripeSignature = (payload: Buffer, signature: string): boolean => {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret || !signature) return false;
    const parts = signature.split(",");
    const timestamp = parts.find((part) => part.startsWith("t="))?.slice(2);
    const signatureValue = parts.find((part) => part.startsWith("v1="))?.slice(3);
    if (!timestamp || !signatureValue) return false;
    const age = Math.abs(Date.now() / 1000 - Number(timestamp));
    if (!Number.isFinite(age) || age > 300) return false;
    const expectedBuffer = crypto.createHmac("sha256", secret)
        .update(`${timestamp}.${payload.toString("utf8")}`)
        .digest();
    const receivedBuffer = Buffer.from(signatureValue, "hex");
    if (expectedBuffer.length !== receivedBuffer.length) return false;
    return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
};

export const handleStripeWebhook = async (event: any): Promise<void> => {
    await ensureOrderTables();
    if (event?.type !== "checkout.session.completed" && event?.type !== "checkout.session.async_payment_succeeded") return;
    const session = event.data?.object;
    const orderId = session?.metadata?.order_id;
    if (!orderId) return;

    const amountSubtotal = Number(session.amount_subtotal || 0) / 100;
    const amountTotal = Number(session.amount_total || 0) / 100;
    const amountTax = Number(session.total_details?.amount_tax || 0) / 100;
    const amountShipping = Number(session.total_details?.amount_shipping || SHIPPING_AMOUNT_CENTS) / 100;

    await pool.query(
        `UPDATE orders SET
            stripe_payment_intent_id = $1, subtotal = $2, shipping = $3,
            tax = $4, total = $5, payment_status = 'paid', status = 'paid', updated_at = NOW()
         WHERE id = $6`,
        [session.payment_intent || null, amountSubtotal, amountShipping, amountTax, amountTotal, orderId],
    );
};
