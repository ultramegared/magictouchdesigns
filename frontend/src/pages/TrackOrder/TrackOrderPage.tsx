/**
 * ===============================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: TrackOrderPage.tsx
 * Module: Frontend
 * Language: TypeScript React
 * Description:
 * Bilingual premium order tracking page.
 * ===============================================================
 */

import "./TrackOrderPage.css";

import Header from "../../components/layout/Header";
import Footer from "../../components/home/Footer";

import { useLanguage } from "../../contexts/LanguageContext";
import { translations } from "../../translations";

function TrackOrderPage() {
    const { language } = useLanguage();

    const t = translations[language].trackOrder;

    return (
        <>
            <Header />

            <main className="track-order-page">

                <section className="track-order-page__hero">

                    <div className="track-order-page__container">

                        <span className="track-order-page__eyebrow">
                            {t.hero.eyebrow}
                        </span>

                        <h1>
                            {t.hero.title}
                            <span>{t.hero.titleAccent}</span>
                        </h1>

                        <div className="track-order-page__divider">
                            <span />
                        </div>

                        <p className="track-order-page__intro">
                            {t.hero.intro}
                        </p>

                    </div>

                </section>

                <section className="track-order-page__content">

                    <div className="track-order-page__container">

                        <div className="track-order-page__card">

                            <h2>
                                {t.tracking.title}
                            </h2>

                            <p>
                                {t.tracking.description}
                            </p>

                            <form className="track-order-page__form">

                                <div className="track-order-page__field">

                                    <label htmlFor="order-number">
                                        {t.tracking.orderNumberLabel}
                                    </label>

                                    <input
                                        id="order-number"
                                        name="orderNumber"
                                        type="text"
                                        placeholder={
                                            t.tracking.orderNumberPlaceholder
                                        }
                                    />

                                </div>

                                <div className="track-order-page__field">

                                    <label htmlFor="email">
                                        {t.tracking.emailLabel}
                                    </label>

                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder={
                                            t.tracking.emailPlaceholder
                                        }
                                    />

                                </div>

                                <button
                                    type="button"
                                    className="track-order-page__button"
                                >
                                    {t.tracking.button}
                                </button>

                            </form>

                        </div>

                        <div className="track-order-page__help">

                            <h2>
                                {t.help.title}
                            </h2>

                            <p>
                                {t.help.description}
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