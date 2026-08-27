/**
 * ================================================================
 * Project: Magic Touch Designs
 * Author: ultramegared
 * File: favorite.routes.ts
 * Module: Favorite Routes
 * Language: TypeScript
 * Description:
 * Favorite API routes configuration.
 * Languages: English (en) | Español (es)
 * ================================================================
 */

import { Router } from "express";

import {
    create,
    getMine,
    remove,
} from "../controllers/favorite.controller";

import {
    authenticateToken,
} from "../middleware/auth.middleware";


const router = Router();


/*
|--------------------------------------------------------------------------
| Protected routes
|--------------------------------------------------------------------------
*/

/**
 * Add a design to
 * the authenticated user's favorites.
 *
 * POST /api/favorites
 */
router.post(
    "/",
    authenticateToken,
    create
);


/**
 * Get all favorites created by
 * the authenticated user.
 *
 * GET /api/favorites/my-favorites
 */
router.get(
    "/my-favorites",
    authenticateToken,
    getMine
);


/**
 * Remove a favorite owned by
 * the authenticated user.
 *
 * DELETE /api/favorites/:id
 */
router.delete(
    "/:id",
    authenticateToken,
    remove
);


export default router;