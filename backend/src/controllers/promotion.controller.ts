/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: promotion.controller.ts
 * Module: Promotion Controller
 * Language: TypeScript
 * Description:
 * Handles administrative promotional email campaigns.
 * ================================================================
 */

import {
    Request,
    Response,
    NextFunction,
} from "express";

import {
    sendPromotion,
} from "../services/promotion.service";

/*
|--------------------------------------------------------------------------
| Send Promotion
|--------------------------------------------------------------------------
*/

export const sendPromotionController =
    async (
        req:
            Request,

        res:
            Response,

        next:
            NextFunction
    ): Promise<void> => {

        try {

            const {
                subject,
                message,
                imageUrl,
            } =
                req.body;

            if (
                typeof subject !== "string"
                || !subject.trim()
            ) {

                res.status(400).json({
                    status:
                        "error",

                    message:
                        "Promotion subject is required.",
                });

                return;
            }

            if (
                typeof message !== "string"
                || !message.trim()
            ) {

                res.status(400).json({
                    status:
                        "error",

                    message:
                        "Promotion message is required.",
                });

                return;
            }

            if (
                imageUrl !== undefined
                && typeof imageUrl !== "string"
            ) {

                res.status(400).json({
                    status:
                        "error",

                    message:
                        "Promotion image URL must be a string.",
                });

                return;
            }

            const result =
                await sendPromotion({
                    subject:
                        subject.trim(),

                    message:
                        message.trim(),

                    imageUrl:
                        typeof imageUrl === "string"
                            ? imageUrl.trim()
                            : undefined,
                });

            res.status(200).json({
                status:
                    "success",

                message:
                    "Promotion sent successfully.",

                data:
                    result,
            });

        } catch (
            error
        ) {

            next(
                error
            );

        }

    };