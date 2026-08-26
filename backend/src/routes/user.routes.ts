/**
 * ================================================================
 * Project: Magic Touch Designs
 * Author: ultramegared
 * File: user.routes.ts
 * Module: User Routes
 * Language: TypeScript
 * Description:
 * Routes for authenticated user information.
 * ================================================================
 */

import { Router } from "express";
import { getCurrentUser } from "../controllers/user.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

/**
 * GET /api/user/me
 *
 * Returns the currently authenticated user.
 */
router.get(
    "/me",
    authenticateToken,
    getCurrentUser
);

export default router;