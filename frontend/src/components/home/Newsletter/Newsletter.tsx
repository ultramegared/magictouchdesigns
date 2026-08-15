/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: Newsletter.tsx
 * Module: Home
 * Language: TypeScript React
 * Description:
 * Premium 3D bilingual Newsletter / Community Section.
 * ================================================================
 */

import "./Newsletter.css";

import { useLanguage } from "../../../contexts/LanguageContext";
import { translations } from "../../../translations";

function Newsletter() {

    const { language } = useLanguage();

    const t = translations[language].home.community;

    return (

        <section className="newsletter">

            <div className="newsletter__container">

                {/* ==================================================
                    PREMIUM LIGHT EFFECTS
                   ================================================== */}

                <span
                    className="newsletter__light newsletter__light--one"
                    aria-hidden="true"
                />

                <span
                    className="newsletter__light newsletter__light--two"
                    aria-hidden="true"
                />

                <span
                    className="newsletter__spark newsletter__spark--one"
                    aria-hidden="true"
                >
                    ✦
                </span>

                <span
                    className="newsletter__spark newsletter__spark--two"
                    aria-hidden="true"
                >
                    ✧
                </span>

                <span
                    className="newsletter__spark newsletter__spark--three"
                    aria-hidden="true"
                >
                    ✦
                </span>

                {/* ==================================================
                    ICON
                   ================================================== */}

                <div
                    className="newsletter__icon"
                    aria-hidden="true"
                >

                    <span className="newsletter__icon-ring">

                        <svg
                            viewBox="0 0 64 64"
                            className="newsletter__mail"
                            aria-hidden="true"
                        >
                            <rect
                                x="10"
                                y="17"
                                width="44"
                                height="30"
                                rx="5"
                            />

                            <path
                                d="M12 21L32 37L52 21"
                            />

                        </svg>

                    </span>

                </div>

                {/* ==================================================
                    CONTENT
                   ================================================== */}

                <div className="newsletter__content">

                    <div className="newsletter__eyebrow">

                        <span className="newsletter__eyebrow-line" />

                        <span>
                            {t.eyebrow}
                        </span>

                        <span className="newsletter__eyebrow-line" />

                    </div>

                    <h2>

                        <span className="newsletter__title-white">
                            Get
                        </span>{" "}

                        <span className="newsletter__title-gold">
                            exclusive updates
                        </span>

                    </h2>

                    <p>
                        {t.description}
                    </p>

                    {/* ==================================================
                        FORM
                       ================================================== */}

                    <form className="newsletter__form">

                        <div className="newsletter__input-wrap">

                            <svg
                                viewBox="0 0 64 64"
                                className="newsletter__input-icon"
                                aria-hidden="true"
                            >
                                <rect
                                    x="10"
                                    y="17"
                                    width="44"
                                    height="30"
                                    rx="5"
                                />

                                <path
                                    d="M12 21L32 37L52 21"
                                />
                            </svg>

                            <input
                                type="email"
                                placeholder={t.placeholder}
                                aria-label={t.emailLabel}
                                autoComplete="email"
                            />

                        </div>

                        <button type="submit">

                            <span>
                                {t.subscribe}
                            </span>

                            <span
                                className="newsletter__button-shine"
                                aria-hidden="true"
                            />

                        </button>

                    </form>

                    {/* ==================================================
                        PRIVACY
                       ================================================== */}

                    <div className="newsletter__privacy">

                        <span
                            className="newsletter__privacy-icon"
                            aria-hidden="true"
                        >
                            ✓
                        </span>

                        <span>
                            {t.privacy}
                        </span>

                    </div>

                </div>

            </div>

        </section>

    );

}

export default Newsletter;