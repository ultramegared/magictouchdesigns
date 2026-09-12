/**
 * Magic Touch Designs - Portfolio Controller
 */

import type { Request, Response } from "express";
import {
    getActivePortfolio,
    getAllPortfolio,
    createPortfolio,
    updatePortfolio,
    deletePortfolio,
} from "../services/portfolio.service";

export const listActivePortfolio = async (
    _req: Request,
    res: Response
) => {
    try {
        res.json({
            status: "success",
            portfolio: await getActivePortfolio(),
        });
    } catch (error) {
        console.error("Portfolio public list error:", error);
        res.status(500).json({ status: "error", message: "Unable to load portfolio." });
    }
};

export const listPortfolio = async (
    _req: Request,
    res: Response
) => {
    try {
        res.json({
            status: "success",
            portfolio: await getAllPortfolio(),
        });
    } catch (error) {
        console.error("Portfolio admin list error:", error);
        res.status(500).json({ status: "error", message: "Unable to load portfolio." });
    }
};

export const createPortfolioItem = async (
    req: Request,
    res: Response
) => {
    try {
        const {
            image_url,
            public_id,
            title,
            description,
            characteristics,
            is_active,
            sort_order,
        } = req.body;

        if (!image_url || !public_id || !title) {
            res.status(400).json({
                status: "error",
                message: "Image, Cloudinary public ID and title are required.",
            });
            return;
        }

        const item = await createPortfolio({
            imageUrl: String(image_url),
            publicId: String(public_id),
            title: String(title),
            description: description == null ? null : String(description),
            characteristics: characteristics == null ? null : String(characteristics),
            isActive: is_active !== false,
            sortOrder: Number.isFinite(Number(sort_order)) ? Number(sort_order) : 0,
        });

        res.status(201).json({ status: "success", portfolio: item });
    } catch (error) {
        console.error("Portfolio create error:", error);
        res.status(500).json({ status: "error", message: "Unable to create portfolio item." });
    }
};

export const updatePortfolioItem = async (
    req: Request,
    res: Response
) => {
    try {
        const {
            image_url,
            public_id,
            title,
            description,
            characteristics,
            is_active,
            sort_order,
        } = req.body;

        const item = await updatePortfolio(req.params.id, {
            imageUrl: image_url == null ? undefined : String(image_url),
            publicId: public_id == null ? undefined : String(public_id),
            title: title == null ? undefined : String(title),
            description: description === undefined ? undefined : (description == null ? null : String(description)),
            characteristics: characteristics === undefined ? undefined : (characteristics == null ? null : String(characteristics)),
            isActive: is_active === undefined ? undefined : Boolean(is_active),
            sortOrder: sort_order === undefined ? undefined : Number(sort_order),
        });

        if (!item) {
            res.status(404).json({ status: "error", message: "Portfolio item not found." });
            return;
        }

        res.json({ status: "success", portfolio: item });
    } catch (error) {
        console.error("Portfolio update error:", error);
        res.status(500).json({ status: "error", message: "Unable to update portfolio item." });
    }
};

export const removePortfolioItem = async (
    req: Request,
    res: Response
) => {
    try {
        const deleted = await deletePortfolio(req.params.id);

        if (!deleted) {
            res.status(404).json({ status: "error", message: "Portfolio item not found." });
            return;
        }

        res.json({ status: "success", message: "Portfolio item permanently deleted." });
    } catch (error) {
        console.error("Portfolio delete error:", error);
        res.status(500).json({
            status: "error",
            message: "Portfolio image could not be deleted. The item was not removed from the database.",
        });
    }
};
