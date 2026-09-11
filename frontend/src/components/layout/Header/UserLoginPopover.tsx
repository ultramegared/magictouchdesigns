import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Eye, EyeOff, Lock, Mail, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../../services/api";
import { useLanguage } from "../../../contexts/LanguageContext";

export interface HeaderUser {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

interface Props {
    onAuthenticated: (user: HeaderUser) => void;
    onClose: () => void;
}

function UserLoginPopover({ onAuthenticated, onClose }: Props) {
    const { language } = useLanguage();
    const navigate = useNavigate();
    const rootRef = useRef<HTMLDivElement>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [remember, setRemember] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const handlePointerDown = (event: MouseEvent | TouchEvent) => {
            if (rootRef.current && !rootRef.current.contains(event.target as Node)) onClose();
        };
        document.addEventListener("mousedown", handlePointerDown);
        document.addEventListener("touchstart", handlePointerDown);
        return () => {
            document.removeEventListener("mousedown", handlePointerDown);
            document.removeEventListener("touchstart", handlePointerDown);
        };
    }, [onClose]);

    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const username = String(data.get("username") || "").trim();
        const password = String(data.get("password") || "");
        if (!username || !password) return;
        try {
            setIsLoading(true);
            setError("");
            const result = await apiRequest<{ status: string; message: string; token: string }>("/api/auth/login", {
                method: "POST",
                body: JSON.stringify({ username, password }),
            });
            const verification = await apiRequest<{ status: string; user: HeaderUser }>("/api/user/me", {
                headers: { Authorization: `Bearer ${result.token}` },
            });
            if (remember) localStorage.setItem("auth_token", result.token);
            else sessionStorage.setItem("auth_token", result.token);
            localStorage.setItem("auth_user", JSON.stringify(verification.user));
            if (verification.user.role === "ADMIN") {
                window.location.assign("/admin");
                return;
            }
            onAuthenticated(verification.user);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : (language === "es" ? "No se pudo iniciar sesión." : "Unable to sign in."));
        } finally {
            setIsLoading(false);
        }
    };

    const text = language === "es" ? {
        title: "Iniciar sesión",
        subtitle: "Accede a tu cuenta",
        email: "Correo electrónico o usuario",
        password: "Contraseña",
        remember: "Recordarme",
        forgot: "¿Olvidaste tu contraseña?",
        signIn: "Conectarse",
        create: "Crear cuenta",
    } : {
        title: "Sign In",
        subtitle: "Access your account",
        email: "Email address or username",
        password: "Password",
        remember: "Remember me",
        forgot: "Forgot password?",
        signIn: "Sign In",
        create: "Create Account",
    };

    return (
        <div className="header-login-popover" ref={rootRef} role="dialog" aria-label={text.title}>
            <span className="header-login-popover__pointer" aria-hidden="true" />
            <button type="button" className="header-login-popover__close" onClick={onClose} aria-label={language === "es" ? "Cerrar" : "Close"}>
                <X size={16} />
            </button>
            <div className="header-login-popover__heading">
                <strong>{text.title}</strong>
                <span>{text.subtitle}</span>
            </div>
            <form onSubmit={submit} className="header-login-popover__form">
                <label className="header-login-popover__field">
                    <Mail size={16} aria-hidden="true" />
                    <input name="username" type="text" autoComplete="username" placeholder={text.email} required disabled={isLoading} />
                </label>
                <label className="header-login-popover__field">
                    <Lock size={16} aria-hidden="true" />
                    <input name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder={text.password} required disabled={isLoading} />
                    <button type="button" className="header-login-popover__eye" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? "Hide password" : "Show password"} disabled={isLoading}>
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </label>
                <div className="header-login-popover__options">
                    <label><input type="checkbox" checked={remember} onChange={event => setRemember(event.target.checked)} /> <span>{text.remember}</span></label>
                    <button type="button" onClick={() => navigate("/forgot-password")} disabled={isLoading}>{text.forgot}</button>
                </div>
                {error && <div className="header-login-popover__error" role="alert">{error}</div>}
                <button type="submit" className="header-login-popover__submit" disabled={isLoading}>{isLoading ? "..." : text.signIn}</button>
                <button type="button" className="header-login-popover__create" onClick={() => navigate("/register")} disabled={isLoading}>{text.create}</button>
            </form>
        </div>
    );
}

export default UserLoginPopover;
