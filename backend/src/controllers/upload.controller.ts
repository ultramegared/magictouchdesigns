/**
 * ================================================================
 * Project: Magic Touch Designs
 * Author: ultramegared
 * File: upload.controller.ts
 * Module: Upload Controller
 * Language: TypeScript
 * Description:
 * Handles authenticated image upload requests.
 * Languages: English (en) | Español (es)
 * ================================================================
 */

import type {
    Request,
    Response,
} from "express";

import {
    uploadImage,
} from "../services/upload.service";

import type {
    UploadFolder,
} from "../services/upload.service";


/* ===============================================================
   TYPES
================================================================ */

type UploadRequest =
    Request & {

        uploadFolder?:
            UploadFolder;

    };


/* ===============================================================
   UPLOAD IMAGE
================================================================ */

/**
 * Uploads an authenticated image
 * to the selected Cloudinary folder.
 *
 * The folder is assigned by the route,
 * never directly by the client.
 */

export const upload =
    async (
        req:
            UploadRequest,

        res:
            Response
    ): Promise<void> => {

        try {

            const file =
                req.file;


            /* =======================================================
               FILE VALIDATION
            ======================================================== */

            if (!file) {

                res.status(
                    400
                ).json({

                    status:
                        "error",

                    message:
                        "Image file is required.",

                });

                return;

            }


            /* =======================================================
               UPLOAD FOLDER
            ======================================================== */

            const folder =
                req.uploadFolder
                ?? "reviews";


            /* =======================================================
               UPLOAD TO CLOUDINARY
            ======================================================== */

            const imageUrl =
                await uploadImage(
                    file.buffer,
                    folder
                );


            /* =======================================================
               SUCCESS RESPONSE
            ======================================================== */

            res.status(
                200
            ).json({

                status:
                    "success",

                message:
                    "Image uploaded successfully.",

                image_url:
                    imageUrl,

            });

        } catch (
            error
        ) {

            console.error(
                "Error uploading image:",
                error
            );


            /* =======================================================
               ERROR RESPONSE
            ======================================================== */

            res.status(
                500
            ).json({

                status:
                    "error",

                message:
                    "Unable to upload image.",

            });

        }

    };