import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { sendEmail } from "../services/email.service";
import { sendTemplateEmail } from "../services/email-template.service";
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

const escapeHtml = (value: unknown): string =>
    String(value ?? "")
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

// All customer-to-business contact requests must reach the company inbox.
const COMPANY_CONTACT_EMAIL = "jqydesigns@gmail.com";

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

        // The customer receives the request confirmation. The company also receives
        // a separate internal notification immediately so no form submission is lost.
        const paymentUrl =
            `${FRONTEND_URL}/checkout?custom_request=${encodeURIComponent(request.id)}`;

        try {
            await sendTemplateEmail("custom_mug_request", email, {
                siteName: "JQYDesigns",
                customerName: name,
                customerEmail: email,
                supportEmail: "jqydesigns@gmail.com",
                requestCode: request.requestCode,
                mugModel: model,
                mugSize: size,
                mugColor: color || "White",
                printSides: printSides === "2" ? "Front + Back" : "Front",
                quantity: String(quantity),
                subtotal: "$" + request.subtotal.toFixed(2),
                shippingText: "USPS shipping and applicable sales tax will be calculated after you enter your delivery address at checkout.",
                pendingText: "Your order has not been charged yet. Your purchase will only be confirmed after payment is successfully completed.",
                paymentUrl,
            }, "custom-request/customer/" + request.id);
        } catch (customerEmailError) {
            console.error("Custom request customer email error:", customerEmailError);
        }

        try {
            const internalHtml = `
                <h2>New Custom Mug Request</h2>
                <p><strong>Request:</strong> ${escapeHtml(request.requestCode)}</p>
                <p><strong>Name:</strong> ${escapeHtml(name)}</p>
                <p><strong>Email:</strong> ${escapeHtml(email)}</p>
                <p><strong>Model:</strong> ${escapeHtml(model)}</p>
                <p><strong>Size:</strong> ${escapeHtml(size)}</p>
                <p><strong>Color:</strong> ${escapeHtml(color || "White")}</p>
                <p><strong>Print sides:</strong> ${escapeHtml(printSides === "2" ? "Front + Back" : "Front")}</p>
                <p><strong>Quantity:</strong> ${escapeHtml(quantity)}</p>
                <p><strong>Text:</strong> ${escapeHtml(textForMug || "Not provided")}</p>
                <p><strong>Notes:</strong><br>${escapeHtml(notes || "Not provided").replace(/\\n/g, "<br>")}</p>
            `;
            const internalText = [
                "New Custom Mug Request",
                `Request: ${request.requestCode}`,
                `Name: ${name}`,
                `Email: ${email}`,
                `Model: ${model}`,
                `Size: ${size}`,
                `Color: ${color || "White"}`,
                `Print sides: ${printSides === "2" ? "Front + Back" : "Front"}`,
                `Quantity: ${quantity}`,
                `Text: ${textForMug || "Not provided"}`,
                `Notes: ${notes || "Not provided"}`,
            ].join("\\n");
            await sendEmail({
                to: COMPANY_CONTACT_EMAIL,
                replyTo: email,
                subject: `JQYDesigns — New Custom Mug Request ${request.requestCode}`,
                html: internalHtml,
                text: internalText,
                idempotencyKey: `custom-mug-request:${request.id}`,
            });
        } catch (internalEmailError) {
            console.error("Custom request internal email error:", internalEmailError);
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

        const recipient = COMPANY_CONTACT_EMAIL;
        try {
            await sendTemplateEmail("support_message_received", recipient, {
                siteName: "JQYDesigns",
                customerName: name,
                customerEmail: email,
                orderCode: orderNumber || "Not provided",
                message,
            }, "support-request:" + Buffer.from(name + "|" + email + "|" + orderNumber + "|" + message).toString("base64url").slice(0, 180), email);
        } catch (emailError) {
            console.error("Support contact email error:", emailError);
            throw emailError;
        }

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
