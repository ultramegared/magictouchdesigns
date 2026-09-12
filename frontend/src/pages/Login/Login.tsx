import { useState } from "react";
import type { FormEvent } from "react";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import "./Login.css";
import { apiRequest } from "../../services/api";
import { useLanguage } from "../../contexts/LanguageContext";
import { translations } from "../../translations";

function Login() {
    const { language } = useLanguage();
    const t = translations[language].login;
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const username = String(formData.get("username") || "").trim();
        const password = String(formData.get("password") || "");
        if (!username || !password) {
            alert("Username and password are required.");
            return;
        }
        try {
            setIsLoading(true);
            const result = await apiRequest<{ status: string; message: string; token: string; user: { id: string; username: string; first_name: string; last_name: string; email: string; is_active: boolean; created_at: string; updated_at: string } }>("/api/auth/login", {
                method: "POST",
                body: JSON.stringify({ username, password }),
            });
            localStorage.setItem("auth_token", result.token);
            localStorage.setItem("auth_user", JSON.stringify(result.user));
            const verification = await apiRequest<{ status: string; user: { id: string; username: string; role: string } }>("/api/user/me", {
                headers: { Authorization: `Bearer ${result.token}` },
            });
            if (verification.user.role === "ADMIN") {
                localStorage.setItem("auth_user", JSON.stringify(verification.user));
                window.location.href = "/admin";
                return;
            }
            alert(result.message);
            window.location.href = "/";
        } catch (error) {
            console.error("Login error:", error);
            alert(error instanceof Error ? error.message : "Unable to sign in.");
        } finally {
            setIsLoading(false);
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
                <div className="login__brand"><div className="login__brand-mark" style={{ background: "transparent", border: 0, borderRadius: 0, boxShadow: "none", color: "transparent", backgroundImage: "url('/images/logo/jqyd-logo-256.png')", backgroundPosition: "center", backgroundSize: "contain", backgroundRepeat: "no-repeat" }} aria-label="JQ & YD" /><div className="login__brand-name">MAGIC TOUCH<span>DESIGNS</span></div></div>
                <div className="login__header"><span className="login__eyebrow">{t.eyebrow}</span><h1>{t.title}</h1><p>{t.description}</p></div>
                <form className="login__form" onSubmit={handleSubmit}>
                    <div className="login__field"><label htmlFor="login-username">{t.username}</label><div className="login__input"><User size={19} aria-hidden="true" /><input id="login-username" name="username" type="text" placeholder={t.usernamePlaceholder} autoComplete="username" required disabled={isLoading} /></div></div>
                    <div className="login__field"><div className="login__label-row"><label htmlFor="login-password">{t.password}</label><button type="button" className="login__forgot" onClick={() => { window.location.href = "/forgot-password"; }} disabled={isLoading}>{t.forgotPassword}</button></div><div className="login__input"><Lock size={19} aria-hidden="true" /><input id="login-password" name="password" type={showPassword ? "text" : "password"} placeholder={t.passwordPlaceholder} autoComplete="current-password" required disabled={isLoading} /><button type="button" className="login__password-toggle" onClick={() => setShowPassword(previous => !previous)} aria-label={showPassword ? t.hidePassword : t.showPassword} disabled={isLoading}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></div>
                    <button type="submit" className="login__submit" disabled={isLoading}><span>{isLoading ? "Signing in..." : t.signIn}</span><span className="login__submit-shine" aria-hidden="true" /></button>
                </form>
                <div className="login__register"><span>{t.noAccount}</span><button type="button" onClick={() => { window.location.href = "/register"; }} disabled={isLoading}>{t.createAccount}</button></div>
            </section>
        </main>
    );
}

export default Login;
