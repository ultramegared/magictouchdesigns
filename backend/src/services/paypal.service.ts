/**
 * ================================================================
 * Magic Touch Designs - PayPal Payments
 * Server-side PayPal Orders API integration.
 * ================================================================
 */

import crypto from "crypto";
import { pool } from "../config/database";
import {
    buildOrderSnapshot,
    ensureOrderTables,
    type CheckoutCustomerInput,
    type CheckoutItemInput,
} from "./order.service";

const FRONTEND_URL = process.env.FRONTEND_URL || "https://magictouchdesigns.com";

const getPayPalBaseUrl = (): string =>
    process.env.PAYPAL_BASE_URL || "https://api-m.sandbox.paypal.com";

const requirePayPalCredentials = (): { clientId: string; secret: string } => {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const secret = process.env.PAYPAL_CLIENT_SECRET;
    if (!clientId || !secret) {
        throw new Error("PayPal is not configured. Add PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.");
    }
    return { clientId, secret };
};

const paypalJsonRequest = async (path: string, method: "GET" | "POST", token: string, body?: unknown): Promise<any> => {
    const response = await fetch(`${getPayPalBaseUrl()}${path}`, {
        method,
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
            "PayPal-Request-Id": crypto.randomUUID(),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const data = await response.json() as any;
    if (!response.ok) {
        throw new Error(data?.message || data?.details?.[0]?.description || "PayPal request failed.");
    }
    return data;
};

const getPayPalAccessToken = async (): Promise<string> => {
    const { clientId, secret } = requirePayPalCredentials();
    const credentials = Buffer.from(`${clientId}:${secret}`).toString("base64");
    const body = new URLSearchParams({ grant_type: "client_credentials" });
    const response = await fetch(`${getPayPalBaseUrl()}/v1/oauth2/token`, {
        method: "POST",
        headers: {
            Authorization: `Basic ${credentials}`,
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
        },
        body,
    });
    const data = await response.json() as any;
    if (!response.ok || !data?.access_token) {
        throw new Error(data?.error_description || "Unable to authenticate with PayPal.");
    }
    return String(data.access_token);
};

const calculateTax = async (
    customer: CheckoutCustomerInput,
    items: Array<{ unit_price: number; quantity: number; product_id: string }>,
    shipping: number,
): Promise<number> => {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is required for destination-based tax calculation.");

    const params = new URLSearchParams();
    params.set("currency", "usd");
    params.set("customer_details[address][line1]", customer.address || "");
    if (customer.apartment) params.set("customer_details[address][line2]", customer.apartment);
    params.set("customer_details[address][city]", customer.city || "");
    params.set("customer_details[address][state]", (customer.state || "").toUpperCase());
    params.set("customer_details[address][postal_code]", customer.zip || "");
    params.set("customer_details[address][country]", "US");
    params.set("customer_details[address_source]", "shipping");
    params.set("shipping_cost[amount]", String(Math.round(shipping * 100)));

    items.forEach((item, index) => {
        params.set(`line_items[${index}][amount]`, String(Math.round(item.unit_price * item.quantity * 100)));
        params.set(`line_items[${index}][quantity]`, String(item.quantity));
        params.set(`line_items[${index}][reference]`, item.product_id);
    });

    const response = await fetch("https://api.stripe.com/v1/tax/calculations", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${stripeKey}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params,
    });
    const data = await response.json() as any;
    if (!response.ok) throw new Error(data?.error?.message || "Unable to calculate sales tax.");
    return Number(data?.tax_amount_exclusive || 0) / 100;
};

const formatMoney = (amount: number): string => amount.toFixed(2);

export const getPayPalPublicConfig = () => {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    return {
        enabled: Boolean(clientId),
        clientId: clientId || null,
        currency: "USD",
        environment: getPayPalBaseUrl().includes("sandbox") ? "sandbox" : "live",
    };
};

export const createPayPalOrder = async (
    customer: CheckoutCustomerInput,
    items: CheckoutItemInput[],
) => {
    await ensureOrderTables();
    const snapshot = await buildOrderSnapshot(customer, items);
    const tax = await calculateTax(customer, snapshot.normalizedItems, snapshot.shipping);
    const total = snapshot.subtotal + snapshot.shipping + tax;

    await pool.query(
        `UPDATE orders SET tax = $1, total = $2, payment_provider = 'paypal', payment_method = 'paypal', updated_at = NOW() WHERE id = $3`,
        [tax, total, snapshot.orderId],
    );

    try {
        const token = await getPayPalAccessToken();
        const paypalOrder = await paypalJsonRequest("/v2/checkout/orders", "POST", token, {
            intent: "CAPTURE",
            purchase_units: [{
                reference_id: "default",
                invoice_id: snapshot.orderCode.replace(/^#/, ""),
                custom_id: snapshot.orderId,
                amount: {
                    currency_code: "USD",
                    value: formatMoney(total),
                    breakdown: {
                        item_total: { currency_code: "USD", value: formatMoney(snapshot.subtotal) },
                        shipping: { currency_code: "USD", value: formatMoney(snapshot.shipping) },
                        tax_total: { currency_code: "USD", value: formatMoney(tax) },
                    },
                },
                items: snapshot.normalizedItems.map((item) => ({
                    name: item.name.slice(0, 127),
                    unit_amount: { currency_code: "USD", value: formatMoney(item.unit_price) },
                    quantity: String(item.quantity),
                    category: "PHYSICAL_GOODS",
                    ...(item.image_url ? { image_url: item.image_url } : {}),
                })),
                shipping: {
                    name: { full_name: `${customer.firstName.trim()} ${customer.lastName.trim()}`.trim() },
                    address: {
                        address_line_1: customer.address,
                        ...(customer.apartment ? { address_line_2: customer.apartment } : {}),
                        admin_area_2: customer.city,
                        admin_area_1: customer.state?.toUpperCase(),
                        postal_code: customer.zip,
                        country_code: "US",
                    },
                },
            }],
            payment_source: {
                paypal: {
                    experience_context: {
                        brand_name: "Magic Touch Designs",
                        user_action: "PAY_NOW",
                        shipping_preference: "SET_PROVIDED_ADDRESS",
                        return_url: `${FRONTEND_URL}/checkout/success?paypal=1&order_code=${encodeURIComponent(snapshot.orderCode)}`,
                        cancel_url: `${FRONTEND_URL}/checkout?paypal=cancelled`,
                    },
                },
            },
        });

        await pool.query(
            `UPDATE orders SET paypal_order_id = $1, updated_at = NOW() WHERE id = $2`,
            [paypalOrder.id, snapshot.orderId],
        );

        return {
            orderCode: snapshot.orderCode,
            orderId: snapshot.orderId,
            paypalOrderId: paypalOrder.id,
            approvalUrl: paypalOrder.links?.find((link: any) => link.rel === "payer-action" || link.rel === "approve")?.href || null,
        };
    } catch (error) {
        await pool.query(
            `UPDATE orders SET status = 'payment_setup_failed', updated_at = NOW() WHERE id = $1`,
            [snapshot.orderId],
        );
        throw error;
    }
};

export const capturePayPalOrder = async (paypalOrderId: string) => {
    await ensureOrderTables();
    const orderResult = await pool.query(
        `SELECT * FROM orders WHERE paypal_order_id = $1 LIMIT 1`,
        [paypalOrderId],
    );
    const order = orderResult.rows[0];
    if (!order) throw new Error("Magic Touch Designs order not found for this PayPal payment.");

    if (order.payment_status === "paid") {
        return { orderCode: order.order_code, status: "COMPLETED", alreadyCaptured: true };
    }

    const token = await getPayPalAccessToken();
    const captured = await paypalJsonRequest(`/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`, "POST", token);
    const capture = captured?.purchase_units?.[0]?.payments?.captures?.[0];
    if (capture?.status !== "COMPLETED") {
        throw new Error(`PayPal payment was not completed (${capture?.status || "unknown"}).`);
    }

    const capturedAmount = Number(capture?.amount?.value || 0);
    const expectedAmount = Number(order.total);
    if (!Number.isFinite(capturedAmount) || Math.abs(capturedAmount - expectedAmount) > 0.01) {
        throw new Error("PayPal captured amount does not match the Magic Touch Designs order total.");
    }

    await pool.query(
        `UPDATE orders SET paypal_capture_id = $1, payment_status = 'paid', status = 'paid', payment_provider = 'paypal', payment_method = 'paypal', updated_at = NOW() WHERE id = $2`,
        [capture.id || null, order.id],
    );

    return { orderCode: order.order_code, status: capture.status, captureId: capture.id || null };
};
