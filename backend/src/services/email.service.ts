export interface SendEmailAttachment { filename: string; content: string; contentType?: string; contentId?: string; }
export interface SendEmailOptions { to: string | string[]; subject: string; html: string; text?: string; from?: string; replyTo?: string; attachments?: SendEmailAttachment[]; idempotencyKey?: string; }
export interface SendEmailResult { id: string; }
const resendApiKey = process.env.RESEND_API_KEY;
const defaultFromEmail = process.env.RESEND_FROM_EMAIL || "ventas@magictouchdesigns.com";
const defaultFromName = process.env.RESEND_FROM_NAME || "Magic Touch Designs";
const defaultReplyTo = process.env.RESEND_REPLY_TO || "jqyd.magic@gmail.com";
export const sendEmail = async (options: SendEmailOptions): Promise<SendEmailResult> => {
    if (!resendApiKey) throw new Error("RESEND_API_KEY environment variable is not configured.");
    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    if (!recipients.length) throw new Error("At least one email recipient is required.");
    const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json", ...(options.idempotencyKey ? { "Idempotency-Key": options.idempotencyKey } : {}) }, body: JSON.stringify({ from: options.from || `${defaultFromName} <${defaultFromEmail}>`, to: recipients, subject: options.subject, html: options.html, ...(options.text ? { text: options.text } : {}), reply_to: options.replyTo || defaultReplyTo, ...(options.attachments?.length ? { attachments: options.attachments.map((attachment) => ({ content: attachment.content, filename: attachment.filename, ...(attachment.contentType ? { content_type: attachment.contentType } : {}), ...(attachment.contentId ? { content_id: attachment.contentId } : {}) })) } : {}) }) });
    const responseData: unknown = await response.json().catch(() => null);
    if (!response.ok) { const errorMessage = typeof responseData === "object" && responseData !== null && "message" in responseData && typeof responseData.message === "string" ? responseData.message : "Failed to send email."; throw new Error(`Resend error: ${errorMessage}`); }
    if (typeof responseData !== "object" || responseData === null || !("id" in responseData) || typeof responseData.id !== "string") throw new Error("Resend returned an invalid email response.");
    return { id: responseData.id };
};
