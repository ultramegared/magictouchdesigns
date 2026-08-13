/**
 * ===============================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: TermsOfServicePage.tsx
 * Module: Frontend
 * Language: TypeScript React
 * Description:
 * Terms of Service page.
 * ===============================================================
 */

import "./TermsOfServicePage.css";

import Header from "../../components/layout/Header";
import Footer from "../../components/home/Footer";

function TermsOfServicePage() {
    return (
        <>
            <Header />

            <main className="terms-page">

                <section className="terms-page__hero">
                    <div className="terms-page__container">

                        <span className="terms-page__eyebrow">
                            TERMS & CONDITIONS
                        </span>

                        <h1>
                            TERMS OF
                            <span>SERVICE</span>
                        </h1>

                        <div className="terms-page__divider">
                            <span />
                        </div>

                        <p className="terms-page__intro">
                            Please review the terms and conditions that
                            apply when using the Magic Touch Designs
                            website and purchasing our products.
                        </p>

                    </div>
                </section>

                <section className="terms-page__content">
                    <div className="terms-page__container">

                        <article className="terms-page__section">
                            <h2>ACCEPTANCE OF TERMS</h2>

                            <p>
                                By accessing or using the Magic Touch
                                Designs website, you acknowledge that you
                                have read, understood, and agree to be
                                bound by these terms and conditions.
                            </p>
                        </article>

                        <article className="terms-page__section">
                            <h2>USE OF OUR WEBSITE</h2>

                            <p>
                                You agree to use this website only for
                                lawful purposes and in a manner that does
                                not interfere with the operation of the
                                website or the experience of other users.
                            </p>
                        </article>

                        <article className="terms-page__section">
                            <h2>PRODUCTS & CUSTOM ORDERS</h2>

                            <p>
                                Magic Touch Designs offers products that
                                may include personalized or customized
                                designs. Customers are responsible for
                                providing accurate information and
                                reviewing submitted customization details
                                before completing an order.
                            </p>
                        </article>

                        <article className="terms-page__section">
                            <h2>ORDERS & PAYMENT</h2>

                            <p>
                                Orders are subject to availability,
                                acceptance, and successful payment
                                processing. We reserve the right to
                                review, limit, or cancel an order when
                                necessary.
                            </p>
                        </article>

                        <article className="terms-page__section">
                            <h2>PRICING & PRODUCT INFORMATION</h2>

                            <p>
                                We make reasonable efforts to keep product
                                descriptions, images, prices, and other
                                information accurate. Information may be
                                updated or corrected when necessary.
                            </p>
                        </article>

                        <article className="terms-page__section">
                            <h2>SHIPPING & DELIVERY</h2>

                            <p>
                                Shipping times and delivery estimates may
                                vary depending on the destination, carrier,
                                order processing, and other circumstances.
                                Additional information is available on our
                                Shipping & Returns page.
                            </p>
                        </article>

                        <article className="terms-page__section">
                            <h2>INTELLECTUAL PROPERTY</h2>

                            <p>
                                Website content, branding, graphics,
                                photographs, designs, logos, text, and
                                other materials belonging to Magic Touch
                                Designs may not be copied, reproduced,
                                distributed, or used without appropriate
                                authorization.
                            </p>
                        </article>

                        <article className="terms-page__section">
                            <h2>LIMITATION OF LIABILITY</h2>

                            <p>
                                To the extent permitted by applicable law,
                                Magic Touch Designs is not responsible for
                                losses or damages resulting from the use
                                or inability to use the website or from
                                circumstances beyond our reasonable control.
                            </p>
                        </article>

                        <article className="terms-page__section">
                            <h2>CHANGES TO THESE TERMS</h2>

                            <p>
                                These terms may be updated from time to
                                time. Any changes will be reflected on
                                this page, and continued use of the website
                                after changes are posted constitutes
                                acceptance of the updated terms.
                            </p>
                        </article>

                        <article className="terms-page__section">
                            <h2>CONTACT US</h2>

                            <p>
                                If you have questions regarding these
                                Terms of Service, please contact Magic
                                Touch Designs through our Contact page.
                            </p>
                        </article>

                    </div>
                </section>

            </main>

            <Footer />
        </>
    );
}

export default TermsOfServicePage;