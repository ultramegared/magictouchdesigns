import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, ChevronDown, Filter, Package, RefreshCw, Search, Trash2, Truck } from "lucide-react";
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

function statusLabel(value: string) {
    return String(value || "").replaceAll("_", " ").replace(/\b\w/g, char => char.toUpperCase());
}

function isDeletableOrder(order: Order) {
    return ["pending_payment", "cancelled"].includes(order.status) && order.payment_status !== "paid";
}

function AdminOrders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [paymentFilter, setPaymentFilter] = useState("all");

    const loadOrders = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await apiRequest<Order[]>("/api/admin/orders");
            setOrders(Array.isArray(result) ? result : []);
            setSelectedOrderIds(new Set());
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
            await apiRequest(`/api/admin/orders/${order.id}`, { method: "PATCH", body: JSON.stringify(patch) });
            await loadOrders();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to update order.");
        } finally {
            setSaving(null);
        }
    };

    const deleteOrder = async (order: Order) => {
        if (!isDeletableOrder(order)) return;
        const confirmed = window.confirm(`Delete order ${order.order_code}?\n\nThis permanently removes the pending/cancelled unpaid order and its items. This action cannot be undone.`);
        if (!confirmed) return;
        try {
            setDeleting(order.id);
            setError(null);
            await apiRequest(`/api/admin/orders/${order.id}`, { method: "DELETE" });
            setOrders(current => current.filter(item => item.id !== order.id));
            setSelectedOrderIds(current => { const next = new Set(current); next.delete(order.id); return next; });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to delete order.");
        } finally {
            setDeleting(null);
        }
    };

    const filteredOrders = useMemo(() => {
        const query = search.trim().toLowerCase();
        return orders.filter(order => {
            const matchesSearch = !query || [order.order_code, order.customer_name, order.customer_email, order.tracking_number || ""].some(value => String(value).toLowerCase().includes(query));
            const matchesStatus = statusFilter === "all" || order.status === statusFilter;
            const matchesPayment = paymentFilter === "all" || order.payment_status === paymentFilter;
            return matchesSearch && matchesStatus && matchesPayment;
        });
    }, [orders, search, statusFilter, paymentFilter]);

    const deletableSelectedCount = useMemo(
        () => Array.from(selectedOrderIds).filter(id => orders.some(order => order.id === id && isDeletableOrder(order))).length,
        [orders, selectedOrderIds],
    );

    const allFilteredSelected = filteredOrders.length > 0 && filteredOrders.every(order => selectedOrderIds.has(order.id));

    const toggleOrderSelection = (orderId: string) => {
        setSelectedOrderIds(current => {
            const next = new Set(current);
            if (next.has(orderId)) next.delete(orderId); else next.add(orderId);
            return next;
        });
    };

    const toggleAllSelection = () => {
        setSelectedOrderIds(current => {
            const next = new Set(current);
            if (allFilteredSelected) filteredOrders.forEach(order => next.delete(order.id));
            else filteredOrders.forEach(order => next.add(order.id));
            return next;
        });
    };

    const bulkDeleteOrders = async () => {
        const ids = Array.from(selectedOrderIds);
        const deletableIds = ids.filter(id => orders.some(order => order.id === id && isDeletableOrder(order)));
        if (!deletableIds.length || deletableIds.length > 1000) {
            setError("Select at least one pending or cancelled unpaid order to delete. Paid or active orders are protected.");
            return;
        }
        const protectedCount = ids.length - deletableIds.length;
        const warning = protectedCount > 0 ? `\n\n${protectedCount} selected order${protectedCount === 1 ? " is" : "s are"} protected and will remain.` : "";
        const confirmed = window.confirm(`Delete ${deletableIds.length} selected order${deletableIds.length === 1 ? "" : "s"}?${warning}\n\nOnly pending or cancelled unpaid orders will be permanently deleted. This action cannot be undone.`);
        if (!confirmed) return;
        try {
            setDeleting("bulk");
            setError(null);
            await apiRequest(`/api/admin/orders/${deletableIds[0]}`, { method: "DELETE", body: JSON.stringify({ ids: deletableIds }) });
            setOrders(current => current.filter(order => !deletableIds.includes(order.id)));
            setSelectedOrderIds(current => { const next = new Set(current); deletableIds.forEach(id => next.delete(id)); return next; });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to delete selected orders.");
        } finally {
            setDeleting(null);
        }
    };

    const paidOrders = orders.filter(order => order.payment_status === "paid");
    const activeOrders = orders.filter(order => !["cancelled", "refunded", "delivered"].includes(order.status));
    const fulfillmentOrders = orders.filter(order => ["shipped", "delivered"].includes(order.status));
    const revenue = paidOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);

    return (
        <div className="admin-page">
            <AdminSidebar />
            <main className="admin-orders">
                <header className="admin-orders__header">
                    <div><div className="admin-orders__eyebrow"><Package size={16} /> Order Management</div><h1>Orders</h1><p>Manage fulfillment, payment status, and shipment tracking from one operational workspace.</p></div>
                    <button className="admin-orders__refresh" onClick={loadOrders} disabled={loading || deleting !== null}><RefreshCw size={17} className={loading ? "spin" : ""} /> Refresh</button>
                </header>
                {error && <div className="admin-orders__alert">{error}</div>}
                <section className="admin-orders__stats" aria-label="Order summary">
                    <div><span>All orders</span><strong>{orders.length}</strong><small>Orders in system</small></div>
                    <div><span>Paid</span><strong>{paidOrders.length}</strong><small>Payment confirmed</small></div>
                    <div><span>In fulfillment</span><strong>{activeOrders.length}</strong><small>Needs attention</small></div>
                    <div><span>Collected</span><strong>{money(revenue)}</strong><small>Paid order totals</small></div>
                </section>
                <section className="admin-orders__workspace">
                    <div className="admin-orders__toolbar">
                        <div className="admin-orders__search"><Search size={17} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search order, customer, email or tracking" aria-label="Search orders" /></div>
                        <label className="admin-orders__filter"><Filter size={15} /><span>Status</span><select value={statusFilter} onChange={event => setStatusFilter(event.target.value)}><option value="all">All statuses</option>{STATUSES.map(status => <option key={status} value={status}>{statusLabel(status)}</option>)}</select><ChevronDown size={14} /></label>
                        <label className="admin-orders__filter"><span>Payment</span><select value={paymentFilter} onChange={event => setPaymentFilter(event.target.value)}><option value="all">All payments</option><option value="paid">Paid</option><option value="unpaid">Unpaid</option><option value="pending">Pending</option><option value="failed">Failed</option><option value="refunded">Refunded</option></select><ChevronDown size={14} /></label>
                    </div>
                    <div className="admin-orders__toolbar-meta"><span><strong>{filteredOrders.length}</strong> of {orders.length} orders shown</span>{(search || statusFilter !== "all" || paymentFilter !== "all") && <button type="button" onClick={() => { setSearch(""); setStatusFilter("all"); setPaymentFilter("all"); }}>Clear filters</button>}</div>
                    {selectedOrderIds.size > 0 && <div className="admin-orders__selection-bar"><strong>{selectedOrderIds.size} selected</strong><span>{deletableSelectedCount} deletable</span><button type="button" onClick={bulkDeleteOrders} disabled={deleting !== null || deletableSelectedCount === 0}><Trash2 size={15} /> {deleting === "bulk" ? "Deleting..." : "Delete selected"}</button></div>}
                    {loading ? <div className="admin-orders__empty">Loading orders...</div> : orders.length === 0 ? <div className="admin-orders__empty"><Package size={30} /><strong>No orders yet</strong><span>New customer orders will appear here.</span></div> : filteredOrders.length === 0 ? <div className="admin-orders__empty"><Search size={30} /><strong>No matching orders</strong><span>Try a different search or clear the filters.</span></div> : (
                        <div className="admin-orders__table-wrap"><table className="admin-orders__table"><thead><tr>
                            <th className="admin-orders__select-cell"><input type="checkbox" checked={allFilteredSelected} onChange={toggleAllSelection} disabled={deleting !== null} aria-label="Select all visible orders" /></th>
                            <th>Order</th><th>Customer</th><th>Total</th><th>Payment</th><th>Status</th><th>Shipping & tracking</th><th>Date</th><th>Actions</th>
                        </tr></thead><tbody>
                            {filteredOrders.map(order => { const canDelete = isDeletableOrder(order); return <tr key={order.id}>
                                <td className="admin-orders__select-cell"><input type="checkbox" checked={selectedOrderIds.has(order.id)} onChange={() => toggleOrderSelection(order.id)} disabled={deleting !== null} aria-label={`Select ${order.order_code}`} /></td>
                                <td><strong className="order-code">{order.order_code}</strong><small>{order.item_count} item{order.item_count === 1 ? "" : "s"}</small></td>
                                <td><strong>{order.customer_name || "Customer"}</strong><small>{order.customer_email}</small></td>
                                <td><strong className="order-total">{money(order.total_amount)}</strong><small>Subtotal {money(order.subtotal)}</small></td>
                                <td><span className={`payment-badge payment-badge--${order.payment_status}`}>{statusLabel(order.payment_status)}</span></td>
                                <td><select className="status-select" value={order.status} disabled={saving === order.id || deleting !== null} onChange={event => updateOrder(order, { status: event.target.value })}>{STATUSES.map(status => <option key={status} value={status}>{statusLabel(status)}</option>)}</select></td>
                                <td><div className="admin-orders__shipping"><select value={order.carrier || ""} disabled={saving === order.id || deleting !== null} onChange={event => updateOrder(order, { carrier: event.target.value })}><option value="">Carrier</option>{CARRIERS.map(carrier => <option key={carrier} value={carrier}>{carrier}</option>)}</select><input aria-label={`Tracking number for ${order.order_code}`} placeholder="Tracking number" defaultValue={order.tracking_number || ""} disabled={deleting !== null} onBlur={event => { const value = event.target.value.trim(); if (value !== (order.tracking_number || "")) updateOrder(order, { trackingNumber: value }); }} />{order.tracking_number && <a href={order.carrier === "USPS" ? `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(order.tracking_number)}` : order.carrier === "UPS" ? `https://www.ups.com/track?loc=en_US&tracknum=${encodeURIComponent(order.tracking_number)}` : order.carrier === "FedEx" ? `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(order.tracking_number)}` : order.carrier === "DHL" ? `https://www.dhl.com/global-en/home/tracking.html?tracking-id=${encodeURIComponent(order.tracking_number)}` : "#"} target="_blank" rel="noreferrer"><Truck size={15} /> Track shipment</a>}</div></td>
                                <td><time dateTime={order.created_at}>{new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</time></td>
                                <td>{canDelete ? <button className="admin-orders__delete-button" type="button" title="Delete pending or cancelled unpaid order" aria-label={`Delete ${order.order_code}`} onClick={() => deleteOrder(order)} disabled={deleting !== null || saving === order.id}><Trash2 size={16} /></button> : <span className="admin-orders__protected">{order.payment_status === "paid" ? "Protected" : "—"}</span>}</td>
                            </tr>; })}
                        </tbody></table></div>
                    )}
                </section>
                <div className="admin-orders__note"><CheckCircle2 size={16} /> Tracking numbers must be real carrier-issued numbers. The system never invents tracking codes. <span>·</span> {fulfillmentOrders.length} shipped or delivered</div>
            </main>
        </div>
    );
}

export default AdminOrders;
