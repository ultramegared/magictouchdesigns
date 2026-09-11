import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Eye, EyeOff, Lock, UserRound } from "lucide-react";
import { apiRequest } from "../../services/api";
import "./AdminLogin.css";

type AdminUser = { id: string; username: string; role: string; first_name?: string; last_name?: string; email?: string; is_active?: boolean };
type SettingsResponse = { settings?: { websiteName?: string; config?: { websiteName?: { en?: string } } } };

function AdminLogin() {
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [websiteName, setWebsiteName] = useState("Magic Touch Designs");

    useEffect(() => {
        apiRequest<SettingsResponse>(`/api/settings?admin_login_refresh=${Date.now()}`, { cache: "no-store" })
            .then(({ settings }) => {
                const configuredName = settings?.config?.websiteName?.en || settings?.websiteName;
                if (configuredName) setWebsiteName(configuredName);
            })
            .catch(() => {});
        const token = localStorage.getItem("auth_token");
        if (!token) return;
        apiRequest<{ status: string; user: AdminUser }>("/api/user/me", { headers: { Authorization: `Bearer ${token}` } })
            .then(({ user }) => { if (user.role === "ADMIN") window.location.replace("/admin"); })
            .catch(() => {});
    }, []);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const username = String(formData.get("username") || "").trim();
        const password = String(formData.get("password") || "");
        if (!username || !password) { setMessage("Username and password are required."); return; }
        try {
            setIsLoading(true); setMessage("");
            const result = await apiRequest<{ status: string; message: string; token: string; user: AdminUser }>("/api/auth/login", { method: "POST", body: JSON.stringify({ username, password }) });
            const verification = await apiRequest<{ status: string; user: AdminUser }>("/api/user/me", { headers: { Authorization: `Bearer ${result.token}` } });
            if (verification.user.role !== "ADMIN") { setMessage("This account does not have administrator access."); return; }
            localStorage.setItem("auth_token", result.token);
            localStorage.setItem("auth_user", JSON.stringify(verification.user));
            window.location.replace("/admin");
        } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to sign in."); }
        finally { setIsLoading(false); }
    };

    const year = new Date().getFullYear();
    return <main className="admin-login">
        <div className="admin-login__side-copy admin-login__side-copy--left" aria-hidden="true"><span>CREATE</span><span>PERSONALIZE</span><span>INSPIRE</span><span>DELIVER</span></div>
        <div className="admin-login__side-copy admin-login__side-copy--right" aria-hidden="true"><span>IDEAS</span><span>DESIGNS</span><span>SOLUTIONS</span><span>RESULTS</span></div>
        <section className="admin-login__card">
            <div className="admin-login__card-glow" aria-hidden="true" />
            <div className="admin-login__brand"><img src="/images/logo/logo.png" alt="JQYD" className="admin-login__logo" /><div className="admin-login__brand-name">Magic Touch Designs</div><span className="admin-login__eyebrow">ADMINISTRATOR ACCESS</span><p>Secure. Manage. Grow.</p></div>
            <div className="admin-login__divider" aria-hidden="true" />
            <form className="admin-login__form" onSubmit={handleSubmit}>
                <label className="admin-login__field"><span>Email or Username</span><div className="admin-login__input"><UserRound size={19} aria-hidden="true" /><input name="username" type="text" autoComplete="username" placeholder="Email or Username" required disabled={isLoading} /></div></label>
                <label className="admin-login__field"><span>Password</span><div className="admin-login__input"><Lock size={19} aria-hidden="true" /><input name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Password" required disabled={isLoading} /><button type="button" className="admin-login__password-toggle" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? "Hide password" : "Show password"} disabled={isLoading}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>
                <div className="admin-login__options"><label><input type="checkbox" /> <span>Remember me</span></label><button type="button" onClick={() => window.location.assign("/forgot-password")} disabled={isLoading}>Forgot password?</button></div>
                {message && <div className="admin-login__message" role="alert">{message}</div>}
                <button type="submit" className="admin-login__submit" disabled={isLoading}><span>{isLoading ? "Signing in..." : "Sign In"}</span><span aria-hidden="true">→</span></button>
            </form>
            <div className="admin-login__private"><span className="admin-login__lock">⌕</span><strong>PRIVATE ACCESS</strong><span>Authorized Personnel Only</span></div>
            <footer className="admin-login__footer"><span>© {year} {websiteName}. All rights reserved.</span></footer>
        </section>
    </main>;
}

export default AdminLogin;
