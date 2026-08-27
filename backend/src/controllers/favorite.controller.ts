/**
 * ================================================================
 * Project: Magic Touch Designs
 * Author: ultramegared
 * File: favorite.controller.ts
 * Module: Favorite Controller
 * Language: TypeScript
 * Description:
 * Handles favorite API requests.
 * Languages: English (en) | Español (es)
 * ================================================================
 */

import type {
    Request,
    Response,
} from "express";

import {
    createFavorite,
    getUserFavorites,
    removeFavorite,
} from "../services/favorite.service";


/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

interface AuthenticatedRequest
    extends Request {

    user?: {
        userId: string;
        username: string;
    };

}


interface CreateFavoriteBody {

    design_id?: string | number;

}


/*
|--------------------------------------------------------------------------
| Create
|--------------------------------------------------------------------------
*/

/**
 * Add a design to the
 * authenticated user's favorites.
 *
 * POST /api/favorites
 */
export const create = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {

    try {

        const userId =
            req.user?.userId;


        const {
            design_id,
        } = req.body as CreateFavoriteBody;


        /*
        |--------------------------------------------------------------------------
        | Authentication
        |--------------------------------------------------------------------------
        */

        if (!userId) {

            res.status(401).json({

                status: "error",

                message:
                    "Unauthorized",

            });

            return;

        }


        /*
        |--------------------------------------------------------------------------
        | Validation
        |--------------------------------------------------------------------------
        */

        if (
            design_id === undefined ||
            design_id === null ||
            String(design_id).trim() === ""
        ) {

            res.status(400).json({

                status: "error",

                message:
                    "Design ID is required.",

            });

            return;

        }


        /*
        |--------------------------------------------------------------------------
        | Normalize Design ID
        |--------------------------------------------------------------------------
        */

        const normalizedDesignId =
            String(
                design_id
            ).trim();


        /*
        |--------------------------------------------------------------------------
        | Create Favorite
        |--------------------------------------------------------------------------
        */

        const favorite =
            await createFavorite(

                userId,

                normalizedDesignId

            );


        res.status(201).json({

            status: "success",

            favorite,

        });

    } catch (error) {

        console.error(
            "Error creating favorite:",
            error
        );


        res.status(500).json({

            status: "error",

            message:
                "Unable to add favorite.",

        });

    }

};


/*
|--------------------------------------------------------------------------
| Get Mine
|--------------------------------------------------------------------------
*/

/**
 * Get all favorites created by
 * the authenticated user.
 *
 * GET /api/favorites/my-favorites
 */
export const getMine = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {

    try {

        const userId =
            req.user?.userId;


        /*
        |--------------------------------------------------------------------------
        | Authentication
        |--------------------------------------------------------------------------
        */

        if (!userId) {

            res.status(401).json({

                status: "error",

                message:
                    "Unauthorized",

            });

            return;

        }


        /*
        |--------------------------------------------------------------------------
        | Get Favorites
        |--------------------------------------------------------------------------
        */

        const favorites =
            await getUserFavorites(
                userId
            );


        res.status(200).json({

            status: "success",

            favorites:
                favorites || [],

        });

    } catch (error) {

        console.error(
            "Error getting favorites:",
            error
        );


        res.status(500).json({

            status: "error",

            message:
                "Unable to get favorites.",

        });

    }

};


/*
|--------------------------------------------------------------------------
| Remove
|--------------------------------------------------------------------------
*/

/**
 * Remove a favorite owned by
 * the authenticated user.
 *
 * DELETE /api/favorites/:id
 */
export const remove = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {

    try {

        const userId =
            req.user?.userId;


        const {
            id,
        } = req.params;


        /*
        |--------------------------------------------------------------------------
        | Authentication
        |--------------------------------------------------------------------------
        */

        if (!userId) {

            res.status(401).json({

                status: "error",

                message:
                    "Unauthorized",

            });

            return;

        }


        /*
        |--------------------------------------------------------------------------
        | Validation
        |--------------------------------------------------------------------------
        */

        if (
            !id ||
            id.trim() === ""
        ) {

            res.status(400).json({

                status: "error",

                message:
                    "Favorite ID is required.",

            });

            return;

        }


        /*
        |--------------------------------------------------------------------------
        | Remove Favorite
        |--------------------------------------------------------------------------
        */

        const deletedFavorite =
            await removeFavorite(

                id,

                userId

            );


        if (!deletedFavorite) {

            res.status(404).json({

                status: "error",

                message:
                    "Favorite not found.",

            });

            return;

        }


        res.status(200).json({

            status: "success",

            message:
                "Favorite removed successfully.",

            favorite:
                deletedFavorite,

        });

    } catch (error) {

        console.error(
            "Error removing favorite:",
            error
        );


        res.status(500).json({

            status: "error",

            message:
                "Unable to remove favorite.",

        });

    }

};