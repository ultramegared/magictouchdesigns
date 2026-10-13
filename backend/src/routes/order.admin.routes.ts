/**
 * Magic Touch Designs - Admin Order Routes
 */

import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware";
import { requireAdmin } from "../middleware/admin.middleware";
import {
    listAdminOrders,
    updateAdminOrder,
    deleteAdminOrder,
    purgeUnpaidOrders,
    refundAdminOrder,
    sendAdminOrderInvoice,
    resendAdminSellerOrderEmail,
} from "../controllers/order.admin.controller";

const router = Router();

router.use(authenticateToken);
router.use(requireAdmin);

router.get("/", listAdminOrders);
router.post("/purge-unpaid", purgeUnpaidOrders);
router.post("/:id/refund", refundAdminOrder);
router.post("/:id/invoice", sendAdminOrderInvoice);
router.post("/:id/resend-seller-email", resendAdminSellerOrderEmail);
router.patch("/:id", updateAdminOrder);
router.delete("/:id", deleteAdminOrder);

export default router;
