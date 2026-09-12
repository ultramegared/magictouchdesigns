/**
 * ================================================================
 * Project: Magic Touch Designs
 * Author: ultramegared
 * File: auth.routes.ts
 * Module: Authentication Routes
 * Language: TypeScript
 * Description:
 * Authentication and password recovery API routes.
 * ================================================================
 */

import { Router } from "express";
import { register, login, requestPasswordReset, resetPassword } from "../controllers/auth.controller";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", requestPasswordReset);
router.post("/reset-password", resetPassword);

export default router;
