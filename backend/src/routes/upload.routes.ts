/**
 * Magic Touch Designs - Upload Routes
 */

import { Router } from "express";
import multer from "multer";
import type { Request, Response, NextFunction } from "express";
import { authenticateToken } from "../middleware/auth.middleware";
import { upload } from "../controllers/upload.controller";
import type { UploadFolder } from "../services/upload.service";

const router = Router();
type UploadRequest = Request & { uploadFolder?: UploadFolder };

const uploadMiddleware = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, callback) => {
        if (["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
            callback(null, true);
            return;
        }
        callback(new Error("Only JPG, PNG and WEBP images are allowed."));
    },
});

const processImageUpload = (req: Request, res: Response, next: NextFunction) => {
    uploadMiddleware.single("image")(req, res, error => {
        if (!error) {
            next();
            return;
        }
        if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
            res.status(400).json({ status: "error", message: "Image size cannot exceed 5 MB." });
            return;
        }
        res.status(400).json({ status: "error", message: error.message || "Invalid image upload." });
    });
};

const assignUploadFolder = (folder: UploadFolder) => (
    req: UploadRequest,
    _res: Response,
    next: NextFunction
) => {
    req.uploadFolder = folder;
    next();
};

router.post("/logo", authenticateToken, processImageUpload, assignUploadFolder("logos"), upload);
router.post("/review", authenticateToken, processImageUpload, assignUploadFolder("reviews"), upload);
router.post("/product", authenticateToken, processImageUpload, assignUploadFolder("products"), upload);
router.post("/customization", authenticateToken, processImageUpload, assignUploadFolder("customizations"), upload);
router.post("/promotion", authenticateToken, processImageUpload, assignUploadFolder("promotions"), upload);
router.post("/portfolio", authenticateToken, processImageUpload, assignUploadFolder("portfolio"), upload);
router.post("/hero", authenticateToken, processImageUpload, assignUploadFolder("hero"), upload);

export default router;
