/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: Newsletter.tsx
 * Module: Home
 * Language: TypeScript React
 * Description:
 * Bilingual Newsletter / Community Section.
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

                <div
                    className="newsletter__icon"
                    aria-hidden="true"
                >
                    ✉
                </div>

                <div className="newsletter__content">

                    <span className="newsletter__eyebrow">
                        {t.eyebrow}
                    </span>

                    <h2>
                        {t.title}
                    </h2>

                    <p>
                        {t.description}
                    </p>

                    <form className="newsletter__form">

                        <input
                            type="email"
                            placeholder={t.placeholder}
                            aria-label={t.emailLabel}
                            autoComplete="email"
                        />

                        <button type="submit">
                            {t.subscribe}
                        </button>

                    </form>

                    <span className="newsletter__privacy">
                        {t.privacy}
                    </span>

                </div>

            </div>

        </section>

    );

}

export default Newsletter;