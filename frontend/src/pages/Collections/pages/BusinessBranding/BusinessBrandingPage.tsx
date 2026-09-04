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
       PRODUCT OPTIONS
    =========================================================== */

    const [
        productOptions,
        setProductOptions,
    ] =
        useState<
            Record<string, ProductOptions>
        >(
            {}
        );


    /* ===========================================================
       PAGINATION
    =========================================================== */

    const [
        currentPage,
        setCurrentPage,
    ] =
        useState(
            1
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


                        setProducts(
                            result.products
                            || []
                        );


                        setCurrentPage(
                            1
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
       QUANTITY
    =========================================================== */

    const getQuantity =
        (
            productId: string
        ): number => {

            return (

                quantities[
                    productId
                ]

                ?? 1

            );

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
                        ]

                        ?? 1;


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
       PRODUCT OPTIONS
    =========================================================== */

    const getProductOptions =
        (
            productId: string
        ): ProductOptions => {

            return (

                productOptions[
                    productId
                ]

                ?? {

                    size:
                        "11 oz",

                    color:
                        "White",

                }

            );

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
                        ]

                        ?? {

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
                        ]

                        ?? {

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
    =========================================================== */

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
                        "Business & Branding",

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
       COLLECTION ORDER
    =========================================================== */

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

                    (

                        a.collection_sort_order
                        ?? a.sort_order
                        ?? 0

                    )

                    -

                    (

                        b.collection_sort_order
                        ?? b.sort_order
                        ?? 0

                    )
            );


    /* ===========================================================
       PAGINATION
    =========================================================== */

    const productsPerPage =
        8;


    const totalPages =

        Math.ceil(

            activeProducts.length /

            productsPerPage

        );


    const startIndex =

        (

            currentPage - 1

        )

        *

        productsPerPage;


    const visibleProducts =

        activeProducts.slice(

            startIndex,

            startIndex +
            productsPerPage

        );


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
                        activeProducts.length === 0 && (

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
                        activeProducts.length > 0 && (

                            <>


                                <div
                                    className="business-branding-products__grid"
                                >

                                    {

                                        visibleProducts.map(

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


                                                const productOrder =

                                                    startIndex +
                                                    index +
                                                    1;


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
                                                                        "Enter"

                                                                        ||

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


                                                            <span
                                                                className="business-branding-product__number"
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


                                                            <div
                                                                className="business-branding-product__shine"
                                                            ></div>

                                                        </div>


                                                        {/* PRODUCT BODY */}

                                                        <div
                                                            className="business-branding-product__body"
                                                        >

                                                            <div
                                                                className="business-branding-product__info"
                                                            >

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

                                                            </div>


                                                            {/* PRODUCT OPTIONS */}

                                                            <div
                                                                className="business-branding-product-options"
                                                            >


                                                                {/* COLOR */}

                                                                <div
                                                                    className="business-branding-product-options__group"
                                                                >

                                                                    <span
                                                                        className="business-branding-product-options__label"
                                                                    >

                                                                        {

                                                                            language === "es"

                                                                                ? "COLOR"

                                                                                : "COLOR"

                                                                        }

                                                                    </span>


                                                                    <div
                                                                        className="business-branding-product-options__colors"
                                                                    >

                                                                        <button
                                                                            type="button"
                                                                            className={
                                                                                `business-branding-color-button business-branding-color-button--white ${
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
                                                                                `business-branding-color-button business-branding-color-button--black ${
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

                                                                <div
                                                                    className="business-branding-product-options__group"
                                                                >

                                                                    <span
                                                                        className="business-branding-product-options__label"
                                                                    >

                                                                        {

                                                                            language === "es"

                                                                                ? "TAMAÑO"

                                                                                : "SIZE"

                                                                        }

                                                                    </span>


                                                                    <div
                                                                        className="business-branding-product-options__sizes"
                                                                    >

                                                                        <button
                                                                            type="button"
                                                                            className={
                                                                                `business-branding-size-button ${
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
                                                                                `business-branding-size-button ${
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
                                                                aria-label={

                                                                    language === "es"

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


                                {/* ======================================
                                    PAGINATION
                                ====================================== */}

                                {

                                    totalPages > 1 && (

                                        <div
                                            className="business-branding-pagination"
                                        >

                                            <button
                                                type="button"
                                                onClick={() =>

                                                    setCurrentPage(

                                                        (
                                                            current
                                                        ) =>

                                                            Math.max(

                                                                1,

                                                                current - 1

                                                            )

                                                    )

                                                }
                                                disabled={
                                                    currentPage ===
                                                    1
                                                }
                                                aria-label={

                                                    language === "es"

                                                        ? "Página anterior"

                                                        : "Previous page"

                                                }
                                            >

                                                ←

                                            </button>


                                            {

                                                Array.from(

                                                    {

                                                        length:
                                                            totalPages,

                                                    },

                                                    (
                                                        _,
                                                        index
                                                    ) => {

                                                        const page =

                                                            index + 1;


                                                        return (

                                                            <button
                                                                type="button"
                                                                key={
                                                                    page
                                                                }
                                                                className={

                                                                    page ===
                                                                    currentPage

                                                                        ? "is-active"

                                                                        : ""

                                                                }
                                                                onClick={() =>

                                                                    setCurrentPage(
                                                                        page
                                                                    )

                                                                }
                                                                aria-label={

                                                                    language === "es"

                                                                        ? `Ir a la página ${page}`

                                                                        : `Go to page ${page}`

                                                                }
                                                                aria-current={

                                                                    page ===
                                                                    currentPage

                                                                        ? "page"

                                                                        : undefined

                                                                }
                                                            >

                                                                {
                                                                    page
                                                                }

                                                            </button>

                                                        );

                                                    }

                                                )

                                            }


                                            <button
                                                type="button"
                                                onClick={() =>

                                                    setCurrentPage(

                                                        (
                                                            current
                                                        ) =>

                                                            Math.min(

                                                                totalPages,

                                                                current + 1

                                                            )

                                                    )

                                                }
                                                disabled={

                                                    currentPage ===
                                                    totalPages

                                                }
                                                aria-label={

                                                    language === "es"

                                                        ? "Página siguiente"

                                                        : "Next page"

                                                }
                                            >

                                                →

                                            </button>

                                        </div>

                                    )

                                }


                            </>

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
                            onClick={() =>

                                setSelectedProduct(
                                    null
                                )

                            }
                        >

                            <button
                                type="button"
                                className="business-branding-lightbox__close"
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


                                <div
                                    className="business-branding-lightbox__details"
                                >

                                    <span
                                        className="business-branding-lightbox__eyebrow"
                                    >

                                        {

                                            language === "es"

                                                ? "NEGOCIOS Y MARCA"

                                                : "BUSINESS & BRANDING"

                                        }

                                    </span>


                                    <h2>

                                        {
                                            selectedProduct.name
                                        }

                                    </h2>


                                    {/* RATING */}

                                    <div
                                        className="business-branding-lightbox__rating"
                                        aria-label={

                                            language === "es"

                                                ? "5 de 5 estrellas"

                                                : "5 out of 5 stars"

                                        }
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


                                    {/* DESCRIPTION */}

                                    <p>

                                        {
                                            selectedProduct.description
                                        }

                                    </p>


                                    {/* PRODUCT OPTIONS */}

                                    <div
                                        className="business-branding-product-options"
                                    >


                                        {/* COLOR */}

                                        <div
                                            className="business-branding-product-options__group"
                                        >

                                            <span
                                                className="business-branding-product-options__label"
                                            >

                                                COLOR

                                            </span>


                                            <div
                                                className="business-branding-product-options__colors"
                                            >

                                                <button
                                                    type="button"
                                                    className={

                                                        `business-branding-color-button business-branding-color-button--white ${
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

                                                        `business-branding-color-button business-branding-color-button--black ${
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

                                        <div
                                            className="business-branding-product-options__group"
                                        >

                                            <span
                                                className="business-branding-product-options__label"
                                            >

                                                {

                                                    language === "es"

                                                        ? "TAMAÑO"

                                                        : "SIZE"

                                                }

                                            </span>


                                            <div
                                                className="business-branding-product-options__sizes"
                                            >

                                                <button
                                                    type="button"
                                                    className={

                                                        `business-branding-size-button ${
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

                                                        `business-branding-size-button ${
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