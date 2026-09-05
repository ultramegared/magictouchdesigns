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

router.post(
    "/",
    subscribe
);

router.get(
    "/admin",
    authenticateToken,
    requireAdmin,
    listSubscribers
);

router.get(
    "/admin/counts",
    authenticateToken,
    requireAdmin,
    subscriberCounts
);

router.patch(
    "/admin/:id/status",
    authenticateToken,
    requireAdmin,
    changeStatus
);

router.patch(
    "/admin/:id/language",
    authenticateToken,
    requireAdmin,
    changeLanguage
);

router.delete(
    "/admin/:id",
    authenticateToken,
    requireAdmin,
    remove
);

/**
 * Administrative promotional email campaign.
 */
router.post(
    "/admin/promotion",
    authenticateToken,
    requireAdmin,
    sendPromotionController
);

export default router;