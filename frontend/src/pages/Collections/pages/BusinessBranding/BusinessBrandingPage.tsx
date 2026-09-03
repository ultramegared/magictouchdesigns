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

import {
    apiRequest,
} from "../../../../services/api";


/* ===============================================================
   TYPES
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


interface CollectionProductsResponse {

    status: string;

    products: CollectionProduct[];

}


type ProductColor =
    "White"
    |
    "Black";


type ProductSize =
    "11 oz"
    |
    "15 oz";


/* ===============================================================
   COMPONENT
================================================================ */

function BusinessBrandingPage() {


    /* ===========================================================
       LANGUAGE
    =========================================================== */

    const {
        language,
    } =
        useLanguage();


    const t =
        translations[
            language
        ].businessBranding;


    /* ===========================================================
       PRODUCTS
    =========================================================== */

    const [
        products,
        setProducts,
    ] =
        useState<CollectionProduct[]>(
            []
        );


    const [
        isLoading,
        setIsLoading,
    ] =
        useState(
            true
        );


    const [
        error,
        setError,
    ] =
        useState<string | null>(
            null
        );


    /* ===========================================================
       LIGHTBOX
    =========================================================== */

    const [
        selectedProduct,
        setSelectedProduct,
    ] =
        useState<CollectionProduct | null>(
            null
        );


    /* ===========================================================
       QUANTITIES
    =========================================================== */

    const [
        quantities,
        setQuantities,
    ] =
        useState<Record<string, number>>(
            {}
        );


    /* ===========================================================
       COLORS
    =========================================================== */

    const [
        selectedColors,
        setSelectedColors,
    ] =
        useState<Record<string, ProductColor>>(
            {}
        );


    /* ===========================================================
       SIZES
    =========================================================== */

    const [
        selectedSizes,
        setSelectedSizes,
    ] =
        useState<Record<string, ProductSize>>(
            {}
        );


    /* ===========================================================
       LOAD PRODUCTS
    =========================================================== */

    useEffect(
        () => {

            const loadProducts =
                async () => {

                    try {

                        setIsLoading(
                            true
                        );


                        setError(
                            null
                        );


                        const result =
                            await apiRequest<
                                CollectionProductsResponse
                            >(

                                "/api/collections/business-branding/products"

                            );


                        const sortedProducts =
                            (
                                result.products
                                || []
                            )
                                .sort(
                                    (
                                        a,
                                        b
                                    ) =>

                                        a.collection_sort_order -
                                        b.collection_sort_order
                                );


                        setProducts(
                            sortedProducts
                        );

                    } catch (
                        error
                    ) {

                        console.error(
                            "Unable to load Business & Branding products:",
                            error
                        );


                        setError(

                            error instanceof Error

                                ? error.message

                                : "Unable to load collection products."

                        );


                        setProducts(
                            []
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
       ESCAPE LIGHTBOX
    =========================================================== */

    useEffect(
        () => {

            const handleKeyDown =
                (
                    event:
                        KeyboardEvent
                ) => {

                    if (
                        event.key ===
                        "Escape"
                    ) {

                        setSelectedProduct(
                            null
                        );

                    }

                };


            if (
                selectedProduct
            ) {

                document.addEventListener(
                    "keydown",
                    handleKeyDown
                );


                document.body.style.overflow =
                    "hidden";

            }


            return () => {

                document.removeEventListener(
                    "keydown",
                    handleKeyDown
                );


                document.body.style.overflow =
                    "";

            };

        },
        [
            selectedProduct,
        ]
    );


    /* ===========================================================
       QUANTITY
    =========================================================== */

    const getQuantity =
        (
            productId:
                string
        ): number => {

            return (

                quantities[
                    productId
                ]

                ??

                1

            );

        };


    const changeQuantity =
        (
            productId:
                string,

            change:
                number
        ) => {

            setQuantities(

                (
                    current
                ) => {

                    const currentQuantity =

                        current[
                            productId
                        ]

                        ??

                        1;


                    const nextQuantity =

                        Math.max(

                            1,

                            currentQuantity +
                            change

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
       COLOR
    =========================================================== */

    const getColor =
        (
            productId:
                string
        ): ProductColor => {

            return (

                selectedColors[
                    productId
                ]

                ??

                "White"

            );

        };


    const changeColor =
        (
            productId:
                string,

            color:
                ProductColor
        ) => {

            setSelectedColors(

                (
                    current
                ) => ({

                    ...current,

                    [
                        productId
                    ]:

                        color,

                })

            );

        };


    /* ===========================================================
       SIZE
    =========================================================== */

    const getSize =
        (
            productId:
                string
        ): ProductSize => {

            return (

                selectedSizes[
                    productId
                ]

                ??

                "11 oz"

            );

        };


    const changeSize =
        (
            productId:
                string,

            size:
                ProductSize
        ) => {

            setSelectedSizes(

                (
                    current
                ) => ({

                    ...current,

                    [
                        productId
                    ]:

                        size,

                })

            );

        };


    /* ===========================================================
       ADD TO CART
    =========================================================== */

    const handleAddToCart =
        (
            product:
                CollectionProduct,

            quantity:
                number
        ) => {

            const color =

                getColor(
                    product.product_id
                );


            const size =

                getSize(
                    product.product_id
                );


            addToCart(

                {

                    id:

                        product.product_id,

                    name:

                        product.name,

                    model:

                        "Business & Branding",

                    size:

                        size,

                    color:

                        color,

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
            product:
                CollectionProduct
        ) => {

            handleAddToCart(

                product,

                getQuantity(
                    product.product_id
                )

            );

        };


    const handleLightboxAddToCart =
        (
            product:
                CollectionProduct
        ) => {

            handleAddToCart(

                product,

                getQuantity(
                    product.product_id
                )

            );

        };


    /* ===========================================================
       OPEN PRODUCT
    =========================================================== */

    const openProduct =
        (
            product:
                CollectionProduct
        ) => {

            setSelectedProduct(
                product
            );

        };


    /* ===========================================================
       CLOSE PRODUCT
    =========================================================== */

    const closeProduct =
        () => {

            setSelectedProduct(
                null
            );

        };


    /* ===========================================================
       RENDER
    =========================================================== */

    return (

        <>

            <Header />


            <main
                className="business-branding-page"
            >


                {/* ==================================================
                    HERO
                   ================================================== */}

                <section
                    className="business-branding-hero"
                >

                    <div
                        className="business-branding-hero__visual"
                    >

                        <img
                            src="/images/collections/business-branding/business-branding-hero.jpg"
                            alt={
                                t.hero.title
                            }
                        />

                    </div>


                    <div
                        className="business-branding-hero__overlay"
                    ></div>


                    <div
                        className="business-branding-hero__glow"
                    ></div>


                    <div
                        className="business-branding-hero__content"
                    >

                        <Link
                            to="/collections"
                            className="business-branding-back-link"
                        >

                            ←{" "}

                            {

                                language === "es"

                                    ? "VOLVER A COLECCIONES"

                                    : "BACK TO COLLECTIONS"

                            }

                        </Link>


                        <span
                            className="business-branding-hero__eyebrow"
                        >

                            {
                                t.hero.eyebrow
                            }

                        </span>


                        <h1>

                            {
                                t.hero.title
                            }


                            <span>

                                {
                                    t.hero.titleAccent
                                }

                            </span>

                        </h1>


                        <div
                            className="business-branding-hero__ornament"
                        >

                            <span></span>

                            <b>
                                ◆
                            </b>

                            <span></span>

                        </div>


                        <p>

                            {
                                t.hero.description
                            }

                        </p>


                        <Link
                            to="/customize"
                            className="business-branding-hero__button"
                        >

                            {
                                t.hero.button
                            }

                        </Link>

                    </div>


                    <div
                        className="business-branding-hero__bottom-glow"
                    ></div>

                </section>


                {/* ==================================================
                    PRODUCTS
                   ================================================== */}

                <section
                    className="business-branding-products"
                >

                    <div
                        className="business-branding-section-heading"
                    >

                        <span>

                            {
                                t.products.eyebrow
                            }

                        </span>


                        <h2>

                            {
                                t.products.title
                            }


                            <strong>

                                {
                                    t.products.titleAccent
                                }

                            </strong>

                        </h2>

                    </div>


                    {/* ==============================================
                        LOADING
                       ============================================== */}

                    {

                        isLoading && (

                            <div
                                className="business-branding-products__status"
                            >

                                {

                                    language === "es"

                                        ? "Cargando productos..."

                                        : "Loading products..."

                                }

                            </div>

                        )

                    }


                    {/* ==============================================
                        ERROR
                       ============================================== */}

                    {

                        !isLoading &&
                        error && (

                            <div
                                className="business-branding-products__status"
                            >

                                {

                                    language === "es"

                                        ? "No se pudieron cargar los productos."

                                        : "Unable to load products."

                                }

                            </div>

                        )

                    }


                    {/* ==============================================
                        EMPTY
                       ============================================== */}

                    {

                        !isLoading &&
                        !error &&
                        products.length === 0 && (

                            <div
                                className="business-branding-products__status"
                            >

                                {

                                    language === "es"

                                        ? "Actualmente no hay productos disponibles en esta colección."

                                        : "There are currently no products available in this collection."

                                }

                            </div>

                        )

                    }


                    {/* ==============================================
                        PRODUCTS
                       ============================================== */}

                    {

                        !isLoading &&
                        !error &&
                        products.length > 0 && (

                            <div
                                className="business-branding-products__grid"
                            >

                                {

                                    products.map(

                                        (
                                            product,
                                            index
                                        ) => {

                                            const quantity =

                                                getQuantity(
                                                    product.product_id
                                                );


                                            const selectedColor =

                                                getColor(
                                                    product.product_id
                                                );


                                            const selectedSize =

                                                getSize(
                                                    product.product_id
                                                );


                                            const productOrder =

                                                product.collection_sort_order

                                                ||

                                                index + 1;


                                            return (

                                                <article
                                                    className="business-branding-product"
                                                    key={
                                                        product.product_id
                                                    }
                                                >


                                                    {/* IMAGE */}

                                                    <div
                                                        className="business-branding-product__image"
                                                        onClick={() =>

                                                            openProduct(
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
                                                                    "Enter"

                                                                    ||

                                                                    event.key ===
                                                                    " "

                                                                ) {

                                                                    event.preventDefault();


                                                                    openProduct(
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
                                                            className="business-branding-product__number"
                                                            aria-hidden="true"
                                                        >

                                                            {

                                                                String(
                                                                    productOrder
                                                                ).padStart(
                                                                    2,
                                                                    "0"
                                                                )

                                                            }

                                                        </span>


                                                        <span
                                                            className="business-branding-product__zoom"
                                                            aria-hidden="true"
                                                        >

                                                            <svg
                                                                viewBox="0 0 24 24"
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


                                                        <div
                                                            className="business-branding-product__shine"
                                                        ></div>

                                                    </div>


                                                    {/* PRODUCT BODY */}

                                                    <div
                                                        className="business-branding-product__body"
                                                    >


                                                        {/* PRICE */}

                                                        <strong
                                                            className="business-branding-product__price"
                                                        >

                                                            $

                                                            {

                                                                Number(
                                                                    product.price
                                                                ).toFixed(
                                                                    2
                                                                )

                                                            }

                                                        </strong>


                                                        {/* COLOR */}

                                                        <div
                                                            className="business-branding-product__option-group"
                                                        >

                                                            <span
                                                                className="business-branding-product__label"
                                                            >

                                                                {

                                                                    language === "es"

                                                                        ? "COLOR"

                                                                        : "COLOR"

                                                                }

                                                            </span>


                                                            <div
                                                                className="business-branding-product__colors"
                                                            >

                                                                <button
                                                                    type="button"
                                                                    className={

                                                                        `business-branding-product__color business-branding-product__color--white ${
                                                                            selectedColor ===
                                                                            "White"

                                                                                ? "is-active"

                                                                                : ""
                                                                        }`

                                                                    }
                                                                    onClick={() =>

                                                                        changeColor(

                                                                            product.product_id,

                                                                            "White"

                                                                        )

                                                                    }
                                                                    aria-label={

                                                                        language === "es"

                                                                            ? "Seleccionar color blanco"

                                                                            : "Select white color"

                                                                    }
                                                                >

                                                                    <span></span>

                                                                </button>


                                                                <button
                                                                    type="button"
                                                                    className={

                                                                        `business-branding-product__color business-branding-product__color--black ${
                                                                            selectedColor ===
                                                                            "Black"

                                                                                ? "is-active"

                                                                                : ""
                                                                        }`

                                                                    }
                                                                    onClick={() =>

                                                                        changeColor(

                                                                            product.product_id,

                                                                            "Black"

                                                                        )

                                                                    }
                                                                    aria-label={

                                                                        language === "es"

                                                                            ? "Seleccionar color negro"

                                                                            : "Select black color"

                                                                    }
                                                                >

                                                                    <span></span>

                                                                </button>

                                                            </div>

                                                        </div>


                                                        {/* SIZE */}

                                                        <div
                                                            className="business-branding-product__option-group"
                                                        >

                                                            <span
                                                                className="business-branding-product__label"
                                                            >

                                                                SIZE

                                                            </span>


                                                            <div
                                                                className="business-branding-product__sizes"
                                                            >

                                                                <button
                                                                    type="button"
                                                                    className={

                                                                        `business-branding-product__size ${
                                                                            selectedSize ===
                                                                            "11 oz"

                                                                                ? "is-active"

                                                                                : ""
                                                                        }`

                                                                    }
                                                                    onClick={() =>

                                                                        changeSize(

                                                                            product.product_id,

                                                                            "11 oz"

                                                                        )

                                                                    }
                                                                >

                                                                    11 oz

                                                                </button>


                                                                <button
                                                                    type="button"
                                                                    className={

                                                                        `business-branding-product__size ${
                                                                            selectedSize ===
                                                                            "15 oz"

                                                                                ? "is-active"

                                                                                : ""
                                                                        }`

                                                                    }
                                                                    onClick={() =>

                                                                        changeSize(

                                                                            product.product_id,

                                                                            "15 oz"

                                                                        )

                                                                    }
                                                                >

                                                                    15 oz

                                                                </button>

                                                            </div>

                                                        </div>


                                                        {/* QUANTITY */}

                                                        <div
                                                            className="business-branding-product__quantity"
                                                        >

                                                            <button
                                                                type="button"
                                                                onClick={() =>

                                                                    changeQuantity(

                                                                        product.product_id,

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

                                                                {
                                                                    quantity
                                                                }

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

                                                                handleCardAddToCart(
                                                                    product
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

                <section
                    className="business-branding-featured"
                >

                    <div
                        className="business-branding-featured__visual"
                    >

                        <img
                            src="/images/collections/business-branding/business-branding-featured.jpg"
                            alt={
                                t.featured.title
                            }
                        />

                    </div>


                    <div
                        className="business-branding-featured__overlay"
                    ></div>


                    <div
                        className="business-branding-featured__content"
                    >

                        <span>

                            {
                                t.featured.eyebrow
                            }

                        </span>


                        <div
                            className="business-branding-featured__ornament"
                        >

                            <span></span>

                            <b>
                                ◆
                            </b>

                            <span></span>

                        </div>


                        <h2>

                            {
                                t.featured.title
                            }


                            <strong>

                                {
                                    t.featured.titleAccent
                                }

                            </strong>

                        </h2>


                        <p>

                            {
                                t.featured.description
                            }

                        </p>


                        <Link
                            to="/customize"
                            className="business-branding-featured__button"
                        >

                            {
                                t.featured.button
                            }

                        </Link>

                    </div>

                </section>


                {/* ==================================================
                    FINAL CTA
                   ================================================== */}

                <section
                    className="business-branding-cta"
                >

                    <div
                        className="business-branding-cta__glow"
                    ></div>


                    <div
                        className="business-branding-cta__content"
                    >

                        <span>

                            {
                                t.cta.eyebrow
                            }

                        </span>


                        <div
                            className="business-branding-cta__ornament"
                        >

                            <span></span>

                            <b>
                                ◆
                            </b>

                            <span></span>

                        </div>


                        <h2>

                            {
                                t.cta.title
                            }


                            <strong>

                                {
                                    t.cta.titleAccent
                                }

                            </strong>

                        </h2>


                        <p>

                            {
                                t.cta.description
                            }

                        </p>


                        <Link
                            to="/customize"
                            className="business-branding-cta__button"
                        >

                            {
                                t.cta.button
                            }

                        </Link>

                    </div>

                </section>


                {/* ==================================================
                    PRODUCT LIGHTBOX
                   ================================================== */}

                {

                    selectedProduct && (

                        <div
                            className="business-branding-lightbox"
                            role="dialog"
                            aria-modal="true"
                            aria-label={

                                language === "es"

                                    ? "Detalles del producto"

                                    : "Product details"

                            }
                            onClick={
                                closeProduct
                            }
                        >


                            <div
                                className="business-branding-lightbox__content"
                                onClick={

                                    (
                                        event
                                    ) =>

                                        event.stopPropagation()

                                }
                            >


                                <div
                                    className="business-branding-lightbox__visual"
                                >

                                    <img
                                        src={
                                            selectedProduct.image_url
                                        }
                                        alt={
                                            selectedProduct.name
                                        }
                                        className="business-branding-lightbox__image"
                                    />

                                </div>


                                <button
                                    type="button"
                                    className="business-branding-lightbox__close"
                                    onClick={
                                        closeProduct
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
                                    className="business-branding-lightbox__details"
                                >

                                    <span
                                        className="business-branding-lightbox__eyebrow"
                                    >

                                        BUSINESS & BRANDING

                                    </span>


                                    <h2>

                                        {
                                            selectedProduct.name
                                        }

                                    </h2>


                                    {/* RATING */}

                                    <div
                                        className="business-branding-lightbox__rating"
                                    >

                                        {

                                            Array.from(

                                                {
                                                    length:
                                                        5,
                                                },

                                                (
                                                    _,
                                                    index
                                                ) => (

                                                    <span
                                                        key={
                                                            index
                                                        }
                                                        className="is-active"
                                                    >

                                                        ★

                                                    </span>

                                                )

                                            )

                                        }

                                    </div>


                                    <div
                                        className="business-branding-lightbox__ornament"
                                    >

                                        <span></span>

                                        <b>
                                            ◆
                                        </b>

                                        <span></span>

                                    </div>


                                    <p>

                                        {
                                            selectedProduct.description
                                        }

                                    </p>


                                    {/* COLOR */}

                                    <div
                                        className="business-branding-lightbox__option-group"
                                    >

                                        <span
                                            className="business-branding-lightbox__label"
                                        >

                                            COLOR

                                        </span>


                                        <div
                                            className="business-branding-lightbox__colors"
                                        >

                                            <button
                                                type="button"
                                                className={

                                                    `business-branding-lightbox__color business-branding-lightbox__color--white ${
                                                        getColor(
                                                            selectedProduct.product_id
                                                        ) ===
                                                        "White"

                                                            ? "is-active"

                                                            : ""
                                                    }`

                                                }
                                                onClick={() =>

                                                    changeColor(

                                                        selectedProduct.product_id,

                                                        "White"

                                                    )

                                                }
                                            >

                                                <span></span>

                                            </button>


                                            <button
                                                type="button"
                                                className={

                                                    `business-branding-lightbox__color business-branding-lightbox__color--black ${
                                                        getColor(
                                                            selectedProduct.product_id
                                                        ) ===
                                                        "Black"

                                                            ? "is-active"

                                                            : ""
                                                    }`

                                                }
                                                onClick={() =>

                                                    changeColor(

                                                        selectedProduct.product_id,

                                                        "Black"

                                                    )

                                                }
                                            >

                                                <span></span>

                                            </button>

                                        </div>

                                    </div>


                                    {/* SIZE */}

                                    <div
                                        className="business-branding-lightbox__option-group"
                                    >

                                        <span
                                            className="business-branding-lightbox__label"
                                        >

                                            SIZE

                                        </span>


                                        <div
                                            className="business-branding-lightbox__sizes"
                                        >

                                            <button
                                                type="button"
                                                className={

                                                    `business-branding-lightbox__size ${
                                                        getSize(
                                                            selectedProduct.product_id
                                                        ) ===
                                                        "11 oz"

                                                            ? "is-active"

                                                            : ""
                                                    }`

                                                }
                                                onClick={() =>

                                                    changeSize(

                                                        selectedProduct.product_id,

                                                        "11 oz"

                                                    )

                                                }
                                            >

                                                11 oz

                                            </button>


                                            <button
                                                type="button"
                                                className={

                                                    `business-branding-lightbox__size ${
                                                        getSize(
                                                            selectedProduct.product_id
                                                        ) ===
                                                        "15 oz"

                                                            ? "is-active"

                                                            : ""
                                                    }`

                                                }
                                                onClick={() =>

                                                    changeSize(

                                                        selectedProduct.product_id,

                                                        "15 oz"

                                                    )

                                                }
                                            >

                                                15 oz

                                            </button>

                                        </div>

                                    </div>


                                    {/* QUANTITY */}

                                    <div
                                        className="business-branding-lightbox__quantity"
                                    >

                                        <button
                                            type="button"
                                            onClick={() =>

                                                changeQuantity(

                                                    selectedProduct.product_id,

                                                    -1

                                                )

                                            }
                                        >

                                            −

                                        </button>


                                        <span>

                                            {

                                                getQuantity(
                                                    selectedProduct.product_id
                                                )

                                            }

                                        </span>


                                        <button
                                            type="button"
                                            onClick={() =>

                                                changeQuantity(

                                                    selectedProduct.product_id,

                                                    1

                                                )

                                            }
                                        >

                                            +

                                        </button>

                                    </div>


                                    {/* PRICE */}

                                    <div
                                        className="business-branding-lightbox__price"
                                    >

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
                                        className="business-branding-lightbox__cart-button"
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


export default BusinessBrandingPage;