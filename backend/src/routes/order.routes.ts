/**
 * ================================================================
 * Project: Magic Touch Designs
 * File: order.routes.ts
 * Module: Orders / Payments
 * ================================================================
 */

import { Router } from "express";
import {
    createCheckout,
    getOrder,
} from "../controllers/order.controller";

const router = Router();

router.post("/checkout", createCheckout);
router.get("/:code", getOrder);

export default router;
