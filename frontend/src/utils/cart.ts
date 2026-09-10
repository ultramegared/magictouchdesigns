/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: cart.ts
 * Module: Frontend
 * Language: TypeScript
 * Description:
 * Shared shopping cart utilities.
 * ================================================================
 */

export type CartItem = {
    id: string | number;
    name: string;
    model: string;
    size: string;
    color: string;
    price: number;
    quantity: number;
    image: string;
    customizationId?: string;
};

const CART_STORAGE_KEY = "magic-touch-cart";
const CART_UPDATED_EVENT = "magic-touch-cart-updated";

function normalizeQuantity(quantity: number): number {
    if (!Number.isFinite(quantity)) {
        return 1;
    }

    return Math.max(1, Math.floor(quantity));
}

function normalizeCartItem(item: CartItem): CartItem | null {
    if (!item || item.id === undefined || item.id === null) {
        return null;
    }

    const price = Number(item.price);

    if (!Number.isFinite(price) || price < 0) {
        return null;
    }

    return {
        ...item,
        price,
        quantity: normalizeQuantity(Number(item.quantity)),
        name: String(item.name ?? ""),
        model: String(item.model ?? ""),
        size: String(item.size ?? ""),
        color: String(item.color ?? ""),
        image: String(item.image ?? ""),
        customizationId: item.customizationId
            ? String(item.customizationId)
            : undefined,
    };
}

export function getCartItems(): CartItem[] {
    try {
        const storedCart = localStorage.getItem(CART_STORAGE_KEY);

        if (!storedCart) {
            return [];
        }

        const parsedCart: unknown = JSON.parse(storedCart);

        if (!Array.isArray(parsedCart)) {
            return [];
        }

        return parsedCart
            .map((item) => normalizeCartItem(item as CartItem))
            .filter((item): item is CartItem => item !== null);
    } catch {
        return [];
    }
}

export function saveCartItems(items: CartItem[]): void {
    const safeItems = items
        .map(normalizeCartItem)
        .filter((item): item is CartItem => item !== null);

    localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify(safeItems)
    );

    window.dispatchEvent(new Event(CART_UPDATED_EVENT));
}

export function addToCart(
    item: Omit<CartItem, "quantity">,
    quantity: number = 1
): CartItem[] {
    const currentItems = getCartItems();
    const safeQuantity = normalizeQuantity(quantity);

    const existingItemIndex = currentItems.findIndex(
        (cartItem) =>
            String(cartItem.id) === String(item.id) &&
            cartItem.model === item.model &&
            cartItem.size === item.size &&
            cartItem.color === item.color &&
            cartItem.customizationId === item.customizationId
    );

    if (existingItemIndex >= 0) {
        const updatedItems = [...currentItems];

        updatedItems[existingItemIndex] = {
            ...updatedItems[existingItemIndex],
            quantity:
                updatedItems[existingItemIndex].quantity + safeQuantity,
        };

        saveCartItems(updatedItems);
        return updatedItems;
    }

    const updatedItems = [
        ...currentItems,
        {
            ...item,
            quantity: safeQuantity,
        },
    ];

    saveCartItems(updatedItems);
    return updatedItems;
}

export function removeFromCart(
    id: string | number,
    model?: string,
    size?: string,
    color?: string,
    customizationId?: string
): CartItem[] {
    const updatedItems = getCartItems().filter((item) => {
        const sameId = String(item.id) === String(id);

        if (!sameId) {
            return true;
        }

        if (model !== undefined && item.model !== model) {
            return true;
        }

        if (size !== undefined && item.size !== size) {
            return true;
        }

        if (color !== undefined && item.color !== color) {
            return true;
        }

        if (
            customizationId !== undefined &&
            item.customizationId !== customizationId
        ) {
            return true;
        }

        return false;
    });

    saveCartItems(updatedItems);
    return updatedItems;
}

export function updateCartQuantity(
    id: string | number,
    quantity: number,
    model?: string,
    size?: string,
    color?: string,
    customizationId?: string
): CartItem[] {
    const safeQuantity = normalizeQuantity(quantity);

    const updatedItems = getCartItems().map((item) => {
        const sameId = String(item.id) === String(id);
        const sameVariant =
            (model === undefined || item.model === model) &&
            (size === undefined || item.size === size) &&
            (color === undefined || item.color === color) &&
            (customizationId === undefined ||
                item.customizationId === customizationId);

        if (!sameId || !sameVariant) {
            return item;
        }

        return {
            ...item,
            quantity: safeQuantity,
        };
    });

    saveCartItems(updatedItems);
    return updatedItems;
}

export function getCartItemCount(): number {
    return getCartItems().reduce(
        (total, item) => total + item.quantity,
        0
    );
}

export function getCartSubtotal(): number {
    return getCartItems().reduce(
        (total, item) => total + item.price * item.quantity,
        0
    );
}

export function clearCart(): void {
    localStorage.removeItem(CART_STORAGE_KEY);
    window.dispatchEvent(new Event(CART_UPDATED_EVENT));
}

export function subscribeToCart(
    callback: () => void
): () => void {
    const handleCartUpdate = () => callback();

    window.addEventListener(CART_UPDATED_EVENT, handleCartUpdate);
    window.addEventListener("storage", handleCartUpdate);

    return () => {
        window.removeEventListener(CART_UPDATED_EVENT, handleCartUpdate);
        window.removeEventListener("storage", handleCartUpdate);
    };
}
