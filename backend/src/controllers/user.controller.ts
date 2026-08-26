/**
 * ================================================================
 * Project: Magic Touch Designs
 * Author: ultramegared
 * File: user.controller.ts
 * Module: User Controller
 * Language: TypeScript
 * Description:
 * Controller for authenticated user information.
 * ================================================================
 */

import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";
import { pool } from "../config/database";

/**
 * ================================================================
 * GET CURRENT USER
 * ================================================================
 *
 * Returns the currently authenticated user's profile.
 */
export const getCurrentUser = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    try {

        if (!req.user?.userId) {
            res.status(401).json({
                status: "error",
                message: "Authentication required.",
            });

            return;
        }

        const result = await pool.query(
            `
            SELECT
                id,
                username,
                first_name,
                last_name,
                email,
                is_active,
                created_at,
                updated_at
            FROM users
            WHERE id = $1
            LIMIT 1
            `,
            [req.user.userId]
        );

        if (result.rowCount === 0) {
            res.status(404).json({
                status: "error",
                message: "User not found.",
            });

            return;
        }

        const user = result.rows[0];

        if (!user.is_active) {
            res.status(403).json({
                status: "error",
                message: "This account is inactive.",
            });

            return;
        }

        res.status(200).json({
            status: "ok",
            user,
        });

    } catch (error) {

        console.error(
            "Get current user error:",
            error
        );

        res.status(500).json({
            status: "error",
            message:
                "Unable to retrieve authenticated user.",
        });
    }
};