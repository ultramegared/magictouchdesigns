import { Router } from "express";
import { postChatMessage } from "../controllers/chat.controller";

const router = Router();

// Public storefront endpoint: POST /api/chat { message } -> { status, reply }.
// Stateless by design: no conversation is stored and no order is ever placed here.
router.post("/", postChatMessage);

export default router;
