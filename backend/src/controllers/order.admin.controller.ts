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
        const logoBase64 = "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";
        const customerName = [order.customer_first_name, order.customer_last_name].filter(Boolean).join(" ") || "Valued customer";
        const paymentStatus = String(order.payment_status || "paid").toUpperCase();
        const html = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>Receipt ${esc(order.order_code)}</title></head>
<body style="margin:0;padding:0;background:#f2f5f9;font-family:Arial,Helvetica,sans-serif;color:#172033">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f2f5f9;padding:28px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:640px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden">
<tr><td style="background:#123d70;padding:26px 30px;text-align:center">
<img src="cid:jqyd-logo" width="104" height="104" alt="JQ &amp; YD — Magic Touch Designs" style="display:block;width:104px;height:104px;object-fit:contain;margin:0 auto 12px;border:0">
<div style="font-size:19px;line-height:26px;letter-spacing:2px;font-weight:700;color:#ffffff">MAGIC TOUCH DESIGNS</div>
<div style="font-size:11px;line-height:18px;letter-spacing:3px;color:#dbeafe">PERSONALIZED WITH CARE</div>
</td></tr>
<tr><td style="padding:30px 30px 12px">
<div style="font-size:12px;line-height:18px;letter-spacing:2px;font-weight:700;color:#b18424">PAYMENT CONFIRMED</div>
<h1 style="margin:8px 0 10px;font-size:27px;line-height:34px;color:#14243a">Thank you for your order!</h1>
<p style="margin:0;font-size:15px;line-height:24px;color:#536174">Hello ${esc(customerName)}, your payment has been received. Keep this email as your purchase receipt.</p>
</td></tr>
<tr><td style="padding:12px 30px 20px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f7f9fc;border:1px solid #e5eaf1;border-radius:10px"><tr>
<td style="padding:15px 16px"><div style="font-size:11px;line-height:17px;color:#64748b;letter-spacing:1px">ORDER NUMBER</div><div style="font-size:16px;line-height:24px;font-weight:700;color:#14243a">${esc(order.order_code)}</div></td>
<td align="right" style="padding:15px 16px"><div style="font-size:11px;line-height:17px;color:#64748b;letter-spacing:1px">PAYMENT STATUS</div><span style="display:inline-block;background:#dcfce7;color:#166534;font-size:12px;line-height:18px;font-weight:700;padding:4px 9px;border-radius:20px">${esc(paymentStatus)}</span></td>
</tr></table>
</td></tr>
<tr><td style="padding:0 30px 8px"><h2 style="margin:0;font-size:17px;line-height:24px;color:#14243a">Order summary</h2></td></tr>
<tr><td style="padding:0 30px 18px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse">
<thead><tr><th align="left" style="padding:12px 8px;border-bottom:1px solid #dbe3ed;font-size:12px;color:#64748b">ITEM</th><th align="right" style="padding:12px 8px;border-bottom:1px solid #dbe3ed;font-size:12px;color:#64748b">AMOUNT</th></tr></thead>
<tbody>${itemRows}
<tr><td style="padding:10px 8px;font-size:14px;color:#536174">Subtotal</td><td align="right" style="padding:10px 8px;font-size:14px;color:#172033">${money(order.subtotal)}</td></tr>
<tr><td style="padding:10px 8px;font-size:14px;color:#536174">Shipping</td><td align="right" style="padding:10px 8px;font-size:14px;color:#172033">${money(order.shipping)}</td></tr>
<tr><td style="padding:10px 8px;font-size:14px;color:#536174">Sales tax</td><td align="right" style="padding:10px 8px;font-size:14px;color:#172033">${money(order.tax)}</td></tr>
<tr><td style="padding:15px 8px;border-top:2px solid #174b86;font-size:16px;font-weight:700;color:#14243a">TOTAL PAID</td><td align="right" style="padding:15px 8px;border-top:2px solid #174b86;font-size:20px;font-weight:700;color:#174b86">${money(order.total)}</td></tr>
</tbody></table>
</td></tr>
<tr><td style="padding:0 30px 24px">
<h2 style="margin:0 0 12px;font-size:17px;line-height:24px;color:#14243a">Customer &amp; delivery details</h2>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td style="padding:0 0 8px;font-size:13px;line-height:20px;color:#536174"><strong style="color:#172033">Customer</strong><br>${esc(customerName)}<br>${esc(order.customer_email)}<br>${esc(order.customer_phone || "Phone not provided")}</td></tr>
<tr><td style="padding:8px 0;font-size:13px;line-height:20px;color:#536174"><strong style="color:#172033">Shipping address</strong><br>${esc(addressText || "Not recorded")}</td></tr>
<tr><td style="padding:8px 0;font-size:13px;line-height:20px;color:#536174"><strong style="color:#172033">Payment method</strong><br>${esc(order.payment_provider || order.payment_method || "Not recorded")}<br><strong style="color:#172033">Order date</strong><br>${esc(new Date(order.created_at).toLocaleString("en-US"))}</td></tr></table>
</td></tr>
<tr><td style="background:#f7f9fc;border-top:1px solid #e5eaf1;padding:22px 30px;text-align:center">
<p style="margin:0 0 8px;font-size:15px;line-height:22px;font-weight:700;color:#174b86">Thank you for choosing Magic Touch Designs.</p>
<p style="margin:0;font-size:12px;line-height:19px;color:#64748b">Questions about your order? Reply to this email and we’ll be happy to help.</p>
<p style="margin:12px 0 0;font-size:11px;line-height:17px;color:#94a3b8">© ${new Date().getFullYear()} Magic Touch Designs · Personalized with care</p>
</td></tr></table></td></tr></table></body></html>`;
        await sendEmail({ to: order.customer_email, subject: `Your Magic Touch Designs invoice — ${order.order_code}`, html, text: `MAGIC TOUCH DESIGNS — PAYMENT CONFIRMED\nThank you for your order, ${customerName}.\nOrder: ${order.order_code}\nPayment status: ${paymentStatus}\n\nITEMS\n${items.map((item: any) => `${item.product_name} × ${Number(item.quantity || 0)} — ${money(Number(item.unit_price || 0) * Number(item.quantity || 0))}`).join("\n")}\n\nSubtotal: ${money(order.subtotal)}\nShipping: ${money(order.shipping)}\nSales tax: ${money(order.tax)}\nTOTAL PAID: ${money(order.total)}\n\nCustomer: ${customerName}\nEmail: ${order.customer_email}\nPhone: ${order.customer_phone || "Not provided"}\nDelivery: ${addressText || "Not recorded"}\nPayment method: ${order.payment_provider || order.payment_method || "Not recorded"}\nDate: ${new Date(order.created_at).toLocaleString("en-US")}\n\nThank you for choosing Magic Touch Designs.`, attachments: [{ filename: "jqyd-logo.png", content: logoBase64, contentType: "image/png", contentId: "jqyd-logo" }], idempotencyKey: `admin-invoice-${order.id}-${Date.now()}` });
        res.json({ success: true, orderCode: order.order_code, sentTo: order.customer_email });
    } catch (error) {
        console.error("Admin invoice email error:", error);
        res.status(500).json({ message: error instanceof Error ? error.message : "Unable to send invoice email." });
    }
};
