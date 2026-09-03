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
} from "../controllers/collection.controller";


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
 * to a collection, including inactive products.
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