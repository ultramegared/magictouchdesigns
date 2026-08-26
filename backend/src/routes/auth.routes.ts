/**
 * ================================================================
 * Project: Magic Touch Designs
 * Author: ultramegared
 * File: auth.routes.ts
 * Module: Authentication Routes
 * Language: TypeScript
 * Description:
 * Authentication API routes.
 * ================================================================
 */

import { Router } from "express";
import { register } from "../controllers/auth.controller";

const router = Router();

/**
 * POST /api/auth/register
 *
 * Creates a new user account.
 */
router.post("/register", register);

export default router;