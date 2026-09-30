import type { Request, Response } from "express";
import { getEmailTemplates, saveEmailTemplateDraft, publishEmailTemplate, sendEmailTemplateTest } from "../services/email-template.service";

const validKey = (value: string) => /^[a-z0-9_]+$/.test(value);

export const listEmailTemplates = async (_req: Request, res: Response): Promise<void> => {
    try { res.json({ status:"success", templates:await getEmailTemplates() }); }
    catch (error) { res.status(500).json({ status:"error", message:error instanceof Error ? error.message : "Unable to retrieve email templates." }); }
};

export const updateEmailTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
        const key = String(req.params.key || "");
        if (!validKey(key)) { res.status(400).json({ status:"error", message:"Invalid template key." }); return; }
        const allowed = ["subject","preheader","eyebrow","title","body","buttonText","buttonUrl","footerText","primaryColor"];
        const patch: Record<string,string> = {};
        for (const field of allowed) if (typeof req.body?.[field] === "string") patch[field] = req.body[field].slice(0, 10000);
        const template = await saveEmailTemplateDraft(key, patch, req.body?.enabled);
        res.json({ status:"success", template });
    } catch (error) { res.status(400).json({ status:"error", message:error instanceof Error ? error.message : "Unable to save email template." }); }
};

export const publishEmailTemplateController = async (req: Request, res: Response): Promise<void> => {
    try {
        const key = String(req.params.key || "");
        const template = await publishEmailTemplate(key);
        res.json({ status:"success", template });
    } catch (error) { res.status(400).json({ status:"error", message:error instanceof Error ? error.message : "Unable to publish email template." }); }
};

export const sendEmailTemplateTestController = async (req: Request, res: Response): Promise<void> => {
    try {
        const key = String(req.params.key || "");
        const to = String(req.body?.to || "").trim().toLowerCase();
        if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) { res.status(400).json({ status:"error", message:"A valid test recipient email is required." }); return; }
        const result = await sendEmailTemplateTest(key, to);
        res.json({ status:"success", message:"Test email sent.", id:result?.id || null });
    } catch (error) { res.status(400).json({ status:"error", message:error instanceof Error ? error.message : "Unable to send test email." }); }
};
