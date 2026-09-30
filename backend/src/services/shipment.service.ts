import { pool } from "../config/database";
import { sendTemplateEmail } from "./email-template.service";

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
        "SELECT id, order_code, customer_first_name, customer_email, carrier, tracking_number, status FROM orders WHERE id = $1 LIMIT 1",
        [orderId],
    );
    const order = result.rows[0];
    if (!order || !order.customer_email || !order.tracking_number) return;
    const carrier = String(order.carrier || "").trim();
    const trackingNumber = String(order.tracking_number || "").trim();
    const url = trackingUrl(carrier, trackingNumber) || "";
    const siteTrackUrl = "https://www.jqydesigns.com/track-order?order=" + encodeURIComponent(String(order.order_code));
    const key = "shipment-update/" + order.id + "/" + carrier.toLowerCase() + "/" + trackingNumber;
    await sendTemplateEmail("shipment_shipped", order.customer_email, {
        siteName:"JQYDesigns", customerName:order.customer_first_name || "Customer", orderCode:order.order_code,
        carrier:carrier || "carrier", trackingNumber, trackingUrl:url || siteTrackUrl, orderUrl:siteTrackUrl,
        supportEmail:"jqydesigns@gmail.com"
    }, key);
};
