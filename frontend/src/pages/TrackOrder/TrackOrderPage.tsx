/**
 * ===============================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: TrackOrderPage.tsx
 * Module: Frontend
 * Language: TypeScript React
 * Description:
 * Order tracking page.
 * ===============================================================
 */

import "./TrackOrderPage.css";

import Header from "../../components/layout/Header";
import Footer from "../../components/home/Footer";

function TrackOrderPage() {
    return (
        <>
            <Header />

            <main className="track-order-page">

                <section className="track-order-page__hero">
                    <div className="track-order-page__container">

                        <span className="track-order-page__eyebrow">
                            ORDER SUPPORT
                        </span>

                        <h1>
                            TRACK YOUR
                            <span>ORDER</span>
                        </h1>

                        <div className="track-order-page__divider">
                            <span />
                        </div>

                        <p className="track-order-page__intro">
                            Enter your order information to check the
                            available status and tracking details for
                            your order.
                        </p>

                    </div>
                </section>

                <section className="track-order-page__content">
                    <div className="track-order-page__container">

                        <div className="track-order-page__card">

                            <h2>
                                TRACKING INFORMATION
                            </h2>

                            <p>
                                Once your order has been processed and
                                shipped, available tracking information
                                will be provided for your order.
                            </p>

                            <form className="track-order-page__form">

                                <div className="track-order-page__field">
                                    <label htmlFor="order-number">
                                        ORDER NUMBER
                                    </label>

                                    <input
                                        id="order-number"
                                        name="orderNumber"
                                        type="text"
                                        placeholder="Enter your order number"
                                    />
                                </div>

                                <div className="track-order-page__field">
                                    <label htmlFor="email">
                                        EMAIL ADDRESS
                                    </label>

                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="Enter your email address"
                                    />
                                </div>

                                <button
                                    type="button"
                                    className="track-order-page__button"
                                >
                                    TRACK ORDER
                                </button>

                            </form>

                        </div>

                        <div className="track-order-page__help">

                            <h2>
                                NEED HELP?
                            </h2>

                            <p>
                                If you have questions about your order,
                                shipping, or tracking information, please
                                contact us and we will be happy to help.
                            </p>

                        </div>

                    </div>
                </section>

            </main>

            <Footer />
        </>
    );
}

export default TrackOrderPage;