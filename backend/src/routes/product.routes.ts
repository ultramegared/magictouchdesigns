/**
 * ================================================================
 * Project: Magic Touch Designs
 * Author: ultramegared
 * File: product.routes.ts
 * Module: Product Routes
 * Language: TypeScript
 * Description:
 * API routes for independent product management.
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
    requireAdmin,
} from "../middleware/admin.middleware";

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
   ADMINISTRATOR PROTECTION
================================================================ */

router.use(
    authenticateToken
);


router.use(
    requireAdmin
);


/* ===============================================================
   ADMINISTRATOR ROUTES
================================================================ */

/**
 * GET
 * /api/products
 *
 * Returns all products.
 */

router.get(
    "/",

    getProducts
);


/**
 * GET
 * /api/products/:product_id
 *
 * Returns one product by product_id.
 */

router.get(
    "/:product_id",

    getProduct
);


/**
 * POST
 * /api/products
 *
 * Creates a new independent product.
 */

router.post(
    "/",

    createProductController
);


/**
 * PUT
 * /api/products/:product_id
 *
 * Updates a product.
 */

router.put(
    "/:product_id",

    updateProductController
);


/**
 * PUT
 * /api/products/:product_id/activate
 *
 * Activates a product.
 */

router.put(
    "/:product_id/activate",

    activateProductController
);


/**
 * PUT
 * /api/products/:product_id/deactivate
 *
 * Deactivates a product.
 */

router.put(
    "/:product_id/deactivate",

    deactivateProductController
);


/**
 * DELETE
 * /api/products/:product_id
 *
 * Deletes a product permanently.
 */

router.delete(
    "/:product_id",

    deleteProductController
);


export default router;