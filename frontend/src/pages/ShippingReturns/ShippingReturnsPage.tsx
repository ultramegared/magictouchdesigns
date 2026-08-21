/**
 * ===============================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: ShippingReturnsPage.tsx
 * Module: Frontend
 * Language: TypeScript React
 * Description:
 * Bilingual Shipping & Returns page.
 * ===============================================================
 */

import "./ShippingReturnsPage.css";

import Header from "../../components/layout/Header";
import Footer from "../../components/home/Footer";

import { useLanguage } from "../../contexts/LanguageContext";
import { translations } from "../../translations";

function ShippingReturnsPage() {
    const { language } = useLanguage();

    const t = translations[language].shippingReturns;

    return (
        <>
            <Header />

            <main className="shipping-returns-page">

                {/* =================================================
                    HERO
                ================================================= */}

                <section className="shipping-returns-page__hero">

                    <div className="shipping-returns-page__container">

                        <span className="shipping-returns-page__eyebrow">
                            {t.hero.eyebrow}
                        </span>

                        <h1>
                            {t.hero.title}
                            <span>{t.hero.titleAccent}</span>
                        </h1>

                        <div className="shipping-returns-page__divider">
                            <span />
                        </div>

                        <p className="shipping-returns-page__intro">
                            {t.hero.intro}
                        </p>

                    </div>

                </section>

                {/* =================================================
                    CONTENT
                ================================================= */}

                <section className="shipping-returns-page__content">

                    <div className="shipping-returns-page__container">

                        <article className="shipping-returns-page__section">

                            <h2>
                                {t.shipping.title}
                            </h2>

                            <p>
                                {t.shipping.description}
                            </p>

                        </article>

                        <article className="shipping-returns-page__section">

                            <h2>
                                {t.processing.title}
                            </h2>

                            <p>
                                {t.processing.description}
                            </p>

                        </article>

                        <article className="shipping-returns-page__section">

                            <h2>
                                {t.returns.title}
                            </h2>

                            <p>
                                {t.returns.description}
                            </p>

                        </article>

                        <article className="shipping-returns-page__section">

                            <h2>
                                {t.help.title}
                            </h2>

                            <p>
                                {t.help.description}
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