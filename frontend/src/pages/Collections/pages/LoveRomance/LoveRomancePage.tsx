/**
 * ===============================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: LoveRomancePage.tsx
 * Module: Collections / Love & Romance
 * Language: TypeScript React
 * Description:
 * Premium Love & Romance collection page.
 * ===============================================================
 */

import "./LoveRomancePage.css";

import Header from "../../../../components/layout/Header";
import Footer from "../../../../components/home/Footer";

import { useLanguage } from "../../../../contexts/LanguageContext";
import { translations } from "../../../../translations";

function LoveRomancePage() {

    const { language } = useLanguage();

    const t = translations[language].loveRomance;

    return (
        <>
            <Header />

            <main className="love-romance-page">

                {/* ==================================================
                    HERO
                   ================================================== */}

                <section className="love-romance-hero">

                    <div className="love-romance-hero__visual">

                        <img
                            src="/images/collections/love-romance/love-romance-hero.jpg"
                            alt={t.hero.title}
                        />

                    </div>

                    <div className="love-romance-hero__overlay"></div>

                    <div className="love-romance-hero__glow"></div>

                    <div className="love-romance-hero__content">

                        <span className="love-romance-hero__eyebrow">
                            {t.hero.eyebrow}
                        </span>

                        <h1>

                            {t.hero.title}

                            <span>
                                {t.hero.titleAccent}
                            </span>

                        </h1>

                        <div className="love-romance-hero__ornament">

                            <span></span>

                            <b>♥</b>

                            <span></span>

                        </div>

                        <p>
                            {t.hero.description}
                        </p>

                        <button
                            type="button"
                            className="love-romance-hero__button"
                        >
                            {t.hero.button}
                            
                        </button>

                    </div>

                    <div className="love-romance-hero__bottom-glow"></div>

                </section>


                {/* ==================================================
                    INTRO
                   ================================================== */}

                <section className="love-romance-intro">

                    <div className="love-romance-intro__ornament">

                        <span></span>

                        <div>

                            <b>♥</b>

                            <small>
                                {t.intro.eyebrow}
                            </small>

                        </div>

                        <span></span>

                    </div>

                    <h2>

                        {t.intro.title}

                        <span>
                            {t.intro.titleAccent}
                        </span>

                    </h2>

                    <p>
                        {t.intro.description}
                    </p>

                </section>


                {/* ==================================================
                    PRODUCT SHOWCASE
                   ================================================== */}

                <section className="love-romance-products">

                    <div className="love-romance-section-heading">

                        <span>
                            {t.products.eyebrow}
                        </span>

                        <h2>

                            {t.products.title}

                            <strong>
                                {t.products.titleAccent}
                            </strong>

                        </h2>

                     

                    </div>


                    <div className="love-romance-products__grid">

                        <article className="love-romance-product">

                            <div className="love-romance-product__image">

                                <img
                                    src="/images/collections/love-romance/love-romance-01.jpg"
                                    alt={t.products.title}
                                />

                                <div className="love-romance-product__shine"></div>

                            </div>

                            <div className="love-romance-product__body">

                                <span className="love-romance-product__number">
                                    01
                                </span>

                                <button
                                    type="button"
                                    className="love-romance-product__button"
                                >
                                    {t.products.viewProduct}
                                </button>

                            </div>

                        </article>


                        <article className="love-romance-product">

                            <div className="love-romance-product__image">

                                <img
                                    src="/images/collections/love-romance/love-romance-02.jpg"
                                    alt={t.products.title}
                                />

                                <div className="love-romance-product__shine"></div>

                            </div>

                            <div className="love-romance-product__body">

                                <span className="love-romance-product__number">
                                    02
                                </span>

                                <button
                                    type="button"
                                    className="love-romance-product__button"
                                >
                                    {t.products.viewProduct}
                                </button>

                            </div>

                        </article>


                        <article className="love-romance-product">

                            <div className="love-romance-product__image">

                                <img
                                    src="/images/collections/love-romance/love-romance-03.jpg"
                                    alt={t.products.title}
                                />

                                <div className="love-romance-product__shine"></div>

                            </div>

                            <div className="love-romance-product__body">

                                <span className="love-romance-product__number">
                                    03
                                </span>

                                <button
                                    type="button"
                                    className="love-romance-product__button"
                                >
                                    {t.products.viewProduct}
                                </button>

                            </div>

                        </article>


                        <article className="love-romance-product">

                            <div className="love-romance-product__image">

                                <img
                                    src="/images/collections/love-romance/love-romance-04.jpg"
                                    alt={t.products.title}
                                />

                                <div className="love-romance-product__shine"></div>

                            </div>

                            <div className="love-romance-product__body">

                                <span className="love-romance-product__number">
                                    04
                                </span>

                                <button
                                    type="button"
                                    className="love-romance-product__button"
                                >
                                    {t.products.viewProduct}
                                </button>

                            </div>

                        </article>

                    </div>

                </section>


                {/* ==================================================
                    FEATURED
                   ================================================== */}

                <section className="love-romance-featured">

                    <div className="love-romance-featured__visual">

                        <img
                            src="/images/collections/love-romance/love-romance-featured.jpg"
                            alt={t.featured.title}
                        />

                    </div>

                    <div className="love-romance-featured__overlay"></div>

                    <div className="love-romance-featured__content">

                        <span>
                            {t.featured.eyebrow}
                        </span>

                        <div className="love-romance-featured__ornament">

                            <span></span>

                            <b>♥</b>

                            <span></span>

                        </div>

                        <h2>

                            {t.featured.title}

                            <strong>
                                {t.featured.titleAccent}
                            </strong>

                        </h2>

                        <p>
                            {t.featured.description}
                        </p>

                        <button
                            type="button"
                            className="love-romance-featured__button"
                        >
                            {t.featured.button}
                        </button>

                    </div>

                </section>


                {/* ==================================================
                    FINAL CTA
                   ================================================== */}

                <section className="love-romance-cta">

                    <div className="love-romance-cta__glow"></div>

                    <div className="love-romance-cta__content">

                        <span>
                            {t.cta.eyebrow}
                        </span>

                        <div className="love-romance-cta__ornament">

                            <span></span>

                            <b>♥</b>

                            <span></span>

                        </div>

                        <h2>

                            {t.cta.title}

                            <strong>
                                {t.cta.titleAccent}
                            </strong>

                        </h2>

                        <p>
                            {t.cta.description}
                        </p>

                        <button
                            type="button"
                            className="love-romance-cta__button"
                        >
                            {t.cta.button}
                        </button>

                    </div>

                </section>

            </main>

            <Footer />
        </>
    );
}

export default LoveRomancePage;