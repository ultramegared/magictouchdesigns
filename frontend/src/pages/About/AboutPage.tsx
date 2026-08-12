/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: AboutPage.tsx
 * Module: Frontend
 * Language: TypeScript React
 * Description:
 * About Us page.
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

                <section className="about-page__hero">

                    <div className="about-page__container">

                        <span className="about-page__eyebrow">
                            ABOUT US
                        </span>

                        <h1>
                            MAGIC TOUCH
                            <span>
                                DESIGNS
                            </span>
                        </h1>

                        <div className="about-page__divider">
                            <span />
                        </div>

                        <p className="about-page__intro">
                            We turn everyday products into
                            meaningful memories.
                        </p>

                    </div>

                </section>

                <section className="about-page__story">

                    <div className="about-page__container">

                        <div className="about-page__content">

                            <span className="about-page__eyebrow">
                                OUR STORY
                            </span>

                            <h2>
                                DESIGNS MADE
                                <span>
                                    WITH MEANING
                                </span>
                            </h2>

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

                    </div>

                </section>

                <section className="about-page__values">

                    <div className="about-page__container">

                        <span className="about-page__eyebrow">
                            WHAT WE VALUE
                        </span>

                        <h2>
                            WHY MAGIC TOUCH
                            <span>
                                DESIGNS?
                            </span>
                        </h2>

                        <div className="about-page__cards">

                            <article className="about-page__card">

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

                <section className="about-page__cta">

                    <div className="about-page__container">

                        <span className="about-page__eyebrow">
                            CREATE SOMETHING SPECIAL
                        </span>

                        <h2>
                            READY TO CREATE
                            <span>
                                YOUR DESIGN?
                            </span>
                        </h2>

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