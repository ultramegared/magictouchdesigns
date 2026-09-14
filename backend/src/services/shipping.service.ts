/**
 * Destination-based shipping through EasyPost.
 * Secrets and the ship-from address remain server-side environment variables.
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
type ParcelProfile = { length: number; width: number; height: number; weight: number };

const EASYPOST_API = "https://api.easypost.com/v2";

// JQYDDesigns shipping rule: one 15 oz mug = 15 oz billable product weight.
// Quantity scales linearly: 2 mugs = 30 oz, 3 = 45 oz, 4 = 60 oz, etc.
const MUG_WEIGHT_OZ = 15;

const requiredEnv = (name: string): string => {
    const value = process.env[name]?.trim();
    if (!value) throw new Error(`${name} is not configured.`);
    return value;
};

const parseOrigin = () => {
    const raw = requiredEnv("SHIPPING_ORIGIN_ADDRESS_JSON");
    const value = JSON.parse(raw) as Record<string, unknown>;
    if (!value.street1 || !value.city || !value.state || !value.zip) {
        throw new Error("SHIPPING_ORIGIN_ADDRESS_JSON is incomplete.");
    }
    return value;
};

const parseProfiles = (): ParcelProfile[] => {
    const raw = requiredEnv("SHIPPING_PACKAGE_PROFILES_JSON");
    const value = JSON.parse(raw) as unknown;
    if (!Array.isArray(value) || !value.length) throw new Error("SHIPPING_PACKAGE_PROFILES_JSON must contain at least one package profile.");
    const profiles = value.map((entry) => {
        const item = entry as Record<string, unknown>;
        const profile = {
            length: Number(item.length),
            width: Number(item.width),
            height: Number(item.height),
            // Weight is controlled by the JQYDDesigns 15 oz-per-mug rule below.
            weight: MUG_WEIGHT_OZ,
        };
        if (![profile.length, profile.width, profile.height, profile.weight].every((n) => Number.isFinite(n) && n > 0)) {
            throw new Error("Invalid shipping package profile. Dimensions are inches and weight is ounces.");
        }
        return profile;
    });
    return profiles;
};

const buildParcel = (items: ShippingItem[]): ParcelProfile => {
    const profiles = parseProfiles();
    const totalQuantity = items.reduce((sum, item) => sum + Math.max(1, Math.floor(Number(item.quantity) || 0)), 0);
    const base = profiles[0];

    // Product weight is exactly 15 oz per mug and scales linearly with quantity.
    // Dimensions scale conservatively for multiple mugs so EasyPost can quote a realistic parcel.
    return {
        length: base.length,
        width: base.width,
        height: Number((base.height * Math.max(1, Math.ceil(totalQuantity / 2))).toFixed(1)),
        weight: Number((MUG_WEIGHT_OZ * totalQuantity).toFixed(1)),
    };
};

export const getShippingQuote = async (destination: ShippingAddress, items: ShippingItem[]) => {
    const apiKey = requiredEnv("EASYPOST_API_KEY");
    const origin = parseOrigin();
    const parcel = buildParcel(items);
    const country = destination.country || "US";

    const payload = {
        shipment: {
            from_address: origin,
            to_address: {
                name: `${destination.firstName || ""} ${destination.lastName || ""}`.trim() || undefined,
                email: destination.email || undefined,
                phone: destination.phone || undefined,
                street1: destination.address,
                street2: destination.apartment || undefined,
                city: destination.city,
                state: destination.state,
                zip: destination.zip,
                country,
            },
            parcel,
        },
    };

    const response = await fetch(`${EASYPOST_API}/shipments`, {
        method: "POST",
        headers: {
            Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });
    const data = await response.json() as any;
    if (!response.ok) {
        const providerMessage = data?.error?.message || data?.messages?.map((m: any) => m?.message).filter(Boolean).join("; ");
        throw new Error(providerMessage || "Unable to calculate shipping rates.");
    }

    const rates = Array.isArray(data?.rates) ? data.rates : [];
    const usable = rates
        .map((rate: any) => ({
            id: String(rate.id || ""),
            carrier: String(rate.carrier || ""),
            service: String(rate.service || ""),
            amount: Number(rate.rate),
            currency: String(rate.currency || "USD"),
            deliveryDays: Number.isFinite(Number(rate.delivery_days)) ? Number(rate.delivery_days) : null,
        }))
        .filter((rate: any) => rate.id && Number.isFinite(rate.amount) && rate.amount >= 0);

    if (!usable.length) throw new Error("No shipping rates are available for this destination.");

    const preferred = usable.filter((rate: any) => !/express|overnight|next.?day/i.test(`${rate.service} ${rate.carrier}`));
    const selected = [...(preferred.length ? preferred : usable)].sort((a, b) => a.amount - b.amount)[0];
    const shippingCents = Math.round(selected.amount * 100);

    return {
        shippingCents,
        shipping: Number(selected.amount.toFixed(2)),
        carrier: selected.carrier,
        service: selected.service,
        deliveryDays: selected.deliveryDays,
        currency: selected.currency,
        shipmentId: String(data.id || ""),
        rateId: selected.id,
    };
};
