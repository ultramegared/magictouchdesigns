/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: translation.service.ts
 * Module: Translation Service
 * Language: TypeScript
 * Description:
 * Dynamic English to Spanish translation using the OpenAI API.
 * Used for promotional email content and future dynamic content.
 * Languages: English (en) | Español (es)
 * ================================================================
 */

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

export interface TranslationResult {
    translation:
        string;
}


/*
|--------------------------------------------------------------------------
| Environment
|--------------------------------------------------------------------------
*/

const openAiApiKey =
    process.env.OPENAI_API_KEY;

const openAiModel =
    process.env.OPENAI_TRANSLATION_MODEL
    || "gpt-5.6-luna";


/*
|--------------------------------------------------------------------------
| Translate English to Spanish
|--------------------------------------------------------------------------
*/

export const translateEnglishToSpanish =
    async (
        text:
            string
    ): Promise<TranslationResult> => {

        const normalizedText =
            text.trim();


        /*
        |--------------------------------------------------------------------------
        | Validate Input
        |--------------------------------------------------------------------------
        */

        if (
            !normalizedText
        ) {

            throw new Error(
                "Text to translate cannot be empty."
            );

        }


        /*
        |--------------------------------------------------------------------------
        | Validate API Key
        |--------------------------------------------------------------------------
        */

        if (
            !openAiApiKey
        ) {

            throw new Error(
                "OPENAI_API_KEY environment variable is not configured."
            );

        }


        /*
        |--------------------------------------------------------------------------
        | OpenAI Request
        |--------------------------------------------------------------------------
        */

        let response:
            Response;


        try {

            response =
                await fetch(
                    "https://api.openai.com/v1/responses",
                    {
                        method:
                            "POST",

                        headers: {
                            Authorization:
                                `Bearer ${openAiApiKey}`,

                            "Content-Type":
                                "application/json",
                        },

                        body:
                            JSON.stringify({
                                model:
                                    openAiModel,

                                input:
                                    [
                                        {
                                            role:
                                                "system",

                                            content:
                                                [
                                                    {
                                                        type:
                                                            "input_text",

                                                        text:
                                                            "You are a professional English-to-Spanish translator for Magic Touch Designs. Translate the provided English promotional content into natural, clear, persuasive Spanish. Preserve the original meaning, tone, paragraph structure, line breaks, emojis, numbers, prices, discount percentages, product names, brand names, URLs, and special formatting. Do not add explanations, comments, quotation marks, or additional content. Return only the Spanish translation.",
                                                    },
                                                ],
                                        },

                                        {
                                            role:
                                                "user",

                                            content:
                                                [
                                                    {
                                                        type:
                                                            "input_text",

                                                        text:
                                                            normalizedText,
                                                    },
                                                ],
                                        },
                                    ],
                            }),
                    }
                );

            } catch (
                error
            ) {

                console.error(
                    "OpenAI network error:",
                    error
                );


                throw new Error(
                    "Unable to connect to OpenAI translation service."
                );

            }


        /*
        |--------------------------------------------------------------------------
        | Response Body
        |--------------------------------------------------------------------------
        */

        const responseData:
            unknown =
            await response
                .json()
                .catch(
                    () => null
                );


        /*
        |--------------------------------------------------------------------------
        | OpenAI Error
        |--------------------------------------------------------------------------
        */

        if (
            !response.ok
        ) {

            const errorMessage =
                typeof responseData === "object"
                && responseData !== null
                && "error" in responseData
                && typeof responseData.error === "object"
                && responseData.error !== null
                && "message" in responseData.error
                && typeof responseData.error.message === "string"
                    ? responseData.error.message
                    : "Failed to translate content.";


            throw new Error(
                `OpenAI error: ${errorMessage}`
            );

        }


        /*
        |--------------------------------------------------------------------------
        | Validate Response
        |--------------------------------------------------------------------------
        */

        if (
            typeof responseData !== "object"
            || responseData === null
        ) {

            throw new Error(
                "OpenAI returned an invalid response."
            );

        }


        if (
            !("output_text" in responseData)
            || typeof responseData.output_text !== "string"
        ) {

            throw new Error(
                "OpenAI did not return translated text."
            );

        }


        /*
        |--------------------------------------------------------------------------
        | Validate Translation
        |--------------------------------------------------------------------------
        */

        const translation =
            responseData.output_text.trim();


        if (
            !translation
        ) {

            throw new Error(
                "OpenAI returned an empty translation."
            );

        }


        /*
        |--------------------------------------------------------------------------
        | Result
        |--------------------------------------------------------------------------
        */

        return {
            translation,
        };

    };