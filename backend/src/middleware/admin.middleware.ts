/**
 * ================================================================
 * Project: Magic Touch Designs
 * Author: ultramegared
 * File: admin.middleware.ts
 * Module: Authorization Middleware
 * Language: TypeScript
 * Description:
 * Middleware for administrator-only API routes.
 * ================================================================
 */

import type {
    Response,
    NextFunction,
} from "express";

import type {
    AuthenticatedRequest,
} from "./auth.middleware";

import {
    pool,
} from "../config/database";


/**
 * ================================================================
 * REQUIRE ADMIN
 * ================================================================
 *
 * Allows access only to authenticated users
 * with the ADMIN role.
 */
export const requireAdmin = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {

    try {

        if (!req.user?.userId) {

            res.status(401).json({
                status: "error",
                message:
                    "Authentication required.",
            });

            return;
        }


        const result = await pool.query(
            `
            SELECT
                role,
                is_active
            FROM users
            WHERE id = $1
            LIMIT 1
            `,
            [req.user.userId]
        );


        if (result.rowCount === 0) {

            res.status(404).json({
                status: "error",
                message:
                    "User not found.",
            });

            return;
        }


        const user = result.rows[0];


        if (!user.is_active) {

            res.status(403).json({
                status: "error",
                message:
                    "This account is inactive.",
            });

            return;
        }


        if (user.role !== "ADMIN") {

            res.status(403).json({
                status: "error",
                message:
                    "Administrator access required.",
            });

            return;
        }


        next();

    } catch (error) {

        console.error(
            "Administrator authorization error:",
            error
        );


        res.status(500).json({
            status: "error",
            message:
                "Unable to verify administrator access.",
        });
    }
};