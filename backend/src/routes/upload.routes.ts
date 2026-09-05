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

import type {
    UploadFolder,
} from "../services/upload.service";


/* ===============================================================
   ROUTER
================================================================ */

const router =
    Router();


/* ===============================================================
   TYPES
================================================================ */

type UploadRequest =
    Request & {

        uploadFolder?:
            UploadFolder;

    };


/* ===============================================================
   MULTER CONFIGURATION
================================================================ */

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


/* ===============================================================
   UPLOAD MIDDLEWARE
================================================================ */

/**
 * Processes the incoming image
 * and handles Multer errors.
 */

const processImageUpload =
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

                if (!error) {

                    next();

                    return;

                }


                if (
                    error instanceof
                    multer.MulterError
                ) {

                    if (
                        error.code ===
                        "LIMIT_FILE_SIZE"
                    ) {

                        res.status(
                            400
                        ).json({

                            status:
                                "error",

                            message:
                                "Image size cannot exceed 5 MB.",

                        });

                        return;

                    }

                }


                res.status(
                    400
                ).json({

                    status:
                        "error",

                    message:
                        error.message ||
                        "Invalid image upload.",

                });

            }
        );

    };


/* ===============================================================
   UPLOAD FOLDER MIDDLEWARE
================================================================ */

/**
 * Assigns the Cloudinary destination folder
 * internally on the server.
 *
 * The client cannot choose the destination.
 */

const assignUploadFolder =
    (
        folder:
            UploadFolder
    ) => {

        return (
            req: UploadRequest,
            _res: Response,
            next: NextFunction
        ) => {

            req.uploadFolder =
                folder;


            next();

        };

    };


/* ===============================================================
   LOGO UPLOAD
================================================================ */

/**
 * POST
 * /api/upload/logo
 *
 * Requires authentication.
 *
 * Cloudinary folder:
 * magic-touch-designs/logos
 */

router.post(
    "/logo",

    authenticateToken,

    processImageUpload,

    assignUploadFolder(
        "logos"
    ),

    upload
);


/* ===============================================================
   REVIEW UPLOAD
================================================================ */

/**
 * POST
 * /api/upload/review
 *
 * Requires authentication.
 *
 * Cloudinary folder:
 * magic-touch-designs/reviews
 */

router.post(
    "/review",

    authenticateToken,

    processImageUpload,

    assignUploadFolder(
        "reviews"
    ),

    upload
);


/* ===============================================================
   PRODUCT UPLOAD
================================================================ */

/**
 * POST
 * /api/upload/product
 *
 * Requires authentication.
 *
 * Cloudinary folder:
 * magic-touch-designs/products
 */

router.post(
    "/product",

    authenticateToken,

    processImageUpload,

    assignUploadFolder(
        "products"
    ),

    upload
);


/* ===============================================================
   CUSTOMIZATION UPLOAD
================================================================ */

/**
 * POST
 * /api/upload/customization
 *
 * Requires authentication.
 *
 * Cloudinary folder:
 * magic-touch-designs/customizations
 */

router.post(
    "/customization",

    authenticateToken,

    processImageUpload,

    assignUploadFolder(
        "customizations"
    ),

    upload
);


/* ===============================================================
   PROMOTION UPLOAD
================================================================ */

/**
 * POST
 * /api/upload/promotion
 *
 * Requires authentication.
 *
 * Cloudinary folder:
 * magic-touch-designs/promotions
 */

router.post(
    "/promotion",

    authenticateToken,

    processImageUpload,

    assignUploadFolder(
        "promotions"
    ),

    upload
);


export default router;