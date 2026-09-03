/**
 * ===============================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: SpecialOccasionsPage.tsx
 * Module: Collections / Special Occasions
 * Language: TypeScript React
 * Description:
 * Premium Special Occasions collection page.
 * Connected to backend collection API.
 * ===============================================================
 */

import "./SpecialOccasionsPage.css";

import {
    useEffect,
    useState,
} from "react";

import {
    Link,
} from "react-router-dom";

import Header from "../../../../components/layout/Header";
import Footer from "../../../../components/home/Footer";

import {
    useLanguage,
} from "../../../../contexts/LanguageContext";

import {
    translations,
} from "../../../../translations";

import {
    addToCart,
} from "../../../../utils/cart";


/* ===============================================================
   API CONFIGURATION
================================================================ */

const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    "https://api.magictouchdesigns.com";


/* ===============================================================
   PRODUCT INTERFACE
================================================================ */

interface CollectionProduct {

    product_id: string;

    name: string;

    slug: string;

    description: string;

    price: number | string;

    image_url: string;

    is_active: boolean;

    sort_order: number;

    features: string[];

    created_at: string;

    updated_at: string;

    collection_sort_order: number;

}


/* ===============================================================
   PRODUCT OPTIONS
================================================================ */

type ProductSize =
    "11 oz" |
    "15 oz";


type ProductColor =
    "White" |
    "Black";


interface ProductOptions {

    size: ProductSize;

    color: ProductColor;

}


/* ===============================================================
   COMPONENT
================================================================ */

function SpecialOccasionsPage() {

    const {
        language,
    } = useLanguage();


    const t =
        translations[language].specialOccasions;


    /* ===========================================================
       STATE
    ============================================================ */

    const [
        products,
        setProducts,
    ] = useState<CollectionProduct[]>(
        []
    );


    const [
        selectedProduct,
        setSelectedProduct,
    ] = useState<CollectionProduct | null>(
        null
    );


    const [
        quantities,
        setQuantities,
    ] = useState<Record<string, number>>(
        {}
    );


    const [
        productOptions,
        setProductOptions,
    ] = useState<
        Record<string, ProductOptions>
    >(
        {}
    );


    const [
        isLoading,
        setIsLoading,
    ] = useState(
        true
    );


    const [
        error,
        setError,
    ] = useState(
        false
    );


    /* ===========================================================
       LOAD COLLECTION PRODUCTS
    ============================================================ */

    useEffect(
        () => {

            const loadProducts =
                async () => {

                    try {

                        setIsLoading(
                            true
                        );


                        setError(
                            false
                        );


                        const response =
                            await fetch(
                                `${API_BASE_URL}/api/collections/special-occasions/products`
                            );


                        if (
                            !response.ok
                        ) {

                            throw new Error(
                                "Unable to load collection products."
                            );

                        }


                        const data =
                            await response.json();


                        setProducts(
                            data.products || []
                        );

                    } catch (
                        error
                    ) {

                        console.error(
                            "Unable to load Special Occasions products:",
                            error
                        );


                        setError(
                            true
                        );

                    } finally {

                        setIsLoading(
                            false
                        );

                    }

                };


            loadProducts();

        },
        []
    );


    /* ===========================================================
       QUANTITY
    ============================================================ */

    const getQuantity =
        (
            productId: string
        ): number => {

            return quantities[
                productId
            ] ?? 1;

        };


    const changeQuantity =
        (
            productId: string,
            change: number
        ) => {

            setQuantities(
                (
                    current
                ) => {

                    const currentQuantity =
                        current[
                            productId
                        ] ?? 1;


                    const nextQuantity =
                        Math.max(
                            1,
                            currentQuantity + change
                        );


                    return {

                        ...current,

                        [
                            productId
                        ]:
                            nextQuantity,

                    };

                }
            );

        };


    /* ===========================================================
       PRODUCT OPTIONS
    ============================================================ */

    const getProductOptions =
        (
            productId: string
        ): ProductOptions => {

            return productOptions[
                productId
            ] ?? {

                size:
                    "11 oz",

                color:
                    "White",

            };

        };


    const changeProductSize =
        (
            productId: string,
            size: ProductSize
        ) => {

            setProductOptions(
                (
                    current
                ) => {

                    const currentOptions =
                        current[
                            productId
                        ] ?? {

                            size:
                                "11 oz" as ProductSize,

                            color:
                                "White" as ProductColor,

                        };


                    return {

                        ...current,

                        [
                            productId
                        ]: {

                            ...currentOptions,

                            size,

                        },

                    };

                }
            );

        };


    const changeProductColor =
        (
            productId: string,
            color: ProductColor
        ) => {

            setProductOptions(
                (
                    current
                ) => {

                    const currentOptions =
                        current[
                            productId
                        ] ?? {

                            size:
                                "11 oz" as ProductSize,

                            color:
                                "White" as ProductColor,

                        };


                    return {

                        ...current,

                        [
                            productId
                        ]: {

                            ...currentOptions,

                            color,

                        },

                    };

                }
            );

        };


    /* ===========================================================
       ADD TO CART
    ============================================================ */

    const handleAddToCart =
        (
            product: CollectionProduct,
            quantity: number = 1
        ) => {

            const options =
                getProductOptions(
                    product.product_id
                );


            addToCart(
                {

                    id:
                        product.product_id,

                    name:
                        product.name,

                    model:
                        "Special Occasions",

                    size:
                        options.size,

                    color:
                        options.color,

                    price:
                        Number(
                            product.price
                        ),

                    image:
                        product.image_url,

                },
                quantity
            );

        };


    const handleCardAddToCart =
        (
            product: CollectionProduct
        ) => {

            const quantity =
                getQuantity(
                    product.product_id
                );


            handleAddToCart(
                product,
                quantity
            );

        };


    const handleLightboxAddToCart =
        (
            product: CollectionProduct
        ) => {

            handleAddToCart(
                product,
                1
            );

        };


    /* ===========================================================
       ACTIVE PRODUCTS
       NEWEST PRODUCT FIRST
    ============================================================ */

    const activeProducts =
        products
            .filter(
                (
                    product
                ) =>
                    product.is_active
            )
            .sort(
                (
                    a,
                    b
                ) =>
                    new Date(
                        b.created_at
                    ).getTime() -
                    new Date(
                        a.created_at
                    ).getTime()
            );


    /* ===========================================================
       RENDER
    ============================================================ */

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

                            {
                                language === "es"
                                    ? "VOLVER A COLECCIONES"
                                    : "BACK TO COLLECTIONS"
                            }

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
                            to="/collections"
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



                    {/* LOADING */}

                    {
                        isLoading && (

                            <p>

                                {
                                    language === "es"
                                        ? "Cargando productos..."
                                        : "Loading products..."
                                }

                            </p>

                        )
                    }



                    {/* ERROR */}

                    {
                        error && (

                            <p>

                                {
                                    language === "es"
                                        ? "No se pudieron cargar los productos."
                                        : "Unable to load products."
                                }

                            </p>

                        )
                    }



                    {/* PRODUCTS GRID */}

                    {
                        !isLoading &&
                        !error && (

                            <div className="special-occasions-products__grid">


                                {
                                    activeProducts.map(
                                        (
                                            product,
                                            index
                                        ) => {

                                            const quantity =
                                                getQuantity(
                                                    product.product_id
                                                );


                                            const options =
                                                getProductOptions(
                                                    product.product_id
                                                );


                                            return (

                                                <article
                                                    className="special-occasions-product"
                                                    key={
                                                        product.product_id
                                                    }
                                                >


                                                    {/* IMAGE */}

                                                    <div
                                                        className="special-occasions-product__image"
                                                        onClick={() =>
                                                            setSelectedProduct(
                                                                product
                                                            )
                                                        }
                                                        role="button"
                                                        tabIndex={0}
                                                        onKeyDown={
                                                            (
                                                                event
                                                            ) => {

                                                                if (

                                                                    event.key ===
                                                                    "Enter" ||

                                                                    event.key ===
                                                                    " "

                                                                ) {

                                                                    event.preventDefault();


                                                                    setSelectedProduct(
                                                                        product
                                                                    );

                                                                }

                                                            }
                                                        }
                                                        aria-label={
                                                            language === "es"
                                                                ? `Ver ${product.name} en grande`
                                                                : `View ${product.name} enlarged`
                                                        }
                                                    >


                                                        <img
                                                            src={
                                                                product.image_url
                                                            }
                                                            alt={
                                                                product.name
                                                            }
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

                                                            {
                                                                String(
                                                                    index + 1
                                                                ).padStart(
                                                                    2,
                                                                    "0"
                                                                )
                                                            }

                                                        </span>


                                                        <div className="special-occasions-product__shine"></div>


                                                    </div>



                                                    {/* PRODUCT BODY */}

                                                    <div className="special-occasions-product__body">


                                                        <div className="special-occasions-product__info">


                                                            <strong className="special-occasions-product__price">

                                                                $

                                                                {
                                                                    Number(
                                                                        product.price
                                                                    ).toFixed(
                                                                        2
                                                                    )
                                                                }

                                                            </strong>


                                                        </div>



                                                        {/* PRODUCT OPTIONS */}

                                                        <div className="special-occasions-product-options">


                                                            {/* COLOR */}

                                                            <div className="special-occasions-product-options__group">


                                                                <span className="special-occasions-product-options__label">

                                                                    {
                                                                        language === "es"
                                                                            ? "COLOR"
                                                                            : "COLOR"
                                                                    }

                                                                </span>


                                                                <div className="special-occasions-product-options__colors">


                                                                    <button
                                                                        type="button"
                                                                        className={
                                                                            `special-occasions-color-button special-occasions-color-button--white ${
                                                                                options.color ===
                                                                                "White"
                                                                                    ? "is-selected"
                                                                                    : ""
                                                                            }`
                                                                        }
                                                                        onClick={() =>
                                                                            changeProductColor(
                                                                                product.product_id,
                                                                                "White"
                                                                            )
                                                                        }
                                                                        aria-label={
                                                                            language === "es"
                                                                                ? "Color blanco"
                                                                                : "White color"
                                                                        }
                                                                        aria-pressed={
                                                                            options.color ===
                                                                            "White"
                                                                        }
                                                                    >

                                                                        <span></span>

                                                                    </button>


                                                                    <button
                                                                        type="button"
                                                                        className={
                                                                            `special-occasions-color-button special-occasions-color-button--black ${
                                                                                options.color ===
                                                                                "Black"
                                                                                    ? "is-selected"
                                                                                    : ""
                                                                            }`
                                                                        }
                                                                        onClick={() =>
                                                                            changeProductColor(
                                                                                product.product_id,
                                                                                "Black"
                                                                            )
                                                                        }
                                                                        aria-label={
                                                                            language === "es"
                                                                                ? "Color negro"
                                                                                : "Black color"
                                                                        }
                                                                        aria-pressed={
                                                                            options.color ===
                                                                            "Black"
                                                                        }
                                                                    >

                                                                        <span></span>

                                                                    </button>


                                                                </div>


                                                            </div>



                                                            {/* SIZE */}

                                                            <div className="special-occasions-product-options__group">


                                                                <span className="special-occasions-product-options__label">

                                                                    {
                                                                        language === "es"
                                                                            ? "TAMAÑO"
                                                                            : "SIZE"
                                                                    }

                                                                </span>


                                                                <div className="special-occasions-product-options__sizes">


                                                                    <button
                                                                        type="button"
                                                                        className={
                                                                            `special-occasions-size-button ${
                                                                                options.size ===
                                                                                "11 oz"
                                                                                    ? "is-selected"
                                                                                    : ""
                                                                            }`
                                                                        }
                                                                        onClick={() =>
                                                                            changeProductSize(
                                                                                product.product_id,
                                                                                "11 oz"
                                                                            )
                                                                        }
                                                                        aria-pressed={
                                                                            options.size ===
                                                                            "11 oz"
                                                                        }
                                                                    >

                                                                        11 oz

                                                                    </button>


                                                                    <button
                                                                        type="button"
                                                                        className={
                                                                            `special-occasions-size-button ${
                                                                                options.size ===
                                                                                "15 oz"
                                                                                    ? "is-selected"
                                                                                    : ""
                                                                            }`
                                                                        }
                                                                        onClick={() =>
                                                                            changeProductSize(
                                                                                product.product_id,
                                                                                "15 oz"
                                                                            )
                                                                        }
                                                                        aria-pressed={
                                                                            options.size ===
                                                                            "15 oz"
                                                                        }
                                                                    >

                                                                        15 oz

                                                                    </button>


                                                                </div>


                                                            </div>


                                                        </div>



                                                        {/* QUANTITY */}

                                                        <div className="special-occasions-product__quantity">


                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    changeQuantity(
                                                                        product.product_id,
                                                                        -1
                                                                    )
                                                                }
                                                                aria-label={
                                                                    language ===
                                                                    "es"
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
                                                                        product.product_id,
                                                                        1
                                                                    )
                                                                }
                                                                aria-label={
                                                                    language ===
                                                                    "es"
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
                                                                handleCardAddToCart(
                                                                    product
                                                                )
                                                            }
                                                            aria-label={
                                                                language ===
                                                                "es"
                                                                    ? `Agregar ${product.name} al carrito`
                                                                    : `Add ${product.name} to cart`
                                                            }
                                                        >

                                                            {
                                                                language === "es"
                                                                    ? "AGREGAR AL CARRITO"
                                                                    : "ADD TO CART"
                                                            }

                                                        </button>


                                                    </div>


                                                </article>

                                            );

                                        }
                                    )
                                }


                            </div>

                        )
                    }


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

                {
                    selectedProduct && (

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
                                setSelectedProduct(
                                    null
                                )
                            }
                        >


                            <button
                                type="button"
                                className="special-occasions-lightbox__close"
                                onClick={() =>
                                    setSelectedProduct(
                                        null
                                    )
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
                                onClick={
                                    (
                                        event
                                    ) =>
                                        event.stopPropagation()
                                }
                            >


                                <div className="special-occasions-lightbox__visual">


                                    <img
                                        src={
                                            selectedProduct.image_url
                                        }
                                        alt={
                                            selectedProduct.name
                                        }
                                        className="special-occasions-lightbox__image"
                                    />


                                </div>



                                <div className="special-occasions-lightbox__details">


                                    <span className="special-occasions-lightbox__eyebrow">

                                        {
                                            language === "es"
                                                ? "OCASIONES ESPECIALES"
                                                : "SPECIAL OCCASIONS"
                                        }

                                    </span>


                                    <h2>

                                        {selectedProduct.name}

                                    </h2>



                                    {/* RATING */}

                                    <div
                                        className="special-occasions-lightbox__rating"
                                        aria-label={
                                            language === "es"
                                                ? "5 de 5 estrellas"
                                                : "5 out of 5 stars"
                                        }
                                    >

                                        {
                                            Array.from(
                                                {
                                                    length: 5,
                                                },
                                                (
                                                    _,
                                                    index
                                                ) => (

                                                    <span
                                                        key={index}
                                                        className="is-active"
                                                    >

                                                        ★

                                                    </span>

                                                )
                                            )
                                        }

                                    </div>



                                    <div className="special-occasions-lightbox__ornament">

                                        <span></span>

                                        <b>◆</b>

                                        <span></span>

                                    </div>



                                    {/* DESCRIPTION */}

                                    <p>

                                        {
                                            selectedProduct.description
                                        }

                                    </p>



                                    {/* PRODUCT OPTIONS */}

                                    <div className="special-occasions-product-options">


                                        {/* COLOR */}

                                        <div className="special-occasions-product-options__group">


                                            <span className="special-occasions-product-options__label">

                                                {
                                                    language === "es"
                                                        ? "COLOR"
                                                        : "COLOR"
                                                }

                                            </span>


                                            <div className="special-occasions-product-options__colors">


                                                <button
                                                    type="button"
                                                    className={
                                                        `special-occasions-color-button special-occasions-color-button--white ${
                                                            getProductOptions(
                                                                selectedProduct.product_id
                                                            ).color ===
                                                            "White"
                                                                ? "is-selected"
                                                                : ""
                                                        }`
                                                    }
                                                    onClick={() =>
                                                        changeProductColor(
                                                            selectedProduct.product_id,
                                                            "White"
                                                        )
                                                    }
                                                    aria-label={
                                                        language === "es"
                                                            ? "Color blanco"
                                                            : "White color"
                                                    }
                                                    aria-pressed={
                                                        getProductOptions(
                                                            selectedProduct.product_id
                                                        ).color ===
                                                        "White"
                                                    }
                                                >

                                                    <span></span>

                                                </button>


                                                <button
                                                    type="button"
                                                    className={
                                                        `special-occasions-color-button special-occasions-color-button--black ${
                                                            getProductOptions(
                                                                selectedProduct.product_id
                                                            ).color ===
                                                            "Black"
                                                                ? "is-selected"
                                                                : ""
                                                        }`
                                                    }
                                                    onClick={() =>
                                                        changeProductColor(
                                                            selectedProduct.product_id,
                                                            "Black"
                                                        )
                                                    }
                                                    aria-label={
                                                        language === "es"
                                                            ? "Color negro"
                                                            : "Black color"
                                                    }
                                                    aria-pressed={
                                                        getProductOptions(
                                                            selectedProduct.product_id
                                                        ).color ===
                                                        "Black"
                                                    }
                                                >

                                                    <span></span>

                                                </button>


                                            </div>


                                        </div>



                                        {/* SIZE */}

                                        <div className="special-occasions-product-options__group">


                                            <span className="special-occasions-product-options__label">

                                                {
                                                    language === "es"
                                                        ? "TAMAÑO"
                                                        : "SIZE"
                                                }

                                            </span>


                                            <div className="special-occasions-product-options__sizes">


                                                <button
                                                    type="button"
                                                    className={
                                                        `special-occasions-size-button ${
                                                            getProductOptions(
                                                                selectedProduct.product_id
                                                            ).size ===
                                                            "11 oz"
                                                                ? "is-selected"
                                                                : ""
                                                        }`
                                                    }
                                                    onClick={() =>
                                                        changeProductSize(
                                                            selectedProduct.product_id,
                                                            "11 oz"
                                                        )
                                                    }
                                                    aria-pressed={
                                                        getProductOptions(
                                                            selectedProduct.product_id
                                                        ).size ===
                                                        "11 oz"
                                                    }
                                                >

                                                    11 oz

                                                </button>


                                                <button
                                                    type="button"
                                                    className={
                                                        `special-occasions-size-button ${
                                                            getProductOptions(
                                                                selectedProduct.product_id
                                                            ).size ===
                                                            "15 oz"
                                                                ? "is-selected"
                                                                : ""
                                                        }`
                                                    }
                                                    onClick={() =>
                                                        changeProductSize(
                                                            selectedProduct.product_id,
                                                            "15 oz"
                                                        )
                                                    }
                                                    aria-pressed={
                                                        getProductOptions(
                                                            selectedProduct.product_id
                                                        ).size ===
                                                        "15 oz"
                                                    }
                                                >

                                                    15 oz

                                                </button>


                                            </div>


                                        </div>


                                    </div>



                                    {/* PRICE */}

                                    <div className="special-occasions-lightbox__price">


                                        <span>

                                            {
                                                language === "es"
                                                    ? "PRECIO"
                                                    : "PRICE"
                                            }

                                        </span>


                                        <strong>

                                            $

                                            {
                                                Number(
                                                    selectedProduct.price
                                                ).toFixed(
                                                    2
                                                )
                                            }

                                        </strong>


                                    </div>



                                    {/* ADD TO CART */}

                                    <button
                                        type="button"
                                        className="special-occasions-lightbox__cart-button"
                                        onClick={() =>
                                            handleLightboxAddToCart(
                                                selectedProduct
                                            )
                                        }
                                    >

                                        {
                                            language === "es"
                                                ? "AGREGAR AL CARRITO"
                                                : "ADD TO CART"
                                        }

                                    </button>


                                </div>


                            </div>


                        </div>

                    )
                }


            </main>


            <Footer />


        </>

    );

}


export default SpecialOccasionsPage;