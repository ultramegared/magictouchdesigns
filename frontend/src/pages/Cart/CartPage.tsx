/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: CartPage.tsx
 * Module: Frontend
 * Language: TypeScript React
 * Description:
 * Shopping cart page.
 * ================================================================
 */

import { useEffect, useState } from "react";
import "./CartPage.css";
import Header from "../../components/layout/Header";
import Footer from "../../components/home/Footer";
import { getCartItems, getCartSubtotal, removeFromCart, subscribeToCart, updateCartQuantity, type CartItem } from "../../utils/cart";
import { getCustomizationPreview } from "../../utils/customization";

function CartPage() {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    useEffect(() => { const refreshCart = () => setCartItems(getCartItems()); refreshCart(); return subscribeToCart(refreshCart); }, []);
    const updateQuantity = (id: string | number, change: number, model: string, size: string, color: string, customizationId?: string) => { const currentItem = cartItems.find((item) => String(item.id) === String(id) && item.model === model && item.size === size && item.color === color && item.customizationId === customizationId); if (!currentItem) return; setCartItems(updateCartQuantity(id, currentItem.quantity + change, model, size, color, customizationId)); };
    const removeItem = (id: string | number, model: string, size: string, color: string, customizationId?: string) => setCartItems(removeFromCart(id, model, size, color, customizationId));
    const subtotal = getCartSubtotal();
    const delivery = subtotal > 0 ? 5.99 : 0;
    const totalBeforeTax = subtotal + delivery;
    const itemCount = cartItems.reduce((totalItems, item) => totalItems + item.quantity, 0);
    const getItemImage = (item: CartItem) => item.customizationId ? (getCustomizationPreview(item.customizationId) || item.image) : item.image;
    return <><Header /><main className="cart-page"><section className="cart-hero"><div className="cart-hero__background"><img src="/images/cart/cart-hero-background.jpg" alt="Magic Touch Designs custom mug" /></div><div className="cart-hero__overlay" /><div className="cart-hero__content"><span className="cart-eyebrow">YOUR SHOPPING CART</span><h1>Your Cart</h1><p>Review your custom mugs before continuing to checkout.</p></div></section><section className="cart-container"><div className="cart-header"><div><span>CART</span><h2>Your Selected Mugs</h2></div><strong className="cart-count">{itemCount} {itemCount === 1 ? "ITEM" : "ITEMS"}</strong></div><div className="cart-layout"><div className="cart-items">{cartItems.length > 0 ? cartItems.map((item) => <article className="cart-item" key={`${item.id}-${item.model}-${item.size}-${item.color}-${item.customizationId || "standard"}`}><div className="cart-item__image"><img src={getItemImage(item)} alt={item.name} /></div><div className="cart-item__details"><span className="cart-item__label">{item.customizationId ? "CUSTOM MUG" : "MUG"}</span><h3>{item.name}</h3><div className="cart-item__specs"><span>Model: <strong>{item.model}</strong></span><span>Size: <strong>{item.size}</strong></span><span>Color: <strong>{item.color}</strong></span></div>{item.customizationId && <small>Personalized design attached to this cart item.</small>}<button type="button" className="cart-item__remove" onClick={() => removeItem(item.id, item.model, item.size, item.color, item.customizationId)}>Remove</button></div><div className="cart-item__purchase"><div className="cart-quantity"><button type="button" onClick={() => updateQuantity(item.id, -1, item.model, item.size, item.color, item.customizationId)} aria-label={`Decrease quantity of ${item.name}`}>−</button><strong>{item.quantity}</strong><button type="button" onClick={() => updateQuantity(item.id, 1, item.model, item.size, item.color, item.customizationId)} aria-label={`Increase quantity of ${item.name}`}>+</button></div><strong className="cart-item__price">${(item.price * item.quantity).toFixed(2)}</strong></div></article>) : <div className="cart-empty"><span className="cart-empty__icon">🛒</span><h3>Your Cart Is Empty</h3><p>Add a custom mug to your cart to get started.</p></div>}<button type="button" className="cart-continue" onClick={() => window.history.back()}><span>←</span>Continue Shopping</button></div><aside className="cart-summary"><div className="cart-summary__header"><span>ORDER SUMMARY</span><h2>Your Order</h2></div><div className="cart-summary__rows"><div><span>Subtotal</span><strong>${subtotal.toFixed(2)}</strong></div><div><span>Delivery</span><strong>${delivery.toFixed(2)}</strong></div><div><span>Taxes</span><strong>Calculated at checkout</strong></div></div><div className="cart-summary__total"><span>Estimated total before tax</span><strong>${totalBeforeTax.toFixed(2)}</strong></div><button type="button" className="cart-checkout" disabled={cartItems.length === 0} onClick={() => { window.location.href = "/checkout"; }}>Proceed to Checkout<span>→</span></button><div className="cart-secure"><span className="cart-secure__icon">✓</span><div><strong>Secure Checkout</strong><small>Final tax is calculated from the shipping destination.</small></div></div></aside></div></section></main><Footer /></>;
}
export default CartPage;
