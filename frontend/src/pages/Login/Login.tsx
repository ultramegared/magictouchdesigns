/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: Login.tsx
 * Module: Pages / Login
 * Language: TypeScript React
 * Description:
 * Premium bilingual Login Page.
 * ================================================================
 */

import { useState } from "react";
import type { FormEvent } from "react";
import { Eye, EyeOff, Lock, User } from "lucide-react";

import "./Login.css";

import { useLanguage } from "../../contexts/LanguageContext";
import { translations } from "../../translations";

function Login() {

    const { language } = useLanguage();

    const t = translations[language].login;

    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        // Authentication will be connected here later.
    };

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
                        {t.eyebrow}
                    </span>

                    <h1>
                        {t.title}
                    </h1>

                    <p>
                        {t.description}
                    </p>

                </div>

                {/* FORM */}

                <form
                    className="login__form"
                    onSubmit={handleSubmit}
                >

                    {/* USERNAME */}

<div className="login__field">

    <label htmlFor="login-username">
        {t.username}
    </label>

    <div className="login__input">

        <User
            size={19}
            aria-hidden="true"
        />

        <input
            id="login-username"
            name="username"
            type="text"
            placeholder={t.usernamePlaceholder}
            autoComplete="username"
            required
        />

    </div>

</div>

                    {/* PASSWORD */}

                    <div className="login__field">

                        <div className="login__label-row">

                            <label htmlFor="login-password">
                                {t.password}
                            </label>

                            <button
                                type="button"
                                className="login__forgot"
                                onClick={() => {
                                    window.location.href =
                                        "/forgot-password";
                                }}
                            >
                                {t.forgotPassword}
                            </button>

                        </div>

                        <div className="login__input">

                            <Lock
                                size={19}
                                aria-hidden="true"
                            />

                            <input
                                id="login-password"
                                name="password"
                                type={
                                    showPassword
                                        ? "text"
                                        : "password"
                                }
                                placeholder={t.passwordPlaceholder}
                                autoComplete="current-password"
                                required
                            />

                            <button
                                type="button"
                                className="login__password-toggle"
                                onClick={() =>
                                    setShowPassword(
                                        previous => !previous
                                    )
                                }
                                aria-label={
                                    showPassword
                                        ? t.hidePassword
                                        : t.showPassword
                                }
                            >
                                {showPassword ? (
                                    <EyeOff size={18} />
                                ) : (
                                    <Eye size={18} />
                                )}
                            </button>

                        </div>

                    </div>

                    {/* SUBMIT */}

                    <button
                        type="submit"
                        className="login__submit"
                    >

                        <span>
                            {t.signIn}
                        </span>

                        <span
                            className="login__submit-shine"
                            aria-hidden="true"
                        />

                    </button>

                </form>

                {/* REGISTER */}

                <div className="login__register">

                    <span>
                        {t.noAccount}
                    </span>

                    <button
                        type="button"
                        onClick={() => {
                            window.location.href =
                                "/register";
                        }}
                    >
                        {t.createAccount}
                    </button>

                </div>

            </section>

        </main>
    );
}

export default Login;