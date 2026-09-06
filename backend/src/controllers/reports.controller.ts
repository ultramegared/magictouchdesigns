import type { Request, Response } from "express";
import { pool } from "../config/database";
import { ensureOrderTables } from "../services/order.service";

const parseDate = (value: unknown, fallback: string) => {
    const text = typeof value === "string" ? value.trim() : "";
    return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : fallback;
};

export const getAdminReports = async (req: Request, res: Response): Promise<void> => {
    try {
        await ensureOrderTables();
        const now = new Date();
        const end = parseDate(req.query.end, now.toISOString().slice(0, 10));
        const startDate = new Date(`${end}T00:00:00Z`);
        startDate.setUTCDate(startDate.getUTCDate() - 29);
        const start = parseDate(req.query.start, startDate.toISOString().slice(0, 10));

        const summary = await pool.query(`
            SELECT
                COUNT(*)::int AS orders,
                COUNT(*) FILTER (WHERE payment_status = 'paid')::int AS paid_orders,
                COALESCE(SUM(total) FILTER (WHERE payment_status = 'paid'), 0)::numeric AS gross_sales,
                COALESCE(SUM(subtotal) FILTER (WHERE payment_status = 'paid'), 0)::numeric AS product_sales,
                COALESCE(SUM(shipping) FILTER (WHERE payment_status = 'paid'), 0)::numeric AS shipping_collected,
                COALESCE(SUM(tax) FILTER (WHERE payment_status = 'paid'), 0)::numeric AS tax_collected,
                COALESCE(AVG(total) FILTER (WHERE payment_status = 'paid'), 0)::numeric AS average_order_value
            FROM orders
            WHERE created_at >= $1::date
              AND created_at < ($2::date + INTERVAL '1 day')
        `, [start, end]);

        const daily = await pool.query(`
            SELECT
                DATE(created_at AT TIME ZONE 'UTC') AS date,
                COUNT(*)::int AS orders,
                COALESCE(SUM(total) FILTER (WHERE payment_status = 'paid'), 0)::numeric AS sales
            FROM orders
            WHERE created_at >= $1::date
              AND created_at < ($2::date + INTERVAL '1 day')
            GROUP BY 1
            ORDER BY 1 ASC
        `, [start, end]);

        const payments = await pool.query(`
            SELECT
                COALESCE(payment_provider, 'unknown') AS provider,
                COALESCE(payment_method, 'unknown') AS method,
                COUNT(*)::int AS orders,
                COALESCE(SUM(total) FILTER (WHERE payment_status = 'paid'), 0)::numeric AS sales
            FROM orders
            WHERE created_at >= $1::date
              AND created_at < ($2::date + INTERVAL '1 day')
            GROUP BY 1, 2
            ORDER BY sales DESC
        `, [start, end]);

        const products = await pool.query(`
            SELECT
                oi.product_id,
                oi.product_name,
                SUM(oi.quantity)::int AS quantity,
                COALESCE(SUM(oi.unit_price * oi.quantity), 0)::numeric AS sales
            FROM order_items oi
            INNER JOIN orders o ON o.id = oi.order_id
            WHERE o.created_at >= $1::date
              AND o.created_at < ($2::date + INTERVAL '1 day')
              AND o.payment_status = 'paid'
            GROUP BY oi.product_id, oi.product_name
            ORDER BY quantity DESC, sales DESC
            LIMIT 20
        `, [start, end]);

        res.json({
            start,
            end,
            summary: summary.rows[0],
            daily: daily.rows,
            payments: payments.rows,
            products: products.rows,
        });
    } catch (error) {
        console.error("Admin reports error:", error);
        res.status(500).json({ message: "Unable to retrieve reports." });
    }
};
