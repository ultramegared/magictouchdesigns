import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";
import { pool } from "../config/database";
import { ensureOrderTables } from "../services/order.service";

export const getMyOrders = async (
    req: AuthenticatedRequest,
    res: Response,
): Promise<void> => {
    try {
        if (!req.user?.userId) {
            res.status(401).json({
                status: "error",
                message: "Authentication required.",
            });
            return;
        }

        await ensureOrderTables();

        const userResult = await pool.query<{ email: string; is_active: boolean }>(
            `SELECT email, is_active FROM users WHERE id = $1 LIMIT 1`,
            [req.user.userId],
        );

        if (!userResult.rows[0]) {
            res.status(404).json({ status: "error", message: "User not found." });
            return;
        }

        if (!userResult.rows[0].is_active) {
            res.status(403).json({ status: "error", message: "This account is inactive." });
            return;
        }

        const ordersResult = await pool.query(
            `SELECT
                o.id,
                o.order_code,
                o.customer_first_name,
                o.customer_last_name,
                o.customer_email,
                o.shipping_address,
                o.subtotal,
                o.shipping,
                o.tax,
                o.total,
                o.currency,
                o.payment_status,
                o.status,
                o.carrier,
                o.tracking_number,
                o.created_at,
                o.updated_at,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', oi.id,
                            'product_id', oi.product_id,
                            'product_name', oi.product_name,
                            'image_url', oi.image_url,
                            'unit_price', oi.unit_price,
                            'quantity', oi.quantity,
                            'variant', oi.variant
                        ) ORDER BY oi.id ASC
                    ) FILTER (WHERE oi.id IS NOT NULL),
                    '[]'::json
                ) AS items
             FROM orders o
             LEFT JOIN order_items oi ON oi.order_id = o.id
             WHERE LOWER(o.customer_email) = LOWER($1)
             GROUP BY o.id
             ORDER BY o.created_at DESC`,
            [userResult.rows[0].email.trim()],
        );

        res.status(200).json({
            status: "ok",
            orders: ordersResult.rows,
        });
    } catch (error) {
        console.error("Get my orders error:", error);
        res.status(500).json({
            status: "error",
            message: "Unable to retrieve your orders.",
        });
    }
};
