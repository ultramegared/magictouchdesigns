import type { Request, Response } from "express";
import { pool } from "../config/database";
import { ensureOrderTables } from "../services/order.service";

const validDate = (value: unknown): string | null => {
    const text = typeof value === "string" ? value.trim() : "";
    return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
};

export const getAdminSales = async (req: Request, res: Response): Promise<void> => {
    try {
        await ensureOrderTables();
        const today = new Date().toISOString().slice(0, 10);
        const end = validDate(req.query.end) || today;
        const start = validDate(req.query.start) || (() => { const d = new Date(`${end}T00:00:00Z`); d.setUTCDate(d.getUTCDate() - 29); return d.toISOString().slice(0, 10); })();
        const values = [start, end];
        const range = "o.created_at >= $1::date AND o.created_at < ($2::date + INTERVAL '1 day')";
        const [orders, daily, products, payments] = await Promise.all([
            pool.query(`SELECT o.id,o.order_code,o.customer_first_name,o.customer_last_name,o.customer_email,o.subtotal,o.shipping,o.tax,o.total,o.currency,o.payment_provider,o.payment_method,o.payment_status,o.status,o.created_at,COALESCE(json_agg(json_build_object('order_id',oi.order_id,'product_id',oi.product_id,'product_name',oi.product_name,'quantity',oi.quantity,'unit_price',oi.unit_price)) FILTER (WHERE oi.id IS NOT NULL),'[]'::json) AS items FROM orders o LEFT JOIN order_items oi ON oi.order_id=o.id WHERE ${range} GROUP BY o.id ORDER BY o.created_at DESC`, values),
            pool.query(`SELECT DATE(o.created_at AT TIME ZONE 'UTC') AS date,COUNT(*) FILTER (WHERE o.payment_status='paid')::int AS orders,COALESCE(SUM(o.subtotal) FILTER (WHERE o.payment_status='paid'),0)::numeric AS revenue FROM orders o WHERE ${range} GROUP BY 1 ORDER BY 1`, values),
            pool.query(`SELECT oi.product_id,oi.product_name,SUM(oi.quantity)::int AS units,COALESCE(SUM(oi.unit_price*oi.quantity),0)::numeric AS revenue FROM order_items oi JOIN orders o ON o.id=oi.order_id WHERE ${range} AND o.payment_status='paid' GROUP BY oi.product_id,oi.product_name ORDER BY revenue DESC,units DESC LIMIT 10`, values),
            pool.query(`SELECT COALESCE(o.payment_provider,'Other') AS provider,COUNT(*)::int AS orders,COALESCE(SUM(o.total),0)::numeric AS revenue FROM orders o WHERE ${range} AND o.payment_status='paid' GROUP BY 1 ORDER BY revenue DESC`, values),
        ]);
        res.json({ start, end, orders: orders.rows, daily: daily.rows, products: products.rows, payments: payments.rows });
    } catch (error) {
        console.error("Admin sales error:", error);
        res.status(500).json({ message: "Unable to retrieve sales." });
    }
};
