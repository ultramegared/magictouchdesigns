import type { Request, Response } from "express";
import { pool } from "../config/database";
import { ensureOrderTables } from "../services/order.service";
import { getSettings } from "../services/settings.service";

const parseDate = (value: unknown, fallback: string) => {
    const text = typeof value === "string" ? value.trim() : "";
    return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : fallback;
};

const dateDiffDays = (start: string, end: string) => {
    const from = new Date(`${start}T00:00:00Z`).getTime();
    const to = new Date(`${end}T00:00:00Z`).getTime();
    return Math.floor((to - from) / 86400000);
};

export const getAdminReports = async (req: Request, res: Response): Promise<void> => {
    try {
        await ensureOrderTables();

        const today = new Date().toISOString().slice(0, 10);
        const defaultStartDate = new Date(`${today}T00:00:00Z`);
        defaultStartDate.setUTCDate(defaultStartDate.getUTCDate() - 29);

        const end = parseDate(req.query.end, today);
        let start = parseDate(req.query.start, defaultStartDate.toISOString().slice(0, 10));
        if (dateDiffDays(start, end) < 0) start = end;

        const values = [start, end];
        const rangeWhere = `created_at >= $1::date AND created_at < ($2::date + INTERVAL '1 day')`;
        const paidRangeWhere = `${rangeWhere} AND payment_status = 'paid'`;

        const [summary, daily, payments, products, monthly, leads, recentLeads, customers, transactions, settings] = await Promise.all([
            pool.query(`
                SELECT COUNT(*)::int AS orders,
                    COUNT(*) FILTER (WHERE payment_status = 'paid')::int AS paid_orders,
                    COUNT(*) FILTER (WHERE payment_status <> 'paid')::int AS unpaid_orders,
                    COALESCE(SUM(total) FILTER (WHERE payment_status = 'paid'), 0)::numeric AS gross_sales,
                    COALESCE(SUM(subtotal) FILTER (WHERE payment_status = 'paid'), 0)::numeric AS product_sales,
                    COALESCE(SUM(shipping) FILTER (WHERE payment_status = 'paid'), 0)::numeric AS shipping_collected,
                    COALESCE(SUM(tax) FILTER (WHERE payment_status = 'paid'), 0)::numeric AS tax_collected,
                    COALESCE(AVG(total) FILTER (WHERE payment_status = 'paid'), 0)::numeric AS average_order_value,
                    COUNT(DISTINCT customer_email) FILTER (WHERE payment_status = 'paid')::int AS unique_customers
                FROM orders WHERE ${rangeWhere}
            `, values),
            pool.query(`
                SELECT DATE(created_at AT TIME ZONE 'UTC') AS date,
                    COUNT(*) FILTER (WHERE payment_status = 'paid')::int AS orders,
                    COALESCE(SUM(total) FILTER (WHERE payment_status = 'paid'), 0)::numeric AS sales,
                    COALESCE(SUM(subtotal) FILTER (WHERE payment_status = 'paid'), 0)::numeric AS product_sales,
                    COALESCE(SUM(shipping) FILTER (WHERE payment_status = 'paid'), 0)::numeric AS shipping,
                    COALESCE(SUM(tax) FILTER (WHERE payment_status = 'paid'), 0)::numeric AS tax
                FROM orders WHERE ${rangeWhere} GROUP BY 1 ORDER BY 1 ASC
            `, values),
            pool.query(`
                SELECT COALESCE(payment_provider, 'unknown') AS provider,
                    COALESCE(payment_method, 'unknown') AS method,
                    COUNT(*) FILTER (WHERE payment_status = 'paid')::int AS orders,
                    COALESCE(SUM(total) FILTER (WHERE payment_status = 'paid'), 0)::numeric AS sales
                FROM orders WHERE ${rangeWhere}
                GROUP BY 1, 2 HAVING COUNT(*) FILTER (WHERE payment_status = 'paid') > 0 ORDER BY sales DESC
            `, values),
            pool.query(`
                SELECT oi.product_id, oi.product_name, SUM(oi.quantity)::int AS quantity,
                    COALESCE(SUM(oi.unit_price * oi.quantity), 0)::numeric AS sales
                FROM order_items oi INNER JOIN orders o ON o.id = oi.order_id
                WHERE o.created_at >= $1::date AND o.created_at < ($2::date + INTERVAL '1 day') AND o.payment_status = 'paid'
                GROUP BY oi.product_id, oi.product_name ORDER BY sales DESC, quantity DESC LIMIT 20
            `, values),
            pool.query(`
                SELECT TO_CHAR(DATE_TRUNC('month', created_at AT TIME ZONE 'UTC'), 'YYYY-MM') AS month,
                    COUNT(*) FILTER (WHERE payment_status = 'paid')::int AS orders,
                    COALESCE(SUM(total) FILTER (WHERE payment_status = 'paid'), 0)::numeric AS sales,
                    COALESCE(SUM(tax) FILTER (WHERE payment_status = 'paid'), 0)::numeric AS tax
                FROM orders WHERE ${rangeWhere} GROUP BY 1 ORDER BY 1 ASC
            `, values),
            pool.query(`
                SELECT COUNT(*)::int AS total,
                    COUNT(*) FILTER (WHERE is_active = TRUE)::int AS active,
                    COUNT(*) FILTER (WHERE is_active = FALSE)::int AS inactive
                FROM subscribers WHERE created_at >= $1::date AND created_at < ($2::date + INTERVAL '1 day')
            `, values),
            pool.query(`
                SELECT id, email, is_active, language, created_at FROM subscribers
                WHERE created_at >= $1::date AND created_at < ($2::date + INTERVAL '1 day')
                ORDER BY created_at DESC LIMIT 12
            `, values),
            pool.query(`
                WITH paid_customers AS (
                    SELECT LOWER(customer_email) AS email, MIN(created_at) AS first_order_at, COUNT(*)::int AS lifetime_orders
                    FROM orders WHERE payment_status = 'paid' GROUP BY LOWER(customer_email)
                )
                SELECT COUNT(*)::int AS customers,
                    COUNT(*) FILTER (WHERE first_order_at >= $1::date AND first_order_at < ($2::date + INTERVAL '1 day'))::int AS new_customers,
                    COUNT(*) FILTER (WHERE first_order_at < $1::date)::int AS returning_customers,
                    COALESCE(SUM(lifetime_orders) FILTER (WHERE first_order_at >= $1::date AND first_order_at < ($2::date + INTERVAL '1 day')), 0)::int AS new_customer_orders
                FROM paid_customers
                WHERE email IN (SELECT DISTINCT LOWER(customer_email) FROM orders WHERE ${paidRangeWhere})
            `, values),
            pool.query(`
                SELECT o.id, o.order_code, o.created_at, o.customer_first_name, o.customer_last_name, o.customer_email,
                    o.subtotal, o.shipping, o.tax, o.total, o.currency, o.payment_provider, o.payment_method,
                    o.payment_status, o.status, COALESCE(SUM(oi.quantity), 0)::int AS item_count
                FROM orders o LEFT JOIN order_items oi ON oi.order_id = o.id
                WHERE o.created_at >= $1::date AND o.created_at < ($2::date + INTERVAL '1 day')
                GROUP BY o.id ORDER BY o.created_at DESC
            `, values),
            getSettings(),
        ]);

        res.json({
            start,
            end,
            generated_at: new Date().toISOString(),
            timezone: "UTC",
            currency: "USD",
            company: {
                name: settings.websiteName || settings.config.websiteName.en || "Magic Touch Designs",
                slogan: settings.slogan || settings.config.slogan.en || "",
                phone: settings.businessPhone || settings.config.businessPhone || "",
                address: settings.businessAddress || settings.config.businessAddress || "",
                email: settings.supportEmail || "",
                logo_url: settings.logoUrl || null,
            },
            summary: summary.rows[0],
            daily: daily.rows,
            monthly: monthly.rows,
            payments: payments.rows,
            products: products.rows,
            leads: { ...leads.rows[0], note: "Leads are newsletter subscribers recorded in the database. Lead source and lead-to-order attribution are not currently tracked." },
            recent_leads: recentLeads.rows,
            customers: customers.rows[0],
            transactions: transactions.rows,
            transaction_count: transactions.rows.length,
        });
    } catch (error) {
        console.error("Admin reports error:", error);
        res.status(500).json({ message: "Unable to retrieve reports." });
    }
};