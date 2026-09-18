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
    const [appleReady, setAppleReady] = useState(false);
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
    const update = (key: keyof typeof form, value: string) => {
        setForm((f) => ({ ...f, [key]: value }));
        const input = formRef.current?.elements.namedItem(key) as HTMLInputElement | null;
        if (input) input.classList.toggle("checkout-autofill-value", Boolean(value));
    };

    // Keep checkout inputs native/uncontrolled so iOS Chrome autofill is not
    // overwritten by React re-renders while the whole form is synchronized.
    const readCustomerForm = () => {
        const formEl = formRef.current;
        if (!formEl) return form;
        const values = new FormData(formEl);
        return {
            firstName: String(values.get("firstName") || ""),
            lastName: String(values.get("lastName") || ""),
            email: String(values.get("email") || ""),
            phone: String(values.get("phone") || ""),
            deliveryType: form.deliveryType,
            address: String(values.get("address") || ""),
            apartment: String(values.get("apartment") || ""),
            city: String(values.get("city") || ""),
            state: String(values.get("state") || ""),
            zip: String(values.get("zip") || ""),
        };
    };

    const syncAutofilledFields = () => {
        const next = readCustomerForm();
        setForm((current) => {
            if (
                current.firstName === next.firstName &&
                current.lastName === next.lastName &&
                current.email === next.email &&
                current.phone === next.phone &&
                current.deliveryType === next.deliveryType &&
                current.address === next.address &&
                current.apartment === next.apartment &&
                current.city === next.city &&
                current.state === next.state &&
                current.zip === next.zip
            ) return current;
            return next;
        });
        formRef.current?.querySelectorAll<HTMLInputElement>(".checkout-fields input").forEach((input) => {
            input.classList.toggle("checkout-autofill-value", Boolean(input.value));
        });
        return next;
    };

    // iOS Chrome uses WebKit and may autofill several fields without dispatching
    // React input/change events. Poll the native form as the single source of truth.
    useEffect(() => {
        const sync = () => syncAutofilledFields();
        const interval = window.setInterval(sync, 300);
        const frame = window.requestAnimationFrame(sync);
        return () => {
            window.clearInterval(interval);
            window.cancelAnimationFrame(frame);
        };
    }, []);

    const isCustomerReady = (customer: typeof form) => Boolean(
        customer.firstName.trim() &&
        customer.lastName.trim() &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email.trim()) &&
        customer.address.trim() &&
        customer.city.trim() &&
        customer.state.trim() &&
        /^\d{5}(?:-\d{4})?$/.test(customer.zip.trim()) &&
        (customer.deliveryType !== "apartment" || customer.apartment.trim())
    );

    const valid = () => {
        const customer = syncAutofilledFields();
        return Boolean(formRef.current?.reportValidity()) && isCustomerReady(customer);
    };

    const payload = (customer = readCustomerForm()) => ({ customer, items: cartItems.map((item) => {
        const session = item.customizationId ? getCustomizationSession(item.customizationId) : null;
        if (item.customizationId && (!session?.designDataUrl || session.productId !== String(item.id))) throw new Error("Your custom design session expired. Please return to Customize and upload the artwork again.");
        return { productId: String(item.id), quantity: item.quantity, model: item.model, size: item.size, color: item.color, ...(item.customizationId && session ? { customizationId: item.customizationId, customization: { productId: session.productId, productName: session.productName, size: session.size, color: session.color, designDataUrl: session.designDataUrl, designFileName: session.designFileName, designScale: session.designScale, designX: session.designX, designY: session.designY, designRotation: session.designRotation, mugRotation: session.mugRotation } } : {}) };
    }) });

    const addressReady = isCustomerReady(form);

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

    const prepareStripe = async (customer = readCustomerForm()) => {
        if (!isCustomerReady(customer)) return;
        if (stripeReady || stripeStartingRef.current) return;
        stripeStartingRef.current = true; setLoading(true); setError("");
        try {
            const cfg = (await (await fetch(`${API_URL}/orders/stripe/config`)).json()) as { enabled?: boolean; publishableKey?: string };
            if (!cfg.enabled || !cfg.publishableKey) throw new Error("Card payments are not configured yet.");
            await loadScript("stripe-js-clover", "https://js.stripe.com/clover/stripe.js");
            if (!window.Stripe) throw new Error("Stripe could not be loaded.");
            const r = await fetch(`${API_URL}/orders/stripe/custom`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload(customer)) });
            const d = (await r.json()) as { clientSecret?: string; orderCode?: string; sessionId?: string; message?: string };
            if (!r.ok || !d.clientSecret || !d.orderCode || !d.sessionId) throw new Error(d.message || "Unable to start secure card payment.");
            const checkout = window.Stripe(cfg.publishableKey).initCheckout({ clientSecret: d.clientSecret, elementsOptions: { appearance: { theme: "night", inputs: "spaced", labels: "above", variables: { colorPrimary: "#E0AD43", colorBackground: "#111111", colorText: "#F5F5F5", colorTextSecondary: "#C9C9C9", colorTextPlaceholder: "#8C8C8C", colorDanger: "#F36B6B", iconColor: "#E0AD43", borderRadius: "10px", fontSizeBase: "16px", fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif" }, rules: { ".Label": { color: "#E0AD43", fontWeight: "600" }, ".Label--focused": { color: "#F1C75B" }, ".Input": { color: "#F5F5F5", backgroundColor: "#111111", border: "1px solid #3A3A3A" }, ".Input:focus": { borderColor: "#E0AD43", boxShadow: "0 0 0 1px #E0AD43" } } } }, defaultValues: { email: customer.email.trim().toLowerCase(), phoneNumber: customer.phone.trim(), shippingAddress: { name: `${customer.firstName} ${customer.lastName}`.trim(), address: { country: "US", line1: customer.address, line2: customer.apartment || undefined, city: customer.city, state: customer.state.toUpperCase(), postal_code: customer.zip } } } });
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

    const prepareApplePay = async () => {
        if (!cartItems.length || appleReady) return;
        try {
            const cfg = (await (await fetch(`${API_URL}/orders/stripe/config`)).json()) as { enabled?: boolean; publishableKey?: string };
            if (!cfg.enabled || !cfg.publishableKey) throw new Error("Apple Pay is not configured in Stripe.");
            await loadScript("stripe-js-clover", "https://js.stripe.com/clover/stripe.js");
            if (!window.Stripe) throw new Error("Stripe could not be loaded.");
            const r = await fetch(`${API_URL}/orders/stripe/apple-pay`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload()),
            });
            const d = (await r.json()) as { clientSecret?: string; orderCode?: string; sessionId?: string; message?: string };
            if (!r.ok || !d.clientSecret || !d.orderCode || !d.sessionId) throw new Error(d.message || "Unable to initialize Apple Pay.");

            const checkout = window.Stripe(cfg.publishableKey).initCheckout({
                clientSecret: d.clientSecret,
                elementsOptions: {
                    appearance: {
                        theme: "night",
                        variables: {
                            colorPrimary: "#E0AD43",
                            colorBackground: "#111111",
                            colorText: "#F5F5F5",
                            colorTextSecondary: "#C9C9C9",
                            colorDanger: "#F36B6B",
                            borderRadius: "10px",
                            fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif"
                        }
                    }
                },
                defaultValues: {
                    email: readCustomerForm().email.trim().toLowerCase(),
                    phoneNumber: readCustomerForm().phone.trim(),
                    shippingAddress: {
                        name: `${readCustomerForm().firstName} ${readCustomerForm().lastName}`.trim(),
                        address: {
                            country: "US",
                            line1: readCustomerForm().address,
                            line2: readCustomerForm().apartment || undefined,
                            city: readCustomerForm().city,
                            state: readCustomerForm().state.toUpperCase(),
                            postal_code: readCustomerForm().zip
                        }
                    }
                }
            });

            const actions = await checkout.loadActions();
            if (actions.type !== "success") throw new Error(actions.error.message || "Apple Pay could not initialize.");
            stripeSessionRef.current = { id: d.sessionId, code: d.orderCode };
            const express = checkout.createExpressCheckoutElement({
                buttonHeight: 52,
                buttonType: { applePay: "check-out" },
                buttonTheme: { applePay: "black" },
                paymentMethods: {
                    applePay: "auto",
                    googlePay: "never",
                    link: "never",
                    paypal: "never",
                    amazonPay: "never",
                    klarna: "never"
                },
                paymentMethodOrder: ["applePay"],
            } as any);

            if (!stripeAppleRef.current) throw new Error("Apple Pay area is unavailable.");
            stripeAppleRef.current.replaceChildren();
            express.mount(stripeAppleRef.current);

            express.on("shippingaddresschange", async (event: any) => {
                try {
                    const current = readCustomerForm();
                    const walletAddress = event?.address || {};
                    const walletZip = String(walletAddress.postal_code || "").trim();
                    const walletCity = String(walletAddress.city || "").trim();
                    const walletState = String(walletAddress.state || "").trim();
                    if (!walletZip || !walletCity || !walletState) throw new Error("Apple Pay needs your ZIP code, city, and state.");
                    if (current.zip.trim() && current.zip.trim() !== walletZip) throw new Error("The Apple Pay delivery ZIP must match the ZIP entered in checkout.");
                    const response = await fetch(`${API_URL}/orders/stripe/apple-pay/shipping`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            sessionId: d.sessionId,
                            shippingDetails: {
                                name: `${current.firstName} ${current.lastName}`.trim(),
                                address: {
                                    country: "US",
                                    line1: current.address,
                                    line2: current.apartment || undefined,
                                    city: walletCity,
                                    state: walletState,
                                    postal_code: walletZip
                                }
                            }
                        })
                    });
                    const result = (await response.json()) as { message?: string };
                    if (!response.ok) throw new Error(result.message || "Unable to calculate Apple Pay shipping.");
                    event.resolve();
                } catch (x) {
                    event.reject();
                    setError(x instanceof Error ? x.message : "Unable to calculate Apple Pay shipping.");
                }
            });

            express.on("availablepaymentmethodschange", (e: any) => {
                const methods = e?.paymentMethods ?? e?.availablePaymentMethods ?? null;
                setAppleAvailable(Boolean(methods?.applePay));
            });
            express.on("ready", (e: any) => {
                const methods = e?.availablePaymentMethods;
                if (methods) setAppleAvailable(Boolean(methods.applePay));
            });
            express.on("confirm", async (e: any) => {
                setLoading(true);
                try {
                    const result = await actions.actions.confirm({ expressCheckoutConfirmEvent: e });
                    if (result?.type === "error") {
                        setError(result.error?.message || "Apple Pay payment could not be completed.");
                        setLoading(false);
                    }
                } catch (x) {
                    setError(x instanceof Error ? x.message : "Apple Pay payment could not be completed.");
                    setLoading(false);
                }
            });

            stripeCleanupRef.current = () => {
                express.unmount?.();
                stripeAppleRef.current?.replaceChildren();
                stripeActionsRef.current = null;
            };
            setAppleReady(true);
        } catch (x) {
            setAppleReady(false);
            setError(x instanceof Error ? x.message : "Unable to initialize Apple Pay.");
        }
    };

    // Apple Pay has its own Stripe Checkout Session and does not wait for EasyPost
    // to mount. Shipping is recalculated from the destination during the wallet flow.
    useEffect(() => {
        if (cartItems.length) void prepareApplePay();
    }, [cartItems.length]);

    const submit = async (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); const customer = syncAutofilledFields(); if (!valid()) return; if (!stripeReady) await prepareStripe(customer); const actions = stripeActionsRef.current; if (!actions) return setError("Secure card payment is not ready."); setLoading(true); setError(""); try { const r = await actions.confirm({ redirect: "if_required" }); if (r?.type === "error") { setError(r.error?.message || "Card payment could not be completed."); setLoading(false); } else if (r?.type === "success") window.location.assign(`/checkout/success?session_id=${encodeURIComponent(stripeSessionRef.current.id)}&order_code=${encodeURIComponent(stripeSessionRef.current.code)}`); } catch (x) { setError(x instanceof Error ? x.message : "Card payment could not be completed."); setLoading(false); } };

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

    return (<><Header /><main className="checkout-page"><section className="checkout-hero"><div className="checkout-hero__background"><img src="/images/cart/cart-hero-background.jpg" alt="Magic Touch Designs" /></div><div className="checkout-hero__overlay" /><div className="checkout-hero__content"><span>SECURE CHECKOUT</span><h1>Complete Your Order</h1><p>Enter your delivery information and choose your secure payment method.</p></div></section><section className="checkout-container"><form ref={formRef} className="checkout-grid" autoComplete="on" onSubmit={submit}><div className="checkout-form"><div className="checkout-section"><span className="checkout-section__eyebrow">CUSTOMER INFORMATION</span><h2>Your Details</h2><div className="checkout-fields"><label><span>First Name</span><input required name="firstName" defaultValue={form.firstName} onChange={(e) => update("firstName", e.target.value)} onInput={(e) => update("firstName", e.currentTarget.value)} autoComplete="given-name" /></label><label><span>Last Name</span><input required name="lastName" defaultValue={form.lastName} onChange={(e) => update("lastName", e.target.value)} onInput={(e) => update("lastName", e.currentTarget.value)} autoComplete="family-name" /></label><label className="checkout-field--full"><span>Email Address</span><input required name="email" type="email" defaultValue={form.email} onChange={(e) => update("email", e.target.value)} onInput={(e) => update("email", e.currentTarget.value)} autoComplete="email" /></label><label className="checkout-field--full"><span>Phone Number</span><input name="phone" defaultValue={form.phone} onChange={(e) => update("phone", e.target.value)} onInput={(e) => update("phone", e.currentTarget.value)} autoComplete="tel" /></label></div></div><div className="checkout-section"><span className="checkout-section__eyebrow">DELIVERY</span><h2>Shipping Address</h2><div className="checkout-address-types"><button type="button" className={`checkout-address-type ${form.deliveryType === "house" ? "checkout-address-type--active" : ""}`} onClick={() => update("deliveryType", "house")}><span className="checkout-address-type__icon">⌂</span><span><strong>House</strong><small>Residential home</small></span></button><button type="button" className={`checkout-address-type ${form.deliveryType === "apartment" ? "checkout-address-type--active" : ""}`} onClick={() => update("deliveryType", "apartment")}><span className="checkout-address-type__icon">⌂</span><span><strong>Apartment</strong><small>Apartment or unit</small></span></button></div><div className="checkout-fields"><label className="checkout-field--full"><span>Street Address</span><input required name="address" defaultValue={form.address} onChange={(e) => update("address", e.target.value)} onInput={(e) => update("address", e.currentTarget.value)} autoComplete="address-line1" /></label>{form.deliveryType === "apartment" && <label className="checkout-field--full"><span>Apartment / Unit Number</span><input required name="apartment" defaultValue={form.apartment} onChange={(e) => update("apartment", e.target.value)} onInput={(e) => update("apartment", e.currentTarget.value)} autoComplete="address-line2" /></label>}<label><span>City</span><input required name="city" defaultValue={form.city} onChange={(e) => update("city", e.target.value)} onInput={(e) => update("city", e.currentTarget.value)} autoComplete="address-level2" /></label><label><span>State</span><input required name="state" defaultValue={form.state} onChange={(e) => update("state", e.target.value)} onInput={(e) => update("state", e.currentTarget.value)} autoComplete="address-level1" /></label><label><span>ZIP Code</span><input required name="zip" defaultValue={form.zip} onChange={(e) => update("zip", e.target.value)} onInput={(e) => update("zip", e.currentTarget.value)} autoComplete="postal-code" /></label></div></div><div className="checkout-section"><span className="checkout-section__eyebrow">PAYMENT</span><h2>Choose Payment Method</h2><div className="checkout-payment-content"><div className="checkout-provider-heading"><strong>Credit or Debit Card</strong><span>Securely processed by Stripe</span></div>{!addressReady && <p className="checkout-payment-loading">Enter your delivery information to securely initialize the payment form and calculate shipping and tax.</p>}<div ref={stripePaymentRef} className="checkout-stripe-payment-element" />{error && <p className="checkout-error" role="alert">{error}</p>}<button className="checkout-payment-action" type="submit" disabled={loading || !stripeReady}>{loading ? "Processing…" : "Pay Securely with Card"}<span>→</span></button></div><div className="checkout-payment-content"><div className="checkout-provider-heading"><strong>Apple Pay</strong><span>Securely processed by Stripe</span></div><div ref={stripeAppleRef} className="checkout-stripe-apple-element" style={{ display: appleReady && appleAvailable === false ? "none" : "block" }} />{!appleReady && !error && <p className="checkout-payment-loading">Initializing Apple Pay securely…</p>}{appleReady && appleAvailable === false && <p className="checkout-payment-loading">Apple Pay is not available on this device or browser.</p>}{appleReady && appleAvailable === null && <p className="checkout-payment-loading">Checking Apple Pay availability…</p>}</div><div className="checkout-payment-content"><div className="checkout-provider-heading"><strong>PayPal</strong><span>Secure payment</span></div>{paypalLoading && <p className="checkout-payment-loading">Loading PayPal…</p>}<div ref={paypalContainerRef} className="checkout-paypal-button" />{!paypalLoading && !paypalEnabled && !paypalError && <p className="checkout-payment-loading">PayPal is not enabled in production yet.</p>}{paypalError && <p className="checkout-error" role="alert">{paypalError}</p>}</div><p className="checkout-security-note">Your card details are entered directly into Stripe's secure payment field. Magic Touch Designs does not store full card details.</p></div></div><aside className="checkout-summary"><div className="checkout-summary__header"><span>YOUR ORDER</span><h2>Order Summary</h2></div><div className="checkout-summary__items">{cartItems.map((item) => <div className="checkout-summary__item" key={`${item.id}-${item.model}-${item.size}-${item.color}-${item.customizationId || "standard"}`}><div className="checkout-summary__image"><img src={item.customizationId ? getCustomizationSession(item.customizationId)?.designDataUrl || item.image : item.image} alt={item.name} /></div><div className="checkout-summary__details"><strong>{item.name}</strong><span>{item.customizationId ? "Custom mug" : "Mug"} · Qty: {item.quantity}</span></div><strong>${(item.price * item.quantity).toFixed(2)}</strong></div>)}</div><div className="checkout-summary__totals"><div><span>Subtotal</span><strong>${subtotal.toFixed(2)}</strong></div><div><span>Shipping</span><strong>{quoteLoading ? "Calculating…" : `$${shipping.toFixed(2)}`}</strong></div><div><span>Sales Tax</span><strong>{quoteLoading ? "Calculating…" : tax === null ? "Enter address" : `$${tax.toFixed(2)}`}</strong></div><div className="checkout-summary__total"><span>Total</span><strong>{quoteLoading ? "Calculating…" : `$${baseTotal.toFixed(2)}`}</strong></div></div>{quote?.shippingCarrier && <p className="checkout-summary__note">Shipping: {quote.shippingCarrier}{quote.shippingService ? ` · ${quote.shippingService}` : ""}{quote.shippingDeliveryDays ? ` · ${quote.shippingDeliveryDays} business days` : ""}</p>}{quoteError && <p className="checkout-error" role="alert">{quoteError}</p>}<p className="checkout-summary__note">Shipping and applicable sales tax are calculated from the delivery destination. Final payment totals are recalculated securely by the server.</p><Link to="/cart">← Back to Cart</Link></aside></form></section></main><Footer /></>);
}
export default CheckoutPage;