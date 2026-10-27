/**
 * Deterministic order-tracking answers for the JQYDesigns live chat.
 *
 * The chat model must never guess a shipment status, so tracking questions
 * are answered here from the shop's own orders table instead of going to
 * OpenAI. Only a short summary is ever returned: order code, status,
 * carrier, tracking number, and the carrier tracking link. Customer name,
 * email, address, totals, and items are NEVER selected or returned.
 *
 * Tracking numbers are entered manually by admin in the fulfillment
 * workspace, so a lookup only succeeds when admin recorded carrier +
 * tracking on the order. Website orders can also always be checked at
 * https://www.jqydesigns.com/track-order with order number + email.
 */

import { pool } from "../config/database";

const TRACK_ORDER_URL = "https://www.jqydesigns.com/track-order";
const WHATSAPP_NUMBER = "346-760-3007";
const WHATSAPP_URL = "https://wa.me/13467603007";

type ShipmentSummary = {
    orderCode: string;
    status: string;
    carrier: string | null;
    trackingNumber: string | null;
};

// Same carrier -> tracking URL mapping as shipment.service.ts and the
// TrackOrder page. Kept local so the chat code never touches other features.
const carrierTrackingUrl = (carrier: string | null, tracking: string): string | null => {
    const encoded = encodeURIComponent(tracking);
    switch (String(carrier || "").trim().toUpperCase()) {
        case "USPS": return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encoded}`;
        case "UPS": return `https://www.ups.com/track?loc=en_US&tracknum=${encoded}`;
        case "FEDEX": return `https://www.fedex.com/fedextrack/?trknbr=${encoded}`;
        case "DHL": return `https://www.dhl.com/global-en/home/tracking.html?tracking-id=${encoded}`;
        default: return null;
    }
};

// Plain-words status labels for the summary. Internal status codes are never
// shown to the visitor.
const statusWords = (status: string, spanish: boolean): string => {
    const map: Record<string, [string, string]> = {
        pending_payment: ["awaiting payment", "pendiente de pago"],
        paid: ["paid", "pagado"],
        processing: ["being prepared", "en preparación"],
        shipped: ["shipped", "enviado"],
        delivered: ["delivered", "entregado"],
        cancelled: ["cancelled", "cancelado"],
        refunded: ["refunded", "reembolsado"],
    };
    const entry = map[String(status || "").trim().toLowerCase()];
    if (!entry) return spanish ? "en proceso" : "in progress";
    return spanish ? entry[1] : entry[0];
};

// Small heuristic for the deterministic tracking replies (the model handles
// language itself on the OpenAI path). Defaults to English.
export const isSpanishMessage = (message: string): boolean => {
    if (/[áéíóúñ¿¡]/.test(message)) return true;
    const words = [
        "hola", "quiero", "necesito", "pedido", "rastreo", "rastrear",
        "seguimiento", "gracias", "cómo", "donde", "cuándo", "cuánto",
        "taza", "envío", "recoger", "favor", "puedes", "tiene", "tienes",
        "quisiera", "precio", "diseño", "mágica", "encargar", "orden",
    ];
    return words.some((word) => new RegExp(`\\b${word}\\b`, "i").test(message));
};

const TRACKING_WORDS =
    /track|tracking|rastre|seguimiento|donde va|dónde va|where is my order|where's my order|mi pedido|my order|paquete|package|shipment|env[ií]o|enviado|status|estado|shipped|delivered|entregado|arrived|lleg[oó]|en camino|on its way/i;

const ORDER_CODE_RE = /#?MTD-\d{8}-\d{4}/gi;

// A tracking-like code is either an order code (#MTD-YYYYMMDD-NNNN) or a
// long alphanumeric token (USPS 20-22 digits, UPS 1Z..., FedEx 12-15 digits).
// Spaced digit groups ("9400 1118 9922 ...") are joined before matching so
// a pasted USPS label with spaces still resolves to one code.
const extractCandidates = (message: string): { orderCodes: string[]; trackingCodes: string[] } => {
    const orderCodes = Array.from(
        new Set((message.match(ORDER_CODE_RE) || []).map((code) => code.replace(/^#/, "").toUpperCase())),
    );
    if (orderCodes.length > 0) return { orderCodes, trackingCodes: [] };

    const tokens = message.toUpperCase().split(/[^A-Z0-9]+/).filter(Boolean);
    const trackingCodes: string[] = [];
    let digitRun = "";
    const flushRun = () => {
        if (digitRun.length >= 12) trackingCodes.push(digitRun);
        digitRun = "";
    };
    for (const token of tokens) {
        if (/^\d+$/.test(token)) digitRun += token;
        else flushRun();
    }
    flushRun();
    for (const token of tokens) {
        if (token.length >= 12 && /\d/.test(token) && !trackingCodes.includes(token)) {
            trackingCodes.push(token);
        }
    }
    return { orderCodes, trackingCodes: trackingCodes.slice(0, 3) };
};

const normalizeCode = (code: string): string => code.toUpperCase().replace(/[\s-]/g, "");

const lookUpByOrderCode = async (code: string): Promise<ShipmentSummary | null> => {
    const result = await pool.query(
        "SELECT order_code, status, carrier, tracking_number FROM orders WHERE UPPER(REPLACE(order_code, '#', '')) = $1 LIMIT 1",
        [normalizeCode(code)],
    );
    const row = result.rows[0];
    if (!row) return null;
    return {
        orderCode: String(row.order_code),
        status: String(row.status || ""),
        carrier: row.carrier ? String(row.carrier) : null,
        trackingNumber: row.tracking_number ? String(row.tracking_number) : null,
    };
};

const lookUpByTracking = async (code: string): Promise<ShipmentSummary | null> => {
    const result = await pool.query(
        "SELECT order_code, status, carrier, tracking_number FROM orders WHERE UPPER(REPLACE(REPLACE(tracking_number, ' ', ''), '-', '')) = $1 LIMIT 1",
        [normalizeCode(code)],
    );
    const row = result.rows[0];
    if (!row) return null;
    return {
        orderCode: String(row.order_code),
        status: String(row.status || ""),
        carrier: row.carrier ? String(row.carrier) : null,
        trackingNumber: row.tracking_number ? String(row.tracking_number) : null,
    };
};

const summaryReply = (found: ShipmentSummary, spanish: boolean): string => {
    const status = statusWords(found.status, spanish);
    const carrier = (found.carrier || "").trim();
    const tracking = (found.trackingNumber || "").trim();
    if (tracking) {
        const url = carrierTrackingUrl(carrier || null, tracking);
        const link = url ? ` ${spanish ? "Rastrea tu paquete aquí:" : "Track your package here:"} ${url}` : "";
        const closer =
            found.status === "shipped" ? (spanish ? " ¡Ya va en camino!" : " It's on its way!")
            : found.status === "delivered" ? (spanish ? " ¡Disfruta tu taza!" : " Enjoy your mug!")
            : "";
        return spanish
            ? `El pedido ${found.orderCode} está ${status}. Paquetería: ${carrier || "carrier"}. Rastreo: ${tracking}.${link}${closer}`
            : `Order ${found.orderCode} is ${status}. Carrier: ${carrier || "carrier"}. Tracking: ${tracking}.${link}${closer}`;
    }
    return spanish
        ? `El pedido ${found.orderCode} está ${status} y todavía no tiene número de rastreo. Cuando se envíe, tu número aparecerá en ${TRACK_ORDER_URL} — consúltalo con tu número de pedido y correo, o escríbenos por WhatsApp al ${WHATSAPP_NUMBER}.`
        : `Order ${found.orderCode} is ${status} and doesn't have a tracking number yet. Once it ships, your tracking number will appear at ${TRACK_ORDER_URL} — check it with your order number and email, or message us on WhatsApp at ${WHATSAPP_NUMBER}.`;
};

const trackOrderGuidance = (spanish: boolean): string =>
    spanish
        ? `Para rastrear tu pedido, visita ${TRACK_ORDER_URL} y escribe tu número de pedido y correo — verás el estado del pedido y, cuando se envíe, la paquetería y el número de rastreo con enlace para seguir el paquete. Si pediste por WhatsApp, escríbenos al ${WHATSAPP_NUMBER} y lo revisamos por ti.`
        : `To track your order, visit ${TRACK_ORDER_URL} and enter your order number and email — you'll see the order status, and once it ships, the carrier and tracking number with a link to track the package. If you ordered on WhatsApp, message us at ${WHATSAPP_NUMBER} and we'll check it for you.`;

const notFoundReply = (spanish: boolean): string =>
    spanish
        ? `No encontré un envío con ese código. Por favor verifica el número. También puedes consultar tu pedido en ${TRACK_ORDER_URL} con tu número de pedido y correo, o escríbenos por WhatsApp al ${WHATSAPP_NUMBER} y lo buscamos por ti.`
        : `I couldn't find a shipment with that code. Please double-check the number. You can also check your order at ${TRACK_ORDER_URL} with your order number and email, or message us on WhatsApp at ${WHATSAPP_NUMBER} and we'll look it up for you.`;

/**
 * Returns a tracking reply when the visitor is asking about an order or
 * pasted an order/tracking code, otherwise null (caller falls through to
 * the AI reply). Any database failure also returns null so the chat still
 * answers through the normal path instead of erroring.
 */
export const tryTrackingReply = async (message: string): Promise<string | null> => {
    const spanish = isSpanishMessage(message);
    const wantsTracking = TRACKING_WORDS.test(message);
    const { orderCodes, trackingCodes } = extractCandidates(message);
    if (!wantsTracking && orderCodes.length === 0 && trackingCodes.length === 0) return null;
    if (orderCodes.length === 0 && trackingCodes.length === 0) return trackOrderGuidance(spanish);
    // A long number mentioned in passing inside an unrelated question (e.g.
    // "How much is a mug? My number is 123456789012") is not a tracking
    // request: only treat a codeless-of-context paste as tracking when the
    // message has no tracking words and barely any other words.
    if (!wantsTracking) {
        const otherWords = message
            .replace(/#?MTD-\d{8}-\d{4}/gi, " ")
            .replace(/\b[A-Z0-9][A-Z0-9 -]{10,}[A-Z0-9]\b/gi, " ")
            .split(/\s+/)
            .filter(Boolean);
        if (otherWords.length > 4) return null;
    }

    try {
        for (const code of orderCodes) {
            const found = await lookUpByOrderCode(code);
            if (found) return summaryReply(found, spanish);
        }
        for (const code of trackingCodes) {
            const found = await lookUpByTracking(code);
            if (found) return summaryReply(found, spanish);
        }
    } catch (error) {
        console.error("[chat] Tracking lookup failed, falling through to AI reply", error);
        return null;
    }
    return notFoundReply(spanish);
};
