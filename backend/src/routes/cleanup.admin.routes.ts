/**
 * Magic Touch Designs - Admin Cleanup Routes
 * Mounted at /api/admin/cleanup. Same admin gate as the other admin
 * routes: authenticateToken + requireAdmin on every route.
 */

import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware";
import { requireAdmin } from "../middleware/admin.middleware";
import {
    deleteCloudinaryAssets,
    deleteCustomRequests,
    listCloudinaryOrphans,
    listPendingCustomRequests,
    purgeOldEmailLogs,
} from "../controllers/cleanup.admin.controller";

const router = Router();

router.use(authenticateToken);
router.use(requireAdmin);

router.get("/custom-requests", listPendingCustomRequests);
router.post("/custom-requests/delete", deleteCustomRequests);
router.post("/email-logs/purge-90d", purgeOldEmailLogs);
router.get("/cloudinary/orphans", listCloudinaryOrphans);
router.post("/cloudinary/delete", deleteCloudinaryAssets);

export default router;
