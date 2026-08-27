/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: ProductsPage.tsx
 * Module: Products
 * Language: TypeScript React
 * Description:
 * Products / All Models page.
 * Frontend structure prepared for dynamic products and categories.
 * Favorites are synchronized with the backend and persisted locally
 * to provide a stable user experience.
 * ================================================================
 */

import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    Heart,
    Search,
    X,
} from "lucide-react";

import {
    useNavigate,
    useSearchParams,
} from "react-router-dom";

import "./ProductsPage.css";

import Header from "../../components/layout/Header";
import Footer from "../../components/home/Footer";

import {
    addToCart,
} from "../../utils/cart";

import {
    apiRequest,
} from "../../services/api";

import {
    useLanguage,
} from "../../contexts/LanguageContext";

import {
    translations,
} from "../../translations";


/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

type Product = {

    id: number;

    name: string;

    category: string;

    style: string;

    color: string;

    size: string;

    price: number;

    rating: number;

    reviews: number;

    image: string;

    badge?:
        | "NEW"
        | "BEST SELLER";

};


type Favorite = {

    id: string;

    user_id: string;

    design_id: string;

    created_at: string;

};


type FavoritesResponse = {

    status: string;

    favorites: Favorite[];

};


type CreateFavoriteResponse = {

    status: string;

    favorite: Favorite;

};


/*
|--------------------------------------------------------------------------
| Local Storage
|--------------------------------------------------------------------------
*/

const FAVORITES_STORAGE_KEY =
    "magic_touch_favorites";


const getStoredFavorites = ():
    Record<string, string> => {

    try {

        const stored =
            localStorage.getItem(
                FAVORITES_STORAGE_KEY
            );


        if (!stored) {

            return {};

        }


        const parsed =
            JSON.parse(
                stored
            );


        if (
            typeof parsed !==
            "object"
        ) {

            return {};

        }


        return parsed;

    } catch {

        return {};

    }

};


const saveStoredFavorites = (
    favorites: Record<string, string>
) => {

    try {

        localStorage.setItem(

            FAVORITES_STORAGE_KEY,

            JSON.stringify(
                favorites
            )

        );

    } catch (error) {

        console.error(
            "Unable to save favorites locally:",
            error
        );

    }

};


/*
|--------------------------------------------------------------------------
| Demo Products
|--------------------------------------------------------------------------
*/

const demoProducts: Product[] = [

    {
        id: 1,
        name: "Model One",
        category: "Mug",
        style: "Classic",
        color: "Black",
        size: "11 oz",
        price: 24.99,
        rating: 5,
        reviews: 128,
        image: "/images/products/model-one.jpg",
        badge: "BEST SELLER",
    },

    {
        id: 2,
        name: "Model Two",
        category: "Mug",
        style: "Marble",
        color: "White",
        size: "11 oz",
        price: 24.99,
        rating: 5,
        reviews: 96,
        image: "/images/products/model-two.jpg",
        badge: "NEW",
    },

    {
        id: 3,
        name: "Model Three",
        category: "Tumbler",
        style: "Classic",
        color: "Black",
        size: "20 oz",
        price: 24.99,
        rating: 5,
        reviews: 74,
        image: "/images/products/model-three.jpg",
    },

    {
        id: 4,
        name: "Model Four",
        category: "Tumbler",
        style: "Classic",
        color: "Pink",
        size: "20 oz",
        price: 29.99,
        rating: 5,
        reviews: 58,
        image: "/images/products/model-four.jpg",
    },

    {
        id: 5,
        name: "Model Five",
        category: "Mug",
        style: "Premium",
        color: "Gold",
        size: "15 oz",
        price: 27.99,
        rating: 5,
        reviews: 82,
        image: "/images/products/model-five.jpg",
    },

    {
        id: 6,
        name: "Model Six",
        category: "Mug",
        style: "Classic",
        color: "Black",
        size: "15 oz",
        price: 25.99,
        rating: 5,
        reviews: 64,
        image: "/images/products/model-six.jpg",
    },

    {
        id: 7,
        name: "Model Seven",
        category: "Tumbler",
        style: "Premium",
        color: "White",
        size: "20 oz",
        price: 31.99,
        rating: 5,
        reviews: 47,
        image: "/images/products/model-seven.jpg",
    },

    {
        id: 8,
        name: "Model Eight",
        category: "Mug",
        style: "Marble",
        color: "Pink",
        size: "11 oz",
        price: 26.99,
        rating: 5,
        reviews: 39,
        image: "/images/products/model-eight.jpg",
    },

];


function ProductsPage() {

    const {
        language,
    } = useLanguage();


    const t =
        translations[language].products;


    const navigate =
        useNavigate();


    const [
        searchParams,
    ] = useSearchParams();


    const [
        category,
        setCategory,
    ] = useState(
        "All"
    );


    const [
        style,
        setStyle,
    ] = useState(
        "All"
    );


    const [
        color,
        setColor,
    ] = useState(
        "All"
    );


    const [
        size,
        setSize,
    ] = useState(
        "All"
    );


    const [
        sort,
        setSort,
    ] = useState(
        "Newest"
    );


    const [
        searchTerm,
        setSearchTerm,
    ] = useState(
        ""
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
    | Favorites
    |--------------------------------------------------------------------------
    */

    const [
        favorites,
        setFavorites,
    ] = useState<
        Record<string, string>
    >(
        () =>
            getStoredFavorites()
    );


    const [
        savingFavoriteId,
        setSavingFavoriteId,
    ] = useState<
        string | null
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
    | Persist Favorites
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        saveStoredFavorites(
            favorites
        );

    }, [
        favorites,
    ]);


    /*
    |--------------------------------------------------------------------------
    | Load Favorites From API
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        const loadFavorites =
            async () => {

                const token =
                    localStorage.getItem(
                        "auth_token"
                    );


                if (!token) {

                    setFavorites(
                        {}
                    );

                    return;

                }


                try {

                    const response =
                        await apiRequest<FavoritesResponse>(

                            "/api/favorites/my-favorites",

                            {
                                method:
                                    "GET",
                            }

                        );


                    const favoritesMap:
                        Record<
                            string,
                            string
                        > = {};


                    if (
                        Array.isArray(
                            response.favorites
                        )
                    ) {

                        response.favorites.forEach(
                            (
                                favorite
                            ) => {

                                if (
                                    favorite.design_id &&
                                    favorite.id
                                ) {

                                    favoritesMap[
                                        String(
                                            favorite.design_id
                                        )
                                    ] =
                                        favorite.id;

                                }

                            }
                        );

                    }


                    setFavorites(
                        favoritesMap
                    );

                } catch (error) {

                    console.error(
                        "Unable to load favorites:",
                        error
                    );


                    /*
                     * Keep locally stored favorites
                     * if the API is temporarily unavailable.
                     */

                }

            };


        loadFavorites();

    }, []);


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

            const filtered =
                demoProducts.filter(
                    (product) => {

                        const normalizedSearch =
                            searchTerm
                                .trim()
                                .toLowerCase();


                        const searchMatch =

                            normalizedSearch === ""

                            ||

                            product.name
                                .toLowerCase()
                                .includes(
                                    normalizedSearch
                                )

                            ||

                            product.category
                                .toLowerCase()
                                .includes(
                                    normalizedSearch
                                )

                            ||

                            product.style
                                .toLowerCase()
                                .includes(
                                    normalizedSearch
                                )

                            ||

                            product.color
                                .toLowerCase()
                                .includes(
                                    normalizedSearch
                                )

                            ||

                            product.size
                                .toLowerCase()
                                .includes(
                                    normalizedSearch
                                );


                        const categoryMatch =

                            category === "All"

                            ||

                            product.category ===
                            category;


                        const styleMatch =

                            style === "All"

                            ||

                            product.style ===
                            style;


                        const colorMatch =

                            color === "All"

                            ||

                            product.color ===
                            color;


                        const sizeMatch =

                            size === "All"

                            ||

                            product.size ===
                            size;


                        return (

                            searchMatch

                            &&

                            categoryMatch

                            &&

                            styleMatch

                            &&

                            colorMatch

                            &&

                            sizeMatch

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
                        a.price -
                        b.price
                );

            }


            if (
                sort === "Price High"
            ) {

                return [

                    ...filtered,

                ].sort(
                    (a, b) =>
                        b.price -
                        a.price
                );

            }


            if (
                sort === "Rating"
            ) {

                return [

                    ...filtered,

                ].sort(
                    (a, b) =>
                        b.rating -
                        a.rating
                );

            }


            return filtered;

        }, [

            category,

            style,

            color,

            size,

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
    | Toggle Favorite
    |--------------------------------------------------------------------------
    */

    const handleFavorite = async (
        product: Product
    ) => {

        const token =
            localStorage.getItem(
                "auth_token"
            );


        if (!token) {

            navigate(
                "/login"
            );

            return;

        }


        const productId =
            String(
                product.id
            );


        if (
            savingFavoriteId ===
            productId
        ) {

            return;

        }


        const existingFavoriteId =
            favorites[
                productId
            ];


        /*
        |--------------------------------------------------------------------------
        | Remove Favorite
        |--------------------------------------------------------------------------
        */

        if (
            existingFavoriteId
        ) {

            try {

                setSavingFavoriteId(
                    productId
                );


                /*
                 * Remove immediately from UI.
                 */

                setFavorites(
                    (
                        currentFavorites
                    ) => {

                        const updatedFavorites = {

                            ...currentFavorites,

                        };


                        delete updatedFavorites[
                            productId
                        ];


                        return updatedFavorites;

                    }
                );


                await apiRequest(

                    `/api/favorites/${existingFavoriteId}`,

                    {

                        method:
                            "DELETE",

                    }

                );

            } catch (error) {

                console.error(
                    "Unable to remove favorite:",
                    error
                );


                /*
                 * Restore favorite if removal fails.
                 */

                setFavorites(
                    (
                        currentFavorites
                    ) => ({

                        ...currentFavorites,

                        [
                            productId
                        ]:
                            existingFavoriteId,

                    })
                );

            } finally {

                setSavingFavoriteId(
                    null
                );

            }


            return;

        }


        /*
        |--------------------------------------------------------------------------
        | Create Favorite
        |--------------------------------------------------------------------------
        */

        const temporaryFavoriteId =
            `pending-${productId}`;


        try {

            setSavingFavoriteId(
                productId
            );


            /*
             * Add immediately to UI.
             * This prevents other selected hearts
             * from disappearing while the API responds.
             */

            setFavorites(
                (
                    currentFavorites
                ) => ({

                    ...currentFavorites,

                    [
                        productId
                    ]:
                        temporaryFavoriteId,

                })
            );


            const response =
                await apiRequest<CreateFavoriteResponse>(

                    "/api/favorites",

                    {

                        method:
                            "POST",

                        body:
                            JSON.stringify({

                                design_id:
                                    productId,

                            }),

                    }

                );


            /*
             * Replace temporary ID with
             * the real database favorite ID.
             */

            if (
                response.favorite &&
                response.favorite.id
            ) {

                setFavorites(
                    (
                        currentFavorites
                    ) => ({

                        ...currentFavorites,

                        [
                            productId
                        ]:
                            response.favorite.id,

                    })
                );

            }

        } catch (error) {

            console.error(
                "Unable to add favorite:",
                error
            );


            /*
             * Remove temporary favorite
             * if the server rejects the request.
             */

            setFavorites(
                (
                    currentFavorites
                ) => {

                    const updatedFavorites = {

                        ...currentFavorites,

                    };


                    delete updatedFavorites[
                        productId
                    ];


                    return updatedFavorites;

                }
            );

        } finally {

            setSavingFavoriteId(
                null
            );

        }

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


                    {/* CATEGORY CHIPS */}

                    <div
                        className="products-category-chips"
                    >

                        <button
                            type="button"
                            className={
                                category === "All"
                                    ? "active"
                                    : ""
                            }
                            onClick={() => {

                                setCategory(
                                    "All"
                                );

                                setCurrentPage(
                                    1
                                );

                            }}
                        >

                            {t.filters.all}

                        </button>


                        <button
                            type="button"
                            className={
                                category === "Mug"
                                    ? "active"
                                    : ""
                            }
                            onClick={() => {

                                setCategory(
                                    "Mug"
                                );

                                setCurrentPage(
                                    1
                                );

                            }}
                        >

                            {
                                t.options
                                    .categories
                                    .mug
                            }

                        </button>


                        <button
                            type="button"
                            className={
                                category === "Tumbler"
                                    ? "active"
                                    : ""
                            }
                            onClick={() => {

                                setCategory(
                                    "Tumbler"
                                );

                                setCurrentPage(
                                    1
                                );

                            }}
                        >

                            {
                                t.options
                                    .categories
                                    .tumbler
                            }

                        </button>

                    </div>


                    {/* FILTERS */}

                    <div
                        className="products-filters"
                    >

                        <button
                            type="button"
                            className={
                                category === "All"
                                    ? (
                                        "products-filter " +
                                        "products-filter--active"
                                    )
                                    : "products-filter"
                            }
                            onClick={() => {

                                setCategory(
                                    "All"
                                );

                                setCurrentPage(
                                    1
                                );

                            }}
                        >

                            {t.filters.all}

                        </button>


                        <select
                            value={category}
                            onChange={(
                                event
                            ) => {

                                setCategory(
                                    event.target.value
                                );

                                setCurrentPage(
                                    1
                                );

                            }}
                        >

                            <option value="All">

                                {t.filters.category}

                            </option>

                            <option value="Mug">

                                {
                                    t.options
                                        .categories
                                        .mug
                                }

                            </option>

                            <option value="Tumbler">

                                {
                                    t.options
                                        .categories
                                        .tumbler
                                }

                            </option>

                        </select>


                        <select
                            value={style}
                            onChange={(
                                event
                            ) => {

                                setStyle(
                                    event.target.value
                                );

                                setCurrentPage(
                                    1
                                );

                            }}
                        >

                            <option value="All">

                                {t.filters.style}

                            </option>

                            <option value="Classic">

                                {
                                    t.options
                                        .styles
                                        .classic
                                }

                            </option>

                            <option value="Marble">

                                {
                                    t.options
                                        .styles
                                        .marble
                                }

                            </option>

                            <option value="Premium">

                                {
                                    t.options
                                        .styles
                                        .premium
                                }

                            </option>

                        </select>


                        <select
                            value={color}
                            onChange={(
                                event
                            ) => {

                                setColor(
                                    event.target.value
                                );

                                setCurrentPage(
                                    1
                                );

                            }}
                        >

                            <option value="All">

                                {t.filters.color}

                            </option>

                            <option value="Black">

                                {
                                    t.options
                                        .colors
                                        .black
                                }

                            </option>

                            <option value="White">

                                {
                                    t.options
                                        .colors
                                        .white
                                }

                            </option>

                            <option value="Pink">

                                {
                                    t.options
                                        .colors
                                        .pink
                                }

                            </option>

                            <option value="Gold">

                                {
                                    t.options
                                        .colors
                                        .gold
                                }

                            </option>

                        </select>


                        <select
                            value={size}
                            onChange={(
                                event
                            ) => {

                                setSize(
                                    event.target.value
                                );

                                setCurrentPage(
                                    1
                                );

                            }}
                        >

                            <option value="All">

                                {t.filters.size}

                            </option>

                            <option value="11 oz">

                                11 oz

                            </option>

                            <option value="15 oz">

                                15 oz

                            </option>

                            <option value="20 oz">

                                20 oz

                            </option>

                        </select>


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

                                <option value="Rating">

                                    {t.sort.rating}

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


                    {/* PRODUCTS */}

                    <div
                        className={
                            `products-grid products-grid--${viewMode}`
                        }
                    >

                        {visibleProducts.map(
                            (
                                product
                            ) => {

                                const productId =
                                    String(
                                        product.id
                                    );


                                const isFavorite =
                                    Boolean(
                                        favorites[
                                            productId
                                        ]
                                    );


                                const isSaving =
                                    savingFavoriteId ===
                                    productId;


                                return (

                                    <article
                                        className="product-card"
                                        key={
                                            product.id
                                        }
                                    >

                                        <div
                                            className="product-card__image"
                                        >

                                            {product.badge && (

                                                <span
                                                    className={
                                                        `product-card__badge ${
                                                            product.badge ===
                                                            "NEW"
                                                                ? "product-card__badge--new"
                                                                : "product-card__badge--best"
                                                        }`
                                                    }
                                                >

                                                    {
                                                        product.badge
                                                    }

                                                </span>

                                            )}


                                            <img
                                                src={
                                                    product.image
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


                                                <button
                                                    type="button"
                                                    className={
                                                        isFavorite
                                                            ? (
                                                                "product-card__action " +
                                                                "product-card__favorite " +
                                                                "product-card__favorite--active"
                                                            )
                                                            : (
                                                                "product-card__action " +
                                                                "product-card__favorite"
                                                            )
                                                    }
                                                    aria-label={
                                                        `${t.actions.addFavorite} ${product.name}`
                                                    }
                                                    aria-pressed={
                                                        isFavorite
                                                    }
                                                    disabled={
                                                        isSaving
                                                    }
                                                    onClick={() =>
                                                        handleFavorite(
                                                            product
                                                        )
                                                    }
                                                >

                                                    <Heart
                                                        size={17}
                                                        strokeWidth={2}
                                                        fill={
                                                            isFavorite
                                                                ? "currentColor"
                                                                : "none"
                                                        }
                                                    />

                                                </button>

                                            </div>

                                        </div>


                                        <div
                                            className="product-card__content"
                                        >

                                            <span
                                                className="product-card__category"
                                            >

                                                {
                                                    product.category ===
                                                    "Mug"
                                                        ? (
                                                            t.options
                                                                .categories
                                                                .mug
                                                        )
                                                        : (
                                                            t.options
                                                                .categories
                                                                .tumbler
                                                        )
                                                }

                                            </span>


                                            <h2>

                                                {
                                                    product.name
                                                }

                                            </h2>


                                            <strong>

                                                $

                                                {
                                                    product.price.toFixed(
                                                        2
                                                    )
                                                }

                                            </strong>


                                            <div
                                                className="product-card__rating"
                                            >

                                                <span>

                                                    ★★★★★

                                                </span>


                                                <small>

                                                    (

                                                    {
                                                        product.reviews
                                                    }

                                                    )

                                                </small>

                                            </div>


                                            <button
                                                className="product-card__button"
                                                type="button"
                                                onClick={() => {

                                                    addToCart({

                                                        id:
                                                            product.id,

                                                        name:
                                                            product.name,

                                                        model:
                                                            product.style,

                                                        size:
                                                            product.size,

                                                        color:
                                                            product.color,

                                                        price:
                                                            product.price,

                                                        image:
                                                            product.image,

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

                                );

                            }
                        )}

                    </div>


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
                                        selectedProduct.image
                                    }
                                    alt={
                                        selectedProduct.name
                                    }
                                    className="product-lightbox__image"
                                />


                                <div
                                    className="product-lightbox__info"
                                >

                                    <span>

                                        {
                                            selectedProduct.category
                                        }

                                    </span>


                                    <h2>

                                        {
                                            selectedProduct.name
                                        }

                                    </h2>


                                    <strong>

                                        $

                                        {
                                            selectedProduct.price.toFixed(
                                                2
                                            )
                                        }

                                    </strong>

                                </div>

                            </div>

                        </div>

                    )}


                    {/* PAGINATION */}

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
                                    (
                                        page
                                    ) =>

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
                            (
                                page
                            ) => (

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
                                    (
                                        page
                                    ) =>

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