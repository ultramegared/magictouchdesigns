import { getProductById } from "./product.service";
import type { CheckoutCustomerInput, CheckoutItemInput } from "./order.service";
import { getShippingQuote } from "./shipping.service";
import { calculateDestinationTax } from "./tax.service";

export const calculateCheckoutQuote = async (
    customer: CheckoutCustomerInput,
    items: CheckoutItemInput[],
    customRequestId?: string,
) => {
    if (!customer.firstName?.trim() || !customer.lastName?.trim() || !customer.email?.trim()) {
        throw new Error("Customer information is required.");
    }
    if (!customer.address?.trim() || !customer.city?.trim() || !customer.state?.trim() || !customer.zip?.trim()) {
        throw new Error("A complete shipping address is required to calculate shipping and sales tax.");
    }
    if (!items.length) throw new Error("Your cart is empty.");

    const normalizedItems: Array<{ product_id: string; name: string; unit_price: number; quantity: number }> = [];
    const inputs = customRequestId
        ? [{ productId: "CUSTOM-MUG", quantity: 1, customRequestId } as CheckoutItemInput]
        : items;
    for (const input of inputs) {
        if (input.customRequestId) {
            const { getCustomMugRequest } = await import("./custom-mug.service");
            const request = await getCustomMugRequest(input.customRequestId);
            if (!request || request.status !== "pending") throw new Error("This custom mug request is no longer available.");
            if (request.email.trim().toLowerCase() !== customer.email.trim().toLowerCase()) throw new Error("The checkout email must match the custom mug request email.");
            normalizedItems.push({
                product_id: "CUSTOM-MUG",
                name: `Custom Mug — ${request.model} ${request.size}`,
                unit_price: Number(request.unit_price),
                quantity: Number(request.quantity),
            });
            continue;
        }

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
    const shippingQuote = await getShippingQuote(
        {
            firstName: customer.firstName,
            lastName: customer.lastName,
            email: customer.email,
            phone: customer.phone,
            address: customer.address,
            apartment: customer.apartment,
            city: customer.city,
            state: customer.state,
            zip: customer.zip,
            country: "US",
        },
        normalizedItems,
    );
    const shippingCents = shippingQuote.shippingCents;
    const shipping = shippingCents / 100;
    const verifiedAddress = shippingQuote.verifiedAddress;
    const taxCustomer: CheckoutCustomerInput = {
        ...customer,
        address: verifiedAddress.address,
        apartment: verifiedAddress.apartment,
        city: verifiedAddress.city,
        state: verifiedAddress.state,
        zip: verifiedAddress.zip,
    };
    const taxResult = await calculateDestinationTax(taxCustomer, normalizedItems, shippingCents);
    const tax = taxResult.tax;
    const total = subtotal + shipping + tax;

    return {
        subtotal: Number(subtotal.toFixed(2)),
        shipping: Number(shipping.toFixed(2)),
        tax: Number(tax.toFixed(2)),
        taxabilityReason: taxResult.taxabilityReason,
        total: Number(total.toFixed(2)),
        shippingCents,
        shippingCarrier: shippingQuote.carrier,
        shippingService: shippingQuote.service,
        shippingDeliveryDays: shippingQuote.deliveryDays,
        shippingShipmentId: shippingQuote.shipmentId,
        shippingRateId: shippingQuote.rateId,
        addressVerified: verifiedAddress.deliveryVerified,
        zip4Verified: verifiedAddress.zip4Verified,
        verifiedAddress: {
            address: verifiedAddress.address,
            apartment: verifiedAddress.apartment,
            city: verifiedAddress.city,
            state: verifiedAddress.state,
            zip: verifiedAddress.zip,
            residential: verifiedAddress.residential,
        },
    };
};
