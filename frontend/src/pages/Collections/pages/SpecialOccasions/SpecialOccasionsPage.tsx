/**
 * ===============================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: SpecialOccasionsPage.tsx
 * Module: Collections / Special Occasions
 * Language: TypeScript React
 * Description:
 * Premium Special Occasions collection page.
 * Prepared for future backend/admin integration.
 * ===============================================================
 */

import "./SpecialOccasionsPage.css";

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


const specialOccasionsImages: CollectionImage[] = [

    {
        id: "special-occasions-01",
        imageUrl:
            "/images/collections/special-occasions/special-occasions-01.jpg",
        alt: "Special Occasions design 01",
        sortOrder: 1,
        isActive: true,
        name: "Special Occasions Design 01",
        description:
            "A personalized design created to make birthdays, celebrations and meaningful moments even more memorable.",
        price: 24.99,
        rating: 5,
    },

    {
        id: "special-occasions-02",
        imageUrl:
            "/images/collections/special-occasions/special-occasions-02.jpg",
        alt: "Special Occasions design 02",
        sortOrder: 2,
        isActive: true,
        name: "Special Occasions Design 02",
        description:
            "A thoughtful custom design made for the moments, people and celebrations worth remembering.",
        price: 24.99,
        rating: 5,
    },

    {
        id: "special-occasions-03",
        imageUrl:
            "/images/collections/special-occasions/special-occasions-03.jpg",
        alt: "Special Occasions design 03",
        sortOrder: 3,
        isActive: true,
        name: "Special Occasions Design 03",
        description:
            "A refined personalized piece created to turn a special occasion into a lasting keepsake.",
        price: 24.99,
        rating: 5,
    },

    {
        id: "special-occasions-04",
        imageUrl:
            "/images/collections/special-occasions/special-occasions-04.jpg",
        alt: "Special Occasions design 04",
        sortOrder: 4,
        isActive: true,
        name: "Special Occasions Design 04",
        description:
            "A distinctive celebration design created to add a personal touch to unforgettable occasions.",
        price: 24.99,
        rating: 5,
    },

    {
        id: "special-occasions-05",
        imageUrl:
            "/images/collections/special-occasions/special-occasions-05.jpg",
        alt: "Special Occasions design 05",
        sortOrder: 5,
        isActive: true,
        name: "Special Occasions Design 05",
        description:
            "A premium custom design ideal for gifts, milestones, celebrations and special events.",
        price: 24.99,
        rating: 5,
    },

    {
        id: "special-occasions-06",
        imageUrl:
            "/images/collections/special-occasions/special-occasions-06.jpg",
        alt: "Special Occasions design 06",
        sortOrder: 6,
        isActive: true,
        name: "Special Occasions Design 06",
        description:
            "A modern personalized design created to give every celebration a unique and memorable touch.",
        price: 24.99,
        rating: 5,
    },

    {
        id: "special-occasions-07",
        imageUrl:
            "/images/collections/special-occasions/special-occasions-07.jpg",
        alt: "Special Occasions design 07",
        sortOrder: 7,
        isActive: true,
        name: "Special Occasions Design 07",
        description:
            "A versatile custom design created for meaningful celebrations and memorable gifts.",
        price: 24.99,
        rating: 5,
    },

    {
        id: "special-occasions-08",
        imageUrl:
            "/images/collections/special-occasions/special-occasions-08.jpg",
        alt: "Special Occasions design 08",
        sortOrder: 8,
        isActive: true,
        name: "Special Occasions Design 08",
        description:
            "An elegant personalized design created to celebrate life's moments with style and meaning.",
        price: 24.99,
        rating: 5,
    },

];


function SpecialOccasionsPage() {

    const { language } = useLanguage();

    const t = translations[language].specialOccasions;


    const [selectedImage, setSelectedImage] =
        useState<CollectionImage | null>(null);


    const [quantities, setQuantities] =
        useState<Record<string, number>>({});


    const activeImages = specialOccasionsImages
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
                model: "Special Occasions",
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

            <main className="special-occasions-page">

                {/* ==================================================
                    HERO
                   ================================================== */}

                <section className="special-occasions-hero">

                    <div className="special-occasions-hero__visual">

                        <img
                            src="/images/collections/special-occasions/special-occasions-hero.jpg"
                            alt={t.hero.title}
                        />

                    </div>

                    <div className="special-occasions-hero__overlay"></div>

                    <div className="special-occasions-hero__glow"></div>

                    <div className="special-occasions-hero__content">

                        <Link
                            to="/collections"
                            className="special-occasions-back-link"
                        >
                            ←{" "}
                            {language === "es"
                                ? "VOLVER A COLECCIONES"
                                : "BACK TO COLLECTIONS"}
                        </Link>

                        <span className="special-occasions-hero__eyebrow">
                            {t.hero.eyebrow}
                        </span>

                        <h1>

                            {t.hero.title}

                            <span>
                                {t.hero.titleAccent}
                            </span>

                        </h1>

                        <div className="special-occasions-hero__ornament">

                            <span></span>

                            <b>◆</b>

                            <span></span>

                        </div>

                        <p>
                            {t.hero.description}
                        </p>

                        <Link
                            to="/customize"
                            className="special-occasions-hero__button"
                        >
                            {t.hero.button}
                        </Link>

                    </div>

                    <div className="special-occasions-hero__bottom-glow"></div>

                </section>


                {/* ==================================================
                    PRODUCTS
                   ================================================== */}

                <section className="special-occasions-products">

                    <div className="special-occasions-section-heading">

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


                    <div className="special-occasions-products__grid">

                        {activeImages.map((image) => {

                            const quantity =
                                getQuantity(image.id);

                            return (

                                <article
                                    className="special-occasions-product"
                                    key={image.id}
                                >

                                    {/* IMAGE */}

                                    <div
                                        className="special-occasions-product__image"
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
                                            className="special-occasions-product__zoom"
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

                                        <span className="special-occasions-product__number">

                                            {String(
                                                image.sortOrder
                                            ).padStart(2, "0")}

                                        </span>

                                        <div className="special-occasions-product__shine"></div>

                                    </div>


                                    {/* PRODUCT BODY */}

                                    <div className="special-occasions-product__body">

                                        <div className="special-occasions-product__info">

                                            <strong className="special-occasions-product__price">

                                                ${image.price.toFixed(2)}

                                            </strong>

                                        </div>


                                        {/* QUANTITY */}

                                        <div className="special-occasions-product__quantity">

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
                                            className="special-occasions-product__button"
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

                <section className="special-occasions-featured">

                    <div className="special-occasions-featured__visual">

                        <img
                            src="/images/collections/special-occasions/special-occasions-featured.jpg"
                            alt={t.featured.title}
                        />

                    </div>

                    <div className="special-occasions-featured__overlay"></div>

                    <div className="special-occasions-featured__content">

                        <span>
                            {t.featured.eyebrow}
                        </span>

                        <div className="special-occasions-featured__ornament">

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
                            className="special-occasions-featured__button"
                        >
                            {t.featured.button}
                        </Link>

                    </div>

                </section>


                {/* ==================================================
                    FINAL CTA
                   ================================================== */}

                <section className="special-occasions-cta">

                    <div className="special-occasions-cta__glow"></div>

                    <div className="special-occasions-cta__content">

                        <span>
                            {t.cta.eyebrow}
                        </span>

                        <div className="special-occasions-cta__ornament">

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
                            className="special-occasions-cta__button"
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
                        className="special-occasions-lightbox"
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
                            className="special-occasions-lightbox__close"
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
                            className="special-occasions-lightbox__content"
                            onClick={(event) =>
                                event.stopPropagation()
                            }
                        >

                            <div className="special-occasions-lightbox__visual">

                                <img
                                    src={selectedImage.imageUrl}
                                    alt={selectedImage.alt}
                                    className="special-occasions-lightbox__image"
                                />

                            </div>


                            <div className="special-occasions-lightbox__details">

                                <span className="special-occasions-lightbox__eyebrow">
                                    {language === "es"
                                        ? "OCASIONES ESPECIALES"
                                        : "SPECIAL OCCASIONS"}
                                </span>

                                <h2>
                                    {selectedImage.name}
                                </h2>


                                {/* RATING */}

                                <div
                                    className="special-occasions-lightbox__rating"
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


                                <div className="special-occasions-lightbox__ornament">

                                    <span></span>

                                    <b>◆</b>

                                    <span></span>

                                </div>


                                <p>
                                    {selectedImage.description}
                                </p>


                                <div className="special-occasions-lightbox__price">

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
                                    className="special-occasions-lightbox__cart-button"
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

export default SpecialOccasionsPage;