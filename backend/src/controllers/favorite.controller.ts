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


interface AuthenticatedRequest
    extends Request {

    user?: {
        userId: string;
        username: string;
    };

}


/*
|--------------------------------------------------------------------------
| Create
|--------------------------------------------------------------------------
*/

/**
 * Add a design to the
 * authenticated user's favorites.
 */
export const create = async (
    req: AuthenticatedRequest,
    res: Response
) => {

    try {

        const userId =
            req.user?.userId;


        const {
            design_id,
        } = req.body;


        if (!userId) {

            return res.status(401).json({

                status: "error",

                message:
                    "Unauthorized",

            });

        }


        if (!design_id) {

            return res.status(400).json({

                status: "error",

                message:
                    "Design ID is required.",

            });

        }


        const favorite =
            await createFavorite(
                userId,
                design_id
            );


        return res.status(201).json({

            status: "success",

            favorite,

        });

    } catch (error) {

        console.error(
            "Error creating favorite:",
            error
        );


        return res.status(500).json({

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

                status: "error",

                message:
                    "Unauthorized",

            });

        }


        const favorites =
            await getUserFavorites(
                userId
            );


        return res.status(200).json({

            status: "success",

            favorites,

        });

    } catch (error) {

        console.error(
            "Error getting favorites:",
            error
        );


        return res.status(500).json({

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
 */
export const remove = async (
    req: AuthenticatedRequest,
    res: Response
) => {

    try {

        const userId =
            req.user?.userId;


        const {
            id,
        } = req.params;


        if (!userId) {

            return res.status(401).json({

                status: "error",

                message:
                    "Unauthorized",

            });

        }


        const deletedFavorite =
            await removeFavorite(
                id,
                userId
            );


        if (!deletedFavorite) {

            return res.status(404).json({

                status: "error",

                message:
                    "Favorite not found.",

            });

        }


        return res.status(200).json({

            status: "success",

            message:
                "Favorite removed successfully.",

        });

    } catch (error) {

        console.error(
            "Error removing favorite:",
            error
        );


        return res.status(500).json({

            status: "error",

            message:
                "Unable to remove favorite.",

        });

    }

};