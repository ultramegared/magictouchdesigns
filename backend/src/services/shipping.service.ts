/**
 * Production shipping policy for JQYDesigns.
 *
 * This service intentionally does not depend on EasyPost. It calculates a
 * deterministic customer-facing Standard Shipping charge from the delivery
 * destination and mug quantity. The charge is real and is included in the
 * Stripe/PayPal order total, but it is not a live carrier postage quote.
 *
 * Live carrier rating can be added later without changing the checkout/payment
 * contract.
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

type ShippingItem = { quantity: number };

const centsFromEnv = (name: string, fallback: number): number => {
    const raw = process.env[name]?.trim();
    if (!raw) return fallback;
    const value = Number(raw);
    if (!Number.isInteger(value) || value < 0) {
        throw new Error(`${name} must be a non-negative integer number of cents.`);
    }
    return value;
};

const normalizeState = (state: string): string => state.trim().toUpperCase();

const getBaseShippingCents = (state: string): number => {
    const normalized = normalizeState(state);
    const akHi = new Set(["AK", "HI"]);
    if (akHi.has(normalized)) {
        return centsFromEnv("SHIPPING_STANDARD_AK_HI_CENTS", 1495);
    }
    return centsFromEnv("SHIPPING_STANDARD_CENTS", 895);
};

const getAdditionalMugCents = (state: string): number => {
    const normalized = normalizeState(state);
    const akHi = new Set(["AK", "HI"]);
    if (akHi.has(normalized)) {
        return centsFromEnv("SHIPPING_STANDARD_AK_HI_ADDITIONAL_MUG_CENTS", 450);
    }
    return centsFromEnv("SHIPPING_STANDARD_ADDITIONAL_MUG_CENTS", 250);
};

export const getShippingQuote = async (destination: ShippingAddress, items: ShippingItem[]) => {
    const country = String(destination.country || "US").trim().toUpperCase();
    if (country !== "US") {
        throw new Error("Shipping is currently available within the United States only.");
    }

    if (!destination.state?.trim() || !destination.zip?.trim()) {
        throw new Error("A complete US delivery destination is required to calculate shipping.");
    }

    const totalQuantity = items.reduce(
        (sum, item) => sum + Math.max(1, Math.floor(Number(item.quantity) || 0)),
        0,
    );

    if (!totalQuantity) {
        throw new Error("At least one shippable item is required.");
    }

    const baseCents = getBaseShippingCents(destination.state);
    const additionalMugCents = getAdditionalMugCents(destination.state);
    const shippingCents = baseCents + Math.max(0, totalQuantity - 1) * additionalMugCents;

    return {
        shippingCents,
        shipping: Number((shippingCents / 100).toFixed(2)),
        carrier: "Standard",
        service: "Standard Shipping",
        deliveryDays: 3,
        currency: "USD",
        shipmentId: "",
        rateId: `standard-${normalizeState(destination.state).toLowerCase()}`,
    };
};
