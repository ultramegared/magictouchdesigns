/**
 * ================================================================
 * Project: Magic Touch Designs
 * Author: ultramegared
 * File: AdminCollections.tsx
 * Module: Administrator Panel
 * Language: TypeScript React
 * Description:
 * Collections administration page.
 * ================================================================
 */

import {
    useEffect,
    useState,
} from "react";

import {
    FolderKanban,
    LoaderCircle,
    Package,
    RefreshCw,
    CheckCircle2,
    XCircle,
    ImageOff,
} from "lucide-react";

import AdminSidebar from "./AdminSidebar";

import {
    apiRequest,
} from "../../services/api";

import "./AdminCollections.css";


/* ===============================================================
   TYPES
================================================================ */

interface CurrentUser {

    username: string;

}


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


interface CollectionConfig {

    slug: string;

    name: string;

}


/* ===============================================================
   COLLECTIONS
================================================================ */

const collections: CollectionConfig[] = [

    {
        slug: "love-romance",
        name: "Love & Romance",
    },

    {
        slug: "family-memories",
        name: "Family & Memories",
    },

    {
        slug: "business-branding",
        name: "Business & Branding",
    },

    {
        slug: "special-occasions",
        name: "Special Occasions",
    },

];


/* ===============================================================
   COMPONENT
================================================================ */

function AdminCollections() {


    /* ============================================================
       CURRENT USER
    ============================================================ */

    const [
        currentUser,
        setCurrentUser,
    ] = useState<CurrentUser | null>(
        null
    );


    /* ============================================================
       COLLECTION STATE
    ============================================================ */

    const [
        selectedCollection,
        setSelectedCollection,
    ] = useState(
        "special-occasions"
    );


    const [
        products,
        setProducts,
    ] = useState<CollectionProduct[]>(
        []
    );


    /* ============================================================
       UI STATE
    ============================================================ */

    const [
        isLoading,
        setIsLoading,
    ] = useState(
        true
    );


    const [
        error,
        setError,
    ] = useState<string | null>(
        null
    );


    /* ============================================================
       LOAD CURRENT USER
    ============================================================ */

    useEffect(
        () => {

            const loadCurrentUser =
                async () => {

                    try {

                        const result =
                            await apiRequest<{
                                status: string;

                                user: CurrentUser;
                            }>(
                                "/api/user/me"
                            );


                        setCurrentUser(
                            result.user
                        );

                    } catch (
                        error
                    ) {

                        console.error(
                            "Unable to load administrator:",
                            error
                        );

                    }

                };


            loadCurrentUser();

        },
        []
    );


    /* ============================================================
       LOAD COLLECTION PRODUCTS
    ============================================================ */

    const loadCollectionProducts =
        async () => {

            try {

                setIsLoading(
                    true
                );


                setError(
                    null
                );


                const result =
                    await apiRequest<{
                        status: string;

                        products:
                            CollectionProduct[];
                    }>(
                        `/api/collections/admin/${selectedCollection}/products`
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
                    "Unable to load collection products:",
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


    /* ============================================================
       LOAD WHEN COLLECTION CHANGES
    ============================================================ */

    useEffect(
        () => {

            loadCollectionProducts();

        },
        [
            selectedCollection,
        ]
    );


    /* ============================================================
       SELECTED COLLECTION DATA
    ============================================================ */

    const selectedCollectionData =
        collections.find(
            (
                collection
            ) =>
                collection.slug ===
                selectedCollection
        );


    /* ============================================================
       PRODUCT COUNTS
    ============================================================ */

    const activeProductCount =
        products.filter(
            (
                product
            ) =>
                product.is_active
        ).length;


    const inactiveProductCount =
        products.filter(
            (
                product
            ) =>
                !product.is_active
        ).length;


    /* ============================================================
       RENDER
    ============================================================ */

    return (

        <div
            className="admin-layout"
        >

            <AdminSidebar
                username={
                    currentUser?.username
                    || "Administrator"
                }
            />


            <main
                className="admin-collections"
            >


                {/* ==================================================
                    HERO
                   ================================================== */}

                <section
                    className="admin-collections__hero"
                >

                    <div
                        className="admin-collections__hero-content"
                    >

                        <div>

                            <span
                                className="admin-collections__eyebrow"
                            >

                                ADMINISTRATION

                            </span>


                            <h1>

                                Collections

                            </h1>


                            <p>

                                Manage the products assigned
                                to each collection in your store.

                            </p>

                        </div>


                        <div
                            className="admin-collections__hero-icon"
                        >

                            <FolderKanban
                                size={42}
                            />

                        </div>

                    </div>

                </section>



                {/* ==================================================
                    CONTAINER
                   ================================================== */}

                <section
                    className="admin-collections__container"
                >


                    {/* ==============================================
                        COLLECTION SELECTOR
                       ============================================== */}

                    <section
                        className="admin-collections__section"
                    >

                        <div
                            className="admin-collections__section-header"
                        >

                            <div>

                                <span>

                                    COLLECTIONS

                                </span>


                                <h2>

                                    Select Collection

                                </h2>

                            </div>


                            <button
                                type="button"
                                className="admin-collections__refresh"
                                onClick={
                                    loadCollectionProducts
                                }
                                disabled={
                                    isLoading
                                }
                            >

                                <RefreshCw
                                    size={18}
                                />


                                Refresh

                            </button>

                        </div>



                        <div
                            className="admin-collections__selector"
                        >

                            {
                                collections.map(
                                    (
                                        collection
                                    ) => (

                                        <button
                                            key={
                                                collection.slug
                                            }
                                            type="button"
                                            className={
                                                selectedCollection ===
                                                collection.slug

                                                    ? "admin-collections__collection admin-collections__collection--active"

                                                    : "admin-collections__collection"
                                            }
                                            onClick={() =>

                                                setSelectedCollection(
                                                    collection.slug
                                                )

                                            }
                                        >

                                            <FolderKanban
                                                size={20}
                                            />


                                            <span>

                                                {
                                                    collection.name
                                                }

                                            </span>

                                        </button>

                                    )
                                )
                            }

                        </div>

                    </section>



                    {/* ==============================================
                        COLLECTION PRODUCTS
                       ============================================== */}

                    <section
                        className="admin-collections__section"
                    >

                        <div
                            className="admin-collections__section-header"
                        >

                            <div>

                                <span>

                                    PRODUCTS

                                </span>


                                <h2>

                                    {
                                        selectedCollectionData?.name
                                    }

                                </h2>

                            </div>


                            <div
                                className="admin-collections__statistics"
                            >

                                <div
                                    className="admin-collections__count"
                                >

                                    <Package
                                        size={18}
                                    />


                                    <span>

                                        {
                                            products.length
                                        }

                                        {" "}

                                        Products

                                    </span>

                                </div>


                                <div
                                    className="admin-collections__count admin-collections__count--active"
                                >

                                    <CheckCircle2
                                        size={17}
                                    />


                                    <span>

                                        {
                                            activeProductCount
                                        }

                                        {" "}

                                        Active

                                    </span>

                                </div>


                                <div
                                    className="admin-collections__count admin-collections__count--inactive"
                                >

                                    <XCircle
                                        size={17}
                                    />


                                    <span>

                                        {
                                            inactiveProductCount
                                        }

                                        {" "}

                                        Inactive

                                    </span>

                                </div>

                            </div>

                        </div>



                        {/* ==========================================
                            LOADING
                           ========================================== */}

                        {
                            isLoading && (

                                <div
                                    className="admin-collections__loading"
                                >

                                    <LoaderCircle
                                        size={30}
                                    />


                                    <span>

                                        Loading collection
                                        products...

                                    </span>

                                </div>

                            )
                        }



                        {/* ==========================================
                            ERROR
                           ========================================== */}

                        {
                            !isLoading &&
                            error && (

                                <div
                                    className="admin-collections__error"
                                >

                                    {error}

                                </div>

                            )
                        }



                        {/* ==========================================
                            EMPTY
                           ========================================== */}

                        {
                            !isLoading &&
                            !error &&
                            products.length === 0 && (

                                <div
                                    className="admin-collections__empty"
                                >

                                    <Package
                                        size={36}
                                    />


                                    <h3>

                                        No products found

                                    </h3>


                                    <p>

                                        This collection does
                                        not currently contain
                                        any products.

                                    </p>

                                </div>

                            )
                        }



                        {/* ==========================================
                            PRODUCTS GRID
                           ========================================== */}

                        {
                            !isLoading &&
                            !error &&
                            products.length > 0 && (

                                <div
                                    className="admin-collections__grid"
                                >

                                    {
                                        products.map(
                                            (
                                                product
                                            ) => (

                                                <article
                                                    className="admin-collections__product"
                                                    key={
                                                        product.product_id
                                                    }
                                                >


                                                    {/* IMAGE */}

                                                    <div
                                                        className="admin-collections__product-image"
                                                    >

                                                        {

                                                            product.image_url

                                                                ? (

                                                                    <img
                                                                        src={
                                                                            product.image_url
                                                                        }
                                                                        alt={
                                                                            product.name
                                                                        }
                                                                    />

                                                                )

                                                                : (

                                                                    <div
                                                                        className="admin-collections__image-placeholder"
                                                                    >

                                                                        <ImageOff
                                                                            size={32}
                                                                        />

                                                                    </div>

                                                                )

                                                        }


                                                        <span
                                                            className="admin-collections__product-order"
                                                        >

                                                            #

                                                            {
                                                                product.collection_sort_order
                                                            }

                                                        </span>


                                                        <span
                                                            className={
                                                                product.is_active

                                                                    ? "admin-collections__product-status admin-collections__product-status--active"

                                                                    : "admin-collections__product-status admin-collections__product-status--inactive"
                                                            }
                                                        >

                                                            {

                                                                product.is_active

                                                                    ? "Active"

                                                                    : "Inactive"

                                                            }

                                                        </span>

                                                    </div>



                                                    {/* BODY */}

                                                    <div
                                                        className="admin-collections__product-body"
                                                    >


                                                        <h3>

                                                            {
                                                                product.name
                                                            }

                                                        </h3>


                                                        <p>

                                                            {
                                                                product.description
                                                                || "No description available."
                                                            }

                                                        </p>


                                                        <div
                                                            className="admin-collections__product-footer"
                                                        >

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


                                                            <span>

                                                                Order #

                                                                {
                                                                    product.collection_sort_order
                                                                }

                                                            </span>

                                                        </div>


                                                    </div>


                                                </article>

                                            )
                                        )
                                    }

                                </div>

                            )
                        }


                    </section>


                </section>


            </main>


        </div>

    );

}


export default AdminCollections;