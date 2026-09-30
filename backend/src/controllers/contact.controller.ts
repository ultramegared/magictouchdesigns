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
            await sendEmail({
                to: email,
                subject: `JQYDesigns — Your custom mug request ${request.requestCode}`,
                html: `
                    <div style="font-family:Arial,sans-serif;color:#202020;max-width:680px;margin:auto">
                        <h2>Your custom mug request has been received.</h2>
                        <p>Hi ${escapeHtml(name)}, we received your design request.</p>
                        <p><strong>Request:</strong> ${escapeHtml(request.requestCode)}<br>
                        <strong>Merchandise subtotal:</strong> $${request.subtotal.toFixed(2)}</p>
                        <p>USPS shipping and applicable sales tax will be calculated after you enter your delivery address.</p>
                        <p><a href="${paymentUrl}" style="display:inline-block;padding:12px 18px;background:#111;color:#fff;text-decoration:none;border-radius:8px;font-weight:700">Continue to Secure Payment</a></p>
                    </div>
                `,
                text: `Your custom mug request ${request.requestCode} was received. Merchandise subtotal: $${request.subtotal.toFixed(2)}. Continue to secure payment: ${paymentUrl}`,
                idempotencyKey: `custom-request/customer/${request.id}`,
            });
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
