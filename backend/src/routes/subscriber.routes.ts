/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: subscriber.routes.ts
 * Module: Subscribers / Newsletter Routes
 * Language: TypeScript
 * Description:
 * Public newsletter subscription route and administrative
 * subscriber management routes.
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
    subscribe,
    listSubscribers,
    subscriberCounts,
    changeStatus,
    changeLanguage,
    remove,
} from "../controllers/subscriber.controller";


import {
    sendPromotionController,
} from "../controllers/promotion.controller";


const router =
    Router();


/**
 * ================================================================
 * PUBLIC NEWSLETTER SUBSCRIPTION
 * ================================================================
 *
 * POST /api/subscribers
 *
 * Used by the public Newsletter component.
 *
 * Receives:
 *
 * {
 *     email: string,
 *     language: "en" | "es"
 * }
 */
router.post(
    "/",
    subscribe
);


/**
 * ================================================================
 * ADMINISTRATIVE ROUTES
 * ================================================================
 *
 * All routes below require:
 *
 * 1. Valid authentication token
 * 2. ADMIN role
 */


/**
 * GET /api/subscribers/admin
 *
 * Returns the complete subscriber list.
 *
 * Supports:
 *
 * ?search=email
 * ?status=active
 * ?status=inactive
 * ?status=all
 */
router.get(
    "/admin",
    authenticateToken,
    requireAdmin,
    listSubscribers
);


/**
 * GET /api/subscribers/admin/counts
 *
 * Returns subscriber statistics for the
 * administrative Subscribers dashboard.
 */
router.get(
    "/admin/counts",
    authenticateToken,
    requireAdmin,
    subscriberCounts
);


/**
 * PATCH /api/subscribers/admin/:id/status
 *
 * Activates or deactivates a subscriber.
 */
router.patch(
    "/admin/:id/status",
    authenticateToken,
    requireAdmin,
    changeStatus
);


/**
 * PATCH /api/subscribers/admin/:id/language
 *
 * Changes the language assigned to a subscriber.
 */
router.patch(
    "/admin/:id/language",
    authenticateToken,
    requireAdmin,
    changeLanguage
);


/**
 * DELETE /api/subscribers/admin/:id
 *
 * Permanently removes a subscriber.
 */
router.delete(
    "/admin/:id",
    authenticateToken,
    requireAdmin,
    remove
);


/**
 * ================================================================
 * ADMINISTRATIVE PROMOTION
 * ================================================================
 *
 * POST /api/subscribers/admin/promotion
 *
 * Sends a promotional email to all active subscribers.
 *
 * The promotion service handles:
 *
 * 1. English recipients
 * 2. Spanish recipients
 * 3. English -> Spanish translation
 * 4. Email delivery through Resend
 *
 * Receives:
 *
 * {
 *     subject: string,
 *     message: string,
 *     imageUrl?: string
 * }
 */
router.post(
    "/admin/promotion",
    authenticateToken,
    requireAdmin,
    sendPromotionController
);


export default router;