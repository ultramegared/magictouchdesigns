/**
 * Magic Touch Designs - Admin Order Controllers
 */

import type { Request, Response } from "express";
import { pool } from "../config/database";
import { ensureOrderTables } from "../services/order.service";
import { sendShipmentUpdate } from "../services/shipment.service";
import { sendCustomOrderNotification } from "../services/order.service";

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


const stripeAdminRequest = async (path: string, body: URLSearchParams, idempotencyKey?: string): Promise<any> => {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not configured.");
    const headers: Record<string, string> = {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/x-www-form-urlencoded",
    };
    if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
    const response = await fetch(`https://api.stripe.com/v1/${path}`, {
        method: "POST",
        headers,
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
            `SELECT id, order_code, stripe_payment_intent_id, payment_provider, payment_status, total, currency,
                    customer_email, customer_first_name, customer_last_name
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
        const refund = await stripeAdminRequest("refunds", body, `mtd-refund-${order.id}`);
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

        // Only notify the customer after Stripe confirms that the refund succeeded.
        // Email failure must not undo or misreport a completed financial refund.
        let customerNotified = false;
        let notificationError: string | undefined;
        if (order.customer_email) {
            try {
                const { sendTemplateEmail } = await import("../services/email-template.service");
                const customerName = [order.customer_first_name, order.customer_last_name]
                    .filter(Boolean)
                    .join(" ") || "Customer";
                const currency = String(order.currency || "USD").toUpperCase();
                const refundAmount = new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency,
                }).format(Number(refund.amount || 0) / 100);
                await sendTemplateEmail(
                    "order_cancelled",
                    String(order.customer_email),
                    {
                        siteName: "Magic Touch Designs",
                        customerName,
                        orderCode: String(order.order_code),
                        updateMessage: `Your order has been cancelled and your refund of ${refundAmount} has been issued to the original payment method. The time it takes to appear depends on your bank or card issuer.`,
                        contactUrl: "https://magictouchdesigns.com/contact",
                    },
                    `customer-order-refunded/${order.id}/${refund.id}`,
                );
                customerNotified = true;
            } catch (emailError) {
                notificationError = emailError instanceof Error ? emailError.message : "Customer refund email failed.";
                console.error("Customer refund notification failed after Stripe refund succeeded:", emailError);
            }
        } else {
            notificationError = "The order has no customer email address.";
            console.error("Customer refund notification skipped: no customer email for order", order.order_code);
        }

        res.json({
            success: true,
            orderCode: order.order_code,
            refundId: refund.id,
            refundStatus: refund.status,
            amount: Number(refund.amount || 0) / 100,
            customerNotified,
            ...(notificationError ? { notificationError } : {}),
        });
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
        const logoUrl = "https://res.cloudinary.com/ydcdwyui/image/upload/v1790738368/magic-touch-designs/logos/nneyxqq6xylcxciw3om7.png";
        const customerName = [order.customer_first_name, order.customer_last_name].filter(Boolean).join(" ") || "Valued customer";
        const paymentStatus = String(order.payment_status || "paid").toUpperCase();
        const html = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>Receipt ${esc(order.order_code)}</title></head>
<body style="margin:0;padding:0;background:#f2f5f9;font-family:Arial,Helvetica,sans-serif;color:#172033">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f2f5f9;padding:28px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:640px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden">
<tr><td style="background:#123d70;padding:26px 30px;text-align:center">
<img src="${logoUrl}" width="104" height="104" alt="JQ &amp; YD — Magic Touch Designs" style="display:block;width:104px;height:104px;object-fit:contain;margin:0 auto 12px;border:0">
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
        await sendEmail({ to: order.customer_email, subject: `Your Magic Touch Designs invoice — ${order.order_code}`, html, text: `MAGIC TOUCH DESIGNS — PAYMENT CONFIRMED\nThank you for your order, ${customerName}.\nOrder: ${order.order_code}\nPayment status: ${paymentStatus}\n\nITEMS\n${items.map((item: any) => `${item.product_name} × ${Number(item.quantity || 0)} — ${money(Number(item.unit_price || 0) * Number(item.quantity || 0))}`).join("\n")}\n\nSubtotal: ${money(order.subtotal)}\nShipping: ${money(order.shipping)}\nSales tax: ${money(order.tax)}\nTOTAL PAID: ${money(order.total)}\n\nCustomer: ${customerName}\nEmail: ${order.customer_email}\nPhone: ${order.customer_phone || "Not provided"}\nDelivery: ${addressText || "Not recorded"}\nPayment method: ${order.payment_provider || order.payment_method || "Not recorded"}\nDate: ${new Date(order.created_at).toLocaleString("en-US")}\n\nThank you for choosing Magic Touch Designs.`, idempotencyKey: `admin-invoice-${order.id}-${Date.now()}` });
        res.json({ success: true, orderCode: order.order_code, sentTo: order.customer_email });
    } catch (error) {
        console.error("Admin invoice email error:", error);
        res.status(500).json({ message: error instanceof Error ? error.message : "Unable to send invoice email." });
    }
};


export const resendAdminSellerOrderEmail = async (req: Request, res: Response): Promise<void> => {
    try {
        await ensureOrderTables();
        const orderId = String(req.params.id || "").trim();
        const result = await pool.query("SELECT id, order_code, payment_status FROM orders WHERE id::text = $1 OR order_code = $1 LIMIT 1", [orderId]);
        const order = result.rows[0];
        if (!order) { res.status(404).json({ message: "Order not found." }); return; }
        if (String(order.payment_status).toLowerCase() !== "paid") {
            res.status(409).json({ message: "Seller production email can only be sent for an order with confirmed paid status. This order was not changed." });
            return;
        }
        await sendCustomOrderNotification(String(order.id), { resend: true });
        res.json({ success: true, orderCode: order.order_code, message: "Seller production email sent." });
    } catch (error) {
        console.error("Admin seller order email error:", error);
        res.status(500).json({ message: error instanceof Error ? error.message : "Unable to send seller production email." });
    }
};
