import crypto from "crypto";
import { pool } from "../config/database";

export type CustomMugModel = "Classic" | "Premium";
export type CustomMugSize = "11 oz" | "15 oz";
export type CustomMugSides = "1" | "2";

export interface CustomMugPricingInput {
    model: CustomMugModel;
    size: CustomMugSize;
    color: string;
    printSides: CustomMugSides;
    quantity: number;
}

export interface CustomMugRequestRecord {
    id: string;
    request_code: string;
    name: string;
    email: string;
    text_for_mug: string;
    model: CustomMugModel;
    size: CustomMugSize;
    color: string;
    print_sides: CustomMugSides;
    quantity: number;
    notes: string;
    unit_price: number;
    subtotal: number;
    artwork: Buffer;
    artwork_mime: string;
    artwork_filename: string;
    status: "pending" | "paid" | "cancelled";
    created_at: string;
}

let initialized = false;

export const ensureCustomMugRequestTable = async (): Promise<void> => {
    if (initialized) return;
    await pool.query(`
        CREATE EXTENSION IF NOT EXISTS pgcrypto;
        CREATE SEQUENCE IF NOT EXISTS mtd_custom_request_sequence START 1;
        CREATE TABLE IF NOT EXISTS custom_mug_requests (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            request_code VARCHAR(32) NOT NULL UNIQUE,
            name VARCHAR(120) NOT NULL,
            email VARCHAR(320) NOT NULL,
            text_for_mug VARCHAR(500) NOT NULL DEFAULT '',
            model VARCHAR(20) NOT NULL,
            size VARCHAR(10) NOT NULL,
            color VARCHAR(80) NOT NULL,
            print_sides VARCHAR(1) NOT NULL DEFAULT '1',
            quantity INTEGER NOT NULL CHECK (quantity > 0 AND quantity <= 100),
            notes VARCHAR(1000) NOT NULL DEFAULT '',
            unit_price NUMERIC(12,2) NOT NULL,
            subtotal NUMERIC(12,2) NOT NULL,
            artwork BYTEA NOT NULL,
            artwork_mime VARCHAR(80) NOT NULL,
            artwork_filename VARCHAR(255) NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'pending',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_custom_mug_requests_status ON custom_mug_requests(status);
        CREATE INDEX IF NOT EXISTS idx_custom_mug_requests_created_at ON custom_mug_requests(created_at DESC);
    `);
    initialized = true;
};

const makeRequestCode = async (): Promise<string> => {
    const result = await pool.query<{ sequence: string }>(
        "SELECT nextval('mtd_custom_request_sequence')::text AS sequence"
    );
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    return `#CMR-${date}-${result.rows[0].sequence.padStart(4, "0")}`;
};

const normalizeHandleColor = (color: string): string =>
    color.trim().replace(/\s+/g, " ").toLowerCase();

export const isColoredHandle = (color: string): boolean =>
    normalizeHandleColor(color).startsWith("white + ") &&
    normalizeHandleColor(color).endsWith(" handle");

export const getCustomMugUnitPrice = ({
    model,
    size,
    color,
    printSides,
}: Omit<CustomMugPricingInput, "quantity">): number => {
    const basePrices: Record<CustomMugModel, Record<CustomMugSize, number>> = {
        Classic: {
            "11 oz": 13,
            "15 oz": 15,
        },
        Premium: {
            "11 oz": 17,
            "15 oz": 17,
        },
    };

    const base = basePrices[model]?.[size];
    if (base === undefined) throw new Error("Invalid custom mug model or size.");

    const handleSurcharge = isColoredHandle(color) ? 2 : 0;
    const secondSideSurcharge = printSides === "2" ? 2 : 0;
    return Number((base + handleSurcharge + secondSideSurcharge).toFixed(2));
};

export const calculateCustomMugPricing = (input: CustomMugPricingInput) => {
    if (!["Classic", "Premium"].includes(input.model)) {
        throw new Error("Invalid custom mug model.");
    }
    if (!["11 oz", "15 oz"].includes(input.size)) {
        throw new Error("Invalid custom mug size.");
    }
    if (!["1", "2"].includes(input.printSides)) {
        throw new Error("Invalid print side selection.");
    }
    if (!Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > 100) {
        throw new Error("Invalid custom mug quantity.");
    }

    const unitPrice = getCustomMugUnitPrice(input);
    return {
        unitPrice,
        subtotal: Number((unitPrice * input.quantity).toFixed(2)),
        handleSurcharge: isColoredHandle(input.color) ? 2 : 0,
        secondSideSurcharge: input.printSides === "2" ? 2 : 0,
    };
};

export const createCustomMugRequest = async (input: {
    name: string;
    email: string;
    textForMug: string;
    model: CustomMugModel;
    size: CustomMugSize;
    color: string;
    printSides: CustomMugSides;
    quantity: number;
    notes: string;
    artwork: Buffer;
    artworkMime: string;
    artworkFilename: string;
}) => {
    await ensureCustomMugRequestTable();
    const pricing = calculateCustomMugPricing(input);
    const requestCode = await makeRequestCode();
    const result = await pool.query<Pick<CustomMugRequestRecord, "id" | "request_code">>(
        `INSERT INTO custom_mug_requests
            (request_code, name, email, text_for_mug, model, size, color, print_sides,
             quantity, notes, unit_price, subtotal, artwork, artwork_mime, artwork_filename)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
         RETURNING id, request_code`,
        [
            requestCode,
            input.name,
            input.email.toLowerCase(),
            input.textForMug,
            input.model,
            input.size,
            input.color,
            input.printSides,
            input.quantity,
            input.notes,
            pricing.unitPrice,
            pricing.subtotal,
            input.artwork,
            input.artworkMime,
            input.artworkFilename.slice(0, 255),
        ],
    );
    return {
        id: String(result.rows[0].id),
        requestCode: String(result.rows[0].request_code),
        ...pricing,
    };
};

export const getCustomMugRequest = async (id: string): Promise<CustomMugRequestRecord | null> => {
    await ensureCustomMugRequestTable();
    const result = await pool.query<CustomMugRequestRecord>(
        "SELECT * FROM custom_mug_requests WHERE id = $1 LIMIT 1",
        [id],
    );
    return result.rows[0] || null;
};

export const getCustomMugCheckoutView = async (id: string) => {
    const request = await getCustomMugRequest(id);
    if (!request || request.status !== "pending") return null;
    return {
        id: request.id,
        requestCode: request.request_code,
        name: request.name,
        email: request.email,
        model: request.model,
        size: request.size,
        color: request.color,
        printSides: request.print_sides,
        quantity: request.quantity,
        unitPrice: Number(request.unit_price),
        subtotal: Number(request.subtotal),
    };
};

export const markCustomMugRequestPaid = async (id: string): Promise<void> => {
    await ensureCustomMugRequestTable();
    await pool.query(
        "UPDATE custom_mug_requests SET status = 'paid', updated_at = NOW() WHERE id = $1 AND status = 'pending'",
        [id],
    );
};

export const getCustomMugArtworkAttachment = async (id: string) => {
    const request = await getCustomMugRequest(id);
    if (!request) return null;
    return {
        filename: request.artwork_filename || `custom-mug-${crypto.randomUUID()}.png`,
        content: request.artwork.toString("base64"),
        contentType: request.artwork_mime,
    };
};
