/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: CartPage.tsx
 * Module: Frontend
 * Language: TypeScript React
 * Description:
 * Shopping cart page.
 * ================================================================
 */

import { useState } from "react";
import "./CartPage.css";

import Header from "../../components/layout/Header";
import Footer from "../../components/home/Footer";

type CartItem = {
    id: number;
    name: string;
    model: string;
    size: string;
    color: string;
    price: number;
    quantity: number;
    image: string;
};

function CartPage() {

    const [cartItems, setCartItems] = useState<CartItem[]>([
        {
            id: 1,
            name: "Classic Custom Mug",
            model: "Classic",
            size: "15 oz",
            color: "Black",
            price: 24.99,
            quantity: 1,
            image: "/images/products/model-one.jpg",
        },
    ]);

    const updateQuantity = (
        id: number,
        change: number
    ) => {

        setCartItems((items) =>
            items.map((item) =>
                item.id === id
                    ? {
                        ...item,
                        quantity: Math.max(
                            1,
                            item.quantity + change
                        ),
                    }
                    : item
            )
        );

    };

    const removeItem = (id: number) => {

        setCartItems((items) =>
            items.filter((item) => item.id !== id)
        );

    };

    const subtotal = cartItems.reduce(
        (total, item) =>
            total + item.price * item.quantity,
        0
    );

    const delivery = subtotal > 0 ? 5.99 : 0;

    const taxes = subtotal * 0.08;

    const total = subtotal + delivery + taxes;

    const handleContinueShopping = () => {
        window.history.back();
    };

    return (
        <>
            <Header />

            <main className="cart-page">

                {/* ==================================================
                   HERO
                   ================================================== */}

                <section className="cart-hero">

                    <div className="cart-hero__background">

                        <img
                            src="/images/hero/hero-background.jpg"
                            alt="Magic Touch Designs custom mug"
                        />

                    </div>

                    <div className="cart-hero__overlay" />

                    <div className="cart-hero__content">

                        <span className="cart-eyebrow">
                            YOUR SHOPPING CART
                        </span>

                        <h1>
                            Your Cart
                        </h1>

                        <p>
                            Review your custom mugs before
                            continuing to checkout.
                        </p>

                    </div>

                </section>


                {/* ==================================================
                   CART CONTENT
                   ================================================== */}

                <section className="cart-container">

                    <div className="cart-header">

                        <div>

                            <span>
                                CART
                            </span>

                            <h2>
                                Your Selected Mugs
                            </h2>

                        </div>

                        <strong className="cart-count">
                            {cartItems.length}{" "}
                            {cartItems.length === 1
                                ? "ITEM"
                                : "ITEMS"}
                        </strong>

                    </div>


                    <div className="cart-layout">

                        {/* ==================================================
                           ITEMS
                           ================================================== */}

                        <div className="cart-items">

                            {cartItems.length > 0 ? (

                                cartItems.map((item) => (

                                    <article
                                        className="cart-item"
                                        key={item.id}
                                    >

                                        <div className="cart-item__image">

                                            <img
                                                src={item.image}
                                                alt={item.name}
                                            />

                                        </div>


                                        <div className="cart-item__details">

                                            <span className="cart-item__label">
                                                CUSTOM MUG
                                            </span>

                                            <h3>
                                                {item.name}
                                            </h3>

                                            <div className="cart-item__specs">

                                                <span>
                                                    Model:{" "}
                                                    <strong>
                                                        {item.model}
                                                    </strong>
                                                </span>

                                                <span>
                                                    Size:{" "}
                                                    <strong>
                                                        {item.size}
                                                    </strong>
                                                </span>

                                                <span>
                                                    Color:{" "}
                                                    <strong>
                                                        {item.color}
                                                    </strong>
                                                </span>

                                            </div>

                                            <button
                                                type="button"
                                                className="cart-item__remove"
                                                onClick={() =>
                                                    removeItem(item.id)
                                                }
                                            >
                                                Remove
                                            </button>

                                        </div>


                                        <div className="cart-item__purchase">

                                            <div className="cart-quantity">

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        updateQuantity(
                                                            item.id,
                                                            -1
                                                        )
                                                    }
                                                    aria-label="Decrease quantity"
                                                >
                                                    −
                                                </button>

                                                <strong>
                                                    {item.quantity}
                                                </strong>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        updateQuantity(
                                                            item.id,
                                                            1
                                                        )
                                                    }
                                                    aria-label="Increase quantity"
                                                >
                                                    +
                                                </button>

                                            </div>

                                            <strong className="cart-item__price">
                                                $
                                                {(
                                                    item.price *
                                                    item.quantity
                                                ).toFixed(2)}
                                            </strong>

                                        </div>

                                    </article>

                                ))

                            ) : (

                                <div className="cart-empty">

                                    <span className="cart-empty__icon">
                                        🛒
                                    </span>

                                    <h3>
                                        Your Cart Is Empty
                                    </h3>

                                    <p>
                                        Add a custom mug to your
                                        cart to get started.
                                    </p>

                                </div>

                            )}


                            {/* ==================================================
                               CONTINUE SHOPPING
                               ================================================== */}

                            <button
                                type="button"
                                className="cart-continue"
                                onClick={handleContinueShopping}
                            >

                                <span>
                                    ←
                                </span>

                                Continue Shopping

                            </button>

                        </div>


                        {/* ==================================================
                           ORDER SUMMARY
                           ================================================== */}

                        <aside className="cart-summary">

                            <div className="cart-summary__header">

                                <span>
                                    ORDER SUMMARY
                                </span>

                                <h2>
                                    Your Order
                                </h2>

                            </div>


                            <div className="cart-summary__rows">

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


                            <div className="cart-summary__total">

                                <span>
                                    Total
                                </span>

                                <strong>
                                    ${total.toFixed(2)}
                                </strong>

                            </div>


                            <button
                                type="button"
                                className="cart-checkout"
                                disabled={cartItems.length === 0}
                            >
                                Proceed to Checkout

                                <span>
                                    →
                                </span>

                            </button>


                            <div className="cart-secure">

                                <span className="cart-secure__icon">
                                    ✓
                                </span>

                                <div>

                                    <strong>
                                        Secure Checkout
                                    </strong>

                                    <small>
                                        Your payment information
                                        is protected.
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

export default CartPage;