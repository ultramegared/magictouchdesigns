import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package, ArrowLeft, CalendarDays, CreditCard, MapPin } from "lucide-react";
import Header from "../../components/layout/Header";
import Footer from "../../components/home/Footer";
import { apiRequest } from "../../services/api";
import { useLanguage } from "../../contexts/LanguageContext";
import "./Orders.css";

type OrderItem = {
    id: string;
    product_id: string;
    product_name: string;
    image_url: string | null;
    unit_price: number | string;
    quantity: number;
    variant: Record<string, string>;
};

type Order = {
    id: string;
    order_code: string;
    subtotal: number | string;
    shipping: number | string;
    tax: number | string;
    total: number | string;
    currency: string;
    payment_status: string;
    status: string;
    carrier: string | null;
    tracking_number: string | null;
    created_at: string;
    items: OrderItem[];
};

const money = (value: number | string, currency = "USD") =>
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(Number(value || 0));

function Orders() {
    const navigate = useNavigate();
    const { language } = useLanguage();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadOrders = async () => {
            const token = localStorage.getItem("auth_token");
            if (!token) {
                navigate("/login", { replace: true });
                return;
            }

            try {
                const result = await apiRequest<{ status: string; orders: Order[] }>(
                    "/api/orders/mine",
                    { headers: { Authorization: `Bearer ${token}` } },
                );
                setOrders(result.orders || []);
            } catch (err) {
                console.error("Unable to load orders:", err);
                setError(
                    language === "es"
                        ? "No pudimos cargar tus compras. Intenta nuevamente."
                        : "We could not load your purchases. Please try again.",
                );
            } finally {
                setLoading(false);
            }
        };

        void loadOrders();
    }, [language, navigate]);

    const statusLabel = (status: string) => {
        const labels: Record<string, [string, string]> = {
            paid: ["Pagado", "Paid"],
            pending_payment: ["Pago pendiente", "Payment pending"],
            processing: ["Procesando", "Processing"],
            shipped: ["Enviado", "Shipped"],
            delivered: ["Entregado", "Delivered"],
            cancelled: ["Cancelado", "Cancelled"],
            payment_setup_failed: ["Pago no iniciado", "Payment setup failed"],
        };
        const pair = labels[status] || [status.replaceAll("_", " "), status.replaceAll("_", " ")];
        return language === "es" ? pair[0] : pair[1];
    };

    return (
        <>
            <Header />
            <main className="account-orders">
                <section className="account-orders__hero">
                    <div className="account-orders__hero-inner">
                        <button type="button" className="account-orders__back" onClick={() => navigate("/account")}>
                            <ArrowLeft size={17} />
                            {language === "es" ? "Volver a mi cuenta" : "Back to my account"}
                        </button>
                        <span className="account-orders__eyebrow">{language === "es" ? "MI HISTORIAL" : "MY HISTORY"}</span>
                        <h1>{language === "es" ? "Últimas compras" : "Recent purchases"}</h1>
                        <p>
                            {language === "es"
                                ? "Aquí encontrarás únicamente los pedidos asociados a tu cuenta."
                                : "Here you will find only the orders associated with your account."}
                        </p>
                    </div>
                </section>

                <section className="account-orders__content">
                    {loading && (
                        <div className="account-orders__state">
                            <Package size={30} />
                            <h2>{language === "es" ? "Cargando compras..." : "Loading purchases..."}</h2>
                        </div>
                    )}

                    {!loading && error && (
                        <div className="account-orders__state account-orders__state--error">
                            <h2>{error}</h2>
                            <button type="button" onClick={() => window.location.reload()}>
                                {language === "es" ? "Intentar de nuevo" : "Try again"}
                            </button>
                        </div>
                    )}

                    {!loading && !error && orders.length === 0 && (
                        <div className="account-orders__state">
                            <Package size={42} />
                            <h2>{language === "es" ? "Aún no tienes compras" : "You have no purchases yet"}</h2>
                            <p>
                                {language === "es"
                                    ? "Cuando realices tu primer pedido, aparecerá aquí."
                                    : "Your first order will appear here once you place it."}
                            </p>
                            <button type="button" onClick={() => navigate("/products")}>
                                {language === "es" ? "Ver productos" : "Browse products"}
                            </button>
                        </div>
                    )}

                    {!loading && !error && orders.length > 0 && (
                        <div className="account-orders__list">
                            {orders.map((order) => (
                                <article className="account-order-card" key={order.id}>
                                    <header className="account-order-card__header">
                                        <div>
                                            <span>{language === "es" ? "PEDIDO" : "ORDER"}</span>
                                            <strong>{order.order_code}</strong>
                                        </div>
                                        <div className="account-order-card__status">{statusLabel(order.status)}</div>
                                    </header>

                                    <div className="account-order-card__meta">
                                        <span><CalendarDays size={16} />{new Date(order.created_at).toLocaleDateString(language === "es" ? "es-US" : "en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
                                        <span><CreditCard size={16} />{statusLabel(order.payment_status)}</span>
                                        {order.carrier && order.tracking_number && <span><MapPin size={16} />{order.carrier}: {order.tracking_number}</span>}
                                    </div>

                                    <div className="account-order-card__items">
                                        {order.items.map((item) => (
                                            <div className="account-order-item" key={item.id}>
                                                {item.image_url ? (
                                                    <img src={item.image_url} alt={item.product_name} />
                                                ) : (
                                                    <div className="account-order-item__placeholder"><Package size={20} /></div>
                                                )}
                                                <div className="account-order-item__info">
                                                    <strong>{item.product_name}</strong>
                                                    <span>
                                                        {language === "es" ? "Cantidad" : "Quantity"}: {item.quantity}
                                                        {item.variant?.model ? ` · ${item.variant.model}` : ""}
                                                        {item.variant?.size ? ` · ${item.variant.size}` : ""}
                                                        {item.variant?.color ? ` · ${item.variant.color}` : ""}
                                                    </span>
                                                </div>
                                                <b>{money(Number(item.unit_price) * item.quantity, order.currency)}</b>
                                            </div>
                                        ))}
                                    </div>

                                    <footer className="account-order-card__footer">
                                        <span>{language === "es" ? "Total" : "Total"}</span>
                                        <strong>{money(order.total, order.currency)}</strong>
                                    </footer>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </main>
            <Footer />
        </>
    );
}

export default Orders;
