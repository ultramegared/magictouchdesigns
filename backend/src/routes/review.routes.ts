/**
 * ================================================================
 * Project: Magic Touch Designs
 * Author: ultramegared
 * File: review.routes.ts
 * Module: Review Routes
 * Language: TypeScript
 * Description:
 * Review API routes configuration.
 * Languages: English (en) | Español (es)
 * ================================================================
 */

import { Router } from "express";

import {
    create,
    getMine,
    getPublic,
    getById,
    update,
    remove,
} from "../controllers/review.controller";

import {
    authenticateToken,
} from "../middleware/auth.middleware";


const router = Router();


/*
|--------------------------------------------------------------------------
| Public routes
|--------------------------------------------------------------------------
*/

/**
 * Get the latest approved public reviews.
 *
 * Example:
 * GET /api/reviews/public?limit=4
 */
router.get(
    "/public",
    getPublic
);


/*
|--------------------------------------------------------------------------
| Protected routes
|--------------------------------------------------------------------------
*/

/**
 * Create a review.
 */
router.post(
    "/",
    authenticateToken,
    create
);


/**
 * Get reviews created by
 * the authenticated user.
 */
router.get(
    "/my-reviews",
    authenticateToken,
    getMine
);


/**
 * Update a review owned
 * by the authenticated user.
 */
router.put(
    "/:id",
    authenticateToken,
    update
);


/**
 * Delete a review owned
 * by the authenticated user.
 */
router.delete(
    "/:id",
    authenticateToken,
    remove
);


/*
|--------------------------------------------------------------------------
| Dynamic routes
|--------------------------------------------------------------------------
*/

/**
 * Get one review by ID.
 *
 * IMPORTANT:
 * This route must remain after
 * all specific GET routes.
 */
router.get(
    "/:id",
    getById
);


export default router;