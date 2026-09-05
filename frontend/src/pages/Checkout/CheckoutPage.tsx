import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./CheckoutPage.css";
import Header from "../../components/layout/Header";
import Footer from "../../components/home/Footer";
import { getCartItems, type CartItem } from "../../utils/cart";

const API_URL = "https://api.magictouchdesigns.com/api";

type StripePaymentElement = { mount: (el: HTMLElement) => void; unmount?: () => void };
type StripeExpressElement = { mount: (el: HTMLElement) => void; unmount?: () => void; on: (event: string, handler: (payload: any) => void) => void };
type StripeActions = { confirm: (options?: any) => Promise<any> };
type StripeCheckout = {
    createPaymentElement: (options?: any) => StripePaymentElement;
    createExpressCheckoutElement: (options?: any) => StripeExpressElement;
    loadActions: () => Promise<{ type: "success"; actions: StripeActions } | { type: "error"; error: { message: string } }>;
};
type StripeInstance = { initCheckout: (options: any) => StripeCheckout };
type PayPalSdk = { createInstance: (options: { clientId: string; components: string[]; pageType: string; locale?: string }) => Promise<any> };

declare global {
    interface Window { Stripe?: (key: string) => StripeInstance; paypal?: PayPalSdk; }
}

const loadScript = (id: string, src: string) => new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(id);
    if (existing) { resolve(); return; }
    const script = document.createElement("script");
    script.id = id; script.async = true; script.src = src;
    script.onload = () => resolve(); script.onerror = () => reject(new Error("Secure payment provider could not be loaded."));
    document.head.appendChild(script);
});

const requiredCheckoutFields = (form: Record<string, string>) => Boolean(
    form.firstName.trim() && form.lastName.trim() && form.email.trim() && form.address.trim() && form.city.trim() && form.state.trim() && form.zip.trim() &&
    (form.deliveryType !== "apartment" || form.apartment.trim())
);

function CheckoutPage() {
    const navigate = useNavigate();
    const formRef = useRef<HTMLFormElement>(null);
    const stripePaymentRef = useRef<HTMLDivElement>(null);
    const stripeAppleRef = useRef<HTMLDivElement>(null);
    const stripeActionsRef = useRef<StripeActions | null>(null);
    const stripeSessionIdRef = useRef("");
    const stripeOrderCodeRef = useRef("");
    const stripeCleanupRef = useRef<(() => void) | null>(null);
    const stripeInitRef = useRef(false);
    const paypalContainerRef = useRef<HTMLDivElement>(null);
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", deliveryType: "house" as "house" | "apartment", address: "", apartment: "", city: "", state: "", zip: "" });
    const [paymentMethod, setPaymentMethod] = useState<"card" | "apple" | "paypal">("card");
    const [stripeReady, setStripeReady] = useState(false);
    const [appleAvailable, setAppleAvailable] = useState<boolean | null>(null);
    const [paypalEnabled, setPaypalEnabled] = useState(false);
    const [paypalLoading, setPaypalLoading] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [paypalError, setPaypalError] = useState("");

    useEffect(() => { const items = getCartItems(); setCartItems(items); if (!items.length) navigate("/cart", { replace: true }); }, [navigate]);
    useEffect(() => () => { stripeCleanupRef.current?.(); }, []);

    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = subtotal > 0 ? 5.99 : 0;
    const baseTotal = subtotal + shipping;
    const updateField = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));
    const validCustomer = () => Boolean(formRef.current?.reportValidity()) && requiredCheckoutFields(form);
    const payload = () => ({ customer: form, items: cartItems.map((item) => ({ productId: String(item.id), quantity: item.quantity, model: item.model, size: item.size, color: item.color })) });

    const prepareStripe = async () => {
        if (stripeReady || stripeInitRef.current) return;
        if (!validCustomer()) return;
        stripeInitRef.current = true; setLoading(true); setError("");
        try {
            const configResponse = await fetch(`${API_URL}/orders/stripe/config`);
            const config = await configResponse.json() as { enabled?: boolean; publishableKey?: string };
            if (!config.enabled || !config.publishableKey) throw new Error("Card payments are not configured yet.");
            await loadScript("stripe-js-clover", "https://js.stripe.com/clover/stripe.js");
            if (!window.Stripe) throw new Error("Stripe could not be loaded.");
            const response = await fetch(`${API_URL}/orders/stripe/custom`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload()) });
            const data = await response.json() as { clientSecret?: string; orderCode?: string; sessionId?: string; message?: string };
            if (!response.ok || !data.clientSecret || !data.orderCode || !data.sessionId) throw new Error(data.message || "Unable to start secure card payment.");
            const checkout = window.Stripe(config.publishableKey).initCheckout({ clientSecret: data.clientSecret, defaultValues: { email: form.email.trim().toLowerCase(), phoneNumber: form.phone.trim(), shippingAddress: { name: `${form.firstName} ${form.lastName}`.trim(), address: { country: "US", line1: form.address, line2: form.apartment || undefined, city: form.city, state: form.state.toUpperCase(), postal_code: form.zip } } } });
            const actionsResult = await checkout.loadActions();
            if (actionsResult.type !== "success") throw new Error(actionsResult.error.message || "Stripe checkout could not initialize.");
            stripeActionsRef.current = actionsResult.actions; stripeSessionIdRef.current = data.sessionId; stripeOrderCodeRef.current = data.orderCode;
            const payment = checkout.createPaymentElement({ layout: "tabs", wallets: { applePay: "never", googlePay: "never", link: "never" } });
            const express = checkout.createExpressCheckoutElement({ buttonHeight: 52, buttonType: { applePay: "check-out" }, buttonTheme: { applePay: "black" }, paymentMethodOrder: ["apple_pay"] });
            const paymentHost = stripePaymentRef.current; const appleHost = stripeAppleRef.current;
            if (!paymentHost || !appleHost) throw new Error("Payment area is unavailable.");
            paymentHost.replaceChildren(); appleHost.replaceChildren(); payment.mount(paymentHost); express.mount(appleHost);
            express.on("ready", (event: { availablePaymentMethods?: Record<string, unknown> | null }) => setAppleAvailable(Boolean(event.availablePaymentMethods?.applePay)));
            express.on("confirm", async (event: any) => {
                setLoading(true); setError("");
                try {
                    const result = await actionsResult.actions.confirm({ expressCheckoutConfirmEvent: event });
                    if (result?.type === "error") { setError(result.error?.message || "Apple Pay payment could not be completed."); setLoading(false); }
                } catch (e) { setError(e instanceof Error ? e.message : "Apple Pay payment could not be completed."); setLoading(false); }
            });
            stripeCleanupRef.current = () => { payment.unmount?.(); express.unmount?.(); paymentHost.replaceChildren(); appleHost.replaceChildren(); stripeActionsRef.current = null; };
            setStripeReady(true);
        } catch (e) { stripeInitRef.current = false; setError(e instanceof Error ? e.message : "Unable to load secure card payment."); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        if ((paymentMethod === "card" || paymentMethod === "apple") && requiredCheckoutFields(form) && cartItems.length && !stripeReady && !stripeInitRef.current) void prepareStripe();
    }, [paymentMethod, form.firstName, form.lastName, form.email, form.address, form.apartment, form.city, form.state, form.zip, cartItems.length]);

    const submitCard = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!stripeReady) { await prepareStripe(); return; }
        const actions = stripeActionsRef.current; if (!actions) { setError("Secure card payment is not ready."); return; }
        setLoading(true); setError("");
        try {
            const result = await actions.confirm({ redirect: "if_required", email: form.email.trim().toLowerCase(), phoneNumber: form.phone.trim() });
            if (result?.type === "error") { setError(result.error?.message || "Card payment could not be completed."); setLoading(false); return; }
            if (result?.type === "success") window.location.assign(`/checkout/success?session_id=${encodeURIComponent(stripeSessionIdRef.current)}&order_code=${encodeURIComponent(stripeOrderCodeRef.current)}`);
        } catch (e) { setError(e instanceof Error ? e.message : "Card payment could not be completed."); setLoading(false); }
    };

    useEffect(() => {
        let cancelled = false;
        const setupPayPal = async () => {
            if (!cartItems.length) { setPaypalLoading(false); return; }
            try {
                const response = await fetch(`${API_URL}/orders/paypal/config`);
                const config = await response.json() as { enabled?: boolean; clientId?: string; environment?: string };
                if (cancelled || !config.enabled || !config.clientId) { setPaypalLoading(false); return; }
                await loadScript("paypal-web-sdk-v6", config.environment === "live" ? "https://www.paypal.com/web-sdk/v6/core" : "https://www.sandbox.paypal.com/web-sdk/v6/core");
                if (!window.paypal) throw new Error("PayPal SDK is unavailable.");
                const sdk = await window.paypal.createInstance({ clientId: config.clientId, components: ["paypal-payments"], pageType: "checkout", locale: "en-US" });
                const eligible = await sdk.findEligibleMethods({ currencyCode: "USD" });
                if (!eligible.isEligible("paypal")) { setPaypalLoading(false); return; }
                const session = sdk.createPayPalOneTimePaymentSession({
                    onApprove: async ({ orderId }: { orderId: string }) => {
                        const capture = await fetch(`${API_URL}/orders/paypal/${encodeURIComponent(orderId)}/capture`, { method: "POST", headers: { "Content-Type": "application/json" } });
                        const data = await capture.json() as { orderCode?: string; message?: string };
                        if (!capture.ok || !data.orderCode) throw new Error(data.message || "PayPal payment could not be completed.");
                        window.location.assign(`/checkout/success?paypal=1&order_code=${encodeURIComponent(data.orderCode)}`);
                    },
                    onCancel: () => setPaypalError("PayPal checkout was cancelled."),
                    onError: (e: Error) => setPaypalError(e.message || "PayPal payment could not be started."),
                });
                const container = paypalContainerRef.current; if (!container) return;
                container.replaceChildren();
                const button = document.createElement("paypal-button"); button.setAttribute("type", "pay"); button.setAttribute("aria-label", "Pay with PayPal");
                button.addEventListener("click", async () => {
                    if (!validCustomer()) return; setPaypalError("");
                    try { await session.start({ presentationMode: "auto" }, async () => { const create = await fetch(`${API_URL}/orders/paypal/create`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload()) }); const data = await create.json() as { paypalOrderId?: string; message?: string }; if (!create.ok || !data.paypalOrderId) throw new Error(data.message || "Unable to create PayPal payment."); return { orderId: data.paypalOrderId }; }); }
                    catch (e) { setPaypalError(e instanceof Error ? e.message : "PayPal payment could not be started."); }
                });
                container.appendChild(button); setPaypalEnabled(true); setPaypalLoading(false);
            } catch (e) { if (!cancelled) { console.error(e); setPaypalLoading(false); setPaypalError("PayPal is temporarily unavailable."); } }
        };
        void setupPayPal(); return () => { cancelled = true; };
    }, [cartItems.length]);

    return <>
        <Header />
        <main className="checkout-page">
            <section className="checkout-hero"><div className="checkout-hero__background"><img src="/images/cart/cart-hero-background.jpg" alt="Magic Touch Designs" /></div><div className="checkout-hero__overlay" /><div className="checkout-hero__content"><span>SECURE CHECKOUT</span><h1>Complete Your Order</h1><p>Enter your delivery information and choose your secure payment method.</p></div></section>
            <section className="checkout-container">
                <form ref={formRef} className="checkout-grid" onSubmit={submitCard}>
                    <div className="checkout-form">
                        <div className="checkout-section"><span className="checkout-section__eyebrow">CUSTOMER INFORMATION</span><h2>Your Details</h2><div className="checkout-fields">
                            <label><span>First Name</span><input required value={form.firstName} onChange={e => updateField("firstName", e.target.value)} autoComplete="given-name" /></label>
                            <label><span>Last Name</span><input required value={form.lastName} onChange={e => updateField("lastName", e.target.value)} autoComplete="family-name" /></label>
                            <label className="checkout-field--full"><span>Email Address</span><input required type="email" value={form.email} onChange={e => updateField("email", e.target.value)} autoComplete="email" /></label>
                            <label className="checkout-field--full"><span>Phone Number</span><input value={form.phone} onChange={e => updateField("phone", e.target.value)} autoComplete="tel" /></label>
                        </div></div>
                        <div className="checkout-section"><span className="checkout-section__eyebrow">DELIVERY</span><h2>Shipping Address</h2><div className="checkout-address-types">
                            <button type="button" className={`checkout-address-type ${form.deliveryType === "house" ? "checkout-address-type--active" : ""}`} onClick={() => updateField("deliveryType", "house")}><span className="checkout-address-type__icon">⌂</span><span><strong>House</strong><small>Residential home</small></span></button>
                            <button type="button" className={`checkout-address-type ${form.deliveryType === "apartment" ? "checkout-address-type--active" : ""}`} onClick={() => updateField("deliveryType", "apartment")}><span className="checkout-address-type__icon">⌂</span><span><strong>Apartment</strong><small>Apartment or unit</small></span></button>
                        </div><div className="checkout-fields">
                            <label className="checkout-field--full"><span>Street Address</span><input required value={form.address} onChange={e => updateField("address", e.target.value)} autoComplete="street-address" /></label>
                            {form.deliveryType === "apartment" && <label className="checkout-field--full"><span>Apartment / Unit Number</span><input required value={form.apartment} onChange={e => updateField("apartment", e.target.value)} autoComplete="address-line2" /></label>}
                            <label><span>City</span><input required value={form.city} onChange={e => updateField("city", e.target.value)} autoComplete="address-level2" /></label>
                            <label><span>State</span><input required value={form.state} onChange={e => updateField("state", e.target.value)} autoComplete="address-level1" /></label>
                            <label><span>ZIP Code</span><input required value={form.zip} onChange={e => updateField("zip", e.target.value)} autoComplete="postal-code" /></label>
                        </div></div>
                        <div className="checkout-section"><span className="checkout-section__eyebrow">PAYMENT</span><h2>Choose Payment Method</h2>
                            <div className="checkout-payment-methods">
                                <button type="button" className={`checkout-payment-method ${paymentMethod === "card" ? "checkout-payment-method--active" : ""}`} onClick={() => { setPaymentMethod("card"); setError(""); }}><span className="checkout-payment-method__icon">▣</span><span><strong>Credit / Debit Card</strong><small>Visa, Mastercard, American Express, Discover</small></span></button>
                                <button type="button" className={`checkout-payment-method ${paymentMethod === "apple" ? "checkout-payment-method--active" : ""}`} onClick={() => { setPaymentMethod("apple"); setError(""); }}><span className="checkout-payment-method__icon"></span><span><strong>Apple Pay</strong><small>Pay with Apple Wallet when available</small></span></button>
                                <button type="button" className={`checkout-payment-method ${paymentMethod === "paypal" ? "checkout-payment-method--active" : ""}`} onClick={() => { setPaymentMethod("paypal"); setError(""); }}><span className="checkout-payment-method__icon">P</span><span><strong>PayPal</strong><small>Secure payment with PayPal</small></span></button>
                            </div>
                            {paymentMethod === "card" && <div className="checkout-payment-content"><div className="checkout-provider-heading"><strong>Credit or Debit Card</strong><span>Securely processed by Stripe</span></div><div ref={stripePaymentRef} className="checkout-stripe-payment-element" />{!stripeReady && <button className="checkout-payment-action" type="submit" disabled={loading}>{loading ? "Loading secure card fields…" : "Load Secure Card Payment"}<span>→</span></button>}{stripeReady && <button className="checkout-payment-action" type="submit" disabled={loading}>{loading ? "Processing…" : "Pay Securely with Card"}<span>→</span></button>}</div>}
                            {paymentMethod === "apple" && <div className="checkout-payment-content"><div className="checkout-provider-heading"><strong>Apple Pay</strong><span>Securely processed by Stripe</span></div><div ref={stripeAppleRef} className="checkout-stripe-apple-element" />{stripeReady && appleAvailable === false && <p className="checkout-payment-loading">Apple Pay is not available on this device or browser.</p>}{stripeReady && appleAvailable === null && <p className="checkout-payment-loading">Checking Apple Pay availability…</p>}{!stripeReady && <button className="checkout-payment-action" type="button" disabled={loading} onClick={() => void prepareStripe()}>{loading ? "Loading Apple Pay…" : "Check Apple Pay"}<span></span></button>}</div>}
                            {paymentMethod === "paypal" && <div className="checkout-payment-content"><div className="checkout-provider-heading"><strong>PayPal</strong><span>Secure payment</span></div>{paypalLoading && <p className="checkout-payment-loading">Loading PayPal…</p>}<div ref={paypalContainerRef} className="checkout-paypal-button" />{!paypalLoading && !paypalEnabled && !paypalError && <p className="checkout-payment-loading">PayPal is not enabled in production yet.</p>}{paypalError && <p className="checkout-error">{paypalError}</p>}</div>}
                            {error && <p className="checkout-error" role="alert">{error}</p>}
                            <p className="checkout-security-note">Your card number, expiration date and security code are entered into Stripe's secure payment field. Magic Touch Designs does not store full card details.</p>
                        </div>
                    </div>
                    <aside className="checkout-summary"><div className="checkout-summary__header"><span>YOUR ORDER</span><h2>Order Summary</h2></div><div className="checkout-summary__items">{cartItems.map(item => <div className="checkout-summary__item" key={`${item.id}-${item.model}-${item.size}-${item.color}`}><div className="checkout-summary__image"><img src={item.image} alt={item.name} /></div><div className="checkout-summary__details"><strong>{item.name}</strong><span>Qty: {item.quantity}</span></div><strong>${(item.price * item.quantity).toFixed(2)}</strong></div>)}</div><div className="checkout-summary__totals"><div><span>Subtotal</span><strong>${subtotal.toFixed(2)}</strong></div><div><span>Shipping</span><strong>${shipping.toFixed(2)}</strong></div><div><span>Sales Tax</span><span>Calculated at checkout</span></div><div className="checkout-summary__total"><span>Total</span><strong>${baseTotal.toFixed(2)}+</strong></div></div><p className="checkout-summary__note">Applicable sales tax is calculated from the shipping destination. Shipping is charged to the customer.</p><Link to="/cart">← Back to Cart</Link></aside>
                </form>
            </section>
        </main>
        <Footer />
    </>;
}

export default CheckoutPage;
