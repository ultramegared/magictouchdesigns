/**
 * ===============================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: ShippingReturnsPage.tsx
 * Module: Frontend
 * Language: TypeScript React
 * Description:
 * Shipping & Returns page.
 * ===============================================================
 */

import "./ShippingReturnsPage.css";

import Header from "../../components/layout/Header";
import Footer from "../../components/home/Footer";

function ShippingReturnsPage() {
    return (
        <>
            <Header />

            <main className="shipping-returns-page">
                <section className="shipping-returns-page__hero">
                    <div className="shipping-returns-page__container">
                        <span className="shipping-returns-page__eyebrow">
                            SHIPPING & RETURNS
                        </span>

                        <h1>
                            Shipping &amp;
                            <span>Returns</span>
                        </h1>

                        <div className="shipping-returns-page__divider">
                            <span />
                        </div>

                        <p className="shipping-returns-page__intro">
                            Everything you need to know about shipping,
                            delivery, returns, and your order.
                        </p>
                    </div>
                </section>

                <section className="shipping-returns-page__content">
                    <div className="shipping-returns-page__container">

                        <article className="shipping-returns-page__section">
                            <h2>Shipping</h2>

                            <p>
                                We carefully prepare every order before it
                                is shipped. Shipping times may vary depending
                                on the product, customization, destination,
                                and order volume.
                            </p>
                        </article>

                        <article className="shipping-returns-page__section">
                            <h2>Processing &amp; Delivery</h2>

                            <p>
                                Once your order has been processed and shipped,
                                you will receive the available tracking
                                information for your order.
                            </p>
                        </article>

                        <article className="shipping-returns-page__section">
                            <h2>Returns</h2>

                            <p>
                                Because many of our products are personalized
                                or customized, return eligibility may vary
                                depending on the product and the reason for
                                the return.
                            </p>
                        </article>

                        <article className="shipping-returns-page__section">
                            <h2>Need Help?</h2>

                            <p>
                                If you have questions about an order, shipping,
                                or a return, please contact us and we will be
                                happy to help.
                            </p>
                        </article>

                    </div>
                </section>
            </main>

            <Footer />
        </>
    );
}

export default ShippingReturnsPage;