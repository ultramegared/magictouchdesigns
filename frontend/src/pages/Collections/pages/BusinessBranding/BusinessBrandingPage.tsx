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

import {
    useEffect,
    useState,
} from "react";

import { Link } from "react-router-dom";

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
   COMPONENT
================================================================ */

function FamilyMemoriesPage() {


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
        ].familyMemories;


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

                                "/api/collections/family-memories/products"

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
                            "Unable to load Family & Memories products:",
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
       ADD TO CART
    =========================================================== */

    const handleAddToCart =
        (
            product: CollectionProduct,
            quantity: number = 1
        ) => {

            addToCart(

                {

                    id:
                        product.product_id,

                    name:
                        product.name,

                    model:
                        "Family & Memories",

                    size:
                        "Standard",

                    color:
                        "Default",

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
       RENDER
    =========================================================== */

    return (

        <>

            <Header />


            <main
                className="family-memories-page"
            >


                {/* ==================================================
                    HERO
                   ================================================== */}

                <section
                    className="family-memories-hero"
                >

                    <div
                        className="family-memories-hero__visual"
                    >

                        <img
                            src="/images/collections/family-memories/family-memories-hero.jpg"
                            alt={
                                t.hero.title
                            }
                        />

                    </div>


                    <div
                        className="family-memories-hero__overlay"
                    ></div>


                    <div
                        className="family-memories-hero__glow"
                    ></div>


                    <div
                        className="family-memories-hero__content"
                    >

                        <Link
                            to="/collections"
                            className="family-memories-back-link"
                        >

                            ←{" "}

                            {
                                language === "es"

                                    ? "VOLVER A COLECCIONES"

                                    : "BACK TO COLLECTIONS"

                            }

                        </Link>


                        <span
                            className="family-memories-hero__eyebrow"
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
                            className="family-memories-hero__ornament"
                        >

                            <span></span>

                            <b>
                                ♥
                            </b>

                            <span></span>

                        </div>


                        <p>

                            {
                                t.hero.description
                            }

                        </p>


                        <Link
                            to="/collections"
                            className="family-memories-hero__button"
                        >

                            {
                                t.hero.button
                            }

                        </Link>

                    </div>


                    <div
                        className="family-memories-hero__bottom-glow"
                    ></div>

                </section>


                {/* ==================================================
                    COLLECTION PRODUCTS
                   ================================================== */}

                <section
                    className="family-memories-products"
                >

                    <div
                        className="family-memories-section-heading"
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
                                className="family-memories-products__status"
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
                                className="family-memories-products__status"
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
                                className="family-memories-products__status"
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
                                className="family-memories-products__grid"
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


                                            const productOrder =
                                                product.collection_sort_order
                                                || index + 1;


                                            return (

                                                <article
                                                    className="family-memories-product"
                                                    key={
                                                        product.product_id
                                                    }
                                                >


                                                    {/* IMAGE */}

                                                    <div
                                                        className="family-memories-product__image"
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


                                                        <span
                                                            className="family-memories-product__number"
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
                                                            className="family-memories-product__shine"
                                                        ></div>

                                                    </div>


                                                    {/* PRODUCT BODY */}

                                                    <div
                                                        className="family-memories-product__body"
                                                    >

                                                        <div
                                                            className="family-memories-product__info"
                                                        >

                                                            <strong
                                                                className="family-memories-product__price"
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


                                                        {/* QUANTITY */}

                                                        <div
                                                            className="family-memories-product__quantity"
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
                                                            className="family-memories-product__button"
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

                        )
                    }

                </section>


                {/* ==================================================
                    FEATURED
                   ================================================== */}

                <section
                    className="family-memories-featured"
                >

                    <div
                        className="family-memories-featured__visual"
                    >

                        <img
                            src="/images/collections/family-memories/family-memories-featured.jpg"
                            alt={
                                t.featured.title
                            }
                        />

                    </div>


                    <div
                        className="family-memories-featured__overlay"
                    ></div>


                    <div
                        className="family-memories-featured__content"
                    >

                        <span>

                            {
                                t.featured.eyebrow
                            }

                        </span>


                        <div
                            className="family-memories-featured__ornament"
                        >

                            <span></span>

                            <b>
                                ♥
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
                            className="family-memories-featured__button"
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
                    className="family-memories-cta"
                >

                    <div
                        className="family-memories-cta__glow"
                    ></div>


                    <div
                        className="family-memories-cta__content"
                    >

                        <span>

                            {
                                t.cta.eyebrow
                            }

                        </span>


                        <div
                            className="family-memories-cta__ornament"
                        >

                            <span></span>

                            <b>
                                ♥
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
                            className="family-memories-cta__button"
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
                            className="family-memories-lightbox"
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
                                className="family-memories-lightbox__close"
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
                                className="family-memories-lightbox__content"
                                onClick={
                                    (
                                        event
                                    ) =>

                                        event.stopPropagation()

                                }
                            >

                                <div
                                    className="family-memories-lightbox__visual"
                                >

                                    <img
                                        src={
                                            selectedProduct.image_url
                                        }
                                        alt={
                                            selectedProduct.name
                                        }
                                        className="family-memories-lightbox__image"
                                    />

                                </div>


                                <div
                                    className="family-memories-lightbox__details"
                                >

                                    <span
                                        className="family-memories-lightbox__eyebrow"
                                    >

                                        FAMILY & MEMORIES

                                    </span>


                                    <h2>

                                        {
                                            selectedProduct.name
                                        }

                                    </h2>


                                    {/* RATING */}

                                    <div
                                        className="family-memories-lightbox__rating"
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
                                        className="family-memories-lightbox__ornament"
                                    >

                                        <span></span>

                                        <b>
                                            ♥
                                        </b>

                                        <span></span>

                                    </div>


                                    <p>

                                        {
                                            selectedProduct.description
                                        }

                                    </p>


                                    <div
                                        className="family-memories-lightbox__price"
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


                                    <button
                                        type="button"
                                        className="family-memories-lightbox__cart-button"
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


export default FamilyMemoriesPage;