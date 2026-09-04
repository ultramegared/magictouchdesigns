/**
 * ===============================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: BusinessBrandingPage.tsx
 * Module: Collections / Business & Branding
 * Language: TypeScript React
 * Description:
 * Premium Business & Branding collection page.
 * ===============================================================
 */

import "./BusinessBrandingPage.css";

import { useState } from "react";
import { Link } from "react-router-dom";

import Header from "../../../../components/layout/Header";
import Footer from "../../../../components/home/Footer";

import { useLanguage } from "../../../../contexts/LanguageContext";
import { translations } from "../../../../translations";

import { addToCart } from "../../../../utils/cart";


interface CollectionImage {
    id: string;
    imageUrl: string;
    alt: string;
    sortOrder: number;
    isActive: boolean;

    /**
     * Temporary product information.
     *
     * Prepared for future backend/admin integration.
     */
    name: string;
    description: string;
    price: number;
    rating: number;
}


const businessBrandingImages: CollectionImage[] = [

    {
        id: "business-branding-01",
        imageUrl:
            "/images/collections/business-branding/business-branding-01.jpg",
        alt: "Business & Branding design 01",
        sortOrder: 1,
        isActive: true,
        name: "Business & Branding Design 01",
        description:
            "A refined custom design created to give your business a polished and memorable visual presence.",
        price: 24.99,
        rating: 5,
    },

    {
        id: "business-branding-02",
        imageUrl:
            "/images/collections/business-branding/business-branding-02.jpg",
        alt: "Business & Branding design 02",
        sortOrder: 2,
        isActive: true,
        name: "Business & Branding Design 02",
        description:
            "A professional personalized design made to complement your brand and strengthen your business identity.",
        price: 24.99,
        rating: 5,
    },

    {
        id: "business-branding-03",
        imageUrl:
            "/images/collections/business-branding/business-branding-03.jpg",
        alt: "Business & Branding design 03",
        sortOrder: 3,
        isActive: true,
        name: "Business & Branding Design 03",
        description:
            "A distinctive branding piece designed for businesses that want their products to stand apart.",
        price: 24.99,
        rating: 5,
    },

    {
        id: "business-branding-04",
        imageUrl:
            "/images/collections/business-branding/business-branding-04.jpg",
        alt: "Business & Branding design 04",
        sortOrder: 4,
        isActive: true,
        name: "Business & Branding Design 04",
        description:
            "A sophisticated personalized concept created to bring consistency and character to your brand.",
        price: 24.99,
        rating: 5,
    },

    {
        id: "business-branding-05",
        imageUrl:
            "/images/collections/business-branding/business-branding-05.jpg",
        alt: "Business & Branding design 05",
        sortOrder: 5,
        isActive: true,
        name: "Business & Branding Design 05",
        description:
            "A premium custom design ideal for promotional pieces, client gifts and branded products.",
        price: 24.99,
        rating: 5,
    },

    {
        id: "business-branding-06",
        imageUrl:
            "/images/collections/business-branding/business-branding-06.jpg",
        alt: "Business & Branding design 06",
        sortOrder: 6,
        isActive: true,
        name: "Business & Branding Design 06",
        description:
            "A modern personalized design created to turn your business vision into a tangible branded experience.",
        price: 24.99,
        rating: 5,
    },

    {
        id: "business-branding-07",
        imageUrl:
            "/images/collections/business-branding/business-branding-07.jpg",
        alt: "Business & Branding design 07",
        sortOrder: 7,
        isActive: true,
        name: "Business & Branding Design 07",
        description:
            "A clean and versatile design created for brands that value professionalism and attention to detail.",
        price: 24.99,
        rating: 5,
    },

    {
        id: "business-branding-08",
        imageUrl:
            "/images/collections/business-branding/business-branding-08.jpg",
        alt: "Business & Branding design 08",
        sortOrder: 8,
        isActive: true,
        name: "Business & Branding Design 08",
        description:
            "An elevated custom design created to help your brand make a lasting impression.",
        price: 24.99,
        rating: 5,
    },

];


function BusinessBrandingPage() {

    const { language } = useLanguage();

    const t = translations[language].businessBranding;


    const [selectedImage, setSelectedImage] =
        useState<CollectionImage | null>(null);


    const [quantities, setQuantities] =
        useState<Record<string, number>>({});


    const activeImages = businessBrandingImages
        .filter((image) => image.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder);


    const getQuantity = (id: string): number => {

        return quantities[id] ?? 1;

    };


    const changeQuantity = (
        id: string,
        change: number
    ) => {

        setQuantities((current) => {

            const currentQuantity =
                current[id] ?? 1;

            const nextQuantity =
                Math.max(
                    1,
                    currentQuantity + change
                );

            return {
                ...current,
                [id]: nextQuantity,
            };

        });

    };


    const handleAddToCart = (
        image: CollectionImage,
        quantity: number = 1
    ) => {

        addToCart(
            {
                id: image.id,
                name: image.name,
                model: "Business & Branding",
                size: "Standard",
                color: "Default",
                price: image.price,
                image: image.imageUrl,
            },
            quantity
        );

    };


    const handleCardAddToCart = (
        image: CollectionImage
    ) => {

        const quantity =
            getQuantity(image.id);

        handleAddToCart(
            image,
            quantity
        );

    };


    const handleLightboxAddToCart = (
        image: CollectionImage
    ) => {

        handleAddToCart(
            image,
            1
        );

    };


    return (
        <>
            <Header />

            <main className="business-branding-page">

                {/* ==================================================
                    HERO
                   ================================================== */}

                <section className="business-branding-hero">

                    <div className="business-branding-hero__visual">

                        <img
                            src="/images/collections/business-branding/business-branding-hero.jpg"
                            alt={t.hero.title}
                        />

                    </div>

                    <div className="business-branding-hero__overlay"></div>

                    <div className="business-branding-hero__glow"></div>

                    <div className="business-branding-hero__content">

                        <Link
                            to="/collections"
                            className="business-branding-back-link"
                        >
                            ←{" "}
                            {language === "es"
                                ? "VOLVER A COLECCIONES"
                                : "BACK TO COLLECTIONS"}
                        </Link>

                        <span className="business-branding-hero__eyebrow">
                            {t.hero.eyebrow}
                        </span>

                        <h1>

                            {t.hero.title}

                            <span>
                                {t.hero.titleAccent}
                            </span>

                        </h1>

                        <div className="business-branding-hero__ornament">

                            <span></span>

                            <b>◆</b>

                            <span></span>

                        </div>

                        <p>
                            {t.hero.description}
                        </p>

                        <Link
                            to="/customize"
                            className="business-branding-hero__button"
                        >
                            {t.hero.button}
                        </Link>

                    </div>

                    <div className="business-branding-hero__bottom-glow"></div>

                </section>


                {/* ==================================================
                    PRODUCTS
                   ================================================== */}

                <section className="business-branding-products">

                    <div className="business-branding-section-heading">

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


                    <div className="business-branding-products__grid">

                        {activeImages.map((image) => {

                            const quantity =
                                getQuantity(image.id);

                            return (

                                <article
                                    className="business-branding-product"
                                    key={image.id}
                                >

                                    {/* IMAGE */}

                                    <div
                                        className="business-branding-product__image"
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

                                        <span
                                            className="business-branding-product__zoom"
                                            aria-hidden="true"
                                        >
                                            <svg
                                                viewBox="0 0 24 24"
                                                aria-hidden="true"
                                            >
                                                <circle
                                                    cx="11"
                                                    cy="11"
                                                    r="6.5"
                                                />

                                                <path
                                                    d="M16 16L21 21"
                                                />

                                            </svg>
                                        </span>

                                        <span className="business-branding-product__number">

                                            {String(
                                                image.sortOrder
                                            ).padStart(2, "0")}

                                        </span>

                                        <div className="business-branding-product__shine"></div>

                                    </div>


                                    {/* PRODUCT BODY */}

                                    <div className="business-branding-product__body">

                                        <div className="business-branding-product__info">

                                            <strong className="business-branding-product__price">

                                                ${image.price.toFixed(2)}

                                            </strong>

                                        </div>


                                        {/* QUANTITY */}

                                        <div className="business-branding-product__quantity">

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    changeQuantity(
                                                        image.id,
                                                        -1
                                                    )
                                                }
                                                aria-label={
                                                    language === "es"
                                                        ? "Disminuir cantidad"
                                                        : "Decrease quantity"
                                                }
                                            >
                                                −
                                            </button>

                                            <span>
                                                {quantity}
                                            </span>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    changeQuantity(
                                                        image.id,
                                                        1
                                                    )
                                                }
                                                aria-label={
                                                    language === "es"
                                                        ? "Aumentar cantidad"
                                                        : "Increase quantity"
                                                }
                                            >
                                                +
                                            </button>

                                        </div>


                                        {/* ADD TO CART */}

                                        <button
                                            type="button"
                                            className="business-branding-product__button"
                                            onClick={() =>
                                                handleCardAddToCart(image)
                                            }
                                            aria-label={
                                                language === "es"
                                                    ? `Agregar ${image.name} al carrito`
                                                    : `Add ${image.name} to cart`
                                            }
                                        >
                                            {language === "es"
                                                ? "AGREGAR AL CARRITO"
                                                : "ADD TO CART"}
                                        </button>

                                    </div>

                                </article>

                            );

                        })}

                    </div>

                </section>


                {/* ==================================================
                    FEATURED
                   ================================================== */}

                <section className="business-branding-featured">

                    <div className="business-branding-featured__visual">

                        <img
                            src="/images/collections/business-branding/business-branding-featured.jpg"
                            alt={t.featured.title}
                        />

                    </div>

                    <div className="business-branding-featured__overlay"></div>

                    <div className="business-branding-featured__content">

                        <span>
                            {t.featured.eyebrow}
                        </span>

                        <div className="business-branding-featured__ornament">

                            <span></span>

                            <b>◆</b>

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

                        <Link
                            to="/customize"
                            className="business-branding-featured__button"
                        >
                            {t.featured.button}
                        </Link>

                    </div>

                </section>


                {/* ==================================================
                    FINAL CTA
                   ================================================== */}

                <section className="business-branding-cta">

                    <div className="business-branding-cta__glow"></div>

                    <div className="business-branding-cta__content">

                        <span>
                            {t.cta.eyebrow}
                        </span>

                        <div className="business-branding-cta__ornament">

                            <span></span>

                            <b>◆</b>

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

                        <Link
                            to="/customize"
                            className="business-branding-cta__button"
                        >
                            {t.cta.button}
                        </Link>

                    </div>

                </section>


                {/* ==================================================
                    PRODUCT LIGHTBOX
                   ================================================== */}

                {selectedImage && (

                    <div
                        className="business-branding-lightbox"
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
                            className="business-branding-lightbox__close"
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
                            className="business-branding-lightbox__content"
                            onClick={(event) =>
                                event.stopPropagation()
                            }
                        >

                            <div className="business-branding-lightbox__visual">

                                <img
                                    src={selectedImage.imageUrl}
                                    alt={selectedImage.alt}
                                    className="business-branding-lightbox__image"
                                />

                            </div>


                            <div className="business-branding-lightbox__details">

                                <span className="business-branding-lightbox__eyebrow">
                                    BUSINESS & BRANDING
                                </span>

                                <h2>
                                    {selectedImage.name}
                                </h2>


                                {/* RATING */}

                                <div
                                    className="business-branding-lightbox__rating"
                                    aria-label={
                                        language === "es"
                                            ? `${selectedImage.rating} de 5 estrellas`
                                            : `${selectedImage.rating} out of 5 stars`
                                    }
                                >

                                    {Array.from(
                                        { length: 5 },
                                        (_, index) => (

                                            <span
                                                key={index}
                                                className={
                                                    index <
                                                    selectedImage.rating
                                                        ? "is-active"
                                                        : ""
                                                }
                                            >
                                                ★
                                            </span>

                                        )
                                    )}

                                </div>


                                <div className="business-branding-lightbox__ornament">

                                    <span></span>

                                    <b>◆</b>

                                    <span></span>

                                </div>


                                <p>
                                    {selectedImage.description}
                                </p>


                                <div className="business-branding-lightbox__price">

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
                                    className="business-branding-lightbox__cart-button"
                                    onClick={() =>
                                        handleLightboxAddToCart(
                                            selectedImage
                                        )
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

export default BusinessBrandingPage;