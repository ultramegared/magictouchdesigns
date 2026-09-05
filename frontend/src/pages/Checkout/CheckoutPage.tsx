/**
 * ================================================================
 * Magic Touch Designs - CheckoutPage.tsx
 * Secure checkout handoff.
 * Card data is collected by Stripe, never by Magic Touch Designs.
 * ================================================================
 */

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./CheckoutPage.css";
import Header from "../../components/layout/Header";
import Footer from "../../components/home/Footer";
import { getCartItems, type CartItem } from "../../utils/cart";

const API_URL = "https://api.magictouchdesigns.com/api";

function CheckoutPage() {
    const navigate = useNavigate();
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [form, setForm] = useState({
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

    const submitCheckout = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/orders/checkout`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customer: form,
                    items: cartItems.map((item) => ({
                        productId: String(item.id),
                        quantity: item.quantity,
                        model: item.model,
                        size: item.size,
                        color: item.color,
                    })),
                }),
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
                        <p>Enter your delivery information and continue to secure payment.</p>
                    </div>
                </section>

                <section className="checkout-container">
                    <form className="checkout-grid" onSubmit={submitCheckout}>
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
                                <h2>Secure Payment</h2>
                                <div className="checkout-alternative-payment"><div className="checkout-alternative-payment__icon">✓</div><div className="checkout-alternative-payment__content"><strong>Protected by Stripe</strong><p>Your payment details are entered securely on Stripe. Magic Touch Designs never receives or stores your full card number, expiration date, or security code.</p></div></div>
                                {error && <p role="alert" className="checkout-error">{error}</p>}
                                <button className="checkout-payment-action" type="submit" disabled={loading || !cartItems.length}>{loading ? "Opening secure payment…" : "Continue to Secure Payment"}<span>→</span></button>
                            </div>
                        </div>

                        <aside className="checkout-summary">
                            <div className="checkout-summary__header"><span>YOUR ORDER</span><h2>Order Summary</h2></div>
                            <div className="checkout-summary__items">{cartItems.map((item) => <div className="checkout-summary__item" key={`${item.id}-${item.model}-${item.size}-${item.color}`}><div className="checkout-summary__image"><img src={item.image} alt={item.name} /></div><div className="checkout-summary__details"><strong>{item.name}</strong><span>Qty: {item.quantity}</span></div><strong>${(item.price * item.quantity).toFixed(2)}</strong></div>)}</div>
                            <div className="checkout-summary__totals"><div><span>Subtotal</span><strong>${subtotal.toFixed(2)}</strong></div><div><span>Shipping</span><strong>${shipping.toFixed(2)}</strong></div><div><span>Sales Tax</span><span>Calculated at secure checkout</span></div><div className="checkout-summary__total"><span>Total</span><strong>From ${(subtotal + shipping).toFixed(2)} + applicable tax</strong></div></div>
                            <p className="checkout-summary__note">Taxes are calculated from the shipping destination during secure checkout.</p>
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
