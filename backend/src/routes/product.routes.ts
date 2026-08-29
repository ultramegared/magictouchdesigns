/**
 * ================================================================
 * Project: Magic Touch Designs
 * Author: ultramegared
 * File: product.routes.ts
 * Module: Product Routes
 * Language: TypeScript
 * Description:
 * API routes for product management.
 * Languages: English (en) | Español (es)
 * ================================================================
 */

import {
    Router,
} from "express";

import {
    authenticateToken,
} from "../middleware/auth.middleware";

import {
    activateProductController,
    createProductController,
    deactivateProductController,
    deleteProductController,
    getProduct,
    getProductBySlugController,
    getProducts,
    getPublicProducts,
    updateProductController,
} from "../controllers/product.controller";


/* ===============================================================
   ROUTER
================================================================ */

const router =
    Router();


/* ===============================================================
   PUBLIC ROUTES
================================================================ */

/**
 * GET
 * /api/products/public
 *
 * Returns all active products.
 */

router.get(
    "/public",

    getPublicProducts
);


/**
 * GET
 * /api/products/slug/:slug
 *
 * Returns one product by slug.
 */

router.get(
    "/slug/:slug",

    getProductBySlugController
);


/* ===============================================================
   AUTHENTICATED ROUTES
================================================================ */

/**
 * GET
 * /api/products
 *
 * Returns all products.
 */

router.get(
    "/",

    authenticateToken,

    getProducts
);


/**
 * GET
 * /api/products/:id
 *
 * Returns one product by ID.
 */

router.get(
    "/:id",

    authenticateToken,

    getProduct
);


/**
 * POST
 * /api/products
 *
 * Creates a new product.
 */

router.post(
    "/",

    authenticateToken,

    createProductController
);


/**
 * PUT
 * /api/products/:id
 *
 * Updates a product.
 */

router.put(
    "/:id",

    authenticateToken,

    updateProductController
);


/**
 * PUT
 * /api/products/:id/activate
 *
 * Activates a product.
 */

router.put(
    "/:id/activate",

    authenticateToken,

    activateProductController
);


/**
 * PUT
 * /api/products/:id/deactivate
 *
 * Deactivates a product.
 */

router.put(
    "/:id/deactivate",

    authenticateToken,

    deactivateProductController
);


/**
 * DELETE
 * /api/products/:id
 *
 * Deletes a product.
 */

router.delete(
    "/:id",

    authenticateToken,

    deleteProductController
);


export default router;