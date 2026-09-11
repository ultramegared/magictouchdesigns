export interface TranslationResult {
    translation: string;
}

const getOpenAiApiKey = (): string => String(process.env.OPENAI_API_KEY || "").trim();
const getOpenAiModel = (): string => String(process.env.OPENAI_TRANSLATION_MODEL || "gpt-5.6-luna").trim();

const extractOutputText = (responseData: unknown): string => {
    if (!responseData || typeof responseData !== "object") {
        return "";
    }

    const data = responseData as {
        output_text?: unknown;
        output?: unknown;
    };

    // `output_text` is an SDK convenience property and is not guaranteed
    // to be present in the raw Responses API JSON returned by fetch().
    if (typeof data.output_text === "string" && data.output_text.trim()) {
        return data.output_text.trim();
    }

    if (!Array.isArray(data.output)) {
        return "";
    }

    const parts: string[] = [];

    for (const item of data.output) {
        if (!item || typeof item !== "object") continue;
        const message = item as { type?: unknown; content?: unknown };
        if (message.type !== "message" || !Array.isArray(message.content)) continue;

        for (const content of message.content) {
            if (!content || typeof content !== "object") continue;
            const part = content as { type?: unknown; text?: unknown };
            if (part.type === "output_text" && typeof part.text === "string") {
                parts.push(part.text);
            }
        }
    }

    return parts.join("").trim();
};

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

    const translation = extractOutputText(responseData);
    if (!translation) {
        throw new Error("OpenAI did not return translated text.");
    }

    return { translation };
};
