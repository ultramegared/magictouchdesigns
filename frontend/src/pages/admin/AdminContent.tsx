import { useEffect, useState } from "react";
import { CheckCircle2, LoaderCircle, Save, Truck, Flag, Gem, ShieldCheck } from "lucide-react";
import AdminSidebar from "./AdminSidebar";
import { apiRequest } from "../../services/api";
import "./AdminContent.css";

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

const iconFor = (icon: string) =>
    icon === "truck" ? <Truck size={26} /> :
    icon === "flag" ? <Flag size={26} /> :
    icon === "gem" ? <Gem size={26} /> :
    <ShieldCheck size={26} />;

const AdminContent = () => {
    const [benefits, setBenefits] = useState<BenefitConfig[]>(fallbackBenefits);
    const [enabled, setEnabled] = useState(true);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        void (async () => {
            try {
                const response = await apiRequest<{ settings: { config?: { benefits?: BenefitConfig[]; benefitsEnabled?: boolean } } }>(
                    "/api/settings?app_refresh=" + Date.now(),
                    { cache: "no-store" }
                );
                const loaded = response.settings?.config?.benefits;
                if (Array.isArray(loaded) && loaded.length) {
                    setBenefits(loaded.slice().sort((a, b) => a.order - b.order).slice(0, 4));
                }
                if (typeof response.settings?.config?.benefitsEnabled === "boolean") {
                    setEnabled(response.settings.config.benefitsEnabled);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const updateBenefit = (
        index: number,
        section: "title" | "description",
        language: "en" | "es",
        value: string
    ) => {
        setBenefits(current =>
            current.map((benefit, benefitIndex) =>
                benefitIndex === index
                    ? {
                        ...benefit,
                        [section]: {
                            ...benefit[section],
                            [language]: value,
                        },
                    }
                    : benefit
            )
        );
    };

    const save = async () => {
        setSaving(true);
        try {
            const currentResponse = await apiRequest<{
                settings: {
                    config?: Record<string, unknown>;
                    websiteName?: string;
                    browserTitle?: string;
                };
            }>("/api/settings?app_refresh=" + Date.now(), { cache: "no-store" });

            await apiRequest("/api/settings", {
                method: "PUT",
                body: JSON.stringify({
                    websiteName: currentResponse.settings?.websiteName,
                    browserTitle: currentResponse.settings?.browserTitle,
                    config: {
                        ...(currentResponse.settings?.config || {}),
                        benefits,
                        benefitsEnabled: enabled,
                    },
                }),
            });

            window.dispatchEvent(new Event("mtd-site-config-updated"));
            alert("Homepage Content saved successfully.");
        } catch (error) {
            console.error(error);
            alert(error instanceof Error ? error.message : "Unable to save homepage content.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="admin-content-layout">
            <AdminSidebar username="Administrator" />

            <main className="admin-content-page">
                <header className="admin-content-header">
                    <div>
                        <span className="admin-content-eyebrow">Website Content</span>
                        <h1>Content</h1>
                        <p>Manage the homepage benefit section as one block. All four cards are saved together.</p>
                    </div>
                </header>

                <section className="admin-content-panel admin-benefits-panel">
                    <div className="admin-content-panel-head">
                        <div>
                            <strong>Homepage Benefit Cards</strong>
                            <span>4 cards · edit the content below · one shared Save button</span>
                        </div>
                        <button
                            className="admin-content-primary"
                            onClick={() => void save()}
                            disabled={saving || loading}
                        >
                            {saving ? <LoaderCircle className="spin" size={17} /> : <Save size={17} />}
                            {saving ? "Saving…" : "Save content"}
                        </button>
                    </div>

                    {loading ? (
                        <div className="admin-content-loading">
                            <LoaderCircle className="spin" />
                            Loading homepage content…
                        </div>
                    ) : (
                        <div className="admin-benefits-single">
                            <label className="admin-benefits-global-toggle">
                                <input
                                    type="checkbox"
                                    checked={enabled}
                                    onChange={event => setEnabled(event.target.checked)}
                                />
                                <span>
                                    <strong>Show all four cards</strong>
                                    <small>This single setting applies to the complete four-card block.</small>
                                </span>
                                <CheckCircle2 size={22} />
                            </label>

                            <div className="admin-benefits-grid">
                                {benefits.map((benefit, index) => (
                                    <article className="admin-benefit-card" key={benefit.id}>
                                        <div className="admin-benefit-card-head">
                                            <strong>Card {index + 1}</strong>
                                            <div className="admin-benefit-preview-icon">
                                                {iconFor(benefit.icon)}
                                            </div>
                                        </div>

                                        <div className="admin-benefit-fields">
                                            <label>
                                                <span>Title — English</span>
                                                <input
                                                    value={benefit.title.en}
                                                    onChange={event =>
                                                        updateBenefit(index, "title", "en", event.target.value)
                                                    }
                                                />
                                            </label>

                                            <label>
                                                <span>Title — Spanish</span>
                                                <input
                                                    value={benefit.title.es}
                                                    onChange={event =>
                                                        updateBenefit(index, "title", "es", event.target.value)
                                                    }
                                                />
                                            </label>

                                            <label className="full">
                                                <span>Description — English</span>
                                                <textarea
                                                    rows={3}
                                                    value={benefit.description.en}
                                                    onChange={event =>
                                                        updateBenefit(index, "description", "en", event.target.value)
                                                    }
                                                />
                                            </label>

                                            <label className="full">
                                                <span>Description — Spanish</span>
                                                <textarea
                                                    rows={3}
                                                    value={benefit.description.es}
                                                    onChange={event =>
                                                        updateBenefit(index, "description", "es", event.target.value)
                                                    }
                                                />
                                            </label>

                                            <div className="admin-benefit-auto">
                                                <strong>Live preview</strong>
                                                <span>{benefit.title.en}</span>
                                                <small>{benefit.description.en}</small>
                                                <em>Icon and position are fixed for this homepage block.</em>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default AdminContent;
