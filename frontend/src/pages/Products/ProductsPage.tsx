/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: ProductsPage.tsx
 * Module: Products
 * Language: TypeScript React
 * Description:
 * Products / All Models page.
 * Connected to the public products API.
 * Languages: English (en) | Español (es)
 * ================================================================
 */

import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    Search,
    X,
} from "lucide-react";

import {
    useSearchParams,
} from "react-router-dom";

import "./ProductsPage.css";

import Header from "../../components/layout/Header";
import Footer from "../../components/home/Footer";

import {
    addToCart,
} from "../../utils/cart";

import {
    useLanguage,
} from "../../contexts/LanguageContext";

import {
    translations,
} from "../../translations";


/* ===============================================================
   TYPES
================================================================ */

type Product = {

    product_id:
        string;

    name:
        string;

    slug:
        string;

    description:
        string | null;

    price:
        number;

    image_url:
        string | null;

    is_active:
        boolean;

    sort_order:
        number;

    features:
        Record<string, unknown>
        | unknown[];

    created_at?:
        string;

    updated_at?:
        string;

};


type ProductsResponse = {

    status:
        string;

    products:
        Product[];

};


/* ===============================================================
   API URL
================================================================ */

const API_URL =
    import.meta.env
        .VITE_API_URL
    || "http://localhost:5000/api";


/* ===============================================================
   PRODUCTS PAGE
================================================================ */

function ProductsPage() {

    const {
        language,
    } = useLanguage();


    const t =
        translations[language].products;


    const [
        searchParams,
    ] = useSearchParams();


    /* ===========================================================
       PRODUCTS
    =========================================================== */

    const [
        products,
        setProducts,
    ] = useState<
        Product[]
    >(
        []
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
    ] = useState<
        string | null
    >(
        null
    );


    /* ===========================================================
       FILTERS
    =========================================================== */

    const [
        searchTerm,
        setSearchTerm,
    ] = useState(
        ""
    );


    const [
        sort,
        setSort,
    ] = useState(
        "Newest"
    );


    const [
        currentPage,
        setCurrentPage,
    ] = useState(
        1
    );


    const [
        viewMode,
        setViewMode,
    ] = useState<
        "grid" | "list"
    >(
        "grid"
    );


    const [
        selectedProduct,
        setSelectedProduct,
    ] = useState<
        Product | null
    >(
        null
    );


    /*
    |--------------------------------------------------------------------------
    | Search Params
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        const search =
            searchParams.get(
                "search"
            ) || "";


        setSearchTerm(
            search
        );


        setCurrentPage(
            1
        );

    }, [
        searchParams,
    ]);


    /*
    |--------------------------------------------------------------------------
    | Load Products
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        const loadProducts =
            async () => {

                try {

                    setIsLoading(
                        true
                    );


                    setError(
                        null
                    );


                    const response =
                        await fetch(
                            `${API_URL}/products/public`
                        );


                    if (
                        !response.ok
                    ) {

                        throw new Error(
                            "Unable to load products."
                        );

                    }


                    const data:
                        ProductsResponse =
                        await response.json();


                    setProducts(
                        data.products
                        || []
                    );

                } catch (
                    error
                ) {

                    console.error(
                        "Unable to load products:",
                        error
                    );


                    setError(
                        language === "es"

                            ? "No se pudieron cargar los productos."

                            : "Unable to load products."
                    );

                } finally {

                    setIsLoading(
                        false
                    );

                }

            };


        loadProducts();

    }, [
        language,
    ]);


    /*
    |--------------------------------------------------------------------------
    | Products Per Page
    |--------------------------------------------------------------------------
    */

    const productsPerPage =
        window.innerWidth <= 700
            ? 4
            : 8;


    /*
    |--------------------------------------------------------------------------
    | Filtered Products
    |--------------------------------------------------------------------------
    */

    const filteredProducts =
        useMemo(() => {

            const normalizedSearch =
                searchTerm
                    .trim()
                    .toLowerCase();


            const filtered =
                products.filter(
                    (product) => {

                        if (
                            normalizedSearch === ""
                        ) {

                            return true;

                        }


                        return (

                            product.name
                                .toLowerCase()
                                .includes(
                                    normalizedSearch
                                )

                            ||

                            product.slug
                                .toLowerCase()
                                .includes(
                                    normalizedSearch
                                )

                            ||

                            product.description
                                ?.toLowerCase()
                                .includes(
                                    normalizedSearch
                                )

                        );

                    }
                );


            if (
                sort === "Price Low"
            ) {

                return [
                    ...filtered,
                ].sort(
                    (a, b) =>
                        Number(
                            a.price
                        )
                        -
                        Number(
                            b.price
                        )
                );

            }


            if (
                sort === "Price High"
            ) {

                return [
                    ...filtered,
                ].sort(
                    (a, b) =>
                        Number(
                            b.price
                        )
                        -
                        Number(
                            a.price
                        )
                );

            }


            if (
                sort === "Newest"
            ) {

                return [
                    ...filtered,
                ].sort(
                    (a, b) => {

                        const dateA =
                            new Date(
                                a.created_at
                                || 0
                            ).getTime();


                        const dateB =
                            new Date(
                                b.created_at
                                || 0
                            ).getTime();


                        return (
                            dateB -
                            dateA
                        );

                    }
                );

            }


            return filtered;

        }, [

            products,

            sort,

            searchTerm,

        ]);


    /*
    |--------------------------------------------------------------------------
    | Pagination
    |--------------------------------------------------------------------------
    */

    const totalPages =
        Math.max(

            1,

            Math.ceil(
                filteredProducts.length /
                productsPerPage
            )

        );


    const visibleProducts =
        filteredProducts.slice(

            (
                currentPage - 1
            ) *
            productsPerPage,

            currentPage *
            productsPerPage

        );


    /*
    |--------------------------------------------------------------------------
    | Image Fallback
    |--------------------------------------------------------------------------
    */

    const getProductImage =
        (
            product:
                Product
        ) => {

            return (
                product.image_url
                ||
                "/images/products/placeholder.jpg"
            );

        };


    return (

        <>

            <Header />


            <main
                className="products-page"
            >

                {/* HERO */}

                <section
                    className="products-hero"
                >

                    <div
                        className="products-hero__crown"
                    >

                        ✦

                    </div>


                    <p
                        className="products-hero__eyebrow"
                    >

                        MAGIC TOUCH DESIGNS

                    </p>


                    <h1>

                        {t.hero.title}

                    </h1>


                    <p
                        className="products-hero__description"
                    >

                        {t.hero.description}

                    </p>

                </section>


                {/* CATALOG */}

                <section
                    className="products-catalog"
                >

                    {/* SEARCH */}

                    <div
                        className="products-search"
                    >

                        <Search
                            size={19}
                        />


                        <input
                            type="search"
                            value={searchTerm}
                            onChange={(
                                event
                            ) => {

                                setSearchTerm(
                                    event.target.value
                                );


                                setCurrentPage(
                                    1
                                );

                            }}
                            placeholder={
                                language === "es"
                                    ? "Buscar productos..."
                                    : "Search products..."
                            }
                            aria-label={
                                language === "es"
                                    ? "Buscar productos"
                                    : "Search products"
                            }
                        />

                    </div>


                    {/* FILTERS */}

                    <div
                        className="products-filters"
                    >

                        <div
                            className="products-sort"
                        >

                            <span>

                                {
                                    t.filters
                                        .sortBy
                                }

                            </span>


                            <select
                                value={sort}
                                onChange={(
                                    event
                                ) => {

                                    setSort(
                                        event.target.value
                                    );


                                    setCurrentPage(
                                        1
                                    );

                                }}
                            >

                                <option value="Newest">

                                    {t.sort.newest}

                                </option>

                                <option value="Price Low">

                                    {t.sort.priceLow}

                                </option>

                                <option value="Price High">

                                    {t.sort.priceHigh}

                                </option>

                            </select>

                        </div>

                    </div>


                    {/* VIEW MODE */}

                    <div
                        className="products-view-toggle"
                    >

                        <button
                            type="button"
                            className={
                                viewMode === "grid"
                                    ? "active"
                                    : ""
                            }
                            onClick={() =>
                                setViewMode(
                                    "grid"
                                )
                            }
                            aria-label="Grid view"
                            aria-pressed={
                                viewMode === "grid"
                            }
                        >

                            ▦

                        </button>


                        <button
                            type="button"
                            className={
                                viewMode === "list"
                                    ? "active"
                                    : ""
                            }
                            onClick={() =>
                                setViewMode(
                                    "list"
                                )
                            }
                            aria-label="List view"
                            aria-pressed={
                                viewMode === "list"
                            }
                        >

                            ☷

                        </button>

                    </div>


                    {/* LOADING */}

                    {isLoading && (

                        <div
                            className="products-state"
                        >

                            {
                                language === "es"

                                    ? "Cargando productos..."

                                    : "Loading products..."
                            }

                        </div>

                    )}


                    {/* ERROR */}

                    {!isLoading && error && (

                        <div
                            className="products-state products-state--error"
                        >

                            {error}

                        </div>

                    )}


                    {/* PRODUCTS */}

                    {!isLoading && !error && (

                        <div
                            className={
                                `products-grid products-grid--${viewMode}`
                            }
                        >

                            {visibleProducts.map(
                                (product) => (

                                    <article
                                        className="product-card"
                                        key={
                                            product.product_id
                                        }
                                    >

                                        <div
                                            className="product-card__image"
                                        >

                                            <img
                                                src={
                                                    getProductImage(
                                                        product
                                                    )
                                                }
                                                alt={
                                                    product.name
                                                }
                                            />


                                            <div
                                                className="product-card__actions"
                                            >

                                                <button
                                                    type="button"
                                                    className="product-card__action"
                                                    aria-label={
                                                        `View ${product.name} image`
                                                    }
                                                    onClick={() =>
                                                        setSelectedProduct(
                                                            product
                                                        )
                                                    }
                                                >

                                                    <Search
                                                        size={17}
                                                        strokeWidth={2}
                                                    />

                                                </button>

                                            </div>

                                        </div>


                                        <div
                                            className="product-card__content"
                                        >

                                            <h2>

                                                {
                                                    product.name
                                                }

                                            </h2>


                                            {product.description && (

                                                <p>

                                                    {
                                                        product.description
                                                    }

                                                </p>

                                            )}


                                            <strong>

                                                $

                                                {
                                                    Number(
                                                        product.price
                                                    ).toFixed(
                                                        2
                                                    )
                                                }

                                            </strong>


                                            <button
                                                className="product-card__button"
                                                type="button"
                                                onClick={() => {

                                                    addToCart({

                                                        id:
                                                            product.product_id,

                                                        name:
                                                            product.name,

                                                        model:
                                                            "",

                                                        size:
                                                            "",

                                                        color:
                                                            "",

                                                        price:
                                                            Number(
                                                                product.price
                                                            ),

                                                        image:
                                                            getProductImage(
                                                                product
                                                            ),

                                                    });

                                                }}
                                            >

                                                {
                                                    t.actions
                                                        .addToCart
                                                }

                                                <span>

                                                    →

                                                </span>

                                            </button>

                                        </div>

                                    </article>

                                )
                            )}


                            {visibleProducts.length === 0 && (

                                <div
                                    className="products-state"
                                >

                                    {
                                        language === "es"

                                            ? "No se encontraron productos."

                                            : "No products found."
                                    }

                                </div>

                            )}

                        </div>

                    )}


                    {/* LIGHTBOX */}

                    {selectedProduct && (

                        <div
                            className="product-lightbox"
                            role="dialog"
                            aria-modal="true"
                            aria-label={
                                selectedProduct.name
                            }
                            onClick={() =>
                                setSelectedProduct(
                                    null
                                )
                            }
                        >

                            <div
                                className="product-lightbox__content"
                                onClick={(
                                    event
                                ) =>
                                    event.stopPropagation()
                                }
                            >

                                <button
                                    type="button"
                                    className="product-lightbox__close"
                                    aria-label="Close image"
                                    onClick={() =>
                                        setSelectedProduct(
                                            null
                                        )
                                    }
                                >

                                    <X
                                        size={24}
                                    />

                                </button>


                                <img
                                    src={
                                        getProductImage(
                                            selectedProduct
                                        )
                                    }
                                    alt={
                                        selectedProduct.name
                                    }
                                    className="product-lightbox__image"
                                />


                                <div
                                    className="product-lightbox__info"
                                >

                                    <h2>

                                        {
                                            selectedProduct.name
                                        }

                                    </h2>


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

                            </div>

                        </div>

                    )}


                    {/* PAGINATION */}

                    {!isLoading &&
                    !error &&
                    filteredProducts.length > 0 && (

                        <div
                            className="products-pagination"
                        >

                            <button
                                type="button"
                                disabled={
                                    currentPage ===
                                    1
                                }
                                onClick={() =>
                                    setCurrentPage(
                                        (page) =>
                                            Math.max(
                                                1,
                                                page - 1
                                            )
                                    )
                                }
                            >

                                &lt;

                            </button>


                            {Array.from(

                                {
                                    length:
                                        totalPages,
                                },

                                (
                                    _,
                                    index
                                ) =>
                                    index + 1

                            ).map(
                                (page) => (

                                    <button
                                        type="button"
                                        key={page}
                                        className={
                                            currentPage ===
                                            page
                                                ? "products-pagination__active"
                                                : ""
                                        }
                                        onClick={() =>
                                            setCurrentPage(
                                                page
                                            )
                                        }
                                    >

                                        {page}

                                    </button>

                                )
                            )}


                            <button
                                type="button"
                                disabled={
                                    currentPage ===
                                    totalPages
                                }
                                onClick={() =>
                                    setCurrentPage(
                                        (page) =>
                                            Math.min(
                                                totalPages,
                                                page + 1
                                            )
                                    )
                                }
                            >

                                ›

                            </button>

                        </div>

                    )}


                    {/* BENEFITS */}

                    <div
                        className="products-benefits"
                    >

                        <div>

                            <strong>

                                {
                                    t.benefits
                                        .fastShipping
                                        .title
                                }

                            </strong>


                            <span>

                                {
                                    t.benefits
                                        .fastShipping
                                        .description
                                }

                            </span>

                        </div>


                        <div>

                            <strong>

                                {
                                    t.benefits
                                        .securePayment
                                        .title
                                }

                            </strong>


                            <span>

                                {
                                    t.benefits
                                        .securePayment
                                        .description
                                }

                            </span>

                        </div>


                        <div>

                            <strong>

                                {
                                    t.benefits
                                        .premiumQuality
                                        .title
                                }

                            </strong>


                            <span>

                                {
                                    t.benefits
                                        .premiumQuality
                                        .description
                                }

                            </span>

                        </div>


                        <div>

                            <strong>

                                {
                                    t.benefits
                                        .customerSupport
                                        .title
                                }

                            </strong>


                            <span>

                                {
                                    t.benefits
                                        .customerSupport
                                        .description
                                }

                            </span>

                        </div>

                    </div>

                </section>

            </main>


            <Footer />

        </>

    );

}


export default ProductsPage;