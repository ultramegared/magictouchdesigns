/**
 * ===============================================================
 * Magic Touch Designs - TrackOrderPage.tsx
 * Professional customer order lookup and shipment tracking.
 * ===============================================================
 */

import type { FormEvent } from "react";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle2, Circle, CreditCard, Package, Truck, MapPin, ExternalLink } from "lucide-react";
import "./TrackOrderPage.css";
import Header from "../../components/layout/Header";
import Footer from "../../components/home/Footer";
import { useLanguage } from "../../contexts/LanguageContext";
import { translations } from "../../translations";

const API_URL = "https://api.jqydesigns.com/api";

type OrderItem = {
    product_name: string;
    unit_price: string | number;
    quantity: number;
    variant?: Record<string, string> | null;
};

type Order = {
    order_code: string;
    customer_first_name: string;
    customer_last_name: string;
    customer_email: string;
    payment_status: string;
    status: string;
    subtotal: string | number;
    shipping: string | number;
    tax: string | number;
    total: string | number;
    carrier: string | null;
    tracking_number: string | null;
    created_at: string;
    shipping_address?: {
        address?: string;
        apartment?: string;
        city?: string;
        state?: string;
        zip?: string;
    } | null;
    items?: OrderItem[];
};

const carrierUrl = (carrier: string | null, tracking: string | null) => {
    if (!carrier || !tracking) return null;
    const value = encodeURIComponent(tracking);
    const normalized = carrier.toLowerCase();
    if (normalized.includes("ups")) return `https://www.ups.com/track?loc=en_US&tracknum=${value}`;
    if (normalized.includes("fedex")) return `https://www.fedex.com/fedextrack/?trknbr=${value}`;
    if (normalized.includes("usps")) return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${value}`;
    if (normalized.includes("dhl")) return `https://www.dhl.com/us-en/home/tracking.html?tracking-id=${value}`;
    return null;
};

const normalizeOrderCode = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return "";
    return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
};

const formatStatus = (value: string) =>
    value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());

const formatDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
};

const money = (value: string | number) => `$${Number(value || 0).toFixed(2)}`;

const STATUS_STEPS = ["pending_payment", "paid", "processing", "shipped", "delivered"] as const;

function TrackOrderPage() {
    const { language } = useLanguage();
    const t = translations[language].trackOrder;
    const isEs = language === "es";
    const [searchParams] = useSearchParams();
    const [orderNumber, setOrderNumber] = useState(searchParams.get("order") || "");
    const [email, setEmail] = useState("");
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const lookupOrder = async (event: FormEvent) => {
        event.preventDefault();
        const normalizedOrderCode = normalizeOrderCode(orderNumber);
        const normalizedEmail = email.trim().toLowerCase();
        if (!normalizedOrderCode || !normalizedEmail) return;
        setLoading(true);
        setError("");
        setOrder(null);
        try {
            const response = await fetch(`${API_URL}/orders/${encodeURIComponent(normalizedOrderCode)}?email=${encodeURIComponent(normalizedEmail)}`);
            const data = await response.json() as Order & { message?: string };
            if (!response.ok) throw new Error(data.message || (isEs ? "No encontramos tu pedido." : "Order not found."));
            setOrder(data);
            setOrderNumber(data.order_code);
        } catch (lookupError: unknown) {
            setError(lookupError instanceof Error ? lookupError.message : (isEs ? "No pudimos encontrar tu pedido." : "Unable to find your order."));
        } finally {
            setLoading(false);
        }
    };

    const trackingLink = carrierUrl(order?.carrier || null, order?.tracking_number || null);
    const currentIndex = order ? STATUS_STEPS.indexOf(order.status as typeof STATUS_STEPS[number]) : -1;
    const isCancelled = order?.status === "cancelled";

    return (
        <>
            <Header />
            <main className="track-order-page">
                <section className="track-order-page__hero">
                    <div className="track-order-page__container">
                        <span className="track-order-page__eyebrow">{t.hero.eyebrow}</span>
                        <h1>{t.hero.title}<span>{t.hero.titleAccent}</span></h1>
                        <div className="track-order-page__divider"><span /></div>
                        <p className="track-order-page__intro">{t.hero.intro}</p>
                    </div>
                </section>

                <section className="track-order-page__content">
                    <div className="track-order-page__container">
                        <div className="track-order-page__card">
                            <h2>{t.tracking.title}</h2>
                            <p>{t.tracking.description}</p>

                            <form className="track-order-page__form" onSubmit={lookupOrder}>
                                <div className="track-order-page__field">
                                    <label htmlFor="order-number">{t.tracking.orderNumberLabel}</label>
                                    <input id="order-number" name="orderNumber" type="text" required value={orderNumber} onChange={(event) => setOrderNumber(event.target.value)} placeholder={t.tracking.orderNumberPlaceholder} autoComplete="off" />
                                </div>
                                <div className="track-order-page__field">
                                    <label htmlFor="email">{t.tracking.emailLabel}</label>
                                    <input id="email" name="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder={t.tracking.emailPlaceholder} autoComplete="email" />
                                </div>
                                <button type="submit" className="track-order-page__button" disabled={loading}>
                                    {loading ? (isEs ? "Consultando…" : "Checking…") : t.tracking.button}
                                </button>
                            </form>

                            {error && <p role="alert" className="track-order-page__error">{error}</p>}

                            {order && (
                                <div className="track-order-page__result" style={{ marginTop: 42 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", gap: 20, alignItems: "flex-start", flexWrap: "wrap", borderBottom: "1px solid rgba(212,163,61,.22)", paddingBottom: 24 }}>
                                        <div>
                                            <span style={{ display: "block", color: "#d4a33d", fontSize: ".7rem", fontWeight: 800, letterSpacing: ".18em", marginBottom: 8 }}>{isEs ? "PEDIDO" : "ORDER"}</span>
                                            <h3 style={{ margin: 0, color: "#fff", fontSize: "1.65rem" }}>{order.order_code}</h3>
                                            <p style={{ margin: "8px 0 0", opacity: .62 }}>{formatDate(order.created_at)}</p>
                                        </div>
                                        <span style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 13px", border: "1px solid rgba(212,163,61,.35)", borderRadius: 999, color: "#f0cf70", background: "rgba(212,163,61,.07)", fontWeight: 800, fontSize: ".78rem" }}>
                                            {isCancelled ? "Cancelled" : formatStatus(order.status)}
                                        </span>
                                    </div>

                                    <div style={{ margin: "34px 0", padding: "24px 18px", borderRadius: 14, background: "rgba(255,255,255,.025)", border: "1px solid rgba(255,255,255,.07)" }}>
                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0,1fr))", gap: 8 }}>
                                            {STATUS_STEPS.map((step, index) => {
                                                const done = !isCancelled && currentIndex >= index;
                                                const active = !isCancelled && currentIndex === index;
                                                return (
                                                    <div key={step} style={{ textAlign: "center", minWidth: 0 }}>
                                                        <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
                                                            {index > 0 && <span style={{ height: 2, flex: 1, background: currentIndex >= index ? "#d4a33d" : "rgba(255,255,255,.12)" }} />}
                                                            {done ? <CheckCircle2 size={22} color="#d4a33d" style={{ flexShrink: 0 }} /> : <Circle size={22} color="rgba(255,255,255,.25)" style={{ flexShrink: 0 }} />}
                                                            {index < STATUS_STEPS.length - 1 && <span style={{ height: 2, flex: 1, background: currentIndex > index ? "#d4a33d" : "rgba(255,255,255,.12)" }} />}
                                                        </div>
                                                        <span style={{ display: "block", color: active ? "#f0cf70" : done ? "#fff" : "rgba(255,255,255,.45)", fontSize: ".68rem", fontWeight: active ? 800 : 600, lineHeight: 1.35 }}>{step === "pending_payment" ? (isEs ? "Recibido" : "Received") : step === "paid" ? (isEs ? "Pagado" : "Paid") : step === "processing" ? (isEs ? "Preparando" : "Processing") : step === "shipped" ? (isEs ? "Enviado" : "Shipped") : (isEs ? "Entregado" : "Delivered")}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        {isCancelled && <div style={{ textAlign: "center", marginTop: 18, color: "#f36b6b", fontWeight: 700 }}>{isEs ? "Este pedido fue cancelado." : "This order has been cancelled."}</div>}
                                    </div>

                                    {order.tracking_number && (
                                        <div style={{ padding: 22, marginBottom: 28, borderRadius: 14, border: "1px solid rgba(212,163,61,.38)", background: "linear-gradient(135deg, rgba(212,163,61,.09), rgba(255,255,255,.02))" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                                                <Truck size={20} color="#d4a33d" />
                                                <strong style={{ color: "#f0cf70", letterSpacing: ".08em", textTransform: "uppercase" }}>{isEs ? "Envío en camino" : "Shipment in transit"}</strong>
                                            </div>
                                            <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
                                                <div><span style={{ display: "block", color: "rgba(255,255,255,.52)", fontSize: ".75rem", marginBottom: 4 }}>{order.carrier || (isEs ? "Transportista" : "Carrier")}</span><strong style={{ color: "#fff", fontSize: "1.05rem", letterSpacing: ".04em", wordBreak: "break-all" }}>{order.tracking_number}</strong></div>
                                                {trackingLink && <a href={trackingLink} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "#101010", background: "#d4a33d", padding: "10px 15px", borderRadius: 8, fontWeight: 800, textDecoration: "none" }}>{isEs ? "Rastrear paquete" : "Track package"}<ExternalLink size={14} /></a>}
                                            </div>
                                        </div>
                                    )}

                                    {!order.tracking_number && !isCancelled && (
                                        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 28, padding: 18, borderRadius: 12, background: "rgba(255,255,255,.025)", border: "1px solid rgba(255,255,255,.07)", color: "rgba(255,255,255,.62)" }}>
                                            <Package size={20} color="#d4a33d" />
                                            <span>{isEs ? "Tu número de seguimiento aparecerá aquí cuando enviemos tu pedido." : "Your tracking number will appear here as soon as your order ships."}</span>
                                        </div>
                                    )}

                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 20 }}>
                                        <div style={{ padding: 20, borderRadius: 12, background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)" }}>
                                            <h4 style={{ color: "#f0cf70", margin: "0 0 14px", display: "flex", gap: 8, alignItems: "center" }}><CreditCard size={16} />{isEs ? "Pago" : "Payment"}</h4>
                                            <strong style={{ color: "#fff" }}>{formatStatus(order.payment_status)}</strong>
                                            <p style={{ margin: "10px 0 0", color: "rgba(255,255,255,.58)" }}>{isEs ? "Total" : "Order total"}: <strong style={{ color: "#f0cf70" }}>{money(order.total)}</strong></p>
                                        </div>
                                        <div style={{ padding: 20, borderRadius: 12, background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)" }}>
                                            <h4 style={{ color: "#f0cf70", margin: "0 0 14px", display: "flex", gap: 8, alignItems: "center" }}><MapPin size={16} />{isEs ? "Envío" : "Shipping"}</h4>
                                            <strong style={{ color: "#fff" }}>{order.customer_first_name} {order.customer_last_name}</strong>
                                            {order.shipping_address?.address ? (
                                                <p style={{ margin: "8px 0 0", color: "rgba(255,255,255,.58)", lineHeight: 1.55 }}>
                                                    {order.shipping_address.address}
                                                    {order.shipping_address.apartment ? <><br />{order.shipping_address.apartment}</> : null}
                                                    <br />{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zip}
                                                </p>
                                            ) : (
                                                <p style={{ margin: "8px 0 0", color: "rgba(255,255,255,.58)" }}>{isEs ? "Los detalles de entrega aparecerán aquí cuando estén disponibles." : "Delivery details will appear here when available."}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div style={{ marginTop: 28, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,.08)" }}>
                                        <h4 style={{ color: "#f0cf70", margin: "0 0 15px", display: "flex", gap: 8, alignItems: "center" }}><Package size={16} />{isEs ? "Artículos del pedido" : "Order items"}</h4>
                                        {order.items?.map((item, index) => (
                                            <div key={`${item.product_name}-${index}`} style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "11px 0", borderBottom: "1px solid rgba(255,255,255,.05)", color: "rgba(255,255,255,.76)" }}>
                                                <span>{item.product_name}{item.variant?.model ? ` · ${item.variant.model}` : ""}{item.variant?.size ? ` · ${item.variant.size}` : ""}{item.variant?.color ? ` · ${item.variant.color}` : ""} × {item.quantity}</span>
                                                <strong>{money(Number(item.unit_price) * item.quantity)}</strong>
                                            </div>
                                        ))}
                                        <div style={{ marginTop: 18, display: "flex", justifyContent: "space-between", color: "rgba(255,255,255,.55)" }}><span>{isEs ? "Subtotal" : "Subtotal"}</span><span>{money(order.subtotal)}</span></div>
                                        <div style={{ marginTop: 7, display: "flex", justifyContent: "space-between", color: "rgba(255,255,255,.55)" }}><span>{isEs ? "Envío" : "Shipping"}</span><span>{money(order.shipping)}</span></div>
                                        <div style={{ marginTop: 7, display: "flex", justifyContent: "space-between", color: "rgba(255,255,255,.55)" }}><span>{isEs ? "Impuestos" : "Tax"}</span><span>{money(order.tax)}</span></div>
                                        <div style={{ marginTop: 13, paddingTop: 13, borderTop: "1px solid rgba(212,163,61,.22)", display: "flex", justifyContent: "space-between", color: "#f0cf70", fontSize: "1.1rem", fontWeight: 800 }}><span>Total</span><span>{money(order.total)}</span></div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="track-order-page__help">
                            <h2>{t.help.title}</h2>
                            <p>{t.help.description}</p>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
}

export default TrackOrderPage;
