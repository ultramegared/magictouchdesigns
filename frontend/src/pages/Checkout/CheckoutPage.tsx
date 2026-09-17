import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./CheckoutPage.css";
import "./CheckoutMobileFix.css";
import Header from "../../components/layout/Header";
import Footer from "../../components/home/Footer";
import { getCartItems, type CartItem } from "../../utils/cart";
import { getCustomizationSession } from "../../utils/customization";

type StripePaymentElement = { mount: (el: HTMLElement) => void; unmount?: () => void };
type StripeExpressElement = { mount: (el: HTMLElement) => void; unmount?: () => void; on: (event: string, handler: (payload: any) => void) => void };
type StripeActions = { confirm: (options?: any) => Promise<any> };
type StripeCheckout = {
    createPaymentElement: (options?: any) => StripePaymentElement;
    createExpressCheckoutElement: (options?: any) => StripeExpressElement;
    loadActions: () => Promise<{ type: "success"; actions: StripeActions } | { type: "error"; error: { message: string } }>;
};
type StripeInstance = { initCheckout: (options: any) => StripeCheckout };
type PayPalSdk = { createInstance: (options: { clientToken: string; components: string[]; pageType?: string; locale?: string }) => Promise<any> };
type CheckoutQuote = { subtotal: number; shipping: number; tax: number; total: number; shippingCents?: number; shippingCarrier?: string; shippingService?: string; shippingDeliveryDays?: number | null };

declare global { interface Window { Stripe?: (key: string) => StripeInstance; paypal?: PayPalSdk } }

const API_URL = "https://api.jqydesigns.com/api";
const loadScript = (id: string, src: string) => new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(id) as HTMLScriptElement | null;
    if (existing) {
        if (existing.getAttribute("data-loaded") === "true") return resolve();
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => reject(new Error("Secure payment provider could not be loaded.")), { once: true });
        return;
    }
    const s = document.createElement("script");
    s.id = id; s.async = true; s.src = src;
    s.onload = () => { s.setAttribute("data-loaded", "true"); resolve(); };
    s.onerror = () => reject(new Error("Secure payment provider could not be loaded."));
    document.head.appendChild(s);
});

function CheckoutPage() {
    const navigate = useNavigate();
    const formRef = useRef<HTMLFormElement>(null);
    const stripePaymentRef = useRef<HTMLDivElement>(null);
    const stripeAppleRef = useRef<HTMLDivElement>(null);
    const stripeActionsRef = useRef<StripeActions | null>(null);
    const stripeSessionRef = useRef({ id: "", code: "" });
    const stripeCleanupRef = useRef<(() => void) | null>(null);
    const stripeStartingRef = useRef(false);
    const paypalContainerRef = useRef<HTMLDivElement>(null);

    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", deliveryType: "house" as "house" | "apartment", address: "", apartment: "", city: "", state: "", zip: "" });
        const [stripeReady, setStripeReady] = useState(false);
    const [appleAvailable, setAppleAvailable] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(false);
    const [paypalLoading, setPaypalLoading] = useState(true);
    const [paypalEnabled, setPaypalEnabled] = useState(false);
    const [error, setError] = useState("");
    const [paypalError, setPaypalError] = useState("");
    const [quote, setQuote] = useState<CheckoutQuote | null>(null);
    const [quoteLoading, setQuoteLoading] = useState(false);
    const [quoteError, setQuoteError] = useState("");

    useEffect(() => { const items = getCartItems(); setCartItems(items); if (!items.length) navigate("/cart", { replace: true }); }, [navigate]);
    useEffect(() => () => stripeCleanupRef.current?.(), []);

    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = quote?.shipping ?? (subtotal ? 5.99 : 0);
    const tax = quote?.tax ?? null;
    const baseTotal = quote?.total ?? subtotal + shipping;
    const update = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }));
    const valid = () => Boolean(formRef.current?.reportValidity());

    const payload = () => ({ customer: form, items: cartItems.map((item) => {
        const session = item.customizationId ? getCustomizationSession(item.customizationId) : null;
        if (item.customizationId && (!session?.designDataUrl || session.productId !== String(item.id))) throw new Error("Your custom design session expired. Please return to Customize and upload the artwork again.");
        return { productId: String(item.id), quantity: item.quantity, model: item.model, size: item.size, color: item.color, ...(item.customizationId && session ? { customizationId: item.customizationId, customization: { productId: session.productId, productName: session.productName, size: session.size, color: session.color, designDataUrl: session.designDataUrl, designFileName: session.designFileName, designScale: session.designScale, designX: session.designX, designY: session.designY, designRotation: session.designRotation, mugRotation: session.mugRotation } } : {}) };
    }) });

    const addressReady = Boolean(form.firstName.trim() && form.lastName.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) && form.address.trim() && form.city.trim() && form.state.trim() && /^\d{5}(?:-\d{4})?$/.test(form.zip.trim()) && (form.deliveryType !== "apartment" || form.apartment.trim()));

    useEffect(() => {
        if (!cartItems.length || !addressReady) { setQuote(null); setQuoteError(""); setQuoteLoading(false); return; }
        const controller = new AbortController();
        const timer = window.setTimeout(async () => {
            setQuoteLoading(true); setQuoteError("");
            try {
                const r = await fetch(`${API_URL}/orders/quote`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload()), signal: controller.signal });
                const d = (await r.json()) as Partial<CheckoutQuote> & { message?: string };
                if (!r.ok || typeof d.subtotal !== "number" || typeof d.shipping !== "number" || typeof d.tax !== "number" || typeof d.total !== "number") throw new Error(d.message || "Unable to calculate shipping and tax.");
                setQuote({ subtotal: d.subtotal, shipping: d.shipping, tax: d.tax, total: d.total, shippingCents: d.shippingCents, shippingCarrier: d.shippingCarrier, shippingService: d.shippingService, shippingDeliveryDays: d.shippingDeliveryDays });
            } catch (x) { if (!controller.signal.aborted) { setQuote(null); setQuoteError(x instanceof Error ? x.message : "Unable to calculate shipping and tax."); } }
            finally { if (!controller.signal.aborted) setQuoteLoading(false); }
        }, 500);
        return () => { window.clearTimeout(timer); controller.abort(); };
    }, [cartItems, form, addressReady]);

    const prepareStripe = async () => {
        if (!addressReady) return;
        if (stripeReady || stripeStartingRef.current) return;
        stripeStartingRef.current = true; setLoading(true); setError("");
        try {
            const cfg = (await (await fetch(`${API_URL}/orders/stripe/config`)).json()) as { enabled?: boolean; publishableKey?: string };
            if (!cfg.enabled || !cfg.publishableKey) throw new Error("Card payments are not configured yet.");
            await loadScript("stripe-js-clover", "https://js.stripe.com/clover/stripe.js");
            if (!window.Stripe) throw new Error("Stripe could not be loaded.");
            const r = await fetch(`${API_URL}/orders/stripe/custom`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload()) });
            const d = (await r.json()) as { clientSecret?: string; orderCode?: string; sessionId?: string; message?: string };
            if (!r.ok || !d.clientSecret || !d.orderCode || !d.sessionId) throw new Error(d.message || "Unable to start secure card payment.");
            const checkout = window.Stripe(cfg.publishableKey).initCheckout({ clientSecret: d.clientSecret, elementsOptions: { appearance: { theme: "night", inputs: "spaced", labels: "above", variables: { colorPrimary: "#E0AD43", colorBackground: "#111111", colorText: "#F5F5F5", colorTextSecondary: "#C9C9C9", colorTextPlaceholder: "#8C8C8C", colorDanger: "#F36B6B", iconColor: "#E0AD43", borderRadius: "10px", fontSizeBase: "16px", fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif" }, rules: { ".Label": { color: "#E0AD43", fontWeight: "600" }, ".Label--focused": { color: "#F1C75B" }, ".Input": { color: "#F5F5F5", backgroundColor: "#111111", border: "1px solid #3A3A3A" }, ".Input:focus": { borderColor: "#E0AD43", boxShadow: "0 0 0 1px #E0AD43" } } } }, defaultValues: { email: form.email.trim().toLowerCase(), phoneNumber: form.phone.trim(), shippingAddress: { name: `${form.firstName} ${form.lastName}`.trim(), address: { country: "US", line1: form.address, line2: form.apartment || undefined, city: form.city, state: form.state.toUpperCase(), postal_code: form.zip } } } });
            const actions = await checkout.loadActions();
            if (actions.type !== "success") throw new Error(actions.error.message || "Stripe checkout could not initialize.");
            stripeActionsRef.current = actions.actions; stripeSessionRef.current = { id: d.sessionId, code: d.orderCode };
            const payment = checkout.createPaymentElement({ layout: "tabs", fields: { billingDetails: { name: "always" } }, wallets: { applePay: "never", googlePay: "never", link: "never" } });
            const express = checkout.createExpressCheckoutElement({ buttonHeight: 52, buttonType: { applePay: "check-out" }, buttonTheme: { applePay: "black" }, paymentMethods: { applePay: "auto", googlePay: "never", link: "never", paypal: "never", amazonPay: "never", klarna: "never" }, paymentMethodOrder: ["applePay"] });
            if (!stripePaymentRef.current || !stripeAppleRef.current) throw new Error("Payment area is unavailable.");
            stripePaymentRef.current.replaceChildren(); stripeAppleRef.current.replaceChildren(); payment.mount(stripePaymentRef.current); express.mount(stripeAppleRef.current);
            express.on("availablepaymentmethodschange", (e: any) => { const methods = e?.paymentMethods ?? e?.availablePaymentMethods ?? null; setAppleAvailable(Boolean(methods?.applePay)); });
            express.on("confirm", async (e: any) => { setLoading(true); try { const result = await actions.actions.confirm({ expressCheckoutConfirmEvent: e }); if (result?.type === "error") { setError(result.error?.message || "Apple Pay payment could not be completed."); setLoading(false); } } catch (x) { setError(x instanceof Error ? x.message : "Apple Pay payment could not be completed."); setLoading(false); } });
            stripeCleanupRef.current = () => { payment.unmount?.(); express.unmount?.(); stripePaymentRef.current?.replaceChildren(); stripeAppleRef.current?.replaceChildren(); stripeActionsRef.current = null; };
            setStripeReady(true);
        } catch (x) { stripeStartingRef.current = false; setError(x instanceof Error ? x.message : "Unable to load secure card payment."); }
        finally { setLoading(false); }
    };

    // Keep all payment providers visible. Stripe/Apple Pay initialize as soon as the
    // destination is complete enough to calculate the server-side quote.
    useEffect(() => { if (cartItems.length && addressReady) void prepareStripe(); }, [cartItems.length, addressReady]);

    const submit = async (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); if (!valid()) return; if (!stripeReady) await prepareStripe(); const actions = stripeActionsRef.current; if (!actions) return setError("Secure card payment is not ready."); setLoading(true); setError(""); try { const r = await actions.confirm({ redirect: "if_required" }); if (r?.type === "error") { setError(r.error?.message || "Card payment could not be completed."); setLoading(false); } else if (r?.type === "success") window.location.assign(`/checkout/success?session_id=${encodeURIComponent(stripeSessionRef.current.id)}&order_code=${encodeURIComponent(stripeSessionRef.current.code)}`); } catch (x) { setError(x instanceof Error ? x.message : "Card payment could not be completed."); setLoading(false); } };

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const cfg = (await (await fetch(`${API_URL}/orders/paypal/config`)).json()) as { enabled?: boolean; environment?: string };
                if (cancelled || !cfg.enabled) return setPaypalLoading(false);
                await loadScript("paypal-web-sdk-v6", cfg.environment === "live" ? "https://www.paypal.com/web-sdk/v6/core" : "https://www.sandbox.paypal.com/web-sdk/v6/core");
                if (!window.paypal?.createInstance) throw new Error("PayPal SDK unavailable after loading.");
                const tokenResponse = await fetch(`${API_URL}/orders/paypal/client-token`);
                const tokenData = (await tokenResponse.json()) as { clientToken?: string; message?: string };
                if (!tokenResponse.ok || !tokenData.clientToken) throw new Error(tokenData.message || "PayPal secure initialization failed.");
                const sdk = await window.paypal.createInstance({ clientToken: tokenData.clientToken, components: ["paypal-payments"], pageType: "checkout", locale: "en-US" });
                const eligible = await sdk.findEligibleMethods({ currencyCode: "USD" });
                if (!eligible.isEligible("paypal")) { setPaypalLoading(false); return; }
                const session = sdk.createPayPalOneTimePaymentSession({ onApprove: async ({ orderId }: { orderId: string }) => { const r = await fetch(`${API_URL}/orders/paypal/${encodeURIComponent(orderId)}/capture`, { method: "POST" }); const d = (await r.json()) as { orderCode?: string; message?: string }; if (!r.ok || !d.orderCode) throw new Error(d.message || "PayPal payment failed."); window.location.assign(`/checkout/success?paypal=1&order_code=${encodeURIComponent(d.orderCode)}`); }, onCancel: () => setPaypalError("PayPal checkout was cancelled."), onError: (x: Error) => setPaypalError(x.message || "PayPal payment failed.") });
                const c = paypalContainerRef.current; if (!c) return;
                c.replaceChildren(); const b = document.createElement("paypal-button"); b.setAttribute("type", "pay"); b.setAttribute("hidden", "");
                b.addEventListener("click", async () => { if (!valid()) return; try { await session.start({ presentationMode: "auto" }, (async () => { const r = await fetch(`${API_URL}/orders/paypal/create`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload()) }); const d = (await r.json()) as { paypalOrderId?: string; message?: string }; if (!r.ok || !d.paypalOrderId) throw new Error(d.message || "Unable to create PayPal payment."); return d.paypalOrderId; })()); } catch (x) { setPaypalError(x instanceof Error ? x.message : "PayPal payment failed."); } });
                c.appendChild(b); b.removeAttribute("hidden"); setPaypalEnabled(true); setPaypalLoading(false);
            } catch (x) { if (!cancelled) { console.error("PayPal initialization error:", x); setPaypalLoading(false); setPaypalError(x instanceof Error ? x.message : "PayPal is temporarily unavailable."); } }
        })();
        return () => { cancelled = true; };
    }, [cartItems.length]);

    return (<><Header /><main className="checkout-page"><section className="checkout-hero"><div className="checkout-hero__background"><img src="/images/cart/cart-hero-background.jpg" alt="Magic Touch Designs" /></div><div className="checkout-hero__overlay" /><div className="checkout-hero__content"><span>SECURE CHECKOUT</span><h1>Complete Your Order</h1><p>Enter your delivery information and choose your secure payment method.</p></div></section><section className="checkout-container"><form ref={formRef} className="checkout-grid" onSubmit={submit}><div className="checkout-form"><div className="checkout-section"><span className="checkout-section__eyebrow">CUSTOMER INFORMATION</span><h2>Your Details</h2><div className="checkout-fields"><label><span>First Name</span><input required value={form.firstName} onChange={(e) => update("firstName", e.target.value)} autoComplete="given-name" /></label><label><span>Last Name</span><input required value={form.lastName} onChange={(e) => update("lastName", e.target.value)} autoComplete="family-name" /></label><label className="checkout-field--full"><span>Email Address</span><input required type="email" value={form.email} onChange={(e) => update("email", e.target.value)} autoComplete="email" /></label><label className="checkout-field--full"><span>Phone Number</span><input value={form.phone} onChange={(e) => update("phone", e.target.value)} autoComplete="tel" /></label></div></div><div className="checkout-section"><span className="checkout-section__eyebrow">DELIVERY</span><h2>Shipping Address</h2><div className="checkout-address-types"><button type="button" className={`checkout-address-type ${form.deliveryType === "house" ? "checkout-address-type--active" : ""}`} onClick={() => update("deliveryType", "house")}><span className="checkout-address-type__icon">⌂</span><span><strong>House</strong><small>Residential home</small></span></button><button type="button" className={`checkout-address-type ${form.deliveryType === "apartment" ? "checkout-address-type--active" : ""}`} onClick={() => update("deliveryType", "apartment")}><span className="checkout-address-type__icon">⌂</span><span><strong>Apartment</strong><small>Apartment or unit</small></span></button></div><div className="checkout-fields"><label className="checkout-field--full"><span>Street Address</span><input required value={form.address} onChange={(e) => update("address", e.target.value)} autoComplete="street-address" /></label>{form.deliveryType === "apartment" && <label className="checkout-field--full"><span>Apartment / Unit Number</span><input required value={form.apartment} onChange={(e) => update("apartment", e.target.value)} autoComplete="address-line2" /></label>}<label><span>City</span><input required value={form.city} onChange={(e) => update("city", e.target.value)} autoComplete="address-level2" /></label><label><span>State</span><input required value={form.state} onChange={(e) => update("state", e.target.value)} autoComplete="address-level1" /></label><label><span>ZIP Code</span><input required value={form.zip} onChange={(e) => update("zip", e.target.value)} autoComplete="postal-code" /></label></div></div><div className="checkout-section"><span className="checkout-section__eyebrow">PAYMENT</span><h2>Choose Payment Method</h2><div className="checkout-payment-content"><div className="checkout-provider-heading"><strong>Credit or Debit Card</strong><span>Securely processed by Stripe</span></div>{!addressReady && <p className="checkout-payment-loading">Enter your delivery information to securely initialize the payment form and calculate shipping and tax.</p>}<div ref={stripePaymentRef} className="checkout-stripe-payment-element" />{error && <p className="checkout-error" role="alert">{error}</p>}<button className="checkout-payment-action" type="submit" disabled={loading || !stripeReady}>{loading ? "Processing…" : "Pay Securely with Card"}<span>→</span></button></div><div className="checkout-payment-content"><div className="checkout-provider-heading"><strong>Apple Pay</strong><span>Securely processed by Stripe</span></div><div ref={stripeAppleRef} className="checkout-stripe-apple-element" style={{ display: stripeReady && appleAvailable === false ? "none" : "block" }} />{!addressReady && <p className="checkout-payment-loading">Enter your delivery information to initialize Apple Pay.</p>}{stripeReady && appleAvailable === false && <p className="checkout-payment-loading">Apple Pay is not available on this device or browser.</p>}{stripeReady && appleAvailable === null && <p className="checkout-payment-loading">Checking Apple Pay availability…</p>}</div><div className="checkout-payment-content"><div className="checkout-provider-heading"><strong>PayPal</strong><span>Secure payment</span></div>{paypalLoading && <p className="checkout-payment-loading">Loading PayPal…</p>}<div ref={paypalContainerRef} className="checkout-paypal-button" />{!paypalLoading && !paypalEnabled && !paypalError && <p className="checkout-payment-loading">PayPal is not enabled in production yet.</p>}{paypalError && <p className="checkout-error" role="alert">{paypalError}</p>}</div><p className="checkout-security-note">Your card details are entered directly into Stripe's secure payment field. Magic Touch Designs does not store full card details.</p></div></div><aside className="checkout-summary"><div className="checkout-summary__header"><span>YOUR ORDER</span><h2>Order Summary</h2></div><div className="checkout-summary__items">{cartItems.map((item) => <div className="checkout-summary__item" key={`${item.id}-${item.model}-${item.size}-${item.color}-${item.customizationId || "standard"}`}><div className="checkout-summary__image"><img src={item.customizationId ? getCustomizationSession(item.customizationId)?.designDataUrl || item.image : item.image} alt={item.name} /></div><div className="checkout-summary__details"><strong>{item.name}</strong><span>{item.customizationId ? "Custom mug" : "Mug"} · Qty: {item.quantity}</span></div><strong>${(item.price * item.quantity).toFixed(2)}</strong></div>)}</div><div className="checkout-summary__totals"><div><span>Subtotal</span><strong>${subtotal.toFixed(2)}</strong></div><div><span>Shipping</span><strong>{quoteLoading ? "Calculating…" : `$${shipping.toFixed(2)}`}</strong></div><div><span>Sales Tax</span><strong>{quoteLoading ? "Calculating…" : tax === null ? "Enter address" : `$${tax.toFixed(2)}`}</strong></div><div className="checkout-summary__total"><span>Total</span><strong>{quoteLoading ? "Calculating…" : `$${baseTotal.toFixed(2)}`}</strong></div></div>{quote?.shippingCarrier && <p className="checkout-summary__note">Shipping: {quote.shippingCarrier}{quote.shippingService ? ` · ${quote.shippingService}` : ""}{quote.shippingDeliveryDays ? ` · ${quote.shippingDeliveryDays} business days` : ""}</p>}{quoteError && <p className="checkout-error" role="alert">{quoteError}</p>}<p className="checkout-summary__note">Shipping and applicable sales tax are calculated from the delivery destination. Final payment totals are recalculated securely by the server.</p><Link to="/cart">← Back to Cart</Link></aside></form></section></main><Footer /></>);
}
export default CheckoutPage;