import { flushSync } from "react-dom";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { CalendarDays, CheckCircle2, CreditCard, Download, FileBarChart, FileText, Package, RefreshCw, TrendingUp, UserPlus, Users } from "lucide-react";
import AdminSidebar from "./AdminSidebar";
import { apiRequest } from "../../services/api";
import "./AdminReports.css";

type Summary = { orders: number; paid_orders: number; unpaid_orders: number; gross_sales: string; product_sales: string; shipping_collected: string; tax_collected: string; average_order_value: string; unique_customers: number };
type Company = { name: string; slogan: string; phone: string; address: string; email: string; logo_url: string | null };
type Report = {
    start: string; end: string; generated_at: string; timezone: string; currency: string; company: Company; summary: Summary;
    daily: { date: string; orders: number; sales: string; product_sales: string; shipping: string; tax: string }[];
    monthly: { month: string; orders: number; sales: string; tax: string }[];
    payments: { provider: string; method: string; orders: number; sales: string }[];
    products: { product_id: string; product_name: string; quantity: number; sales: string }[];
    leads: { total: number; active: number; inactive: number; note: string };
    recent_leads: { id: string; email: string; is_active: boolean; language: string; created_at: string }[];
    customers: { customers: number; new_customers: number; returning_customers: number; new_customer_orders: number };
    transactions: { id: string; order_code: string; created_at: string; customer_first_name: string; customer_last_name: string; customer_email: string; subtotal: string; shipping: string; tax: string; total: string; currency: string; payment_provider: string | null; payment_method: string | null; payment_status: string; status: string; item_count: number }[];
    transaction_count: number;
};

const money = (value: string | number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value || 0));
const compactMoney = (value: string | number) => { const number = Number(value || 0); if (number >= 1000000) return `$${(number / 1000000).toFixed(1)}M`; if (number >= 1000) return `$${(number / 1000).toFixed(1)}K`; return money(number); };
const validDateInput = (value: unknown) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
const formatDate = (value: string) => { const date = new Date(`${value.slice(0, 10)}T00:00:00Z`); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(date); };
const formatDateTime = (value: string) => { const date = new Date(value); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(date); };
const formatMonth = (value: string) => { const [year, month] = value.split("-").map(Number); return new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, 1))); };
const csvEscape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;

function AdminReports() {
    const [start, setStart] = useState("");
    const [end, setEnd] = useState("");
    const [preset, setPreset] = useState("30d");
    const [report, setReport] = useState<Report | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeSection, setActiveSection] = useState("overview");
    const [printMode, setPrintMode] = useState(false);

    const load = async (nextStart = start, nextEnd = end) => {
        try {
            setLoading(true);
            setError("");
            const safeStart = validDateInput(nextStart);
            const safeEnd = validDateInput(nextEnd);
            const params = new URLSearchParams();
            if (safeStart) params.set("start", safeStart);
            if (safeEnd) params.set("end", safeEnd);
            const result = await apiRequest<Report>(`/api/admin/reports?${params.toString()}`);
            setReport(result);
            setStart(validDateInput(result.start));
            setEnd(validDateInput(result.end));
        } catch (e) {
            setError(e instanceof Error ? e.message : "Unable to load reports.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { void load(); }, []);

    useEffect(() => {
        if (!printMode) return;
        const handleAfterPrint = () => setPrintMode(false);
        window.addEventListener("afterprint", handleAfterPrint);
        const timer = window.setTimeout(() => window.print(), 100);
        return () => {
            window.clearTimeout(timer);
            window.removeEventListener("afterprint", handleAfterPrint);
        };
    }, [printMode]);

    const applyPreset = (value: string) => {
        if (!report) return;
        const endText = validDateInput(report.end);
        const endDate = new Date(`${endText}T00:00:00Z`);
        if (Number.isNaN(endDate.getTime())) return;
        const nextStart = new Date(endDate);
        if (value === "today") nextStart.setUTCDate(endDate.getUTCDate());
        else if (value === "7d") nextStart.setUTCDate(endDate.getUTCDate() - 6);
        else if (value === "30d") nextStart.setUTCDate(endDate.getUTCDate() - 29);
        else if (value === "90d") nextStart.setUTCDate(endDate.getUTCDate() - 89);
        else if (value === "ytd") nextStart.setUTCMonth(0, 1);
        else return;
        const nextStartText = nextStart.toISOString().slice(0, 10);
        setPreset(value); setStart(nextStartText); setEnd(endText); void load(nextStartText, endText);
    };

    const chartPoints = useMemo(() => {
        if (!report) return [];
        if (report.daily.length <= 31) return report.daily;
        const bucket = new Map<string, { date: string; orders: number; sales: number }>();
        report.daily.forEach((item) => {
            const key = item.date.slice(0, 7);
            const current = bucket.get(key) || { date: `${key}-01`, orders: 0, sales: 0 };
            current.orders += item.orders;
            current.sales += Number(item.sales || 0);
            bucket.set(key, current);
        });
        return Array.from(bucket.values()).map((item) => ({ ...item, sales: item.sales.toFixed(2) }));
    }, [report]);

    const chartMax = Math.max(...chartPoints.map((item) => Number(item.sales || 0)), 1);
    const paidRate = report ? (report.summary.orders ? (report.summary.paid_orders / report.summary.orders) * 100 : 0) : 0;

    const reportRows = (r: Report) => [
        ["COMPANY", r.company.name], ["SLOGAN", r.company.slogan], ["PHONE", r.company.phone], ["ADDRESS", r.company.address], ["EMAIL", r.company.email],
        ["REPORT PERIOD", `${r.start} through ${r.end}`], ["GENERATED", formatDateTime(r.generated_at)], ["TIMEZONE", r.timezone], ["CURRENCY", r.currency], [],
        ["SUMMARY"], ["Total Sales", r.summary.gross_sales], ["Product Sales", r.summary.product_sales], ["Shipping Collected", r.summary.shipping_collected], ["Tax Collected", r.summary.tax_collected], ["Total Orders", r.summary.orders], ["Paid Orders", r.summary.paid_orders], ["Unpaid Orders", r.summary.unpaid_orders], ["Average Order Value", r.summary.average_order_value], ["Unique Customers", r.summary.unique_customers], [],
        ["DAILY SALES"], ["Date", "Orders", "Sales", "Product Sales", "Shipping", "Tax"], ...r.daily.map(x => [x.date, x.orders, x.sales, x.product_sales, x.shipping, x.tax]), [],
        ["SALES BY MONTH"], ["Month", "Paid Orders", "Sales", "Tax"], ...r.monthly.map(x => [x.month, x.orders, x.sales, x.tax]), [],
        ["PAYMENT METHODS"], ["Provider", "Method", "Orders", "Sales"], ...r.payments.map(x => [x.provider, x.method, x.orders, x.sales]), [],
        ["PRODUCTS"], ["Product", "Units Sold", "Sales"], ...r.products.map(x => [x.product_name, x.quantity, x.sales]), [],
        ["LEADS"], ["Total", "Active", "Inactive"], [r.leads.total, r.leads.active, r.leads.inactive], ["Note", r.leads.note], [],
        ["RECENT LEADS"], ["Email", "Language", "Status", "Registered"], ...r.recent_leads.map(x => [x.email, x.language.toUpperCase(), x.is_active ? "Active" : "Inactive", x.created_at]), [],
        ["CUSTOMERS"], ["Customers", "New Customers", "Returning Customers", "New Customer Orders"], [r.customers.customers, r.customers.new_customers, r.customers.returning_customers, r.customers.new_customer_orders], [],
        ["ORDERS & PAYMENTS"], ["Order", "Date", "Customer", "Email", "Items", "Subtotal", "Shipping", "Tax", "Total", "Provider", "Method", "Payment Status", "Order Status"],
        ...r.transactions.map(x => [x.order_code, x.created_at, `${x.customer_first_name} ${x.customer_last_name}`.trim(), x.customer_email, x.item_count, x.subtotal, x.shipping, x.tax, x.total, x.payment_provider || "", x.payment_method || "", x.payment_status, x.status]),
    ];

    const downloadCsv = () => {
        if (!report) return;
        const csv = reportRows(report).map(row => row.map(csvEscape).join(",")).join("\r\n");
        const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `magic-touch-designs-report-${report.start}-to-${report.end}.csv`;
        document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
    };

    const exportPdf = () => {
        if (!report) return;
        setError("");
        flushSync(() => setPrintMode(true));
    };

    const sections = [{ id: "overview", label: "Overview" }, { id: "sales", label: "Sales" }, { id: "leads", label: "Leads" }, { id: "orders", label: "Orders" }, { id: "customers", label: "Customers" }, { id: "products", label: "Products" }, { id: "taxes", label: "Taxes" }];

    return <div className="admin-layout">
        <style>{`@media print{body{background:#fff!important}.admin-layout>*,.admin-reports{display:none!important}.admin-reports-print{display:block!important}.admin-reports-print *{visibility:visible!important}}@media screen{.admin-reports-print{display:none!important}}`}</style>
        <AdminSidebar username="Administrator" />
        <main className="admin-reports">
            <header className="admin-reports__hero"><div><div className="admin-reports__eyebrow"><FileBarChart size={14} /> BUSINESS INTELLIGENCE</div><h1>Reports</h1><p>Financial, sales, customer and lead intelligence from your real store data.</p></div><div className="admin-reports__hero-actions"><button className="admin-reports__secondary" onClick={() => void load()} disabled={loading}><RefreshCw size={16} className={loading ? "admin-reports__spin" : ""} /> Refresh</button><button className="admin-reports__secondary" onClick={exportPdf} disabled={!report || loading}><FileText size={16} /> Export PDF</button><button className="admin-reports__primary" onClick={downloadCsv} disabled={!report || loading}><Download size={16} /> Export CSV</button></div></header>
            {error && <div className="admin-reports__error">{error}</div>}
            <section className="admin-reports__toolbar"><div className="admin-reports__date-icon"><CalendarDays size={18} /></div><div className="admin-reports__preset-group">{[["today", "Today"], ["7d", "7 days"], ["30d", "30 days"], ["90d", "90 days"], ["ytd", "Year to date"]].map(([value, label]) => <button key={value} className={preset === value ? "active" : ""} onClick={() => applyPreset(value)}>{label}</button>)}</div><div className="admin-reports__date-fields"><label>From<input type="date" value={start} onChange={(e) => { setPreset("custom"); setStart(validDateInput(e.target.value)); }} /></label><span>—</span><label>To<input type="date" value={end} onChange={(e) => { setPreset("custom"); setEnd(validDateInput(e.target.value)); }} /></label><button className="admin-reports__apply" onClick={() => void load()}>Apply</button></div></section>
            <nav className="admin-reports__tabs" aria-label="Report sections">{sections.map((section) => <button key={section.id} className={activeSection === section.id ? "active" : ""} onClick={() => setActiveSection(section.id)}>{section.label}</button>)}</nav>
            {loading ? <div className="admin-reports__loading"><RefreshCw size={28} className="admin-reports__spin" /><strong>Building report</strong><span>Calculating real store data…</span></div> : report ? <>
                <section className="admin-reports__period-line"><div><strong>{formatDate(report.start)}</strong> <span>through</span> <strong>{formatDate(report.end)}</strong></div><span>Generated {formatDateTime(report.generated_at)}</span></section>
                {activeSection === "overview" && <OverviewSection report={report} chartPoints={chartPoints} chartMax={chartMax} paidRate={paidRate} />}
                {activeSection === "sales" && <SalesSection report={report} />}
                {activeSection === "leads" && <LeadsSection report={report} />}
                {activeSection === "orders" && <OrdersSection report={report} />}
                {activeSection === "customers" && <CustomersSection report={report} />}
                {activeSection === "products" && <ProductsSection report={report} />}
                {activeSection === "taxes" && <TaxesSection report={report} />}
            </> : null}
        </main>
        {report && <PrintableReport report={report} />}
    </div>;
}

function OverviewSection({ report, chartPoints, chartMax, paidRate }: { report: Report; chartPoints: any[]; chartMax: number; paidRate: number }) { return <><section className="admin-reports__cards"><article className="is-primary"><span>Total Sales</span><strong>{money(report.summary.gross_sales)}</strong><small><TrendingUp size={13} /> {report.summary.paid_orders} paid orders</small></article><article><span>Total Orders</span><strong>{report.summary.orders}</strong><small><CheckCircle2 size={13} /> {paidRate.toFixed(0)}% paid</small></article><article><span>Customers</span><strong>{report.summary.unique_customers}</strong><small><Users size={13} /> {report.customers.new_customers} new</small></article><article><span>Leads</span><strong>{report.leads.total}</strong><small><UserPlus size={13} /> {report.leads.active} active</small></article><article><span>Tax Collected</span><strong>{money(report.summary.tax_collected)}</strong><small><FileText size={13} /> From recorded orders</small></article></section><section className="admin-reports__grid admin-reports__grid--main"><div className="admin-reports__panel admin-reports__panel--chart"><div className="admin-reports__panel-head"><div><span>REVENUE PERFORMANCE</span><h2>Sales Overview</h2></div><strong>{compactMoney(report.summary.gross_sales)}</strong></div><div className="admin-reports__chart"><div className="admin-reports__chart-y"><span>{compactMoney(chartMax)}</span><span>{compactMoney(chartMax / 2)}</span><span>$0</span></div><div className="admin-reports__bars">{chartPoints.map((item) => <div className="admin-reports__bar-wrap" key={item.date} title={`${item.date}: ${money(item.sales)}`}><div className="admin-reports__bar" style={{ height: `${Math.max(3, (Number(item.sales) / chartMax) * 100)}%` }} /></div>)}</div></div><div className="admin-reports__chart-x">{chartPoints.slice(0, 6).map((item) => <span key={item.date}>{item.date.slice(5)}</span>)}</div></div><div className="admin-reports__panel"><div className="admin-reports__panel-head"><div><span>PAYMENT MIX</span><h2>Payment Methods</h2></div><CreditCard size={20} /></div><div className="admin-reports__payment-list">{report.payments.map((item, index) => { const percent = Number(report.summary.gross_sales) ? (Number(item.sales) / Number(report.summary.gross_sales)) * 100 : 0; return <div className="admin-reports__payment" key={`${item.provider}-${item.method}-${index}`}><div><strong>{item.provider || "Unknown"}</strong><span>{item.method || "Unknown method"}</span></div><div><strong>{money(item.sales)}</strong><span>{percent.toFixed(1)}%</span></div></div>; })}{!report.payments.length && <div className="admin-reports__empty">No paid transactions in this period.</div>}</div></div></section><section className="admin-reports__grid admin-reports__grid--three"><div className="admin-reports__panel"><div className="admin-reports__panel-head"><div><span>PRODUCT PERFORMANCE</span><h2>Top Products</h2></div><Package size={20} /></div><div className="admin-reports__rank-list">{report.products.slice(0, 6).map((item, index) => <div key={item.product_id} className="admin-reports__rank"><b>{String(index + 1).padStart(2, "0")}</b><div><strong>{item.product_name}</strong><span>{item.quantity} units</span></div><strong>{money(item.sales)}</strong></div>)}{!report.products.length && <div className="admin-reports__empty">No product sales recorded.</div>}</div></div><div className="admin-reports__panel"><div className="admin-reports__panel-head"><div><span>CUSTOMER BASE</span><h2>Customers</h2></div><Users size={20} /></div><div className="admin-reports__stat-stack"><div><span>Customers who purchased</span><strong>{report.customers.customers}</strong></div><div><span>New customers</span><strong>{report.customers.new_customers}</strong></div><div><span>Returning customers</span><strong>{report.customers.returning_customers}</strong></div></div></div><div className="admin-reports__panel"><div className="admin-reports__panel-head"><div><span>LEAD PIPELINE</span><h2>Leads</h2></div><UserPlus size={20} /></div><div className="admin-reports__stat-stack"><div><span>New subscribers</span><strong>{report.leads.total}</strong></div><div><span>Active</span><strong>{report.leads.active}</strong></div><div><span>Inactive</span><strong>{report.leads.inactive}</strong></div></div><p className="admin-reports__note">Newsletter subscribers are the lead dataset currently available. Source and conversion attribution are not yet recorded.</p></div></section></>; }
function SalesSection({ report }: { report: Report }) { return <div className="admin-reports__section-stack"><section className="admin-reports__cards"><article className="is-primary"><span>Product Sales</span><strong>{money(report.summary.product_sales)}</strong></article><article><span>Shipping Collected</span><strong>{money(report.summary.shipping_collected)}</strong></article><article><span>Tax Collected</span><strong>{money(report.summary.tax_collected)}</strong></article><article><span>Average Order</span><strong>{money(report.summary.average_order_value)}</strong></article></section><section className="admin-reports__panel"><div className="admin-reports__panel-head"><div><span>PERIOD BREAKDOWN</span><h2>Sales by Month</h2></div></div><ReportTable headers={["Month", "Paid Orders", "Product Sales", "Tax", "Total Sales"]}>{report.monthly.map((item) => <tr key={item.month}><td>{formatMonth(item.month)}</td><td>{item.orders}</td><td>{money(report.daily.filter((day) => day.date.startsWith(item.month)).reduce((sum, day) => sum + Number(day.product_sales), 0))}</td><td>{money(item.tax)}</td><td className="numeric strong">{money(item.sales)}</td></tr>)}</ReportTable></section><section className="admin-reports__panel"><div className="admin-reports__panel-head"><div><span>DAILY LEDGER</span><h2>Daily Sales Detail</h2></div></div><ReportTable headers={["Date", "Paid Orders", "Product Sales", "Shipping", "Tax", "Total"]}>{report.daily.map((item) => <tr key={item.date}><td>{formatDate(item.date)}</td><td>{item.orders}</td><td>{money(item.product_sales)}</td><td>{money(item.shipping)}</td><td>{money(item.tax)}</td><td className="numeric strong">{money(item.sales)}</td></tr>)}</ReportTable></section></div>; }
function LeadsSection({ report }: { report: Report }) { return <div className="admin-reports__section-stack"><section className="admin-reports__cards"><article className="is-primary"><span>Leads in Period</span><strong>{report.leads.total}</strong></article><article><span>Active</span><strong>{report.leads.active}</strong></article><article><span>Inactive</span><strong>{report.leads.inactive}</strong></article><article><span>Lead Attribution</span><strong className="text-small">Not tracked</strong></article></section><section className="admin-reports__panel"><div className="admin-reports__panel-head"><div><span>LEAD REGISTER</span><h2>Recent Leads</h2></div><UserPlus size={20} /></div><ReportTable headers={["Email", "Language", "Status", "Registered"]}>{report.recent_leads.map((lead) => <tr key={lead.id}><td className="strong">{lead.email}</td><td>{lead.language.toUpperCase()}</td><td><span className={`admin-reports__status ${lead.is_active ? "paid" : "inactive"}`}>{lead.is_active ? "Active" : "Inactive"}</span></td><td>{formatDate(lead.created_at)}</td></tr>)}</ReportTable><p className="admin-reports__note">This section reports newsletter subscribers as leads. The current database does not contain a lead source or a verified lead-to-order conversion field, so no conversion rate is fabricated.</p></section></div>; }
function OrdersSection({ report }: { report: Report }) { return <div className="admin-reports__section-stack"><section className="admin-reports__panel"><div className="admin-reports__panel-head"><div><span>TRANSACTION LEDGER</span><h2>Orders & Payments</h2></div><span>{report.transaction_count} records</span></div><ReportTable headers={["Order", "Date", "Customer", "Items", "Payment", "Status", "Total"]}>{report.transactions.map((order) => <tr key={order.id}><td className="strong">{order.order_code}</td><td>{formatDate(order.created_at)}</td><td><strong>{`${order.customer_first_name} ${order.customer_last_name}`.trim() || "—"}</strong><span className="table-sub">{order.customer_email}</span></td><td>{order.item_count}</td><td><span className={`admin-reports__status ${order.payment_status === "paid" ? "paid" : "pending"}`}>{order.payment_status}</span><span className="table-sub">{order.payment_provider || "—"} · {order.payment_method || "—"}</span></td><td>{order.status}</td><td className="numeric strong">{money(order.total)}</td></tr>)}</ReportTable>{!report.transactions.length && <div className="admin-reports__empty">No orders in this period.</div>}</section></div>; }
function CustomersSection({ report }: { report: Report }) { return <div className="admin-reports__section-stack"><section className="admin-reports__cards"><article className="is-primary"><span>Customers</span><strong>{report.customers.customers}</strong></article><article><span>New Customers</span><strong>{report.customers.new_customers}</strong></article><article><span>Returning Customers</span><strong>{report.customers.returning_customers}</strong></article><article><span>New Customer Orders</span><strong>{report.customers.new_customer_orders}</strong></article></section><section className="admin-reports__panel"><div className="admin-reports__customer-callout"><Users size={28} /><div><strong>Customer reporting is based on paid orders.</strong><span>New vs. returning is calculated against the customer's first recorded paid order in the database.</span></div></div></section></div>; }
function ProductsSection({ report }: { report: Report }) { return <div className="admin-reports__section-stack"><section className="admin-reports__panel"><div className="admin-reports__panel-head"><div><span>PRODUCT PERFORMANCE</span><h2>Product Sales Register</h2></div><Package size={20} /></div><ReportTable headers={["Product", "Units Sold", "Sales", "Share of Sales"]}>{report.products.map((item) => <tr key={item.product_id}><td className="strong">{item.product_name}</td><td>{item.quantity}</td><td className="numeric strong">{money(item.sales)}</td><td className="numeric">{Number(report.summary.product_sales) ? `${((Number(item.sales) / Number(report.summary.product_sales)) * 100).toFixed(1)}%` : "0.0%"}</td></tr>)}</ReportTable></section></div>; }
function TaxesSection({ report }: { report: Report }) { return <div className="admin-reports__section-stack"><section className="admin-reports__cards"><article className="is-primary"><span>Tax Collected</span><strong>{money(report.summary.tax_collected)}</strong></article><article><span>Taxable Product Sales</span><strong>{money(report.summary.product_sales)}</strong></article><article><span>Paid Transactions</span><strong>{report.summary.paid_orders}</strong></article><article><span>Recorded Tax Ratio*</span><strong>{Number(report.summary.product_sales) ? `${((Number(report.summary.tax_collected) / Number(report.summary.product_sales)) * 100).toFixed(2)}%` : "0.00%"}</strong></article></section><section className="admin-reports__panel"><div className="admin-reports__panel-head"><div><span>TAX REPORT</span><h2>Collected Tax by Month</h2></div><FileText size={20} /></div><ReportTable headers={["Month", "Product Sales", "Tax Collected", "Paid Orders"]}>{report.monthly.map((item) => { const taxable = report.daily.filter((day) => day.date.startsWith(item.month)).reduce((sum, day) => sum + Number(day.product_sales), 0); return <tr key={item.month}><td>{formatMonth(item.month)}</td><td>{money(taxable)}</td><td className="strong">{money(item.tax)}</td><td>{item.orders}</td></tr>; })}</ReportTable><p className="admin-reports__tax-warning">* This is a reporting ratio based on recorded order values, not a legal tax-rate determination. Taxes are reported only when stored on the order. This report does not determine deductions or replace a tax professional's filing judgment.</p></section></div>; }
function ReportTable({ headers, children }: { headers: string[]; children: ReactNode }) { return <div className="admin-reports__table-wrap"><table><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{children}</tbody></table></div>; }

function PrintableReport({ report }: { report: Report }) {
    const sectionRows = (headers: string[], values: (string | number)[][]) => <div className="admin-reports-print__table-wrap"><table><thead><tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr></thead><tbody>{values.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{String(cell ?? "")}</td>)}</tr>)}</tbody></table></div>;
    const orderRows = report.transactions.map((x) => [x.order_code, formatDate(x.created_at), `${x.customer_first_name} ${x.customer_last_name}`.trim() || "—", x.customer_email, x.item_count, money(x.subtotal), money(x.shipping), money(x.tax), money(x.total), x.payment_status, x.status]);
    const dailyRows = report.daily.map((x) => [formatDate(x.date), x.orders, money(x.product_sales), money(x.shipping), money(x.tax), money(x.sales)]);
    const monthlyRows = report.monthly.map((x) => [formatMonth(x.month), x.orders, money(x.sales), money(x.tax)]);
    const productRows = report.products.map((x) => [x.product_name, x.quantity, money(x.sales)]);
    const paymentRows = report.payments.map((x) => [x.provider, x.method, x.orders, money(x.sales)]);
    const leadRows = report.recent_leads.map((x) => [x.email, x.language.toUpperCase(), x.is_active ? "Active" : "Inactive", formatDate(x.created_at)]);
    return <section className="admin-reports-print">
        <style>{`@media print{.admin-reports-print{display:block!important;font-family:Arial,Helvetica,sans-serif;color:#171717;padding:28px 34px;font-size:9px}.admin-reports-print__header{display:flex;justify-content:space-between;gap:24px;border-bottom:2px solid #171717;padding-bottom:14px;margin-bottom:18px}.admin-reports-print__brand{display:flex;align-items:center;gap:12px}.admin-reports-print__logo{width:64px;height:64px;object-fit:contain;flex:none}.admin-reports-print__brand h1{font-size:22px;margin:0 0 3px}.admin-reports-print__brand p{margin:2px 0;color:#555}.admin-reports-print__meta{text-align:right;color:#555;line-height:1.5}.admin-reports-print__meta strong{color:#111}.admin-reports-print__title{font-size:17px;margin:0 0 4px}.admin-reports-print__subtitle{color:#666;margin:0 0 14px}.admin-reports-print__kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-bottom:16px}.admin-reports-print__kpi{border:1px solid #d8d8d8;padding:8px}.admin-reports-print__kpi span{display:block;color:#666;font-size:7px;text-transform:uppercase;letter-spacing:.08em}.admin-reports-print__kpi strong{display:block;font-size:13px;margin-top:3px}.admin-reports-print__section{margin:0 0 16px;break-inside:auto}.admin-reports-print__section h2{font-size:12px;margin:0 0 6px;border-bottom:1px solid #ddd;padding-bottom:4px}.admin-reports-print__table-wrap{overflow:visible}.admin-reports-print table{width:100%;border-collapse:collapse;margin:0}.admin-reports-print th{background:#eee;text-align:left;font-size:7px;text-transform:uppercase}.admin-reports-print th,.admin-reports-print td{border:1px solid #d5d5d5;padding:3px 4px;vertical-align:top}.admin-reports-print td{font-size:7.5px}.admin-reports-print__note{background:#f6f6f6;border-left:3px solid #888;padding:7px;color:#555}.admin-reports-print__footer{border-top:1px solid #ddd;padding-top:7px;color:#777;font-size:7px;margin-top:18px} }`}</style>
        <header className="admin-reports-print__header"><div className="admin-reports-print__brand">{report.company.logo_url && <img className="admin-reports-print__logo" src={report.company.logo_url} alt={report.company.name} />}<div><h1>{report.company.name}</h1><p>{report.company.slogan}</p><p>{[report.company.address, report.company.phone, report.company.email].filter(Boolean).join(" · ")}</p></div></div><div className="admin-reports-print__meta"><strong>BUSINESS REPORT</strong><br />Period: {formatDate(report.start)} — {formatDate(report.end)}<br />Generated: {formatDateTime(report.generated_at)}</div></header>
        <h1 className="admin-reports-print__title">Financial & Business Intelligence Report</h1><p className="admin-reports-print__subtitle">Prepared from recorded store data for the selected reporting period.</p>
        <div className="admin-reports-print__kpis"><div className="admin-reports-print__kpi"><span>Total Sales</span><strong>{money(report.summary.gross_sales)}</strong></div><div className="admin-reports-print__kpi"><span>Total Orders</span><strong>{report.summary.orders}</strong></div><div className="admin-reports-print__kpi"><span>Customers</span><strong>{report.summary.unique_customers}</strong></div><div className="admin-reports-print__kpi"><span>Tax Collected</span><strong>{money(report.summary.tax_collected)}</strong></div></div>
        <section className="admin-reports-print__section"><h2>Company & Report Information</h2>{sectionRows(["Field", "Value"], [["Company", report.company.name], ["Slogan", report.company.slogan], ["Phone", report.company.phone], ["Address", report.company.address], ["Email", report.company.email], ["Period", `${formatDate(report.start)} through ${formatDate(report.end)}`], ["Generated", formatDateTime(report.generated_at)], ["Timezone", report.timezone], ["Currency", report.currency]])}</section>
        <section className="admin-reports-print__section"><h2>Sales Summary</h2>{sectionRows(["Metric", "Value"], [["Product Sales", money(report.summary.product_sales)], ["Shipping Collected", money(report.summary.shipping_collected)], ["Tax Collected", money(report.summary.tax_collected)], ["Average Order Value", money(report.summary.average_order_value)], ["Paid Orders", report.summary.paid_orders], ["Unpaid Orders", report.summary.unpaid_orders]])}</section>
        <section className="admin-reports-print__section"><h2>Sales by Month</h2>{sectionRows(["Month", "Paid Orders", "Sales", "Tax"], monthlyRows)}</section>
        <section className="admin-reports-print__section"><h2>Daily Sales Detail</h2>{sectionRows(["Date", "Paid Orders", "Product Sales", "Shipping", "Tax", "Total"], dailyRows)}</section>
        <section className="admin-reports-print__section"><h2>Payment Methods</h2>{sectionRows(["Provider", "Method", "Orders", "Sales"], paymentRows)}</section>
        <section className="admin-reports-print__section"><h2>Products</h2>{sectionRows(["Product", "Units Sold", "Sales"], productRows)}</section>
        <section className="admin-reports-print__section"><h2>Customers & Leads</h2>{sectionRows(["Metric", "Value"], [["Customers who purchased", report.customers.customers], ["New customers", report.customers.new_customers], ["Returning customers", report.customers.returning_customers], ["New customer orders", report.customers.new_customer_orders], ["Leads / subscribers", report.leads.total], ["Active leads", report.leads.active], ["Inactive leads", report.leads.inactive]])}<p className="admin-reports-print__note">{report.leads.note}</p></section>
        <section className="admin-reports-print__section"><h2>Recent Leads</h2>{sectionRows(["Email", "Language", "Status", "Registered"], leadRows)}</section>
        <section className="admin-reports-print__section"><h2>Orders & Payments — Transaction Ledger</h2>{sectionRows(["Order", "Date", "Customer", "Email", "Items", "Subtotal", "Shipping", "Tax", "Total", "Payment", "Status"], orderRows)}</section>
        <section className="admin-reports-print__section"><h2>Tax Report</h2>{sectionRows(["Month", "Product Sales", "Tax Collected", "Paid Orders"], report.monthly.map((x) => [formatMonth(x.month), money(report.daily.filter((d) => d.date.startsWith(x.month)).reduce((s, d) => s + Number(d.product_sales), 0)), money(x.tax), x.orders]))}<p className="admin-reports-print__note">Recorded tax values only. This report does not determine legal tax rates, deductions, or replace a tax professional's filing judgment.</p></section>
        <footer className="admin-reports-print__footer">{report.company.name} · Business Report · Generated {formatDateTime(report.generated_at)} · Data timezone: {report.timezone}</footer>
    </section>;
}

export default AdminReports;
