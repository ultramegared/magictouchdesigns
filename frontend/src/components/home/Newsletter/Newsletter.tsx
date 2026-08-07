/**
 * ===============================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: Newsletter.tsx
 * Module: Home
 * ===============================================================
 */

import "./Newsletter.css";

function Newsletter() {

    return (

        <section className="newsletter">

            <div className="newsletter__content">

                <span>

                    NEWSLETTER

                </span>

                <h2>

                    Stay Updated With Magic Touch Designs

                </h2>

                <p>

                    Subscribe to receive exclusive offers,
                    new collections and special discounts.

                </p>

                <form className="newsletter__form">

                    <input

                        type="email"

                        placeholder="Enter your email"

                    />

                    <button type="submit">

                        Subscribe

                    </button>

                </form>

            </div>

        </section>

    );

}

export default Newsletter;