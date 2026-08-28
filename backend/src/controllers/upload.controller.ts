/**
 * ================================================================
 * Project: Magic Touch Designs
 * Author: ultramegared
 * File: upload.controller.ts
 * Module: Upload Controller
 * Language: TypeScript
 * Description:
 * Handles image upload requests.
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


/**
 * ================================================================
 * UPLOAD IMAGE
 * ================================================================
 *
 * Receives an image from the authenticated client
 * and uploads it to Cloudinary.
 *
 */

export const upload =
    async (
        req: Request,
        res: Response
    ): Promise<void> => {

        try {

            const file =
                req.file;


            /*
            |--------------------------------------------------------------------------
            | FILE VALIDATION
            |--------------------------------------------------------------------------
            */

            if (!file) {

                res.status(400).json({

                    status:
                        "error",

                    message:
                        "Image file is required.",

                });

                return;

            }


            /*
            |--------------------------------------------------------------------------
            | UPLOAD TO CLOUDINARY
            |--------------------------------------------------------------------------
            */

            const imageUrl =
                await uploadImage(
                    file.buffer
                );


            /*
            |--------------------------------------------------------------------------
            | SUCCESS RESPONSE
            |--------------------------------------------------------------------------
            */

            res.status(200).json({

                status:
                    "ok",

                message:
                    "Image uploaded successfully.",

                image_url:
                    imageUrl,

            });

        } catch (error) {

            console.error(
                "Error uploading image:",
                error
            );


            /*
            |--------------------------------------------------------------------------
            | ERROR RESPONSE
            |--------------------------------------------------------------------------
            */

            res.status(500).json({

                status:
                    "error",

                message:
                    "Unable to upload image.",

            });

        }

    };