/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: Newsletter.tsx
 * Module: Home
 * Language: TypeScript React
 * Description:
 * Newsletter Section.
 * ================================================================
 */

import "./Newsletter.css";

import { newsletterContent } from "./Newsletter.data";

function Newsletter() {

    const {
        eyebrow,
        title,
        description,
        placeholder,
        buttonText,
        privacyText,
    } = newsletterContent;

    return (

        <section className="newsletter">

            <div className="newsletter__container">

                <div className="newsletter__icon" aria-hidden="true">
                    ✉
                </div>

                <div className="newsletter__content">

                    <span className="newsletter__eyebrow">
                        {eyebrow}
                    </span>

                    <h2>
                        {title}
                    </h2>

                    <p>
                        {description}
                    </p>

                    <form className="newsletter__form">

                        <input
                            type="email"
                            placeholder={placeholder}
                            aria-label="Email address"
                            autoComplete="email"
                        />

                        <button type="submit">
                            {buttonText}
                        </button>

                    </form>

                    <span className="newsletter__privacy">
                        {privacyText}
                    </span>

                </div>

            </div>

        </section>

    );

}

export default Newsletter;