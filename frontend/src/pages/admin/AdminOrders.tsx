import { useCallback, useEffect, useState } from "react";
import { Package, RefreshCw, Truck, CheckCircle2 } from "lucide-react";
import AdminSidebar from "./AdminSidebar";
import { apiRequest } from "../../services/api";
import "./AdminOrders.css";

type Order = {
    id: string;
    order_code: string;
    customer_name: string;
    customer_email: string;
    subtotal: number;
    shipping_amount: number;
    tax_amount: number;
    total_amount: number;
    payment_status: string;
    status: string;
    carrier?: string | null;
    tracking_number?: string | null;
    created_at: string;
    item_count: number;
};

const STATUSES = ["pending_payment", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"];
const CARRIERS = ["USPS", "UPS", "FedEx", "DHL"];

function money(value: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value || 0));
}

function AdminOrders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const loadOrders = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await apiRequest<Order[]>("/api/admin/orders");
            setOrders(Array.isArray(result) ? result : []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to load orders.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadOrders(); }, [loadOrders]);

    const updateOrder = async (order: Order, patch: Record<string, string>) => {
        try {
            setSaving(order.id);
            setError(null);
            await apiRequest(`/api/admin/orders/${order.id}`, {
                method: "PATCH",
                body: JSON.stringify(patch),
            });
            await loadOrders();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to update order.");
        } finally {
            setSaving(null);
        }
    };

    return (
        <div className="admin-page">
            <AdminSidebar />
            <main className="admin-orders">
                <header className="admin-orders__header">
                    <div>
                        <div className="admin-orders__eyebrow"><Package size={16} /> Orders</div>
                        <h1>Orders</h1>
                        <p>Review paid orders, fulfillment status, and shipment tracking.</p>
                    </div>
                    <button className="admin-orders__refresh" onClick={loadOrders} disabled={loading}>
                        <RefreshCw size={17} className={loading ? "spin" : ""} /> Refresh
                    </button>
                </header>

                {error && <div className="admin-orders__alert">{error}</div>}

                <section className="admin-orders__stats">
                    <div><span>Total orders</span><strong>{orders.length}</strong></div>
                    <div><span>Paid</span><strong>{orders.filter(o => o.payment_status === "paid").length}</strong></div>
                    <div><span>Shipped</span><strong>{orders.filter(o => o.status === "shipped" || o.status === "delivered").length}</strong></div>
                    <div><span>Revenue</span><strong>{money(orders.filter(o => o.payment_status === "paid").reduce((sum, o) => sum + Number(o.total_amount || 0), 0))}</strong></div>
                </section>

                <section className="admin-orders__card">
                    {loading ? <div className="admin-orders__empty">Loading orders...</div> : orders.length === 0 ? <div className="admin-orders__empty">No orders yet.</div> : (
                        <div className="admin-orders__table-wrap">
                            <table className="admin-orders__table">
                                <thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th><th>Shipping</th><th>Date</th></tr></thead>
                                <tbody>
                                    {orders.map(order => (
                                        <tr key={order.id}>
                                            <td><strong>{order.order_code}</strong><small>{order.item_count} item{order.item_count === 1 ? "" : "s"}</small></td>
                                            <td><strong>{order.customer_name}</strong><small>{order.customer_email}</small></td>
                                            <td>{money(order.total_amount)}</td>
                                            <td>
                                                <select value={order.status} disabled={saving === order.id} onChange={e => updateOrder(order, { status: e.target.value })}>
                                                    {STATUSES.map(status => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}
                                                </select>
                                            </td>
                                            <td>
                                                <div className="admin-orders__shipping">
                                                    <select value={order.carrier || ""} disabled={saving === order.id} onChange={e => updateOrder(order, { carrier: e.target.value })}>
                                                        <option value="">Carrier</option>
                                                        {CARRIERS.map(carrier => <option key={carrier} value={carrier}>{carrier}</option>)}
                                                    </select>
                                                    <input aria-label={`Tracking number for ${order.order_code}`} placeholder="Tracking number" defaultValue={order.tracking_number || ""} onBlur={e => {
                                                        const value = e.target.value.trim();
                                                        if (value !== (order.tracking_number || "")) updateOrder(order, { trackingNumber: value });
                                                    }} />
                                                    {order.tracking_number && <a href={order.carrier === "USPS" ? `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(order.tracking_number)}` : order.carrier === "UPS" ? `https://www.ups.com/track?loc=en_US&tracknum=${encodeURIComponent(order.tracking_number)}` : order.carrier === "FedEx" ? `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(order.tracking_number)}` : order.carrier === "DHL" ? `https://www.dhl.com/global-en/home/tracking.html?tracking-id=${encodeURIComponent(order.tracking_number)}` : "#"} target="_blank" rel="noreferrer"><Truck size={15} /> Track</a>}
                                                </div>
                                            </td>
                                            <td>{new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                <div className="admin-orders__note"><CheckCircle2 size={16} /> Tracking numbers must be real carrier-issued numbers. The system never invents tracking codes.</div>
            </main>
        </div>
    );
}

export default AdminOrders;
