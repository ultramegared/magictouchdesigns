import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware";
import { socialAuthorize, socialCallback, socialConnect, socialConnections, socialDisconnect, socialPublish } from "../controllers/social-connections.admin.controller";

const router = Router();

// OAuth callbacks are intentionally public; the signed state binds them to the authenticated admin session that started the flow.
router.get("/:provider/callback", socialCallback);
router.use(authenticateToken);
router.get("/", socialConnections);
router.get("/:provider/authorize", socialAuthorize);
router.get("/:provider/connect", socialConnect);
router.delete("/:provider", socialDisconnect);
router.post("/publish", socialPublish);

export default router;