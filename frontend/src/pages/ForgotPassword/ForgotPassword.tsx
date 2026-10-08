import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, CheckCircle2, Mail, Loader2, X } from "lucide-react";
import "../Login/Login.css";
import { useLanguage } from "../../contexts/LanguageContext";
import { translations } from "../../translations";
import { apiRequest } from "../../services/api";

function ForgotPassword() {
    const { language } = useLanguage();
    const t = translations[language].forgotPassword;
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [logoUrl, setLogoUrl] = useState("");
    const [feedback, setFeedback] = useState(false);

    useEffect(() => {
        let cancelled = false;
        apiRequest<{ status: string; settings: { logoUrl?: string | null } }>(`/api/settings?auth_logo_refresh=${Date.now()}`, { cache: "no-store" })
            .then(result => { if (!cancelled) setLogoUrl(result.settings?.logoUrl || ""); })
            .catch(() => {});
        return () => { cancelled = true; };
    }, []);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        setError("");
        const form = new FormData(event.currentTarget);
        const email = String(form.get("email") || "").trim().toLowerCase();
        try {
            await apiRequest<{ status: string; message: string }>("/api/auth/forgot-password", {
                method: "POST",
                body: JSON.stringify({ email }),
                headers: { "Content-Type": "application/json" },
            });
            setSubmitted(true);
            setFeedback(true);
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : (language === "es" ? "No pudimos enviar el enlace. Inténtalo nuevamente." : "We could not send the reset link. Please try again."));
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="login">
            <div className="login__glow login__glow--one" aria-hidden="true" />
            <div className="login__glow login__glow--two" aria-hidden="true" />
            <div className="login__spark login__spark--one" aria-hidden="true">✦</div>
            <div className="login__spark login__spark--two" aria-hidden="true">✧</div>
            <section className="login__card">
                <div className="login__card-shine" aria-hidden="true" />
                <div className="login__brand">
                    <div className="login__brand-mark" style={{ background: `url('${logoUrl || "/images/logo/jqyd-logo-256.png"}') center / contain no-repeat`, border: 0, borderRadius: 0, boxShadow: "none", color: "transparent", fontSize: 0 }} aria-label="JQ & YD" />
                    <div className="login__brand-name">MAGIC TOUCH<span>DESIGNS</span></div>
                </div>
                <div className="login__header">
                    <span className="login__eyebrow">{t.eyebrow}</span>
                    <h1>{t.title}</h1>
                    <p>{t.description}</p>
                </div>
                {!submitted ? (
                    <form className="login__form" onSubmit={handleSubmit}>
                        <div className="login__field">
                            <label htmlFor="forgot-password-email">{t.email}</label>
                            <div className="login__input">
                                <Mail size={19} aria-hidden="true" />
                                <input id="forgot-password-email" name="email" type="email" placeholder={t.emailPlaceholder} autoComplete="email" required />
                            </div>
                        </div>
                        {error && <p role="alert" style={{ color: "#b42318", margin: "-4px 0 4px", fontSize: "13px" }}>{error}</p>}
                        <button type="submit" className="login__submit" disabled={loading}>
                            <span>{loading ? (language === "es" ? "Enviando..." : "Sending...") : t.sendLink}</span>
                            {loading ? <Loader2 size={18} className="spin" aria-hidden="true" /> : <span className="login__submit-shine" aria-hidden="true" />}
                        </button>
                    </form>
                ) : (
                    <div className="login__header">
                        <p>{language === "es" ? "Si el correo está registrado, recibirás un enlace seguro para crear una nueva contraseña. Revisa también Spam o Promociones." : "If that email is registered, you will receive a secure link to create a new password. Also check Spam or Promotions."}</p>
                    </div>
                )}
                {feedback && (
                    <div className="login__feedback-overlay" role="presentation">
                        <div className="login__feedback login__feedback--success" role="alertdialog" aria-modal="true">
                            <button type="button" className="login__feedback-close" onClick={() => setFeedback(false)} aria-label="Close"><X size={18} /></button>
                            <div className="login__feedback-icon"><CheckCircle2 size={28} /></div>
                            <h2>{language === "es" ? "Correo enviado" : "Email sent"}</h2>
                            <p>{language === "es" ? "Si la cuenta existe, recibirás el enlace para crear una nueva contraseña. Revisa también Spam o Promociones." : "If the account exists, you will receive a secure link to create a new password. Also check Spam or Promotions."}</p>
                            <button type="button" className="login__feedback-action" onClick={() => { window.location.href = "/"; }}>{language === "es" ? "Volver al inicio" : "Back to home"}</button>
                        </div>
                    </div>
                )}

                <div className="login__register">
                    <button type="button" onClick={() => { window.location.href = "/"; }}>
                        <ArrowLeft size={16} aria-hidden="true" />
                        {language === "es" ? "Volver al inicio" : "Back to home"}
                    </button>
                </div>
            </section>
        </main>
    );
}

export default ForgotPassword;
