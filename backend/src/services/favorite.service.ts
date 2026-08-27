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
 * Adds a design to the authenticated
 * user's favorites.
 *
 * If the design is already a favorite,
 * the existing favorite is returned.
 */
export const createFavorite = async (
    userId: string,
    designId: string
): Promise<Favorite> => {

    /*
    |--------------------------------------------------------------------------
    | Normalize Values
    |--------------------------------------------------------------------------
    */

    const normalizedUserId =
        String(
            userId
        ).trim();


    const normalizedDesignId =
        String(
            designId
        ).trim();


    /*
    |--------------------------------------------------------------------------
    | Check Existing Favorite
    |--------------------------------------------------------------------------
    */

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
                normalizedUserId,
                normalizedDesignId,
            ]

        );


    const existingFavorite =
        existingResult.rows[0];


    /*
    |--------------------------------------------------------------------------
    | Already Exists
    |--------------------------------------------------------------------------
    */

    if (existingFavorite) {

        return existingFavorite;

    }


    /*
    |--------------------------------------------------------------------------
    | Create New Favorite
    |--------------------------------------------------------------------------
    */

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
                RETURNING
                    id,
                    user_id,
                    design_id,
                    created_at
            `,

            [
                normalizedUserId,
                normalizedDesignId,
            ]

        );


    const favorite =
        result.rows[0];


    if (!favorite) {

        throw new Error(
            "Unable to create favorite."
        );

    }


    return favorite;

};


/*
|--------------------------------------------------------------------------
| Get User Favorites
|--------------------------------------------------------------------------
*/

/**
 * Gets all favorites belonging
 * to a specific authenticated user.
 */
export const getUserFavorites = async (
    userId: string
): Promise<Favorite[]> => {

    const normalizedUserId =
        String(
            userId
        ).trim();


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
                normalizedUserId,
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
 * Removes a favorite only when it belongs
 * to the authenticated user.
 */
export const removeFavorite = async (
    favoriteId: string,
    userId: string
): Promise<Favorite | null> => {

    const normalizedFavoriteId =
        String(
            favoriteId
        ).trim();


    const normalizedUserId =
        String(
            userId
        ).trim();


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
                normalizedFavoriteId,
                normalizedUserId,
            ]

        );


    const deletedFavorite =
        result.rows[0];


    return deletedFavorite || null;

};