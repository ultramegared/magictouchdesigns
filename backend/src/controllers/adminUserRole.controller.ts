/**
 * ================================================================
 * Project: Magic Touch Designs
 * File: adminUserRole.controller.ts
 * Module: Administrator User Management
 * Language: TypeScript
 * Description:
 * Allows an authenticated administrator to explicitly authorize or
 * revoke administrator access for an existing user account.
 * ================================================================
 */

import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";
import { pool } from "../config/database";

export const updateAdminUserRole = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        const currentUserId = req.user?.userId;

        if (!currentUserId) {
            res.status(401).json({
                status: "error",
                message: "Authentication required.",
            });
            return;
        }

        if (role !== "USER" && role !== "ADMIN") {
            res.status(400).json({
                status: "error",
                message: "Invalid account role.",
            });
            return;
        }

        if (id === currentUserId) {
            res.status(400).json({
                status: "error",
                message: "You cannot change your own administrator role.",
            });
            return;
        }

        const result = await pool.query(
            `
            UPDATE users
            SET
                role = $1,
                updated_at = NOW()
            WHERE id = $2
            RETURNING
                id,
                username,
                first_name,
                last_name,
                email,
                role,
                is_active,
                created_at,
                updated_at
            `,
            [role, id]
        );

        if (result.rowCount === 0) {
            res.status(404).json({
                status: "error",
                message: "User not found.",
            });
            return;
        }

        res.status(200).json({
            status: "ok",
            message:
                role === "ADMIN"
                    ? "User authorized as administrator successfully."
                    : "Administrator access revoked successfully.",
            user: result.rows[0],
        });
    } catch (error) {
        console.error("Update administrator user role error:", error);

        res.status(500).json({
            status: "error",
            message: "Unable to update user role.",
        });
    }
};
