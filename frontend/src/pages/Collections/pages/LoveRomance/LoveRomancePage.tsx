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

import { useState } from "react";
import { Link } from "react-router-dom";

import Header from "../../../../components/layout/Header";
import Footer from "../../../../components/home/Footer";

import { useLanguage } from "../../../../contexts/LanguageContext";
import { translations } from "../../../../translations";

interface CollectionImage {
    id: string;
    imageUrl: string;
    alt: string;
    sortOrder: number;
    isActive: boolean;

    /**
     * Temporary product information.
     *
     * This structure is prepared for future backend/admin
     * integration. These values will later come from the backend.
     */
    name: string;
    description: string;
    price: number;
}


/**
 * Temporary frontend data.
 *
 * This structure is intentionally prepared for future backend/admin
 * integration. Later, the administrator will be able to manage
 * collection products without modifying this page.
 */
const loveRomanceImages: CollectionImage[] = [
    {
        id: "love-romance-01",
        imageUrl:
            "/images/collections/love-romance/love-romance-01.jpg",
        alt: "Love & Romance design 01",
        sortOrder: 1,
        isActive: true,
        name: "Love & Romance Design 01",
        description:
            "A beautiful personalized design created to celebrate love, meaningful moments and unforgettable memories.",
        price: 24.99,
    },
    {
        id: "love-romance-02",
        imageUrl:
            "/images/collections/love-romance/love-romance-01.jpg",
        alt: "Love & Romance design 02",
        sortOrder: 2,
        isActive: true,
        name: "Love & Romance Design 02",
        description:
            "A romantic personalized design created to make your special moments even more memorable.",
        price: 24.99,
    },
    {
        id: "love-romance-03",
        imageUrl:
            "/images/collections/love-romance/love-romance-01.jpg",
        alt: "Love & Romance design 03",
        sortOrder: 3,
        isActive: true,
        name: "Love & Romance Design 03",
        description:
            "A premium personalized design made for couples, anniversaries and meaningful celebrations.",
        price: 24.99,
    },
    {
        id: "love-romance-04",
        imageUrl:
            "/images/collections/love-romance/love-romance-01.jpg",
        alt: "Love & Romance design 04",
        sortOrder: 4,
        isActive: true,
        name: "Love & Romance Design 04",
        description:
            "An elegant personalized design created to turn your favorite memories into something special.",
        price: 24.99,
    },
    {
        id: "love-romance-05",
        imageUrl:
            "/images/collections/love-romance/love-romance-01.jpg",
        alt: "Love & Romance design 05",
        sortOrder: 5,
        isActive: true,
        name: "Love & Romance Design 05",
        description:
            "A sophisticated romantic design perfect for gifts and unforgettable occasions.",
        price: 24.99,
    },
    {
        id: "love-romance-06",
        imageUrl:
            "/images/collections/love-romance/love-romance-01.jpg",
        alt: "Love & Romance design 06",
        sortOrder: 6,
        isActive: true,
        name: "Love & Romance Design 06",
        description:
            "A personalized premium design created with love for the moments that matter most.",
        price: 24.99,
    },
    {
        id: "love-romance-07",
        imageUrl:
            "/images/collections/love-romance/love-romance-01.jpg",
        alt: "Love & Romance design 07",
        sortOrder: 7,
        isActive: true,
        name: "Love & Romance Design 07",
        description:
            "A timeless personalized design created to celebrate your unique story together.",
        price: 24.99,
    },
    {
        id: "love-romance-08",
        imageUrl:
            "/images/collections/love-romance/love-romance-01.jpg",
        alt: "Love & Romance design 08",
        sortOrder: 8,
        isActive: true,
        name: "Love & Romance Design 08",
        description:
            "A premium romantic design made to transform special memories into beautiful keepsakes.",
        price: 24.99,
    },
];


function LoveRomancePage() {

    const { language } = useLanguage();

    const t = translations[language].loveRomance;

    const [selectedImage, setSelectedImage] =
        useState<CollectionImage | null>(null);

    const activeImages = loveRomanceImages
        .filter((image) => image.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder);


    const handleAddToCart = (image: CollectionImage) => {

        /**
         * Temporary cart action.
         *
         * The real cart integration will be connected later
         * with the backend/cart system.
         */

        console.log("Add to cart:", image);

    };


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

                        <Link
                            to="/collections"
                            className="love-romance-back-link"
                        >
                            ←{" "}
                            {language === "es"
                                ? "VOLVER A COLECCIONES"
                                : "BACK TO COLLECTIONS"}
                        </Link>

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
                    COLLECTION IMAGES
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

                        {activeImages.map((image) => (

                            <article
                                className="love-romance-product"
                                key={image.id}
                            >

                                <div
                                    className="love-romance-product__image"
                                    onClick={() =>
                                        setSelectedImage(image)
                                    }
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(event) => {

                                        if (
                                            event.key === "Enter" ||
                                            event.key === " "
                                        ) {
                                            event.preventDefault();
                                            setSelectedImage(image);
                                        }

                                    }}
                                    aria-label={
                                        language === "es"
                                            ? `Ver ${image.name} en grande`
                                            : `View ${image.name} enlarged`
                                    }
                                >

                                    <img
                                        src={image.imageUrl}
                                        alt={image.alt}
                                    />

                                    <div className="love-romance-product__shine"></div>

                                </div>


                                <div className="love-romance-product__body">

                                    <span className="love-romance-product__number">
                                        {String(image.sortOrder).padStart(2, "0")}
                                    </span>

                                    <button
                                        type="button"
                                        className="love-romance-product__button"
                                        onClick={() =>
                                            setSelectedImage(image)
                                        }
                                    >
                                        {t.products.viewProduct}
                                    </button>

                                </div>

                            </article>

                        ))}

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


                {/* ==================================================
                    PRODUCT LIGHTBOX
                   ================================================== */}

                {selectedImage && (

                    <div
                        className="love-romance-lightbox"
                        role="dialog"
                        aria-modal="true"
                        aria-label={
                            language === "es"
                                ? "Detalles del producto"
                                : "Product details"
                        }
                        onClick={() =>
                            setSelectedImage(null)
                        }
                    >

                        <button
                            type="button"
                            className="love-romance-lightbox__close"
                            onClick={() =>
                                setSelectedImage(null)
                            }
                            aria-label={
                                language === "es"
                                    ? "Cerrar"
                                    : "Close"
                            }
                        >
                            ×
                        </button>


                        <div
                            className="love-romance-lightbox__content"
                            onClick={(event) =>
                                event.stopPropagation()
                            }
                        >

                            <div className="love-romance-lightbox__visual">

                                <img
                                    src={selectedImage.imageUrl}
                                    alt={selectedImage.alt}
                                    className="love-romance-lightbox__image"
                                />

                            </div>


                            <div className="love-romance-lightbox__details">

                                <span className="love-romance-lightbox__eyebrow">
                                    {language === "es"
                                        ? "LOVE & ROMANCE"
                                        : "LOVE & ROMANCE"}
                                </span>

                                <h2>
                                    {selectedImage.name}
                                </h2>

                                <div className="love-romance-lightbox__ornament">

                                    <span></span>

                                    <b>♥</b>

                                    <span></span>

                                </div>

                                <p>
                                    {selectedImage.description}
                                </p>

                                <div className="love-romance-lightbox__price">

                                    <span>
                                        {language === "es"
                                            ? "PRECIO"
                                            : "PRICE"}
                                    </span>

                                    <strong>
                                        ${selectedImage.price.toFixed(2)}
                                    </strong>

                                </div>

                                <button
                                    type="button"
                                    className="love-romance-lightbox__cart-button"
                                    onClick={() =>
                                        handleAddToCart(selectedImage)
                                    }
                                >
                                    {language === "es"
                                        ? "AGREGAR AL CARRITO"
                                        : "ADD TO CART"}
                                </button>

                            </div>

                        </div>

                    </div>

                )}

            </main>

            <Footer />
        </>
    );
}

export default LoveRomancePage;