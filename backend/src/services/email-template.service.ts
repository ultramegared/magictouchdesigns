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

// Approved buyer order-confirmation design (mockup v4): premium 3D banner with
// the real transparent gold logo pasted on top, hosted on the store Cloudinary
// (never a temporary file host — Gmail may not load those). Used ONLY for the
// order_confirmed header; the seller email keeps its text header.
export const ORDER_CONFIRMED_BANNER = "https://res.cloudinary.com/ydcdwyui/image/upload/v1793118840/magic-touch-designs/hero/ulluqgsreo2rgxjmakhf.jpg";

// Social icons for the order_confirmed footer, also on the store Cloudinary.
// Tappable icon links only — no written handle text (approved mockup v4).
export const SOCIAL_ICONS = {
    instagram: { img: "https://res.cloudinary.com/ydcdwyui/image/upload/v1793119258/magic-touch-designs/hero/txoxfz628huimyjdqz57.png", url: "https://www.instagram.com/jqydesigns", alt: "Instagram" },
    facebook: { img: "https://res.cloudinary.com/ydcdwyui/image/upload/v1793119317/magic-touch-designs/hero/dakn9esxkrefiwcyrpxe.png", url: "https://www.facebook.com/jqydesigns", alt: "Facebook" },
    youtube: { img: "https://res.cloudinary.com/ydcdwyui/image/upload/v1793119342/magic-touch-designs/hero/gnlq5fyayrnokw3rkza5.png", url: "https://youtube.com/@jqydesigns", alt: "YouTube" },
};
const socialIconLink = (icon: { img: string; url: string; alt: string }): string => "<a href=\"" + icon.url + "\"><img src=\"" + icon.img + "\" alt=\"" + icon.alt + "\" width=\"32\" height=\"32\" style=\"display:inline-block;width:32px;height:32px;margin:0 6px;border:0\" /></a>";

const C = (subject: string, title: string, body: string, buttonText = "", buttonUrl = ""): EmailTemplateContent => ({
    subject, preheader: title, eyebrow: "JQYDESIGNS", title, body, buttonText, buttonUrl,
    footerText: "Need help? Contact us at {{supportEmail}}", primaryColor: "#1F67B1"
});

const DEFAULTS: Record<string, {name:string;category:EmailTemplateCategory;description:string;content:EmailTemplateContent}> = {
    welcome:{name:"Welcome",category:"ACCOUNT",description:"Sent after a new customer account is created.",content:C("Welcome to {{siteName}}","Welcome, {{customerName}}!","Thank you for joining us! Your account is ready, and we are happy to have you in our community.\n\nYou can update your profile, explore our collections, review your orders, and save your favorite designs for later.\n\nLooking for a thoughtful gift or a little something for yourself? Discover our personalized mugs and unique creations for birthdays, celebrations, and everyday moments.","Open My Account","{{accountUrl}}")},
    email_verification:{name:"Email Verification",category:"ACCOUNT",description:"Reserved for the email-verification flow.",content:C("Verify your email address","Verify your email address","Hi {{customerName}}, please confirm your email address to secure your account.","Verify Email","{{verificationUrl}}")},
    password_reset:{name:"Password Reset",category:"ACCOUNT",description:"Secure password recovery email.",content:C("Reset your {{siteName}} password","Reset your password","Hi {{customerName}}, we received a request to reset your password. This secure link expires in {{expiryMinutes}} minutes.","Reset Password","{{resetUrl}}")},
    password_changed:{name:"Password Changed",category:"ACCOUNT",description:"Confirmation after a successful password change.",content:C("Your {{siteName}} password was changed","Password changed successfully","Hi {{customerName}}, your password was changed successfully. If you did not make this change, contact us immediately.","Open My Account","{{accountUrl}}")},
    custom_mug_request:{name:"Custom Mug Request",category:"CUSTOM_MUG",description:"Customer confirmation after submitting a custom mug request.",content:C("Your custom mug request {{requestCode}}","Your custom mug request has been received.","Hi {{customerName}}, we received your design request.\\n\\nRequest: {{requestCode}}\\nMug: {{mugModel}} · {{mugSize}}\\nColor: {{mugColor}}\\nDesign views: {{printSides}}\\nQuantity: {{quantity}}\\nMerchandise subtotal: {{subtotal}}\\n\\n{{shippingText}}","Continue to Secure Checkout","{{paymentUrl}}")},
    custom_mug_paid:{name:"Custom Mug Paid",category:"CUSTOM_MUG",description:"Internal production notification after a custom mug is paid.",content:C("Custom mug paid — {{orderCode}}","Custom mug order ready for production","Customer: {{customerName}}\\nEmail: {{customerEmail}}\\nOrder: {{orderCode}}\\nRequest: {{requestCode}}\\nTotal: {{orderTotal}}\\nPayment: {{paymentProvider}}\\n\\n{{orderItems}}","View Order","{{orderUrl}}")},
    custom_mug_received:{name:"Custom Mug Request Received",category:"CUSTOM_MUG",description:"Internal notification when a customer submits a custom mug request, before payment.",content:C("NEW CUSTOM REQUEST (awaiting payment) — {{requestCode}}","New custom request — awaiting payment","A customer just submitted a custom mug request. This request is AWAITING PAYMENT — do not start production yet. A separate paid production handoff will arrive after the customer pays.\n\nRequest: {{requestCode}}\nCustomer: {{customerName}}\nEmail: {{customerEmail}}\nMug text: {{mugText}}\nFont: {{fontName}}\nModel: {{mugModel}}\nSize: {{mugSize}}\nColor: {{mugColor}}\nDesign views: {{printSides}}\nQuantity: {{quantity}}\nUnit price: {{unitPrice}}\nEstimated subtotal: {{subtotal}}\nNotes: {{notes}}\n\nThe customer's artwork is attached to this email.","Reply to Customer","mailto:{{customerEmail}}")},
    seller_order_paid:{name:"Seller Order Paid",category:"ORDER",description:"Internal production handoff for every paid order, including product variants and customer artwork.",content:C("NEW PAID ORDER — {{orderCode}}","New paid order — prepare for production","Order: {{orderCode}}\\nDate: {{orderDate}}\\nPayment status: {{paymentStatus}}\\nPayment provider: {{paymentProvider}}\\nPayment method: {{paymentMethod}}\\n\\nCUSTOMER\\nName: {{customerName}}\\nEmail: {{customerEmail}}\\nPhone: {{customerPhone}}\\nShipping address: {{shippingAddress}}\\n\\nITEMS AND CUSTOMIZATION\\n{{orderItems}}\\n\\nPRODUCT PHOTOS\\n{{productImagesHtml}}\\n\\nSubtotal: {{subtotal}}\\nShipping: {{shipping}}\\nTax: {{tax}}\\nTOTAL PAID: {{orderTotal}}\\n\\nCustom request: {{requestCode}}\\nUploaded artwork is attached to this email when provided.","Open Order in Admin","{{orderUrl}}")},
    order_received:{name:"Order Received",category:"ORDER",description:"Order acknowledgement before final payment confirmation.",content:C("We received your order {{orderCode}}","We received your order","Hi {{customerName}}, we received your order {{orderCode}}. Your order will be confirmed after payment is successfully completed.","View Order","{{orderUrl}}")},
    order_confirmed:{name:"Order Confirmed",category:"ORDER",description:"Customer confirmation after successful payment.",content:C("Order confirmed {{orderCode}} — {{siteName}}","Thank you for your order","Hi {{customerName}}, your payment was received and order {{orderCode}} is confirmed.\n\n{{orderItems}}\n\nPayment method: {{paymentMethod}}\nSubtotal: {{subtotal}}\nShipping: {{shipping}}\nTax: {{tax}}\nTotal: {{orderTotal}}\n\nShipping address:\n{{shippingAddress}}","Track My Order","{{orderUrl}}")},
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
const textToHtml = (value: string): string => value.replace(/\\n/g, "\n").split(/\n\s*\n/).map(p => "<p style=\"margin:0 0 16px;line-height:1.7\">" + escapeHtml(p).replace(/\n/g,"<br />") + "</p>").join("");

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

        // The welcome template was previously saved in settings with the old,
        // plain "your customer account is ready" copy. That stored version
        // overrides DEFAULTS, so migrate that legacy welcome content once and
        // let the current premium default become the live published version.
        const legacyWelcome =
            key === "welcome" &&
            saved?.published &&
            String(saved.published.title || "") === "Welcome to {{siteName}}" &&
            String(saved.published.body || "").trim() ===
                "Hi {{customerName}}, your customer account is ready. You can now manage your profile, orders and reviews.";

        const fallback = key === "custom_mug_request" && legacy
            ? legacyCustomMug(legacy)
            : def.content;
        const published = legacyWelcome
            ? { ...def.content }
            : { ...fallback, ...(saved?.published || {}) };
        const draft = legacyWelcome
            ? { ...def.content }
            : { ...published, ...(saved?.draft || {}) };
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

    const isRefund = template.key === "order_cancelled" && Boolean(vars.refundAmount);
    const logoUrl = isRefund
        ? "https://res.cloudinary.com/ydcdwyui/image/upload/v1790738368/magic-touch-designs/logos/nneyxqq6xylcxciw3om7.png"
        : (settings.logoUrl || FRONTEND_URL + "/images/logo/jqyd-logo-256.png");
    const color = isRefund ? "#d92f50" : (/^#[0-9a-fA-F]{6}$/.test(resolved.primaryColor) ? resolved.primaryColor : "#1F67B1");
    const siteName = isRefund ? "Magic Touch Designs" : (settings.websiteName || "JQYDesigns");
    const isWelcome = template.key === "welcome";
    const isCustomMugReceived = template.key === "custom_mug_received";
    const isOrderConfirmed = template.key === "order_confirmed";
    const isBranded = isCustomMugReceived || isOrderConfirmed;
    if (isRefund) {
        resolved.eyebrow = "REFUND CONFIRMATION";
        resolved.title = "Your refund has been processed";
        resolved.buttonText = "Contact support";
    }

    const buttonColor = isBranded ? "#C62828" : color;
    const buttonRadius = isBranded ? "999px" : "9px";
    const button = resolved.buttonText && resolved.buttonUrl
        ? "<p style=\"margin:30px 0 8px\"><a href=\"" + escapeHtml(resolved.buttonUrl) + "\" style=\"display:inline-block;padding:15px 28px;background:" + buttonColor + ";color:#fff;text-decoration:none;border-radius:" + buttonRadius + ";font-weight:700;font-size:15px\">" + escapeHtml(resolved.buttonText) + "</a></p>"
        : "";

    const preheader = escapeHtml(resolved.preheader || resolved.title);

    const welcomeHighlights = isWelcome
        ? "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin:26px 0 6px;background:#fbf7ef;border-radius:14px\"><tr>" +
          "<td width=\"25%\" valign=\"top\" style=\"padding:18px 5px;text-align:center\"><div style=\"font-size:25px;color:#99621c;margin-bottom:8px\">♙</div><div style=\"font-size:12px;font-weight:800;color:#14213a\">Manage<br/>Your Profile</div><div style=\"font-size:11px;color:#536174;margin-top:6px\">Update your details</div></td>" +
          "<td width=\"25%\" valign=\"top\" style=\"padding:18px 5px;text-align:center;border-left:1px solid #e5dccd\"><div style=\"font-size:25px;color:#99621c;margin-bottom:8px\">▢</div><div style=\"font-size:12px;font-weight:800;color:#14213a\">Shop<br/>Collections</div><div style=\"font-size:11px;color:#536174;margin-top:6px\">Find a special gift</div></td>" +
          "<td width=\"25%\" valign=\"top\" style=\"padding:18px 5px;text-align:center;border-left:1px solid #e5dccd\"><div style=\"font-size:25px;color:#99621c;margin-bottom:8px\">◇</div><div style=\"font-size:12px;font-weight:800;color:#14213a\">Track<br/>Your Orders</div><div style=\"font-size:11px;color:#536174;margin-top:6px\">Check order status</div></td>" +
          "<td width=\"25%\" valign=\"top\" style=\"padding:18px 5px;text-align:center;border-left:1px solid #e5dccd\"><div style=\"font-size:25px;color:#99621c;margin-bottom:8px\">♡</div><div style=\"font-size:12px;font-weight:800;color:#14213a\">Save<br/>Favorites</div><div style=\"font-size:11px;color:#536174;margin-top:6px\">Keep designs you love</div></td>" +
          "</tr></table>" +
          "<div style=\"margin:22px 0 4px;padding:22px;background:#fffaf1;border:1px solid #efe2ca;border-radius:14px\"><div style=\"font-size:22px;font-weight:800;color:#14213a;margin-bottom:8px\">Discover Unique Gifts</div>" +
          "<div style=\"font-size:15px;line-height:1.65;color:#536174\">Explore personalized mugs and thoughtful gifts for birthdays, celebrations, or just because. Find something that makes someone smile.</div>" +
          "<p style=\"margin:18px 0 0\"><a href=\"" + escapeHtml(FRONTEND_URL + "/") + "\" style=\"display:inline-block;padding:13px 24px;background:#99621c;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px\">Start Shopping &rarr;</a></p></div>"
        : "";

    const renderedBodyHtml = textToHtml(resolved.body).replace(/__MTD_PRODUCT_IMAGES_HTML__/g, String(vars.productImagesHtmlRaw || "<p>No product image is available for this order.</p>"));
    const renderedTextBody = resolved.body.replace(/\\n/g, "\n").replace(/__MTD_PRODUCT_IMAGES_HTML__/g, "Product photos are displayed in the HTML version of this email.");

    // Branded structured bodies (approved JQYDesigns theme): separated labeled
    // sections built from the template variables. The generic paragraph body
    // stays as the plain-text fallback and for the admin editor.
    const sectionRow = (label: string, value: unknown): string => "<tr><td style=\"padding:11px 18px;border-top:1px solid #eef1f4;font-size:14px;color:#748091;vertical-align:top\">" + escapeHtml(label) + "</td><td style=\"padding:11px 18px;border-top:1px solid #eef1f4;font-size:15px;color:#14213a;font-weight:700\">" + escapeHtml(value ?? "—") + "</td></tr>";
    const sectionTable = (title: string, rows: string): string => "<div style=\"margin:0 0 20px;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden\"><div style=\"padding:13px 18px;background:#f4f6f8;font-size:12px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#14213a\">" + escapeHtml(title) + "</div><table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\">" + rows + "</table></div>";
    const multiline = (value: unknown): string => escapeHtml(value ?? "").replace(/\n/g, "<br />");
    const customMugBodyHtml = "<div style=\"margin:0 0 22px;padding:18px 20px;border-radius:12px;background:#fff8e1;border:1px solid #f0d98a;color:#5d4037;font-size:15px;line-height:1.65\"><strong>⏳ AWAITING PAYMENT — do not start production yet.</strong><br />A separate paid production handoff will arrive after the customer pays.</div>" +
        "<div style=\"margin:0 0 22px;font-size:15px;color:#14213a\">Request: <strong>" + escapeHtml(vars.requestCode ?? "") + "</strong></div>" +
        sectionTable("Customer", sectionRow("Name", vars.customerName) + sectionRow("Email", vars.customerEmail)) +
        sectionTable("Mug details", sectionRow("Mug text", vars.mugText) + sectionRow("Font", vars.fontName) + sectionRow("Model", vars.mugModel) + sectionRow("Size", vars.mugSize) + sectionRow("Color", vars.mugColor) + sectionRow("Design views", vars.printSides) + sectionRow("Quantity", vars.quantity)) +
        sectionTable("Price", sectionRow("Unit price", vars.unitPrice) + sectionRow("Estimated subtotal", vars.subtotal)) +
        sectionTable("Notes", sectionRow("Notes", vars.notes)) +
        "<div style=\"margin:0 0 6px;padding:16px 18px;border-radius:12px;background:#f4f6f8;color:#334155;font-size:14px;line-height:1.65\">📎 The customer's artwork is attached to this email.</div>";
    const orderConfirmedBodyHtml = "<p style=\"margin:0 0 20px;color:#536174;font-size:16px;line-height:1.7\">Hi " + escapeHtml(vars.customerName ?? "there") + ", your payment was received and your order is confirmed.</p>" +
        "<div style=\"margin:0 0 22px;font-size:15px;color:#14213a\">Order: <strong>" + escapeHtml(vars.orderCode ?? "") + "</strong></div>" +
        sectionTable("Your order", "<tr><td colspan=\"2\" style=\"padding:14px 18px\">" + String(vars.productImagesHtmlRaw || "") + "<div style=\"font-size:15px;line-height:1.8;color:#14213a\">" + multiline(vars.orderItems) + "</div></td></tr>" + sectionRow("Payment method", vars.paymentMethod) + sectionRow("Subtotal", vars.subtotal) + sectionRow("Shipping", vars.shipping) + sectionRow("Tax", vars.tax) + "<tr><td style=\"padding:14px 18px;border-top:1px solid #eef1f4;font-size:15px;color:#14213a;font-weight:800\">Total</td><td style=\"padding:14px 18px;border-top:1px solid #eef1f4;font-size:18px;color:#14213a;font-weight:800\">" + escapeHtml(vars.orderTotal ?? "") + "</td></tr>") +
        sectionTable("Shipping address", "<tr><td style=\"padding:14px 18px;font-size:15px;line-height:1.8;color:#14213a\">" + multiline(vars.shippingAddress) + "</td></tr>") +
        "<div style=\"margin:0 0 6px;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden\"><div style=\"padding:13px 18px;background:#f4f6f8;font-size:12px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#14213a\">Status</div><table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\"><tr>" +
        "<td width=\"20%\" style=\"padding:16px 4px;text-align:center\"><div style=\"font-size:18px;color:#1F67B1\">✓</div><div style=\"font-size:11px;font-weight:800;color:#14213a;margin-top:4px\">Received</div></td>" +
        "<td width=\"20%\" style=\"padding:16px 4px;text-align:center\"><div style=\"font-size:18px;color:#1F67B1\">✓</div><div style=\"font-size:11px;font-weight:800;color:#14213a;margin-top:4px\">Paid</div></td>" +
        "<td width=\"20%\" style=\"padding:16px 4px;text-align:center\"><div style=\"font-size:18px;color:#b8c0cc\">○</div><div style=\"font-size:11px;color:#748091;margin-top:4px\">Processing</div></td>" +
        "<td width=\"20%\" style=\"padding:16px 4px;text-align:center\"><div style=\"font-size:18px;color:#b8c0cc\">○</div><div style=\"font-size:11px;color:#748091;margin-top:4px\">Shipped</div></td>" +
        "<td width=\"20%\" style=\"padding:16px 4px;text-align:center\"><div style=\"font-size:18px;color:#b8c0cc\">○</div><div style=\"font-size:11px;color:#748091;margin-top:4px\">Delivered</div></td>" +
        "</tr></table></div>" +
        "<p style=\"margin:14px 0 6px;color:#536174;font-size:14px;line-height:1.65\">Your tracking number will appear on Track My Order once your order ships.</p>";
    const orderConfirmedFooter = "<div style=\"margin-top:20px;background:#111827;border-radius:14px;padding:22px 18px;text-align:center\">" +
        "<div style=\"font-size:14px;line-height:2\"><a href=\"https://www.jqydesigns.com\" style=\"color:#ffffff;text-decoration:none;font-weight:700\">🌐 jqydesigns.com</a><span style=\"color:#6b7280\"> &nbsp;·&nbsp; </span><a href=\"https://wa.me/13467603007\" style=\"color:#ffffff;text-decoration:none;font-weight:700\">💬 WhatsApp 346-760-3007</a></div>" +
        "<div style=\"margin-top:14px\">" + socialIconLink(SOCIAL_ICONS.instagram) + socialIconLink(SOCIAL_ICONS.facebook) + socialIconLink(SOCIAL_ICONS.youtube) + "</div>" +
        "<div style=\"margin-top:10px;color:#6b7280;font-size:11px\">© " + new Date().getFullYear() + " JQYDesigns · Thank you for being with us.</div></div>";
    const html = "<!doctype html><html><head><meta name=\"viewport\" content=\"width=device-width,initial-scale=1.0\" /></head><body style=\"margin:0;background:#eef2f6;font-family:Arial,Helvetica,sans-serif;color:#172033\">" +
        "<div style=\"display:none;max-height:0;overflow:hidden;opacity:0;color:transparent\">" + preheader + "</div>" +
        "<div style=\"padding:28px 12px;background:#eef2f6\"><div style=\"max-width:680px;margin:auto\">" +
        "<div style=\"height:8px;background:linear-gradient(110deg,#fff1c6,#b77b20,#17130f,#f7d982);border-radius:14px 14px 0 0\"></div>" +
        "<div style=\"background:#fff;border:1px solid #dfe5ec;border-radius:0 0 18px 18px;overflow:hidden\">" +
        (isOrderConfirmed
            ? "<div style=\"padding:0\"><img src=\"" + ORDER_CONFIRMED_BANNER + "\" alt=\"JQ&amp;YD — We create designs that tell your story.\" style=\"display:block;width:100%;height:auto;border:0\" /></div>"
            : isBranded
            ? "<div style=\"padding:36px 24px 30px;text-align:center;background:linear-gradient(135deg,#174A8B,#0f3566)\">" +
              "<div style=\"font-family:Georgia,'Times New Roman',serif;font-size:46px;font-weight:700;color:#e8c56b;letter-spacing:1px;line-height:1\">JQ&amp;YD</div>" +
              "<div style=\"margin-top:12px;color:#ffffff;font-size:13px;font-weight:800;letter-spacing:5px\">JQYDESIGNS</div>" +
              "<div style=\"margin-top:8px;color:#c7d6ea;font-size:13px\">Personalized mugs · Katy, TX</div>" +
              "</div>"
            : isWelcome
            ? "<div style=\"padding:38px 24px 34px;text-align:center;background:radial-gradient(ellipse at top left,#49351b 0%,#17130f 45%,#090909 100%);border-bottom:1px solid #3a3024\">" +
              "<img src=\"" + escapeHtml(logoUrl) + "\" alt=\"" + escapeHtml(siteName) + "\" style=\"display:block;margin:auto;max-width:190px;max-height:105px;width:auto;height:auto;border:0\" />" +
              "<div style=\"margin-top:18px;color:#f4dfaa;font-size:12px;font-weight:800;letter-spacing:3px;text-transform:uppercase\">Personalized creations for a brighter you</div>" +
              "<div style=\"width:62px;height:2px;background:#d6a443;margin:18px auto 0\"></div>" +
              "</div>"
            : "<div style=\"padding:30px 24px 26px;text-align:center;background:#fbfcfe;border-bottom:1px solid #e7ebf1\"><img src=\"" + escapeHtml(logoUrl) + "\" alt=\"" + escapeHtml(siteName) + "\" style=\"display:block;margin:auto;max-width:" + (isRefund ? "300px;max-height:150px" : "210px;max-height:92px") + ";width:auto;height:auto;border:0\" /></div>") +
        "<div style=\"padding:34px 34px 30px\">" +
        (isWelcome || isBranded ? "" : "<div style=\"color:" + color + ";font-size:12px;font-weight:800;letter-spacing:3px;text-transform:uppercase\">" + escapeHtml(resolved.eyebrow) + "</div>") +
        "<h1 style=\"margin:11px 0 14px;font-size:34px;line-height:1.14;letter-spacing:-.7px;color:#14213a\">" + (isOrderConfirmed ? "Thank you! Your order is confirmed" : escapeHtml(resolved.title)) + "</h1>" +
        (isRefund ?
        "<p style=\"margin:0 0 18px;color:#536174;font-size:16px;line-height:1.7\">Hello " + escapeHtml(vars.customerName || "there") + ",</p>" +
        "<p style=\"margin:0 0 20px;color:#536174;font-size:16px;line-height:1.7\">Your order <strong>" + escapeHtml(vars.orderCode || "") + "</strong> has been cancelled and the refund has been issued to your original payment method.</p>" +
        "<div style=\"margin:22px 0;padding:24px;border:1px solid #e5e7eb;border-radius:14px;background:#fff\"><div style=\"font-size:12px;letter-spacing:1px;color:#64748b;font-weight:700\">REFUND AMOUNT</div><div style=\"font-size:34px;font-weight:800;color:#14213a;margin:7px 0 14px\">" + escapeHtml(vars.refundAmount || "") + "</div><span style=\"display:inline-block;padding:8px 12px;border-radius:8px;background:#dcfce7;color:#166534;font-size:13px;font-weight:700\">✓ Refund issued</span><div style=\"margin-top:20px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:15px;color:#334155\"><strong>When will the money arrive?</strong><p style=\"margin:8px 0 0;line-height:1.65\">Most card refunds appear within <strong>5–10 business days</strong>. Exact timing depends on your bank or card issuer, and some refunds may take longer.</p></div></div>" +
        "<div style=\"margin:20px 0;padding:18px 20px;border-radius:12px;background:#eff6ff;color:#334155;font-size:14px;line-height:1.65\"><strong>What happens next?</strong><p style=\"margin:7px 0 0\">The refund was sent to your original payment method. Your bank must post the credit to your account. If it has not appeared after 10 business days, contact your card issuer and reference order " + escapeHtml(vars.orderCode || "") + ".</p></div>"
        : isCustomMugReceived ? customMugBodyHtml : isOrderConfirmed ? orderConfirmedBodyHtml : "<div style=\"color:#536174;font-size:16px;line-height:1.75\">" + renderedBodyHtml + "</div>") +
        welcomeHighlights +
        button +
        "<div style=\"margin-top:30px;padding-top:19px;border-top:1px solid #e7ebf1;color:#748091;font-size:12px;line-height:1.65\">" + textToHtml(resolved.footerText) + "</div>" +
        "</div></div>" +
        (isOrderConfirmed
            ? orderConfirmedFooter
            : isBranded
            ? "<div style=\"margin-top:20px;background:#111827;border-radius:14px;padding:22px 18px;text-align:center\">" +
              "<div style=\"font-size:14px;line-height:2\"><a href=\"https://www.jqydesigns.com\" style=\"color:#ffffff;text-decoration:none;font-weight:700\">🌐 jqydesigns.com</a><span style=\"color:#6b7280\"> &nbsp;·&nbsp; </span><a href=\"https://wa.me/13467603007\" style=\"color:#ffffff;text-decoration:none;font-weight:700\">💬 WhatsApp 346-760-3007</a></div>" +
              "<div style=\"font-size:13px;line-height:2\"><a href=\"https://www.instagram.com/jqydesigns\" style=\"color:#d1d5db;text-decoration:none\">Instagram</a><span style=\"color:#6b7280\"> &nbsp;·&nbsp; </span><a href=\"https://www.facebook.com/jqydesigns\" style=\"color:#d1d5db;text-decoration:none\">Facebook</a><span style=\"color:#6b7280\"> &nbsp;·&nbsp; </span><a href=\"https://youtube.com/@jqydesigns\" style=\"color:#d1d5db;text-decoration:none\">YouTube</a><span style=\"color:#6b7280\"> &nbsp;·&nbsp; </span><span style=\"color:#9ca3af\">@jqydesigns</span></div>" +
              "<div style=\"margin-top:10px;color:#6b7280;font-size:11px\">© " + new Date().getFullYear() + " JQYDesigns · Thank you for being with us.</div></div>"
            : "<div style=\"text-align:center;padding:18px 12px;color:#8993a1;font-size:11px\">© " + new Date().getFullYear() + " " + escapeHtml(siteName) + " · Thank you for being with us.</div>") +
        "</div></div></body></html>";

    const text = [resolved.eyebrow,resolved.title,renderedTextBody,resolved.buttonUrl ? resolved.buttonText + ": " + resolved.buttonUrl : "",resolved.footerText].filter(Boolean).join("\n\n");

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
    // Seller production handoff is mandatory for paid orders; it must not be silently disabled in template settings.
    if (!template || (!template.enabled && key !== "seller_order_paid")) return null;
    return sendRenderedEmail(template, vars, to, idempotencyKey, replyTo, attachments);
};

export const sendEmailTemplateTest = async (key: string, to: string) => {
    const settings = await getSettings();
    return sendTemplateEmail(key, to, {
        siteName:settings.websiteName || "JQYDesigns", customerName:"Jose", customerEmail:to, supportEmail:settings.supportEmail || "jqydesigns@gmail.com",
        requestCode:"REQ-2026-001", orderCode:"#1001", orderTotal:"$24.99", subtotal:"$19.99", shipping:"$5.00", tax:"$0.00",
        orderItems:"Custom Mug × 1", productImagesHtmlRaw:"<div style=\"display:inline-block;vertical-align:top;width:180px;max-width:100%;margin:8px;padding:10px;border:1px solid #e5e7eb;border-radius:10px;text-align:center\"><img src=\"https://res.cloudinary.com/ydcdwyui/image/upload/v1793081556/magic-touch-designs/products/vwectykptifsp5rp6arw.webp\" alt=\"Personalized Fa-La-La Christmas Reindeer Mug\" width=\"160\" style=\"display:block;width:160px;max-width:100%;height:auto;margin:0 auto 8px;border:0;border-radius:6px\" /><div style=\"font-weight:700;font-size:13px;color:#172033\">Personalized Fa-La-La Christmas Reindeer Mug</div><div style=\"font-size:12px;color:#536174\">Qty: 1</div></div>", shippingAddress:"123 Example St, Houston, TX 77001", carrier:"USPS", trackingNumber:"9400111899223856920000",
        trackingUrl:"https://tools.usps.com/", orderUrl:FRONTEND_URL + "/track-order", accountUrl:FRONTEND_URL,
        paymentUrl:FRONTEND_URL + "/checkout", resetUrl:FRONTEND_URL + "/reset-password?token=TEST", verificationUrl:FRONTEND_URL + "/account",
        expiryMinutes:"30", mugModel:"Premium", mugSize:"15 oz", mugColor:"White", printSides:"Front + Back", quantity:"1",
        shippingText:"Shipping and applicable tax are calculated at checkout.", pendingText:"Your order has not been charged yet.",
        paymentProvider:"Stripe", paymentMethod:"Visa •••• 4242", refundAmount:"$24.99", updateMessage:"This is a test update.", contactUrl:FRONTEND_URL + "/contact", message:"This is a test support message.",
        promotionSubject:"Summer Promotion", promotionPreheader:"A special offer.", promotionEyebrow:"SPECIAL OFFER", promotionTitle:"Summer collection",
        promotionMessage:"Discover our latest personalized designs.", promotionButtonText:"Shop Now", promotionUrl:FRONTEND_URL + "/products"
    }, "email-template-test:" + key + ":" + Date.now());
};

export const getEmailTemplateKeys = () => Object.keys(DEFAULTS);
