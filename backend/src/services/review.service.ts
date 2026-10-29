/**
 * Project: Magic Touch Designs
 * Author: ultramegared
 * File: review.service.ts
 * Description: Review business logic and database operations.
 * Languages: English (en) | Español (es)
 */

import { pool } from "../config/database";


/**
 * Reviews table column guard.
 *
 * The reviews table predates the repo's ensure-table pattern
 * (no CREATE TABLE for it exists in code), so this guard only
 * adds the columns newer code depends on, following the same
 * ALTER TABLE ... ADD COLUMN IF NOT EXISTS precedent used by
 * the orders and marketing services.
 */
let reviewTablesInitialized = false;

export const ensureReviewTables = async (): Promise<void> => {

    if (reviewTablesInitialized) return;

    await pool.query(`
        ALTER TABLE reviews ADD COLUMN IF NOT EXISTS rating INTEGER;
    `);

    await pool.query(`
        ALTER TABLE reviews ADD COLUMN IF NOT EXISTS image_urls TEXT;
    `);

    reviewTablesInitialized = true;

};


/**
 * A star rating is valid only as an integer from 1 to 5.
 * NULL means "no rating" (reviews written before ratings
 * existed); it is never a default and never displayed.
 */
export const isValidRating = (
    value: unknown
): value is number => {

    return (
        typeof value === "number" &&
        Number.isInteger(value) &&
        value >= 1 &&
        value <= 5
    );

};


/**
 * A review carries at most 3 purchase photos.
 */
export const MAX_REVIEW_PHOTOS = 3;


/**
 * Parse the stored image_urls JSON string.
 * Falls back to the legacy single image_url so reviews
 * written before multi-photo existed keep displaying.
 */
export const parseReviewPhotoUrls = (
    imageUrls: unknown,
    imageUrl?: unknown
): string[] => {

    if (typeof imageUrls === "string") {

        try {

            const parsed: unknown =
                JSON.parse(imageUrls);

            if (Array.isArray(parsed)) {

                return parsed.filter(
                    (url): url is string =>
                        typeof url === "string" &&
                        url.trim() !== ""
                );

            }

        } catch {

            // Fall through to the legacy single photo.
        }

    }

    if (Array.isArray(imageUrls)) {

        return imageUrls.filter(
            (url): url is string =>
                typeof url === "string" &&
                url.trim() !== ""
        );

    }

    if (
        typeof imageUrl === "string" &&
        imageUrl.trim() !== ""
    ) {

        return [imageUrl];

    }

    return [];

};


/**
 * Validate a caller-supplied photo list and resolve it to
 * the pair stored in the row: the JSON array plus the
 * legacy single image_url, always kept in sync as the
 * first photo (or NULL when there are no photos).
 * Returns null when the caller supplied no photo input
 * at all (meaning "leave photos unchanged" on update).
 * Throws on more than MAX_REVIEW_PHOTOS photos.
 */
export const resolveReviewPhotos = (
    imageUrls: unknown,
    imageUrl?: unknown
): {
    urls: string[];
    first: string | null;
} | null => {

    if (
        imageUrls === undefined &&
        imageUrl === undefined
    ) {

        return null;

    }

    let urls: string[];

    if (imageUrls !== undefined) {

        if (!Array.isArray(imageUrls)) {

            throw new Error(
                "Review photos must be a list of image URLs."
            );

        }

        urls = imageUrls.filter(
            (url): url is string =>
                typeof url === "string" &&
                url.trim() !== ""
        );

    } else if (
        typeof imageUrl === "string" &&
        imageUrl.trim() !== ""
    ) {

        urls = [imageUrl];

    } else {

        urls = [];

    }

    if (urls.length > MAX_REVIEW_PHOTOS) {

        throw new Error(
            `A review can have at most ${MAX_REVIEW_PHOTOS} photos.`
        );

    }

    return {
        urls,
        first: urls[0] ?? null,
    };

};


/**
 * Attach the normalized photo list to a review row.
 * The API always returns image_urls as an array, so the
 * frontend never has to parse the stored JSON string.
 */
const withPhotoUrls = <T extends {
    image_urls?: unknown;
    image_url?: unknown;
}>(row: T): T & { image_urls: string[] } => {

    return {
        ...row,
        image_urls: parseReviewPhotoUrls(
            row.image_urls,
            row.image_url
        ),
    };

};


export interface CreateReviewData {
    user_id: string;
    review: string;
    rating: number;
    image_url?: string | null;
    image_urls?: string[] | null;
    social_platform?: string | null;
    social_url?: string | null;
}


export interface UpdateReviewData {
    review?: string;
    rating?: number | null;
    image_url?: string | null;
    image_urls?: string[] | null;
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
        rating,
        image_url = null,
        image_urls = null,
        social_platform = null,
        social_url = null,
    } = data;


    if (!isValidRating(rating)) {

        throw new Error(
            "A star rating between 1 and 5 is required."
        );

    }


    const photos = resolveReviewPhotos(
        image_urls ?? undefined,
        image_url ?? undefined
    ) ?? { urls: [], first: null };


    await ensureReviewTables();


    const query = `
        INSERT INTO reviews (
            user_id,
            review,
            rating,
            image_url,
            image_urls,
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
            $6,
            $7,
            FALSE
        )
        RETURNING *;
    `;


    const values = [
        user_id,
        review,
        rating,
        photos.first,
        JSON.stringify(photos.urls),
        social_platform,
        social_url,
    ];


    const result = await pool.query(
        query,
        values
    );


    return withPhotoUrls(result.rows[0]);
};


/**
 * Get reviews created by one user.
 */
export const getMyReviews = async (
    userId: string
) => {

    await ensureReviewTables();

    const query = `
        SELECT
            r.*,
            EXISTS (
                SELECT 1
                FROM orders o
                WHERE LOWER(o.customer_email) = LOWER(u.email)
                AND LOWER(o.payment_status) = 'paid'
            ) AS verified_purchase
        FROM reviews r
        LEFT JOIN users u
            ON u.id = r.user_id
        WHERE r.user_id = $1
        ORDER BY r.created_at DESC;
    `;


    const result = await pool.query(
        query,
        [userId]
    );


    return result.rows.map(withPhotoUrls);
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

    await ensureReviewTables();

    const query = `
        SELECT
            r.*,
            u.username,
            u.first_name,
            u.last_name,
            EXISTS (
                SELECT 1
                FROM orders o
                WHERE LOWER(o.customer_email) = LOWER(u.email)
                AND LOWER(o.payment_status) = 'paid'
            ) AS verified_purchase
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


    return result.rows.map(withPhotoUrls);
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


    const row = result.rows[0] || null;

    return row ? withPhotoUrls(row) : null;
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
        rating,
        image_url,
        image_urls,
        social_platform,
        social_url,
    } = data;


    if (
        rating !== undefined &&
        rating !== null &&
        !isValidRating(rating)
    ) {

        throw new Error(
            "A star rating must be an integer between 1 and 5."
        );

    }


    // Photo columns are set explicitly (not COALESCE) so a
    // caller can clear all photos with an empty list.
    const photos =
        image_urls !== undefined || image_url !== undefined
            ? resolveReviewPhotos(
                image_urls,
                image_url
            )
            : null;


    await ensureReviewTables();


    const setClauses: string[] = [
        "review = COALESCE($1, review)",
        "rating = COALESCE($2, rating)",
        "social_platform = COALESCE($3, social_platform)",
        "social_url = COALESCE($4, social_url)",
        "is_approved = FALSE",
        "updated_at = NOW()",
    ];

    const values: unknown[] = [
        review ?? null,
        rating ?? null,
        social_platform ?? null,
        social_url ?? null,
    ];

    if (photos) {

        values.push(photos.first);
        setClauses.push(
            `image_url = $${values.length}`
        );

        values.push(JSON.stringify(photos.urls));
        setClauses.push(
            `image_urls = $${values.length}`
        );

    }

    values.push(reviewId);
    const reviewIdParam = values.length;

    values.push(userId);
    const userIdParam = values.length;


    const query = `
        UPDATE reviews

        SET
            ${setClauses.join(",\n            ")}

        WHERE id = $${reviewIdParam}
        AND user_id = $${userIdParam}

        RETURNING *;
    `;


    const result = await pool.query(
        query,
        values
    );


    const row = result.rows[0] || null;

    return row ? withPhotoUrls(row) : null;
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