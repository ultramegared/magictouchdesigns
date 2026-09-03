/**
 * ================================================================
 * Project: Magic Touch Designs
 * Author: ultramegared
 * File: collection.routes.ts
 * Module: Collection Routes
 * Language: TypeScript
 * Description:
 * Collection API routes.
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
    getCollectionProducts,

    getCollectionProductsForAdmin,

    getCollectionProductForAdmin,

    updateCollectionProduct,

    updateCollectionProductStatus,

    updateCollectionProductOrder,

} from "../controllers/collection.controller";


/* ===============================================================
   ROUTER
================================================================ */

const router =
    Router();


/* ===============================================================
   ADMINISTRATOR ROUTES
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

router.get(
    "/admin/:slug/products",

    authenticateToken,

    requireAdmin,

    getCollectionProductsForAdmin
);


/**
 * GET
 * /api/collections/admin/:slug/products/:product_id
 *
 * Returns one product belonging
 * to a specific collection.
 *
 * Administrator only.
 */

router.get(
    "/admin/:slug/products/:product_id",

    authenticateToken,

    requireAdmin,

    getCollectionProductForAdmin
);


/**
 * PUT
 * /api/collections/admin/:slug/products/:product_id
 *
 * Updates product information
 * from the Collections
 * administration panel.
 *
 * Administrator only.
 */

router.put(
    "/admin/:slug/products/:product_id",

    authenticateToken,

    requireAdmin,

    updateCollectionProduct
);


/**
 * PUT
 * /api/collections/admin/:slug/products/:product_id/status
 *
 * Activates or deactivates
 * a product from the
 * Collections administrator.
 *
 * Administrator only.
 */

router.put(
    "/admin/:slug/products/:product_id/status",

    authenticateToken,

    requireAdmin,

    updateCollectionProductStatus
);


/**
 * PUT
 * /api/collections/admin/:slug/products/:product_id/order
 *
 * Changes the display order
 * of a product inside
 * a collection.
 *
 * Administrator only.
 */

router.put(
    "/admin/:slug/products/:product_id/order",

    authenticateToken,

    requireAdmin,

    updateCollectionProductOrder
);


/* ===============================================================
   PUBLIC ROUTES
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

router.get(
    "/:slug/products",

    getCollectionProducts
);


export default router;