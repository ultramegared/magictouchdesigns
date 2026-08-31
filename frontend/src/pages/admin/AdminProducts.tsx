/**
 * ================================================================
 * Project: Magic Touch Designs
 * Author: ultramegared
 * File: AdminProducts.tsx
 * Module: Administrator Panel
 * Language: TypeScript React
 * Description:
 * Administrative product management page.
 * Supports independent product creation, editing, image uploads,
 * image replacement, image removal and status management.
 *
 * Products are independent from Collections.
 *
 * Languages: English (en) | Español (es)
 * ================================================================
 */

import {
    useEffect,
    useState,
} from "react";

import {
    Plus,
    Pencil,
    Trash2,
    Power,
    Package,
    Image as ImageIcon,
    LoaderCircle,
    X,
    Save,
    Upload,
} from "lucide-react";

import AdminSidebar from "./AdminSidebar";

import {
    apiRequest,
} from "../../services/api";

import "./AdminProducts.css";


/* ===============================================================
   TYPES
================================================================ */

interface CurrentUser {

    username:
        string;

}


interface Product {

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

    created_at:
        string;

    updated_at:
        string;

}


interface ProductFormData {

    name:
        string;

    slug:
        string;

    description:
        string;

    price:
        string;

    is_active:
        boolean;

    sort_order:
        string;

}


interface UploadResponse {

    status:
        string;

    message:
        string;

    image_url:
        string;

}


/* ===============================================================
   DEFAULT FORM
================================================================ */

const createEmptyForm =
    (): ProductFormData => ({

        name:
            "",

        slug:
            "",

        description:
            "",

        price:
            "",

        is_active:
            true,

        sort_order:
            "0",

    });


/* ===============================================================
   COMPONENT
================================================================ */

function AdminProducts() {


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
       PRODUCTS
    ============================================================ */

    const [
        products,
        setProducts,
    ] = useState<Product[]>(
        []
    );


    const [
        loading,
        setLoading,
    ] = useState(
        true
    );


    /* ============================================================
       FORM
    ============================================================ */

    const [
        formData,
        setFormData,
    ] = useState<ProductFormData>(
        createEmptyForm()
    );


    const [
        editingProduct,
        setEditingProduct,
    ] = useState<Product | null>(
        null
    );


    const [
        showForm,
        setShowForm,
    ] = useState(
        false
    );


    const [
        saving,
        setSaving,
    ] = useState(
        false
    );


    /* ============================================================
       IMAGE
    ============================================================ */

    const [
        selectedImage,
        setSelectedImage,
    ] = useState<File | null>(
        null
    );


    const [
        imagePreview,
        setImagePreview,
    ] = useState<string | null>(
        null
    );


    const [
        removeExistingImage,
        setRemoveExistingImage,
    ] = useState(
        false
    );


    /* ============================================================
       MESSAGE
    ============================================================ */

    const [
        message,
        setMessage,
    ] = useState<string | null>(
        null
    );


    /* ============================================================
       LOAD CURRENT USER
    ============================================================ */

    useEffect(() => {

        const loadCurrentUser =
            async () => {

                try {

                    const result =
                        await apiRequest<{
                            status:
                                string;

                            user:
                                CurrentUser;

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

    }, []);


    /* ============================================================
       LOAD PRODUCTS
    ============================================================ */

    const loadProducts =
        async () => {

            try {

                setLoading(
                    true
                );


                const result =
                    await apiRequest<{
                        status:
                            string;

                        products:
                            Product[];

                    }>(
                        "/api/products"
                    );


                setProducts(
                    result.products
                );

            } catch (
                error
            ) {

                console.error(
                    "Unable to load products:",
                    error
                );


                setMessage(
                    error instanceof Error

                        ? error.message

                        : "Unable to load products."
                );

            } finally {

                setLoading(
                    false
                );

            }

        };


    useEffect(() => {

        loadProducts();

    }, []);


    /* ============================================================
       CREATE SLUG
    ============================================================ */

    const generateSlug =
        (
            value:
                string
        ) => {

            return value

                .toLowerCase()

                .trim()

                .replace(
                    /[^a-z0-9\s-]/g,
                    ""
                )

                .replace(
                    /\s+/g,
                    "-"
                )

                .replace(
                    /-+/g,
                    "-"
                );

        };


    /* ============================================================
       FORM CHANGE
    ============================================================ */

    const handleChange =
        (
            event:
                React.ChangeEvent<
                    HTMLInputElement
                    | HTMLTextAreaElement
                >
        ) => {

            const {

                name,

                value,

                type,

            } = event.target;


            const checked =
                "checked" in event.target

                    ? event.target.checked

                    : false;


            setFormData(

                current => ({

                    ...current,

                    [
                        name
                    ]:

                        type === "checkbox"

                            ? checked

                            : value,

                })

            );


            /*
            --------------------------------------------------------
            Automatically generate the slug only for new products.
            --------------------------------------------------------
            */

            if (
                name === "name" &&
                !editingProduct
            ) {

                setFormData(

                    current => ({

                        ...current,

                        name:
                            value,

                        slug:
                            generateSlug(
                                value
                            ),

                    })

                );

            }

        };


    /* ============================================================
       IMAGE CHANGE
    ============================================================ */

    const handleImageChange =
        (
            event:
                React.ChangeEvent<
                    HTMLInputElement
                >
        ) => {

            const file =
                event.target.files?.[0];


            if (
                !file
            ) {

                return;

            }


            if (
                !file.type.startsWith(
                    "image/"
                )
            ) {

                setMessage(
                    "Please select a valid image file."
                );

                return;

            }


            setSelectedImage(
                file
            );


            setRemoveExistingImage(
                false
            );


            const previewUrl =
                URL.createObjectURL(
                    file
                );


            setImagePreview(
                previewUrl
            );

        };


    /* ============================================================
       REMOVE IMAGE
    ============================================================ */

    const handleRemoveImage =
        () => {

            /*
            --------------------------------------------------------
            Remove newly selected image.
            --------------------------------------------------------
            */

            if (
                selectedImage
            ) {

                setSelectedImage(
                    null
                );


                setImagePreview(
                    editingProduct?.image_url
                    || null
                );

                return;

            }


            /*
            --------------------------------------------------------
            Remove existing saved image.
            --------------------------------------------------------
            */

            if (
                editingProduct?.image_url
            ) {

                setRemoveExistingImage(
                    true
                );

            }


            setImagePreview(
                null
            );

        };


    /* ============================================================
       OPEN CREATE FORM
    ============================================================ */

    const handleCreate =
        () => {

            setEditingProduct(
                null
            );


            setFormData(
                createEmptyForm()
            );


            setSelectedImage(
                null
            );


            setImagePreview(
                null
            );


            setRemoveExistingImage(
                false
            );


            setShowForm(
                true
            );


            setMessage(
                null
            );

        };


    /* ============================================================
       OPEN EDIT FORM
    ============================================================ */

    const handleEdit =
        (
            product:
                Product
        ) => {

            setEditingProduct(
                product
            );


            setFormData({

                name:
                    product.name,

                slug:
                    product.slug,

                description:
                    product.description
                    ?? "",

                price:
                    String(
                        product.price
                    ),

                is_active:
                    product.is_active,

                sort_order:
                    String(
                        product.sort_order
                    ),

            });


            setSelectedImage(
                null
            );


            setImagePreview(
                product.image_url
                || null
            );


            setRemoveExistingImage(
                false
            );


            setShowForm(
                true
            );


            setMessage(
                null
            );

        };


    /* ============================================================
       CLOSE FORM
    ============================================================ */

    const handleCloseForm =
        () => {

            setShowForm(
                false
            );


            setEditingProduct(
                null
            );


            setFormData(
                createEmptyForm()
            );


            setSelectedImage(
                null
            );


            setImagePreview(
                null
            );


            setRemoveExistingImage(
                false
            );

        };


    /* ============================================================
       SAVE PRODUCT
    ============================================================ */

    const handleSave =
        async (
            event:
                React.FormEvent
        ) => {

            event.preventDefault();


            try {

                setSaving(
                    true
                );


                setMessage(
                    null
                );


                /*
                ----------------------------------------------------
                DETERMINE CURRENT IMAGE URL
                ----------------------------------------------------
                */

                let imageUrl:
                    string
                    | null =
                    editingProduct?.image_url
                    || null;


                /*
                ----------------------------------------------------
                REMOVE EXISTING IMAGE
                ----------------------------------------------------
                */

                if (
                    removeExistingImage
                ) {

                    imageUrl =
                        null;

                }


                /*
                ----------------------------------------------------
                UPLOAD NEW IMAGE
                ----------------------------------------------------
                */

                if (
                    selectedImage
                ) {

                    const uploadFormData =
                        new FormData();


                    uploadFormData.append(
                        "image",
                        selectedImage
                    );


                    const uploadResult =
                        await apiRequest<
                            UploadResponse
                        >(

                            "/api/upload/product",

                            {

                                method:
                                    "POST",

                                body:
                                    uploadFormData,

                            }

                        );


                    imageUrl =
                        uploadResult.image_url;

                }


                /*
                ----------------------------------------------------
                PRODUCT DATA
                ----------------------------------------------------
                */

                const payload = {

                    name:
                        formData.name
                            .trim(),

                    slug:
                        formData.slug
                            .trim()
                            .toLowerCase(),

                    description:
                        formData.description
                            .trim()
                        || null,

                    price:
                        Number(
                            formData.price
                        ),

                    image_url:
                        imageUrl,

                    is_active:
                        formData.is_active,

                    sort_order:
                        Number(
                            formData.sort_order
                        ),

                };


                /*
                ----------------------------------------------------
                UPDATE PRODUCT
                ----------------------------------------------------
                */

                if (
                    editingProduct
                ) {

                    await apiRequest(

                        `/api/products/${editingProduct.product_id}`,

                        {

                            method:
                                "PUT",

                            body:
                                JSON.stringify(
                                    payload
                                ),

                        }

                    );


                    setMessage(
                        "Product updated successfully."
                    );

                }


                /*
                ----------------------------------------------------
                CREATE PRODUCT
                ----------------------------------------------------
                */

                else {

                    await apiRequest(

                        "/api/products",

                        {

                            method:
                                "POST",

                            body:
                                JSON.stringify(
                                    payload
                                ),

                        }

                    );


                    setMessage(
                        "Product created successfully."
                    );

                }


                handleCloseForm();


                await loadProducts();

            } catch (
                error
            ) {

                console.error(
                    "Unable to save product:",
                    error
                );


                setMessage(

                    error instanceof Error

                        ? error.message

                        : "Unable to save product."

                );

            } finally {

                setSaving(
                    false
                );

            }

        };


    /* ============================================================
       TOGGLE STATUS
    ============================================================ */

    const handleToggleStatus =
        async (
            product:
                Product
        ) => {

            try {

                const endpoint =
                    product.is_active

                        ? `/api/products/${product.product_id}/deactivate`

                        : `/api/products/${product.product_id}/activate`;


                await apiRequest(
                    endpoint,
                    {
                        method:
                            "PUT",
                    }
                );


                setMessage(

                    product.is_active

                        ? "Product deactivated successfully."

                        : "Product activated successfully."

                );


                await loadProducts();

            } catch (
                error
            ) {

                console.error(
                    "Unable to update product status:",
                    error
                );


                setMessage(

                    error instanceof Error

                        ? error.message

                        : "Unable to update product status."

                );

            }

        };


    /* ============================================================
       DELETE PRODUCT
    ============================================================ */

    const handleDelete =
        async (
            product:
                Product
        ) => {

            const confirmed =
                window.confirm(

                    `Are you sure you want to permanently delete "${product.name}"?`

                );


            if (
                !confirmed
            ) {

                return;

            }


            try {

                await apiRequest(

                    `/api/products/${product.product_id}`,

                    {
                        method:
                            "DELETE",
                    }

                );


                setMessage(
                    "Product deleted successfully."
                );


                await loadProducts();

            } catch (
                error
            ) {

                console.error(
                    "Unable to delete product:",
                    error
                );


                setMessage(

                    error instanceof Error

                        ? error.message

                        : "Unable to delete product."

                );

            }

        };


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
                className="admin-products"
            >

                {/* ==================================================
                    HERO
                   ================================================== */}

                <section
                    className="admin-products__hero"
                >

                    <div>

                        <span
                            className="admin-products__eyebrow"
                        >

                            ADMINISTRATION

                        </span>


                        <h1>

                            Products

                        </h1>


                        <p>

                            Create, manage and organize
                            all store products from one place.

                        </p>

                    </div>


                    <button

                        type="button"

                        className="admin-products__create"

                        onClick={
                            handleCreate
                        }

                    >

                        <Plus
                            size={20}
                        />


                        Add Product

                    </button>

                </section>


                {

                    message && (

                        <div
                            className="admin-products__message"
                        >

                            {message}

                        </div>

                    )

                }


                {/* ==================================================
                    CONTENT
                   ================================================== */}

                <section
                    className="admin-products__content"
                >

                    {

                        loading

                            ? (

                                <div
                                    className="admin-products__loading"
                                >

                                    <LoaderCircle
                                        size={28}
                                    />


                                    <span>

                                        Loading products...

                                    </span>

                                </div>

                            )

                            : products.length === 0

                                ? (

                                    <div
                                        className="admin-products__empty"
                                    >

                                        <Package
                                            size={48}
                                        />


                                        <h2>

                                            No products yet

                                        </h2>


                                        <p>

                                            Create your first product
                                            to start building your store.

                                        </p>


                                        <button

                                            type="button"

                                            onClick={
                                                handleCreate
                                            }

                                        >

                                            <Plus
                                                size={18}
                                            />


                                            Create Product

                                        </button>

                                    </div>

                                )

                                : (

                                    <div
                                        className="admin-products__grid"
                                    >

                                        {

                                            products.map(

                                                product => (

                                                    <article

                                                        key={
                                                            product.product_id
                                                        }

                                                        className="admin-products__card"

                                                    >

                                                        <div
                                                            className="admin-products__image"
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

                                                                        <ImageIcon
                                                                            size={34}
                                                                        />

                                                                    )

                                                            }


                                                            <span

                                                                className={

                                                                    product.is_active

                                                                        ? "admin-products__status admin-products__status--active"

                                                                        : "admin-products__status"

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
                                                            className="admin-products__card-content"
                                                        >

                                                            <div>

                                                                <h2>

                                                                    {
                                                                        product.name
                                                                    }

                                                                </h2>


                                                                <span>

                                                                    {
                                                                        product.slug
                                                                    }

                                                                </span>

                                                            </div>


                                                            {

                                                                product.description && (

                                                                    <p>

                                                                        {
                                                                            product.description
                                                                        }

                                                                    </p>

                                                                )

                                                            }


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


                                                            <small>

                                                                Order:
                                                                {" "}

                                                                {
                                                                    product.sort_order
                                                                }

                                                            </small>


                                                            <div
                                                                className="admin-products__actions"
                                                            >

                                                                <button

                                                                    type="button"

                                                                    onClick={() =>

                                                                        handleEdit(
                                                                            product
                                                                        )

                                                                    }

                                                                    title="Edit product"

                                                                >

                                                                    <Pencil
                                                                        size={17}
                                                                    />

                                                                </button>


                                                                <button

                                                                    type="button"

                                                                    onClick={() =>

                                                                        handleToggleStatus(
                                                                            product
                                                                        )

                                                                    }

                                                                    title={
                                                                        product.is_active

                                                                            ? "Deactivate product"

                                                                            : "Activate product"
                                                                    }

                                                                >

                                                                    <Power
                                                                        size={17}
                                                                    />

                                                                </button>


                                                                <button

                                                                    type="button"

                                                                    onClick={() =>

                                                                        handleDelete(
                                                                            product
                                                                        )

                                                                    }

                                                                    title="Delete product"

                                                                >

                                                                    <Trash2
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


                {/* ==================================================
                    PRODUCT FORM
                   ================================================== */}

                {

                    showForm && (

                        <div
                            className="admin-products__modal-overlay"
                        >

                            <div
                                className="admin-products__modal"
                            >

                                <div
                                    className="admin-products__modal-header"
                                >

                                    <div>

                                        <span>

                                            PRODUCT MANAGEMENT

                                        </span>


                                        <h2>

                                            {

                                                editingProduct

                                                    ? "Edit Product"

                                                    : "Create Product"

                                            }

                                        </h2>

                                    </div>


                                    <button

                                        type="button"

                                        onClick={
                                            handleCloseForm
                                        }

                                        aria-label="Close"

                                    >

                                        <X
                                            size={22}
                                        />

                                    </button>

                                </div>


                                <form
                                    onSubmit={
                                        handleSave
                                    }
                                >

                                    <div
                                        className="admin-products__form-grid"
                                    >


                                        <label>

                                            Product Name

                                            <input

                                                type="text"

                                                name="name"

                                                value={
                                                    formData.name
                                                }

                                                onChange={
                                                    handleChange
                                                }

                                                required

                                            />

                                        </label>


                                        <label>

                                            Product Slug

                                            <input

                                                type="text"

                                                name="slug"

                                                value={
                                                    formData.slug
                                                }

                                                onChange={
                                                    handleChange
                                                }

                                                required

                                            />

                                        </label>


                                        <label>

                                            Price

                                            <input

                                                type="number"

                                                name="price"

                                                min="0"

                                                step="0.01"

                                                value={
                                                    formData.price
                                                }

                                                onChange={
                                                    handleChange
                                                }

                                                required

                                            />

                                        </label>


                                        {/* ==================================================
                                            IMAGE UPLOAD
                                           ================================================== */}

                                        <label
                                            className="admin-products__form-full"
                                        >

                                            Product Image

                                            <div
                                                className="admin-products__upload"
                                            >

                                                <input

                                                    type="file"

                                                    accept="image/*"

                                                    onChange={
                                                        handleImageChange
                                                    }

                                                />


                                                <Upload
                                                    size={20}
                                                />


                                                <span>

                                                    Choose an image from
                                                    your computer or phone

                                                </span>

                                            </div>

                                        </label>


                                        {

                                            imagePreview && (

                                                <div
                                                    className="admin-products__image-preview"
                                                >

                                                    <img

                                                        src={
                                                            imagePreview
                                                        }

                                                        alt="Product preview"

                                                    />


                                                    <button

                                                        type="button"

                                                        onClick={
                                                            handleRemoveImage
                                                        }

                                                    >

                                                        <X
                                                            size={18}
                                                        />

                                                        Remove image

                                                    </button>

                                                </div>

                                            )

                                        }


                                        <label
                                            className="admin-products__form-full"
                                        >

                                            Description

                                            <textarea

                                                name="description"

                                                rows={4}

                                                value={
                                                    formData.description
                                                }

                                                onChange={
                                                    handleChange
                                                }

                                            />

                                        </label>


                                        <label>

                                            Display Order

                                            <input

                                                type="number"

                                                name="sort_order"

                                                min="0"

                                                value={
                                                    formData.sort_order
                                                }

                                                onChange={
                                                    handleChange
                                                }

                                            />

                                        </label>


                                        <label
                                            className="admin-products__checkbox"
                                        >

                                            <input

                                                type="checkbox"

                                                name="is_active"

                                                checked={
                                                    formData.is_active
                                                }

                                                onChange={
                                                    handleChange
                                                }

                                            />


                                            Active Product

                                        </label>

                                    </div>


                                    <div
                                        className="admin-products__modal-footer"
                                    >

                                        <button

                                            type="button"

                                            className="admin-products__cancel"

                                            onClick={
                                                handleCloseForm
                                            }

                                        >

                                            Cancel

                                        </button>


                                        <button

                                            type="submit"

                                            className="admin-products__save"

                                            disabled={
                                                saving
                                            }

                                        >

                                            {

                                                saving

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

                                                saving

                                                    ? "Saving..."

                                                    : editingProduct

                                                        ? "Save Changes"

                                                        : "Create Product"

                                            }

                                        </button>

                                    </div>

                                </form>

                            </div>

                        </div>

                    )

                }

            </main>

        </div>

    );

}


export default AdminProducts;