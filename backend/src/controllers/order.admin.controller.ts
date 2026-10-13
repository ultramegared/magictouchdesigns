/**
 * Magic Touch Designs - Admin Order Controllers
 */

import type { Request, Response } from "express";
import { pool } from "../config/database";
import { ensureOrderTables } from "../services/order.service";
import { sendShipmentUpdate } from "../services/shipment.service";

export const listAdminOrders = async (_req: Request, res: Response): Promise<void> => {
    try {
        await ensureOrderTables();
        const result = await pool.query(`
            SELECT
                o.id,
                o.order_code,
                CONCAT_WS(' ', o.customer_first_name, o.customer_last_name) AS customer_name,
                o.customer_email,
                o.customer_phone,
                o.shipping_address,
                o.subtotal,
                o.shipping AS shipping_amount,
                o.tax AS tax_amount,
                o.total AS total_amount,
                o.currency,
                o.payment_provider,
                o.payment_method,
                o.payment_status,
                o.status,
                o.carrier,
                o.tracking_number,
                o.created_at,
                o.updated_at,
                COUNT(oi.id)::int AS item_count,
                COALESCE(
                    json_agg(json_build_object(
                        'id', oi.id,
                        'product_id', oi.product_id,
                        'product_name', oi.product_name,
                        'image_url', oi.image_url,
                        'unit_price', oi.unit_price,
                        'quantity', oi.quantity,
                        'variant', oi.variant
                    ) ORDER BY oi.id) FILTER (WHERE oi.id IS NOT NULL),
                    '[]'::json
                ) AS items
            FROM orders o
            LEFT JOIN order_items oi ON oi.order_id = o.id
            WHERE o.payment_status IN ('paid', 'refunded')
            GROUP BY o.id
            ORDER BY o.created_at DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error("List admin orders error:", error);
        res.status(500).json({ message: "Unable to retrieve orders." });
    }
};

export const updateAdminOrder = async (req: Request, res: Response): Promise<void> => {
    try {
        await ensureOrderTables();
        const orderId = String(req.params.id || "");
        const { status, carrier, trackingNumber } = req.body || {};
        const allowedStatuses = ["pending_payment", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"];
        if (status !== undefined && !allowedStatuses.includes(status)) { res.status(400).json({ message: "Invalid order status." }); return; }
        const beforeResult = await pool.query(
            `SELECT status, carrier, tracking_number, payment_status FROM orders WHERE id = $1 LIMIT 1`,
            [orderId],
        );
        if (!beforeResult.rows[0]) { res.status(404).json({ message: "Order not found." }); return; }
        if (beforeResult.rows[0].payment_status !== "paid" && beforeResult.rows[0].payment_status !== "refunded") {
            res.status(409).json({ message: "Only paid or refunded orders can be updated from the fulfillment workspace." });
            return;
        }

        const nextStatus = status !== undefined ? status : beforeResult.rows[0].status;
        const nextCarrier = carrier !== undefined ? (carrier?.trim() || null) : beforeResult.rows[0].carrier;
        const nextTracking = trackingNumber !== undefined ? (trackingNumber?.trim() || null) : beforeResult.rows[0].tracking_number;
        const result = await pool.query(
            `UPDATE orders SET status = $1, carrier = $2, tracking_number = $3, updated_at = NOW() WHERE id = $4 RETURNING *`,
            [nextStatus, nextCarrier, nextTracking, orderId],
        );
        const before = beforeResult.rows[0];
        const shipmentChanged =
            (nextCarrier || "") !== (before.carrier || "") ||
            (nextTracking || "") !== (before.tracking_number || "") ||
            (nextStatus === "shipped" && before.status !== "shipped");
        if (shipmentChanged && nextTracking) {
            try {
                await sendShipmentUpdate(orderId);
            } catch (emailError) {
                console.error("Shipment update email error:", emailError);
            }
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error("Update admin order error:", error);
        res.status(500).json({ message: "Unable to update order." });
    }
};

export const purgeUnpaidOrders = async (_req: Request, res: Response): Promise<void> => {
    try {
        await ensureOrderTables();
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            const ordersResult = await client.query(
                `DELETE FROM orders
                 WHERE payment_status NOT IN ('paid', 'refunded')
                 RETURNING id, order_code`,
            );
            const attemptsResult = await client.query(
                `DELETE FROM checkout_attempts
                 WHERE status = 'failed'
                    OR (status = 'pending' AND created_at < NOW() - INTERVAL '7 days')
                 RETURNING id, checkout_code`,
            );
            await client.query("COMMIT");
            res.json({
                deleted: true,
                count: ordersResult.rows.length,
                ordersDeleted: ordersResult.rows.length,
                attemptsDeleted: attemptsResult.rows.length,
                orderCodes: ordersResult.rows.map((row: { order_code: string }) => row.order_code),
            });
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Purge unpaid orders error:", error);
        res.status(500).json({ message: "Unable to clean unpaid checkout records." });
    }
};

export const deleteAdminOrder = async (req: Request, res: Response): Promise<void> => {
    try {
        await ensureOrderTables();
        const requestedIds = Array.isArray(req.body?.ids) ? req.body.ids.map((value: unknown) => String(value || "").trim()).filter(Boolean) : [];
        if (requestedIds.length > 1000) { res.status(400).json({ message: "You can delete up to 1000 orders at a time." }); return; }

        if (requestedIds.length > 0) {
            const ids = [...new Set(requestedIds)];
            const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            if (!ids.every(id => uuidPattern.test(id))) { res.status(400).json({ message: "Invalid order selection." }); return; }
            const client = await pool.connect();
            try {
                await client.query("BEGIN");
                const selected = await client.query(`SELECT id, status, payment_status FROM orders WHERE id = ANY($1::uuid[]) FOR UPDATE`, [ids]);
                if (selected.rows.length !== ids.length) { await client.query("ROLLBACK"); res.status(404).json({ message: "One or more selected orders could not be found." }); return; }
                const deletableIds = selected.rows.filter((order: { id: string; status: string; payment_status: string }) => ["pending_payment", "cancelled"].includes(order.status) && order.payment_status !== "paid").map((order: { id: string }) => order.id);
                if (deletableIds.length === 0) { await client.query("ROLLBACK"); res.status(409).json({ message: "No selected orders are eligible for deletion. Only pending or cancelled unpaid orders can be deleted." }); return; }
                const deleted = await client.query(`DELETE FROM orders WHERE id = ANY($1::uuid[]) RETURNING id, order_code`, [deletableIds]);
                await client.query("COMMIT");
                res.json({ deleted: true, count: deleted.rows.length, skipped: ids.length - deleted.rows.length, orderCodes: deleted.rows.map((row: { order_code: string }) => row.order_code) });
                return;
            } catch (error) {
                await client.query("ROLLBACK");
                throw error;
            } finally { client.release(); }
        }

        const orderId = String(req.params.id || "");
        const result = await pool.query(`DELETE FROM orders WHERE id = $1 AND status IN ('pending_payment', 'cancelled') AND payment_status <> 'paid' RETURNING id, order_code`, [orderId]);
        if (!result.rows[0]) {
            const orderResult = await pool.query(`SELECT status, payment_status FROM orders WHERE id = $1`, [orderId]);
            if (!orderResult.rows[0]) { res.status(404).json({ message: "Order not found." }); return; }
            if (orderResult.rows[0].payment_status === "paid") { res.status(409).json({ message: "Paid orders cannot be deleted. Use refund or cancellation instead." }); return; }
            res.status(409).json({ message: "Only pending or cancelled unpaid orders can be deleted." });
            return;
        }
        res.json({ deleted: true, orderCode: result.rows[0].order_code });
    } catch (error) {
        console.error("Delete admin order error:", error);
        res.status(500).json({ message: "Unable to delete order." });
    }
};


const stripeAdminRequest = async (path: string, body: URLSearchParams): Promise<any> => {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not configured.");
    const response = await fetch(`https://api.stripe.com/v1/${path}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/x-www-form-urlencoded" },
        body,
    });
    const data = await response.json() as any;
    if (!response.ok) throw new Error(data?.error?.message || "Stripe request failed.");
    return data;
};

export const refundAdminOrder = async (req: Request, res: Response): Promise<void> => {
    try {
        await ensureOrderTables();
        const orderId = String(req.params.id || "");
        const orderResult = await pool.query(
            `SELECT id, order_code, stripe_payment_intent_id, payment_provider, payment_status, total, currency
             FROM orders WHERE id = $1 LIMIT 1`,
            [orderId],
        );
        const order = orderResult.rows[0];
        if (!order) { res.status(404).json({ message: "Order not found." }); return; }
        if (order.payment_provider !== "stripe" || !order.stripe_payment_intent_id) {
            res.status(409).json({ message: "This order does not have a refundable Stripe payment linked." }); return;
        }
        if (order.payment_status === "refunded") {
            res.status(409).json({ message: "This order has already been marked as refunded." }); return;
        }
        if (order.payment_status !== "paid") {
            res.status(409).json({ message: "Only confirmed paid orders can be refunded." }); return;
        }

        const body = new URLSearchParams();
        body.set("payment_intent", order.stripe_payment_intent_id);
        body.set("metadata[order_code]", order.order_code);
        body.set("metadata[reason]", "Admin initiated refund");
        const refund = await stripeAdminRequest("refunds", body);
        if (refund.status !== "succeeded") {
            res.status(202).json({
                success: false,
                orderCode: order.order_code,
                refundId: refund.id,
                refundStatus: refund.status,
                amount: Number(refund.amount || 0) / 100,
                message: "Stripe accepted the refund request but has not confirmed completion. The order remains unchanged until Stripe confirms it.",
            });
            return;
        }
        await pool.query(
            `UPDATE orders SET payment_status = 'refunded', status = 'refunded', updated_at = NOW() WHERE id = $1`,
            [orderId],
        );
        res.json({ success: true, orderCode: order.order_code, refundId: refund.id, refundStatus: refund.status, amount: Number(refund.amount || 0) / 100 });
    } catch (error) {
        console.error("Admin order refund error:", error);
        res.status(500).json({ message: error instanceof Error ? error.message : "Unable to refund this order." });
    }
};

export const sendAdminOrderInvoice = async (req: Request, res: Response): Promise<void> => {
    try {
        await ensureOrderTables();
        const orderId = String(req.params.id || "");
        const result = await pool.query(
            `SELECT o.*, COALESCE(
                json_agg(json_build_object(
                    'product_name', oi.product_name, 'unit_price', oi.unit_price,
                    'quantity', oi.quantity, 'variant', oi.variant
                ) ORDER BY oi.id) FILTER (WHERE oi.id IS NOT NULL), '[]'::json
             ) AS items
             FROM orders o LEFT JOIN order_items oi ON oi.order_id = o.id
             WHERE o.id = $1 GROUP BY o.id LIMIT 1`,
            [orderId],
        );
        const order = result.rows[0];
        if (!order) { res.status(404).json({ message: "Order not found." }); return; }
        if (!order.customer_email) { res.status(409).json({ message: "This order has no customer email address." }); return; }

        const { sendEmail } = await import("../services/email.service");
        const currency = String(order.currency || "USD").toUpperCase();
        const money = (value: unknown) => new Intl.NumberFormat("en-US", { style: "currency", currency }).format(Number(value || 0));
        const esc = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch] || ch));
        const items = Array.isArray(order.items) ? order.items : [];
        const itemRows = items.map((item: any) => `<tr><td style="padding:10px;border-bottom:1px solid #e5e7eb">${esc(item.product_name)} × ${Number(item.quantity || 0)}</td><td style="padding:10px;text-align:right;border-bottom:1px solid #e5e7eb">${money(Number(item.unit_price || 0) * Number(item.quantity || 0))}</td></tr>`).join("");
        const address = order.shipping_address && typeof order.shipping_address === "object" ? order.shipping_address : {};
        const addressText = [address.address, address.apartment, address.city, address.state, address.zip].filter(Boolean).join(", ");
        const html = `<div style="font-family:Arial,sans-serif;color:#172033;max-width:680px;margin:auto"><h1 style="color:#174b86">Magic Touch Designs</h1><p>Invoice / Receipt</p><h2>${esc(order.order_code)}</h2><p>Customer: ${esc(order.customer_first_name)} ${esc(order.customer_last_name)}<br>Email: ${esc(order.customer_email)}<br>Phone: ${esc(order.customer_phone || "Not provided")}<br>Delivery address: ${esc(addressText || "Not recorded")}</p><table style="width:100%;border-collapse:collapse"><thead><tr><th style="text-align:left;padding:10px">Item</th><th style="text-align:right;padding:10px">Amount</th></tr></thead><tbody>${itemRows}<tr><td style="padding:10px">Subtotal</td><td style="padding:10px;text-align:right">${money(order.subtotal)}</td></tr><tr><td style="padding:10px">Shipping</td><td style="padding:10px;text-align:right">${money(order.shipping)}</td></tr><tr><td style="padding:10px">Sales tax</td><td style="padding:10px;text-align:right">${money(order.tax)}</td></tr><tr><td style="padding:12px;font-weight:bold;border-top:2px solid #174b86">Total</td><td style="padding:12px;text-align:right;font-weight:bold;border-top:2px solid #174b86">${money(order.total)}</td></tr></tbody></table><p>Payment status: ${esc(order.payment_status)}<br>Payment method: ${esc(order.payment_provider || order.payment_method || "Not recorded")}<br>Date: ${esc(new Date(order.created_at).toLocaleString("en-US"))}</p><p>Thank you for shopping with Magic Touch Designs.</p></div>`;
        await sendEmail({ to: order.customer_email, subject: `Your Magic Touch Designs invoice — ${order.order_code}`, html, text: `Magic Touch Designs invoice for ${order.order_code}. Total: ${money(order.total)}. Subtotal: ${money(order.subtotal)}. Shipping: ${money(order.shipping)}. Sales tax: ${money(order.tax)}. Customer: ${order.customer_first_name} ${order.customer_last_name}. Delivery: ${addressText}.`, idempotencyKey: `admin-invoice-${order.id}-${Date.now()}` });
        res.json({ success: true, orderCode: order.order_code, sentTo: order.customer_email });
    } catch (error) {
        console.error("Admin invoice email error:", error);
        res.status(500).json({ message: error instanceof Error ? error.message : "Unable to send invoice email." });
    }
};
