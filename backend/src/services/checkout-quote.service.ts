import { getProductById } from "./product.service";
import type { CheckoutCustomerInput, CheckoutItemInput } from "./order.service";

const getConfiguredShippingCents = (zip: string): number => {
    const normalizedZip = String(zip || "").trim().replace(/[^0-9]/g, "").slice(0, 5);
    if (!normalizedZip) throw new Error("A ZIP Code is required to calculate shipping.");
    try {
        const raw = process.env.SHIPPING_ZIP_RATES_CENTS;
        if (!raw) throw new Error("Shipping rates are not configured.");
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        const rates = Object.fromEntries(
            Object.entries(parsed)
                .filter(([, value]) => Number.isFinite(Number(value)) && Number(value) >= 0)
                .map(([key, value]) => [key.trim(), Math.round(Number(value))]),
        ) as Record<string, number>;
        const exact = rates[normalizedZip];
        if (exact !== undefined) return exact;
        const prefix3 = rates[normalizedZip.slice(0, 3)];
        if (prefix3 !== undefined) return prefix3;
        const prefix1 = rates[normalizedZip.slice(0, 1)];
        if (prefix1 !== undefined) return prefix1;
        if (rates.default !== undefined) return rates.default;
        throw new Error("Shipping is not available for this ZIP Code.");
    } catch (error) {
        if (error instanceof Error) throw error;
        throw new Error("Unable to calculate shipping for this ZIP Code.");
    }
};

const calculateTax = async (
    customer: CheckoutCustomerInput,
    items: Array<{ unit_price: number; quantity: number; product_id: string }>,
    shippingCents: number,
): Promise<number> => {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is required for destination-based tax calculation.");

    const params = new URLSearchParams();
    params.set("currency", "usd");
    params.set("customer_details[address][line1]", customer.address || "");
    if (customer.apartment) params.set("customer_details[address][line2]", customer.apartment);
    params.set("customer_details[address][city]", customer.city || "");
    params.set("customer_details[address][state]", (customer.state || "").toUpperCase());
    params.set("customer_details[address][postal_code]", customer.zip || "");
    params.set("customer_details[address][country]", "US");
    params.set("customer_details[address_source]", "shipping");
    params.set("shipping_cost[amount]", String(shippingCents));

    items.forEach((item, index) => {
        params.set(`line_items[${index}][amount]`, String(Math.round(item.unit_price * item.quantity * 100)));
        params.set(`line_items[${index}][quantity]`, String(item.quantity));
        params.set(`line_items[${index}][reference]`, item.product_id);
    });

    const response = await fetch("https://api.stripe.com/v1/tax/calculations", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${stripeKey}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params,
    });
    const data = await response.json() as any;
    if (!response.ok) throw new Error(data?.error?.message || "Unable to calculate sales tax.");
    return Number(data?.tax_amount_exclusive || 0) / 100;
};

export const calculateCheckoutQuote = async (
    customer: CheckoutCustomerInput,
    items: CheckoutItemInput[],
) => {
    if (!customer.firstName?.trim() || !customer.lastName?.trim() || !customer.email?.trim()) {
        throw new Error("Customer information is required.");
    }
    if (!customer.address?.trim() || !customer.city?.trim() || !customer.state?.trim() || !customer.zip?.trim()) {
        throw new Error("A complete shipping address is required to calculate shipping and sales tax.");
    }
    if (!items.length) throw new Error("Your cart is empty.");

    const normalizedItems: Array<{ product_id: string; name: string; unit_price: number; quantity: number }> = [];
    for (const input of items) {
        const quantity = Math.floor(Number(input.quantity));
        if (!input.productId || quantity < 1 || quantity > 99) throw new Error("Invalid cart item.");
        const product = await getProductById(input.productId);
        if (!product || !product.is_active) throw new Error("One of the products is no longer available.");
        normalizedItems.push({
            product_id: String(product.product_id),
            name: String(product.name),
            unit_price: Number(product.price),
            quantity,
        });
    }

    const subtotal = normalizedItems.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
    const shippingCents = getConfiguredShippingCents(customer.zip);
    const shipping = shippingCents / 100;
    const tax = await calculateTax(customer, normalizedItems, shippingCents);
    const total = subtotal + shipping + tax;

    return {
        subtotal: Number(subtotal.toFixed(2)),
        shipping: Number(shipping.toFixed(2)),
        tax: Number(tax.toFixed(2)),
        total: Number(total.toFixed(2)),
        shippingCents,
    };
};