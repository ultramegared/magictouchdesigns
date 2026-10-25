import crypto from "crypto";
import { pool } from "../config/database";
import { getAccessToken } from "./social-connections.service";
import { sendEmail } from "./email.service";

const META_VERSION = process.env.META_GRAPH_API_VERSION || "v26.0";

const workspaceOwnerId = () =>
    process.env.MARKETING_WORKSPACE_OWNER_ID?.trim() ||
    "a720d444-d23c-45ca-9086-d0d4dde26a1f";

export const WHATSAPP_WELCOME_MESSAGE =
    "¡Hola! 👋 Gracias por escribir a JQYDesigns. Hacemos tazas personalizadas con tu foto, nombre o diseño. Cuéntame qué quieres y te confirmo tu pedido. Los pedidos están listos en 7 días hábiles. 🌐 jqydesigns.com";

const AUTO_REPLY_WINDOW_HOURS = 24;

export async function ensureWhatsappMessagesTable() {
    await pool.query(`CREATE TABLE IF NOT EXISTS marketing_whatsapp_messages (
        id BIGSERIAL PRIMARY KEY,
        provider_message_id TEXT NOT NULL UNIQUE,
        waba_id TEXT,
        business_phone_id TEXT,
        sender TEXT NOT NULL,
        direction TEXT NOT NULL,
        message_type TEXT,
        body TEXT NOT NULL DEFAULT '',
        auto_reply BOOLEAN NOT NULL DEFAULT FALSE,
        raw JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);
}

interface WhatsappConnection {
    phoneId: string;
    wabaId: string;
    displayNumber: string;
}

async function loadWhatsappConnection(): Promise<WhatsappConnection | null> {
    await ensureWhatsappMessagesTable();
    const result = await pool.query<{ profile: any }>(
        `SELECT profile FROM marketing_social_connections WHERE user_id = $1 AND provider = $2`,
        [workspaceOwnerId(), "whatsapp"]
    );
    const profile = result.rows[0]?.profile || {};
    const phones = Array.isArray(profile.whatsapp) ? profile.whatsapp : [];
    const phoneId = String(
        profile.phoneNumberId || phones[0]?.phoneNumberId || phones[0]?.id || ""
    );
    if (!/^\d+$/.test(phoneId)) return null;
    return {
        phoneId,
        wabaId: String(profile.wabaId || ""),
        displayNumber: String(
            phones[0]?.display_phone_number || ""
        ).replace(/\D/g, ""),
    };
}

export function verifyWhatsappWebhookSignature(
    rawBody: Buffer,
    signatureHeader: string | undefined
): boolean {
    const appSecret = process.env.META_APP_SECRET?.trim();
    if (!appSecret || !signatureHeader) return false;
    const expected =
        "sha256=" +
        crypto
            .createHmac("sha256", appSecret)
            .update(rawBody)
            .digest("hex");
    const expectedBuffer = Buffer.from(expected);
    const providedBuffer = Buffer.from(signatureHeader);
    if (expectedBuffer.length !== providedBuffer.length) return false;
    return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
}

async function sendWhatsappText(
    phoneId: string,
    token: string,
    to: string,
    text: string
): Promise<string> {
    const response = await fetch(
        `https://graph.facebook.com/${META_VERSION}/${phoneId}/messages`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                messaging_product: "whatsapp",
                to,
                type: "text",
                text: { body: text },
            }),
        }
    );
    const data: any = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(
            data.error?.message || "WhatsApp message failed."
        );
    }
    return String(data.messages?.[0]?.id || "");
}

async function storeMessage(row: {
    providerMessageId: string;
    wabaId: string;
    businessPhoneId: string;
    sender: string;
    direction: "in" | "out";
    messageType: string;
    body: string;
    autoReply: boolean;
    raw: unknown;
}): Promise<boolean> {
    const result = await pool.query(
        `INSERT INTO marketing_whatsapp_messages
            (provider_message_id, waba_id, business_phone_id, sender, direction, message_type, body, auto_reply, raw)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (provider_message_id) DO NOTHING`,
        [
            row.providerMessageId,
            row.wabaId,
            row.businessPhoneId,
            row.sender,
            row.direction,
            row.messageType,
            row.body,
            row.autoReply,
            JSON.stringify(row.raw ?? {}),
        ]
    );
    return (result.rowCount ?? 0) > 0;
}

async function sendNoticeEmail(sender: string, preview: string) {
    // Owner asked for WhatsApp notices to go to this Gmail, always.
    const recipient = "jqydesigns@gmail.com";
    try {
        await sendEmail({
            to: recipient,
            subject: `Nuevo cliente en WhatsApp: ${sender}`,
            html: `<p>Un cliente nuevo te escribió en WhatsApp.</p><p><b>Número:</b> ${sender}</p><p><b>Mensaje:</b> ${preview || "(sin texto)"}</p><p>Ver la conversación y responder en el panel: <a href="https://www.jqydesigns.com/admin/marketing">Marketing Brain</a></p>`,
            text: `Un cliente nuevo te escribió en WhatsApp.\nNúmero: ${sender}\nMensaje: ${preview || "(sin texto)"}\nVer la conversación en el panel: https://www.jqydesigns.com/admin/marketing`,
        });
    } catch (error) {
        console.error(
            "WhatsApp notice email failed:",
            error instanceof Error ? error.message : error
        );
    }
}

async function maybeAutoReply(
    connection: WhatsappConnection,
    sender: string,
    token: string
) {
    try {
        const recent = await pool.query(
            `SELECT 1 FROM marketing_whatsapp_messages
             WHERE sender = $1 AND direction = 'out' AND auto_reply = TRUE
               AND created_at > NOW() - ($2 || ' hours')::interval
             LIMIT 1`,
            [sender, String(AUTO_REPLY_WINDOW_HOURS)]
        );
        if (recent.rows.length) return;
        const messageId = await sendWhatsappText(
            connection.phoneId,
            token,
            sender,
            WHATSAPP_WELCOME_MESSAGE
        );
        await storeMessage({
            providerMessageId: messageId || `local-${crypto.randomUUID()}`,
            wabaId: connection.wabaId,
            businessPhoneId: connection.phoneId,
            sender,
            direction: "out",
            messageType: "text",
            body: WHATSAPP_WELCOME_MESSAGE,
            autoReply: true,
            raw: {},
        });
    } catch (error) {
        console.error(
            "WhatsApp auto-reply failed:",
            error instanceof Error ? error.message : error
        );
    }
}

export async function processWhatsappWebhookEvent(payload: any) {
    const connection = await loadWhatsappConnection();
    if (!connection) return;
    const entries = Array.isArray(payload?.entry) ? payload.entry : [];
    for (const entry of entries) {
        const changes = Array.isArray(entry?.changes) ? entry.changes : [];
        for (const change of changes) {
            const value = change?.value || {};
            if (value.messaging_product !== "whatsapp") continue;
            const businessPhoneId = String(
                value.metadata?.phone_number_id || ""
            );
            if (businessPhoneId !== connection.phoneId) continue;
            const messages = Array.isArray(value.messages)
                ? value.messages
                : [];
            for (const message of messages) {
                const sender = String(message?.from || "");
                if (!sender) continue;
                // Never auto-reply to the business's own number.
                if (
                    connection.displayNumber &&
                    sender.replace(/\D/g, "") === connection.displayNumber
                ) {
                    continue;
                }
                const providerMessageId = String(message?.id || "");
                if (!providerMessageId) continue;
                const messageType = String(message?.type || "");
                const body =
                    messageType === "text"
                        ? String(message?.text?.body || "")
                        : "";
                let isFirstEver = false;
                try {
                    const prior = await pool.query(
                        `SELECT 1 FROM marketing_whatsapp_messages
                         WHERE sender = $1 AND direction = 'in' LIMIT 1`,
                        [sender]
                    );
                    isFirstEver = prior.rows.length === 0;
                } catch (error) {
                    console.error(
                        "WhatsApp prior-message lookup failed:",
                        error instanceof Error ? error.message : error
                    );
                }
                const inserted = await storeMessage({
                    providerMessageId,
                    wabaId: connection.wabaId,
                    businessPhoneId,
                    sender,
                    direction: "in",
                    messageType,
                    body,
                    autoReply: false,
                    raw: message,
                });
                if (!inserted) continue;
                if (messageType === "text") {
                    try {
                        const token = await getAccessToken(
                            workspaceOwnerId(),
                            "whatsapp"
                        );
                        await maybeAutoReply(connection, sender, token);
                    } catch (error) {
                        console.error(
                            "WhatsApp auto-reply token failed:",
                            error instanceof Error ? error.message : error
                        );
                    }
                }
                if (isFirstEver) {
                    await sendNoticeEmail(sender, body);
                }
            }
        }
    }
}

export interface WhatsappConversation {
    sender: string;
    lastAt: string;
    lastBody: string;
    lastDirection: string;
    inboundCount: number;
    totalCount: number;
}

export async function listWhatsappConversations(): Promise<
    WhatsappConversation[]
> {
    await ensureWhatsappMessagesTable();
    const aggregates = await pool.query<{
        sender: string;
        last_at: string;
        inbound_count: string;
        total_count: string;
    }>(
        `SELECT sender, MAX(created_at) AS last_at,
                COUNT(*) FILTER (WHERE direction = 'in') AS inbound_count,
                COUNT(*) AS total_count
         FROM marketing_whatsapp_messages
         GROUP BY sender
         ORDER BY last_at DESC`
    );
    const latest = await pool.query<{
        sender: string;
        body: string;
        direction: string;
    }>(
        `SELECT DISTINCT ON (sender) sender, body, direction
         FROM marketing_whatsapp_messages
         ORDER BY sender, created_at DESC, id DESC`
    );
    const latestBySender = new Map(
        latest.rows.map((row) => [row.sender, row])
    );
    return aggregates.rows.map((row) => {
        const last = latestBySender.get(row.sender);
        return {
            sender: row.sender,
            lastAt: row.last_at,
            lastBody: last?.body || "",
            lastDirection: last?.direction || "in",
            inboundCount: Number(row.inbound_count || 0),
            totalCount: Number(row.total_count || 0),
        };
    });
}

export interface WhatsappMessageRow {
    id: number;
    sender: string;
    direction: string;
    messageType: string;
    body: string;
    autoReply: boolean;
    createdAt: string;
}

export async function listWhatsappMessages(
    sender: string
): Promise<WhatsappMessageRow[]> {
    await ensureWhatsappMessagesTable();
    const result = await pool.query<{
        id: number;
        sender: string;
        direction: string;
        message_type: string;
        body: string;
        auto_reply: boolean;
        created_at: string;
    }>(
        `SELECT id, sender, direction, message_type, body, auto_reply, created_at
         FROM marketing_whatsapp_messages
         WHERE sender = $1
         ORDER BY created_at ASC, id ASC
         LIMIT 500`,
        [sender]
    );
    return result.rows.map((row) => ({
        id: row.id,
        sender: row.sender,
        direction: row.direction,
        messageType: row.message_type,
        body: row.body,
        autoReply: row.auto_reply,
        createdAt: row.created_at,
    }));
}

export async function sendWhatsappReply(to: string, text: string) {
    const trimmed = text.trim();
    if (!trimmed) throw new Error("Write a message first.");
    if (trimmed.length > 4000) {
        throw new Error("WhatsApp messages are limited to 4000 characters.");
    }
    const connection = await loadWhatsappConnection();
    if (!connection) {
        throw new Error("WhatsApp is not connected. Connect it in Marketing Brain first.");
    }
    const token = await getAccessToken(workspaceOwnerId(), "whatsapp");
    const messageId = await sendWhatsappText(
        connection.phoneId,
        token,
        to.trim(),
        trimmed
    );
    await storeMessage({
        providerMessageId: messageId || `local-${crypto.randomUUID()}`,
        wabaId: connection.wabaId,
        businessPhoneId: connection.phoneId,
        sender: to.trim(),
        direction: "out",
        messageType: "text",
        body: trimmed,
        autoReply: false,
        raw: {},
    });
    return { ok: true, id: messageId };
}
