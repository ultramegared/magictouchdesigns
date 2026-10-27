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

import { tryTrackingReply } from "./chat-tracking.service";

const CHAT_MODEL =
    process.env.CHAT_MODEL?.trim() || "gpt-4.1-mini";

const CHAT_INSTRUCTIONS = [
    "You are the friendly live-chat assistant for JQYDesigns (jqydesigns.com),",
    "a small business in Katy, Texas that sells personalized sublimation mugs.",
    "Detect the visitor's language automatically and reply in that SAME language:",
    "a Spanish message gets a Spanish reply, an English message gets an English reply.",
    "Give very good, clear, direct answers — usually 1-3 short sentences.",
    "Always offer a helpful next step so the visitor never leaves stuck or frustrated.",
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
    "- Prices depend on the model and design: classic mugs start at $13, most personalized mugs are $15 to $17, and magic mugs start at $17.",
    "When answering any question about prices, always list all three tiers: classic mugs from $13, most personalized mugs $15 to $17, and magic mugs from $17. Never collapse this into a single range.",
    "- Personalized mugs are custom with the customer's photo, name, or design.",
    "- High-quality ceramic, vibrant long-lasting print, dishwasher and microwave safe.",
    "- 11 oz and 15 oz options.",
    "- Orders ready in 7 business days. Made in Katy, Texas.",
    "- Houston shipping is about $6.25 (USPS cost). Outside Houston, shipping is calculated by USPS.",
    "- Shipped orders pay product + shipping + tax. Local pickup in Katy pays only the product price.",
    "- Order via the website (https://www.jqydesigns.com) or WhatsApp 346-760-3007 (https://wa.me/13467603007).",
    "- Ordering without a website is easy: just write to us on WhatsApp at 346-760-3007, choose the size (11 oz or 15 oz), send the photo, name, or design in the chat, and say pickup in Katy or shipping. We confirm the design and price before making the mug.",
    "- Track a website order at https://www.jqydesigns.com/track-order with the order number and email: it shows the order status and, once shipped, the carrier and tracking number with a link to track the package. Orders placed on WhatsApp are checked via WhatsApp 346-760-3007.",
    "- Gifts for every occasion: birthdays, graduations, teachers, teams, memorials, business events.",
    "- Custom-request pricing: Classic 11 oz $13 / 15 oz $15; Premium $17 for both sizes; colored handle +$2; second side (front + back) +$2.",
    "- Catalog prices: Funny Times $15; Summer Time and Mom & Son $16; all other listed designs $17. Never quote $0: $0 products are samples, not for sale.",
    "- Magic mugs (heat-reveal, e.g. Magic Black) start at $17.",
    "- Custom orders on the Contact page (https://www.jqydesigns.com/contact): the custom-request form is at the top — photo (required), name, text, font, Classic or Premium, size, color, print sides, quantity, live price. Submitting stores the request and emails us at submit time too; after the customer pays via Stripe, we get the paid production handoff.",
    "- The support form below the custom form on the Contact page emails jqydesigns@gmail.com instantly.",
    "- Shipping: website checkout uses a live USPS quote calculated at checkout — never a fixed price. About $6.25 in Houston applies to direct/WhatsApp orders only.",
    "- Pickup in Katy is a WhatsApp/direct arrangement only: website checkout has no pickup option. Pickup orders pay only the product price.",
    "- Orders are ready in about 7 business days (the site badge says 5–7 business days to your door). Never promise a specific delivery date.",
    "- No fixed return, refund, or cancellation policy exists on the site: never invent one. Route returns, refunds, and cancellations to the Contact page or WhatsApp 346-760-3007.",
    "- We sell mugs ONLY: never offer shirts or caps.",
    "- Business location: Katy, Texas only. Never give a street address.",
    "- JQ&YD Gold Monogram is still in the Love & Romance collection (its move to Business & Branding is pending): do not call it a Business & Branding product.",
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
    // Tracking questions and pasted order/tracking codes are answered
    // deterministically from the orders table, never guessed by the model.
    // A null result means "not a tracking question" (or the lookup failed),
    // in which case the AI reply below handles the message as usual.
    const trackingReply = await tryTrackingReply(message);
    if (trackingReply !== null) return trackingReply;

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
