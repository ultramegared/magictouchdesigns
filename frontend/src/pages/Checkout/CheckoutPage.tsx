/**
 * ================================================================
 * Magic Touch Designs - CheckoutPage.tsx
 * Secure checkout with Card, Apple Pay and PayPal.
 * Payment details are handled by the payment providers.
 * ================================================================
 */

import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./CheckoutPage.css";
import "./CheckoutPaymentMethods.css";
import Header from "../../components/layout/Header";
import Footer from "../../components/home/Footer";
import { getCartItems, type CartItem } from "../../utils/cart";

const API_URL = "https://api.magictouchdesigns.com/api";
const PAYPAL_CONFIRMATION_KEY = "mtd-paypal-confirmation";

type StripePaymentElement = { mount: (element: HTMLElement) => void; unmount?: () => void };
type StripeExpressElement = { mount: (element: HTMLElement) => void; unmount?: () => void; on: (event: string, handler: (payload: any) => void) => void };
type StripeActions = { confirm: (options?: any) => Promise<any> };
type StripeCheckout = { createPaymentElement: (options?: any) => StripePaymentElement; createExpressCheckoutElement: (options?: any) => StripeExpressElement; loadActions: () => Promise<{ type: "success"; actions: StripeActions } | { type: "error"; error: { message: string } }> };
type StripeInstance = { initCheckout: (options: any) => StripeCheckout };
type PayPalSdk = { createInstance: (options: { clientId: string; components: string[]; pageType: string; locale?: string }) => Promise<any> };

declare global {
    interface Window {
        Stripe?: (publishableKey: string) => StripeInstance;
        paypal?: PayPalSdk;
    }
}

const loadScript = (id: string, src: string): Promise<void> => {
    if (document.getElementById(id)) return Promise.resolve();
    return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.id = id;
        script.async = true;
        script.src = src;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Secure payment provider could not be loaded."));
        document.head.appendChild(script);
    });
};

const loadStripeSdk = () => loadScript("stripe-js-clover", "https://js.stripe.com/clover/stripe.js");
const loadPayPalSdk = (environment: string) => loadScript("paypal-web-sdk-v6", environment === "sandbox" ? "https://www.sandbox.paypal.com/web-sdk/v6/core" : "https://www.paypal.com/web-sdk/v6/core");

function CheckoutPage() {
    const navigate = useNavigate();
    const formRef = useRef<HTMLFormElement>(null);
    const formStateRef = useRef({ firstName: "", lastName: "", email: "", phone: "", deliveryType: "house" as "house" | "apartment", address: "", apartment: "", city: "", state: "", zip: "" });
    const stripePaymentRef = useRef<HTMLDivElement>(null);
    const stripeAppleRef = useRef<HTMLDivElement>(null);
    const stripeActionsRef = useRef<StripeActions | null>(null);
    const stripeSessionIdRef = useRef("");
    const stripeOrderCodeRef = useRef("");
    const stripeElementsCleanupRef = useRef<(() => void) | null>(null);
    const paypalContainerRef = useRef<HTMLDivElement>(null);
    const paypalCleanupRef = useRef<(() => void) | null>(null);
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [form, setForm] = useState(formStateRef.current);
    const [selectedMethod, setSelectedMethod] = useState<"card" | "apple" | "paypal">("card");
    const [loading, setLoading] = useState(false);
    const [stripeReady, setStripeReady] = useState(false);
    const [applePayAvailable, setApplePayAvailable] = useState<boolean | null>(null);
    const [paypalLoading, setPaypalLoading] = useState(true);
    const [paypalEnabled, setPaypalEnabled] = useState(false);
    const [error, setError] = useState("");
    const [paypalError, setPaypalError] = useState("");

    useEffect(() => { formStateRef.current = form; }, [form]);
    useEffect(() => { const items = getCartItems(); setCartItems(items); if (!items.length) navigate("/cart", { replace: true }); }, [navigate]);
    useEffect(() => () => { stripeElementsCleanupRef.current?.(); paypalCleanupRef.current?.(); }, []);

    const subtotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
    const shipping = subtotal > 0 ? 5.99 : 0;
    const updateField = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));
    const buildPaymentPayload = () => ({ customer: formStateRef.current, items: cartItems.map((item) => ({ productId: String(item.id), quantity: item.quantity, model: item.model, size: item.size, color: item.color })) });
    const validateCustomer = () => Boolean(formRef.current?.reportValidity());

    const prepareStripe = async () => {
        if (stripeReady) return;
        if (!validateCustomer()) return;
        setError("");
        setLoading(true);
        try {
            const configResponse = await fetch(`${API_URL}/orders/stripe/config`);
            const config = await configResponse.json() as { enabled?: boolean; publishableKey?: string | null };
            if (!config.enabled || !config.publishableKey) throw new Error("Card payments are temporarily unavailable. Please try again later.");
            await loadStripeSdk();
            if (!window.Stripe) throw new Error("Stripe.js could not be loaded securely.");
            const response = await fetch(`${API_URL}/orders/stripe/custom`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(buildPaymentPayload()) });
            const data = await response.json() as { clientSecret?: string; orderCode?: string; sessionId?: string; message?: string };
            if (!response.ok || !data.clientSecret || !data.orderCode || !data.sessionId) throw new Error(data.message || "Unable to start Stripe checkout.");
            const stripe = window.Stripe(config.publishableKey);
            const checkout = stripe.initCheckout({ clientSecret: data.clientSecret, defaultValues: { email: formStateRef.current.email.trim().toLowerCase(), phoneNumber: formStateRef.current.phone.trim(), shippingAddress: { name: `${formStateRef.current.firstName} ${formStateRef.current.lastName}`.trim(), address: { country: "US", line1: formStateRef.current.address, line2: formStateRef.current.apartment || undefined, city: formStateRef.current.city, state: formStateRef.current.state.toUpperCase(), postal_code: formStateRef.current.zip } } } });
            const actionsResult = await checkout.loadActions();
            if (actionsResult.type !== "success") throw new Error(actionsResult.error.message || "Stripe checkout could not initialize.");
            stripeActionsRef.current = actionsResult.actions;
            stripeSessionIdRef.current = data.sessionId;
            stripeOrderCodeRef.current = data.orderCode;
            const paymentElement = checkout.createPaymentElement({ layout: "tabs", wallets: { applePay: "never", googlePay: "never", link: "never" } });
            const expressElement = checkout.createExpressCheckoutElement({ buttonHeight: 52, buttonType: { applePay: "check-out" }, buttonTheme: { applePay: "black" }, paymentMethodOrder: ["apple_pay"] });
            const paymentHost = stripePaymentRef.current;
            const appleHost = stripeAppleRef.current;
            if (!paymentHost || !appleHost) throw new Error("Stripe payment area is unavailable.");
            paymentHost.replaceChildren();
            appleHost.replaceChildren();
            paymentElement.mount(paymentHost);
            expressElement.mount(appleHost);
            expressElement.on("ready", (event: { availablePaymentMethods?: Record<string, unknown> | null }) => setApplePayAvailable(Boolean(event.availablePaymentMethods?.applePay)));
            expressElement.on("confirm", async (event: any) => {
                setError("");
                setLoading(true);
                try {
                    const result = await actionsResult.actions.confirm({ expressCheckoutConfirmEvent: event });
                    if (result?.type === "error") { setError(result.error?.message || "Apple Pay payment could not be completed."); setLoading(false); }
                } catch (confirmError: unknown) { setError(confirmError instanceof Error ? confirmError.message : "Apple Pay payment could not be completed."); setLoading(false); }
            });
            stripeElementsCleanupRef.current = () => { paymentElement.unmount?.(); expressElement.unmount?.(); paymentHost.replaceChildren(); appleHost.replaceChildren(); stripeActionsRef.current = null; };
            setStripeReady(true);
            setLoading(false);
        } catch (stripeError: unknown) {
            setError(stripeError instanceof Error ? stripeError.message : "Unable to load secure Stripe payment.");
            setLoading(false);
        }
    };

    const selectPaymentMethod = (method: "card" | "apple" | "paypal") => {
        setSelectedMethod(method);
        setError("");
        setPaypalError("");
        if ((method === "card" || method === "apple") && !stripeReady) void prepareStripe();
    };

    const submitCardPayment = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!stripeReady) { await prepareStripe(); return; }
        const actions = stripeActionsRef.current;
        if (!actions) { setError("Secure card payment is not ready. Please try again."); return; }
        setError("");
        setLoading(true);
        try {
            const result = await actions.confirm({ redirect: "if_required", email: formStateRef.current.email.trim().toLowerCase(), phoneNumber: formStateRef.current.phone.trim() });
            if (result?.type === "error") { setError(result.error?.message || "Card payment could not be completed."); setLoading(false); return; }
            if (result?.type === "success") window.location.assign(`/checkout/success?session_id=${encodeURIComponent(stripeSessionIdRef.current)}&order_code=${encodeURIComponent(stripeOrderCodeRef.current)}`);
        } catch (confirmError: unknown) { setError(confirmError instanceof Error ? confirmError.message : "Card payment could not be completed."); setLoading(false); }
    };

    useEffect(() => {
        let cancelled = false;
        const setupPayPal = async () => {
            if (!cartItems.length) { setPaypalLoading(false); return; }
            try {
                const response = await fetch(`${API_URL}/orders/paypal/config`);
                const config = await response.json() as { enabled?: boolean; clientId?: string; environment?: string };
                if (cancelled || !config.enabled || !config.clientId) { setPaypalLoading(false); return; }
                await loadPayPalSdk(config.environment || "sandbox");
                if (!window.paypal) throw new Error("PayPal SDK is unavailable.");
                const sdk = await window.paypal.createInstance({ clientId: config.clientId, components: ["paypal-payments"], pageType: "checkout", locale: "en-US" });
                const eligibility = await sdk.findEligibleMethods({ currencyCode: "USD" });
                if (cancelled || !eligibility.isEligible("paypal")) { setPaypalLoading(false); return; }
                const session = sdk.createPayPalOneTimePaymentSession({
                    onApprove: async ({ orderId }: { orderId: string }) => {
                        const capture = await fetch(`${API_URL}/orders/paypal/${encodeURIComponent(orderId)}/capture`, { method: "POST", headers: { "Content-Type": "application/json" } });
                        const data = await capture.json() as { orderCode?: string; message?: string };
                        if (!capture.ok || !data.orderCode) throw new Error(data.message || "PayPal payment could not be completed.");
                        window.location.assign(`/checkout/success?paypal=1&order_code=${encodeURIComponent(data.orderCode)}`);
                    },
                    onCancel: () => setPaypalError("PayPal checkout was cancelled. You can choose another payment method."),
                    onError: (paypalPaymentError: Error) => setPaypalError(paypalPaymentError.message || "PayPal payment could not be started."),
                });
                const container = paypalContainerRef.current;
                if (!container) return;
                container.replaceChildren();
                const button = document.createElement("paypal-button");
                button.setAttribute("type", "pay");
                button.setAttribute("aria-label", "Pay with PayPal");
                const handleClick = async () => {
                    setPaypalError("");
                    if (!validateCustomer()) return;
                    try {
                        await session.start({ presentationMode: "auto" }, (async () => {
                            const create = await fetch(`${API_URL}/orders/paypal/create`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(buildPaymentPayload()) });
                            const data = await create.json() as { paypalOrderId?: string; orderCode?: string; message?: string };
                            if (!create.ok || !data.paypalOrderId || !data.orderCode) throw new Error(data.message || "Unable to create PayPal payment.");
                            sessionStorage.setItem(PAYPAL_CONFIRMATION_KEY, JSON.stringify({ orderCode: data.orderCode, email: formStateRef.current.email.trim().toLowerCase() }));
                            return { orderId: data.paypalOrderId };
                        })());
                    } catch (paypalStartError: unknown) { setPaypalError(paypalStartError instanceof Error ? paypalStartError.message : "PayPal payment could not be started."); }
                };
                button.addEventListener("click", handleClick);
                container.appendChild(button);
                setPaypalEnabled(true);
                setPaypalLoading(false);
                paypalCleanupRef.current = () => { button.removeEventListener("click", handleClick); container.replaceChildren(); };
            } catch (setupError) { if (cancelled) return; console.error("PayPal setup error:", setupError); setPaypalError("PayPal is temporarily unavailable. You can still use Card or Apple Pay."); setPaypalLoading(false); }
        };
        void setupPayPal();
        return () => { cancelled = true; paypalCleanupRef.current?.(); paypalCleanupRef.current = null; };
    }, [cartItems.length]);

    return (
        <>
            <Header />
            <main className="checkout-page">
                <section className="checkout-hero"><div className="checkout-hero__background"><img src="/images/cart/cart-hero-background.jpg" alt="Magic Touch Designs" /></div><div className="checkout-hero__overlay" /><div className="checkout-hero__content"><span>SECURE CHECKOUT</span><h1>Complete Your Order</h1><p>Enter your delivery information and choose your secure payment method.</p></div></section>
                <section className="checkout-container">
                    <form ref={formRef} className="checkout-grid" onSubmit={submitCardPayment}>
                        <div className="checkout-form">
                            <div className="checkout-section"><span className="checkout-section__eyebrow">CUSTOMER INFORMATION</span><h2>Your Details</h2><div className="checkout-fields">
                                <label><span>First Name</span><input required value={form.firstName} onChange={(e) => updateField("firstName", e.target.value)} autoComplete="given-name" /></label>
                                <label><span>Last Name</span><input required value={form.lastName} onChange={(e) => updateField("lastName", e.target.value)} autoComplete="family-name" /></label>
                                <label className="checkout-field--full"><span>Email Address</span><input required type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} autoComplete="email" /></label>
                                <label className="checkout-field--full"><span>Phone Number</span><input value={form.phone} onChange={(e) => updateField("phone", e.target.value)} autoComplete="tel" /></label>
                            </div></div>
                            <div className="checkout-section"><span className="checkout-section__eyebrow">DELIVERY</span><h2>Shipping Address</h2><div className="checkout-address-types">
                                <button type="button" className={`checkout-address-type ${form.deliveryType === "house" ? "checkout-address-type--active" : ""}`} onClick={() => updateField("deliveryType", "house")}><span className="checkout-address-type__icon">🏠</span><span><strong>House</strong><small>Residential home</small></span></button>
                                <button type="button" className={`checkout-address-type ${form.deliveryType === "apartment" ? "checkout-address-type--active" : ""}`} onClick={() => updateField("deliveryType", "apartment")}><span className="checkout-address-type__icon">🏢</span><span><strong>Apartment</strong><small>Apartment or unit</small></span></button>
                            </div><div className="checkout-fields">
                                <label className="checkout-field--full"><span>Street Address</span><input required value={form.address} onChange={(e) => updateField("address", e.target.value)} autoComplete="street-address" /></label>
                                {form.deliveryType === "apartment" && <label className="checkout-field--full"><span>Apartment / Unit Number</span><input required value={form.apartment} onChange={(e) => updateField("apartment", e.target.value)} autoComplete="address-line2" />}</label>}
                                <label><span>City</span><input required value={form.city} onChange={(e) => updateField("city", e.target.value)} autoComplete="address-level2" /></label>
                                <label><span>State</span><input required value={form.state} onChange={(e) => updateField("state", e.target.value)} autoComplete="address-level1" /></label>
                                <label><span>ZIP Code</span><input required value={form.zip} onChange={(e) => updateField("zip", e.target.value)} autoComplete="postal-code" inputMode="numeric" /></label>
                            </div></div>
                            <div className="checkout-section"><span className="checkout-section__eyebrow">PAYMENT</span><h2>Choose Payment Method</h2>
                                <div className="checkout-payment-methods">
                                    <button type="button" className={`checkout-method-option ${selectedMethod === "card" ? "checkout-method-option--active" : ""}`} onClick={() => selectPaymentMethod("card")}><span className="checkout-method-option__icon">💳</span><span><strong>Credit / Debit Card</strong><small>Visa, Mastercard, American Express and other major cards</small></span></button>
                                    <button type="button" className={`checkout-method-option ${selectedMethod === "apple" ? "checkout-method-option--active" : ""}`} onClick={() => selectPaymentMethod("apple")}><span className="checkout-method-option__icon"></span><span><strong>Apple Pay</strong><small>Fast, secure payment with Apple Wallet</small></span></button>
                                    <button type="button" className={`checkout-method-option ${selectedMethod === "paypal" ? "checkout-method-option--active" : ""}`} onClick={() => selectPaymentMethod("paypal")}><span className="checkout-method-option__icon">P</span><span><strong>PayPal</strong><small>Pay securely with your PayPal account</small></span></button>
                                </div>
                                <div className="checkout-method-panel" hidden={selectedMethod !== "card"}><p>Credit and debit cards — secure payment powered by Stripe.</p><div ref={stripePaymentRef} className="checkout-stripe-payment-element" />{!stripeReady && <button className="checkout-payment-action" type="submit" disabled={loading || !cartItems.length}>{loading ? "Loading secure card form…" : "Load Secure Card Payment"}<span>→</span></button>}{stripeReady && <button className="checkout-payment-action" type="submit" disabled={loading || !cartItems.length}>{loading ? "Processing…" : "Pay Securely with Card"}<span>→</span></button>}</div>
                                <div className="checkout-method-panel" hidden={selectedMethod !== "apple"}><p>Apple Pay is shown by Stripe only when this device, browser, Wallet and merchant domain are eligible.</p><div ref={stripeAppleRef} className="checkout-stripe-apple-element" />{!stripeReady && <button className="checkout-payment-action" type="button" disabled={loading || !cartItems.length} onClick={() => void prepareStripe()}>{loading ? "Loading Apple Pay…" : "Enable Apple Pay"}<span></span></button>}{stripeReady && applePayAvailable === false && <p className="checkout-payment-loading">Apple Pay is not available on this device or browser.</p>}{stripeReady && applePayAvailable === null && <p className="checkout-payment-loading">Checking Apple Pay availability…</p>}</div>
                                <div className="checkout-method-panel" hidden={selectedMethod !== "paypal"}><p>Secure PayPal checkout.</p>{paypalLoading && <p className="checkout-payment-loading">Loading PayPal…</p>}<div ref={paypalContainerRef} className="checkout-paypal-button" />{!paypalLoading && !paypalEnabled && !paypalError && <p className="checkout-payment-loading">PayPal is not enabled in the payment configuration.</p>}{paypalError && <p role="alert" className="checkout-error">{paypalError}</p>}</div>
                                {error && <p role="alert" className="checkout-error">{error}</p>}
                                <p className="checkout-security-note">Your card number, expiration date and security code are entered directly into Stripe’s secure payment fields. Magic Touch Designs does not store full card details.</p>
                            </div>
                        </div>
                        <aside className="checkout-summary"><div className="checkout-summary__header"><span>YOUR ORDER</span><h2>Order Summary</h2></div><div className="checkout-summary__items">{cartItems.map((item) => <div className="checkout-summary__item" key={`${item.id}-${item.model}-${item.size}-${item.color}`}><div className="checkout-summary__image"><img src={item.image} alt={item.name} /></div><div className="checkout-summary__details"><strong>{item.name}</strong><span>Qty: {item.quantity}</span></div><strong>${(item.price * item.quantity).toFixed(2)}</strong></div>)}</div><div className="checkout-summary__totals"><div><span>Subtotal</span><strong>${subtotal.toFixed(2)}</strong></div><div><span>Shipping</span><strong>${shipping.toFixed(2)}</strong></div><div><span>Sales Tax</span><span>Calculated from destination</span></div><div className="checkout-summary__total"><span>Total before tax</span><strong>${(subtotal + shipping).toFixed(2)} + tax</strong></div></div><p className="checkout-summary__note">Sales tax is calculated from the shipping destination. Shipping is charged to the customer.</p><Link to="/cart">← Back to Cart</Link></aside>
                    </form>
                </section>
            </main><Footer />
        </>
    );
}

export default CheckoutPage;