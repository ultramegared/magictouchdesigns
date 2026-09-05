/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: promotion.service.ts
 * Module: Promotion Service
 * Language: TypeScript
 * Description:
 * Handles promotional email campaigns for active subscribers.
 * Separates English and Spanish recipients, translates content,
 * and sends the promotion through the centralized email service.
 * Languages: English (en) | Español (es)
 * ================================================================
 */

import {
    getSubscribers,
} from "./subscriber.service";

import {
    sendEmail,
} from "./email.service";

import {
    translateEnglishToSpanish,
} from "./translation.service";

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

export interface PromotionInput {
    subject:
        string;

    message:
        string;

    imageUrl?:
        string;
}

export interface PromotionResult {
    totalRecipients:
        number;

    englishRecipients:
        number;

    spanishRecipients:
        number;

    englishSent:
        boolean;

    spanishSent:
        boolean;
}

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const escapeHtml =
    (
        value:
            string
    ): string => {

        return value
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );
    };

const formatMessage =
    (
        message:
            string
    ): string => {

        return escapeHtml(
            message
        )
            .replace(
                /\r\n/g,
                "\n"
            )
            .replace(
                /\r/g,
                "\n"
            )
            .replace(
                /\n{3,}/g,
                "\n\n"
            )
            .replace(
                /\n\n/g,
                "</p><p>"
            )
            .replace(
                /\n/g,
                "<br />"
            );
    };

/*
|--------------------------------------------------------------------------
| Promotion Email HTML
|--------------------------------------------------------------------------
*/

const buildPromotionHtml =
    (
        message:
            string,

        imageUrl?:
            string
    ): string => {

        const imageSection =
            imageUrl
                ? `
                    <div
                        style="
                            margin: 0 0 28px;
                            text-align: center;
                        "
                    >
                        <img
                            src="${escapeHtml(imageUrl)}"
                            alt="Magic Touch Designs Promotion"
                            style="
                                display: block;
                                width: 100%;
                                max-width: 600px;
                                height: auto;
                                margin: 0 auto;
                                border: 0;
                            "
                        />
                    </div>
                `
                : "";

        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8" />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1.0"
                />
                <title>Magic Touch Designs</title>
            </head>

            <body
                style="
                    margin: 0;
                    padding: 0;
                    background: #f5f3ef;
                    font-family: Arial, Helvetica, sans-serif;
                    color: #222222;
                "
            >

                <div
                    style="
                        width: 100%;
                        padding: 40px 16px;
                        box-sizing: border-box;
                    "
                >

                    <div
                        style="
                            width: 100%;
                            max-width: 640px;
                            margin: 0 auto;
                            background: #ffffff;
                            border-radius: 12px;
                            overflow: hidden;
                        "
                    >

                        <div
                            style="
                                padding: 28px 24px 20px;
                                text-align: center;
                                background: #111111;
                            "
                        >
                            <div
                                style="
                                    color: #d8c29d;
                                    font-size: 13px;
                                    font-weight: bold;
                                    letter-spacing: 2px;
                                    text-transform: uppercase;
                                "
                            >
                                Magic Touch Designs
                            </div>
                        </div>

                        <div
                            style="
                                padding: 32px 28px;
                            "
                        >

                            ${imageSection}

                            <div
                                style="
                                    color: #333333;
                                    font-size: 16px;
                                    line-height: 1.7;
                                "
                            >
                                <p>
                                    ${formatMessage(message)}
                                </p>
                            </div>

                        </div>

                        <div
                            style="
                                padding: 20px 24px;
                                background: #f7f7f7;
                                text-align: center;
                                color: #777777;
                                font-size: 12px;
                                line-height: 1.5;
                            "
                        >
                            Magic Touch Designs
                        </div>

                    </div>

                </div>

            </body>
            </html>
        `;
    };

/*
|--------------------------------------------------------------------------
| Promotion Email Text
|--------------------------------------------------------------------------
*/

const buildPromotionText =
    (
        message:
            string
    ): string => {

        return [
            "Magic Touch Designs",
            "",
            message.trim(),
            "",
            "Magic Touch Designs",
        ].join("\n");
    };

/*
|--------------------------------------------------------------------------
| Send Promotion
|--------------------------------------------------------------------------
*/

export const sendPromotion =
    async (
        input:
            PromotionInput
    ): Promise<PromotionResult> => {

        const subject =
            input.subject.trim();

        const message =
            input.message.trim();

        const imageUrl =
            input.imageUrl?.trim()
            || undefined;

        if (
            !subject
        ) {

            throw new Error(
                "Promotion subject is required."
            );

        }

        if (
            !message
        ) {

            throw new Error(
                "Promotion message is required."
            );

        }

        /*
        |--------------------------------------------------------------------------
        | Get Active Subscribers
        |--------------------------------------------------------------------------
        */

        const subscribers =
            await getSubscribers({
                status:
                    "active",
            });

        if (
            subscribers.length === 0
        ) {

            throw new Error(
                "There are no active subscribers to receive this promotion."
            );

        }

        /*
        |--------------------------------------------------------------------------
        | Separate Recipients by Language
        |--------------------------------------------------------------------------
        */

        const englishSubscribers =
            subscribers.filter(
                (
                    subscriber
                ) =>
                    subscriber.language === "en"
            );

        const spanishSubscribers =
            subscribers.filter(
                (
                    subscriber
                ) =>
                    subscriber.language === "es"
            );

        /*
        |--------------------------------------------------------------------------
        | Translate Subject and Message
        |--------------------------------------------------------------------------
        */

        let spanishSubject =
            subject;

        let spanishMessage =
            message;

        if (
            spanishSubscribers.length > 0
        ) {

            const [
                translatedSubject,
                translatedMessage,
            ] =
                await Promise.all([
                    translateEnglishToSpanish(
                        subject
                    ),

                    translateEnglishToSpanish(
                        message
                    ),
                ]);

            spanishSubject =
                translatedSubject.translation;

            spanishMessage =
                translatedMessage.translation;
        }

        /*
        |--------------------------------------------------------------------------
        | Send English Promotion
        |--------------------------------------------------------------------------
        */

        let englishSent =
            false;

        if (
            englishSubscribers.length > 0
        ) {

            const englishRecipients =
                englishSubscribers.map(
                    (
                        subscriber
                    ) =>
                        subscriber.email
                );

            await sendEmail({
                to:
                    englishRecipients,

                subject:
                    subject,

                html:
                    buildPromotionHtml(
                        message,
                        imageUrl
                    ),

                text:
                    buildPromotionText(
                        message
                    ),
            });

            englishSent =
                true;
        }

        /*
        |--------------------------------------------------------------------------
        | Send Spanish Promotion
        |--------------------------------------------------------------------------
        */

        let spanishSent =
            false;

        if (
            spanishSubscribers.length > 0
        ) {

            const spanishRecipients =
                spanishSubscribers.map(
                    (
                        subscriber
                    ) =>
                        subscriber.email
                );

            await sendEmail({
                to:
                    spanishRecipients,

                subject:
                    spanishSubject,

                html:
                    buildPromotionHtml(
                        spanishMessage,
                        imageUrl
                    ),

                text:
                    buildPromotionText(
                        spanishMessage
                    ),
            });

            spanishSent =
                true;
        }

        /*
        |--------------------------------------------------------------------------
        | Result
        |--------------------------------------------------------------------------
        */

        return {
            totalRecipients:
                subscribers.length,

            englishRecipients:
                englishSubscribers.length,

            spanishRecipients:
                spanishSubscribers.length,

            englishSent,

            spanishSent,
        };
    };