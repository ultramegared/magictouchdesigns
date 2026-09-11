import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";
import { pool } from "../config/database";
import { ensureOrderTables } from "../services/order.service";

export const listMyOrders = async (
    req: AuthenticatedRequest,
    res: Response,
): Promise<void> => {
    try {
        if (!req.user?.userId) {
            res.status(401).json({ message: "Authentication required." });
            return;
        }

        await ensureOrderTables();

        const result = await pool.query(`
            SELECT
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
                o.payment_provider,
                o.payment_method,
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
            INNER JOIN users u
                ON LOWER(u.email) = LOWER(o.customer_email)
            LEFT JOIN order_items oi
                ON oi.order_id = o.id
            WHERE u.id = $1
            GROUP BY o.id
            ORDER BY o.created_at DESC
            LIMIT 20
        `, [req.user.userId]);

        res.json({ status: "ok", orders: result.rows });
    } catch (error) {
        console.error("List customer orders error:", error);
        res.status(500).json({ message: "Unable to retrieve your purchases." });
    }
};
