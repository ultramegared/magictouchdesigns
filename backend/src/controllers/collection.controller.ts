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
    getProductsByCollectionSlug,

    getCollectionProductsForAdmin as
        getCollectionProductsForAdminService,

    getCollectionProductForAdmin as
        getCollectionProductForAdminService,

    updateCollectionProduct as
        updateCollectionProductService,

    setCollectionProductStatus as
        setCollectionProductStatusService,

    updateCollectionProductOrder as
        updateCollectionProductOrderService,

} from "../services/collection.service";


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
            } = request.params;


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
            } = request.params;


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
            } = request.params;


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
            } = request.params;


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
            } = request.params;


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
 * Updates the display order
 * of a product inside
 * a collection.
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
            } = request.params;


            const {
                sort_order,
            } =
                request.body;


            if (
                typeof sort_order !==
                "number"

                ||

                !Number.isFinite(
                    sort_order
                )
            ) {

                return response.status(
                    400
                ).json(
                    {
                        status:
                            "error",

                        message:
                            "sort_order must be a valid number.",
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