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
import { sendTemplateEmail } from "./email-template.service";
import { getShippingQuote } from "./shipping.service";
import { getSettings } from "./settings.service";
import { getCustomMugRequest, markCustomMugRequestPaid, getCustomMugArtworkAttachment, ensureCustomMugRequestTable } from "./custom-mug.service";
const FRONTEND_URL = process.env.FRONTEND_URL || "https://magictouchdesigns.com";
const STRIPE_API = "https://api.stripe.com/v1";

export interface CheckoutItemInput { productId: string; quantity: number; customRequestId?: string; model?: string; size?: string; color?: string; customizationId?: string; customization?: { productId: string; productName: string; size: string; color: string; designDataUrl: string; designFileName?: string | null; designScale?: number; designX?: number; designY?: number; designRotation?: number; mugRotation?: number; }; }
export interface CheckoutCustomerInput { firstName: string; lastName: string; email: string; phone?: string; deliveryType?: "house" | "apartment"; address?: string; apartment?: string; city?: string; state?: string; zip?: string; }
export interface OrderItemSnapshot { product_id: string; name: string; image_url: string | null; unit_price: number; quantity: number; variant: Record<string, string>; }
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
            paypal_order_id VARCHAR(255) UNIQUE,
            paypal_capture_id VARCHAR(255),
            payment_provider VARCHAR(32),
            payment_method VARCHAR(64),
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
            shipping_service VARCHAR(80),
            shipping_delivery_days INTEGER,
            shipping_rate_id TEXT,
            tracking_number VARCHAR(120),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS paypal_order_id VARCHAR(255);
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS paypal_capture_id VARCHAR(255);
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_provider VARCHAR(32);
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(64);
        CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_paypal_order_id ON orders(paypal_order_id) WHERE paypal_order_id IS NOT NULL;
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
        CREATE TABLE IF NOT EXISTS checkout_attempts (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            checkout_code VARCHAR(32) NOT NULL UNIQUE,
            provider VARCHAR(32) NOT NULL,
            stripe_checkout_session_id VARCHAR(255) UNIQUE,
            paypal_order_id VARCHAR(255) UNIQUE,
            customer_first_name VARCHAR(120) NOT NULL,
            customer_last_name VARCHAR(120) NOT NULL,
            customer_email VARCHAR(320) NOT NULL,
            customer_phone VARCHAR(40),
            shipping_address JSONB NOT NULL DEFAULT '{}'::jsonb,
            items JSONB NOT NULL DEFAULT '[]'::jsonb,
            subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
            shipping NUMERIC(12,2) NOT NULL DEFAULT 0,
            tax NUMERIC(12,2) NOT NULL DEFAULT 0,
            total NUMERIC(12,2) NOT NULL DEFAULT 0,
            carrier VARCHAR(40),
            shipping_service VARCHAR(80),
            shipping_delivery_days INTEGER,
            shipping_rate_id TEXT,
            status VARCHAR(32) NOT NULL DEFAULT 'pending',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_checkout_attempts_created_at ON checkout_attempts(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_checkout_attempts_status ON checkout_attempts(status);
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_service VARCHAR(80);
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_delivery_days INTEGER;
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_rate_id TEXT;
        ALTER TABLE checkout_attempts ADD COLUMN IF NOT EXISTS shipping_service VARCHAR(80);
        ALTER TABLE checkout_attempts ADD COLUMN IF NOT EXISTS shipping_delivery_days INTEGER;
        ALTER TABLE checkout_attempts ADD COLUMN IF NOT EXISTS shipping_rate_id TEXT;
    `);
    initialized = true;
};
const requireStripeKey = (): string => { const key = process.env.STRIPE_SECRET_KEY; if (!key) throw new Error("STRIPE_SECRET_KEY is not configured."); return key; };
const stripeRequest = async (path: string, body: URLSearchParams): Promise<any> => { const response = await fetch(`${STRIPE_API}${path}`, { method: "POST", headers: { Authorization: `Bearer ${requireStripeKey()}`, "Content-Type": "application/x-www-form-urlencoded" }, body }); const data = await response.json() as any; if (!response.ok) throw new Error(data?.error?.message || "Stripe request failed."); return data; };
const makeOrderCode = async (): Promise<string> => { const result = await pool.query<{ sequence: string }>("SELECT nextval('mtd_order_sequence')::text AS sequence"); const date = new Date().toISOString().slice(0, 10).replace(/-/g, ""); return `#MTD-${date}-${result.rows[0].sequence.padStart(4, "0")}`; };
const isSafeImageDataUrl = (value: string): boolean => /^data:image\/(png|jpeg|gif|webp);base64,[A-Za-z0-9+/=]+$/.test(value) && value.length <= 4.2 * 1024 * 1024;
export const buildOrderSnapshot = async (
    customer: CheckoutCustomerInput,
    items: CheckoutItemInput[],
    options: { skipShipping?: boolean; customRequestId?: string } = {},
) => {
    await ensureOrderTables();
    if (!items.length) throw new Error("Your cart is empty.");
    const normalizedItems: OrderItemSnapshot[] = [];

    const inputs = options.customRequestId
        ? [{ productId: "CUSTOM-MUG", quantity: 1, customRequestId: options.customRequestId } as CheckoutItemInput]
        : items;

    for (const input of inputs) {
        if (input.customRequestId) {
            await ensureCustomMugRequestTable();
            const request = await getCustomMugRequest(input.customRequestId);
            if (!request || request.status !== "pending") {
                throw new Error("This custom mug request is no longer available for payment.");
            }
            if (request.email.trim().toLowerCase() !== customer.email.trim().toLowerCase()) {
                throw new Error("The checkout email must match the custom mug request email.");
            }
            const variant: Record<string, string> = {
                customRequestId: request.id,
                requestCode: request.request_code,
                model: request.model,
                size: request.size,
                color: request.color,
                printSides: request.print_sides,
                fontStyle: request.font_style,
                fontName: request.font_name,
                customText: request.text_for_mug || "",
                customNotes: request.notes || "",
            };
            normalizedItems.push({
                product_id: "CUSTOM-MUG",
                name: `Custom Mug — ${request.model} ${request.size}`,
                image_url: null,
                unit_price: Number(request.unit_price),
                quantity: Number(request.quantity),
                variant,
            });
            continue;
        }

        const quantity = Math.floor(Number(input.quantity));
        if (!input.productId || quantity < 1 || quantity > 99) throw new Error("Invalid cart item.");
        const product = await getProductById(input.productId);
        if (!product || !product.is_active) throw new Error("One of the products is no longer available.");
        const variant: Record<string, string> = {
            ...(input.model ? { model: input.model } : {}),
            ...(input.size ? { size: input.size } : {}),
            ...(input.color ? { color: input.color } : {}),
        };
        if (input.customizationId) {
            const customization = input.customization;
            if (!customization || customization.productId !== String(product.product_id) || !isSafeImageDataUrl(customization.designDataUrl)) {
                throw new Error("The custom mug artwork is missing or invalid. Please return to Customize and upload it again.");
            }
            variant.customizationId = input.customizationId;
            variant.designDataUrl = customization.designDataUrl;
            if (customization.designFileName) variant.designFileName = customization.designFileName.slice(0, 180);
            if (customization.designScale !== undefined) variant.designScale = String(customization.designScale);
            if (customization.designX !== undefined) variant.designX = String(customization.designX);
            if (customization.designY !== undefined) variant.designY = String(customization.designY);
            if (customization.designRotation !== undefined) variant.designRotation = String(customization.designRotation);
            if (customization.mugRotation !== undefined) variant.mugRotation = String(customization.mugRotation);
        }
        normalizedItems.push({
            product_id: String(product.product_id),
            name: String(product.name),
            image_url: product.image_url || null,
            unit_price: Number(product.price),
            quantity,
            variant,
        });
    }

    const subtotal = normalizedItems.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
    const shippingQuote = options.skipShipping
        ? { shippingCents: 0, shipping: 0, carrier: "", service: "", deliveryDays: null, currency: "USD", shipmentId: "", rateId: "", verifiedAddress: null }
        : await getShippingQuote({
            firstName: customer.firstName,
            lastName: customer.lastName,
            email: customer.email,
            phone: customer.phone,
            address: customer.address || "",
            apartment: customer.apartment,
            city: customer.city || "",
            state: customer.state || "",
            zip: customer.zip || "",
            country: "US",
        }, normalizedItems);
    const shippingCents = shippingQuote.shippingCents;
    const shipping = shippingCents / 100;
    const verifiedAddress = shippingQuote.verifiedAddress || {
        address: customer.address || "",
        apartment: customer.apartment || "",
        city: customer.city || "",
        state: customer.state || "",
        zip: customer.zip || "",
    };
    const shippingAddress = {
        deliveryType: customer.deliveryType || "house",
        address: verifiedAddress.address,
        apartment: verifiedAddress.apartment,
        city: verifiedAddress.city,
        state: verifiedAddress.state,
        zip: verifiedAddress.zip,
    };
    const checkoutCode = await makeOrderCode();
    return {
        checkoutCode,
        normalizedItems,
        subtotal,
        shipping,
        shippingCents,
        shippingAddress,
        shippingCarrier: shippingQuote.carrier,
        shippingService: shippingQuote.service,
        shippingDeliveryDays: shippingQuote.deliveryDays,
        shippingShipmentId: shippingQuote.shipmentId,
        shippingRateId: shippingQuote.rateId,
    };
};

export const createCheckoutAttempt = async (
    customer: CheckoutCustomerInput,
    snapshot: Awaited<ReturnType<typeof buildOrderSnapshot>>,
    provider: "stripe" | "paypal",
) => {
    await ensureOrderTables();
    const result = await pool.query(
        `INSERT INTO checkout_attempts
            (checkout_code, provider, customer_first_name, customer_last_name, customer_email, customer_phone,
             shipping_address, items, subtotal, shipping, tax, total, carrier, shipping_service, shipping_delivery_days, shipping_rate_id, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,0,$11,$12,$13,$14,$15,'pending')
         RETURNING id, checkout_code`,
        [
            snapshot.checkoutCode,
            provider,
            customer.firstName.trim(),
            customer.lastName.trim(),
            customer.email.trim().toLowerCase(),
            customer.phone?.trim() || null,
            JSON.stringify(snapshot.shippingAddress),
            JSON.stringify(snapshot.normalizedItems),
            snapshot.subtotal,
            snapshot.shipping,
            snapshot.subtotal + snapshot.shipping,
            snapshot.shippingCarrier || null,
            snapshot.shippingService || null,
            snapshot.shippingDeliveryDays || null,
            snapshot.shippingRateId || null,
        ],
    );
    return { attemptId: String(result.rows[0].id), checkoutCode: String(result.rows[0].checkout_code) };
};

export const createCheckoutSession = async (customer: CheckoutCustomerInput, items: CheckoutItemInput[], customRequestId?: string) => {
    const snapshot = await buildOrderSnapshot(customer, items, { customRequestId });
    const attempt = await createCheckoutAttempt(customer, snapshot, "stripe");
    const params = new URLSearchParams();
    params.set("mode", "payment");
    params.set("success_url", `${FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`);
    params.set("cancel_url", `${FRONTEND_URL}/checkout`);
    params.set("customer_email", customer.email.trim().toLowerCase());
    params.set("payment_intent_data[receipt_email]", customer.email.trim().toLowerCase());
    params.set("billing_address_collection", "auto");
    params.set("shipping_address_collection[allowed_countries][0]", "US");
    params.set("shipping_options[0][shipping_rate_data][type]", "fixed_amount");
    params.set("shipping_options[0][shipping_rate_data][fixed_amount][amount]", String(snapshot.shippingCents));
    params.set("shipping_options[0][shipping_rate_data][fixed_amount][currency]", "usd");
    params.set("shipping_options[0][shipping_rate_data][display_name]", "Standard Shipping");
    params.set("automatic_tax[enabled]", "true");
    params.set("metadata[checkout_attempt_id]", attempt.attemptId);
    params.set("metadata[checkout_code]", attempt.checkoutCode);
    snapshot.normalizedItems.forEach((item, index) => {
        params.set(`line_items[${index}][price_data][currency]`, "usd");
        params.set(`line_items[${index}][price_data][product_data][name]`, item.name);
        if (item.image_url) params.set(`line_items[${index}][price_data][product_data][images][0]`, item.image_url);
        params.set(`line_items[${index}][price_data][unit_amount]`, String(Math.round(item.unit_price * 100)));
        params.set(`line_items[${index}][quantity]`, String(item.quantity));
    });
    try {
        const session = await stripeRequest("/checkout/sessions", params);
        await pool.query(
            `UPDATE checkout_attempts SET stripe_checkout_session_id = $1, updated_at = NOW() WHERE id = $2`,
            [session.id, attempt.attemptId],
        );
        return { orderCode: attempt.checkoutCode, checkoutCode: attempt.checkoutCode, checkoutAttemptId: attempt.attemptId, checkoutUrl: session.url };
    } catch (error) {
        await pool.query(`UPDATE checkout_attempts SET status = 'failed', updated_at = NOW() WHERE id = $1`, [attempt.attemptId]);
        throw error;
    }
};

const getOrderWithItems = async (where: string, values: unknown[]) => { const orderResult = await pool.query(`SELECT * FROM orders ${where}`, values); if (!orderResult.rows[0]) return null; const items = await pool.query(`SELECT * FROM order_items WHERE order_id = $1 ORDER BY id ASC`, [orderResult.rows[0].id]); return { ...orderResult.rows[0], items: items.rows }; };
export const getOrderByCode = async (orderCode: string) => { await ensureOrderTables(); return getOrderWithItems("WHERE order_code = $1", [orderCode]); };
export const getOrderBySessionId = async (sessionId: string) => { await ensureOrderTables(); return getOrderWithItems("WHERE stripe_checkout_session_id = $1", [sessionId]); };
export const verifyStripeSignature = (payload: Buffer, signature: string): boolean => { const secret = process.env.STRIPE_WEBHOOK_SECRET; if (!secret || !signature) return false; const parts = signature.split(","); const timestamp = parts.find((part) => part.startsWith("t="))?.slice(2); const signatureValue = parts.find((part) => part.startsWith("v1="))?.slice(3); if (!timestamp || !signatureValue) return false; const age = Math.abs(Date.now() / 1000 - Number(timestamp)); if (!Number.isFinite(age) || age > 300) return false; const expectedBuffer = crypto.createHmac("sha256", secret).update(`${timestamp}.${payload.toString("utf8")}`).digest(); const receivedBuffer = Buffer.from(signatureValue, "hex"); if (expectedBuffer.length !== receivedBuffer.length) return false; return crypto.timingSafeEqual(expectedBuffer, receivedBuffer); };
const escapeHtml = (value: unknown): string => String(value ?? "").replace(/[&<>\"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[character] || character));
const dataUrlToAttachment = (dataUrl: string, fileName: string | undefined, index: number) => { const match = dataUrl.match(/^data:(image\/(?:png|jpeg|gif|webp));base64,(.+)$/); if (!match) throw new Error("Invalid customization image data."); const safeName = (fileName || `custom-mug-design-${index + 1}.png`).replace(/[^a-zA-Z0-9._-]/g, "_"); return { filename: safeName, content: match[2], contentType: match[1] }; };

export const sendCustomOrderNotification = async (orderIdOrCode: string): Promise<void> => {
    await ensureOrderTables();
    const orderResult = await pool.query("SELECT * FROM orders WHERE id::text = $1 OR order_code = $1 LIMIT 1", [orderIdOrCode]);
    const order = orderResult.rows[0];
    if (!order) throw new Error("Order not found for customization email.");
    const itemsResult = await pool.query("SELECT * FROM order_items WHERE order_id = $1 ORDER BY id ASC", [order.id]);
    const customItems = itemsResult.rows.filter((item:any) => item.variant?.designDataUrl || item.variant?.customRequestId);
    if (!customItems.length) return;
    const attachments:Array<{filename:string;content:string;contentType?:string}> = [];
    for (const item of customItems) {
        if (item.variant?.designDataUrl) attachments.push(dataUrlToAttachment(item.variant.designDataUrl, item.variant.designFileName, attachments.length));
        if (item.variant?.customRequestId) {
            const attachment = await getCustomMugArtworkAttachment(String(item.variant.customRequestId));
            if (attachment) attachments.push(attachment);
        }
    }
    const orderItems = itemsResult.rows.map((item:any) => String(item.product_name) + " × " + String(item.quantity) + " — $" + Number(item.unit_price).toFixed(2)).join("\n");
    const requestCode = customItems.map((item:any) => item.variant?.customRequestId).filter(Boolean).join(", ") || "Custom order";
    const settings = await getSettings();
    const recipient = settings.supportEmail.trim() || process.env.ORDER_NOTIFICATION_EMAIL || process.env.RESEND_REPLY_TO || "jqyd.magic@gmail.com";
    await sendTemplateEmail("custom_mug_paid", recipient, {
        siteName:"JQYDesigns", customerName:(order.customer_first_name + " " + order.customer_last_name).trim(), customerEmail:order.customer_email,
        orderCode:order.order_code, requestCode, orderTotal:"$" + Number(order.total).toFixed(2),
        paymentProvider:order.payment_provider || "payment provider", orderItems,
        orderUrl:FRONTEND_URL + "/admin/orders", supportEmail:settings.supportEmail || "jqydesigns@gmail.com"
    }, "custom-order/" + order.id, order.customer_email, attachments);
    for (const item of customItems) {
        if (item.variant?.customRequestId) await markCustomMugRequestPaid(String(item.variant.customRequestId));
        if (item.variant?.designDataUrl) {
            await pool.query("UPDATE order_items SET variant = variant - 'designDataUrl' - 'designFileName' - 'designScale' - 'designX' - 'designY' - 'designRotation' - 'mugRotation' WHERE id = $1", [item.id]);
        }
    }
};

export const sendCustomerOrderConfirmation = async (orderIdOrCode: string): Promise<void> => {
    await ensureOrderTables();
    const orderResult = await pool.query("SELECT * FROM orders WHERE id::text = $1 OR order_code = $1 LIMIT 1", [orderIdOrCode]);
    const order = orderResult.rows[0];
    if (!order) throw new Error("Order not found for customer confirmation email.");
    const itemsResult = await pool.query("SELECT * FROM order_items WHERE order_id = $1 ORDER BY id ASC", [order.id]);
    const shippingAddress = order.shipping_address || {};
    const orderItems = itemsResult.rows.map((item:any) => String(item.product_name) + " × " + String(item.quantity) + " — $" + Number(item.unit_price).toFixed(2)).join("\n");
    const address = [order.customer_first_name + " " + order.customer_last_name, shippingAddress.address, shippingAddress.apartment, shippingAddress.city + ", " + shippingAddress.state + " " + shippingAddress.zip].filter(Boolean).join("\n");
    const trackOrderUrl = FRONTEND_URL + "/track-order?order=" + encodeURIComponent(String(order.order_code));
    await sendTemplateEmail("order_confirmed", order.customer_email, {
        siteName:"JQYDesigns", customerName:order.customer_first_name || "Customer", customerEmail:order.customer_email,
        orderCode:order.order_code, orderTotal:"$" + Number(order.total).toFixed(2), subtotal:"$" + Number(order.subtotal).toFixed(2),
        shipping:"$" + Number(order.shipping).toFixed(2), tax:"$" + Number(order.tax).toFixed(2), orderItems, shippingAddress:address,
        orderUrl:trackOrderUrl, supportEmail:"jqydesigns@gmail.com"
    }, "customer-order-confirmation/" + order.id);
};


export const materializePaidOrder = async (input: {
    attemptId: string;
    paymentProvider: "stripe" | "paypal";
    paymentMethod: string;
    stripeCheckoutSessionId?: string | null;
    stripePaymentIntentId?: string | null;
    paypalOrderId?: string | null;
    paypalCaptureId?: string | null;
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
    customer?: Partial<CheckoutCustomerInput> & { shippingAddress?: Record<string, string> };
}) => {
    await ensureOrderTables();
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const attemptResult = await client.query(`SELECT * FROM checkout_attempts WHERE id = $1 FOR UPDATE`, [input.attemptId]);
        const attempt = attemptResult.rows[0];
        if (!attempt) throw new Error("Checkout attempt not found.");
        const existing = await client.query(
            `SELECT id, order_code FROM orders
             WHERE ($1::text IS NOT NULL AND stripe_checkout_session_id = $1)
                OR ($2::text IS NOT NULL AND paypal_order_id = $2)
             LIMIT 1`,
            [input.stripeCheckoutSessionId || null, input.paypalOrderId || null],
        );
        if (existing.rows[0]) {
            await client.query(`UPDATE checkout_attempts SET status='completed', updated_at=NOW() WHERE id=$1`, [input.attemptId]);
            await client.query("COMMIT");
            return { orderId: String(existing.rows[0].id), orderCode: String(existing.rows[0].order_code), created: false };
        }

        const customer = input.customer || {};
        const shippingAddress = customer.shippingAddress || attempt.shipping_address || {};
        const firstName = String(customer.firstName || attempt.customer_first_name || "").trim();
        const lastName = String(customer.lastName || attempt.customer_last_name || "").trim();
        const email = String(customer.email || attempt.customer_email || "").trim().toLowerCase();
        const phone = String(customer.phone || attempt.customer_phone || "").trim() || null;

        const orderResult = await client.query(
            `INSERT INTO orders
                (order_code, stripe_checkout_session_id, stripe_payment_intent_id, paypal_order_id, paypal_capture_id,
                 payment_provider, payment_method, customer_first_name, customer_last_name, customer_email, customer_phone,
                 shipping_address, subtotal, shipping, tax, total, carrier, shipping_service, shipping_delivery_days, shipping_rate_id, status, payment_status)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,'paid','paid')
             RETURNING id, order_code`,
            [
                attempt.checkout_code,
                input.stripeCheckoutSessionId || null,
                input.stripePaymentIntentId || null,
                input.paypalOrderId || null,
                input.paypalCaptureId || null,
                input.paymentProvider,
                input.paymentMethod,
                firstName,
                lastName,
                email,
                phone,
                JSON.stringify(shippingAddress),
                input.subtotal,
                input.shipping,
                input.tax,
                input.total,
                attempt.carrier || null,
                attempt.shipping_service || null,
                attempt.shipping_delivery_days || null,
                attempt.shipping_rate_id || null,
            ],
        );
        const orderId = String(orderResult.rows[0].id);
        const items = Array.isArray(attempt.items) ? attempt.items : [];
        for (const item of items) {
            await client.query(
                `INSERT INTO order_items (order_id, product_id, product_name, image_url, unit_price, quantity, variant)
                 VALUES ($1,$2,$3,$4,$5,$6,$7)`,
                [orderId, String(item.product_id), String(item.name), item.image_url || null, Number(item.unit_price), Number(item.quantity), JSON.stringify(item.variant || {})],
            );
        }
        await client.query(
            `UPDATE checkout_attempts SET status='completed', subtotal=$1, shipping=$2, tax=$3, total=$4, carrier=$6, shipping_service=$7, shipping_delivery_days=$8, shipping_rate_id=$9, updated_at=NOW() WHERE id=$5`,
            [input.subtotal, input.shipping, input.tax, input.total, input.attemptId, attempt.carrier || null, attempt.shipping_service || null, attempt.shipping_delivery_days || null, attempt.shipping_rate_id || null],
        );
        await client.query("COMMIT");
        return { orderId, orderCode: String(orderResult.rows[0].order_code), created: true };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

export const handleStripeWebhook = async (event: any): Promise<void> => {
    await ensureOrderTables();
    if (event?.type !== "checkout.session.completed" && event?.type !== "checkout.session.async_payment_succeeded") return;
    const session = event.data?.object;
    const attemptId = session?.metadata?.checkout_attempt_id;
    if (!attemptId) throw new Error("Stripe checkout attempt metadata is missing.");
    if (session?.payment_status !== "paid" && event?.type === "checkout.session.completed") return;
    const amountSubtotal = Number(session.amount_subtotal || 0) / 100;
    const amountTotal = Number(session.amount_total || 0) / 100;
    const amountTax = Number(session.total_details?.amount_tax || 0) / 100;
    const amountShipping = Number(session.total_details?.amount_shipping || 0) / 100;
    const customerDetails = session?.customer_details || {};
    const shippingDetails = session?.shipping_details || {};
    const shippingAddress = shippingDetails?.address || {};
    const name = String(shippingDetails?.name || customerDetails?.name || "").trim();
    const nameParts = name.split(/\s+/).filter(Boolean);
    const firstName = nameParts.shift() || "";
    const lastName = nameParts.join(" ") || "";
    const email = String(customerDetails?.email || "").trim().toLowerCase();
    const phone = String(customerDetails?.phone || "").trim();
    const result = await materializePaidOrder({
        attemptId,
        paymentProvider: "stripe",
        paymentMethod: "card_or_wallet",
        stripeCheckoutSessionId: String(session.id),
        stripePaymentIntentId: session.payment_intent ? String(session.payment_intent) : null,
        subtotal: amountSubtotal,
        shipping: amountShipping,
        tax: amountTax,
        total: amountTotal,
        customer: {
            firstName,
            lastName,
            email,
            phone,
            shippingAddress: shippingDetails?.address ? {
                deliveryType: "house",
                address: String(shippingAddress?.line1 || ""),
                apartment: String(shippingAddress?.line2 || ""),
                city: String(shippingAddress?.city || ""),
                state: String(shippingAddress?.state || ""),
                zip: String(shippingAddress?.postal_code || ""),
            } : undefined,
        },
    });
    if (result.created) {
        await sendCustomerOrderConfirmation(result.orderId);
        await sendCustomOrderNotification(result.orderId);
    }
};
