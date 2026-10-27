import type { Request, Response } from "express";
import { getChatReply } from "../services/chat.service";

// Shown when the AI reply cannot be generated, so the widget always stays
// helpful instead of erroring. It never claims an order was placed.
const FALLBACK_REPLY =
    "Thanks for reaching out! I can't pull up the details right now, but you " +
    "can start your order on our website (https://www.jqydesigns.com) or " +
    "message us on WhatsApp at 346-760-3007 (https://wa.me/13467603007) " +
    "and we'll be happy to help.";

export const postChatMessage = async (req: Request, res: Response) => {
    const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
    if (!message || message.length > 1000) {
        res.status(400).json({
            status: "error",
            message: "A message of 1-1000 characters is required.",
        });
        return;
    }

    try {
        const reply = await getChatReply(message);
        res.json({ status: "success", reply });
    } catch (error) {
        console.error("[chat] Failed to generate reply", error);
        res.json({ status: "success", reply: FALLBACK_REPLY });
    }
};
