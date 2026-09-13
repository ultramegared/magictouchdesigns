/**
 * ===============================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: ShippingReturnsPage.tsx
 * Module: Frontend
 * Language: TypeScript React
 * Description:
 * Bilingual Shipping & Returns page.
 * ===============================================================
 */

import "./ShippingReturnsPage.css";

import Header from "../../components/layout/Header";
import Footer from "../../components/home/Footer";

import { useLanguage } from "../../contexts/LanguageContext";
import { translations } from "../../translations";

function ShippingReturnsPage() {
    const { language } = useLanguage();
    const t = translations[language].shippingReturns;
    const isSpanish = language === "es";

    return (
        <>
            <Header />

            <main className="shipping-returns-page">
                <section className="shipping-returns-page__hero">
                    <div className="shipping-returns-page__container">
                        <span className="shipping-returns-page__eyebrow">
                            {t.hero.eyebrow}
                        </span>
                        <h1>
                            {t.hero.title}
                            <span>{t.hero.titleAccent}</span>
                        </h1>
                        <div className="shipping-returns-page__divider">
                            <span />
                        </div>
                        <p className="shipping-returns-page__intro">
                            {t.hero.intro}
                        </p>
                    </div>
                </section>

                <section className="shipping-returns-page__content">
                    <div className="shipping-returns-page__container">
                        <article className="shipping-returns-page__section">
                            <h2>{t.shipping.title}</h2>
                            <p>{t.shipping.description}</p>
                        </article>

                        <article className="shipping-returns-page__section">
                            <h2>{t.processing.title}</h2>
                            <p>{t.processing.description}</p>
                        </article>

                        <article className="shipping-returns-page__section">
                            <h2>{isSpanish ? "Política de devoluciones" : "Return Policy"}</h2>
                            <p>
                                {isSpanish
                                    ? "En JQYD — Magic Touch Designs nos esforzamos por entregar productos personalizados con la mejor calidad. Debido a la naturaleza de nuestros productos, aceptamos devoluciones únicamente cuando el artículo presenta un defecto, daño o error atribuible a JQYD."
                                    : "At JQYD — Magic Touch Designs, we strive to deliver personalized products with the highest quality. Due to the nature of our products, we accept returns only when an item has a defect, damage, or error attributable to JQYD."}
                            </p>

                            <h3>{isSpanish ? "Qué aceptamos" : "What we accept"}</h3>
                            <ul>
                                <li>{isSpanish ? "Productos con defectos de fabricación." : "Products with manufacturing defects."}</li>
                                <li>{isSpanish ? "Productos dañados al llegar." : "Products damaged upon arrival."}</li>
                                <li>{isSpanish ? "Errores de producción atribuibles a JQYD." : "Production errors attributable to JQYD."}</li>
                                <li>{isSpanish ? "Productos personalizados que no correspondan con lo solicitado por un error de JQYD." : "Personalized products that do not match the order due to a JQYD error."}</li>
                            </ul>

                            <h3>{isSpanish ? "Qué no aceptamos" : "What we do not accept"}</h3>
                            <ul>
                                <li>{isSpanish ? "Devoluciones por cambio de opinión o porque el cliente ya no quiere el producto." : "Returns because the customer changed their mind or no longer wants the product."}</li>
                                <li>{isSpanish ? "Productos personalizados correctamente elaborados conforme a la información proporcionada por el cliente." : "Personalized products correctly made according to the information provided by the customer."}</li>
                                <li>{isSpanish ? "Daños ocasionados por uso incorrecto, accidente o cuidado inadecuado." : "Damage caused by misuse, accident, or improper care."}</li>
                            </ul>

                            <h3>{isSpanish ? "Plazo para reportar un defecto" : "Defect reporting period"}</h3>
                            <p>
                                {isSpanish
                                    ? "El cliente debe comunicarse con JQYD dentro de los 2 días posteriores a la recepción del pedido. Las solicitudes realizadas después de este plazo pueden no ser elegibles."
                                    : "Customers must contact JQYD within 2 days after receiving the order. Requests submitted after this period may not be eligible."}
                            </p>

                            <h3>{isSpanish ? "Cómo solicitar una devolución" : "How to request a return"}</h3>
                            <p>
                                {isSpanish
                                    ? "La solicitud debe realizarse por WhatsApp e incluir el número de pedido, una descripción clara del problema y fotografías claras y originales que muestren la falla. Las fotografías deben ser auténticas y no estar editadas ni generadas o modificadas mediante inteligencia artificial. JQYD puede solicitar evidencia adicional para revisar el caso."
                                    : "The request must be made through WhatsApp and include the order number, a clear description of the issue, and clear original photos showing the defect. Photos must be authentic and must not be edited or generated or modified using artificial intelligence. JQYD may request additional evidence to review the case."}
                            </p>

                            <h3>{isSpanish ? "Envío del producto" : "Returning the product"}</h3>
                            <p>
                                {isSpanish
                                    ? "Cuando JQYD determine que la solicitud es elegible, el producto deberá enviarse de regreso para su inspección. El cliente paga inicialmente el costo del envío de devolución. Si después de la revisión confirmamos que el defecto o error es responsabilidad de JQYD, reembolsaremos el costo de ese envío."
                                    : "When JQYD determines that a request is eligible, the product must be sent back for inspection. The customer initially pays the return shipping cost. If our review confirms that the defect or error is JQYD's responsibility, we will reimburse the return shipping cost."}
                            </p>

                            <h3>{isSpanish ? "Reemplazo o reembolso" : "Replacement or refund"}</h3>
                            <p>
                                {isSpanish
                                    ? "Después de recibir e inspeccionar el producto, JQYD podrá ofrecer un reemplazo o corrección del producto, o un reembolso, según el caso y el producto. Cuando corresponda un reemplazo, enviaremos el producto corregido o reemplazado después de recibir el artículo devuelto. Cuando corresponda un reembolso, este se procesará después de recibir y revisar el producto."
                                    : "After receiving and inspecting the product, JQYD may provide a replacement or correction, or a refund, depending on the case and product. When a replacement is appropriate, we will send the corrected or replacement product after receiving the returned item. When a refund is appropriate, it will be processed after the product is received and reviewed."}
                            </p>
                        </article>

                        <article className="shipping-returns-page__section">
                            <h2>{t.help.title}</h2>
                            <p>{t.help.description}</p>
                        </article>
                    </div>
                </section>
            </main>

            <Footer />
        </>
    );
}

export default ShippingReturnsPage;
