import { pool } from "../config/database";
import { sendEmail } from "./email.service";

const escapeHtml = (value: unknown): string =>
    String(value ?? "").replace(/[&<>\"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#39;",
    }[character] || character));

const trackingUrl = (carrier: string | null, trackingNumber: string): string | null => {
    const encoded = encodeURIComponent(trackingNumber);
    switch (String(carrier || "").trim().toUpperCase()) {
        case "USPS": return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encoded}`;
        case "UPS": return `https://www.ups.com/track?loc=en_US&tracknum=${encoded}`;
        case "FEDEX": return `https://www.fedex.com/fedextrack/?trknbr=${encoded}`;
        case "DHL": return `https://www.dhl.com/global-en/home/tracking.html?tracking-id=${encoded}`;
        default: return null;
    }
};

export const sendShipmentUpdate = async (orderId: string): Promise<void> => {
    const result = await pool.query(
        `SELECT id, order_code, customer_first_name, customer_email, carrier, tracking_number, status
         FROM orders WHERE id = $1 LIMIT 1`,
        [orderId],
    );
    const order = result.rows[0];
    if (!order || !order.customer_email || !order.tracking_number) return;

    const carrier = String(order.carrier || "").trim();
    const trackingNumber = String(order.tracking_number || "").trim();
    const url = trackingUrl(carrier, trackingNumber);
    const customerName = escapeHtml(order.customer_first_name || "Customer");
    const safeCarrier = escapeHtml(carrier || "carrier");
    const safeTracking = escapeHtml(trackingNumber);
    const trackButton = url
        ? `<p style="margin:24px 0"><a href="${url}" style="display:inline-block;padding:12px 18px;background:#111;color:#fff;text-decoration:none;border-radius:8px">Track shipment</a></p>`
        : "";

    const html = `<div style="font-family:Arial,sans-serif;color:#202020;max-width:680px;margin:auto">
        <h1>Your order has shipped</h1>
        <p>Hi ${customerName}, your Magic Touch Designs order <strong>${escapeHtml(order.order_code)}</strong> is on its way.</p>
        <p><strong>Carrier:</strong> ${safeCarrier}<br><strong>Tracking number:</strong> ${safeTracking}</p>
        ${trackButton}
        <p style="color:#666">Tracking updates are provided by the carrier and may take some time to appear.</p>
    </div>`;
    const text = [
        `Your order ${order.order_code} has shipped.`,
        `Carrier: ${carrier || "carrier"}`,
        `Tracking number: ${trackingNumber}`,
        url ? `Track shipment: ${url}` : "",
    ].filter(Boolean).join("\n");

    await sendEmail({
        to: order.customer_email,
        subject: `Your order has shipped ${order.order_code}`,
        html,
        text,
        idempotencyKey: `shipment-update/${order.id}/${carrier.toLowerCase()}/${trackingNumber}`,
    });
};
