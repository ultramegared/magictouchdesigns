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

import { Readable } from "stream";
import cloudinary from "../config/cloudinary";

export type UploadFolder =
    | "logos"
    | "reviews"
    | "products"
    | "customizations"
    | "promotions"
    | "portfolio"
    | "hero";

export interface UploadedImageAsset {
    imageUrl: string;
    publicId: string;
}

export const uploadImageAsset = async (
    fileBuffer: Buffer,
    folder: UploadFolder = "reviews"
): Promise<UploadedImageAsset> => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: `magic-touch-designs/${folder}`,
                resource_type: "image",
                allowed_formats: ["jpg", "jpeg", "png", "webp"],
            },
            (error, result) => {
                if (error || !result) {
                    reject(error || new Error("Unable to upload image."));
                    return;
                }
                if (!result.secure_url || !result.public_id) {
                    reject(new Error("Cloudinary did not return the required image metadata."));
                    return;
                }
                resolve({ imageUrl: result.secure_url, publicId: result.public_id });
            }
        );
        Readable.from(fileBuffer).pipe(uploadStream);
    });
};

export const uploadImage = async (
    fileBuffer: Buffer,
    folder: UploadFolder = "reviews"
): Promise<string> => {
    const asset = await uploadImageAsset(fileBuffer, folder);
    return asset.imageUrl;
};

export const deleteImage = async (publicId: string): Promise<void> => {
    const normalizedPublicId = publicId.trim();
    if (!normalizedPublicId) return;
    const result = await cloudinary.uploader.destroy(normalizedPublicId, {
        resource_type: "image",
        invalidate: true,
    });
    if (result.result !== "ok" && result.result !== "not found") {
        throw new Error(`Cloudinary could not delete image: ${result.result}`);
    }
};
