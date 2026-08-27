/**
 * ================================================================
 * Project: Magic Touch Designs
 * Author: ultramegared
 * File: favorite.service.ts
 * Module: Favorite Service
 * Language: TypeScript
 * Description:
 * Handles database operations for user favorites.
 * Languages: English (en) | Español (es)
 * ================================================================
 */

import {
    pool,
} from "../config/database";


/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

export interface Favorite {

    id: string;

    user_id: string;

    design_id: string;

    created_at: Date;

}


/*
|--------------------------------------------------------------------------
| Create Favorite
|--------------------------------------------------------------------------
*/

/**
 * Add a design to a user's favorites.
 */
export const createFavorite = async (
    userId: string,
    designId: string
): Promise<Favorite> => {

    const result =
        await pool.query<Favorite>(

            `
                INSERT INTO favorites (
                    user_id,
                    design_id
                )
                VALUES (
                    $1,
                    $2
                )
                ON CONFLICT (
                    user_id,
                    design_id
                )
                DO NOTHING
                RETURNING
                    id,
                    user_id,
                    design_id,
                    created_at
            `,

            [
                userId,
                designId,
            ]

        );


    /*
     * If the favorite already exists,
     * return the existing favorite.
     */
    if (
        result.rows.length === 0
    ) {

        const existingResult =
            await pool.query<Favorite>(

                `
                    SELECT
                        id,
                        user_id,
                        design_id,
                        created_at
                    FROM favorites
                    WHERE user_id = $1
                    AND design_id = $2
                    LIMIT 1
                `,

                [
                    userId,
                    designId,
                ]

            );


        const existingFavorite =
            existingResult.rows[0];


        if (!existingFavorite) {

            throw new Error(
                "Unable to retrieve existing favorite."
            );

        }


        return existingFavorite;

    }


    return result.rows[0];

};


/*
|--------------------------------------------------------------------------
| Get User Favorites
|--------------------------------------------------------------------------
*/

/**
 * Get all favorites belonging
 * to a specific user.
 */
export const getUserFavorites = async (
    userId: string
): Promise<Favorite[]> => {

    const result =
        await pool.query<Favorite>(

            `
                SELECT
                    id,
                    user_id,
                    design_id,
                    created_at
                FROM favorites
                WHERE user_id = $1
                ORDER BY created_at DESC
            `,

            [
                userId,
            ]

        );


    return result.rows;

};


/*
|--------------------------------------------------------------------------
| Remove Favorite
|--------------------------------------------------------------------------
*/

/**
 * Remove a favorite owned
 * by a specific user.
 */
export const removeFavorite = async (
    favoriteId: string,
    userId: string
): Promise<Favorite | null> => {

    const result =
        await pool.query<Favorite>(

            `
                DELETE FROM favorites
                WHERE id = $1
                AND user_id = $2
                RETURNING
                    id,
                    user_id,
                    design_id,
                    created_at
            `,

            [
                favoriteId,
                userId,
            ]

        );


    if (
        result.rows.length === 0
    ) {

        return null;

    }


    return result.rows[0];

};