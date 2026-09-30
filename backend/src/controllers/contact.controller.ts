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
                                                    <img src="https://www.jqydesigns.com/images/logo/logo.png" width="210" alt="Magic Touch Designs" style="display:block;width:210px;max-width:100%;height:auto;">
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
                                                    <img src="https://www.jqydesigns.com/images/logo/logo.png" width="130" alt="Magic Touch Designs" style="display:block;width:130px;max-width:100%;height:auto;">
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
