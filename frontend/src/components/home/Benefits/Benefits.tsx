import { useEffect, useState } from "react";
import { Truck, Flag, Gem, ShieldCheck } from "lucide-react";
import { apiRequest } from "../../../services/api";
import { useLanguage } from "../../../contexts/LanguageContext";
import "./Benefits.css";

interface BenefitConfig {
    id: string;
    icon: string;
    title: { en: string; es: string };
    description: { en: string; es: string };
    active: boolean;
    order: number;
}

const fallbackBenefits: BenefitConfig[] = [
    { id: "benefit-1", icon: "truck", title: { en: "Fast Shipping", es: "Envío rápido" }, description: { en: "2–5 business days directly to your door.", es: "De 2 a 5 días hábiles directamente hasta tu puerta." }, active: true, order: 1 },
    { id: "benefit-2", icon: "flag", title: { en: "Made in USA", es: "Hecho en EE. UU." }, description: { en: "Proudly designed and printed in the United States.", es: "Diseñado e impreso con orgullo en Estados Unidos." }, active: true, order: 2 },
    { id: "benefit-3", icon: "gem", title: { en: "Premium Quality", es: "Calidad premium" }, description: { en: "High-quality ceramic with vibrant long-lasting prints.", es: "Cerámica de alta calidad con impresiones vibrantes y duraderas." }, active: true, order: 3 },
    { id: "benefit-4", icon: "shield-check", title: { en: "Secure Checkout", es: "Pago seguro" }, description: { en: "100% secure payments with trusted providers.", es: "Pagos 100% seguros con proveedores de confianza." }, active: true, order: 4 },
];

const icons = { truck: Truck, flag: Flag, gem: Gem, "shield-check": ShieldCheck } as const;

function Benefits() {
    const { language } = useLanguage();
    const [items, setItems] = useState<BenefitConfig[]>(fallbackBenefits);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            try {
                const response = await apiRequest<{ settings?: { config?: { benefits?: BenefitConfig[] } } }>(
                    "/api/settings?app_refresh=" + Date.now(),
                    { cache: "no-store" }
                );
                const configured = response.settings?.config?.benefits;
                if (!cancelled && Array.isArray(configured) && configured.length) {
                    setItems(configured);
                }
            } catch {
                try {
                    const cached = localStorage.getItem("mtd_site_config");
                    const config = cached ? JSON.parse(cached) : null;
                    if (!cancelled && Array.isArray(config?.benefits) && config.benefits.length) {
                        setItems(config.benefits);
                    }
                } catch {
                    // Keep the production-safe fallback.
                }
            }
        };
        void load();
        const onUpdate = () => {
            try {
                const cached = localStorage.getItem("mtd_site_config");
                const config = cached ? JSON.parse(cached) : null;
                if (Array.isArray(config?.benefits) && config.benefits.length) setItems(config.benefits);
            } catch {
                // Ignore malformed local cache.
            }
        };
        window.addEventListener("mtd-site-config-updated", onUpdate);
        return () => {
            cancelled = true;
            window.removeEventListener("mtd-site-config-updated", onUpdate);
        };
    }, []);

    return (
        <section className="benefits">
            <div className="benefits__container">
                {items
                    .filter(item => item.active)
                    .sort((a, b) => a.order - b.order)
                    .map(benefit => {
                        const Icon = icons[benefit.icon as keyof typeof icons] || ShieldCheck;
                        return (
                            <article key={benefit.id} className="benefit">
                                <div className="benefit__icon"><Icon size={38} /></div>
                                <div className="benefit__content">
                                    <h3>{benefit.title[language] || benefit.title.en}</h3>
                                    <p>{benefit.description[language] || benefit.description.en}</p>
                                </div>
                            </article>
                        );
                    })}
            </div>
        </section>
    );
}

export default Benefits;
