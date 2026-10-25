import type { Request, Response } from "express";
import {
    verifyWhatsappWebhookSignature,
    processWhatsappWebhookEvent,
    listWhatsappConversations,
    listWhatsappMessages,
    sendWhatsappReply,
} from "../services/whatsapp-inbox.service";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";

// Meta webhook verification: Meta calls GET with hub.mode, hub.verify_token
// and hub.challenge. Only answer the challenge when the token matches the
// WHATSAPP_WEBHOOK_VERIFY_TOKEN configured in the backend environment.
export function whatsappWebhookVerify(req: Request, res: Response) {
    const mode = String(req.query["hub.mode"] || "");
    const token = String(req.query["hub.verify_token"] || "");
    const challenge = String(req.query["hub.challenge"] || "");
    const expected = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN?.trim();
    if (
        mode === "subscribe" &&
        expected &&
        token === expected &&
        challenge
    ) {
        res.status(200).send(challenge);
        return;
    }
    res.sendStatus(403);
}

// Meta delivers message events here. The signature is verified against the
// raw body (this route is mounted with express.raw, before express.json).
// Processing failures never fail the webhook: Meta retries 5xx responses,
// so a slow or failing step must not turn into a retry storm.
export async function whatsappWebhookReceive(req: Request, res: Response) {
    const rawBody: Buffer = Buffer.isBuffer(req.body)
        ? req.body
        : Buffer.from(
              typeof req.body === "string" ? req.body : JSON.stringify(req.body ?? {})
          );
    if (
        !verifyWhatsappWebhookSignature(
            rawBody,
            req.headers["x-hub-signature-256"] as string | undefined
        )
    ) {
        res.sendStatus(403);
        return;
    }
    try {
        const payload = JSON.parse(rawBody.toString("utf8"));
        await processWhatsappWebhookEvent(payload);
    } catch (error) {
        console.error(
            "WhatsApp webhook processing failed:",
            error instanceof Error ? error.message : error
        );
    }
    res.json({ status: "received" });
}

export async function whatsappInboxConversations(
    req: AuthenticatedRequest,
    res: Response
) {
    void req;
    try {
        res.json({ conversations: await listWhatsappConversations() });
    } catch (error) {
        res.status(500).json({
            error:
                error instanceof Error
                    ? error.message
                    : "Unable to load WhatsApp conversations.",
        });
    }
}

export async function whatsappInboxMessages(
    req: AuthenticatedRequest,
    res: Response
) {
    try {
        const sender = String(req.params.sender || "");
        if (!sender) {
            res.status(400).json({ error: "Missing sender." });
            return;
        }
        res.json({ messages: await listWhatsappMessages(sender) });
    } catch (error) {
        res.status(500).json({
            error:
                error instanceof Error
                    ? error.message
                    : "Unable to load WhatsApp messages.",
        });
    }
}

export async function whatsappInboxReply(
    req: AuthenticatedRequest,
    res: Response
) {
    try {
        const to = String(req.body?.to || "").trim();
        const text = String(req.body?.text || "");
        if (!to) {
            res.status(400).json({ error: "Missing recipient." });
            return;
        }
        res.json(await sendWhatsappReply(to, text));
    } catch (error) {
        res.status(500).json({
            error:
                error instanceof Error ? error.message : "WhatsApp reply failed.",
        });
    }
}
