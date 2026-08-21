/**
 * ===============================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: PrivacyPage.tsx
 * Module: Frontend
 * Language: TypeScript React
 * Description:
 * Premium bilingual Privacy Policy page.
 * ===============================================================
 */

import "./PrivacyPage.css";

import Header from "../../components/layout/Header";
import Footer from "../../components/home/Footer";

import { useLanguage } from "../../contexts/LanguageContext";
import { translations } from "../../translations";

function PrivacyPage() {
    const { language } = useLanguage();

    const t = translations[language].privacy;

    const sections = [
        t.information,
        t.usage,
        t.ordersPayments,
        t.communications,
        t.websiteExperience,
        t.security,
        t.thirdParty,
        t.questions,
    ];

    return (
        <>
            <Header />

            <main className="privacy-page">

                {/* =================================================
                    HERO
                ================================================= */}

                <section className="privacy-page__hero">

                    <div className="privacy-page__hero-glow" />

                    <div className="privacy-page__container">

                        <span className="privacy-page__eyebrow">
                            <span />
                            {t.hero.eyebrow}
                            <span />
                        </span>

                        <h1>
                            {t.hero.title}
                            <span>{t.hero.titleAccent}</span>
                        </h1>

                        <div className="privacy-page__divider">
                            <span />
                        </div>

                        <p className="privacy-page__intro">
                            {t.hero.intro}
                        </p>

                    </div>

                </section>

                {/* =================================================
                    POLICY CONTENT
                ================================================= */}

                <section className="privacy-page__content">

                    <div className="privacy-page__container">

                        <div className="privacy-page__policy">

                            <aside className="privacy-page__index">

                                <div className="privacy-page__index-card">

                                    <span className="privacy-page__index-label">
                                        {language === "es"
                                            ? "EN ESTA POLÍTICA"
                                            : "IN THIS POLICY"}
                                    </span>

                                    <div className="privacy-page__index-line" />

                                    <nav>
                                        {sections.map((section, index) => (
                                            <a
                                                href={`#privacy-section-${index + 1}`}
                                                key={index}
                                            >
                                                <span>
                                                    {String(index + 1).padStart(
                                                        2,
                                                        "0"
                                                    )}
                                                </span>

                                                {section.title}
                                            </a>
                                        ))}
                                    </nav>

                                </div>

                            </aside>

                            <div className="privacy-page__sections">

                                {sections.map((section, index) => (

                                    <article
                                        id={`privacy-section-${index + 1}`}
                                        className="privacy-page__section"
                                        key={index}
                                    >

                                        <div className="privacy-page__section-number">
                                            {String(index + 1).padStart(
                                                2,
                                                "0"
                                            )}
                                        </div>

                                        <div className="privacy-page__section-content">

                                            <h2>
                                                {section.title}
                                            </h2>

                                            <div className="privacy-page__section-divider" />

                                            <p>
                                                {section.description}
                                            </p>

                                        </div>

                                    </article>

                                ))}

                            </div>

                        </div>

                    </div>

                </section>

            </main>

            <Footer />
        </>
    );
}

export default PrivacyPage;