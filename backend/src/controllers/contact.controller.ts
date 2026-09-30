import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { sendEmail } from "../services/email.service";
import { getSettings } from "../services/settings.service";
import {
    createCustomMugRequest,
    getCustomMugCheckoutView,
} from "../services/custom-mug.service";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: MAX_IMAGE_SIZE,
        files: 1,
    },
});

export const contactUpload = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    upload.single("image")(req, res, (error: unknown) => {
        if (error instanceof multer.MulterError) {
            res.status(
                error.code === "LIMIT_FILE_SIZE"
                    ? 413
                    : 400
            ).json({
                status: "error",
                message:
                    error.code === "LIMIT_FILE_SIZE"
                        ? "The image must be 10 MB or smaller."
                        : "Invalid image upload.",
            });
            return;
        }

        if (error instanceof Error) {
            res.status(400).json({
                status: "error",
                message: error.message,
            });
            return;
        }

        next();
    });
};

const escapeHtml = (value: string): string =>
    value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

const clean = (value: unknown, maxLength: number): string =>
    typeof value === "string"
        ? value.trim().slice(0, maxLength)
        : "";

const isValidEmail = (value: string): boolean =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const rejectHoneypot = (req: Request): boolean =>
    clean(req.body?.website, 200).length > 0;

const sendError = (
    res: Response,
    message: string,
    status = 400
): void => {
    res.status(status).json({
        status: "error",
        message,
    });
};

const FRONTEND_URL =
    process.env.FRONTEND_URL || "https://www.jqydesigns.com";

const FONT_CATALOG: Record<string, string> = {
    modern: "Montserrat",
    elegant: "Playfair Display",
    script: "Dancing Script",
    handwritten: "Great Vibes",
    bold: "Bebas Neue",
    classic: "Cormorant Garamond",
    playful: "Pacifico",
    luxury: "Cinzel",
};

export const submitCustomRequest = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        if (rejectHoneypot(req)) {
            res.status(200).json({
                status: "success",
                message: "Request received.",
            });
            return;
        }

        const name = clean(req.body?.name, 120);
        const email = clean(req.body?.email, 254);
        const textForMug = clean(req.body?.text, 500);
        const requestedFontStyle = clean(req.body?.fontStyle, 40) || "modern";
        const fontStyle = FONT_CATALOG[requestedFontStyle] ? requestedFontStyle : "modern";
        const fontName = FONT_CATALOG[fontStyle];
        const model = clean(req.body?.model, 20);
        const size = clean(req.body?.size, 10);
        const color = clean(req.body?.color, 80);
        const printSides = clean(req.body?.printSides, 1);
        const notes = clean(req.body?.notes, 1000);
        const quantity = Number.parseInt(
            clean(req.body?.quantity, 10),
            10
        );

        if (
            name.length < 2 ||
            !isValidEmail(email) ||
            !["Classic", "Premium"].includes(model) ||
            !["11 oz", "15 oz"].includes(size) ||
            !["1", "2"].includes(printSides) ||
            !Number.isInteger(quantity) ||
            quantity < 1 ||
            quantity > 100
        ) {
            sendError(res, "Please provide valid request information.");
            return;
        }

        if (
            !req.file ||
            !["image/jpeg", "image/png", "image/webp"].includes(
                req.file.mimetype
            )
        ) {
            sendError(res, "Please upload a valid JPG, PNG, or WebP image.");
            return;
        }

        const request = await createCustomMugRequest({
            name,
            email,
            textForMug,
            fontStyle,
            fontName,
            model: model as "Classic" | "Premium",
            size: size as "11 oz" | "15 oz",
            color: color || "White",
            printSides: printSides as "1" | "2",
            quantity,
            notes,
            artwork: req.file.buffer,
            artworkMime: req.file.mimetype,
            artworkFilename: req.file.originalname || "custom-design",
        });

        // Custom Mug is not a business notification at submission time.
        // The business receives the order only after payment is verified by the payment webhook.
        const paymentUrl =
            `${FRONTEND_URL}/checkout?custom_request=${encodeURIComponent(request.id)}`;

        try {
            const safeName = escapeHtml(name);
            const safeRequestCode = escapeHtml(request.requestCode);
            const logoBase64 = `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`;
            const safeModel = escapeHtml(model);
            const safeSize = escapeHtml(size);
            const safeColor = escapeHtml(color);
            const safePrintSides = escapeHtml(printSides === "2" ? "Front + Back" : "Front");

            await sendEmail({
                to: email,
                subject: `JQYDesigns | Your Custom Mug Request ${request.requestCode}`,
                html: `
                    <!doctype html>
                    <html lang="en">
                    <head>
                        <meta charset="utf-8">
                        <meta name="viewport" content="width=device-width,initial-scale=1">
                        <title>Your Custom Mug Request</title>
                    </head>
                    <body style="margin:0;padding:0;background:#eef2f7;font-family:Arial,Helvetica,sans-serif;color:#172033;">
                        <div style="width:100%;background:#eef2f7;padding:24px 10px;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #dfe5ed;border-radius:18px;overflow:hidden;">
                                <tr>
                                    <td style="background:#f8fafc;padding:12px 24px;border-bottom:1px solid #e7ebf1;">
                                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                            <tr>
                                                <td style="font-size:12px;color:#4d5868;">Thank you for choosing JQYDesigns!</td>
                                                <td align="right" style="font-size:12px;"><a href="https://www.jqydesigns.com" style="color:#1659a8;text-decoration:none;font-weight:700;">Visit our website</a></td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>

                                <tr>
                                    <td style="padding:22px 26px;background:#ffffff;">
                                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                            <tr>
                                                <td align="left" valign="middle">
                                                    <img src="cid:jqydesigns-logo" width="110" alt="Magic Touch Designs" style="display:block;width:210px;max-width:100%;height:auto;">
                                                </td>
                                                <td align="right" valign="middle" style="font-size:11px;line-height:1.5;color:#4d5868;">
                                                    <strong style="color:#1659a8;">PREMIUM QUALITY</strong><br>
                                                    CUSTOM DESIGNS
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>

                                <tr>
                                    <td style="padding:0 26px 22px;">
                                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:linear-gradient(135deg,#eef5fc,#ffffff);border:1px solid #dce7f4;border-radius:16px;">
                                            <tr>
                                                <td style="padding:28px 26px;">
                                                    <div style="font-size:12px;font-weight:800;letter-spacing:1.4px;text-transform:uppercase;color:#1659a8;">CUSTOM MUG REQUEST</div>
                                                    <h1 style="margin:10px 0 10px;font-size:30px;line-height:1.18;color:#111b2d;">Your custom mug request has been received.</h1>
                                                    <p style="margin:0;color:#526071;font-size:16px;line-height:1.65;">Hi ${safeName}, your design request has been saved and is ready for the next step.</p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>

                                <tr>
                                    <td style="padding:0 26px 18px;">
                                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                            <tr>
                                                <td style="padding:0 0 12px;font-size:13px;font-weight:800;letter-spacing:1.3px;color:#172033;text-transform:uppercase;">REQUEST DETAILS</td>
                                            </tr>
                                            <tr>
                                                <td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:18px;">
                                                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                                        <tr>
                                                            <td style="font-size:12px;color:#718096;">Request number</td>
                                                            <td align="right" style="font-size:16px;font-weight:800;color:#172033;">${safeRequestCode}</td>
                                                        </tr>
                                                        <tr><td colspan="2" style="height:12px;border-bottom:1px solid #e4e9ef;"></td></tr>
                                                        <tr><td colspan="2" style="height:12px;"></td></tr>
                                                        <tr>
                                                            <td style="font-size:13px;color:#5b6675;">Mug</td>
                                                            <td align="right" style="font-size:13px;font-weight:700;color:#172033;">${safeModel} · ${safeSize}</td>
                                                        </tr>
                                                        <tr><td colspan="2" style="height:8px;"></td></tr>
                                                        <tr>
                                                            <td style="font-size:13px;color:#5b6675;">Color</td>
                                                            <td align="right" style="font-size:13px;font-weight:700;color:#172033;">${safeColor}</td>
                                                        </tr>
                                                        <tr><td colspan="2" style="height:8px;"></td></tr>
                                                        <tr>
                                                            <td style="font-size:13px;color:#5b6675;">Design views</td>
                                                            <td align="right" style="font-size:13px;font-weight:700;color:#172033;">${safePrintSides}</td>
                                                        </tr>
                                                        <tr><td colspan="2" style="height:8px;"></td></tr>
                                                        <tr>
                                                            <td style="font-size:13px;color:#5b6675;">Quantity</td>
                                                            <td align="right" style="font-size:13px;font-weight:700;color:#172033;">${Number(quantity)}</td>
                                                        </tr>
                                                        <tr><td colspan="2" style="height:12px;border-bottom:1px solid #e4e9ef;"></td></tr>
                                                        <tr><td colspan="2" style="height:12px;"></td></tr>
                                                        <tr>
                                                            <td style="font-size:14px;font-weight:700;color:#172033;">Merchandise subtotal</td>
                                                            <td align="right" style="font-size:20px;font-weight:800;color:#1659a8;">$${request.subtotal.toFixed(2)}</td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>

                                <tr>
                                    <td style="padding:0 26px 18px;">
                                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#edf6ff;border:1px solid #cfe4f8;border-radius:14px;">
                                            <tr>
                                                <td style="padding:18px 20px;">
                                                    <div style="font-size:15px;font-weight:800;color:#1659a8;margin-bottom:6px;">USPS SHIPPING &amp; SALES TAX</div>
                                                    <div style="font-size:14px;line-height:1.6;color:#526071;">Your shipping cost and applicable sales tax will be calculated automatically after you enter your delivery address at checkout.</div>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>

                                <tr>
                                    <td style="padding:8px 26px 10px;text-align:center;">
                                        <a href="${paymentUrl}" style="display:block;background:#1764b1;color:#ffffff;text-decoration:none;padding:17px 20px;border-radius:11px;font-size:16px;font-weight:800;letter-spacing:.2px;">CONTINUE TO SECURE CHECKOUT &nbsp; →</a>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding:8px 26px 24px;text-align:center;">
                                        <div style="font-size:13px;line-height:1.55;color:#687586;">Your order has not been charged yet. Your purchase will only be confirmed after payment is successfully completed.</div>
                                    </td>
                                </tr>

                                <tr>
                                    <td style="padding:18px 26px;background:#f8fafc;border-top:1px solid #e5eaf1;">
                                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                            <tr>
                                                <td width="33%" valign="top" style="padding-right:12px;">
                                                    <strong style="font-size:12px;color:#172033;">SECURE PAYMENT</strong><br>
                                                    <span style="font-size:11px;line-height:1.5;color:#697586;">Safe and secure checkout.</span>
                                                </td>
                                                <td width="33%" valign="top" style="padding:0 12px;border-left:1px solid #dfe5ed;border-right:1px solid #dfe5ed;">
                                                    <strong style="font-size:12px;color:#172033;">USPS SHIPPING</strong><br>
                                                    <span style="font-size:11px;line-height:1.5;color:#697586;">Shipping calculated at checkout.</span>
                                                </td>
                                                <td width="33%" valign="top" style="padding-left:12px;">
                                                    <strong style="font-size:12px;color:#172033;">CUSTOM DESIGN</strong><br>
                                                    <span style="font-size:11px;line-height:1.5;color:#697586;">Made especially for you.</span>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>

                                <tr>
                                    <td style="background:#101b2b;padding:24px 26px;">
                                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                            <tr>
                                                <td valign="top" style="padding-right:18px;">
                                                    <img src="cid:jqydesigns-logo" width="75" alt="Magic Touch Designs" style="display:block;width:130px;max-width:100%;height:auto;">
                                                    <div style="margin-top:8px;font-size:11px;line-height:1.5;color:#d5dbe4;">Custom Mugs · Personalized Gifts · Premium Quality</div>
                                                </td>
                                                <td valign="top" style="padding-left:18px;border-left:1px solid #425064;font-size:11px;line-height:1.7;color:#d5dbe4;">
                                                    <strong style="color:#ffffff;">Need help?</strong><br>
                                                    jqydesigns@gmail.com<br>
                                                    <a href="https://www.jqydesigns.com" style="color:#8ec5ff;text-decoration:none;">jqydesigns.com</a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </div>
                    </body>
                    </html>
                `,
                text: [
                    `Magic Touch Designs — Custom Mug Request ${request.requestCode}`,
                    "",
                    `Hi ${name}, your custom mug request has been received and is ready for the next step.`,
                    "",
                    `Request: ${request.requestCode}`,
                    `Mug: ${request.model} · ${request.size}`,
                    `Color: ${color}`,
                    `Design views: ${printSides === "2" ? "Front + Back" : "Front"}`,
                    `Quantity: ${quantity}`,
                    `Merchandise subtotal: $${request.subtotal.toFixed(2)}`,
                    "",
                    "USPS shipping and applicable sales tax will be calculated after you enter your delivery address at checkout.",
                    `Continue to secure checkout: ${paymentUrl}`,
                    "",
                    "Your order has not been charged yet. Your purchase will only be confirmed after payment is successfully completed.",
                ].join("\n"),
                attachments: [{
                    filename: "jqydesigns-logo.png",
                    content: logoBase64,
                    contentType: "image/png",
                    contentId: "jqydesigns-logo",
                }],
                idempotencyKey: `custom-request/customer/${request.id}`,
            })
        } catch (customerEmailError) {
            console.error("Custom request customer email error:", customerEmailError);
        }

        res.status(200).json({
            status: "success",
            message: "Request received.",
            checkoutRequestId: request.id,
            requestCode: request.requestCode,
            unitPrice: request.unitPrice,
            subtotal: request.subtotal,
        });
    } catch (error) {
        console.error("Custom contact request error:", error);
        sendError(
            res,
            "Unable to send your request right now. Please try again.",
            500
        );
    }
};

export const getCustomRequestCheckout = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const id = clean(req.params.id, 80);
        const request = await getCustomMugCheckoutView(id);
        if (!request) {
            res.status(404).json({
                status: "error",
                message: "Custom request not found or already completed.",
            });
            return;
        }
        res.json({
            status: "success",
            request,
        });
    } catch (error) {
        console.error("Custom request checkout lookup error:", error);
        sendError(res, "Unable to load the custom request.", 500);
    }
};

export const submitSupportRequest = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        if (rejectHoneypot(req)) {
            res.status(200).json({
                status: "success",
                message: "Message received.",
            });
            return;
        }

        const name = clean(req.body?.name, 120);
        const email = clean(req.body?.email, 254);
        const orderNumber = clean(req.body?.orderNumber, 50);
        const message = clean(req.body?.message, 2000);

        if (
            name.length < 2 ||
            !isValidEmail(email) ||
            message.length < 5
        ) {
            sendError(res, "Please provide valid contact information and a message.");
            return;
        }

        const html = `
            <h2>New Customer Support Message</h2>
            <p><strong>Name:</strong> ${escapeHtml(name)}</p>
            <p><strong>Email:</strong> ${escapeHtml(email)}</p>
            <p><strong>Order number:</strong> ${escapeHtml(orderNumber || "Not provided")}</p>
            <p><strong>Message:</strong><br>${escapeHtml(message).replace(/\n/g, "<br>")}</p>
        `;

        const text = [
            "New Customer Support Message",
            `Name: ${name}`,
            `Email: ${email}`,
            `Order number: ${orderNumber || "Not provided"}`,
            `Message: ${message}`,
        ].join("\n");

        const settings = await getSettings();
        const recipient = settings.supportEmail.trim();
        if (!recipient) {
            throw new Error("Contact recipient email is not configured in Admin Settings.");
        }

        await sendEmail({
            to: recipient,
            replyTo: email,
            subject: `JQYDesigns — Customer Support${orderNumber ? ` — Order ${orderNumber}` : ""}`,
            html,
            text,
        });

        res.status(200).json({
            status: "success",
            message: "Message received.",
        });
    } catch (error) {
        console.error("Support contact request error:", error);
        sendError(
            res,
            "Unable to send your message right now. Please try again.",
            500
        );
    }
};
