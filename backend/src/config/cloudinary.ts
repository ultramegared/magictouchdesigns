/**
 * ================================================================
 * Project: Magic Touch Designs
 * Author: ultramegared
 * File: cloudinary.ts
 * Module: Cloudinary Configuration
 * Language: TypeScript
 * Description:
 * Configures the Cloudinary service for image uploads.
 * Languages: English (en) | Español (es)
 * ================================================================
 */

import {
    v2 as cloudinary,
} from "cloudinary";


/**
 * ================================================================
 * ENVIRONMENT VARIABLES
 * ================================================================
 */

const cloudName =
    process.env.CLOUDINARY_CLOUD_NAME;


const apiKey =
    process.env.CLOUDINARY_API_KEY;


const apiSecret =
    process.env.CLOUDINARY_API_SECRET;


/**
 * ================================================================
 * CLOUDINARY CONFIGURATION
 * ================================================================
 */

if (
    !cloudName ||
    !apiKey ||
    !apiSecret
) {

    console.error(
        "Cloudinary environment variables are not configured."
    );

} else {

    cloudinary.config({

        cloud_name:
            cloudName,

        api_key:
            apiKey,

        api_secret:
            apiSecret,

    });

}


export default cloudinary;