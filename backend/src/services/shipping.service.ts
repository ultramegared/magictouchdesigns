/**
 * Production shipping integration for JQYDesigns.
 *
 * EasyPost is the single shipping authority for:
 * 1) destination address verification / normalization;
 * 2) USPS Ground Advantage live rating.
 *
 * Stripe and PayPal remain payment processors and are not involved in
 * carrier/address verification.
 */

import { verifyCheckoutAddress, type VerifiedAddress } from "./easypost.service";

type ShippingAddress = {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    address: string;
    apartment?: string;
    city: string;
    state: string;
    zip: string;
    country?: string;
};

type ShippingItem = {
    quantity: number;
    variant?: Record<string, string>;
    name?: string;
};

type MugProfile = {
    weightLb: number;
    lengthIn: number;
    widthIn: number;
    heightIn: number;
};

type EasyPostOrigin = {
    name?: string;
    company?: string;
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone?: string;
    email?: string;
};

const EASYPOST_API_BASE = "https://api.easypost.com/v2";
let cachedUspsCarrierAccountId: string | null = null;

const requiredEnv = (name: string): string => {
    const value = process.env[name]?.trim();
    if (!value) throw new Error(`${name} is not configured.`);
    return value;
};

const positiveNumberEnv = (name: string, fallback: number): number => {
    const raw = process.env[name]?.trim();
    if (!raw) return fallback;
    const value = Number(raw);
    if (!Number.isFinite(value) || value <= 0) {
        throw new Error(`${name} must be a positive number.`);
    }
    return value;
};

const normalizeZip = (value: string): string => {
    const match = String(value || "").match(/^\d{5}(?:-\d{4})?$/);
    if (!match) throw new Error("A valid US destination ZIP Code is required.");
    return match[0];
};

const getProfile = (size: string | undefined): MugProfile => {
    const normalized = String(size || "11oz").trim().toLowerCase().replace(/\s+/g, "");
    const is15 = normalized.includes("15");
    if (is15) {
        return {
            weightLb: positiveNumberEnv("USPS_15OZ_PACKAGE_WEIGHT_LB", 1.25),
            lengthIn: positiveNumberEnv("USPS_15OZ_PACKAGE_LENGTH_IN", 6),
            widthIn: positiveNumberEnv("USPS_15OZ_PACKAGE_WIDTH_IN", 6),
            heightIn: positiveNumberEnv("USPS_15OZ_PACKAGE_HEIGHT_IN", 5),
        };
    }
    return {
        weightLb: positiveNumberEnv("USPS_11OZ_PACKAGE_WEIGHT_LB", 1),
        lengthIn: positiveNumberEnv("USPS_11OZ_PACKAGE_LENGTH_IN", 6),
        widthIn: positiveNumberEnv("USPS_11OZ_PACKAGE_WIDTH_IN", 5),
        heightIn: positiveNumberEnv("USPS_11OZ_PACKAGE_HEIGHT_IN", 5),
    };
};

const parseOriginAddress = (): EasyPostOrigin => {
    const raw = requiredEnv("SHIPPING_ORIGIN_ADDRESS_JSON");
    let parsed: any;
    try {
        parsed = JSON.parse(raw);
    } catch {
        throw new Error("SHIPPING_ORIGIN_ADDRESS_JSON is not valid JSON.");
    }

    const street1 = String(parsed?.street1 || parsed?.address || "").trim();
    const city = String(parsed?.city || "").trim();
    const state = String(parsed?.state || "").trim().toUpperCase();
    const zip = String(parsed?.zip || parsed?.postal_code || "").trim();
    if (!street1 || !city || !state || !zip) {
        throw new Error("SHIPPING_ORIGIN_ADDRESS_JSON must contain street1, city, state and zip.");
    }

    return {
        name: String(parsed?.name || "").trim() || undefined,
        company: String(parsed?.company || "").trim() || undefined,
        street1,
        street2: String(parsed?.street2 || parsed?.apartment || "").trim() || undefined,
        city,
        state,
        zip,
        country: String(parsed?.country || "US").trim().toUpperCase(),
        phone: String(parsed?.phone || "").trim() || undefined,
        email: String(parsed?.email || "").trim().toLowerCase() || undefined,
    };
};

const easypostRequest = async <T>(
    path: string,
    method: "GET" | "POST",
    body?: unknown,
): Promise<T> => {
    const apiKey = requiredEnv("EASYPOST_API_KEY");
    const auth = Buffer.from(apiKey + ":").toString("base64");

    const response = await fetch(`${EASYPOST_API_BASE}${path}`, {
        method,
        headers: {
            Accept: "application/json",
            Authorization: `Basic ${auth}`,
            ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });

    const data = await response.json() as any;
    if (!response.ok) {
        const errors = Array.isArray(data?.error?.errors)
            ? data.error.errors.map((item: any) => item?.message).filter(Boolean).join("; ")
            : "";
        throw new Error(errors || data?.error?.message || `EasyPost request failed (${response.status}).`);
    }
    return data as T;
};

const getUspsCarrierAccountId = async (): Promise<string> => {
    if (cachedUspsCarrierAccountId) return cachedUspsCarrierAccountId;

    const configured = process.env.EASYPOST_USPS_CARRIER_ACCOUNT_ID?.trim();
    if (configured) {
        cachedUspsCarrierAccountId = configured;
        return configured;
    }

    const accounts = await easypostRequest<any[]>("/carrier_accounts", "GET");
    const usps = (Array.isArray(accounts) ? accounts : [])
        .filter((account: any) => {
            const type = String(account?.type || "").toLowerCase();
            const readable = String(account?.readable || "").toLowerCase();
            return type.includes("usps") || readable === "usps";
        })
        .sort((a: any, b: any) => {
            const aWallet = String(a?.billing_type || "").toLowerCase() === "easypost";
            const bWallet = String(b?.billing_type || "").toLowerCase() === "easypost";
            return Number(bWallet) - Number(aWallet);
        });

    const id = String(usps[0]?.id || "").trim();
    if (!id) {
        throw new Error("No USPS carrier account is enabled in EasyPost. Enable USPS in EasyPost before accepting checkout orders.");
    }

    cachedUspsCarrierAccountId = id;
    return id;
};

const quoteEasyPostPackage = async (
    origin: EasyPostOrigin,
    destination: VerifiedAddress,
    profile: MugProfile,
) => {
    const carrierAccountId = await getUspsCarrierAccountId();
    const payload = await easypostRequest<any>("/shipments", "POST", {
        shipment: {
            to_address: {
                street1: destination.address,
                ...(destination.apartment ? { street2: destination.apartment } : {}),
                city: destination.city,
                state: destination.state,
                zip: destination.zip,
                country: destination.country,
            },
            from_address: origin,
            parcel: {
                weight: Number((profile.weightLb * 16).toFixed(2)),
                length: profile.lengthIn,
                width: profile.widthIn,
                height: profile.heightIn,
            },
            carrier_accounts: [carrierAccountId],
        },
    });

    const rates = Array.isArray(payload?.rates) ? payload.rates : [];
    const candidates = rates
        .filter((rate: any) => String(rate?.carrier || "").toUpperCase() === "USPS")
        .filter((rate: any) => String(rate?.service || "").toLowerCase() === "groundadvantage")
        .filter((rate: any) => Number.isFinite(Number(rate?.rate)))
        .sort((a: any, b: any) => Number(a.rate) - Number(b.rate));

    const selected = candidates[0];
    if (!selected) {
        throw new Error("EasyPost did not return a USPS Ground Advantage rate for this package.");
    }

    return {
        price: Number(selected.rate),
        rateId: String(selected.id || ""),
        shipmentId: String(payload?.id || selected.shipment_id || ""),
        days: Number.isFinite(Number(selected.delivery_days))
            ? Number(selected.delivery_days)
            : Number.isFinite(Number(selected.est_delivery_days))
                ? Number(selected.est_delivery_days)
                : null,
    };
};

export const getShippingQuote = async (destination: ShippingAddress, items: ShippingItem[]) => {
    const country = String(destination.country || "US").trim().toUpperCase();
    if (country !== "US") {
        throw new Error("Shipping is currently available within the United States only.");
    }

    const verifiedAddress = await verifyCheckoutAddress(destination);
    const origin = parseOriginAddress();

    const totalQuantity = items.reduce(
        (sum, item) => sum + Math.max(1, Math.floor(Number(item.quantity) || 0)),
        0,
    );
    if (!totalQuantity) throw new Error("At least one shippable item is required.");

    // Rate the cart as one combined parcel instead of charging one full
    // shipment for every unit. Weight is additive; dimensions are estimated
    // by keeping the largest footprint and stacking item heights.
    let combinedWeightLb = 0;
    let combinedLengthIn = 0;
    let combinedWidthIn = 0;
    let combinedHeightIn = 0;

    for (const item of items) {
        const quantity = Math.max(1, Math.floor(Number(item.quantity) || 0));
        const size = item.variant?.size || item.variant?.model || item.name;
        const profile = getProfile(size);

        combinedWeightLb += profile.weightLb * quantity;
        combinedLengthIn = Math.max(combinedLengthIn, profile.lengthIn);
        combinedWidthIn = Math.max(combinedWidthIn, profile.widthIn);
        combinedHeightIn += profile.heightIn * quantity;
    }

    const combinedProfile: MugProfile = {
        weightLb: combinedWeightLb,
        lengthIn: combinedLengthIn,
        widthIn: combinedWidthIn,
        heightIn: combinedHeightIn,
    };
    const quote = await quoteEasyPostPackage(origin, verifiedAddress, combinedProfile);
    const shippingCents = Math.round(quote.price * 100);

    return {
        verifiedAddress,
        shippingCents,
        shipping: Number((shippingCents / 100).toFixed(2)),
        carrier: "USPS",
        service: "USPS Ground Advantage",
        deliveryDays: quote.days || 5,
        currency: "USD",
        shipmentId: quote.shipmentId,
        rateId: quote.rateId || "USPS_GROUND_ADVANTAGE",
    };
};
