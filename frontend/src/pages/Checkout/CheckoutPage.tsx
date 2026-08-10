/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: CheckoutPage.tsx
 * Module: Frontend
 * Language: TypeScript React
 * Description:
 * Checkout page.
 * ================================================================
 */

import { useEffect, useState } from "react";

import "./CheckoutPage.css";

import Header from "../../components/layout/Header";
import Footer from "../../components/home/Footer";

import {
    getCartItems,
    type CartItem,
} from "../../utils/cart";


function CheckoutPage() {

    const [cartItems, setCartItems] =
        useState<CartItem[]>([]);
     const [deliveryType, setDeliveryType] =
    useState<"house" | "apartment">("house");

const [paymentMethod, setPaymentMethod] =
    useState<
        "credit-card" |
        "debit-card" |
        "paypal" |
        "apple-pay"
    >("credit-card");


    useEffect(() => {

        setCartItems(getCartItems());

    }, []);


    const subtotal = cartItems.reduce(
        (total, item) =>
            total + item.price * item.quantity,
        0
    );


    const delivery =
        subtotal > 0
            ? 5.99
            : 0;


    const taxes =
        subtotal * 0.08;


    const total =
        subtotal +
        delivery +
        taxes;


    return (
        <>
            <Header />

            <main className="checkout-page">

                {/* ==================================================
                   HERO
                   ================================================== */}

                <section className="checkout-hero">

                    <div className="checkout-hero__background">

                        <img
                            src="/images/cart/cart-hero-background.jpg"
                            alt="Magic Touch Designs"
                        />

                    </div>

                    <div className="checkout-hero__overlay" />

                    <div className="checkout-hero__content">

                        <span>
                            SECURE CHECKOUT
                        </span>

                        <h1>
                            Complete Your Order
                        </h1>

                        <p>
                            Review your information and
                            complete your purchase.
                        </p>

                    </div>

                </section>


                {/* ==================================================
                   CHECKOUT CONTENT
                   ================================================== */}

                <section className="checkout-container">

                    <div className="checkout-grid">

                        {/* ==================================================
                           CUSTOMER INFORMATION
                           ================================================== */}

                        <div className="checkout-form">

                            <div className="checkout-section">

                                <span className="checkout-section__eyebrow">
                                    CUSTOMER INFORMATION
                                </span>

                                <h2>
                                    Your Details
                                </h2>


                                <div className="checkout-fields">

                                    <label>

                                        <span>
                                            First Name
                                        </span>

                                        <input
                                            type="text"
                                            name="firstName"
                                            placeholder="First name"
                                            autoComplete="given-name"
                                        />

                                    </label>


                                    <label>

                                        <span>
                                            Last Name
                                        </span>

                                        <input
                                            type="text"
                                            name="lastName"
                                            placeholder="Last name"
                                            autoComplete="family-name"
                                        />

                                    </label>


                                    <label className="checkout-field--full">

                                        <span>
                                            Email Address
                                        </span>

                                        <input
                                            type="email"
                                            name="email"
                                            placeholder="you@example.com"
                                            autoComplete="email"
                                        />

                                    </label>


                                    <label className="checkout-field--full">

                                        <span>
                                            Phone Number
                                        </span>

                                        <input
                                            type="tel"
                                            name="phone"
                                            placeholder="Phone number"
                                            autoComplete="tel"
                                        />

                                    </label>

                                </div>

                            </div>


                            {/* ==================================================
                               DELIVERY
                               ================================================== */}

                           <div className="checkout-section">

    <span className="checkout-section__eyebrow">
        DELIVERY
    </span>

    <h2>
        Shipping Address
    </h2>


    <div className="checkout-address-types">

        <button
            type="button"
            className={`checkout-address-type ${
                deliveryType === "house"
                    ? "checkout-address-type--active"
                    : ""
            }`}
            onClick={() =>
                setDeliveryType("house")
            }
        >

            <span className="checkout-address-type__icon">
                🏠
            </span>

            <span>

                <strong>
                    House
                </strong>

                <small>
                    Residential home
                </small>

            </span>

        </button>


        <button
            type="button"
            className={`checkout-address-type ${
                deliveryType === "apartment"
                    ? "checkout-address-type--active"
                    : ""
            }`}
            onClick={() =>
                setDeliveryType("apartment")
            }
        >

            <span className="checkout-address-type__icon">
                🏢
            </span>

            <span>

                <strong>
                    Apartment
                </strong>

                <small>
                    Apartment or unit
                </small>

            </span>

        </button>

    </div>


    <div className="checkout-fields">

        <label className="checkout-field--full">

            <span>
                Address
            </span>

            <input
                type="text"
                name="address"
                placeholder="Street address"
                autoComplete="street-address"
            />

        </label>


        {deliveryType === "apartment" && (

            <label className="checkout-field--full">

                <span>
                    Apartment / Unit Number
                </span>

                <input
                    type="text"
                    name="apartment"
                    placeholder="Apartment or unit number"
                    autoComplete="address-line2"
                />

            </label>

        )}


        <label>

            <span>
                City
            </span>

            <input
                type="text"
                name="city"
                placeholder="City"
                autoComplete="address-level2"
            />

        </label>


        <label>

            <span>
                State
            </span>

            <input
                type="text"
                name="state"
                placeholder="State"
                autoComplete="address-level1"
            />

        </label>


        <label>

            <span>
                ZIP Code
            </span>

            <input
                type="text"
                name="zip"
                placeholder="ZIP code"
                autoComplete="postal-code"
            />

        </label>

    </div>

</div>


                            {/* ==================================================
                               PAYMENT PLACEHOLDER
                               ================================================== */}

                            <div className="checkout-section">

    <span className="checkout-section__eyebrow">
        PAYMENT
    </span>

    <h2>
        Payment Method
    </h2>


    <div className="checkout-payment-methods">

        <button
            type="button"
            className={`checkout-payment-method ${
                paymentMethod === "credit-card"
                    ? "checkout-payment-method--active"
                    : ""
            }`}
            onClick={() =>
                setPaymentMethod("credit-card")
            }
        >

            <span className="checkout-payment-method__icon">
                💳
            </span>

            <span>

                <strong>
                    Credit Card
                </strong>

                <small>
                    Visa, Mastercard, Amex
                </small>

            </span>

        </button>


        <button
            type="button"
            className={`checkout-payment-method ${
                paymentMethod === "debit-card"
                    ? "checkout-payment-method--active"
                    : ""
            }`}
            onClick={() =>
                setPaymentMethod("debit-card")
            }
        >

            <span className="checkout-payment-method__icon">
                💳
            </span>

            <span>

                <strong>
                    Debit Card
                </strong>

                <small>
                    Pay with your debit card
                </small>

            </span>

        </button>


        <button
            type="button"
            className={`checkout-payment-method ${
                paymentMethod === "paypal"
                    ? "checkout-payment-method--active"
                    : ""
            }`}
            onClick={() =>
                setPaymentMethod("paypal")
            }
        >

            <span className="checkout-payment-method__icon">
                P
            </span>

            <span>

                <strong>
                    PayPal
                </strong>

                <small>
                    Pay securely with PayPal
                </small>

            </span>

        </button>


        <button
            type="button"
            className={`checkout-payment-method ${
                paymentMethod === "apple-pay"
                    ? "checkout-payment-method--active"
                    : ""
            }`}
            onClick={() =>
                setPaymentMethod("apple-pay")
            }
        >

            <span className="checkout-payment-method__icon">
                
            </span>

            <span>

                <strong>
                    Apple Pay
                </strong>

                <small>
                    Fast and secure payment
                </small>

            </span>

        </button>

    </div>


    {(paymentMethod === "credit-card" ||
        paymentMethod === "debit-card") && (

        <div className="checkout-card-fields">

            <label className="checkout-field--full">

                <span>
                    Card Number
                </span>

                <input
                    type="text"
                    name="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    inputMode="numeric"
                    autoComplete="cc-number"
                />

            </label>


            <label>

                <span>
                    Expiration Date
                </span>

                <input
                    type="text"
                    name="cardExpiry"
                    placeholder="MM / YY"
                    autoComplete="cc-exp"
                />

            </label>


            <label>

                <span>
                    Security Code
                </span>

                <input
                    type="password"
                    name="cardCvc"
                    placeholder="CVC"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                />

            </label>

        </div>

    )}

</div>

                        </div>


                        {/* ==================================================
                           ORDER SUMMARY
                           ================================================== */}

                        <aside className="checkout-summary">

                            <div className="checkout-summary__header">

                                <span>
                                    YOUR ORDER
                                </span>

                                <h2>
                                    Order Summary
                                </h2>

                            </div>


                            <div className="checkout-summary__items">

                                {cartItems.length > 0 ? (

                                    cartItems.map((item) => (

                                        <div
                                            className="checkout-summary__item"
                                            key={item.id}
                                        >

                                            <div className="checkout-summary__image">

                                                <img
                                                    src={item.image}
                                                    alt={item.name}
                                                />

                                            </div>


                                            <div className="checkout-summary__details">

                                                <strong>
                                                    {item.name}
                                                </strong>

                                                <span>
                                                    Qty: {item.quantity}
                                                </span>

                                            </div>


                                            <strong>
                                                $
                                                {(
                                                    item.price *
                                                    item.quantity
                                                ).toFixed(2)}
                                            </strong>

                                        </div>

                                    ))

                                ) : (

                                    <p className="checkout-empty">
                                        Your cart is empty.
                                    </p>

                                )}

                            </div>


                            <div className="checkout-summary__rows">

                                <div>

                                    <span>
                                        Subtotal
                                    </span>

                                    <strong>
                                        ${subtotal.toFixed(2)}
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Delivery
                                    </span>

                                    <strong>
                                        ${delivery.toFixed(2)}
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Taxes
                                    </span>

                                    <strong>
                                        ${taxes.toFixed(2)}
                                    </strong>

                                </div>

                            </div>


                            <div className="checkout-summary__total">

                                <span>
                                    Total
                                </span>

                                <strong>
                                    ${total.toFixed(2)}
                                </strong>

                            </div>


                            <button
                                type="button"
                                className="checkout-place-order"
                                disabled={cartItems.length === 0}
                            >
                                Place Order

                                <span>
                                    →
                                </span>

                            </button>


                            <div className="checkout-secure">

                                <span>
                                    ✓
                                </span>

                                <div>

                                    <strong>
                                        Secure Checkout
                                    </strong>

                                    <small>
                                        Your information is protected.
                                    </small>

                                </div>

                            </div>

                        </aside>

                    </div>

                </section>

            </main>

            <Footer />
        </>
    );
}


export default CheckoutPage;