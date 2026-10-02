import { Router } from "express";
import multer from "multer";
import { authenticateToken } from "../middleware/auth.middleware";
import { marketingCampaignHistory, marketingPublicationActivity, marketingCampaignLaunch, marketingLearning, marketingLearningFeedback, marketingAutopilotRun, marketingAutopilotRunNow, marketingDailySummary, marketingDailySummaryCron, marketingCatalogStatus, marketingCatalogToggle, marketingMediaUpload, socialAuthorize, socialCallback, socialConnect, socialVerify, socialConnections, socialDisconnect, socialPublish } from "../controllers/social-connections.admin.controller";

const router = Router();

// OAuth callbacks are intentionally public; the signed state binds them to the authenticated admin session that started the flow.
router.get("/:provider/callback", socialCallback);
router.get("/campaign/autopilot-run", marketingAutopilotRun);
router.get("/campaign/daily-summary-cron", marketingDailySummaryCron);
router.use(authenticateToken);
router.get("/", socialConnections);
router.get("/:provider/authorize", socialAuthorize);
router.get("/:provider/connect", socialConnect);
router.get("/:provider/verify", socialVerify);
router.delete("/:provider", socialDisconnect);
const marketingMediaMiddleware = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, callback) => {
        if (file.mimetype.startsWith("image/")) {
            callback(null, true);
            return;
        }
        callback(new Error("Only image files are allowed for Marketing creative uploads."));
    },
});

const processMarketingMediaUpload = (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => {
    marketingMediaMiddleware.single("image")(req, res, error => {
        if (!error) {
            next();
            return;
        }
        if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
            res.status(400).json({ status: "error", message: "Marketing image size cannot exceed 10 MB." });
            return;
        }
        res.status(400).json({ status: "error", message: error.message || "Invalid Marketing image upload." });
    });
};

router.post("/publish", socialPublish);
router.post("/campaign/media", processMarketingMediaUpload, marketingMediaUpload);
router.post("/campaign/launch", marketingCampaignLaunch);
router.post("/campaign/autopilot-run-now", marketingAutopilotRunNow);
router.get("/campaign/history", marketingCampaignHistory);
router.get("/campaign/publications", marketingPublicationActivity);
router.get("/campaign/daily-summary", marketingDailySummary);
router.get("/campaign/catalog", marketingCatalogStatus);
router.post("/campaign/catalog", marketingCatalogToggle);
router.get("/campaign/learning", marketingLearning);
router.post("/campaign/learning/feedback", marketingLearningFeedback);

export default router;