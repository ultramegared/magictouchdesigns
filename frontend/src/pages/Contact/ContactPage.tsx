/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: ContactPage.tsx
 * Module: Frontend
 * Language: TypeScript React
 * Description:
 * Contact page.
 * ================================================================
 */

import { ChangeEvent, FormEvent, useState } from "react";
import "./ContactPage.css";

import Header from "../../components/layout/Header";
import Footer from "../../components/home/Footer";

function ContactPage() {

    const [imageName, setImageName] = useState("");
    const [mugSize, setMugSize] = useState("15 oz");
    const [mugColor, setMugColor] = useState("Black");
    const [quantity, setQuantity] = useState(1);

    const pricePerMug = 24.99;
    const estimatedTotal = pricePerMug * quantity;

    const handleImageChange = (
        event: ChangeEvent<HTMLInputElement>
    ) => {

        const file = event.target.files?.[0];

        if (file) {
            setImageName(file.name);
        }

    };

    const handleCustomRequestSubmit = (
        event: FormEvent<HTMLFormElement>
    ) => {

        event.preventDefault();

        // Backend / payment integration will be connected later.

    };

    const handleSupportSubmit = (
        event: FormEvent<HTMLFormElement>
    ) => {

        event.preventDefault();

        // Support submission will be connected later.

    };

    return (

        <>

            <Header />

            <main className="contact-page">

                {/* ==================================================
                   INTRO
                   ================================================== */}

                <section className="contact-intro">

                    <span className="contact-eyebrow">
                        GET IN TOUCH
                    </span>

                    <h1>
                        Contact Us
                    </h1>

                    <p>
                        Need help creating your mug? Send us your
                        idea, image or message and we'll help bring
                        your design to life.
                    </p>

                </section>


                {/* ==================================================
                   CUSTOM MUG REQUEST
                   ================================================== */}

                <section className="contact-custom">

                    <div className="contact-section-heading">

                        <span>
                            CUSTOM MUG REQUEST
                        </span>

                        <h2>
                            Let Us Create Your Mug
                        </h2>

                        <p>
                            If you prefer, send us your image and
                            design details and our team can prepare
                            your personalized mug for you.
                        </p>

                    </div>


                    <form
                        className="contact-custom__form"
                        onSubmit={handleCustomRequestSubmit}
                    >

                        <div className="contact-form-grid">

                            {/* NAME */}

                            <div className="contact-field">

                                <label htmlFor="custom-name">
                                    Full Name
                                </label>

                                <input
                                    id="custom-name"
                                    name="name"
                                    type="text"
                                    placeholder="Your name"
                                    required
                                />

                            </div>


                            {/* EMAIL */}

                            <div className="contact-field">

                                <label htmlFor="custom-email">
                                    Email
                                </label>

                                <input
                                    id="custom-email"
                                    name="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    required
                                />

                            </div>


                            {/* IMAGE */}

                            <div className="contact-field contact-field--full">

                                <label htmlFor="custom-image">
                                    Upload Your Image
                                </label>

                                <label
                                    className="contact-upload"
                                    htmlFor="custom-image"
                                >

                                    <span className="contact-upload__icon">
                                        ↑
                                    </span>

                                    <strong>
                                        {imageName || "Choose Image"}
                                    </strong>

                                    <small>
                                        JPG, PNG or WEBP
                                    </small>

                                </label>

                                <input
                                    id="custom-image"
                                    name="image"
                                    type="file"
                                    accept=".jpg,.jpeg,.png,.webp"
                                    onChange={handleImageChange}
                                />

                            </div>


                            {/* TEXT */}

                            <div className="contact-field contact-field--full">

                                <label htmlFor="custom-text">
                                    Text For Your Mug
                                </label>

                                <textarea
                                    id="custom-text"
                                    name="text"
                                    rows={4}
                                    placeholder="Tell us exactly what text you would like on your mug..."
                                />

                            </div>


                            {/* MUG MODEL */}

                            <div className="contact-field">

                                <label htmlFor="mug-model">
                                    Mug Model
                                </label>

                                <select
                                    id="mug-model"
                                    name="model"
                                    defaultValue="Classic"
                                >

                                    <option value="Classic">
                                        Classic
                                    </option>

                                    <option value="Premium">
                                        Premium
                                    </option>

                                </select>

                            </div>


                            {/* SIZE */}

                            <div className="contact-field">

                                <label htmlFor="mug-size">
                                    Mug Size
                                </label>

                                <select
                                    id="mug-size"
                                    name="size"
                                    value={mugSize}
                                    onChange={(event) =>
                                        setMugSize(event.target.value)
                                    }
                                >

                                    <option value="11 oz">
                                        11 oz
                                    </option>

                                    <option value="13 oz">
                                        13 oz
                                    </option>

                                    <option value="15 oz">
                                        15 oz
                                    </option>

                                </select>

                            </div>


                            {/* COLOR */}

                            <div className="contact-field">

                                <label htmlFor="mug-color">
                                    Mug Color
                                </label>

                                <select
                                    id="mug-color"
                                    name="color"
                                    value={mugColor}
                                    onChange={(event) =>
                                        setMugColor(event.target.value)
                                    }
                                >

                                    <option value="Black">
                                        Black
                                    </option>

                                    <option value="White">
                                        White
                                    </option>

                                    <option value="Gold">
                                        Gold
                                    </option>

                                </select>

                            </div>


                            {/* QUANTITY */}

                            <div className="contact-field">

                                <label htmlFor="mug-quantity">
                                    Quantity
                                </label>

                                <div className="contact-quantity">

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setQuantity(
                                                Math.max(1, quantity - 1)
                                            )
                                        }
                                        aria-label="Decrease quantity"
                                    >
                                        −
                                    </button>

                                    <strong>
                                        {quantity}
                                    </strong>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setQuantity(quantity + 1)
                                        }
                                        aria-label="Increase quantity"
                                    >
                                        +
                                    </button>

                                </div>

                            </div>


                            {/* NOTES */}

                            <div className="contact-field contact-field--full">

                                <label htmlFor="custom-notes">
                                    Additional Details
                                </label>

                                <textarea
                                    id="custom-notes"
                                    name="notes"
                                    rows={4}
                                    placeholder="Tell us anything else we should know about your design..."
                                />

                            </div>

                        </div>


                        {/* PRICE */}

                        <div className="contact-price">

                            <div>

                                <span>
                                    ESTIMATED PRICE
                                </span>

                                <strong>
                                    ${estimatedTotal.toFixed(2)}
                                </strong>

                            </div>

                            <small>
                                ${pricePerMug.toFixed(2)} per mug
                            </small>

                        </div>


                        <button
                            type="submit"
                            className="contact-primary-button"
                        >
                            Send Custom Request
                            <span>→</span>
                        </button>

                    </form>

                </section>


                {/* ==================================================
                   CONTACT SUPPORT
                   ================================================== */}

                <section className="contact-support">

                    <div className="contact-support__content">

                        <span className="contact-section-label">
                            NEED HELP?
                        </span>

                        <h2>
                            Contact Support
                        </h2>

                        <p>
                            Have an issue with an order, a design,
                            payment or anything else? Send us a
                            message and our team will help you.
                        </p>

                        <div className="contact-info">

                            <div className="contact-info__item">

                                <span className="contact-info__icon">
                                    @
                                </span>

                                <div>

                                    <strong>
                                        Email
                                    </strong>

                                    <span>
                                        support@magictouchdesigns.com
                                    </span>

                                </div>

                            </div>


                            <div className="contact-info__item">

                                <span className="contact-info__icon">
                                    ?
                                </span>

                                <div>

                                    <strong>
                                        Customer Support
                                    </strong>

                                    <span>
                                        We're here to help with your order.
                                    </span>

                                </div>

                            </div>

                        </div>

                    </div>


                    <form
                        className="contact-support__form"
                        onSubmit={handleSupportSubmit}
                    >

                        <div className="contact-field">

                            <label htmlFor="support-name">
                                Full Name
                            </label>

                            <input
                                id="support-name"
                                name="name"
                                type="text"
                                placeholder="Your name"
                                required
                            />

                        </div>


                        <div className="contact-field">

                            <label htmlFor="support-email">
                                Email
                            </label>

                            <input
                                id="support-email"
                                name="email"
                                type="email"
                                placeholder="you@example.com"
                                required
                            />

                        </div>


                        <div className="contact-field">

                            <label htmlFor="support-order">
                                Order Number
                            </label>

                            <input
                                id="support-order"
                                name="orderNumber"
                                type="text"
                                placeholder="Optional"
                            />

                        </div>


                        <div className="contact-field">

                            <label htmlFor="support-message">
                                Message
                            </label>

                            <textarea
                                id="support-message"
                                name="message"
                                rows={5}
                                placeholder="How can we help?"
                                required
                            />

                        </div>


                        <button
                            type="submit"
                            className="contact-secondary-button"
                        >
                            Send Message
                            <span>→</span>
                        </button>

                    </form>

                </section>

            </main>

            <Footer />

        </>

    );

}

export default ContactPage;