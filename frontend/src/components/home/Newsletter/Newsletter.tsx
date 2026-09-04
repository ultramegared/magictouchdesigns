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

import {
    FormEvent,
    useState,
} from "react";

import { useLanguage } from "../../../contexts/LanguageContext";

import { translations } from "../../../translations";

import { apiRequest } from "../../../services/api";


function Newsletter() {

    const { language } = useLanguage();

    const t =
        translations[language].home.community;


    const [email, setEmail] =
        useState("");

    const [submitting, setSubmitting] =
        useState(false);

    const [feedback, setFeedback] =
        useState<string | null>(
            null
        );

    const [error, setError] =
        useState<string | null>(
            null
        );


    /*
    |--------------------------------------------------------------------------
    | Newsletter Submission
    |--------------------------------------------------------------------------
    */

    const handleSubmit =
        async (
            event:
                FormEvent<HTMLFormElement>
        ) => {

            event.preventDefault();


            const normalizedEmail =
                email
                    .trim()
                    .toLowerCase();


            if (
                !normalizedEmail
            ) {

                return;

            }


            try {

                setSubmitting(
                    true
                );

                setFeedback(
                    null
                );

                setError(
                    null
                );


                const result =
                    await apiRequest<{
                        message:
                            string;
                    }>(
                        "/api/subscribers",
                        {
                            method:
                                "POST",

                            body:
                                JSON.stringify({
                                    email:
                                        normalizedEmail,

                                    language:
                                        language,
                                }),
                        }
                    );


                setFeedback(
                    result.message
                );


                setEmail(
                    ""
                );

            } catch (
                requestError
            ) {

                setError(

                    requestError
                        instanceof Error
                        ? requestError.message
                        : "Unable to subscribe."

                );

            } finally {

                setSubmitting(
                    false
                );

            }

        };


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
                        {t.title}
                    </h2>

                    <p>
                        {t.description}
                    </p>

                    {/* ==================================================
                        FORM
                       ================================================== */}

                    <form
                        className="newsletter__form"
                        onSubmit={
                            handleSubmit
                        }
                    >

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
                                value={
                                    email
                                }
                                onChange={
                                    (
                                        event
                                    ) =>
                                        setEmail(
                                            event.target.value
                                        )
                                }
                                placeholder={
                                    t.placeholder
                                }
                                aria-label={
                                    t.emailLabel
                                }
                                autoComplete="email"
                                disabled={
                                    submitting
                                }
                                required
                            />

                        </div>

                        <button
                            type="submit"
                            disabled={
                                submitting
                            }
                        >

                            <span>
                                {
                                    submitting
                                        ? "..."
                                        : t.subscribe
                                }
                            </span>

                            <span
                                className="newsletter__button-shine"
                                aria-hidden="true"
                            />

                        </button>

                    </form>


                    {/* ==================================================
                        FEEDBACK
                       ================================================== */}

                    {
                        (
                            feedback ||
                            error
                        ) && (

                            <div
                                className="newsletter__feedback"
                                role="status"
                            >

                                {
                                    feedback ||
                                    error
                                }

                            </div>

                        )
                    }


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