/**
 * ================================================================
 * Magic Touch Designs - CheckoutPage.tsx
 * Secure checkout with Stripe and PayPal.
 * Card data is collected by the payment provider, never by MTD.
 * ================================================================
 */

import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./CheckoutPage.css";
import Header from "../../components/layout/Header";
import Footer from "../../components/home/Footer";
import { getCartItems, type CartItem } from "../../utils/cart";

const API_URL = "https://api.magictouchdesigns.com/api";

interface PayPalSdk {
    createInstance: (options: { clientId: string; components: string[]; pageType: string; locale?: string }) => Promise<any>;
}

declare global {
    interface Window {
        paypal?: PayPalSdk;
    }
}

const loadPayPalSdk = (environment: string): Promise<void> => {
    if (window.paypal) return Promise.resolve();

    const existing = document.getElementById("paypal-web-sdk-v6");
    if (existing) {
        return new Promise((resolve, reject) => {
            if (window.paypal) {
                resolve();
                return;
            }
            existing.addEventListener("load", () => resolve(), { once: true });
            existing.addEventListener("error", () => reject(new Error("Unable to load PayPal.")), { once: true });
        });
    }

    return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.id = "paypal-web-sdk-v6";
        script.async = true;
        script.src = environment === "sandbox"
            ? "https://www.sandbox.paypal.com/web-sdk/v6/core"
            : "https://www.paypal.com/web-sdk/v6/core";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Unable to load PayPal securely."));
        document.head.appendChild(script);
    });
};

function CheckoutPage() {
    const navigate = useNavigate();
    const formRef = useRef<HTMLFormElement>(null);
    const formStateRef = useRef({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        deliveryType: "house" as "house" | "apartment",
        address: "",
        apartment: "",
        city: "",
        state: "",
        zip: "",
    });
    const paypalContainerRef = useRef<HTMLDivElement>(null);
    const paypalCleanupRef = useRef<(() => void) | null>(null);
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [paypalLoading, setPaypalLoading] = useState(true);
    const [paypalEnabled, setPaypalEnabled] = useState(false);
    const [paypalError, setPaypalError] = useState("");
    const [error, setError] = useState("");
    const [form, setForm] = useState(formStateRef.current);

    useEffect(() => {
        formStateRef.current = form;
    }, [form]);

    useEffect(() => {
        const items = getCartItems();
        setCartItems(items);
        if (!items.length) navigate("/cart", { replace: true });
    }, [navigate]);

    const subtotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
    const shipping = subtotal > 0 ? 5.99 : 0;

    const updateField = (field: keyof typeof form, value: string) => {
        setForm((current) => ({ ...current, [field]: value }));
    };

    const buildPaymentPayload = (customer = formStateRef.current) => ({
        customer,
        items: cartItems.map((item) => ({
            productId: String(item.id),
            quantity: item.quantity,
            model: item.model,
            size: item.size,
            color: item.color,
        })),
    });

    const submitCheckout = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/orders/checkout`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(buildPaymentPayload()),
            });

            const data = await response.json() as { checkoutUrl?: string; message?: string };
            if (!response.ok || !data.checkoutUrl) {
                throw new Error(data.message || "Unable to start secure checkout.");
            }

            window.location.assign(data.checkoutUrl);
        } catch (checkoutError: unknown) {
            setError(checkoutError instanceof Error ? checkoutError.message : "Unable to start secure checkout.");
            setLoading(false);
        }
    };

    useEffect(() => {
        let cancelled = false;

        const setupPayPal = async () => {
            if (!cartItems.length || !paypalContainerRef.current) {
                setPaypalLoading(false);
                return;
            }

            try {
                const configResponse = await fetch(`${API_URL}/orders/paypal/config`);
                const config = await configResponse.json() as { enabled?: boolean; clientId?: string; environment?: string };
                if (cancelled || !config.enabled || !config.clientId) {
                    setPaypalEnabled(false);
                    setPaypalLoading(false);
                    return;
                }

                await loadPayPalSdk(config.environment || "sandbox");
                if (cancelled || !window.paypal) throw new Error("PayPal SDK is unavailable.");

                const sdk = await window.paypal.createInstance({
                    clientId: config.clientId,
                    components: ["paypal-payments"],
                    pageType: "checkout",
                    locale: "en-US",
                });
                const eligibility = await sdk.findEligibleMethods({ currencyCode: "USD" });
                if (cancelled || !eligibility.isEligible("paypal")) {
                    setPaypalEnabled(false);
                    setPaypalLoading(false);
                    return;
                }

                const session = sdk.createPayPalOneTimePaymentSession({
                    onApprove: async ({ orderId }: { orderId: string }) => {
                        const response = await fetch(`${API_URL}/orders/paypal/${encodeURIComponent(orderId)}/capture`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                        });
                        const data = await response.json() as { orderCode?: string; message?: string };
                        if (!response.ok || !data.orderCode) {
                            throw new Error(data.message || "PayPal payment could not be completed.");
                        }
                        window.location.assign(`/checkout/success?paypal=1&order_code=${encodeURIComponent(data.orderCode)}`);
                    },
                    onCancel: () => setPaypalError("PayPal checkout was cancelled. You can choose another payment method."),
                    onError: (paypalPaymentError: Error) => setPaypalError(paypalPaymentError.message || "PayPal payment could not be started."),
                });

                const container = paypalContainerRef.current;
                container.replaceChildren();
                const button = document.createElement("paypal-button");
                button.setAttribute("type", "pay");
                button.setAttribute("aria-label", "Pay with PayPal");

                const handleClick = async () => {
                    setPaypalError("");
                    if (!formRef.current?.reportValidity()) return;
                    try {
                        await session.start({ presentationMode: "auto" }, (async () => {
                            const response = await fetch(`${API_URL}/orders/paypal/create`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(buildPaymentPayload()),
                            });
                            const data = await response.json() as { paypalOrderId?: string; message?: string };
                            if (!response.ok || !data.paypalOrderId) {
                                throw new Error(data.message || "Unable to create PayPal payment.");
                            }
                            return { orderId: data.paypalOrderId };
                        })());
                    } catch (paypalStartError: unknown) {
                        setPaypalError(paypalStartError instanceof Error ? paypalStartError.message : "PayPal payment could not be started.");
                    }
                };

                button.addEventListener("click", handleClick);
                container.appendChild(button);
                setPaypalEnabled(true);
                setPaypalLoading(false);
                paypalCleanupRef.current = () => {
                    button.removeEventListener("click", handleClick);
                    container.replaceChildren();
                };
            } catch (paypalSetupError: unknown) {
                if (cancelled) return;
                console.error("PayPal setup error:", paypalSetupError);
                setPaypalEnabled(false);
                setPaypalError("PayPal is temporarily unavailable. Card and Apple Pay checkout remain available.");
                setPaypalLoading(false);
            }
        };

        void setupPayPal();
        return () => {
            cancelled = true;
            paypalCleanupRef.current?.();
            paypalCleanupRef.current = null;
        };
    }, [cartItems.length]);

    return (
        <>
            <Header />
            <main className="checkout-page">
                <section className="checkout-hero">
                    <div className="checkout-hero__background"><img src="/images/cart/cart-hero-background.jpg" alt="Magic Touch Designs" /></div>
                    <div className="checkout-hero__overlay" />
                    <div className="checkout-hero__content">
                        <span>SECURE CHECKOUT</span>
                        <h1>Complete Your Order</h1>
                        <p>Enter your delivery information and choose your secure payment method.</p>
                    </div>
                </section>

                <section className="checkout-container">
                    <form ref={formRef} className="checkout-grid" onSubmit={submitCheckout}>
                        <div className="checkout-form">
                            <div className="checkout-section">
                                <span className="checkout-section__eyebrow">CUSTOMER INFORMATION</span>
                                <h2>Your Details</h2>
                                <div className="checkout-fields">
                                    <label><span>First Name</span><input required value={form.firstName} onChange={(e) => updateField("firstName", e.target.value)} autoComplete="given-name" /></label>
                                    <label><span>Last Name</span><input required value={form.lastName} onChange={(e) => updateField("lastName", e.target.value)} autoComplete="family-name" /></label>
                                    <label className="checkout-field--full"><span>Email Address</span><input required type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} autoComplete="email" /></label>
                                    <label className="checkout-field--full"><span>Phone Number</span><input value={form.phone} onChange={(e) => updateField("phone", e.target.value)} autoComplete="tel" /></label>
                                </div>
                            </div>

                            <div className="checkout-section">
                                <span className="checkout-section__eyebrow">DELIVERY</span>
                                <h2>Shipping Address</h2>
                                <div className="checkout-address-types">
                                    <button type="button" className={`checkout-address-type ${form.deliveryType === "house" ? "checkout-address-type--active" : ""}`} onClick={() => updateField("deliveryType", "house")}><span className="checkout-address-type__icon">🏠</span><span><strong>House</strong><small>Residential home</small></span></button>
                                    <button type="button" className={`checkout-address-type ${form.deliveryType === "apartment" ? "checkout-address-type--active" : ""}`} onClick={() => updateField("deliveryType", "apartment")}><span className="checkout-address-type__icon">🏢</span><span><strong>Apartment</strong><small>Apartment or unit</small></span></button>
                                </div>
                                <div className="checkout-fields">
                                    <label className="checkout-field--full"><span>Street Address</span><input required value={form.address} onChange={(e) => updateField("address", e.target.value)} autoComplete="street-address" /></label>
                                    {form.deliveryType === "apartment" && <label className="checkout-field--full"><span>Apartment / Unit Number</span><input required value={form.apartment} onChange={(e) => updateField("apartment", e.target.value)} autoComplete="address-line2" /></label>}
                                    <label><span>City</span><input required value={form.city} onChange={(e) => updateField("city", e.target.value)} autoComplete="address-level2" /></label>
                                    <label><span>State</span><input required value={form.state} onChange={(e) => updateField("state", e.target.value)} autoComplete="address-level1" /></label>
                                    <label><span>ZIP Code</span><input required value={form.zip} onChange={(e) => updateField("zip", e.target.value)} autoComplete="postal-code" inputMode="numeric" /></label>
                                </div>
                            </div>

                            <div className="checkout-section">
                                <span className="checkout-section__eyebrow">PAYMENT</span>
                                <h2>Choose Payment Method</h2>
                                <div className="checkout-payment-method-card">
                                    <div className="checkout-payment-method-card__icon">✓</div>
                                    <div><strong>Card / Apple Pay</strong><p>Securely processed by Stripe. Apple Pay appears automatically when your device, browser, card and Stripe account settings are eligible.</p></div>
                                </div>
                                {error && <p role="alert" className="checkout-error">{error}</p>}
                                <button className="checkout-payment-action" type="submit" disabled={loading || !cartItems.length}>{loading ? "Opening secure payment…" : "Pay with Card / Apple Pay"}<span>→</span></button>

                                <div className="checkout-payment-divider"><span>OR</span></div>
                                <div className="checkout-paypal-card">
                                    <div className="checkout-paypal-card__heading"><strong>PayPal</strong><span>Secure payment</span></div>
                                    {paypalLoading && <p className="checkout-payment-loading">Loading PayPal…</p>}
                                    <div ref={paypalContainerRef} className="checkout-paypal-button" />
                                    {!paypalLoading && !paypalEnabled && !paypalError && <p className="checkout-payment-loading">PayPal is not enabled yet.</p>}
                                    {paypalError && <p role="alert" className="checkout-error">{paypalError}</p>}
                                </div>

                                <p className="checkout-security-note">Your card number, expiration date and security code are handled by the payment provider. Magic Touch Designs does not store full card details.</p>
                            </div>
                        </div>

                        <aside className="checkout-summary">
                            <div className="checkout-summary__header"><span>YOUR ORDER</span><h2>Order Summary</h2></div>
                            <div className="checkout-summary__items">{cartItems.map((item) => <div className="checkout-summary__item" key={`${item.id}-${item.model}-${item.size}-${item.color}`}><div className="checkout-summary__image"><img src={item.image} alt={item.name} /></div><div className="checkout-summary__details"><strong>{item.name}</strong><span>Qty: {item.quantity}</span></div><strong>${(item.price * item.quantity).toFixed(2)}</strong></div>)}</div>
                            <div className="checkout-summary__totals"><div><span>Subtotal</span><strong>${subtotal.toFixed(2)}</strong></div><div><span>Shipping</span><strong>${shipping.toFixed(2)}</strong></div><div><span>Sales Tax</span><span>Calculated from destination</span></div><div className="checkout-summary__total"><span>Total</span><strong>From ${(subtotal + shipping).toFixed(2)} + applicable tax</strong></div></div>
                            <p className="checkout-summary__note">Taxes are calculated from the shipping destination. Shipping is charged to the customer.</p>
                            <Link to="/cart">← Back to Cart</Link>
                        </aside>
                    </form>
                </section>
            </main>
            <Footer />
        </>
    );
}

export default CheckoutPage;
