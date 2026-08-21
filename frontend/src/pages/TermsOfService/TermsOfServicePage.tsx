/**
 * ===============================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: TermsOfServicePage.tsx
 * Module: Frontend
 * Language: TypeScript React
 * Description:
 * Premium bilingual Terms of Service page.
 * ===============================================================
 */

import "./TermsOfServicePage.css";

import Header from "../../components/layout/Header";
import Footer from "../../components/home/Footer";

import { useLanguage } from "../../contexts/LanguageContext";
import { translations } from "../../translations";

function TermsOfServicePage() {
    const { language } = useLanguage();

    const t = translations[language].termsOfService;

    const sections = [
        t.acceptance,
        t.website,
        t.products,
        t.ordersPayment,
        t.pricing,
        t.shipping,
        t.intellectualProperty,
        t.liability,
        t.changes,
        t.contact,
    ];

    return (
        <>
            <Header />

            <main className="terms-page">

                {/* =================================================
                    HERO
                ================================================= */}

                <section className="terms-page__hero">

                    <div className="terms-page__hero-glow" />

                    <div className="terms-page__container">

                        <span className="terms-page__eyebrow">
                            <span />
                            {t.hero.eyebrow}
                            <span />
                        </span>

                        <h1>
                            {t.hero.title}
                            <span>
                                {t.hero.titleAccent}
                            </span>
                        </h1>

                        <div className="terms-page__divider">
                            <span />
                        </div>

                        <p className="terms-page__intro">
                            {t.hero.intro}
                        </p>

                    </div>

                </section>

                {/* =================================================
                    TERMS CONTENT
                ================================================= */}

                <section className="terms-page__content">

                    <div className="terms-page__container">

                        <div className="terms-page__policy">

                            {/* =================================================
                                INDEX
                            ================================================= */}

                            <aside className="terms-page__index">

                                <div className="terms-page__index-card">

                                    <span className="terms-page__index-label">
                                        {language === "es"
                                            ? "EN ESTOS TÉRMINOS"
                                            : "IN THESE TERMS"}
                                    </span>

                                    <div className="terms-page__index-line" />

                                    <nav>

                                        {sections.map(
                                            (section, index) => (

                                                <a
                                                    href={`#terms-section-${index + 1}`}
                                                    key={index}
                                                >

                                                    <span>
                                                        {String(
                                                            index + 1
                                                        ).padStart(
                                                            2,
                                                            "0"
                                                        )}
                                                    </span>

                                                    {section.title}

                                                </a>

                                            )
                                        )}

                                    </nav>

                                </div>

                            </aside>

                            {/* =================================================
                                SECTIONS
                            ================================================= */}

                            <div className="terms-page__sections">

                                {sections.map(
                                    (section, index) => (

                                        <article
                                            id={`terms-section-${index + 1}`}
                                            className="terms-page__section"
                                            key={index}
                                        >

                                            <div className="terms-page__section-number">
                                                {String(
                                                    index + 1
                                                ).padStart(
                                                    2,
                                                    "0"
                                                )}
                                            </div>

                                            <div className="terms-page__section-content">

                                                <h2>
                                                    {section.title}
                                                </h2>

                                                <div className="terms-page__section-divider" />

                                                <p>
                                                    {section.description}
                                                </p>

                                            </div>

                                        </article>

                                    )
                                )}

                            </div>

                        </div>

                    </div>

                </section>

            </main>

            <Footer />
        </>
    );
}

export default TermsOfServicePage;