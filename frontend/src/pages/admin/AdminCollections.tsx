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

import type {
    ChangeEvent,
    FormEvent,
} from "react";

import {
    ArrowDown,
    ArrowUp,
    CheckCircle2,
    Edit3,
    FolderKanban,
    ImageOff,
    LoaderCircle,
    Package,
    RefreshCw,
    Save,
    Upload,
    X,
    XCircle,
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


interface ProductFormData {

    name: string;

    slug: string;

    description: string;

    price: string;

    image_url: string;

    features: string;

}


interface UploadResponse {

    status: string;

    message: string;

    image_url: string;

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
       EDITING STATE
    ============================================================ */

    const [
        editingProduct,
        setEditingProduct,
    ] = useState<CollectionProduct | null>(
        null
    );


    const [
        productForm,
        setProductForm,
    ] = useState<ProductFormData>(

        {
            name: "",
            slug: "",
            description: "",
            price: "",
            image_url: "",
            features: "",
        }

    );


    /* ============================================================
       ACTION STATE
    ============================================================ */

    const [
        savingProduct,
        setSavingProduct,
    ] = useState(
        false
    );


    const [
        uploadingImage,
        setUploadingImage,
    ] = useState(
        false
    );


    const [
        updatingProductId,
        setUpdatingProductId,
    ] = useState<string | null>(
        null
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
       SELECT COLLECTION
    ============================================================ */

    const handleCollectionChange =
        (
            collectionSlug: string
        ) => {

            if (
                savingProduct ||
                uploadingImage ||
                updatingProductId
            ) {

                return;

            }


            setEditingProduct(
                null
            );


            setSelectedCollection(
                collectionSlug
            );

        };


    /* ============================================================
       EDIT PRODUCT
    ============================================================ */

    const handleEditProduct =
        (
            product: CollectionProduct
        ) => {

            setError(
                null
            );


            setEditingProduct(
                product
            );


            setProductForm(

                {
                    name:
                        product.name
                        || "",

                    slug:
                        product.slug
                        || "",

                    description:
                        product.description
                        || "",

                    price:
                        String(
                            product.price
                        ),

                    image_url:
                        product.image_url
                        || "",

                    features:
                        Array.isArray(
                            product.features
                        )

                            ? product.features.join(
                                ", "
                            )

                            : "",
                }

            );

        };


    /* ============================================================
       CLOSE EDIT
    ============================================================ */

    const handleCloseEdit =
        () => {

            if (
                savingProduct ||
                uploadingImage
            ) {

                return;

            }


            setEditingProduct(
                null
            );


            setError(
                null
            );


            setProductForm(

                {
                    name: "",
                    slug: "",
                    description: "",
                    price: "",
                    image_url: "",
                    features: "",
                }

            );

        };


    /* ============================================================
       FORM CHANGE
    ============================================================ */

    const handleFormChange =
        (
            field:
                keyof ProductFormData,

            value:
                string
        ) => {

            setProductForm(
                (
                    previous
                ) => (

                    {
                        ...previous,

                        [
                            field
                        ]:
                            value,
                    }

                )
            );

        };


    /* ============================================================
       UPLOAD PRODUCT IMAGE
    ============================================================ */

    const handleImageUpload =
        async (
            event:
                ChangeEvent<HTMLInputElement>
        ) => {

            const file =
                event.target.files?.[
                    0
                ];


            if (
                !file
            ) {

                return;

            }


            const allowedTypes = [

                "image/jpeg",

                "image/png",

                "image/webp",

            ];


            if (
                !allowedTypes.includes(
                    file.type
                )
            ) {

                setError(
                    "Only JPG, PNG and WEBP images are allowed."
                );


                event.target.value =
                    "";

                return;

            }


            if (
                file.size >
                5 * 1024 * 1024
            ) {

                setError(
                    "Image size cannot exceed 5 MB."
                );


                event.target.value =
                    "";

                return;

            }


            try {

                setUploadingImage(
                    true
                );


                setError(
                    null
                );


                const formData =
                    new FormData();


                formData.append(
                    "image",
                    file
                );


                const result =
                    await apiRequest<UploadResponse>(

                        "/api/upload/product",

                        {

                            method:
                                "POST",

                            body:
                                formData,

                        }

                    );


                setProductForm(
                    (
                        previous
                    ) => (

                        {
                            ...previous,

                            image_url:
                                result.image_url,

                        }

                    )
                );


                event.target.value =
                    "";

            } catch (
                error
            ) {

                console.error(
                    "Unable to upload product image:",
                    error
                );


                setError(
                    error instanceof Error

                        ? error.message

                        : "Unable to upload image."
                );

            } finally {

                setUploadingImage(
                    false
                );

            }

        };


    /* ============================================================
       SAVE PRODUCT
    ============================================================ */

    const handleSaveProduct =
        async (
            event:
                FormEvent<HTMLFormElement>
        ) => {

            event.preventDefault();


            if (
                !editingProduct
            ) {

                return;

            }


            if (
                uploadingImage
            ) {

                setError(
                    "Please wait until the image upload is complete."
                );

                return;

            }


            const parsedPrice =
                Number(
                    productForm.price
                );


            if (
                !Number.isFinite(
                    parsedPrice
                )

                ||

                parsedPrice < 0
            ) {

                setError(
                    "Please enter a valid product price."
                );

                return;

            }


            try {

                setSavingProduct(
                    true
                );


                setError(
                    null
                );


                const features =
                    productForm.features
                        .split(
                            ","
                        )
                        .map(
                            (
                                feature
                            ) =>
                                feature.trim()
                        )
                        .filter(
                            Boolean
                        );


                await apiRequest(

                    `/api/collections/admin/${selectedCollection}/products/${editingProduct.product_id}`,

                    {
                        method:
                            "PUT",

                        body:
                            JSON.stringify(
                                {
                                    name:
                                        productForm.name.trim(),

                                    slug:
                                        productForm.slug.trim(),

                                    description:
                                        productForm.description.trim(),

                                    price:
                                        parsedPrice,

                                    image_url:
                                        productForm.image_url.trim(),

                                    features,
                                }
                            ),
                    }

                );


                await loadCollectionProducts();


                handleCloseEdit();

            } catch (
                error
            ) {

                console.error(
                    "Unable to update collection product:",
                    error
                );


                setError(
                    error instanceof Error

                        ? error.message

                        : "Unable to update product."
                );

            } finally {

                setSavingProduct(
                    false
                );

            }

        };


    /* ============================================================
       UPDATE PRODUCT STATUS
    ============================================================ */

    const handleToggleProductStatus =
        async (
            product: CollectionProduct
        ) => {

            try {

                setUpdatingProductId(
                    product.product_id
                );


                setError(
                    null
                );


                await apiRequest(

                    `/api/collections/admin/${selectedCollection}/products/${product.product_id}/status`,

                    {
                        method:
                            "PUT",

                        body:
                            JSON.stringify(
                                {
                                    is_active:
                                        !product.is_active,
                                }
                            ),
                    }

                );


                setProducts(
                    (
                        previous
                    ) =>
                        previous.map(
                            (
                                currentProduct
                            ) =>

                                currentProduct.product_id ===
                                product.product_id

                                    ? {

                                        ...currentProduct,

                                        is_active:
                                            !currentProduct.is_active,

                                    }

                                    : currentProduct

                        )
                );

            } catch (
                error
            ) {

                console.error(
                    "Unable to update product status:",
                    error
                );


                setError(
                    error instanceof Error

                        ? error.message

                        : "Unable to update product status."
                );

            } finally {

                setUpdatingProductId(
                    null
                );

            }

        };


    /* ============================================================
       MOVE PRODUCT
    ============================================================ */

    const handleMoveProduct =
        async (
            productIndex: number,
            direction:
                "up"
                | "down"
        ) => {

            const targetIndex =
                direction ===
                "up"

                    ? productIndex - 1

                    : productIndex + 1;


            if (
                targetIndex < 0

                ||

                targetIndex >=
                products.length
            ) {

                return;

            }


            const currentProduct =
                products[
                    productIndex
                ];


            const targetProduct =
                products[
                    targetIndex
                ];


            try {

                setUpdatingProductId(
                    currentProduct.product_id
                );


                setError(
                    null
                );


                await Promise.all(

                    [

                        apiRequest(

                            `/api/collections/admin/${selectedCollection}/products/${currentProduct.product_id}/order`,

                            {
                                method:
                                    "PUT",

                                body:
                                    JSON.stringify(
                                        {
                                            sort_order:
                                                targetProduct.collection_sort_order,
                                        }
                                    ),
                            }

                        ),


                        apiRequest(

                            `/api/collections/admin/${selectedCollection}/products/${targetProduct.product_id}/order`,

                            {
                                method:
                                    "PUT",

                                body:
                                    JSON.stringify(
                                        {
                                            sort_order:
                                                currentProduct.collection_sort_order,
                                        }
                                    ),
                            }

                        ),

                    ]

                );


                const updatedProducts =
                    [
                        ...products,
                    ];


                updatedProducts[
                    productIndex
                ] =
                    targetProduct;


                updatedProducts[
                    targetIndex
                ] =
                    currentProduct;


                setProducts(
                    updatedProducts
                );

            } catch (
                error
            ) {

                console.error(
                    "Unable to change product order:",
                    error
                );


                setError(
                    error instanceof Error

                        ? error.message

                        : "Unable to change product order."
                );


                await loadCollectionProducts();

            } finally {

                setUpdatingProductId(
                    null
                );

            }

        };


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

                                                handleCollectionChange(
                                                    collection.slug
                                                )

                                            }
                                            disabled={
                                                isLoading
                                                ||
                                                savingProduct
                                                ||
                                                uploadingImage
                                                ||
                                                updatingProductId !==
                                                null
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
                                                product,
                                                index
                                            ) => (

                                                <article
                                                    className="admin-collections__product"
                                                    key={
                                                        product.product_id
                                                    }
                                                >

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



                                                        <div
                                                            className="admin-collections__product-actions"
                                                        >

                                                            <button
                                                                type="button"
                                                                className="admin-collections__action admin-collections__action--edit"
                                                                onClick={() =>

                                                                    handleEditProduct(
                                                                        product
                                                                    )

                                                                }
                                                                disabled={
                                                                    savingProduct
                                                                    ||
                                                                    uploadingImage
                                                                    ||
                                                                    updatingProductId !==
                                                                    null
                                                                }
                                                            >

                                                                <Edit3
                                                                    size={16}
                                                                />


                                                                Edit

                                                            </button>


                                                            <button
                                                                type="button"
                                                                className={
                                                                    product.is_active

                                                                        ? "admin-collections__action admin-collections__action--deactivate"

                                                                        : "admin-collections__action admin-collections__action--activate"
                                                                }
                                                                onClick={() =>

                                                                    handleToggleProductStatus(
                                                                        product
                                                                    )

                                                                }
                                                                disabled={
                                                                    updatingProductId ===
                                                                    product.product_id
                                                                }
                                                            >

                                                                {

                                                                    updatingProductId ===
                                                                    product.product_id

                                                                        ? (

                                                                            <LoaderCircle
                                                                                size={16}
                                                                            />

                                                                        )

                                                                        : product.is_active

                                                                            ? (

                                                                                <XCircle
                                                                                    size={16}
                                                                                />

                                                                            )

                                                                            : (

                                                                                <CheckCircle2
                                                                                    size={16}
                                                                                />

                                                                            )

                                                                }


                                                                {

                                                                    product.is_active

                                                                        ? "Deactivate"

                                                                        : "Activate"

                                                                }

                                                            </button>

                                                        </div>



                                                        <div
                                                            className="admin-collections__order-actions"
                                                        >

                                                            <button
                                                                type="button"
                                                                onClick={() =>

                                                                    handleMoveProduct(
                                                                        index,
                                                                        "up"
                                                                    )

                                                                }
                                                                disabled={
                                                                    index ===
                                                                    0
                                                                    ||
                                                                    updatingProductId !==
                                                                    null
                                                                }
                                                                aria-label="Move product up"
                                                            >

                                                                <ArrowUp
                                                                    size={17}
                                                                />

                                                            </button>


                                                            <button
                                                                type="button"
                                                                onClick={() =>

                                                                    handleMoveProduct(
                                                                        index,
                                                                        "down"
                                                                    )

                                                                }
                                                                disabled={
                                                                    index ===
                                                                    products.length -
                                                                    1
                                                                    ||
                                                                    updatingProductId !==
                                                                    null
                                                                }
                                                                aria-label="Move product down"
                                                            >

                                                                <ArrowDown
                                                                    size={17}
                                                                />

                                                            </button>

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



            {/* ======================================================
                EDIT MODAL
               ====================================================== */}

            {
                editingProduct && (

                    <div
                        className="admin-collections__modal-backdrop"
                        onClick={
                            handleCloseEdit
                        }
                    >

                        <div
                            className="admin-collections__modal"
                            onClick={
                                (
                                    event
                                ) =>

                                    event.stopPropagation()

                            }
                        >

                            <div
                                className="admin-collections__modal-header"
                            >

                                <div>

                                    <span>

                                        EDIT PRODUCT

                                    </span>


                                    <h2>

                                        {
                                            editingProduct.name
                                        }

                                    </h2>

                                </div>


                                <button
                                    type="button"
                                    onClick={
                                        handleCloseEdit
                                    }
                                    disabled={
                                        savingProduct
                                        ||
                                        uploadingImage
                                    }
                                    aria-label="Close"
                                >

                                    <X
                                        size={22}
                                    />

                                </button>

                            </div>



                            {
                                error && (

                                    <div
                                        className="admin-collections__error"
                                    >

                                        {error}

                                    </div>

                                )
                            }



                            <form
                                onSubmit={
                                    handleSaveProduct
                                }
                            >

                                <div
                                    className="admin-collections__form-grid"
                                >

                                    <label>

                                        <span>

                                            Product Name

                                        </span>


                                        <input
                                            type="text"
                                            value={
                                                productForm.name
                                            }
                                            onChange={
                                                (
                                                    event
                                                ) =>

                                                    handleFormChange(
                                                        "name",
                                                        event.target.value
                                                    )

                                            }
                                            required
                                        />

                                    </label>


                                    <label>

                                        <span>

                                            Product Slug

                                        </span>


                                        <input
                                            type="text"
                                            value={
                                                productForm.slug
                                            }
                                            onChange={
                                                (
                                                    event
                                                ) =>

                                                    handleFormChange(
                                                        "slug",
                                                        event.target.value
                                                    )

                                            }
                                            required
                                        />

                                    </label>


                                    <label
                                        className="admin-collections__form-field--full"
                                    >

                                        <span>

                                            Description

                                        </span>


                                        <textarea
                                            rows={
                                                5
                                            }
                                            value={
                                                productForm.description
                                            }
                                            onChange={
                                                (
                                                    event
                                                ) =>

                                                    handleFormChange(
                                                        "description",
                                                        event.target.value
                                                    )

                                            }
                                        />

                                    </label>


                                    <label>

                                        <span>

                                            Price

                                        </span>


                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={
                                                productForm.price
                                            }
                                            onChange={
                                                (
                                                    event
                                                ) =>

                                                    handleFormChange(
                                                        "price",
                                                        event.target.value
                                                    )

                                            }
                                            required
                                        />

                                    </label>



                                    {/* ==========================
                                        IMAGE UPLOAD
                                       ========================== */}

                                    <label>

                                        <span>

                                            Upload New Image

                                        </span>


                                        <input
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            onChange={
                                                handleImageUpload
                                            }
                                            disabled={
                                                uploadingImage
                                                ||
                                                savingProduct
                                            }
                                        />

                                    </label>



                                    {
                                        uploadingImage && (

                                            <div
                                                className="admin-collections__uploading"
                                            >

                                                <LoaderCircle
                                                    size={18}
                                                />


                                                <span>

                                                    Uploading image...

                                                </span>

                                            </div>

                                        )
                                    }



                                    {/* ==========================
                                        IMAGE URL
                                       ========================== */}

                                    <label
                                        className="admin-collections__form-field--full"
                                    >

                                        <span>

                                            Image URL

                                        </span>


                                        <input
                                            type="text"
                                            value={
                                                productForm.image_url
                                            }
                                            onChange={
                                                (
                                                    event
                                                ) =>

                                                    handleFormChange(
                                                        "image_url",
                                                        event.target.value
                                                    )

                                            }
                                            placeholder="Image URL will appear here after upload"
                                        />

                                    </label>



                                    {/* ==========================
                                        IMAGE PREVIEW
                                       ========================== */}

                                    {
                                        productForm.image_url && (

                                            <div
                                                className="admin-collections__image-preview"
                                            >

                                                <span>

                                                    Image Preview

                                                </span>


                                                <img
                                                    src={
                                                        productForm.image_url
                                                    }
                                                    alt="Product preview"
                                                />

                                            </div>

                                        )
                                    }



                                    <label
                                        className="admin-collections__form-field--full"
                                    >

                                        <span>

                                            Features

                                        </span>


                                        <input
                                            type="text"
                                            placeholder="Feature one, Feature two, Feature three"
                                            value={
                                                productForm.features
                                            }
                                            onChange={
                                                (
                                                    event
                                                ) =>

                                                    handleFormChange(
                                                        "features",
                                                        event.target.value
                                                    )

                                            }
                                        />

                                    </label>

                                </div>



                                <div
                                    className="admin-collections__modal-actions"
                                >

                                    <button
                                        type="button"
                                        className="admin-collections__modal-cancel"
                                        onClick={
                                            handleCloseEdit
                                        }
                                        disabled={
                                            savingProduct
                                            ||
                                            uploadingImage
                                        }
                                    >

                                        Cancel

                                    </button>


                                    <button
                                        type="submit"
                                        className="admin-collections__modal-save"
                                        disabled={
                                            savingProduct
                                            ||
                                            uploadingImage
                                        }
                                    >

                                        {

                                            savingProduct

                                                ? (

                                                    <LoaderCircle
                                                        size={18}
                                                    />

                                                )

                                                : (

                                                    <Save
                                                        size={18}
                                                    />

                                                )

                                        }


                                        {

                                            savingProduct

                                                ? "Saving..."

                                                : uploadingImage

                                                    ? "Uploading Image..."

                                                    : "Save Changes"

                                        }

                                    </button>

                                </div>

                            </form>

                        </div>

                    </div>

                )
            }


        </div>

    );

}


export default AdminCollections;