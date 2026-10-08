import { getSettings, updateSettings } from "./settings.service";
import { sendEmail } from "./email.service";
import { recordEmailLog } from "./email-log.service";

export type EmailTemplateCategory = "ACCOUNT" | "ORDER" | "PAYMENT" | "SHIPPING" | "CUSTOM_MUG" | "SUPPORT" | "MARKETING";

export interface EmailTemplateContent {
    subject: string;
    preheader: string;
    eyebrow: string;
    title: string;
    body: string;
    buttonText: string;
    buttonUrl: string;
    footerText: string;
    primaryColor: string;
}

export interface EmailTemplateRecord {
    key: string;
    name: string;
    category: EmailTemplateCategory;
    description: string;
    enabled: boolean;
    version: number;
    draft: EmailTemplateContent;
    published: EmailTemplateContent;
    history: Array<{ version: number; publishedAt: string; content: EmailTemplateContent }>;
}

const FRONTEND_URL = (process.env.FRONTEND_URL || "https://www.jqydesigns.com").replace(/\/$/, "");

const C = (subject: string, title: string, body: string, buttonText = "", buttonUrl = ""): EmailTemplateContent => ({
    subject, preheader: title, eyebrow: "JQYDESIGNS", title, body, buttonText, buttonUrl,
    footerText: "Need help? Contact us at {{supportEmail}}", primaryColor: "#1F67B1"
});

const DEFAULTS: Record<string, {name:string;category:EmailTemplateCategory;description:string;content:EmailTemplateContent}> = {
    welcome:{name:"Welcome",category:"ACCOUNT",description:"Sent after a new customer account is created.",content:C("Welcome to {{siteName}}","Welcome to {{siteName}}","Hi {{customerName}},\n\nWelcome to JQYDesigns. We’re excited to have you here. Your account is ready, so you can explore our personalized designs, manage your profile, and keep your orders organized in one place.\n\nThank you for choosing JQYDesigns — where every piece is made to feel personal.","Explore JQYDesigns","{{accountUrl}}")},
    email_verification:{name:"Email Verification",category:"ACCOUNT",description:"Reserved for the email-verification flow.",content:C("Verify your email address","Verify your email address","Hi {{customerName}}, please confirm your email address to secure your account.","Verify Email","{{verificationUrl}}")},
    password_reset:{name:"Password Reset",category:"ACCOUNT",description:"Secure password recovery email.",content:C("Reset your {{siteName}} password","Reset your password","Hi {{customerName}}, we received a request to reset your password. This secure link expires in {{expiryMinutes}} minutes.","Reset Password","{{resetUrl}}")},
    password_changed:{name:"Password Changed",category:"ACCOUNT",description:"Confirmation after a successful password change.",content:C("Your {{siteName}} password was changed","Password changed successfully","Hi {{customerName}}, your password was changed successfully. If you did not make this change, contact us immediately.","Open My Account","{{accountUrl}}")},
    custom_mug_request:{name:"Custom Mug Request",category:"CUSTOM_MUG",description:"Customer confirmation after submitting a custom mug request.",content:C("Your custom mug request {{requestCode}}","Your custom mug request has been received.","Hi {{customerName}}, we received your design request.\\n\\nRequest: {{requestCode}}\\nMug: {{mugModel}} · {{mugSize}}\\nColor: {{mugColor}}\\nDesign views: {{printSides}}\\nQuantity: {{quantity}}\\nMerchandise subtotal: {{subtotal}}\\n\\n{{shippingText}}","Continue to Secure Checkout","{{paymentUrl}}")},
    custom_mug_paid:{name:"Custom Mug Paid",category:"CUSTOM_MUG",description:"Internal production notification after a custom mug is paid.",content:C("Custom mug paid — {{orderCode}}","Custom mug order ready for production","Customer: {{customerName}}\\nEmail: {{customerEmail}}\\nOrder: {{orderCode}}\\nRequest: {{requestCode}}\\nTotal: {{orderTotal}}\\nPayment: {{paymentProvider}}\\n\\n{{orderItems}}","View Order","{{orderUrl}}")},
    order_received:{name:"Order Received",category:"ORDER",description:"Order acknowledgement before final payment confirmation.",content:C("We received your order {{orderCode}}","We received your order","Hi {{customerName}}, we received your order {{orderCode}}. Your order will be confirmed after payment is successfully completed.","View Order","{{orderUrl}}")},
    order_confirmed:{name:"Order Confirmed",category:"ORDER",description:"Customer confirmation after successful payment.",content:C("Order confirmed {{orderCode}} — {{siteName}}","Thank you for your order","Hi {{customerName}}, your payment was received and order {{orderCode}} is confirmed.\\n\\n{{orderItems}}\\n\\nSubtotal: {{subtotal}}\\nShipping: {{shipping}}\\nTax: {{tax}}\\nTotal: {{orderTotal}}\\n\\nShipping address:\\n{{shippingAddress}}","Track My Order","{{orderUrl}}")},
    order_updated:{name:"Order Updated",category:"ORDER",description:"Customer notification when an order changes.",content:C("Order {{orderCode}} was updated","Your order was updated","Hi {{customerName}}, your order {{orderCode}} has been updated.\\n\\n{{updateMessage}}","View Order","{{orderUrl}}")},
    order_cancelled:{name:"Order Cancelled",category:"ORDER",description:"Customer notification when an order is cancelled.",content:C("Order {{orderCode}} cancelled","Your order was cancelled","Hi {{customerName}}, order {{orderCode}} has been cancelled.\\n\\n{{updateMessage}}","Contact Support","{{contactUrl}}")},
    payment_confirmed:{name:"Payment Confirmed",category:"PAYMENT",description:"Payment confirmation template.",content:C("Payment confirmed for {{orderCode}}","Payment confirmed","Hi {{customerName}}, your payment of {{orderTotal}} for {{orderCode}} was successfully received.","View Order","{{orderUrl}}")},
    payment_failed:{name:"Payment Failed",category:"PAYMENT",description:"Payment failure notification.",content:C("Payment could not be completed for {{orderCode}}","Payment could not be completed","Hi {{customerName}}, we could not complete the payment for {{orderCode}}. {{updateMessage}}","Try Payment Again","{{paymentUrl}}")},
    payment_refunded:{name:"Payment Refunded",category:"PAYMENT",description:"Refund confirmation template.",content:C("Refund issued for {{orderCode}}","Your refund has been issued","Hi {{customerName}}, a refund of {{refundAmount}} has been issued for order {{orderCode}}.","View Order","{{orderUrl}}")},
    shipment_shipped:{name:"Shipment Shipped",category:"SHIPPING",description:"Shipment confirmation with carrier tracking.",content:C("Your order has shipped {{orderCode}}","Your order has shipped","Hi {{customerName}}, your {{siteName}} order {{orderCode}} is on its way.\\n\\nCarrier: {{carrier}}\\nTracking number: {{trackingNumber}}","Track Shipment","{{trackingUrl}}")},
    shipment_updated:{name:"Shipment Updated",category:"SHIPPING",description:"Tracking update template.",content:C("Shipping update for {{orderCode}}","Your shipment was updated","Hi {{customerName}}, the tracking information for order {{orderCode}} was updated.\\n\\nCarrier: {{carrier}}\\nTracking number: {{trackingNumber}}","Track Shipment","{{trackingUrl}}")},
    support_message_received:{name:"Support Message Received",category:"SUPPORT",description:"Internal notification when a customer contacts the business.",content:C("{{siteName}} — Customer Support","New customer support message","Name: {{customerName}}\\nEmail: {{customerEmail}}\\nOrder: {{orderCode}}\\n\\n{{message}}","Reply to Customer","mailto:{{customerEmail}}")},
    marketing_promotion:{name:"Marketing Promotion",category:"MARKETING",description:"Marketing email template kept separate from transactional emails.",content:C("{{promotionSubject}}","{{promotionTitle}}","{{promotionMessage}}","{{promotionButtonText}}","{{promotionUrl}}")}
};

const escapeHtml = (value: unknown): string => String(value ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c] || c));
const replaceVariables = (value: string, vars: Record<string, unknown>): string => value.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_m, key: string) => String(vars[key] ?? ""));
const textToHtml = (value: string): string => value.split(/\n\s*\n/).map(p => "<p style=\"margin:0 0 16px;line-height:1.7\">" + escapeHtml(p).replace(/\n/g,"<br />") + "</p>").join("");

const legacyCustomMug = (legacy: any): EmailTemplateContent => ({
    subject:String(legacy?.subject || DEFAULTS.custom_mug_request.content.subject),
    preheader:"Your personalized mug request has been received.",
    eyebrow:String(legacy?.eyebrow || "CUSTOM DESIGN REQUEST"),
    title:String(legacy?.title || DEFAULTS.custom_mug_request.content.title),
    body:String(legacy?.intro || "") + "\n\n" + String(legacy?.shippingText || ""),
    buttonText:String(legacy?.paymentButton || DEFAULTS.custom_mug_request.content.buttonText),
    buttonUrl:"{{paymentUrl}}",
    footerText:String(legacy?.pendingText || "") + "\n\n" + String(legacy?.footerText || ""),
    primaryColor:String(legacy?.primaryColor || "#1F67B1")
});

export const getEmailTemplates = async (): Promise<Record<string, EmailTemplateRecord>> => {
    const settings = await getSettings();
    const stored = (settings.config as any)?.emailTemplates?.library || {};
    const legacy = (settings.config as any)?.emailTemplates?.customMug;
    const result: Record<string, EmailTemplateRecord> = {};
    for (const [key, def] of Object.entries(DEFAULTS)) {
        const saved = stored[key];
        const fallback = key === "custom_mug_request" && legacy ? legacyCustomMug(legacy) : def.content;
        const published = { ...fallback, ...(saved?.published || {}) };
        const draft = { ...published, ...(saved?.draft || {}) };
        result[key] = {
            key, name:def.name, category:def.category, description:def.description,
            enabled:saved?.enabled !== false, version:Number(saved?.version || 1),
            draft, published, history:Array.isArray(saved?.history) ? saved.history : []
        };
    }
    return result;
};

const persistLibrary = async (library: Record<string, EmailTemplateRecord>) => {
    const settings = await getSettings();
    const normalized: Record<string, any> = {};
    Object.entries(library).forEach(([key, value]) => {
        normalized[key] = { enabled:value.enabled, version:value.version, draft:value.draft, published:value.published, history:value.history.slice(-10) };
    });
    await updateSettings({
        websiteName:settings.websiteName, browserTitle:settings.browserTitle, logoUrl:settings.logoUrl,
        supportEmail:settings.supportEmail, notificationsEnabled:settings.notificationsEnabled,
        config:{ emailTemplates:{ ...(settings.config as any).emailTemplates, library:normalized } }
    });
};

export const saveEmailTemplateDraft = async (key: string, patch: Partial<EmailTemplateContent>, enabled?: boolean) => {
    const library = await getEmailTemplates();
    if (!library[key]) throw new Error("Email template not found.");
    library[key].draft = { ...library[key].draft, ...patch };
    if (enabled !== undefined) library[key].enabled = Boolean(enabled);
    await persistLibrary(library);
    return library[key];
};

export const publishEmailTemplate = async (key: string) => {
    const library = await getEmailTemplates();
    if (!library[key]) throw new Error("Email template not found.");
    const current = library[key];
    current.version += 1;
    current.published = { ...current.draft };
    current.history.push({ version:current.version, publishedAt:new Date().toISOString(), content:current.published });
    await persistLibrary(library);
    return current;
};

const sendRenderedEmail = async (template: EmailTemplateRecord, vars: Record<string, unknown>, to: string|string[], idempotencyKey: string, replyTo?: string, attachments?: Array<{ filename:string; content:string; contentType?:string }>) => {
    const settings = await getSettings();
    const resolved: Record<string,string> = {};
    Object.entries(template.published).forEach(([k,v]) => resolved[k] = replaceVariables(String(v), vars));

    const logoUrl = settings.logoUrl || FRONTEND_URL + "/images/logo/jqyd-logo-256.png";
    const color = /^#[0-9a-fA-F]{6}$/.test(resolved.primaryColor) ? resolved.primaryColor : "#1F67B1";
    const siteName = settings.websiteName || "JQYDesigns";
    const isWelcome = template.key === "welcome";

    const button = resolved.buttonText && resolved.buttonUrl
        ? "<p style=\"margin:30px 0 8px\"><a href=\"" + escapeHtml(resolved.buttonUrl) + "\" style=\"display:inline-block;padding:15px 28px;background:" + color + ";color:#fff;text-decoration:none;border-radius:9px;font-weight:700;font-size:15px\">" + escapeHtml(resolved.buttonText) + "</a></p>"
        : "";

    const preheader = escapeHtml(resolved.preheader || resolved.title);

    const welcomeHighlights = isWelcome
        ? "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin:24px 0 4px\"><tr>" +
          "<td width=\"33.33%\" valign=\"top\" style=\"padding:14px 8px;border:1px solid #e8edf3;border-radius:10px;text-align:center\"><div style=\"font-size:20px;margin-bottom:7px\">✦</div><div style=\"font-size:12px;font-weight:700;color:#172033\">Personalized</div><div style=\"font-size:11px;color:#6b7280;margin-top:4px\">Made for you</div></td>" +
          "<td width=\"8px\" style=\"font-size:1px\">&nbsp;</td>" +
          "<td width=\"33.33%\" valign=\"top\" style=\"padding:14px 8px;border:1px solid #e8edf3;border-radius:10px;text-align:center\"><div style=\"font-size:20px;margin-bottom:7px\">✓</div><div style=\"font-size:12px;font-weight:700;color:#172033\">Your account</div><div style=\"font-size:11px;color:#6b7280;margin-top:4px\">Ready to use</div></td>" +
          "<td width=\"8px\" style=\"font-size:1px\">&nbsp;</td>" +
          "<td width=\"33.33%\" valign=\"top\" style=\"padding:14px 8px;border:1px solid #e8edf3;border-radius:10px;text-align:center\"><div style=\"font-size:20px;margin-bottom:7px\">♡</div><div style=\"font-size:12px;font-weight:700;color:#172033\">Made personal</div><div style=\"font-size:11px;color:#6b7280;margin-top:4px\">Just for you</div></td>" +
          "</tr></table>"
        : "";

    const html = "<!doctype html><html><head><meta name=\"viewport\" content=\"width=device-width,initial-scale=1.0\" /></head><body style=\"margin:0;background:#eef2f6;font-family:Arial,Helvetica,sans-serif;color:#172033\">" +
        "<div style=\"display:none;max-height:0;overflow:hidden;opacity:0;color:transparent\">" + preheader + "</div>" +
        "<div style=\"padding:28px 12px\"><div style=\"max-width:680px;margin:auto\">" +
        "<div style=\"height:4px;background:linear-gradient(90deg,#1F67B1,#C99A2E,#1F67B1);border-radius:8px 8px 0 0\"></div>" +
        "<div style=\"background:#fff;border:1px solid #dfe5ec;border-radius:0 0 18px 18px;overflow:hidden\">" +
        "<div style=\"padding:30px 24px 26px;text-align:center;background:#fbfcfe;border-bottom:1px solid #e7ebf1\"><img src=\"" + escapeHtml(logoUrl) + "\" alt=\"" + escapeHtml(siteName) + "\" style=\"display:block;margin:auto;max-width:210px;max-height:92px;width:auto;height:auto;border:0\" /></div>" +
        "<div style=\"padding:34px 34px 30px\">" +
        "<div style=\"color:" + color + ";font-size:12px;font-weight:800;letter-spacing:2px;text-transform:uppercase\">" + escapeHtml(resolved.eyebrow) + "</div>" +
        "<h1 style=\"margin:11px 0 14px;font-size:34px;line-height:1.14;letter-spacing:-.6px;color:#14213a\">" + escapeHtml(resolved.title) + "</h1>" +
        "<div style=\"color:#536174;font-size:16px;line-height:1.75\">" + textToHtml(resolved.body) + "</div>" +
        welcomeHighlights +
        button +
        "<div style=\"margin-top:30px;padding-top:19px;border-top:1px solid #e7ebf1;color:#748091;font-size:12px;line-height:1.65\">" + textToHtml(resolved.footerText) + "</div>" +
        "</div></div>" +
        "<div style=\"text-align:center;padding:18px 12px;color:#8993a1;font-size:11px\">© " + new Date().getFullYear() + " " + escapeHtml(siteName) + " · Thank you for being with us.</div>" +
        "</div></div></body></html>";

    const text = [resolved.eyebrow,resolved.title,resolved.body,resolved.buttonUrl ? resolved.buttonText + ": " + resolved.buttonUrl : "",resolved.footerText].filter(Boolean).join("\n\n");

    try {
        const result = await sendEmail({ to, subject:resolved.subject, html, text, replyTo, attachments, idempotencyKey });
        await recordEmailLog({ templateKey:template.key, eventKey:idempotencyKey, recipient:to, providerMessageId:result.id, status:"SENT" });
        return result;
    } catch (error) {
        await recordEmailLog({ templateKey:template.key, eventKey:idempotencyKey, recipient:to, status:"FAILED", errorMessage:error instanceof Error ? error.message : "Email send failed." });
        throw error;
    }
};
export const sendTemplateEmail = async (key: string, to: string|string[], vars: Record<string, unknown>, idempotencyKey: string, replyTo?: string, attachments?: Array<{ filename:string; content:string; contentType?:string }>) => {
    const library = await getEmailTemplates();
    const template = library[key];
    if (!template || !template.enabled) return null;
    return sendRenderedEmail(template, vars, to, idempotencyKey, replyTo, attachments);
};

export const sendEmailTemplateTest = async (key: string, to: string) => {
    const settings = await getSettings();
    return sendTemplateEmail(key, to, {
        siteName:settings.websiteName || "JQYDesigns", customerName:"Jose", customerEmail:to, supportEmail:settings.supportEmail || "jqydesigns@gmail.com",
        requestCode:"REQ-2026-001", orderCode:"#1001", orderTotal:"$24.99", subtotal:"$19.99", shipping:"$5.00", tax:"$0.00",
        orderItems:"Custom Mug × 1", shippingAddress:"123 Example St, Houston, TX 77001", carrier:"USPS", trackingNumber:"9400111899223856920000",
        trackingUrl:"https://tools.usps.com/", orderUrl:FRONTEND_URL + "/track-order", accountUrl:FRONTEND_URL + "/account",
        paymentUrl:FRONTEND_URL + "/checkout", resetUrl:FRONTEND_URL + "/reset-password?token=TEST", verificationUrl:FRONTEND_URL + "/account",
        expiryMinutes:"30", mugModel:"Premium", mugSize:"15 oz", mugColor:"White", printSides:"Front + Back", quantity:"1",
        shippingText:"Shipping and applicable tax are calculated at checkout.", pendingText:"Your order has not been charged yet.",
        paymentProvider:"Stripe", refundAmount:"$24.99", updateMessage:"This is a test update.", contactUrl:FRONTEND_URL + "/contact", message:"This is a test support message.",
        promotionSubject:"Summer Promotion", promotionPreheader:"A special offer.", promotionEyebrow:"SPECIAL OFFER", promotionTitle:"Summer collection",
        promotionMessage:"Discover our latest personalized designs.", promotionButtonText:"Shop Now", promotionUrl:FRONTEND_URL + "/products"
    }, "email-template-test:" + key + ":" + Date.now());
};

export const getEmailTemplateKeys = () => Object.keys(DEFAULTS);
