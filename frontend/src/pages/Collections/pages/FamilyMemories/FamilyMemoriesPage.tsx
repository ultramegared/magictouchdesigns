/**
 * ===============================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: FamilyMemoriesPage.tsx
 * Module: Collections / Family & Memories
 * Language: TypeScript React
 * Description:
 * Premium Family & Memories collection page.
 * ===============================================================
 */

import "./FamilyMemoriesPage.css";

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


const familyMemoriesImages: CollectionImage[] = [

    {
        id: "family-memories-01",
        imageUrl:
            "/images/collections/family-memories/family-memories-01.jpg",
        alt: "Family & Memories design 01",
        sortOrder: 1,
        isActive: true,
        name: "Family & Memories Design 01",
        description:
            "A beautiful personalized design created to celebrate family, meaningful moments and unforgettable memories.",
        price: 24.99,
        rating: 5,
    },

    {
        id: "family-memories-02",
        imageUrl:
            "/images/collections/family-memories/family-memories-02.jpg",
        alt: "Family & Memories design 02",
        sortOrder: 2,
        isActive: true,
        name: "Family & Memories Design 02",
        description:
            "A warm personalized design created to preserve the special memories shared with the people you love.",
        price: 24.99,
        rating: 5,
    },

    {
        id: "family-memories-03",
        imageUrl:
            "/images/collections/family-memories/family-memories-03.jpg",
        alt: "Family & Memories design 03",
        sortOrder: 3,
        isActive: true,
        name: "Family & Memories Design 03",
        description:
            "A premium personalized design made to celebrate family connections and unforgettable occasions.",
        price: 24.99,
        rating: 5,
    },

    {
        id: "family-memories-04",
        imageUrl:
            "/images/collections/family-memories/family-memories-04.jpg",
        alt: "Family & Memories design 04",
        sortOrder: 4,
        isActive: true,
        name: "Family & Memories Design 04",
        description:
            "An elegant personalized design created to turn your favorite family memories into something special.",
        price: 24.99,
        rating: 5,
    },

    {
        id: "family-memories-05",
        imageUrl:
            "/images/collections/family-memories/family-memories-05.jpg",
        alt: "Family & Memories design 05",
        sortOrder: 5,
        isActive: true,
        name: "Family & Memories Design 05",
        description:
            "A sophisticated family design perfect for gifts, celebrations and meaningful moments.",
        price: 24.99,
        rating: 5,
    },

    {
        id: "family-memories-06",
        imageUrl:
            "/images/collections/family-memories/family-memories-06.jpg",
        alt: "Family & Memories design 06",
        sortOrder: 6,
        isActive: true,
        name: "Family & Memories Design 06",
        description:
            "A personalized premium design created to honor the moments that matter most to your family.",
        price: 24.99,
        rating: 5,
    },

    {
        id: "family-memories-07",
        imageUrl:
            "/images/collections/family-memories/family-memories-07.jpg",
        alt: "Family & Memories design 07",
        sortOrder: 7,
        isActive: true,
        name: "Family & Memories Design 07",
        description:
            "A timeless personalized design created to celebrate your family's unique story.",
        price: 24.99,
        rating: 5,
    },

    {
        id: "family-memories-08",
        imageUrl:
            "/images/collections/family-memories/family-memories-08.jpg",
        alt: "Family & Memories design 08",
        sortOrder: 8,
        isActive: true,
        name: "Family & Memories Design 08",
        description:
            "A premium personalized family design made to transform special memories into beautiful keepsakes.",
        price: 24.99,
        rating: 5,
    },

];


function FamilyMemoriesPage() {

    const { language } = useLanguage();

    const t = translations[language].familyMemories;


    const [selectedImage, setSelectedImage] =
        useState<CollectionImage | null>(null);


    const [quantities, setQuantities] =
        useState<Record<string, number>>({});


    const activeImages = familyMemoriesImages
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
                model: "Family & Memories",
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

            <main className="family-memories-page">

                {/* ==================================================
                    HERO
                   ================================================== */}

                <section className="family-memories-hero">

                    <div className="family-memories-hero__visual">

                        <img
                            src="/images/collections/family-memories/family-memories-hero.jpg"
                            alt={t.hero.title}
                        />

                    </div>

                    <div className="family-memories-hero__overlay"></div>

                    <div className="family-memories-hero__glow"></div>

                    <div className="family-memories-hero__content">

                        <Link
                            to="/collections"
                            className="family-memories-back-link"
                        >
                            ←{" "}
                            {language === "es"
                                ? "VOLVER A COLECCIONES"
                                : "BACK TO COLLECTIONS"}
                        </Link>

                        <span className="family-memories-hero__eyebrow">
                            {t.hero.eyebrow}
                        </span>

                        <h1>

                            {t.hero.title}

                            <span>
                                {t.hero.titleAccent}
                            </span>

                        </h1>

                        <div className="family-memories-hero__ornament">

                            <span></span>

                            <b>♥</b>

                            <span></span>

                        </div>

                        <p>
                            {t.hero.description}
                        </p>

                        <Link
    to="/customize"
    className="family-memories-hero__button"
>
    {t.hero.button}
</Link>

                    </div>

                    <div className="family-memories-hero__bottom-glow"></div>

                </section>


                {/* ==================================================
                    INTRO
                   ================================================== */}



                {/* ==================================================
                    COLLECTION PRODUCTS
                   ================================================== */}

                <section className="family-memories-products">

                    <div className="family-memories-section-heading">

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


                    <div className="family-memories-products__grid">

                        {activeImages.map((image) => {

                            const quantity =
                                getQuantity(image.id);

                            return (

                                <article
                                    className="family-memories-product"
                                    key={image.id}
                                >

                                    {/* IMAGE */}

                                    <div
                                        className="family-memories-product__image"
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
                                            className="family-memories-product__zoom"
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

                                        <span className="family-memories-product__number">

                                            {String(
                                                image.sortOrder
                                            ).padStart(2, "0")}

                                        </span>

                                        <div className="family-memories-product__shine"></div>

                                    </div>


                                    {/* PRODUCT BODY */}

                                    <div className="family-memories-product__body">

                                        <div className="family-memories-product__info">

                                            <strong className="family-memories-product__price">

                                                ${image.price.toFixed(2)}

                                            </strong>

                                        </div>


                                        {/* QUANTITY */}

                                        <div className="family-memories-product__quantity">

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
                                            className="family-memories-product__button"
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

                <section className="family-memories-featured">

                    <div className="family-memories-featured__visual">

                        <img
                            src="/images/collections/family-memories/family-memories-featured.jpg"
                            alt={t.featured.title}
                        />

                    </div>

                    <div className="family-memories-featured__overlay"></div>

                    <div className="family-memories-featured__content">

                        <span>
                            {t.featured.eyebrow}
                        </span>

                        <div className="family-memories-featured__ornament">

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

                        <Link
    to="/customize"
    className="family-memories-featured__button"
>
    {t.featured.button}
</Link>
                    </div>

                </section>


                {/* ==================================================
                    FINAL CTA
                   ================================================== */}

                <section className="family-memories-cta">

                    <div className="family-memories-cta__glow"></div>

                    <div className="family-memories-cta__content">

                        <span>
                            {t.cta.eyebrow}
                        </span>

                        <div className="family-memories-cta__ornament">

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

                        <Link
    to="/customize"
    className="family-memories-cta__button"
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
                        className="family-memories-lightbox"
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
                            className="family-memories-lightbox__close"
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
                            className="family-memories-lightbox__content"
                            onClick={(event) =>
                                event.stopPropagation()
                            }
                        >

                            <div className="family-memories-lightbox__visual">

                                <img
                                    src={selectedImage.imageUrl}
                                    alt={selectedImage.alt}
                                    className="family-memories-lightbox__image"
                                />

                            </div>


                            <div className="family-memories-lightbox__details">

                                <span className="family-memories-lightbox__eyebrow">
                                    FAMILY & MEMORIES
                                </span>

                                <h2>
                                    {selectedImage.name}
                                </h2>


                                {/* RATING */}

                                <div
                                    className="family-memories-lightbox__rating"
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


                                <div className="family-memories-lightbox__ornament">

                                    <span></span>

                                    <b>♥</b>

                                    <span></span>

                                </div>


                                <p>
                                    {selectedImage.description}
                                </p>


                                <div className="family-memories-lightbox__price">

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
                                    className="family-memories-lightbox__cart-button"
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

export default FamilyMemoriesPage;