/**
 * Live customer-chat replies for the JQYDesigns storefront.
 *
 * Mirrors the marketing-caption OpenAI pattern (raw fetch to the Responses
 * API, OPENAI_API_KEY, gpt-4.1-mini default) so no new dependency or
 * required env var is introduced. The model only ever answers from the
 * verified business facts below: it must never invent prices, policies, or
 * product facts, never claim an order was placed or paid, and never take
 * payment details — this chat cannot place orders.
 */

const CHAT_MODEL =
    process.env.CHAT_MODEL?.trim() || "gpt-4.1-mini";

const CHAT_INSTRUCTIONS = [
    "You are the friendly live-chat assistant for JQYDesigns (jqydesigns.com),",
    "a small business in Katy, Texas that sells personalized sublimation mugs.",
    "Reply in English, in a short, friendly, helpful tone — usually 1-3 short sentences.",
    "Use ONLY the verified business facts below. Never invent prices, policies,",
    "products, materials, sizes, or turnaround times beyond these facts.",
    "Never claim an order has been placed, confirmed, or paid, and never ask for",
    "or accept payment details: this chat cannot place orders or take payments.",
    "When a visitor wants to order, point them to the website",
    "(https://www.jqydesigns.com) or WhatsApp (346-760-3007,",
    "https://wa.me/13467603007) so a real order can be started there.",
    "If you do not know an answer, say so briefly and point to WhatsApp 346-760-3007.",
    "Do not use Markdown formatting, headings, or asterisks. Plain text is fine.",
    "",
    "Verified business facts:",
    "- Personalized sublimation mugs, $17 each. Custom with the customer's photo, name, or design.",
    "- High-quality ceramic, vibrant long-lasting print, dishwasher and microwave safe.",
    "- 11 oz and 15 oz options.",
    "- Orders ready in 7 business days. Made in Katy, Texas.",
    "- Houston shipping is about $6.25 (USPS cost). Outside Houston, shipping is calculated by USPS.",
    "- Shipped orders pay product + shipping + tax. Local pickup in Katy pays only the product price.",
    "- Order via the website (https://www.jqydesigns.com) or WhatsApp 346-760-3007 (https://wa.me/13467603007).",
    "- Gifts for every occasion: birthdays, graduations, teachers, teams, memorials, business events.",
].join("\n");

const readResponseText = (payload: any): string => {
    if (typeof payload?.output_text === "string" && payload.output_text.trim()) {
        return payload.output_text.trim();
    }
    if (Array.isArray(payload?.output)) {
        const nested = payload.output
            .flatMap((item: any) => (Array.isArray(item?.content) ? item.content : []))
            .filter((part: any) => part?.type === "output_text" || typeof part?.text === "string")
            .map((part: any) => (typeof part?.text === "string" ? part.text : ""))
            .join("\n")
            .trim();
        if (nested) return nested;
    }
    return "";
};

export const getChatReply = async (message: string): Promise<string> => {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) throw new Error("OPENAI_API_KEY is required for live chat replies.");

    const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
            model: CHAT_MODEL,
            input: [
                {
                    role: "user",
                    content: [
                        { type: "input_text", text: `${CHAT_INSTRUCTIONS}\n\nVisitor message: ${message}` },
                    ],
                },
            ],
            max_output_tokens: 300,
        }),
    });

    if (!response.ok) {
        const rawError = await response.text().catch(() => "");
        console.error("[chat] OpenAI chat request failed", {
            httpStatus: response.status,
            model: CHAT_MODEL,
            detail: rawError.replace(/\s+/g, " ").slice(0, 300),
        });
        throw new Error(`Chat reply failed (OpenAI HTTP ${response.status})`);
    }

    const payload: any = await response.json();
    const reply = readResponseText(payload);
    if (!reply) throw new Error("Chat reply was empty.");
    return reply;
};
