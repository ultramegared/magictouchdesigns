import { pool } from "../config/database";

let initialized = false;
export const ensureEmailLogTable = async (): Promise<void> => {
    if (initialized) return;
    await pool.query("CREATE TABLE IF NOT EXISTS email_logs (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), template_key VARCHAR(120) NOT NULL, event_key VARCHAR(160), recipient TEXT NOT NULL, provider VARCHAR(40) NOT NULL DEFAULT 'resend', provider_message_id TEXT, status VARCHAR(20) NOT NULL, error_message TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())");
    await pool.query("CREATE INDEX IF NOT EXISTS email_logs_created_at_idx ON email_logs(created_at DESC)");
    await pool.query("CREATE INDEX IF NOT EXISTS email_logs_template_idx ON email_logs(template_key)");
    initialized = true;
};

export const recordEmailLog = async (input:{templateKey:string;eventKey?:string;recipient:string|string[];providerMessageId?:string|null;status:"SENT"|"FAILED";errorMessage?:string|null}) => {
    try {
        await ensureEmailLogTable();
        const recipients = Array.isArray(input.recipient) ? input.recipient.join(", ") : input.recipient;
        await pool.query("INSERT INTO email_logs (template_key,event_key,recipient,provider,provider_message_id,status,error_message) VALUES ($1,$2,$3,'resend',$4,$5,$6)", [input.templateKey,input.eventKey || null,recipients,input.providerMessageId || null,input.status,input.errorMessage || null]);
    } catch (error) { console.error("Email log persistence error:", error); }
};

export const listEmailLogs = async (limit = 100) => {
    await ensureEmailLogTable();
    const safeLimit = Math.min(Math.max(Number(limit) || 100,1),500);
    const result = await pool.query("SELECT id,template_key,event_key,recipient,provider,provider_message_id,status,error_message,created_at FROM email_logs ORDER BY created_at DESC LIMIT $1",[safeLimit]);
    return result.rows;
};
