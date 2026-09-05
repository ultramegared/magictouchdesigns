/**
 * ================================================================
 * Project: Magic Touch Designs
 * Author: ultramegared
 * File: upload.service.ts
 * Module: Upload Service
 * Language: TypeScript
 * Description:
 * Handles image uploads to Cloudinary.
 * Languages: English (en) | Español (es)
 * ================================================================
 */

import {
    Readable,
} from "stream";

import cloudinary from
    "../config/cloudinary";


/* ===============================================================
   TYPES
================================================================ */

export type UploadFolder =
    | "logos"
    | "reviews"
    | "products"
    | "customizations"
    | "promotions";


/* ===============================================================
   UPLOAD IMAGE
================================================================ */

/**
 * Uploads an image buffer to Cloudinary.
 *
 * The destination folder can be selected
 * according to the type of image.
 *
 * Returns the secure public image URL.
 */

export const uploadImage =
    async (
        fileBuffer: Buffer,

        folder:
            UploadFolder = "reviews"
    ): Promise<string> => {

        return new Promise(
            (
                resolve,
                reject
            ) => {

                const uploadStream =
                    cloudinary.uploader.upload_stream(

                        {

                            folder:
                                `magic-touch-designs/${folder}`,

                            resource_type:
                                "image",

                            allowed_formats: [

                                "jpg",

                                "jpeg",

                                "png",

                                "webp",

                            ],

                        },

                        (
                            error,
                            result
                        ) => {

                            if (
                                error ||
                                !result
                            ) {

                                reject(
                                    error ||
                                    new Error(
                                        "Unable to upload image."
                                    )
                                );

                                return;

                            }


                            if (
                                !result.secure_url
                            ) {

                                reject(
                                    new Error(
                                        "Cloudinary did not return an image URL."
                                    )
                                );

                                return;

                            }


                            resolve(
                                result.secure_url
                            );

                        }

                    );


                const readableStream =
                    Readable.from(
                        fileBuffer
                    );


                readableStream.pipe(
                    uploadStream
                );

            }
        );

    };