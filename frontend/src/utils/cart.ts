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
};

const CART_STORAGE_KEY = "magic-touch-cart";
const CART_UPDATED_EVENT = "magic-touch-cart-updated";


export function getCartItems(): CartItem[] {

    try {

        const storedCart =
            localStorage.getItem(CART_STORAGE_KEY);

        if (!storedCart) {
            return [];
        }

        const parsedCart = JSON.parse(storedCart);

        if (!Array.isArray(parsedCart)) {
            return [];
        }

        return parsedCart;

    } catch {

        return [];

    }

}


export function saveCartItems(
    items: CartItem[]
): void {

    localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify(items)
    );

    window.dispatchEvent(
        new Event(CART_UPDATED_EVENT)
    );

}


/**
 * Add a product to the shopping cart.
 *
 * Quantity defaults to 1 so existing product
 * integrations continue working without changes.
 */
export function addToCart(
    item: Omit<CartItem, "quantity">,
    quantity: number = 1
): CartItem[] {

    const currentItems = getCartItems();

    const safeQuantity = Math.max(
        1,
        Math.floor(quantity)
    );

    const existingItem = currentItems.find(
        (cartItem) =>
            cartItem.id === item.id &&
            cartItem.model === item.model &&
            cartItem.size === item.size &&
            cartItem.color === item.color
    );

    let updatedItems: CartItem[];

    if (existingItem) {

        updatedItems = currentItems.map(
            (cartItem) =>
                cartItem === existingItem
                    ? {
                        ...cartItem,
                        quantity:
                            cartItem.quantity + safeQuantity,
                    }
                    : cartItem
        );

    } else {

        updatedItems = [
            ...currentItems,
            {
                ...item,
                quantity: safeQuantity,
            },
        ];

    }

    saveCartItems(updatedItems);

    return updatedItems;

}


export function removeFromCart(
    id: string | number
): CartItem[] {

    const updatedItems = getCartItems().filter(
        (item) => item.id !== id
    );

    saveCartItems(updatedItems);

    return updatedItems;

}


export function updateCartQuantity(
    id: string | number,
    quantity: number
): CartItem[] {

    const updatedItems = getCartItems().map(
        (item) =>
            item.id === id
                ? {
                    ...item,
                    quantity: Math.max(
                        1,
                        Math.floor(quantity)
                    ),
                }
                : item
    );

    saveCartItems(updatedItems);

    return updatedItems;

}


export function clearCart(): void {

    localStorage.removeItem(
        CART_STORAGE_KEY
    );

    window.dispatchEvent(
        new Event(CART_UPDATED_EVENT)
    );

}