/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: Account.tsx
 * Module: Pages / Account
 * Language: TypeScript React
 * Description:
 * Authenticated user account page.
 * ================================================================
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Mail, User } from "lucide-react";

import "../Login/Login.css";

import { apiRequest } from "../../services/api";
import { useLanguage } from "../../contexts/LanguageContext";

interface AuthenticatedUser {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

function Account() {

    const navigate = useNavigate();
    const { language } = useLanguage();

    const [user, setUser] =
        useState<AuthenticatedUser | null>(null);

    const [isLoading, setIsLoading] =
        useState(true);

    useEffect(() => {

        const loadUser = async () => {

            const token =
                localStorage.getItem("auth_token");

            if (!token) {
                navigate("/login");
                return;
            }

            try {

                const result =
                    await apiRequest<{
                        status: string;
                        user: AuthenticatedUser;
                    }>("/api/user/me");

                setUser(result.user);

                localStorage.setItem(
                    "auth_user",
                    JSON.stringify(result.user)
                );

            } catch (error) {

                console.error(
                    "Unable to load account:",
                    error
                );

                localStorage.removeItem(
                    "auth_token"
                );

                localStorage.removeItem(
                    "auth_user"
                );

                navigate("/login");

            } finally {

                setIsLoading(false);

            }
        };

        loadUser();

    }, [navigate]);

    const handleLogout = () => {

        localStorage.removeItem(
            "auth_token"
        );

        localStorage.removeItem(
            "auth_user"
        );

        navigate("/login");

    };

    if (isLoading) {

        return (
            <main className="login">

                <section className="login__card">

                    <div className="login__header">

                        <span className="login__eyebrow">
                            {language === "es"
                                ? "CUENTA"
                                : "ACCOUNT"}
                        </span>

                        <h1>
                            {language === "es"
                                ? "Cargando..."
                                : "Loading..."}
                        </h1>

                    </div>

                </section>

            </main>
        );
    }

    if (!user) {
        return null;
    }

    return (

        <main className="login">

            <div
                className="login__glow login__glow--one"
                aria-hidden="true"
            />

            <div
                className="login__glow login__glow--two"
                aria-hidden="true"
            />

            <div
                className="login__spark login__spark--one"
                aria-hidden="true"
            >
                ✦
            </div>

            <div
                className="login__spark login__spark--two"
                aria-hidden="true"
            >
                ✧
            </div>

            <section className="login__card">

                <div
                    className="login__card-shine"
                    aria-hidden="true"
                />

                {/* BRAND */}

                <div className="login__brand">

                    <div className="login__brand-mark">
                        MTD
                    </div>

                    <div className="login__brand-name">
                        MAGIC TOUCH
                        <span>DESIGNS</span>
                    </div>

                </div>

                {/* HEADER */}

                <div className="login__header">

                    <span className="login__eyebrow">
                        {language === "es"
                            ? "MI CUENTA"
                            : "MY ACCOUNT"}
                    </span>

                    <h1>
                        {language === "es"
                            ? `Hola, ${user.first_name}`
                            : `Hello, ${user.first_name}`}
                    </h1>

                    <p>
                        {language === "es"
                            ? "Bienvenido a tu cuenta de Magic Touch Designs."
                            : "Welcome to your Magic Touch Designs account."}
                    </p>

                </div>

                {/* USER INFORMATION */}

                <div className="login__form">

                    <div className="login__field">

                        <label>
                            {language === "es"
                                ? "Usuario"
                                : "Username"}
                        </label>

                        <div className="login__input">

                            <User
                                size={19}
                                aria-hidden="true"
                            />

                            <input
                                type="text"
                                value={user.username}
                                readOnly
                            />

                        </div>

                    </div>

                    <div className="login__field">

                        <label>
                            {language === "es"
                                ? "Nombre"
                                : "First name"}
                        </label>

                        <div className="login__input">

                            <User
                                size={19}
                                aria-hidden="true"
                            />

                            <input
                                type="text"
                                value={user.first_name}
                                readOnly
                            />

                        </div>

                    </div>

                    <div className="login__field">

                        <label>
                            {language === "es"
                                ? "Apellido"
                                : "Last name"}
                        </label>

                        <div className="login__input">

                            <User
                                size={19}
                                aria-hidden="true"
                            />

                            <input
                                type="text"
                                value={user.last_name}
                                readOnly
                            />

                        </div>

                    </div>

                    <div className="login__field">

                        <label>
                            {language === "es"
                                ? "Correo electrónico"
                                : "Email"}
                        </label>

                        <div className="login__input">

                            <Mail
                                size={19}
                                aria-hidden="true"
                            />

                            <input
                                type="email"
                                value={user.email}
                                readOnly
                            />

                        </div>

                    </div>

                    {/* ACCOUNT STATUS */}

                    <div className="login__field">

                        <label>
                            {language === "es"
                                ? "Estado de cuenta"
                                : "Account status"}
                        </label>

                        <div className="login__input">

                            <User
                                size={19}
                                aria-hidden="true"
                            />

                            <input
                                type="text"
                                value={
                                    user.is_active
                                        ? (
                                            language === "es"
                                                ? "Activa"
                                                : "Active"
                                        )
                                        : (
                                            language === "es"
                                                ? "Inactiva"
                                                : "Inactive"
                                        )
                                }
                                readOnly
                            />

                        </div>

                    </div>

                    {/* LOGOUT */}

                    <button
                        type="button"
                        className="login__submit"
                        onClick={handleLogout}
                    >

                        <span>

                            {language === "es"
                                ? "CERRAR SESIÓN"
                                : "SIGN OUT"}

                        </span>

                        <LogOut
                            size={18}
                            aria-hidden="true"
                        />

                        <span
                            className="login__submit-shine"
                            aria-hidden="true"
                        />

                    </button>

                </div>

            </section>

        </main>
    );
}

export default Account;