/**
 * ===============================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: PrivacyPage.tsx
 * Module: Frontend
 * Language: TypeScript React
 * Description:
 * Privacy Policy page.
 * ===============================================================
 */

import "./PrivacyPage.css";

import Header from "../../components/layout/Header";
import Footer from "../../components/home/Footer";

function PrivacyPage() {
    return (
        <>
            <Header />

            <main className="privacy-page">

                <section className="privacy-page__hero">
                    <div className="privacy-page__container">

                        <span className="privacy-page__eyebrow">
                            YOUR PRIVACY MATTERS
                        </span>

                        <h1>
                            PRIVACY
                            <span>POLICY</span>
                        </h1>

                        <div className="privacy-page__divider">
                            <span />
                        </div>

                        <p className="privacy-page__intro">
                            Learn how Magic Touch Designs handles
                            information related to your visits,
                            orders, and interactions with our website.
                        </p>

                    </div>
                </section>

                <section className="privacy-page__content">
                    <div className="privacy-page__container">

                        <article className="privacy-page__section">
                            <h2>INFORMATION WE COLLECT</h2>

                            <p>
                                When you interact with Magic Touch Designs,
                                information may be provided when you place
                                an order, contact us, create an account,
                                or use features available through our
                                website.
                            </p>
                        </article>

                        <article className="privacy-page__section">
                            <h2>HOW WE USE INFORMATION</h2>

                            <p>
                                Information may be used to process orders,
                                provide customer support, communicate
                                about your requests, and improve the
                                experience provided through our website.
                            </p>
                        </article>

                        <article className="privacy-page__section">
                            <h2>ORDERS & PAYMENTS</h2>

                            <p>
                                Information associated with an order may
                                be used to process and fulfill that order,
                                provide order updates, and assist with
                                customer service.
                            </p>
                        </article>

                        <article className="privacy-page__section">
                            <h2>COMMUNICATIONS</h2>

                            <p>
                                If you contact us or choose to receive
                                communications from us, the information
                                you provide may be used to respond to
                                your request or provide the communication
                                you requested.
                            </p>
                        </article>

                        <article className="privacy-page__section">
                            <h2>WEBSITE EXPERIENCE</h2>

                            <p>
                                We may use information related to website
                                activity to help maintain, improve, and
                                personalize the experience of our website.
                            </p>
                        </article>

                        <article className="privacy-page__section">
                            <h2>INFORMATION SECURITY</h2>

                            <p>
                                We take reasonable measures to help protect
                                information associated with our website
                                and customer interactions. However, no
                                method of transmission or storage can be
                                guaranteed to be completely secure.
                            </p>
                        </article>

                        <article className="privacy-page__section">
                            <h2>THIRD-PARTY SERVICES</h2>

                            <p>
                                Certain website functions, payment
                                processing, shipping, analytics, or other
                                services may involve third-party providers.
                                Their handling of information may be
                                governed by their own privacy policies.
                            </p>
                        </article>

                        <article className="privacy-page__section">
                            <h2>QUESTIONS ABOUT PRIVACY</h2>

                            <p>
                                If you have questions about privacy,
                                information associated with your order,
                                or how to contact us regarding your
                                information, please reach out through
                                our Contact page.
                            </p>
                        </article>

                    </div>
                </section>

            </main>

            <Footer />
        </>
    );
}

export default PrivacyPage;