/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: CollectionsPage.tsx
 * Module: Frontend
 * Language: TypeScript React
 * Description:
 * Premium Collections page.
 * Primary language: English (US).
 * Secondary language: Spanish.
 * ================================================================
 */

import { useEffect, useState } from "react";

import "./CollectionsPage.css";

import Header from "../../components/layout/Header";
import Footer from "../../components/home/Footer";

type Language = "en" | "es";

function CollectionsPage() {

    const [language, setLanguage] = useState<Language>("en");

    useEffect(() => {

        const storedLanguage = localStorage.getItem("language");

        if (storedLanguage === "es") {
            setLanguage("es");
        } else {
            setLanguage("en");
        }

        const handleLanguageChange = () => {

            const currentLanguage =
                localStorage.getItem("language");

            setLanguage(
                currentLanguage === "es"
                    ? "es"
                    : "en"
            );
        };

        window.addEventListener(
            "languagechange",
            handleLanguageChange
        );

        window.addEventListener(
            "storage",
            handleLanguageChange
        );

        return () => {

            window.removeEventListener(
                "languagechange",
                handleLanguageChange
            );

            window.removeEventListener(
                "storage",
                handleLanguageChange
            );
        };

    }, []);


    const translations = {

        en: {

            heroEyebrow: "COLLECTIONS",

            heroTitleFirst: "Explore Our",

            heroTitleSecond: "Collections",

            heroDescription:
                "Discover unique styles for every occasion. Each collection is carefully designed to match your style and every special moment.",

            browseEyebrow: "BROWSE BY",

            browseTitle: "COLLECTION",

            browseDescription:
                "Each collection is carefully designed to match your style and every special moment.",

            viewCollection: "VIEW COLLECTION",

            loveEyebrow: "LOVE EDITION",

            loveTitle:
                "Made for the moments that matter.",

            loveDescription:
                "Celebrate love, connection, and unforgettable memories with designs created to make every special moment last.",

            premiumQuality: "PREMIUM QUALITY",

            premiumQualityDescription:
                "Top quality materials and long lasting prints.",

            fastShipping: "FAST SHIPPING",

            fastShippingDescription:
                "Fast and secure shipping to your door.",

            customDesigns: "CUSTOM DESIGNS",

            customDesignsDescription:
                "Create your own design and make it unique.",

            securePayment: "SECURE PAYMENT",

            securePaymentDescription:
                "100% secure payments and data protection."
        },

        es: {

            heroEyebrow: "COLECCIONES",

            heroTitleFirst: "Explora Nuestras",

            heroTitleSecond: "Colecciones",

            heroDescription:
                "Descubre estilos únicos para cada ocasión. Cada colección está cuidadosamente diseñada para adaptarse a tu estilo y a cada momento especial.",

            browseEyebrow: "EXPLORA POR",

            browseTitle: "COLECCIÓN",

            browseDescription:
                "Cada colección está cuidadosamente diseñada para adaptarse a tu estilo y a cada momento especial.",

            viewCollection: "VER COLECCIÓN",

            loveEyebrow: "LOVE EDITION",

            loveTitle:
                "Creada para los momentos que importan.",

            loveDescription:
                "Celebra el amor, la conexión y los recuerdos inolvidables con diseños creados para hacer que cada momento especial perdure.",

            premiumQuality: "CALIDAD PREMIUM",

            premiumQualityDescription:
                "Materiales de alta calidad e impresiones duraderas.",

            fastShipping: "ENVÍO RÁPIDO",

            fastShippingDescription:
                "Envío rápido y seguro hasta tu puerta.",

            customDesigns: "DISEÑOS PERSONALIZADOS",

            customDesignsDescription:
                "Crea tu propio diseño y hazlo único.",

            securePayment: "PAGO SEGURO",

            securePaymentDescription:
                "Pagos 100% seguros y protección de tus datos."
        }
    };


    const currentText =
        translations[language];


    /*
     * ==============================================================
     * COLLECTIONS
     * ==============================================================
     *
     * English is the primary language.
     * Spanish is the secondary translation.
     *
     * We keep the four existing collections.
     * ==============================================================
     */

    const collections = [

        {
            id: 1,

            name: {
                en: "Premium",
                es: "Premium"
            },

            image:
                "/images/collections/collection-1.jpg"
        },

        {
            id: 2,

            name: {
                en: "Classic",
                es: "Clásica"
            },

            image:
                "/images/collections/collection-2.jpg"
        },

        {
            id: 3,

            name: {
                en: "Marble",
                es: "Mármol"
            },

            image:
                "/images/collections/collection-3.jpg"
        },

        {
            id: 4,

            name: {
                en: "Personalized",
                es: "Personalizada"
            },

            image:
                "/images/collections/collection-4.jpg"
        }
    ];


    /*
     * ==============================================================
     * BENEFITS
     * ==============================================================
     */

    const benefits = [

        {
            id: 1,

            title: currentText.premiumQuality,

            description:
                currentText.premiumQualityDescription,

            icon: (

                <svg
                    viewBox="0 0 64 64"
                    aria-hidden="true"
                >

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
            )
        },

        {
            id: 2,

            title: currentText.fastShipping,

            description:
                currentText.fastShippingDescription,

            icon: (

                <svg
                    viewBox="0 0 64 64"
                    aria-hidden="true"
                >

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
            )
        },

        {
            id: 3,

            title: currentText.customDesigns,

            description:
                currentText.customDesignsDescription,

            icon: (

                <svg
                    viewBox="0 0 64 64"
                    aria-hidden="true"
                >

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
            )
        },

        {
            id: 4,

            title: currentText.securePayment,

            description:
                currentText.securePaymentDescription,

            icon: (

                <svg
                    viewBox="0 0 64 64"
                    aria-hidden="true"
                >

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
            )
        }
    ];


    return (

        <>
            <Header />

            <main className="collections-page">

                {/* ==================================================
                    COLLECTIONS HERO
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

                            {currentText.heroEyebrow}

                        </span>


                        <div className="collections-hero__ornament">

                            <span></span>

                            <i>
                                ✦
                            </i>

                            <span></span>

                        </div>


                        <h1>

                            {currentText.heroTitleFirst}

                            <span>
                                {currentText.heroTitleSecond}
                            </span>

                        </h1>


                        <p>

                            {currentText.heroDescription}

                        </p>

                    </div>

                </section>


                {/* ==================================================
                    BROWSE BY COLLECTION
                   ================================================== */}

                <section className="collections-browse">

                    <div className="collections-section-heading">

                        <span>

                            {currentText.browseEyebrow}

                        </span>


                        <strong>

                            {currentText.browseTitle}

                        </strong>


                        <div className="collections-heading-line">

                            <span></span>

                            <i>
                                ✦
                            </i>

                            <span></span>

                        </div>


                        <p>

                            {currentText.browseDescription}

                        </p>

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
                                        alt={`${collection.name[language]} collection`}
                                    />

                                </div>


                                <div className="collection-card__content">

                                    <span className="collection-card__number">

                                        0{collection.id}

                                    </span>


                                    <h2>

                                        {collection.name[language]}

                                    </h2>


                                    <button
                                        className="collection-card__button"
                                        type="button"
                                    >

                                        {currentText.viewCollection}

                                        <span aria-hidden="true">
                                            →
                                        </span>

                                    </button>

                                </div>

                            </article>

                        ))}

                    </div>


                    {/* ==================================================
                        LOVE EDITION
                       ================================================== */}

                    <section className="love-edition">

                        <div className="love-edition__content">

                            <span className="love-edition__eyebrow">

                                {currentText.loveEyebrow}

                            </span>


                            <div className="love-edition__ornament">

                                <span></span>

                                <i>
                                    ♥
                                </i>

                                <span></span>

                            </div>


                            <h2>

                                {currentText.loveTitle}

                            </h2>


                            <p>

                                {currentText.loveDescription}

                            </p>

                        </div>


                        <div className="love-edition__image">

                            <img
                                src="/images/collections/collection-1.jpg"
                                alt="Love Edition"
                            />

                        </div>

                    </section>


                    {/* ==================================================
                        COLLECTION BENEFITS
                       ================================================== */}

                    <div className="collections-benefits">

                        {benefits.map((benefit) => (

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

                            </article>

                        ))}

                    </div>

                </section>

            </main>


            <Footer />

        </>

    );
}

export default CollectionsPage;