/**
 * ===============================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: FAQPage.tsx
 * Module: Frontend
 * Language: TypeScript React
 * Description:
 * Frequently Asked Questions page.
 * ===============================================================
 */

import "./FAQPage.css";

import Header from "../../components/layout/Header";
import Footer from "../../components/home/Footer";

function FAQPage() {
    return (
        <>
            <Header />

            <main className="faq-page">

                <section className="faq-page__hero">
                    <div className="faq-page__container">

                        <span className="faq-page__eyebrow">
                            FREQUENTLY ASKED QUESTIONS
                        </span>

                        <h1>
                            Frequently Asked
                            <span>Questions</span>
                        </h1>

                        <div className="faq-page__divider">
                            <span />
                        </div>

                        <p className="faq-page__intro">
                            Find answers to the most common questions
                            about our products, orders, customization,
                            shipping, and returns.
                        </p>

                    </div>
                </section>

                <section className="faq-page__content">
                    <div className="faq-page__container">

                        <article className="faq-page__item">
                            <h2>What products do you offer?</h2>

                            <p>
                                We offer a variety of products designed
                                for personal use, gifts, and customized
                                experiences. Product availability may
                                vary over time.
                            </p>
                        </article>

                        <article className="faq-page__item">
                            <h2>Can I customize my order?</h2>

                            <p>
                                Yes. Selected products may be customized
                                according to the options available on
                                the product or customization page.
                            </p>
                        </article>

                        <article className="faq-page__item">
                            <h2>How long does shipping take?</h2>

                            <p>
                                Processing and delivery times may vary
                                depending on the product, customization,
                                destination, and order volume.
                            </p>
                        </article>

                        <article className="faq-page__item">
                            <h2>How can I track my order?</h2>

                            <p>
                                When tracking information is available,
                                it will be provided after your order has
                                been processed and shipped.
                            </p>
                        </article>

                        <article className="faq-page__item">
                            <h2>Can I return a customized product?</h2>

                            <p>
                                Return eligibility may vary for customized
                                products. Please review our Shipping &
                                Returns information before placing your
                                order.
                            </p>
                        </article>

                        <article className="faq-page__item">
                            <h2>How can I contact you?</h2>

                            <p>
                                If you need assistance with an order,
                                product, customization, shipping, or
                                returns, please contact us through our
                                Contact page.
                            </p>
                        </article>

                    </div>
                </section>

            </main>

            <Footer />
        </>
    );
}

export default FAQPage;