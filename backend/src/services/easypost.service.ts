/**
 * EasyPost address verification for checkout.
 *
 * EasyPost standard verification checks US delivery and ZIP+4 data and can
 * return a normalized/corrected address. The API key must remain server-side.
 */

const EASYPOST_API_BASE = "https://api.easypost.com/v2";

type VerifyInput = {
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

export type VerifiedAddress = {
    id: string;
    address: string;
    apartment: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    residential: boolean | null;
    deliveryVerified: boolean;
    zip4Verified: boolean;
};

const requiredApiKey = (): string => {
    const key = process.env.EASYPOST_API_KEY?.trim();
    if (!key) throw new Error("EASYPOST_API_KEY is not configured.");
    return key;
};

const request = async (path: string, body: unknown): Promise<any> => {
    const key = requiredApiKey();
    const auth = Buffer.from(key + ":").toString("base64");

    const response = await fetch(`${EASYPOST_API_BASE}${path}`, {
        method: "POST",
        headers: {
            Accept: "application/json",
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });

    const data = await response.json() as any;
    if (!response.ok) {
        const errors = Array.isArray(data?.error?.errors)
            ? data.error.errors.map((item: any) => item?.message).filter(Boolean).join("; ")
            : "";
        throw new Error(errors || data?.error?.message || "EasyPost address verification failed.");
    }

    return data;
};

export const verifyCheckoutAddress = async (input: VerifyInput): Promise<VerifiedAddress> => {
    const country = String(input.country || "US").trim().toUpperCase();
    if (country !== "US") throw new Error("Shipping is currently available within the United States only.");

    const response = await request("/addresses/create_and_verify", {
        address: {
            name: `${input.firstName || ""} ${input.lastName || ""}`.trim() || undefined,
            street1: String(input.address || "").trim(),
            street2: String(input.apartment || "").trim() || undefined,
            city: String(input.city || "").trim(),
            state: String(input.state || "").trim().toUpperCase(),
            zip: String(input.zip || "").trim(),
            country,
            phone: String(input.phone || "").trim() || undefined,
            email: String(input.email || "").trim().toLowerCase() || undefined,
        },
    });

    const address = response?.address;
    if (!address) throw new Error("EasyPost did not return a verified address.");

    const delivery = address?.verifications?.delivery;
    const zip4 = address?.verifications?.zip4;
    if (!delivery?.success) {
        const message = Array.isArray(delivery?.errors)
            ? delivery.errors.map((item: any) => item?.message).filter(Boolean).join("; ")
            : "";
        throw new Error(message || "The delivery address could not be verified. Please check the street, city, state and ZIP Code.");
    }

    return {
        id: String(address.id || ""),
        address: String(address.street1 || input.address).trim(),
        apartment: String(address.street2 || input.apartment || "").trim(),
        city: String(address.city || input.city).trim(),
        state: String(address.state || input.state).trim().toUpperCase(),
        zip: String(address.zip || input.zip).trim(),
        country: String(address.country || country).trim().toUpperCase(),
        residential: typeof address.residential === "boolean" ? address.residential : null,
        deliveryVerified: Boolean(delivery.success),
        zip4Verified: Boolean(zip4?.success),
    };
};
