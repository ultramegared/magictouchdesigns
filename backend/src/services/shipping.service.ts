/**
 * Production USPS shipping integration for JQYDesigns.
 *
 * Uses the current USPS APIs (OAuth 2.0), not the retired Web Tools platform.
 * The customer-facing quote is calculated from the destination ZIP, package
 * weight/dimensions and the live USPS Ground Advantage Commercial option.
 *
 * Package defaults are conservative reference values and can be overridden
 * with environment variables once JQYDesigns confirms its final measured
 * shipping package.
 */

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

const USPS_API_BASE = "https://apis.usps.com";
const TOKEN_URL = `${USPS_API_BASE}/oauth2/v3/token`;
const SHIPPING_OPTIONS_URL = `${USPS_API_BASE}/shipments/v3/options/search`;


let cachedToken: { value: string; expiresAt: number } | null = null;

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
    const match = String(value || "").match(/^\d{5}/);
    if (!match) throw new Error("A valid 5-digit US destination ZIP Code is required.");
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

const getAccessToken = async (): Promise<string> => {
    if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;

    const clientId = requiredEnv("USPS_CLIENT_ID");
    const clientSecret = requiredEnv("USPS_CLIENT_SECRET");

    const response = await fetch(TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: "client_credentials",
        }),
    });

    const data = await response.json() as {
        access_token?: string;
        expires_in?: number;
        error?: string;
        error_description?: string;
    };

    if (!response.ok || !data.access_token) {
        throw new Error(data.error_description || data.error || "Unable to authenticate with USPS.");
    }

    const expiresIn = Math.max(300, Number(data.expires_in || 3600));
    cachedToken = {
        value: data.access_token,
        expiresAt: Date.now() + expiresIn * 1000,
    };
    return data.access_token;
};

const uspsJson = async <T>(url: string, init: RequestInit): Promise<T> => {
    const token = await getAccessToken();
    const response = await fetch(url, {
        ...init,
        headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
            ...(init.headers || {}),
        },
    });

    const data = await response.json() as T & { error?: string; error_description?: string };
    if (!response.ok) {
        throw new Error(data?.error_description || data?.error || `USPS API request failed (${response.status}).`);
    }
    return data;
};

const packageDescription = (profile: MugProfile) => {
    const girth = 2 * (profile.widthIn + profile.heightIn);
    return {
        weight: profile.weightLb,
        length: profile.lengthIn,
        width: profile.widthIn,
        height: profile.heightIn,
        girth,
        mailClass: "USPS_GROUND_ADVANTAGE",
        mailingDate: new Date().toISOString().slice(0, 10),
    };
};

const extractGroundRate = (payload: any): { price: number; sku: string; days: number | null } => {
    const shippingOptions = Array.isArray(payload?.pricingOptions)
        ? payload.pricingOptions.flatMap((option: any) => option?.shippingOptions || [])
        : [];

    const candidates = shippingOptions
        .filter((option: any) => String(option?.mailClass || "").toUpperCase() === "USPS_GROUND_ADVANTAGE")
        .flatMap((option: any) => Array.isArray(option?.rateOptions)
            ? option.rateOptions.map((rate: any) => ({ ...rate, option }))
            : []);

    const eligible = candidates
        .filter((rate: any) => Number.isFinite(Number(rate?.totalPrice)))
        .sort((a: any, b: any) => Number(a.totalPrice) - Number(b.totalPrice));

    const selected = eligible[0];
    if (!selected) throw new Error("USPS did not return a Ground Advantage rate for this package.");

    const daysMatch = String(selected?.commitment?.name || "").match(/(\d+)/);
    return {
        price: Number(selected.totalPrice),
        sku: String(selected?.rates?.[0]?.SKU || selected?.SKU || ""),
        days: daysMatch ? Number(daysMatch[1]) : null,
    };
};

const quotePackage = async (
    originZip: string,
    destinationZip: string,
    profile: MugProfile,
) => {
    const paymentAccount = process.env.USPS_EPS_ACCOUNT_NUMBER?.trim();
    const pricingOption: Record<string, unknown> = { priceType: "COMMERCIAL" };
    if (paymentAccount) {
        pricingOption.paymentAccount = {
            accountType: "EPS",
            accountNumber: paymentAccount,
        };
    }

    const payload = await uspsJson<any>(SHIPPING_OPTIONS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            pricingOptions: [pricingOption],
            originZIPCode: originZip,
            destinationZIPCode: destinationZip,
            packageDescription: packageDescription(profile),
        }),
    });

    return extractGroundRate(payload);
};

export type UspsTrackingSnapshot = {
    trackingNumber: string;
    status: string | null;
    statusCategory: string | null;
    statusSummary: string | null;
    trackingEvents: Array<{
        eventType?: string | null;
        eventTimestamp?: string | null;
        eventCity?: string | null;
        eventState?: string | null;
        eventZIP?: string | null;
    }>;
};

export const getUspsTracking = async (trackingNumber: string): Promise<UspsTrackingSnapshot | null> => {
    const normalized = String(trackingNumber || "").replace(/[^A-Za-z0-9]/g, "");
    if (!normalized) return null;

    const encodedTracking = encodeURIComponent(normalized);
    try {
        const payload = await uspsJson<any>(
            `${USPS_API_BASE}/tracking/v3/tracking/${encodedTracking}?expand=DETAIL`,
            { method: "GET" },
        );

        return {
            trackingNumber: String(payload?.trackingNumber || normalized),
            status: payload?.status ? String(payload.status) : null,
            statusCategory: payload?.statusCategory ? String(payload.statusCategory) : null,
            statusSummary: payload?.statusSummary ? String(payload.statusSummary) : null,
            trackingEvents: Array.isArray(payload?.trackingEvents)
                ? payload.trackingEvents.slice(0, 10).map((event: any) => ({
                    eventType: event?.eventType ? String(event.eventType) : null,
                    eventTimestamp: event?.eventTimestamp ? String(event.eventTimestamp) : null,
                    eventCity: event?.eventCity ? String(event.eventCity) : null,
                    eventState: event?.eventState ? String(event.eventState) : null,
                    eventZIP: event?.eventZIP ? String(event.eventZIP) : null,
                }))
                : [],
        };
    } catch (error) {
        console.warn("USPS tracking lookup failed; keeping carrier tracking link:", error);
        return null;
    }
};

export const getShippingQuote = async (destination: ShippingAddress, items: ShippingItem[]) => {
    const country = String(destination.country || "US").trim().toUpperCase();
    if (country !== "US") {
        throw new Error("Shipping is currently available within the United States only.");
    }

    const originZip = normalizeZip(requiredEnv("USPS_ORIGIN_ZIP"));
    const destinationZip = normalizeZip(destination.zip);

    const totalQuantity = items.reduce(
        (sum, item) => sum + Math.max(1, Math.floor(Number(item.quantity) || 0)),
        0,
    );

    if (!totalQuantity) throw new Error("At least one shippable item is required.");

    // Each mug is treated as one protective shipping unit. This matches the
    // single-mug box profiles and avoids inventing a multi-mug master carton.
    // The resulting postage is the live USPS rate for each actual package.
    let shippingCents = 0;
    let maxTransitDays = 0;
    const rateIds: string[] = [];

    for (const item of items) {
        const quantity = Math.max(1, Math.floor(Number(item.quantity) || 0));
        const size = item.variant?.size || item.variant?.model || item.name;
        const profile = getProfile(size);

        for (let index = 0; index < quantity; index += 1) {
            const quote = await quotePackage(originZip, destinationZip, profile);
            shippingCents += Math.round(quote.price * 100);
            if (quote.days) maxTransitDays = Math.max(maxTransitDays, quote.days);
            if (quote.sku) rateIds.push(quote.sku);
        }
    }

    return {
        shippingCents,
        shipping: Number((shippingCents / 100).toFixed(2)),
        carrier: "USPS",
        service: "USPS Ground Advantage",
        deliveryDays: maxTransitDays || 5,
        currency: "USD",
        shipmentId: "",
        rateId: rateIds.join(",") || "USPS_GROUND_ADVANTAGE",
    };
};
