/**
 * ================================================================
 * Project: Magic Touch Designs
 * Author: ultramegared
 * File: upload.routes.ts
 * Module: Upload Routes
 * Language: TypeScript
 * Description:
 * API routes for authenticated image uploads.
 * Languages: English (en) | Español (es)
 * ================================================================
 */

import {
    Router,
} from "express";

import multer from
    "multer";

import type {
    Request,
    Response,
    NextFunction,
} from "express";

import {
    authenticateToken,
} from "../middleware/auth.middleware";

import {
    upload,
} from "../controllers/upload.controller";


const router = Router();


/**
 * ================================================================
 * MULTER CONFIGURATION
 * ================================================================
 *
 * Images are temporarily stored in memory
 * before being uploaded to Cloudinary.
 *
 */

const storage =
    multer.memoryStorage();


const uploadMiddleware =
    multer({

        storage,

        limits: {

            fileSize:
                5 * 1024 * 1024,

        },

        fileFilter:
            (
                _req,
                file,
                callback
            ) => {

                const allowedMimeTypes = [

                    "image/jpeg",
                    "image/png",
                    "image/webp",

                ];


                if (
                    allowedMimeTypes.includes(
                        file.mimetype
                    )
                ) {

                    callback(
                        null,
                        true
                    );

                    return;

                }


                callback(
                    new Error(
                        "Only JPG, PNG and WEBP images are allowed."
                    )
                );

            },

    });


/**
 * ================================================================
 * IMAGE UPLOAD
 * ================================================================
 *
 * POST /api/upload
 *
 * Requires authentication.
 *
 * Maximum image size: 5 MB.
 *
 */

router.post(
    "/",

    authenticateToken,

    (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {

        uploadMiddleware.single(
            "image"
        )(
            req,
            res,
            (
                error
            ) => {

                if (error) {

                    if (
                        error instanceof
                        multer.MulterError
                    ) {

                        if (
                            error.code ===
                            "LIMIT_FILE_SIZE"
                        ) {

                            res.status(400).json({

                                status:
                                    "error",

                                message:
                                    "Image size cannot exceed 5 MB.",

                            });

                            return;

                        }

                    }


                    res.status(400).json({

                        status:
                            "error",

                        message:
                            error.message ||
                            "Invalid image upload.",

                    });

                    return;

                }


                next();

            }
        );

    },

    upload
);


export default router;