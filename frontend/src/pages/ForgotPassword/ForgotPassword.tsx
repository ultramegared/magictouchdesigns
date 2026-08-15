/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: ForgotPassword.tsx
 * Module: Pages / Forgot Password
 * Language: TypeScript React
 * Description:
 * Premium bilingual password recovery page.
 * ================================================================
 */

import { useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, Mail } from "lucide-react";

import "../Login/Login.css";

import { useLanguage } from "../../contexts/LanguageContext";
import { translations } from "../../translations";

function ForgotPassword() {

    const { language } = useLanguage();

    const t = translations[language].forgotPassword;

    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        // Password recovery will be connected to the API later.

        setSubmitted(true);
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

                {!submitted ? (

                    <form
                        className="login__form"
                        onSubmit={handleSubmit}
                    >

                        {/* EMAIL */}

                        <div className="login__field">

                            <label htmlFor="forgot-password-email">
                                {t.email}
                            </label>

                            <div className="login__input">

                                <Mail
                                    size={19}
                                    aria-hidden="true"
                                />

                                <input
                                    id="forgot-password-email"
                                    name="email"
                                    type="email"
                                    placeholder={t.emailPlaceholder}
                                    autoComplete="email"
                                    required
                                />

                            </div>

                        </div>

                        {/* SUBMIT */}

                        <button
                            type="submit"
                            className="login__submit"
                        >

                            <span>
                                {t.sendLink}
                            </span>

                            <span
                                className="login__submit-shine"
                                aria-hidden="true"
                            />

                        </button>

                    </form>

                ) : (

                    <div className="login__header">

                        <p>
                            {t.successMessage}
                        </p>

                    </div>

                )}

                {/* BACK TO LOGIN */}

                <div className="login__register">

                    <button
                        type="button"
                        onClick={() => {
                            window.location.href = "/login";
                        }}
                    >

                        <ArrowLeft
                            size={16}
                            aria-hidden="true"
                        />

                        {t.backToLogin}

                    </button>

                </div>

            </section>

        </main>
    );
}

export default ForgotPassword;