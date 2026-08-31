/**
 * ================================================================
 * Project: Magic Touch Designs
 * Author: ultramegared
 * File: product.controller.ts
 * Module: Product Controller
 * Language: TypeScript
 * Description:
 * Handles product API requests.
 * Languages: English (en) | Español (es)
 * ================================================================
 */

import type {
    Request,
    Response,
} from "express";

import {
    activateProduct,
    createProduct,
    deactivateProduct,
    deleteProduct,
    getActiveProducts,
    getAllProducts,
    getProductById,
    getProductBySlug,
    updateProduct,
} from "../services/product.service";


/* ===============================================================
   GET ALL PRODUCTS
================================================================ */

export const getProducts =
    async (
        _req: Request,
        res: Response
    ): Promise<void> => {

        try {

            const products =
                await getAllProducts();


            res.status(
                200
            ).json({

                status:
                    "success",

                products,

            });

        } catch (
            error
        ) {

            console.error(
                "Unable to get products:",
                error
            );


            res.status(
                500
            ).json({

                status:
                    "error",

                message:
                    "Unable to get products.",

            });

        }

    };


/* ===============================================================
   GET ACTIVE PRODUCTS
================================================================ */

export const getPublicProducts =
    async (
        _req: Request,
        res: Response
    ): Promise<void> => {

        try {

            const products =
                await getActiveProducts();


            res.status(
                200
            ).json({

                status:
                    "success",

                products,

            });

        } catch (
            error
        ) {

            console.error(
                "Unable to get active products:",
                error
            );


            res.status(
                500
            ).json({

                status:
                    "error",

                message:
                    "Unable to get products.",

            });

        }

    };


/* ===============================================================
   GET PRODUCT BY ID
================================================================ */

export const getProduct =
    async (
        req: Request,
        res: Response
    ): Promise<void> => {

        try {

            const {
                product_id,
            } = req.params;


            const product =
                await getProductById(
                    product_id
                );


            if (!product) {

                res.status(
                    404
                ).json({

                    status:
                        "error",

                    message:
                        "Product not found.",

                });

                return;

            }


            res.status(
                200
            ).json({

                status:
                    "success",

                product,

            });

        } catch (
            error
        ) {

            console.error(
                "Unable to get product:",
                error
            );


            res.status(
                500
            ).json({

                status:
                    "error",

                message:
                    "Unable to get product.",

            });

        }

    };


/* ===============================================================
   GET PRODUCT BY SLUG
================================================================ */

export const getProductBySlugController =
    async (
        req: Request,
        res: Response
    ): Promise<void> => {

        try {

            const {
                slug,
            } = req.params;


            const product =
                await getProductBySlug(
                    slug
                );


            if (!product) {

                res.status(
                    404
                ).json({

                    status:
                        "error",

                    message:
                        "Product not found.",

                });

                return;

            }


            res.status(
                200
            ).json({

                status:
                    "success",

                product,

            });

        } catch (
            error
        ) {

            console.error(
                "Unable to get product:",
                error
            );


            res.status(
                500
            ).json({

                status:
                    "error",

                    message:
                        "Unable to get product.",

            });

        }

    };


/* ===============================================================
   CREATE PRODUCT
================================================================ */

export const createProductController =
    async (
        req: Request,
        res: Response
    ): Promise<void> => {

        try {

            const {

                name,

                slug,

                description,

                price,

                image_url,

                is_active,

                sort_order,

                features,

            } = req.body;


            /*
            --------------------------------------------------------
            REQUIRED FIELD VALIDATION
            --------------------------------------------------------
            */

            if (
                !name ||
                !slug ||
                price === undefined
            ) {

                res.status(
                    400
                ).json({

                    status:
                        "error",

                    message:
                        "Name, slug and price are required.",

                });

                return;

            }


            /*
            --------------------------------------------------------
            PRICE VALIDATION
            --------------------------------------------------------
            */

            const numericPrice =
                Number(
                    price
                );


            if (
                Number.isNaN(
                    numericPrice
                ) ||
                numericPrice < 0
            ) {

                res.status(
                    400
                ).json({

                    status:
                        "error",

                    message:
                        "Price must be a valid positive number.",

                });

                return;

            }


            /*
            --------------------------------------------------------
            FEATURES VALIDATION
            --------------------------------------------------------
            */

            if (
                features !== undefined &&
                features !== null &&
                typeof features !== "object"
            ) {

                res.status(
                    400
                ).json({

                    status:
                        "error",

                    message:
                        "Features must be a valid JSON object or array.",

                });

                return;

            }


            /*
            --------------------------------------------------------
            CREATE PRODUCT
            --------------------------------------------------------
            */

            const product =
                await createProduct({

                    name:
                        String(
                            name
                        ).trim(),

                    slug:
                        String(
                            slug
                        )
                            .trim()
                            .toLowerCase(),

                    description:
                        description
                        ?? null,

                    price:
                        numericPrice,

                    image_url:
                        image_url
                        ?? null,

                    is_active,

                    sort_order,

                    features:
                        features
                        ?? {},

                });


            res.status(
                201
            ).json({

                status:
                    "success",

                message:
                    "Product created successfully.",

                product,

            });

        } catch (
            error
        ) {

            console.error(
                "Unable to create product:",
                error
            );


            res.status(
                500
            ).json({

                status:
                    "error",

                message:
                    "Unable to create product.",

            });

        }

    };


/* ===============================================================
   UPDATE PRODUCT
================================================================ */

export const updateProductController =
    async (
        req: Request,
        res: Response
    ): Promise<void> => {

        try {

            const {
                product_id,
            } = req.params;


            const existingProduct =
                await getProductById(
                    product_id
                );


            if (!existingProduct) {

                res.status(
                    404
                ).json({

                    status:
                        "error",

                    message:
                        "Product not found.",

                });

                return;

            }


            const {

                name,

                slug,

                description,

                price,

                image_url,

                is_active,

                sort_order,

                features,

            } = req.body;


            /*
            --------------------------------------------------------
            PRICE VALIDATION
            --------------------------------------------------------
            */

            if (
                price !== undefined
            ) {

                const numericPrice =
                    Number(
                        price
                    );


                if (
                    Number.isNaN(
                        numericPrice
                    ) ||
                    numericPrice < 0
                ) {

                    res.status(
                        400
                    ).json({

                        status:
                            "error",

                        message:
                            "Price must be a valid positive number.",

                    });

                    return;

                }

            }


            /*
            --------------------------------------------------------
            FEATURES VALIDATION
            --------------------------------------------------------
            */

            if (
                features !== undefined &&
                features !== null &&
                typeof features !== "object"
            ) {

                res.status(
                    400
                ).json({

                    status:
                        "error",

                    message:
                        "Features must be a valid JSON object or array.",

                });

                return;

            }


            /*
            --------------------------------------------------------
            UPDATE PRODUCT
            --------------------------------------------------------
            */

            const product =
                await updateProduct(

                    product_id,

                    {

                        name:
                            name !== undefined

                                ? String(
                                    name
                                ).trim()

                                : undefined,

                        slug:
                            slug !== undefined

                                ? String(
                                    slug
                                )
                                    .trim()
                                    .toLowerCase()

                                : undefined,

                        description,

                        price:
                            price !== undefined

                                ? Number(
                                    price
                                )

                                : undefined,

                        image_url,

                        is_active,

                        sort_order,

                        features,

                    }

                );


            res.status(
                200
            ).json({

                status:
                    "success",

                message:
                    "Product updated successfully.",

                product,

            });

        } catch (
            error
        ) {

            console.error(
                "Unable to update product:",
                error
            );


            res.status(
                500
            ).json({

                status:
                    "error",

                message:
                    "Unable to update product.",

            });

        }

    };


/* ===============================================================
   DELETE PRODUCT
================================================================ */

export const deleteProductController =
    async (
        req: Request,
        res: Response
    ): Promise<void> => {

        try {

            const {
                product_id,
            } = req.params;


            const product =
                await deleteProduct(
                    product_id
                );


            if (!product) {

                res.status(
                    404
                ).json({

                    status:
                        "error",

                    message:
                        "Product not found.",

                });

                return;

            }


            res.status(
                200
            ).json({

                status:
                    "success",

                message:
                    "Product deleted successfully.",

            });

        } catch (
            error
        ) {

            console.error(
                "Unable to delete product:",
                error
            );


            res.status(
                500
            ).json({

                status:
                    "error",

                    message:
                        "Unable to delete product.",

            });

        }

    };


/* ===============================================================
   ACTIVATE PRODUCT
================================================================ */

export const activateProductController =
    async (
        req: Request,
        res: Response
    ): Promise<void> => {

        try {

            const {
                product_id,
            } = req.params;


            const product =
                await activateProduct(
                    product_id
                );


            if (!product) {

                res.status(
                    404
                ).json({

                    status:
                        "error",

                    message:
                        "Product not found.",

                });

                return;

            }


            res.status(
                200
            ).json({

                status:
                    "success",

                message:
                    "Product activated successfully.",

                product,

            });

        } catch (
            error
        ) {

            console.error(
                "Unable to activate product:",
                error
            );


            res.status(
                500
            ).json({

                status:
                    "error",

                message:
                    "Unable to activate product.",

            });

        }

    };


/* ===============================================================
   DEACTIVATE PRODUCT
================================================================ */

export const deactivateProductController =
    async (
        req: Request,
        res: Response
    ): Promise<void> => {

        try {

            const {
                product_id,
            } = req.params;


            const product =
                await deactivateProduct(
                    product_id
                );


            if (!product) {

                res.status(
                    404
                ).json({

                    status:
                        "error",

                    message:
                        "Product not found.",

                });

                return;

            }


            res.status(
                200
            ).json({

                status:
                    "success",

                message:
                    "Product deactivated successfully.",

                product,

            });

        } catch (
            error
        ) {

            console.error(
                "Unable to deactivate product:",
                error
            );


            res.status(
                500
            ).json({

                status:
                    "error",

                message:
                    "Unable to deactivate product.",

            });

        }

    };