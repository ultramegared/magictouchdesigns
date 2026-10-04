import { Router } from "express";
import multer from "multer";
import { authenticateToken } from "../middleware/auth.middleware";
import { marketingCampaignHistory, marketingPublicationActivity, marketingCampaignResults, marketingGoogleAdsStatus, marketingGoogleAdsVerify, marketingCampaignLaunch, marketingLearning, marketingLearningFeedback, marketingAutopilotRun, marketingAutopilotRunNow, marketingDailySummary, marketingDailySummaryCron, marketingCatalogStatus, marketingCatalogToggle, marketingMediaUpload, marketingMediaSignature, marketingEmailStatus, socialAuthorize, socialCallback, socialConnect, socialSelectAccount, socialVerify, socialConnections, socialDisconnect, socialPublish } from "../controllers/social-connections.admin.controller";

const router = Router();

// OAuth callbacks are intentionally public; the signed state binds them to the authenticated admin session that started the flow.
router.get("/:provider/callback", socialCallback);
router.get("/campaign/autopilot-run", marketingAutopilotRun);
router.get("/campaign/daily-summary-cron", marketingDailySummaryCron);
router.use(authenticateToken);
router.get("/", socialConnections);
router.get("/email/status", marketingEmailStatus);
router.get("/:provider/authorize", socialAuthorize);
router.get("/:provider/connect", socialConnect);
router.get("/:provider/verify", socialVerify);
router.post("/:provider/select", socialSelectAccount);
router.delete("/:provider", socialDisconnect);
const marketingMediaMiddleware = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 100 * 1024 * 1024 },
    fileFilter: (_req, file, callback) => {
        if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
            callback(null, true);
            return;
        }
        callback(new Error("Only image and video files are allowed for Marketing creative uploads."));
    },
});

const processMarketingMediaUpload = (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => {
    marketingMediaMiddleware.single("media")(req, res, error => {
        if (!error) {
            next();
            return;
        }
        if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
            res.status(400).json({ status: "error", message: "Marketing media size cannot exceed 100 MB." });
            return;
        }
        res.status(400).json({ status: "error", message: error.message || "Invalid Marketing image upload." });
    });
};

router.post("/publish", socialPublish);
// Direct browser video uploads use the signed endpoint. Keep GET and POST available so
// cached/mobile clients cannot fall back to a dead method while the production bundle rolls.
router.get("/campaign/media/signature", marketingMediaSignature);
router.post("/campaign/media/signature", marketingMediaSignature);
router.post("/campaign/media", processMarketingMediaUpload, marketingMediaUpload);
router.post("/campaign/launch", marketingCampaignLaunch);
router.post("/campaign/autopilot-run-now", marketingAutopilotRunNow);
router.get("/campaign/history", marketingCampaignHistory);
router.get("/campaign/publications", marketingPublicationActivity);
router.get("/campaign/results", marketingCampaignResults);
router.get("/google-ads/status", marketingGoogleAdsStatus);
router.get("/google-ads/verify", marketingGoogleAdsVerify);
router.get("/campaign/daily-summary", marketingDailySummary);
router.get("/campaign/catalog", marketingCatalogStatus);
router.post("/campaign/catalog", marketingCatalogToggle);
router.get("/campaign/learning", marketingLearning);
router.post("/campaign/learning/feedback", marketingLearningFeedback);

export default router;