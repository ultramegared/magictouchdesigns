import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware";
import { requireAdmin } from "../middleware/admin.middleware";
import { listEmailTemplates, updateEmailTemplate, publishEmailTemplateController, sendEmailTemplateTestController, listEmailLogsController } from "../controllers/email-template.controller";

const router = Router();
router.use(authenticateToken, requireAdmin);
router.get("/", listEmailTemplates);
router.get("/logs", listEmailLogsController);
router.put("/:key", updateEmailTemplate);
router.post("/:key/publish", publishEmailTemplateController);
router.post("/:key/test", sendEmailTemplateTestController);
export default router;
