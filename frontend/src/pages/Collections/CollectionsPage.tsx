/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: CollectionsPage.tsx
 * Module: Frontend
 * Language: TypeScript React
 * Description:
 * Premium collections landing page.
 * ================================================================
 */

import "./CollectionsPage.css";
import Header from "../../components/layout/Header";
import Footer from "../../components/home/Footer";
import { useLanguage } from "../../contexts/LanguageContext";
import { translations } from "../../translations";

function CollectionsPage() {
  const { language } = useLanguage();
  const t = translations[language].collections;

     const collections = [
    {
      id: 1,
      translationKey: "loveRomance",
      image: "/images/collections/love-romance.jpg",
      icon: "♡",
    },
    {
      id: 2,
      translationKey: "familyMemories",
      image: "/images/collections/family-memories.jpg",
      icon: "♧",
    },
    {
      id: 3,
      translationKey: "businessBranding",
      image: "/images/collections/business-branding.jpg",
      icon: "▱",
    },
    {
      id: 4,
      translationKey: "specialOccasions",
      image: "/images/collections/special-occasions.jpg",
      icon: "✦",
    },
  ] as const;

    const benefits = [
        {
            id: 1,
            translationKey: "premiumQuality",
            icon: (
                <svg viewBox="0 0 64 64" aria-hidden="true">
    <path
        d="M8 20L18 30L25 15L32 27L39 15L46 30L56 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
    />

    <path
        d="M14 34H50"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
    />

    <path
        d="M17 34L20 49H44L47 34"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinejoin="round"
    />

    <circle
        cx="32"
        cy="9"
        r="2.2"
        fill="currentColor"
    />
</svg>
            ),
        },
        
        {
    id: 2,
    translationKey: "fastShipping",
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
                d="M39 25H48L57 34V43H39Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinejoin="round"
            />

            <path
                d="M15 43C15 46.3 17.7 49 21 49C24.3 49 27 46.3 27 43"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
            />

            <path
                d="M43 43C43 46.3 45.7 49 49 49C52.3 49 55 46.3 55 43"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
            />
        </svg>
    ),
},
{
    id: 3,
    translationKey: "customDesigns",
    icon: (
        <svg viewBox="0 0 64 64" aria-hidden="true">
            <path
                d="M11 53L17 38L43 12L52 21L26 47L11 53Z"
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
                strokeLinecap="round"
            />

            <path
                d="M11 53L25 49"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
            />
        </svg>
    ),
},

        {
            id: 4,
            translationKey: "securePayment",
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

    return (
        <>
            <Header />

            <main className="collections-page">

                {/* ==================================================
                    HERO
                   ================================================== */}

                <section className="collections-hero">

                    <div className="collections-hero__image">
                        <img
                            src="/images/collections/collections-hero2.jpg"
                            alt="Magic Touch Designs premium collection"
                        />
                    </div>

                    <div className="collections-hero__overlay"></div>

                    <div className="collections-hero__content">

                        <span className="collections-hero__eyebrow">
                           {t.hero.eyebrow}
                            <span className="collections-hero__crown">
                                ♕
                            </span>
                        </span>

                        <h1>
                            {t.hero.title}
                        <span>{t.hero.titleAccent}</span>
                            
                        </h1>

                        <div className="collections-hero__ornament">
                            <span></span>
                            <b>◆</b>
                            <span></span>
                        </div>

                        <p>
                            {t.hero.description}
                        </p>

                    </div>

                    <div className="collections-hero__bottom-curve">
                        <span></span>
                    </div>

                </section>


                {/* ==================================================
                    BROWSE OUR COLLECTIONS
                   ================================================== */}

                <section className="collections-section">

                    <div className="collections-heading">

                        <div className="collections-heading__ornament">
                            <span></span>

                            <div>
                                <b>♕</b>
                                <h2>{t.browse.title}</h2>
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

                                <div className="collection-card__visual">

                                    <img
                                        src={collection.image}
                                        alt={t.cards[collection.translationKey].title}
                                        
                                    />

                                    <div className="collection-card__fade"></div>

                                </div>

                                <div className="collection-card__body">

                                    <div className="collection-card__icon">
                                        {collection.icon}
                                    </div>

                                    <h3>
                                        t.cards[collection.translationKey].title
                                    </h3>

                                    <p>
                                        t.cards[collection.translationKey].description
                                        
                                    </p>

                                    <button
                                        type="button"
                                        className="collection-card__button"
                                    >
                                        {t.browse.viewCollection}
                              
                                    </button>

                                </div>

                            </article>

                        ))}

                    </div>

                </section>


                {/* ==================================================
                    LOVE EDITION
                   ================================================== */}

                <section className="love-edition">

                    <div className="love-edition__visual">
                        <img
                            src="/images/collections/love-edition.jpg"
                            alt="Love Edition"
                        />
                    </div>

                    <div className="love-edition__overlay"></div>

                    <div className="love-edition__content">

                        <span className="love-edition__eyebrow">
                            {t.featured.eyebrow}
                        </span>

                        <div className="love-edition__ornament">
                            <span></span>
                            <b>◆</b>
                        </div>

                        <h2>
                            {t.featured.title}
                        </h2>

                        <p>
                            {t.featured.description}
                        </p>

                        <button
                            type="button"
                            className="love-edition__button"
                        >
                            {t.featured.button}
                        </button>

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

                            <div className="collection-benefit__text">

                                <h3>
  {t.benefits[benefit.translationKey].title}
</h3>

<p>
  {t.benefits[benefit.translationKey].description}
</p>

                            </div>

                            {index < benefits.length - 1 && (
                                <span
                                    className="collection-benefit__divider"
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