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

/**
 * Every route below requires:
 *
 * 1. Valid JWT authentication.
 * 2. Active administrator account.
 */

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
 * /api/products/:id
 *
 * Returns one product by ID.
 */

router.get(
    "/:id",

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

    deactivateProductController
);


/**
 * DELETE
 * /api/products/:id
 *
 * Deletes a product permanently.
 */

router.delete(
    "/:id",

    deleteProductController
);


export default router;