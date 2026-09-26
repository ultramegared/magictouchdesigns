import type { CheckoutCustomerInput, CheckoutItemInput } from "./order.service";

export const GENERAL_PHYSICAL_GOODS_TAX_CODE = "txcd_99999999";

type TaxItem = {
    unit_price: number;
    quantity: number;
    product_id: string;
};

export type CheckoutTaxResult = {
    tax: number;
    taxCents: number;
    taxabilityReason: string | null;
    calculationId: string | null;
};

const requireStripeKey = (): string => {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is required for destination-based tax calculation.");
    return key;
};

export const calculateDestinationTax = async (
    customer: CheckoutCustomerInput,
    items: TaxItem[],
    shippingCents: number,
): Promise<CheckoutTaxResult> => {
    const params = new URLSearchParams();
    params.set("currency", "usd");
    params.set("customer_details[address][line1]", customer.address || "");
    if (customer.apartment) params.set("customer_details[address][line2]", customer.apartment);
    params.set("customer_details[address][city]", customer.city || "");
    params.set("customer_details[address][state]", (customer.state || "").trim().toUpperCase());
    params.set("customer_details[address][postal_code]", customer.zip || "");
    params.set("customer_details[address][country]", "US");
    params.set("customer_details[address_source]", "shipping");
    params.set("shipping_cost[amount]", String(Math.max(0, Math.round(shippingCents))));
    params.set("shipping_cost[tax_behavior]", "exclusive");

    items.forEach((item, index) => {
        params.set(`line_items[${index}][amount]`, String(Math.round(item.unit_price * item.quantity * 100)));
        params.set(`line_items[${index}][quantity]`, String(item.quantity));
        params.set(`line_items[${index}][reference]`, item.product_id);
        params.set(`line_items[${index}][tax_code]`, GENERAL_PHYSICAL_GOODS_TAX_CODE);
        params.set(`line_items[${index}][tax_behavior]`, "exclusive");
    });

    const response = await fetch("https://api.stripe.com/v1/tax/calculations", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${requireStripeKey()}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params,
    });

    const data = await response.json() as any;
    if (!response.ok) {
        throw new Error(data?.error?.message || "Unable to calculate sales tax.");
    }

    const taxCents = Math.max(0, Math.round(Number(data?.tax_amount_exclusive || 0)));
    return {
        tax: Number((taxCents / 100).toFixed(2)),
        taxCents,
        taxabilityReason: data?.taxability_reason ? String(data.taxability_reason) : null,
        calculationId: data?.id ? String(data.id) : null,
    };
};
