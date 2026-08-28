/**
 * Project: Magic Touch Designs
 * Author: ultramegared
 * File: review.service.ts
 * Description: Review business logic and database operations.
 * Languages: English (en) | Español (es)
 */

import { pool } from "../config/database";


export interface CreateReviewData {
    user_id: string;
    review: string;
    image_url?: string | null;
    social_platform?: string | null;
    social_url?: string | null;
}


export interface UpdateReviewData {
    review?: string;
    image_url?: string | null;
    social_platform?: string | null;
    social_url?: string | null;
}


/**
 * Create a new review.
 */
export const createReview = async (
    data: CreateReviewData
) => {

    const {
        user_id,
        review,
        image_url = null,
        social_platform = null,
        social_url = null,
    } = data;


    const query = `
        INSERT INTO reviews (
            user_id,
            review,
            image_url,
            social_platform,
            social_url,
            is_approved
        )
        VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            FALSE
        )
        RETURNING *;
    `;


    const values = [
        user_id,
        review,
        image_url,
        social_platform,
        social_url,
    ];


    const result = await pool.query(
        query,
        values
    );


    return result.rows[0];
};


/**
 * Get reviews created by one user.
 */
export const getMyReviews = async (
    userId: string
) => {

    const query = `
        SELECT
            r.*
        FROM reviews r
        WHERE r.user_id = $1
        ORDER BY r.created_at DESC;
    `;


    const result = await pool.query(
        query,
        [userId]
    );


    return result.rows;
};


/**
 * Get public approved reviews with images.
 *
 * Only reviews that:
 *
 * 1. Have been approved by an administrator.
 * 2. Have a valid image URL.
 *
 * are returned for public display.
 */
export const getPublicReviews = async (
    limit: number = 8
) => {

    const query = `
        SELECT
            r.*,
            u.username,
            u.first_name,
            u.last_name
        FROM reviews r

        INNER JOIN users u
            ON u.id = r.user_id

        WHERE
            r.is_approved = TRUE

            AND r.image_url IS NOT NULL

            AND TRIM(r.image_url) <> ''

        ORDER BY r.created_at DESC

        LIMIT $1;
    `;


    const result = await pool.query(
        query,
        [limit]
    );


    return result.rows;
};


/**
 * Get one review by ID.
 */
export const getReviewById = async (
    reviewId: string
) => {

    const query = `
        SELECT
            *
        FROM reviews
        WHERE id = $1;
    `;


    const result = await pool.query(
        query,
        [reviewId]
    );


    return result.rows[0] || null;
};


/**
 * Update a review.
 */
export const updateReview = async (
    reviewId: string,
    userId: string,
    data: UpdateReviewData
) => {

    const {
        review,
        image_url,
        social_platform,
        social_url,
    } = data;


    const query = `
        UPDATE reviews

        SET
            review = COALESCE(
                $1,
                review
            ),

            image_url = COALESCE(
                $2,
                image_url
            ),

            social_platform = COALESCE(
                $3,
                social_platform
            ),

            social_url = COALESCE(
                $4,
                social_url
            ),

            is_approved = FALSE,

            updated_at = NOW()

        WHERE id = $5
        AND user_id = $6

        RETURNING *;
    `;


    const values = [
        review ?? null,
        image_url ?? null,
        social_platform ?? null,
        social_url ?? null,
        reviewId,
        userId,
    ];


    const result = await pool.query(
        query,
        values
    );


    return result.rows[0] || null;
};


/**
 * Delete a review.
 */
export const deleteReview = async (
    reviewId: string,
    userId: string
) => {

    const query = `
        DELETE FROM reviews

        WHERE id = $1
        AND user_id = $2

        RETURNING id;
    `;


    const result = await pool.query(
        query,
        [
            reviewId,
            userId,
        ]
    );


    return result.rows[0] || null;
};


/**
 * Approve a review for public display.
 */
export const approveReview = async (
    reviewId: string
) => {

    const query = `
        UPDATE reviews

        SET
            is_approved = TRUE,
            updated_at = NOW()

        WHERE id = $1

        RETURNING *;
    `;


    const result = await pool.query(
        query,
        [reviewId]
    );


    return result.rows[0] || null;
};