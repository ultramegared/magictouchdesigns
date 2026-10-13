/**
 * ================================================================
 * Project: Magic Touch Designs
 * Author: ultramegared
 * File: admin.routes.ts
 * Module: Administrator Routes
 * Language: TypeScript
 * Description:
 * Protected API routes for the administrative panel.
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
    getAdminDashboard,
    getAdminUsers,
    deleteAdminUser,
    getAdminReviews,
    approveReview,
    deleteReview,
} from "../controllers/admin.controller";

import {
    updateAdminUserRole,
} from "../controllers/adminUserRole.controller";

import { sendCustomOrderNotification } from "../services/order.service";


const router = Router();


/*
|--------------------------------------------------------------------------
| Administrator Protection
|--------------------------------------------------------------------------
|
| Every route below requires:
|
| 1. Valid JWT authentication.
| 2. Active administrator account.
|
*/

router.use(
    authenticateToken
);

router.use(
    requireAdmin
);


/*
|--------------------------------------------------------------------------
| Administrator Dashboard
|--------------------------------------------------------------------------
*/

router.get(
    "/dashboard",
    getAdminDashboard
);


/**
 * ================================================================
 * ADMIN USERS
 * ================================================================
 */

router.get(
    "/users",
    getAdminUsers
);


/**
 * UPDATE ADMIN USER ROLE
 */

router.patch(
    "/users/:id/role",
    updateAdminUserRole
);


/**
 * DELETE ADMIN USER
 */

router.delete(
    "/users/:id",
    deleteAdminUser
);


/**
 * Resend the seller production email for a paid order. This route is protected
 * by the administrator authentication middleware above.
 */
router.post("/orders/:orderCode/resend-seller-email", async (req, res): Promise<void> => {
    try {
        await sendCustomOrderNotification(String(req.params.orderCode || ""), { resend: true });
        res.status(200).json({ success: true, message: "Seller order email sent." });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Could not send seller order email.";
        const status = message === "Order not found for seller notification." ? 404 : message === "Seller notification can only be sent for a paid order." ? 409 : 500;
        res.status(status).json({ success: false, message });
    }
});

/**
 * ================================================================
 * ADMIN REVIEWS
 * ================================================================
 */

router.get(
    "/reviews",
    getAdminReviews
);


router.patch(
    "/reviews/:id/approve",
    approveReview
);


router.delete(
    "/reviews/:id",
    deleteReview
);


export default router;
