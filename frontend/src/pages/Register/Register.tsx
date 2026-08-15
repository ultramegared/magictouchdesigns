/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: Register.tsx
 * Module: Pages / Register
 * Language: TypeScript React
 * Description:
 * Premium bilingual Register Page.
 * ================================================================
 */

import { useState } from "react";
import type { FormEvent } from "react";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";

import "../Login/Login.css";

import { useLanguage } from "../../contexts/LanguageContext";
import { translations } from "../../translations";

function Register() {

    const { language } = useLanguage();

    const t = translations[language].register;

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] =
        useState(false);

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        // Registration will be connected to the API later.
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

                    {/* FIRST NAME */}

                    <div className="login__field">

                        <label htmlFor="register-first-name">
                            {t.firstName}
                        </label>

                        <div className="login__input">

                            <User
                                size={19}
                                aria-hidden="true"
                            />

                            <input
                                id="register-first-name"
                                name="firstName"
                                type="text"
                                placeholder={t.firstNamePlaceholder}
                                autoComplete="given-name"
                                required
                            />

                        </div>

                    </div>

                    {/* LAST NAME */}

                    <div className="login__field">

                        <label htmlFor="register-last-name">
                            {t.lastName}
                        </label>

                        <div className="login__input">

                            <User
                                size={19}
                                aria-hidden="true"
                            />

                            <input
                                id="register-last-name"
                                name="lastName"
                                type="text"
                                placeholder={t.lastNamePlaceholder}
                                autoComplete="family-name"
                                required
                            />

                        </div>

                    </div>

                    {/* EMAIL */}

                    <div className="login__field">

                        <label htmlFor="register-email">
                            {t.email}
                        </label>

                        <div className="login__input">

                            <Mail
                                size={19}
                                aria-hidden="true"
                            />

                            <input
                                id="register-email"
                                name="email"
                                type="email"
                                placeholder={t.emailPlaceholder}
                                autoComplete="email"
                                required
                            />

                        </div>

                    </div>

                    {/* PASSWORD */}

                    <div className="login__field">

                        <label htmlFor="register-password">
                            {t.password}
                        </label>

                        <div className="login__input">

                            <Lock
                                size={19}
                                aria-hidden="true"
                            />

                            <input
                                id="register-password"
                                name="password"
                                type={
                                    showPassword
                                        ? "text"
                                        : "password"
                                }
                                placeholder={t.passwordPlaceholder}
                                autoComplete="new-password"
                                required
                                minLength={8}
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

                    {/* CONFIRM PASSWORD */}

                    <div className="login__field">

                        <label htmlFor="register-confirm-password">
                            {t.confirmPassword}
                        </label>

                        <div className="login__input">

                            <Lock
                                size={19}
                                aria-hidden="true"
                            />

                            <input
                                id="register-confirm-password"
                                name="confirmPassword"
                                type={
                                    showConfirmPassword
                                        ? "text"
                                        : "password"
                                }
                                placeholder={
                                    t.confirmPasswordPlaceholder
                                }
                                autoComplete="new-password"
                                required
                                minLength={8}
                            />

                            <button
                                type="button"
                                className="login__password-toggle"
                                onClick={() =>
                                    setShowConfirmPassword(
                                        previous => !previous
                                    )
                                }
                                aria-label={
                                    showConfirmPassword
                                        ? t.hidePassword
                                        : t.showPassword
                                }
                            >
                                {showConfirmPassword ? (
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
                            {t.createAccount}
                        </span>

                        <span
                            className="login__submit-shine"
                            aria-hidden="true"
                        />

                    </button>

                </form>

                {/* LOGIN */}

                <div className="login__register">

                    <span>
                        {t.alreadyAccount}
                    </span>

                    <button
                        type="button"
                        onClick={() => {
                            window.location.href = "/login";
                        }}
                    >
                        {t.signIn}
                    </button>

                </div>

            </section>

        </main>
    );
}

export default Register;