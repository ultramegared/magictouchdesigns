/**
 * Magic Touch Designs - Portfolio Routes
 */

import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware";
import { requireAdmin } from "../middleware/admin.middleware";
import {
    listActivePortfolio,
    listPortfolio,
    createPortfolioItem,
    updatePortfolioItem,
    removePortfolioItem,
} from "../controllers/portfolio.controller";

const router = Router();

router.get("/", listActivePortfolio);

router.get(
    "/admin",
    authenticateToken,
    requireAdmin,
    listPortfolio
);

router.post(
    "/",
    authenticateToken,
    requireAdmin,
    createPortfolioItem
);

router.put(
    "/:id",
    authenticateToken,
    requireAdmin,
    updatePortfolioItem
);

router.delete(
    "/:id",
    authenticateToken,
    requireAdmin,
    removePortfolioItem
);

export default router;
