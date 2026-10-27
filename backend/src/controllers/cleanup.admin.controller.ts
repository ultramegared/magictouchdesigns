/**
 * ================================================================
 * Project: Magic Touch Designs
 * File: cleanup.admin.controller.ts
 * Module: Admin Cleanup Controller
 * Description:
 * Admin-only cleanup endpoints. Every destructive endpoint enforces
 * its safety rule server-side and returns exact counts/ids so the
 * caller can verify the result. These endpoints are mounted behind
 * authenticateToken + requireAdmin (see cleanup.admin.routes.ts).
 *
 * SAFETY (non-negotiable):
 * - Custom requests: only rows still in status 'pending' can be
 *   deleted. 'paid' rows (a payment flipped them to paid) and
 *   'cancelled' rows are reported as skipped, never deleted.
 * - Email logs: only rows older than 90 days, by server-side date
 *   filter. No id selection is accepted.
 * - Cloudinary: only explicit public_ids under
 *   magic-touch-designs/, re-checked against the live reference
 *   set at delete time. Referenced ids are refused.
 * - Paid orders, real customers, real reviews, subscribers and
 *   live-referenced images are never touched by this controller.
 * ================================================================
 */

import { Request, Response } from "express";
import { pool } from "../config/database";
import { ensureCustomMugRequestTable } from "../services/custom-mug.service";
import { ensureEmailLogTable } from "../services/email-log.service";
import {
    STORE_FOLDER_PREFIX,
    buildReferencedPublicIds,
    deleteAndVerifyAsset,
    isCloudinaryConfigured,
    listOrphanAssets,
} from "../services/cleanup.service";

const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const parseIdList = (body: unknown): string[] | null => {
    const raw = (body as { ids?: unknown } | null)?.ids;
    if (!Array.isArray(raw)) return null;
    const ids = raw
        .map((value) => String(value || "").trim())
        .filter(Boolean);
    return [...new Set(ids)];
};

/**
 * GET /api/admin/cleanup/custom-requests
 * Lists pending custom mug requests for the cleanup UI.
 */
export const listPendingCustomRequests = async (
    _req: Request,
    res: Response
): Promise<void> => {
    try {
        await ensureCustomMugRequestTable();
        const result = await pool.query(
            `SELECT id, request_code, name, email, status, created_at
             FROM custom_mug_requests
             WHERE status = 'pending'
             ORDER BY created_at DESC
             LIMIT 500`
        );
        res.json({ requests: result.rows });
    } catch (error) {
        console.error("List pending custom requests error:", error);
        res.status(500).json({ message: "Unable to list pending custom requests." });
    }
};

/**
 * POST /api/admin/cleanup/custom-requests/delete { ids: string[] }
 * Deletes ONLY rows still in status 'pending'. Paid/cancelled rows
 * and unknown ids are reported as skipped, never deleted.
 */
export const deleteCustomRequests = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const ids = parseIdList(req.body);
        if (!ids) {
            res.status(400).json({ message: "Provide an array of request ids." });
            return;
        }
        if (ids.length === 0) {
            res.json({ deleted: 0, deletedCodes: [], skipped: [] });
            return;
        }
        if (ids.length > 1000) {
            res.status(400).json({ message: "You can delete up to 1000 requests at a time." });
            return;
        }
        if (!ids.every((id) => UUID_PATTERN.test(id))) {
            res.status(400).json({ message: "Invalid request selection." });
            return;
        }
        await ensureCustomMugRequestTable();
        const found = await pool.query(
            `SELECT id, request_code, status FROM custom_mug_requests
             WHERE id = ANY($1::uuid[])`,
            [ids]
        );
        const byId = new Map<string, { request_code: string; status: string }>(
            found.rows.map((row) => [row.id, row])
        );
        const deletable = ids.filter((id) => byId.get(id)?.status === "pending");
        const skipped = ids
            .filter((id) => !deletable.includes(id))
            .map((id) => ({
                id,
                reason: byId.has(id)
                    ? `status is '${byId.get(id)?.status}', not pending`
                    : "not found",
            }));
        let deletedCodes: string[] = [];
        if (deletable.length > 0) {
            const deleted = await pool.query(
                `DELETE FROM custom_mug_requests
                 WHERE id = ANY($1::uuid[]) AND status = 'pending'
                 RETURNING request_code`,
                [deletable]
            );
            deletedCodes = deleted.rows.map((row) => row.request_code);
        }
        res.json({
            deleted: deletedCodes.length,
            deletedCodes,
            skipped,
        });
    } catch (error) {
        console.error("Delete custom requests error:", error);
        res.status(500).json({ message: "Unable to delete custom requests." });
    }
};

/**
 * POST /api/admin/cleanup/email-logs/purge-90d
 * Deletes ONLY email_logs older than 90 days (server-side filter).
 */
export const purgeOldEmailLogs = async (
    _req: Request,
    res: Response
): Promise<void> => {
    try {
        await ensureEmailLogTable();
        const result = await pool.query(
            `DELETE FROM email_logs
             WHERE created_at < NOW() - INTERVAL '90 days'
             RETURNING id`
        );
        res.json({ deleted: result.rows.length });
    } catch (error) {
        console.error("Purge old email logs error:", error);
        res.status(500).json({ message: "Unable to purge old email logs." });
    }
};

/**
 * GET /api/admin/cleanup/cloudinary/orphans
 * Lists store Cloudinary assets with no live DB reference.
 * 503 when the backend env lacks the Admin API credentials.
 */
export const listCloudinaryOrphans = async (
    _req: Request,
    res: Response
): Promise<void> => {
    try {
        if (!isCloudinaryConfigured()) {
            res.status(503).json({
                message:
                    "Cloudinary Admin API is not configured on the backend (CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET).",
            });
            return;
        }
        const result = await listOrphanAssets();
        res.json(result);
    } catch (error) {
        console.error("List Cloudinary orphans error:", error);
        res.status(500).json({ message: "Unable to list Cloudinary orphans." });
    }
};

/**
 * POST /api/admin/cleanup/cloudinary/delete { public_ids: string[] }
 * Deletes ONLY explicit public_ids under magic-touch-designs/ that
 * are NOT in the live reference set (re-checked at delete time),
 * then verifies each via the Admin API (404 = verified gone).
 */
export const deleteCloudinaryAssets = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const raw = (req.body as { public_ids?: unknown } | null)?.public_ids;
        if (!Array.isArray(raw)) {
            res.status(400).json({ message: "Provide an array of public_ids." });
            return;
        }
        const publicIds = [...new Set(
            raw.map((value) => String(value || "").trim()).filter(Boolean)
        )];
        if (publicIds.length === 0) {
            res.json({ deleted: [], failed: [], skipped: [] });
            return;
        }
        if (publicIds.length > 1000) {
            res.status(400).json({ message: "You can delete up to 1000 assets at a time." });
            return;
        }
        if (!isCloudinaryConfigured()) {
            res.status(503).json({
                message:
                    "Cloudinary Admin API is not configured on the backend (CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET).",
            });
            return;
        }
        const referenced = await buildReferencedPublicIds();
        const deleted: Array<{
            public_id: string;
            verified: boolean;
            detail: string;
        }> = [];
        const failed: Array<{ public_id: string; detail: string }> = [];
        const skipped: Array<{ public_id: string; reason: string }> = [];
        for (const publicId of publicIds) {
            if (!publicId.startsWith(STORE_FOLDER_PREFIX)) {
                skipped.push({
                    public_id: publicId,
                    reason: "outside the store folders (magic-touch-designs/)",
                });
                continue;
            }
            if (referenced.has(publicId)) {
                skipped.push({
                    public_id: publicId,
                    reason: "still referenced by live content",
                });
                continue;
            }
            const result = await deleteAndVerifyAsset(publicId);
            if (result.destroyed) {
                deleted.push({
                    public_id: publicId,
                    verified: result.verifiedGone,
                    detail: result.detail,
                });
            } else {
                failed.push({ public_id: publicId, detail: result.detail });
            }
        }
        res.json({ deleted, failed, skipped });
    } catch (error) {
        console.error("Delete Cloudinary assets error:", error);
        res.status(500).json({ message: "Unable to delete Cloudinary assets." });
    }
};
