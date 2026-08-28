/**
 * ================================================================
 * Project: Magic Touch Designs
 * Author: ultramegared
 * File: settings.routes.ts
 * Module: Settings
 * Language: TypeScript
 * Description:
 * Routes for global application settings management.
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
    getSettingsController,
    updateSettingsController,
} from "../controllers/settings.controller";


/* ===============================================================
   ROUTER
================================================================ */

const router =
    Router();


/* ===============================================================
   PUBLIC SETTINGS
================================================================ */

/**
 * GET
 * /api/settings
 *
 * Public endpoint.
 *
 * Used by the frontend to retrieve
 * global website configuration.
 */

router.get(
    "/",
    getSettingsController
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
   ADMIN SETTINGS
================================================================ */

/**
 * PUT
 * /api/settings
 *
 * Protected administrator endpoint.
 */

router.put(
    "/",
    updateSettingsController
);


export default router;