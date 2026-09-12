/**
 * Magic Touch Designs - Upload Controller
 */

import type { Request, Response } from "express";

import {
    uploadImageAsset,
} from "../services/upload.service";

import type {
    UploadFolder,
} from "../services/upload.service";


type UploadRequest = Request & {
    uploadFolder?: UploadFolder;
};


export const upload = async (
    req: UploadRequest,
    res: Response
): Promise<void> => {

    try {
        const file = req.file;

        if (!file) {
            res.status(400).json({
                status: "error",
                message: "Image file is required.",
            });
            return;
        }

        const asset = await uploadImageAsset(
            file.buffer,
            req.uploadFolder ?? "reviews"
        );

        res.status(200).json({
            status: "success",
            message: "Image uploaded successfully.",
            image_url: asset.imageUrl,
            public_id: asset.publicId,
        });

    } catch (error) {
        console.error("Error uploading image:", error);

        res.status(500).json({
            status: "error",
            message: "Unable to upload image.",
        });
    }
};
