/**
 * Magic Touch Designs - Admin Order Controllers
 */

import type { Request, Response } from "express";
import { pool } from "../config/database";
import { ensureOrderTables } from "../services/order.service";

export const listAdminOrders = async (
    _req: Request,
    res: Response,
): Promise<void> => {
    try {
        await ensureOrderTables();

        const result = await pool.query(`
            SELECT
                o.*,
                COUNT(oi.id)::int AS item_count
            FROM orders o
            LEFT JOIN order_items oi ON oi.order_id = o.id
            GROUP BY o.id
            ORDER BY o.created_at DESC
        `);

        res.json(result.rows);
    } catch (error) {
        console.error("List admin orders error:", error);
        res.status(500).json({ message: "Unable to retrieve orders." });
    }
};

export const updateAdminOrder = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        await ensureOrderTables();

        const orderId = String(req.params.id || "");
        const {
            status,
            carrier,
            trackingNumber,
        } = req.body || {};

        const allowedStatuses = [
            "pending_payment",
            "paid",
            "processing",
            "shipped",
            "delivered",
            "cancelled",
            "refunded",
        ];

        if (status !== undefined && !allowedStatuses.includes(status)) {
            res.status(400).json({ message: "Invalid order status." });
            return;
        }

        const result = await pool.query(
            `
            UPDATE orders
            SET
                status = COALESCE($1, status),
                carrier = COALESCE($2, carrier),
                tracking_number = COALESCE($3, tracking_number),
                updated_at = NOW()
            WHERE id = $4
            RETURNING *
            `,
            [
                status ?? null,
                carrier?.trim() || null,
                trackingNumber?.trim() || null,
                orderId,
            ],
        );

        if (!result.rows[0]) {
            res.status(404).json({ message: "Order not found." });
            return;
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Update admin order error:", error);
        res.status(500).json({ message: "Unable to update order." });
    }
};

export const deleteAdminOrder = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        await ensureOrderTables();

        const orderId = String(req.params.id || "");
        const result = await pool.query(
            `
            DELETE FROM orders
            WHERE id = $1
              AND status = 'cancelled'
              AND payment_status <> 'paid'
            RETURNING id, order_code
            `,
            [orderId],
        );

        if (!result.rows[0]) {
            const orderResult = await pool.query(
                `SELECT status, payment_status FROM orders WHERE id = $1`,
                [orderId],
            );

            if (!orderResult.rows[0]) {
                res.status(404).json({ message: "Order not found." });
                return;
            }

            if (orderResult.rows[0].payment_status === "paid") {
                res.status(409).json({ message: "Paid orders cannot be deleted. Use refund or cancellation instead." });
                return;
            }

            res.status(409).json({ message: "Only cancelled unpaid orders can be deleted." });
            return;
        }

        res.json({
            deleted: true,
            orderCode: result.rows[0].order_code,
        });
    } catch (error) {
        console.error("Delete admin order error:", error);
        res.status(500).json({ message: "Unable to delete order." });
    }
};
