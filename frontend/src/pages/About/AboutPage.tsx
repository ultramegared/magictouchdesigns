/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: AboutPage.tsx
 * Module: Frontend
 * Language: TypeScript React
 * Description:
 * Premium bilingual About Us page for Magic Touch Designs.
 * ================================================================
 */

import "./AboutPage.css";

import Header from "../../components/layout/Header";
import Footer from "../../components/home/Footer";
import { translations } from "../../translations";
import { useLanguage } from "../../context/LanguageContext";

function AboutPage() {
    const { language } = useLanguage();
    const t = translations[language];

    return (
        <>
            <Header />

            <main className="about-page">

                {/* =================================================
                    HERO
                ================================================= */}

                <section className="about-page__hero">

                    <div className="about-page__gold-orbit about-page__gold-orbit--one" />
                    <div className="about-page__gold-orbit about-page__gold-orbit--two" />

                    <div className="about-page__container">

                        <span className="about-page__eyebrow">
                            {t.about.hero.eyebrow}
                        </span>

                        <h1>
                            {t.about.hero.title}
                            <span>{t.about.hero.titleAccent}</span>
                        </h1>

                        <div className="about-page__divider">
                            <span />
                        </div>

                        <p className="about-page__intro">
                            {t.about.hero.intro}
                        </p>

                    </div>

                </section>

                {/* =================================================
                    OUR STORY
                ================================================= */}

                <section className="about-page__story">

                    <div className="about-page__container">

                        <div className="about-page__story-grid">

                            <div className="about-page__content">

                                <span className="about-page__eyebrow">
                                    {t.about.story.eyebrow}
                                </span>

                                <h2>
                                    {t.about.story.title}
                                    <span>{t.about.story.titleAccent}</span>
                                </h2>

                                <div className="about-page__gold-line" />

                                <p>
                                    {t.about.story.paragraph1}
                                </p>

                                <p>
                                    {t.about.story.paragraph2}
                                </p>

                                <p>
                                    {t.about.story.paragraph3}
                                </p>

                            </div>

                            <div className="about-page__story-card">

                                <div className="about-page__story-card-inner">

                                    <span className="about-page__story-number">
                                        01
                                    </span>

                                    <span className="about-page__story-label">
                                        {t.about.story.cardLabel}
                                    </span>

                                    <h3>
                                        {t.about.story.cardTitle}
                                        <span>
                                            {t.about.story.cardAccent}
                                        </span>
                                    </h3>

                                    <div className="about-page__story-card-line" />

                                    <p>
                                        {t.about.story.cardDescription}
                                    </p>

                                </div>

                            </div>

                        </div>

                    </div>

                </section>

                {/* =================================================
                    MISSION & VISION
                ================================================= */}

                <section className="about-page__mission">

                    <div className="about-page__container">

                        <div className="about-page__section-heading">

                            <span className="about-page__eyebrow">
                                {t.about.missionVision.eyebrow}
                            </span>

                            <h2>
                                {t.about.missionVision.title}
                                <span>
                                    {t.about.missionVision.titleAccent}
                                </span>
                            </h2>

                            <div className="about-page__gold-line about-page__gold-line--center" />

                        </div>

                        <div className="about-page__mission-grid">

                            <article className="about-page__mission-card">

                                <span className="about-page__mission-number">
                                    01
                                </span>

                                <div className="about-page__mission-icon">
                                    ✦
                                </div>

                                <h3>
                                    {t.about.missionVision.mission.title}
                                </h3>

                                <p>
                                    {t.about.missionVision.mission.description}
                                </p>

                            </article>

                            <article className="about-page__mission-card">

                                <span className="about-page__mission-number">
                                    02
                                </span>

                                <div className="about-page__mission-icon">
                                    ◇
                                </div>

                                <h3>
                                    {t.about.missionVision.vision.title}
                                </h3>

                                <p>
                                    {t.about.missionVision.vision.description}
                                </p>

                            </article>

                        </div>

                    </div>

                </section>

                {/* =================================================
                    WHAT WE OFFER
                ================================================= */}

                <section className="about-page__services">

                    <div className="about-page__container">

                        <div className="about-page__section-heading">

                            <span className="about-page__eyebrow">
                                {t.about.services.eyebrow}
                            </span>

                            <h2>
                                {t.about.services.title}
                                <span>
                                    {t.about.services.titleAccent}
                                </span>
                            </h2>

                            <p className="about-page__section-intro">
                                {t.about.services.intro}
                            </p>

                            <div className="about-page__gold-line about-page__gold-line--center" />

                        </div>

                        <div className="about-page__service-grid">

                            <article className="about-page__service-card">
                                <div className="about-page__service-icon">
                                    ☕
                                </div>

                                <h3>
                                    {t.about.services.mugs.title}
                                </h3>

                                <p>
                                    {t.about.services.mugs.description}
                                </p>
                            </article>

                            <article className="about-page__service-card">
                                <div className="about-page__service-icon">
                                    ✨
                                </div>

                                <h3>
                                    {t.about.services.magicMugs.title}
                                </h3>

                                <p>
                                    {t.about.services.magicMugs.description}
                                </p>
                            </article>

                            <article className="about-page__service-card">
                                <div className="about-page__service-icon">
                                    👕
                                </div>

                                <h3>
                                    {t.about.services.shirts.title}
                                </h3>

                                <p>
                                    {t.about.services.shirts.description}
                                </p>
                            </article>

                            <article className="about-page__service-card">
                                <div className="about-page__service-icon">
                                    🧢
                                </div>

                                <h3>
                                    {t.about.services.caps.title}
                                </h3>

                                <p>
                                    {t.about.services.caps.description}
                                </p>
                            </article>

                            <article className="about-page__service-card">
                                <div className="about-page__service-icon">
                                    👚
                                </div>

                                <h3>
                                    {t.about.services.clothing.title}
                                </h3>

                                <p>
                                    {t.about.services.clothing.description}
                                </p>
                            </article>

                            <article className="about-page__service-card">
                                <div className="about-page__service-icon">
                                    ✦
                                </div>

                                <h3>
                                    {t.about.services.custom.title}
                                </h3>

                                <p>
                                    {t.about.services.custom.description}
                                </p>
                            </article>

                        </div>

                    </div>

                </section>

                {/* =================================================
                    WHO WE SERVE
                ================================================= */}

                <section className="about-page__audience">

                    <div className="about-page__container">

                        <div className="about-page__section-heading">

                            <span className="about-page__eyebrow">
                                {t.about.audience.eyebrow}
                            </span>

                            <h2>
                                {t.about.audience.title}
                                <span>
                                    {t.about.audience.titleAccent}
                                </span>
                            </h2>

                            <div className="about-page__gold-line about-page__gold-line--center" />

                        </div>

                        <div className="about-page__audience-grid">

                            <article className="about-page__audience-card">
                                <span>01</span>
                                <h3>{t.about.audience.people}</h3>
                            </article>

                            <article className="about-page__audience-card">
                                <span>02</span>
                                <h3>{t.about.audience.businesses}</h3>
                            </article>

                            <article className="about-page__audience-card">
                                <span>03</span>
                                <h3>{t.about.audience.restaurants}</h3>
                            </article>

                            <article className="about-page__audience-card">
                                <span>04</span>
                                <h3>{t.about.audience.schools}</h3>
                            </article>

                            <article className="about-page__audience-card">
                                <span>05</span>
                                <h3>{t.about.audience.events}</h3>
                            </article>

                            <article className="about-page__audience-card">
                                <span>06</span>
                                <h3>{t.about.audience.promotions}</h3>
                            </article>

                        </div>

                    </div>

                </section>

                {/* =================================================
                    VALUES
                ================================================= */}

                <section className="about-page__values">

                    <div className="about-page__container">

                        <div className="about-page__section-heading">

                            <span className="about-page__eyebrow">
                                {t.about.values.eyebrow}
                            </span>

                            <h2>
                                {t.about.values.title}
                                <span>
                                    {t.about.values.titleAccent}
                                </span>
                            </h2>

                            <div className="about-page__gold-line about-page__gold-line--center" />

                        </div>

                        <div className="about-page__cards">

                            <article className="about-page__card">

                                <div className="about-page__card-number">
                                    01
                                </div>

                                <div className="about-page__card-icon">
                                    ✦
                                </div>

                                <h3>
                                    {t.about.values.quality.title}
                                </h3>

                                <p>
                                    {t.about.values.quality.description}
                                </p>

                            </article>

                            <article className="about-page__card">

                                <div className="about-page__card-number">
                                    02
                                </div>

                                <div className="about-page__card-icon">
                                    ◇
                                </div>

                                <h3>
                                    {t.about.values.creativity.title}
                                </h3>

                                <p>
                                    {t.about.values.creativity.description}
                                </p>

                            </article>

                            <article className="about-page__card">

                                <div className="about-page__card-number">
                                    03
                                </div>

                                <div className="about-page__card-icon">
                                    ♡
                                </div>

                                <h3>
                                    {t.about.values.personalization.title}
                                </h3>

                                <p>
                                    {t.about.values.personalization.description}
                                </p>

                            </article>

                            <article className="about-page__card">

                                <div className="about-page__card-number">
                                    04
                                </div>

                                <div className="about-page__card-icon">
                                    ★
                                </div>

                                <h3>
                                    {t.about.values.commitment.title}
                                </h3>

                                <p>
                                    {t.about.values.commitment.description}
                                </p>

                            </article>

                        </div>

                    </div>

                </section>

                {/* =================================================
                    BRAND MESSAGE
                ================================================= */}

                <section className="about-page__brand">

                    <div className="about-page__container">

                        <span className="about-page__eyebrow">
                            {t.about.brand.eyebrow}
                        </span>

                        <h2>
                            {t.about.brand.title}
                            <span>
                                {t.about.brand.titleAccent}
                            </span>
                        </h2>

                        <p>
                            {t.about.brand.description}
                        </p>

                        <div className="about-page__brand-signature">
                            <span>José &amp; Yafira</span>
                            <small>
                                {t.about.brand.signature}
                            </small>
                        </div>

                    </div>

                </section>

                {/* =================================================
                    CTA -- COLLECTIONS
                ================================================= */}

                <section className="about-page__cta">

                    <div className="about-page__cta-glow" />

                    <div className="about-page__container">

                        <span className="about-page__eyebrow">
                            {t.about.cta.eyebrow}
                        </span>

                        <h2>
                            {t.about.cta.title}
                            <span>
                                {t.about.cta.titleAccent}
                            </span>
                        </h2>

                        <div className="about-page__gold-line about-page__gold-line--center" />

                        <p className="about-page__cta-description">
                            {t.about.cta.description}
                        </p>

                        <div className="about-page__actions">

                            <a
                                href="/collections"
                                className="about-page__button about-page__button--primary"
                            >
                                {t.about.cta.collectionsButton}
                            </a>

                            <a
                                href="/customize"
                                className="about-page__button about-page__button--secondary"
                            >
                                {t.about.cta.orderButton}
                            </a>

                        </div>

                    </div>

                </section>

                {/* =================================================
                    SOCIAL
                ================================================= */}

                <section className="about-page__social">

                    <div className="about-page__container">

                        <span className="about-page__eyebrow">
                            {t.about.social.eyebrow}
                        </span>

                        <h2>
                            {t.about.social.title}
                            <span>
                                {t.about.social.titleAccent}
                            </span>
                        </h2>

                        <p>
                            {t.about.social.description}
                        </p>

                        <p className="about-page__social-thanks">
                            {t.about.social.thanks}
                        </p>

                    </div>

                </section>

            </main>

            <Footer />
        </>
    );
}

export default AboutPage;