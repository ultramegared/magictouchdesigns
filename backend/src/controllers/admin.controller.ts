/**
 * ================================================================
 * Project: Magic Touch Designs
 * Author: ultramegared
 * File: admin.controller.ts
 * Module: Administrator Controller
 * Language: TypeScript
 * Description:
 * Controller for administrative dashboard information.
 * ================================================================
 */

import type {
    Request,
    Response,
} from "express";

import {
    pool,
} from "../config/database";


/**
 * ================================================================
 * GET ADMIN DASHBOARD
 * ================================================================
 *
 * Returns general administrative statistics.
 */
export const getAdminDashboard = async (
    _req: Request,
    res: Response
): Promise<void> => {

    try {

        const usersResult =
            await pool.query(
                `
                SELECT
                    COUNT(*) FILTER (
                        WHERE role = 'USER'
                    ) AS total_users,

                    COUNT(*) FILTER (
                        WHERE role = 'ADMIN'
                    ) AS total_admins,

                    COUNT(*) AS total_accounts

                FROM users
                `
            );


        const reviewsResult =
            await pool.query(
                `
                SELECT
                    COUNT(*) AS total_reviews,

                    COUNT(*) FILTER (
                        WHERE is_approved = FALSE
                    ) AS pending_reviews,

                    COUNT(*) FILTER (
                        WHERE is_approved = TRUE
                    ) AS approved_reviews

                FROM reviews
                `
            );


        const users =
            usersResult.rows[0];


        const reviews =
            reviewsResult.rows[0];


        res.status(200).json({

            status:
                "ok",

            message:
                "Administrator dashboard data retrieved successfully.",

            data: {

                users: {

                    total_accounts:
                        Number(
                            users.total_accounts
                        ),

                    total_users:
                        Number(
                            users.total_users
                        ),

                    total_admins:
                        Number(
                            users.total_admins
                        ),

                },


                reviews: {

                    total_reviews:
                        Number(
                            reviews.total_reviews
                        ),

                    pending_reviews:
                        Number(
                            reviews.pending_reviews
                        ),

                    approved_reviews:
                        Number(
                            reviews.approved_reviews
                        ),

                },


                sales: {

                    total_sales:
                        0,

                    total_orders:
                        0,

                },

            },

        });

    } catch (error) {

        console.error(
            "Get administrator dashboard error:",
            error
        );


        res.status(500).json({

            status:
                "error",

            message:
                "Unable to retrieve administrator dashboard data.",

        });

    }

};

/**
 * ================================================================
 * GET ADMIN REVIEWS
 * ================================================================
 *
 * Returns all reviews for administrative management.
 */
export const getAdminReviews = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        const status =
            typeof req.query.status === "string"
                ? req.query.status
                : "all";


        let statusCondition = "";


        if (status === "pending") {

            statusCondition = `
                WHERE r.is_approved = FALSE
            `;

        }


        if (status === "approved") {

            statusCondition = `
                WHERE r.is_approved = TRUE
            `;

        }


        const result =
            await pool.query(
                `
                SELECT
                    r.id,
                    r.user_id,
                    r.review,
                    r.image_url,
                    r.social_platform,
                    r.social_url,
                    r.is_approved,
                    r.created_at,
                    r.updated_at,

                    u.username,
                    u.first_name,
                    u.last_name,
                    u.email

                FROM reviews r

                INNER JOIN users u
                    ON u.id = r.user_id

                ${statusCondition}

                ORDER BY
                    r.created_at DESC
                `
            );


        res.status(200).json({

            status:
                "ok",

            reviews:
                result.rows,

        });

    } catch (error) {

        console.error(
            "Get administrator reviews error:",
            error
        );


        res.status(500).json({

            status:
                "error",

            message:
                "Unable to retrieve reviews.",

        });

    }

};


/**
 * ================================================================
 * APPROVE REVIEW
 * ================================================================
 *
 * Approves a user review.
 */
export const approveReview = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        const {
            id,
        } = req.params;


        const result =
            await pool.query(
                `
                UPDATE reviews

                SET
                    is_approved = TRUE,

                    updated_at = NOW()

                WHERE id = $1

                RETURNING *;
                `,
                [id]
            );


        if (
            result.rowCount === 0
        ) {

            res.status(404).json({

                status:
                    "error",

                message:
                    "Review not found.",

            });

            return;

        }


        res.status(200).json({

            status:
                "ok",

            message:
                "Review approved successfully.",

            review:
                result.rows[0],

        });

    } catch (error) {

        console.error(
            "Approve review error:",
            error
        );


        res.status(500).json({

            status:
                "error",

            message:
                "Unable to approve review.",

        });

    }

};

