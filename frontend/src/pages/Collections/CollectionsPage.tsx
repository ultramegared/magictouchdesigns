/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: CollectionsPage.tsx
 * Module: Frontend
 * Language: TypeScript React
 * Description:
 * Premium collections page.
 * ================================================================
 */

import "./CollectionsPage.css";

import Header from "../../components/layout/Header";
import Footer from "../../components/home/Footer";

function CollectionsPage() {
    const collections = [
        {
            id: 1,
            title: "LOVE & ROMANCE",
            description: "Perfect gifts for that special someone.",
            image: "/images/collections/collection-1.jpg",
        },
        {
            id: 2,
            title: "FAMILY & MEMORIES",
            description: "Turn memories into something beautiful.",
            image: "/images/collections/collection-2.jpg",
        },
        {
            id: 3,
            title: "BUSINESS & BRANDING",
            description: "Custom designs for your brand and business.",
            image: "/images/collections/collection-3.jpg",
        },
        {
            id: 4,
            title: "SPECIAL OCCASIONS",
            description: "Celebrate life's most important moments.",
            image: "/images/collections/collection-4.jpg",
        },
    ];

    const benefits = [
        {
            id: 1,
            title: "PREMIUM QUALITY",
            description: "Premium materials and high-quality finishes.",
            icon: (
                <svg viewBox="0 0 64 64" aria-hidden="true">
                    <path
                        d="M32 7L39 20L53 22L43 32L46 46L32 39L18 46L21 32L11 22L25 20Z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinejoin="round"
                    />
                    <circle
                        cx="32"
                        cy="29"
                        r="5"
                        fill="currentColor"
                    />
                </svg>
            ),
        },
        {
            id: 2,
            title: "FAST SHIPPING",
            description: "Fast and secure delivery to your door.",
            icon: (
                <svg viewBox="0 0 64 64" aria-hidden="true">
                    <path
                        d="M7 17H39V43H7Z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M39 25H49L57 34V43H39Z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinejoin="round"
                    />
                    <circle
                        cx="19"
                        cy="48"
                        r="5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                    />
                    <circle
                        cx="47"
                        cy="48"
                        r="5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                    />
                </svg>
            ),
        },
        {
            id: 3,
            title: "CUSTOM DESIGNS",
            description: "Personalized designs created just for you.",
            icon: (
                <svg viewBox="0 0 64 64" aria-hidden="true">
                    <path
                        d="M11 53L17 38L43 12L52 21L26 47Z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M38 17L47 26"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                    />
                    <path
                        d="M11 53L25 48"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                    />
                </svg>
            ),
        },
        {
            id: 4,
            title: "SECURE PAYMENT",
            description: "Secure payments and protection of your data.",
            icon: (
                <svg viewBox="0 0 64 64" aria-hidden="true">
                    <path
                        d="M32 7L52 14V29C52 42 44 52 32 57C20 52 12 42 12 29V14Z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M21 32L29 40L44 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            ),
        },
    ];

    const scrollToCollections = () => {
        document
            .getElementById("collections-grid")
            ?.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
    };

    return (
        <>
            <Header />

            <main className="collections-page">

                {/* ==================================================
                    HERO
                   ================================================== */}

                <section className="collections-hero">

                    <div className="collections-hero__background">
                        <img
                            src="/images/collections/collections-hero.jpg"
                            alt="Magic Touch Designs collections"
                        />
                    </div>

                    <div className="collections-hero__overlay"></div>

                    <div className="collections-hero__content">

                        <span className="collections-hero__eyebrow">
                            CURATED WITH LOVE
                        </span>

                        <h1>
                            OUR
                            <span>COLLECTIONS</span>
                        </h1>

                        <div className="collections-hero__divider">
                            <span></span>
                            <b>◆</b>
                            <span></span>
                        </div>

                        <p>
                            Premium designs, timeless quality and
                            personalized just for you.
                        </p>

                        <button
                            className="collections-hero__button"
                            type="button"
                            onClick={scrollToCollections}
                        >
                            BROWSE OUR COLLECTIONS
                            <span aria-hidden="true">↓</span>
                        </button>

                    </div>

                </section>


                {/* ==================================================
                    COLLECTIONS
                   ================================================== */}

                <section
                    className="collections-browse"
                    id="collections-grid"
                >

                    <div className="collections-section-heading">

                        <div className="collections-section-heading__line">
                            <span></span>

                            <div>
                                <b>♕</b>
                                <strong>BROWSE OUR COLLECTIONS</strong>
                            </div>

                            <span></span>
                        </div>

                    </div>


                    <div className="collections-grid">

                        {collections.map((collection) => (

                            <article
                                className="collection-card"
                                key={collection.id}
                            >

                                <div className="collection-card__image">

                                    <img
                                        src={collection.image}
                                        alt={collection.title}
                                    />

                                    <div className="collection-card__image-overlay"></div>

                                </div>

                                <div className="collection-card__content">

                                    <div className="collection-card__icon">

                                        {collection.id === 1 && "♡"}

                                        {collection.id === 2 && "♧"}

                                        {collection.id === 3 && "▱"}

                                        {collection.id === 4 && "✦"}

                                    </div>

                                    <h2>
                                        {collection.title}
                                    </h2>

                                    <p>
                                        {collection.description}
                                    </p>

                                    <button
                                        className="collection-card__button"
                                        type="button"
                                    >
                                        VIEW COLLECTION
                                    </button>

                                </div>

                            </article>

                        ))}

                    </div>

                </section>


                {/* ==================================================
                    FEATURED COLLECTION
                   ================================================== */}

                <section className="collections-featured">

                    <div className="collections-featured__content">

                        <span className="collections-featured__eyebrow">
                            FEATURED COLLECTION
                        </span>

                        <div className="collections-featured__accent">
                            <span></span>
                            <b>◆</b>
                        </div>

                        <h2>
                            LOVE EDITION
                        </h2>

                        <p>
                            Designed for moments that deserve
                            to be remembered.
                        </p>

                        <button
                            className="collections-featured__button"
                            type="button"
                        >
                            EXPLORE LOVE EDITION
                        </button>

                    </div>

                    <div className="collections-featured__image">

                        <img
                            src="/images/collections/collection-1.jpg"
                            alt="Love Edition collection"
                        />

                    </div>

                </section>


                {/* ==================================================
                    PREMIUM BENEFITS
                   ================================================== */}

                <section className="collections-benefits">

                    {benefits.map((benefit, index) => (

                        <article
                            className="collection-benefit"
                            key={benefit.id}
                        >

                            <div className="collection-benefit__icon">
                                {benefit.icon}
                            </div>

                            <div className="collection-benefit__content">

                                <h3>
                                    {benefit.title}
                                </h3>

                                <p>
                                    {benefit.description}
                                </p>

                            </div>

                            {index < benefits.length - 1 && (
                                <span
                                    className="collection-benefit__separator"
                                    aria-hidden="true"
                                />
                            )}

                        </article>

                    ))}

                </section>

            </main>

            <Footer />
        </>
    );
}

export default CollectionsPage;