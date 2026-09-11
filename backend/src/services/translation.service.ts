export interface TranslationResult {
    translation: string;
}

const getOpenAiApiKey = (): string => String(process.env.OPENAI_API_KEY || "").trim();
const getOpenAiModel = (): string => String(process.env.OPENAI_TRANSLATION_MODEL || "gpt-5.6-luna").trim();

export const translateEnglishToSpanish = async (text: string): Promise<TranslationResult> => {
    const normalizedText = text.trim();
    if (!normalizedText) throw new Error("Text to translate cannot be empty.");

    const openAiApiKey = getOpenAiApiKey();
    if (!openAiApiKey) {
        throw new Error("OPENAI_API_KEY environment variable is not configured.");
    }

    const openAiModel = getOpenAiModel();
    let response: Response;

    try {
        response = await fetch("https://api.openai.com/v1/responses", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${openAiApiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: openAiModel,
                input: [
                    {
                        role: "system",
                        content: [{
                            type: "input_text",
                            text: "You are the professional English-to-Spanish translator for Magic Touch Designs. Translate only the provided English content into natural, clear, polished Spanish for a premium ecommerce website. Preserve meaning, tone, paragraph structure, line breaks, emojis, numbers, prices, percentages, product names, brand names, URLs and special formatting. Do not add explanations, labels, quotation marks or content. Return only the Spanish translation.",
                        }],
                    },
                    {
                        role: "user",
                        content: [{ type: "input_text", text: normalizedText }],
                    },
                ],
            }),
        });
    } catch (error) {
        console.error("OpenAI network error:", error);
        throw new Error("Unable to connect to OpenAI translation service.");
    }

    const responseData: unknown = await response.json().catch(() => null);

    if (!response.ok) {
        const errorMessage =
            typeof responseData === "object" && responseData !== null && "error" in responseData &&
            typeof responseData.error === "object" && responseData.error !== null &&
            "message" in responseData.error && typeof responseData.error.message === "string"
                ? responseData.error.message
                : "Failed to translate content.";
        throw new Error(`OpenAI error: ${errorMessage}`);
    }

    if (typeof responseData !== "object" || responseData === null || !("output_text" in responseData) || typeof responseData.output_text !== "string") {
        throw new Error("OpenAI did not return translated text.");
    }

    const translation = responseData.output_text.trim();
    if (!translation) throw new Error("OpenAI returned an empty translation.");

    return { translation };
};
