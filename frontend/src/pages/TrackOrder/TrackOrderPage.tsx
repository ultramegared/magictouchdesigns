/**
 * ===============================================================
 * Magic Touch Designs - TrackOrderPage.tsx
 * Real order lookup using order code + customer email.
 * ===============================================================
 */

import type { FormEvent } from "react";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import "./TrackOrderPage.css";
import Header from "../../components/layout/Header";
import Footer from "../../components/home/Footer";
import { useLanguage } from "../../contexts/LanguageContext";
import { translations } from "../../translations";

const API_URL = "https://api.magictouchdesigns.com/api";

type Order = {
    order_code: string;
    customer_first_name: string;
    customer_last_name: string;
    customer_email: string;
    payment_status: string;
    status: string;
    total: string | number;
    carrier: string | null;
    tracking_number: string | null;
    created_at: string;
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

function TrackOrderPage() {
    const { language } = useLanguage();
    const t = translations[language].trackOrder;
    const [searchParams] = useSearchParams();
    const [orderNumber, setOrderNumber] = useState(searchParams.get("order") || "");
    const [email, setEmail] = useState("");
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const lookupOrder = async (event: FormEvent) => {
        event.preventDefault();
        setLoading(true);
        setError("");
        setOrder(null);

        try {
            const response = await fetch(`${API_URL}/orders/${encodeURIComponent(orderNumber.trim())}?email=${encodeURIComponent(email.trim())}`);
            const data = await response.json() as Order & { message?: string };
            if (!response.ok) throw new Error(data.message || "Order not found.");
            setOrder(data);
        } catch (lookupError: unknown) {
            setError(lookupError instanceof Error ? lookupError.message : "Unable to find your order.");
        } finally {
            setLoading(false);
        }
    };

    const trackingLink = carrierUrl(order?.carrier || null, order?.tracking_number || null);

    return (
        <>
            <Header />
            <main className="track-order-page">
                <section className="track-order-page__hero"><div className="track-order-page__container"><span className="track-order-page__eyebrow">{t.hero.eyebrow}</span><h1>{t.hero.title}<span>{t.hero.titleAccent}</span></h1><div className="track-order-page__divider"><span /></div><p className="track-order-page__intro">{t.hero.intro}</p></div></section>
                <section className="track-order-page__content"><div className="track-order-page__container"><div className="track-order-page__card"><h2>{t.tracking.title}</h2><p>{t.tracking.description}</p><form className="track-order-page__form" onSubmit={lookupOrder}><div className="track-order-page__field"><label htmlFor="order-number">{t.tracking.orderNumberLabel}</label><input id="order-number" name="orderNumber" type="text" required value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder={t.tracking.orderNumberPlaceholder} /></div><div className="track-order-page__field"><label htmlFor="email">{t.tracking.emailLabel}</label><input id="email" name="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t.tracking.emailPlaceholder} /></div><button type="submit" className="track-order-page__button" disabled={loading}>{loading ? "Checking…" : t.tracking.button}</button></form>{error && <p role="alert" className="track-order-page__error">{error}</p>}{order && <div className="track-order-page__result"><h3>{order.order_code}</h3><p><strong>Status:</strong> {order.status.replaceAll("_", " ")}</p><p><strong>Payment:</strong> {order.payment_status}</p><p><strong>Total:</strong> ${Number(order.total).toFixed(2)}</p>{order.tracking_number ? <p><strong>Tracking:</strong> {order.carrier || "Carrier"} — {order.tracking_number}{trackingLink && <><br /><a href={trackingLink} target="_blank" rel="noreferrer">Track package with carrier →</a></>}</p> : <p>Your tracking number will appear here as soon as your order ships.</p>}</div>}</div><div className="track-order-page__help"><h2>{t.help.title}</h2><p>{t.help.description}</p></div></div></section>
            </main>
            <Footer />
        </>
    );
}

export default TrackOrderPage;
