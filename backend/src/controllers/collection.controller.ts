/**
 * ================================================================
 * Project: Magic Touch Designs
 * Author: ultramegared
 * File: collection.controller.ts
 * Module: Collection Controller
 * Language: TypeScript
 * Description:
 * Handles collection API requests.
 * ================================================================
 */

import {
    Request,
    Response,
} from "express";

import {
    getCollectionBySlug,

    getProductsByCollectionSlug,

    getCollectionProductsForAdmin as
        getCollectionProductsForAdminService,

    getCollectionProductForAdmin as
        getCollectionProductForAdminService,

    getAvailableProductsForCollection as
        getAvailableProductsForCollectionService,

    addProductToCollection as
        addProductToCollectionService,

    removeProductFromCollection as
        removeProductFromCollectionService,

    updateCollection as
        updateCollectionService,

    updateCollectionProduct as
        updateCollectionProductService,

    setCollectionProductStatus as
        setCollectionProductStatusService,

    updateCollectionProductOrder as
        updateCollectionProductOrderService,

    reorderCollectionProducts as
        reorderCollectionProductsService,

} from "../services/collection.service";


/* ===============================================================
   GET COLLECTION FOR ADMIN
================================================================ */

/**
 * GET
 * /api/collections/admin/:slug
 *
 * Returns collection information.
 *
 * Administrator only.
 */

export const getCollectionForAdmin =
    async (
        request: Request,
        response: Response
    ) => {

        try {

            const {
                slug,
            } =
                request.params;


            const collection =
                await getCollectionBySlug(
                    slug
                );


            if (
                !collection
            ) {

                return response.status(
                    404
                ).json(
                    {
                        status:
                            "error",

                        message:
                            "Collection was not found.",
                    }
                );

            }


            return response.json(
                {
                    status:
                        "success",

                    collection,
                }
            );

        } catch (
            error
        ) {

            console.error(
                "Unable to load collection:",
                error
            );


            return response.status(
                500
            ).json(
                {
                    status:
                        "error",

                    message:
                        "Unable to load collection.",
                }
            );

        }

    };


/* ===============================================================
   UPDATE COLLECTION
================================================================ */

/**
 * PUT
 * /api/collections/admin/:slug
 *
 * Updates collection information.
 *
 * Administrator only.
 */

export const updateCollection =
    async (
        request: Request,
        response: Response
    ) => {

        try {

            const {
                slug,
            } =
                request.params;


            const {
                name,
                slug: newSlug,
                description,
                image_url,
                is_active,
                sort_order,
            } =
                request.body;


            const collection =
                await updateCollectionService(
                    slug,
                    {
                        name,

                        slug:
                            newSlug,

                        description,

                        image_url,

                        is_active,

                        sort_order,
                    }
                );


            if (
                !collection
            ) {

                return response.status(
                    404
                ).json(
                    {
                        status:
                            "error",

                        message:
                            "Collection was not found.",
                    }
                );

            }


            return response.json(
                {
                    status:
                        "success",

                    message:
                        "Collection updated successfully.",

                    collection,
                }
            );

        } catch (
            error
        ) {

            console.error(
                "Unable to update collection:",
                error
            );


            return response.status(
                500
            ).json(
                {
                    status:
                        "error",

                    message:
                        "Unable to update collection.",
                }
            );

        }

    };


/* ===============================================================
   GET PRODUCTS BY COLLECTION
================================================================ */

/**
 * GET
 * /api/collections/:slug/products
 *
 * Returns active products
 * from a collection.
 *
 * Public use.
 */

export const getCollectionProducts =
    async (
        request: Request,
        response: Response
    ) => {

        try {

            const {
                slug,
            } =
                request.params;


            const products =
                await getProductsByCollectionSlug(
                    slug
                );


            return response.json(
                {
                    status:
                        "success",

                    products,
                }
            );

        } catch (
            error
        ) {

            console.error(
                "Unable to load collection products:",
                error
            );


            return response.status(
                500
            ).json(
                {
                    status:
                        "error",

                    message:
                        "Unable to load collection products.",
                }
            );

        }

    };


/* ===============================================================
   GET COLLECTION PRODUCTS FOR ADMIN
================================================================ */

/**
 * GET
 * /api/collections/admin/:slug/products
 *
 * Returns all products assigned
 * to a collection, including
 * inactive products.
 *
 * Administrator only.
 */

export const getCollectionProductsForAdmin =
    async (
        request: Request,
        response: Response
    ) => {

        try {

            const {
                slug,
            } =
                request.params;


            const products =
                await getCollectionProductsForAdminService(
                    slug
                );


            return response.json(
                {
                    status:
                        "success",

                    products,
                }
            );

        } catch (
            error
        ) {

            console.error(
                "Unable to load collection products for administrator:",
                error
            );


            return response.status(
                500
            ).json(
                {
                    status:
                        "error",

                    message:
                        "Unable to load collection products.",
                }
            );

        }

    };


/* ===============================================================
   GET AVAILABLE PRODUCTS FOR COLLECTION
================================================================ */

/**
 * GET
 * /api/collections/admin/:slug/available-products
 *
 * Returns products that are
 * not currently assigned
 * to the collection.
 *
 * Administrator only.
 */

export const getAvailableProductsForCollection =
    async (
        request: Request,
        response: Response
    ) => {

        try {

            const {
                slug,
            } =
                request.params;


            const products =
                await getAvailableProductsForCollectionService(
                    slug
                );


            if (
                !products
            ) {

                return response.status(
                    404
                ).json(
                    {
                        status:
                            "error",

                        message:
                            "Collection was not found.",
                    }
                );

            }


            return response.json(
                {
                    status:
                        "success",

                    products,
                }
            );

        } catch (
            error
        ) {

            console.error(
                "Unable to load available products:",
                error
            );


            return response.status(
                500
            ).json(
                {
                    status:
                        "error",

                    message:
                        "Unable to load available products.",
                }
            );

        }

    };


/* ===============================================================
   ADD PRODUCT TO COLLECTION
================================================================ */

/**
 * POST
 * /api/collections/admin/:slug/products
 *
 * Adds an existing product
 * to the collection.
 *
 * Administrator only.
 */

export const addProductToCollection =
    async (
        request: Request,
        response: Response
    ) => {

        try {

            const {
                slug,
            } =
                request.params;


            const {
                product_id,
            } =
                request.body;


            if (
                !product_id
            ) {

                return response.status(
                    400
                ).json(
                    {
                        status:
                            "error",

                        message:
                            "product_id is required.",
                    }
                );

            }


            const product =
                await addProductToCollectionService(
                    slug,
                    product_id
                );


            if (
                !product
            ) {

                return response.status(
                    404
                ).json(
                    {
                        status:
                            "error",

                        message:
                            "Collection or product was not found.",
                    }
                );

            }


            return response.status(
                201
            ).json(
                {
                    status:
                        "success",

                    message:
                        "Product added to collection successfully.",

                    product,
                }
            );

        } catch (
            error
        ) {

            console.error(
                "Unable to add product to collection:",
                error
            );


            return response.status(
                500
            ).json(
                {
                    status:
                        "error",

                    message:
                        "Unable to add product to collection.",
                }
            );

        }

    };


/* ===============================================================
   REMOVE PRODUCT FROM COLLECTION
================================================================ */

/**
 * DELETE
 * /api/collections/admin/:slug/products/:product_id
 *
 * Removes a product from
 * the collection.
 *
 * The original product
 * is not deleted.
 *
 * Administrator only.
 */

export const removeProductFromCollection =
    async (
        request: Request,
        response: Response
    ) => {

        try {

            const {
                slug,
                product_id,
            } =
                request.params;


            const product =
                await removeProductFromCollectionService(
                    slug,
                    product_id
                );


            if (
                !product
            ) {

                return response.status(
                    404
                ).json(
                    {
                        status:
                            "error",

                        message:
                            "Product was not found in this collection.",
                    }
                );

            }


            return response.json(
                {
                    status:
                        "success",

                    message:
                        "Product removed from collection successfully.",

                    product,
                }
            );

        } catch (
            error
        ) {

            console.error(
                "Unable to remove product from collection:",
                error
            );


            return response.status(
                500
            ).json(
                {
                    status:
                        "error",

                    message:
                        "Unable to remove product from collection.",
                }
            );

        }

    };


/* ===============================================================
   GET ONE COLLECTION PRODUCT FOR ADMIN
================================================================ */

/**
 * GET
 * /api/collections/admin/:slug/products/:product_id
 *
 * Returns one product only if
 * it belongs to the requested
 * collection.
 *
 * Administrator only.
 */

export const getCollectionProductForAdmin =
    async (
        request: Request,
        response: Response
    ) => {

        try {

            const {
                slug,
                product_id,
            } =
                request.params;


            const product =
                await getCollectionProductForAdminService(
                    slug,
                    product_id
                );


            if (
                !product
            ) {

                return response.status(
                    404
                ).json(
                    {
                        status:
                            "error",

                        message:
                            "Product was not found in this collection.",
                    }
                );

            }


            return response.json(
                {
                    status:
                        "success",

                    product,
                }
            );

        } catch (
            error
        ) {

            console.error(
                "Unable to load collection product:",
                error
            );


            return response.status(
                500
            ).json(
                {
                    status:
                        "error",

                    message:
                        "Unable to load collection product.",
                }
            );

        }

    };


/* ===============================================================
   UPDATE COLLECTION PRODUCT
================================================================ */

/**
 * PUT
 * /api/collections/admin/:slug/products/:product_id
 *
 * Updates product information.
 *
 * Administrator only.
 */

export const updateCollectionProduct =
    async (
        request: Request,
        response: Response
    ) => {

        try {

            const {
                slug,
                product_id,
            } =
                request.params;


            const {
                name,
                slug: productSlug,
                description,
                price,
                image_url,
                features,
            } =
                request.body;


            const product =
                await updateCollectionProductService(
                    slug,
                    product_id,
                    {
                        name,

                        slug:
                            productSlug,

                        description,

                        price,

                        image_url,

                        features,
                    }
                );


            if (
                !product
            ) {

                return response.status(
                    404
                ).json(
                    {
                        status:
                            "error",

                        message:
                            "Product was not found in this collection.",
                    }
                );

            }


            return response.json(
                {
                    status:
                        "success",

                    message:
                        "Collection product updated successfully.",

                    product,
                }
            );

        } catch (
            error
        ) {

            console.error(
                "Unable to update collection product:",
                error
            );


            return response.status(
                500
            ).json(
                {
                    status:
                        "error",

                    message:
                        "Unable to update collection product.",
                }
            );

        }

    };


/* ===============================================================
   UPDATE COLLECTION PRODUCT STATUS
================================================================ */

/**
 * PUT
 * /api/collections/admin/:slug/products/:product_id/status
 *
 * Activates or deactivates
 * a collection product.
 *
 * Administrator only.
 */

export const updateCollectionProductStatus =
    async (
        request: Request,
        response: Response
    ) => {

        try {

            const {
                slug,
                product_id,
            } =
                request.params;


            const {
                is_active,
            } =
                request.body;


            if (
                typeof is_active !==
                "boolean"
            ) {

                return response.status(
                    400
                ).json(
                    {
                        status:
                            "error",

                        message:
                            "is_active must be a boolean value.",
                    }
                );

            }


            const product =
                await setCollectionProductStatusService(
                    slug,
                    product_id,
                    is_active
                );


            if (
                !product
            ) {

                return response.status(
                    404
                ).json(
                    {
                        status:
                            "error",

                        message:
                            "Product was not found in this collection.",
                    }
                );

            }


            return response.json(
                {
                    status:
                        "success",

                    message:

                        is_active

                            ? "Product activated successfully."

                            : "Product deactivated successfully.",

                    product,
                }
            );

        } catch (
            error
        ) {

            console.error(
                "Unable to update collection product status:",
                error
            );


            return response.status(
                500
            ).json(
                {
                    status:
                        "error",

                    message:
                        "Unable to update product status.",
                }
            );

        }

    };


/* ===============================================================
   UPDATE COLLECTION PRODUCT ORDER
================================================================ */

/**
 * PUT
 * /api/collections/admin/:slug/products/:product_id/order
 *
 * Moves one product
 * to a new position.
 *
 * Administrator only.
 */

export const updateCollectionProductOrder =
    async (
        request: Request,
        response: Response
    ) => {

        try {

            const {
                slug,
                product_id,
            } =
                request.params;


            const {
                sort_order,
            } =
                request.body;


            if (
                typeof sort_order !==
                "number"

                ||

                !Number.isInteger(
                    sort_order
                )

                ||

                sort_order < 1
            ) {

                return response.status(
                    400
                ).json(
                    {
                        status:
                            "error",

                        message:
                            "sort_order must be a valid positive integer.",
                    }
                );

            }


            const product =
                await updateCollectionProductOrderService(
                    slug,
                    product_id,
                    sort_order
                );


            if (
                !product
            ) {

                return response.status(
                    404
                ).json(
                    {
                        status:
                            "error",

                        message:
                            "Product was not found in this collection.",
                    }
                );

            }


            return response.json(
                {
                    status:
                        "success",

                    message:
                        "Collection product order updated successfully.",

                    product,
                }
            );

        } catch (
            error
        ) {

            console.error(
                "Unable to update collection product order:",
                error
            );


            return response.status(
                500
            ).json(
                {
                    status:
                        "error",

                    message:
                        "Unable to update collection product order.",
                }
            );

        }

    };


/* ===============================================================
   REORDER COLLECTION PRODUCTS
================================================================ */

/**
 * PUT
 * /api/collections/admin/:slug/products/reorder
 *
 * Reorders all products
 * inside a collection.
 *
 * Body:
 *
 * {
 *     "product_ids": [
 *         "uuid-1",
 *         "uuid-2",
 *         "uuid-3"
 *     ]
 * }
 *
 * Administrator only.
 */

export const reorderCollectionProducts =
    async (
        request: Request,
        response: Response
    ) => {

        try {

            const {
                slug,
            } =
                request.params;


            const {
                product_ids,
            } =
                request.body;


            if (
                !Array.isArray(
                    product_ids
                )
            ) {

                return response.status(
                    400
                ).json(
                    {
                        status:
                            "error",

                        message:
                            "product_ids must be an array.",
                    }
                );

            }


            const success =
                await reorderCollectionProductsService(
                    slug,
                    product_ids
                );


            if (
                !success
            ) {

                return response.status(
                    400
                ).json(
                    {
                        status:
                            "error",

                        message:
                            "Unable to reorder collection products. Please verify the product list.",
                    }
                );

            }


            return response.json(
                {
                    status:
                        "success",

                    message:
                        "Collection products reordered successfully.",
                }
            );

        } catch (
            error
        ) {

            console.error(
                "Unable to reorder collection products:",
                error
            );


            return response.status(
                500
            ).json(
                {
                    status:
                        "error",

                    message:
                        "Unable to reorder collection products.",
                }
            );

        }

    };