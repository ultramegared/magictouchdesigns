import type { Request, Response } from "express";
import multer from "multer";
import { sendEmail } from "../services/email.service";

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024,
        files: 1,
    },
});

export const contactUpload = (
    req: Request,
    res: Response,
    next: () => void
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

const recipient =
    process.env.CONTACT_RECIPIENT_EMAIL ||
    "JQYDesigns@gmail.com";

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
        const model = clean(req.body?.model, 50);
        const size = clean(req.body?.size, 20);
        const color = clean(req.body?.color, 50);
        const notes = clean(req.body?.notes, 1000);
        const quantity = Number.parseInt(
            clean(req.body?.quantity, 10),
            10
        );

        if (
            name.length < 2 ||
            !isValidEmail(email) ||
            !Number.isInteger(quantity) ||
            quantity < 1 ||
            quantity > 100 ||
            !["11 oz", "15 oz"].includes(size)
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

        const attachmentContent =
            req.file.buffer.toString("base64");

        const html = `
            <h2>New Custom Mug Request</h2>
            <p><strong>Name:</strong> ${escapeHtml(name)}</p>
            <p><strong>Email:</strong> ${escapeHtml(email)}</p>
            <p><strong>Mug model:</strong> ${escapeHtml(model || "Not specified")}</p>
            <p><strong>Size:</strong> ${escapeHtml(size)}</p>
            <p><strong>Color:</strong> ${escapeHtml(color || "Not specified")}</p>
            <p><strong>Quantity:</strong> ${quantity}</p>
            <p><strong>Text for mug:</strong><br>${escapeHtml(textForMug || "None")}</p>
            <p><strong>Additional details:</strong><br>${escapeHtml(notes || "None")}</p>
            <p><strong>Estimated merchandise total:</strong> $${(24.99 * quantity).toFixed(2)}</p>
        `;

        const text = [
            "New Custom Mug Request",
            `Name: ${name}`,
            `Email: ${email}`,
            `Mug model: ${model || "Not specified"}`,
            `Size: ${size}`,
            `Color: ${color || "Not specified"}`,
            `Quantity: ${quantity}`,
            `Text for mug: ${textForMug || "None"}`,
            `Additional details: ${notes || "None"}`,
            `Estimated merchandise total: $${(24.99 * quantity).toFixed(2)}`,
        ].join("\n");

        await sendEmail({
            to: recipient,
            replyTo: email,
            subject: `JQYDesigns — Custom Mug Request from ${name}`,
            html,
            text,
            attachments: [
                {
                    filename: req.file.originalname || "custom-design",
                    content: attachmentContent,
                    contentType: req.file.mimetype,
                },
            ],
        });

        res.status(200).json({
            status: "success",
            message: "Request received.",
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
