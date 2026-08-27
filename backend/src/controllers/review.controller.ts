/**
 * ================================================================
 * Project: Magic Touch Designs
 * Author: ultramegared
 * File: review.controller.ts
 * Module: Review Controller
 * Language: TypeScript
 * Description:
 * Handles review requests and API responses.
 * Languages: English (en) | Español (es)
 * ================================================================
 */

import type {
    Request,
    Response,
} from "express";

import {
    createReview,
    getMyReviews,
    getPublicReviews,
    getReviewById,
    updateReview,
    deleteReview,
} from "../services/review.service";


interface AuthenticatedRequest
    extends Request {

    user?: {
        userId: string;
        username: string;
    };

}


/**
 * Create a new review.
 */
export const create = async (
    req: AuthenticatedRequest,
    res: Response
) => {

    try {

        const userId =
            req.user?.userId;


        if (!userId) {

            return res.status(401).json({
                message: "Unauthorized",
            });

        }


        const {
            review,
            image_url,
            social_platform,
            social_url,
        } = req.body;


        if (
            !review ||
            typeof review !== "string"
        ) {

            return res.status(400).json({
                message:
                    "Review text is required.",
            });

        }


        const newReview =
            await createReview({

                user_id: userId,

                review,

                image_url,

                social_platform,

                social_url,

            });


        return res.status(201).json({

            message:
                "Review created successfully.",

            review:
                newReview,

        });

    } catch (error) {

        console.error(
            "Error creating review:",
            error
        );


        return res.status(500).json({

            message:
                "Error creating review.",

        });

    }

};


/**
 * Get authenticated user's reviews.
 */
export const getMine = async (
    req: AuthenticatedRequest,
    res: Response
) => {

    try {

        const userId =
            req.user?.userId;


        if (!userId) {

            return res.status(401).json({
                message: "Unauthorized",
            });

        }


        const reviews =
            await getMyReviews(
                userId
            );


        return res.status(200).json({
            reviews,
        });

    } catch (error) {

        console.error(
            "Error getting user reviews:",
            error
        );


        return res.status(500).json({

            message:
                "Error getting reviews.",

        });

    }

};


/**
 * Get public approved reviews.
 */
export const getPublic = async (
    req: Request,
    res: Response
) => {

    try {

        const requestedLimit =
            Number(
                req.query.limit
            );


        const limit =
            requestedLimit > 0
                ? Math.min(
                    requestedLimit,
                    8
                )
                : 8;


        const reviews =
            await getPublicReviews(
                limit
            );


        return res.status(200).json({
            reviews,
        });

    } catch (error) {

        console.error(
            "Error getting public reviews:",
            error
        );


        return res.status(500).json({

            message:
                "Error getting public reviews.",

        });

    }

};


/**
 * Get one review by ID.
 */
export const getById = async (
    req: Request,
    res: Response
) => {

    try {

        const {
            id,
        } = req.params;


        const review =
            await getReviewById(
                id
            );


        if (!review) {

            return res.status(404).json({

                message:
                    "Review not found.",

            });

        }


        return res.status(200).json({
            review,
        });

    } catch (error) {

        console.error(
            "Error getting review:",
            error
        );


        return res.status(500).json({

            message:
                "Error getting review.",

        });

    }

};


/**
 * Update a review.
 */
export const update = async (
    req: AuthenticatedRequest,
    res: Response
) => {

    try {

        const userId =
            req.user?.userId;


        if (!userId) {

            return res.status(401).json({
                message: "Unauthorized",
            });

        }


        const {
            id,
        } = req.params;


        const {
            review,
            image_url,
            social_platform,
            social_url,
        } = req.body;


        const updatedReview =
            await updateReview(

                id,

                userId,

                {

                    review,

                    image_url,

                    social_platform,

                    social_url,

                }

            );


        if (!updatedReview) {

            return res.status(404).json({

                message:
                    "Review not found or unauthorized.",

            });

        }


        return res.status(200).json({

            message:
                "Review updated successfully.",

            review:
                updatedReview,

        });

    } catch (error) {

        console.error(
            "Error updating review:",
            error
        );


        return res.status(500).json({

            message:
                "Error updating review.",

        });

    }

};


/**
 * Delete a review.
 */
export const remove = async (
    req: AuthenticatedRequest,
    res: Response
) => {

    try {

        const userId =
            req.user?.userId;


        if (!userId) {

            return res.status(401).json({
                message: "Unauthorized",
            });

        }


        const {
            id,
        } = req.params;


        const deletedReview =
            await deleteReview(

                id,

                userId

            );


        if (!deletedReview) {

            return res.status(404).json({

                message:
                    "Review not found or unauthorized.",

            });

        }


        return res.status(200).json({

            message:
                "Review deleted successfully.",

        });

    } catch (error) {

        console.error(
            "Error deleting review:",
            error
        );


        return res.status(500).json({

            message:
                "Error deleting review.",

        });

    }

};