import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Header from "../../components/layout/Header";
import Footer from "../../components/home/Footer";
import { clearCart } from "../../utils/cart";
import "./CheckoutSuccessPage.css";

const API_URL = "https://api.magictouchdesigns.com/api";
const PAYPAL_CONFIRMATION_KEY = "mtd-paypal-confirmation";

type Order = {
    order_code: string;
    payment_status: string;
    status: string;
    total: string | number;
    customer_first_name: string;
    customer_last_name: string;
};

function CheckoutSuccessPage() {
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get("session_id");
    const isPayPal = searchParams.get("paypal") === "1";
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const confirmStripe = async () => {
            if (!sessionId) throw new Error("The checkout session could not be found.");
            const response = await fetch(`${API_URL}/orders/session/${encodeURIComponent(sessionId)}`);
            if (!response.ok) throw new Error("Order confirmation is not available yet.");
            return response.json() as Promise<Order>;
        };

        const confirmPayPal = async () => {
            const raw = sessionStorage.getItem(PAYPAL_CONFIRMATION_KEY);
            if (!raw) throw new Error("PayPal confirmation details could not be found. Use Track My Order if needed.");
            const confirmation = JSON.parse(raw) as { orderCode?: string; email?: string };
            if (!confirmation.orderCode || !confirmation.email) throw new Error("PayPal confirmation details are incomplete.");
            const response = await fetch(`${API_URL}/orders/${encodeURIComponent(confirmation.orderCode)}?email=${encodeURIComponent(confirmation.email)}`);
            if (!response.ok) throw new Error("PayPal order confirmation is not available yet.");
            return response.json() as Promise<Order>;
        };

        const confirm = isPayPal ? confirmPayPal : confirmStripe;
        confirm()
            .then((data) => {
                setOrder(data);
                if (data.payment_status === "paid") {
                    clearCart();
                    if (isPayPal) sessionStorage.removeItem(PAYPAL_CONFIRMATION_KEY);
                }
            })
            .catch((requestError: unknown) => {
                setError(requestError instanceof Error ? requestError.message : "Unable to confirm the order.");
            })
            .finally(() => setLoading(false));
    }, [isPayPal, sessionId]);

    return (
        <>
            <Header />
            <main className="checkout-success-page">
                <section className="checkout-success-card">
                    {loading ? (
                        <>
                            <span className="checkout-success-eyebrow">PROCESSING PAYMENT</span>
                            <h1>Confirming your order…</h1>
                            <p>Please wait while we confirm your secure payment.</p>
                        </>
                    ) : order ? (
                        <>
                            <div className="checkout-success-icon">✓</div>
                            <span className="checkout-success-eyebrow">PAYMENT CONFIRMED</span>
                            <h1>Thank You for Your Order</h1>
                            <p>We received your purchase successfully.</p>
                            <strong className="checkout-success-order">{order.order_code}</strong>
                            <p className="checkout-success-total">
                                Total paid: <strong>${Number(order.total).toFixed(2)}</strong>
                            </p>
                            <div className="checkout-success-actions">
                                <Link to={`/track-order?order=${encodeURIComponent(order.order_code)}`}>Track My Order</Link>
                                <Link to="/">Continue Shopping</Link>
                            </div>
                        </>
                    ) : (
                        <>
                            <span className="checkout-success-eyebrow">ORDER STATUS</span>
                            <h1>We’re Confirming Your Order</h1>
                            <p>{error || "Your payment was submitted, but confirmation is still being processed."}</p>
                            <Link className="checkout-success-primary" to="/track-order">Track My Order</Link>
                        </>
                    )}
                </section>
            </main>
            <Footer />
        </>
    );
}

export default CheckoutSuccessPage;
