/**
 * ================================================================
 * Project: Magic Touch Designs
 * Author: ultramegared
 * File: admin.routes.ts
 * Module: Administrator Routes
 * Language: TypeScript
 * Description:
 * Protected API routes for the administrative panel.
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
    getAdminDashboard,
    getAdminReviews,
    approveReview,
} from "../controllers/admin.controller";


const router = Router();


/*
|--------------------------------------------------------------------------
| Administrator Protection
|--------------------------------------------------------------------------
|
| Every route below requires:
|
| 1. Valid JWT authentication.
| 2. Active administrator account.
|
*/

router.use(
    authenticateToken
);

router.use(
    requireAdmin
);


/*
|--------------------------------------------------------------------------
| Administrator Dashboard
|--------------------------------------------------------------------------
*/

router.get(
    "/dashboard",
    getAdminDashboard
);


/**
 * ================================================================
 * ADMIN REVIEWS
 * ================================================================
 */

router.get(
    "/reviews",
    getAdminReviews
);


router.patch(
    "/reviews/:id/approve",
    approveReview
);

export default router;

