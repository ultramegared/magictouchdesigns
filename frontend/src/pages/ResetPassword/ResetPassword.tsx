import { useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Lock, Loader2 } from "lucide-react";
import "../Login/Login.css";
import { useLanguage } from "../../contexts/LanguageContext";
import { apiRequest } from "../../services/api";

function ResetPassword() {
    const { language } = useLanguage();
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token") || "";
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState("");
    const es = language === "es";

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        if (!token) { setError(es ? "Este enlace de recuperación no es válido." : "This recovery link is not valid."); return; }
        if (password.length < 8) { setError(es ? "La contraseña debe tener al menos 8 caracteres." : "Password must contain at least 8 characters."); return; }
        if (password !== confirmPassword) { setError(es ? "Las contraseñas no coinciden." : "Passwords do not match."); return; }
        setLoading(true);
        try {
            await apiRequest<{ status: string; message: string }>("/api/auth/reset-password", { method: "POST", body: JSON.stringify({ token, password }), headers: { "Content-Type": "application/json" } });
            setDone(true);
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : (es ? "No pudimos cambiar la contraseña. Inténtalo nuevamente." : "We could not change your password. Please try again."));
        } finally { setLoading(false); }
    };

    const visibilityLabel = (visible: boolean) => visible ? (es ? "Ocultar contraseña" : "Hide password") : (es ? "Mostrar contraseña" : "Show password");

    return (
        <main className="login">
            <div className="login__glow login__glow--one" aria-hidden="true" />
            <div className="login__glow login__glow--two" aria-hidden="true" />
            <div className="login__spark login__spark--one" aria-hidden="true">✦</div>
            <div className="login__spark login__spark--two" aria-hidden="true">✧</div>
            <section className="login__card">
                <div className="login__card-shine" aria-hidden="true" />
                <div className="login__brand"><div className="login__brand-mark">MTD</div><div className="login__brand-name">MAGIC TOUCH<span>DESIGNS</span></div></div>
                <div className="login__header">
                    <span className="login__eyebrow">{es ? "RECUPERACIÓN SEGURA" : "SECURE RECOVERY"}</span>
                    <h1>{es ? "Crear nueva contraseña" : "Create a new password"}</h1>
                    <p>{es ? "Elige una contraseña nueva y segura para tu cuenta." : "Choose a new, secure password for your account."}</p>
                </div>
                {done ? (
                    <div className="login__header"><p>{es ? "Tu contraseña fue actualizada correctamente. Ya puedes iniciar sesión desde el inicio." : "Your password has been updated successfully. You can now sign in from the home page."}</p></div>
                ) : (
                    <form className="login__form" onSubmit={handleSubmit}>
                        <div className="login__field">
                            <label htmlFor="reset-password">{es ? "Nueva contraseña" : "New password"}</label>
                            <div className="login__input">
                                <Lock size={19} aria-hidden="true" />
                                <input id="reset-password" type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />
                                <button type="button" className="login__password-toggle" onClick={() => setShowPassword((visible) => !visible)} aria-label={visibilityLabel(showPassword)} title={visibilityLabel(showPassword)}>
                                    {showPassword ? <EyeOff size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}
                                </button>
                            </div>
                        </div>
                        <div className="login__field">
                            <label htmlFor="reset-password-confirm">{es ? "Confirmar contraseña" : "Confirm password"}</label>
                            <div className="login__input">
                                <Lock size={19} aria-hidden="true" />
                                <input id="reset-password-confirm" type={showConfirmPassword ? "text" : "password"} autoComplete="new-password" minLength={8} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                                <button type="button" className="login__password-toggle" onClick={() => setShowConfirmPassword((visible) => !visible)} aria-label={visibilityLabel(showConfirmPassword)} title={visibilityLabel(showConfirmPassword)}>
                                    {showConfirmPassword ? <EyeOff size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}
                                </button>
                            </div>
                        </div>
                        {error && <p role="alert" style={{ color: "#b42318", margin: "-4px 0 4px", fontSize: "13px" }}>{error}</p>}
                        <button type="submit" className="login__submit" disabled={loading}><span>{loading ? (es ? "Actualizando..." : "Updating...") : (es ? "Cambiar contraseña" : "Update password")}</span>{loading ? <Loader2 size={18} className="spin" aria-hidden="true" /> : <span className="login__submit-shine" aria-hidden="true" />}</button>
                    </form>
                )}
                <div className="login__register"><button type="button" onClick={() => { window.location.href = "/"; }}><ArrowLeft size={16} aria-hidden="true" />{es ? "Volver al inicio" : "Back to home"}</button></div>
            </section>
        </main>
    );
}

export default ResetPassword;
