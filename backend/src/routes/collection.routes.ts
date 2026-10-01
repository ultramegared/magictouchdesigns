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
    getCollectionForAdmin,

    updateCollection,

    getCollectionProducts,

    getCollectionProductsForAdmin,

    getAvailableProductsForCollection,

    addProductToCollection,

    removeProductFromCollection,

    getCollectionProductForAdmin,

    updateCollectionProduct,

    updateCollectionProductStatus,

    updateCollectionProductOrder,

    reorderCollectionProducts,

} from "../controllers/collection.controller";


/* ===============================================================
   ROUTER
================================================================ */

const router =
    Router();


/* ===============================================================
   ADMINISTRATOR ROUTES
================================================================ */


/* ===============================================================
   GET COLLECTION INFORMATION
================================================================ */

/**
 * GET
 * /api/collections/admin/:slug
 *
 * Returns collection information.
 *
 * Administrator only.
 */

router.get(
    "/admin/:slug",

    authenticateToken,

    requireAdmin,

    getCollectionForAdmin
);


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

router.put(
    "/admin/:slug",

    authenticateToken,

    requireAdmin,

    updateCollection
);


/* ===============================================================
   GET COLLECTION PRODUCTS
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


/* ===============================================================
   GET AVAILABLE PRODUCTS
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

router.get(
    "/admin/:slug/available-products",

    authenticateToken,

    requireAdmin,

    getAvailableProductsForCollection
);


/* ===============================================================
   ADD OR CREATE PRODUCT IN COLLECTION
================================================================ */

/**
 * POST
 * /api/collections/admin/:slug/products
 *
 * Supports two modes:
 *
 * 1. Adds an existing product
 *    to the collection.
 *
 * 2. Creates a new product
 *    and adds it directly
 *    to the collection.
 *
 * Administrator only.
 */

router.post(
    "/admin/:slug/products",

    authenticateToken,

    requireAdmin,

    addProductToCollection
);


/* ===============================================================
   REORDER ALL COLLECTION PRODUCTS
================================================================ */

/**
 * PUT
 * /api/collections/admin/:slug/products/reorder
 *
 * Reorders all products
 * inside a collection.
 *
 * Administrator only.
 *
 * IMPORTANT:
 * This route must be before
 * /products/:product_id.
 */

router.put(
    "/admin/:slug/products/reorder",

    authenticateToken,

    requireAdmin,

    reorderCollectionProducts
);


/* ===============================================================
   GET ONE COLLECTION PRODUCT
================================================================ */

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


/* ===============================================================
   UPDATE COLLECTION PRODUCT
================================================================ */

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


/* ===============================================================
   REMOVE PRODUCT FROM COLLECTION
================================================================ */

/**
 * DELETE
 * /api/collections/admin/:slug/products/:product_id
 *
 * Removes the product from
 * the collection without
 * deleting the product itself.
 *
 * Administrator only.
 */

router.delete(
    "/admin/:slug/products/:product_id",

    authenticateToken,

    requireAdmin,

    removeProductFromCollection
);


/* ===============================================================
   UPDATE PRODUCT STATUS
================================================================ */

/**
 * PUT
 * /api/collections/admin/:slug/products/:product_id/status
 *
 * Activates or deactivates
 * a product.
 *
 * Administrator only.
 */

router.put(
    "/admin/:slug/products/:product_id/status",

    authenticateToken,

    requireAdmin,

    updateCollectionProductStatus
);


/* ===============================================================
   UPDATE ONE PRODUCT ORDER
================================================================ */

/**
 * PUT
 * /api/collections/admin/:slug/products/:product_id/order
 *
 * Changes the display position
 * of one product and
 * automatically reorganizes
 * the remaining products.
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