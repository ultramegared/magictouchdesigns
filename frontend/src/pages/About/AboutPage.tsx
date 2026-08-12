/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: AboutPage.tsx
 * Module: Frontend
 * Language: TypeScript React
 * Description:
 * Premium About Us page.
 * ================================================================
 */

import "./AboutPage.css";

import Header from "../../components/layout/Header";
import Footer from "../../components/home/Footer";

function AboutPage() {
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
                            ABOUT US
                        </span>

                        <h1>
                            MAGIC TOUCH
                            <span>DESIGNS</span>
                        </h1>

                        <div className="about-page__divider">
                            <span />
                        </div>

                        <p className="about-page__intro">
                            We turn everyday products into
                            meaningful memories.
                        </p>

                        <div className="about-page__hero-product">

                            <div className="about-page__hero-glow" />

                            <img
                                src="/images/hero/hero-mug2.png"
                                alt="Magic Touch Designs personalized mug"
                            />

                        </div>

                    </div>

                </section>

                {/* =================================================
                    STORY
                ================================================= */}

                <section className="about-page__story">

                    <div className="about-page__container">

                        <div className="about-page__story-grid">

                            <div className="about-page__content">

                                <span className="about-page__eyebrow">
                                    OUR STORY
                                </span>

                                <h2>
                                    DESIGNS MADE
                                    <span>WITH MEANING</span>
                                </h2>

                                <div className="about-page__gold-line" />

                                <p>
                                    At Magic Touch Designs, we believe
                                    that the smallest details can make
                                    the biggest memories.
                                </p>

                                <p>
                                    We create personalized mugs,
                                    caps, shirts, and other custom
                                    products designed to celebrate
                                    the people, moments, and ideas
                                    that matter most.
                                </p>

                                <p>
                                    Every design is created with
                                    attention to detail, creativity,
                                    and a personal touch.
                                </p>

                            </div>

                            <div className="about-page__story-card">

                                <div className="about-page__story-card-inner">

                                    <span className="about-page__story-number">
                                        01
                                    </span>

                                    <span className="about-page__story-label">
                                        MAGIC TOUCH
                                    </span>

                                    <h3>
                                        Made with
                                        <span>meaning.</span>
                                    </h3>

                                    <div className="about-page__story-card-line" />

                                    <p>
                                        Personalized products created
                                        to turn ordinary moments into
                                        something unforgettable.
                                    </p>

                                </div>

                            </div>

                        </div>

                    </div>

                </section>

                {/* =================================================
                    VALUES
                ================================================= */}

                <section className="about-page__values">

                    <div className="about-page__container">

                        <span className="about-page__eyebrow">
                            WHAT WE VALUE
                        </span>

                        <h2>
                            WHY MAGIC TOUCH
                            <span>DESIGNS?</span>
                        </h2>

                        <div className="about-page__gold-line about-page__gold-line--center" />

                        <div className="about-page__cards">

                            <article className="about-page__card">

                                <div className="about-page__card-number">
                                    01
                                </div>

                                <div className="about-page__card-icon">
                                    ✦
                                </div>

                                <h3>
                                    QUALITY
                                </h3>

                                <p>
                                    We focus on creating products
                                    that look great and are made
                                    with attention to detail.
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
                                    CREATIVITY
                                </h3>

                                <p>
                                    Every design is an opportunity
                                    to create something unique
                                    and personal.
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
                                    PERSONAL TOUCH
                                </h3>

                                <p>
                                    Your memories and ideas are
                                    what inspire everything we
                                    create.
                                </p>

                            </article>

                        </div>

                    </div>

                </section>

                {/* =================================================
                    CTA
                ================================================= */}

                <section className="about-page__cta">

                    <div className="about-page__cta-glow" />

                    <div className="about-page__container">

                        <span className="about-page__eyebrow">
                            CREATE SOMETHING SPECIAL
                        </span>

                        <h2>
                            READY TO CREATE
                            <span>YOUR DESIGN?</span>
                        </h2>

                        <div className="about-page__gold-line about-page__gold-line--center" />

                        <div className="about-page__actions">

                            <a
                                href="/products"
                                className="about-page__button about-page__button--primary"
                            >
                                SHOP PRODUCTS
                            </a>

                            <a
                                href="/customize"
                                className="about-page__button about-page__button--secondary"
                            >
                                START CUSTOMIZING
                            </a>

                        </div>

                    </div>

                </section>

            </main>

            <Footer />
        </>
    );
}

export default AboutPage;