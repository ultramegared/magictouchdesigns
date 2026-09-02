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
    getCollectionProducts,
} from "../controllers/collection.controller";


const router =
    Router();


/* ===============================================================
   GET PRODUCTS BY COLLECTION SLUG
================================================================ */

router.get(
    "/:slug/products",
    getCollectionProducts
);


export default router;