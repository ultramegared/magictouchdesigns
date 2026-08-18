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

import {
    useState,
    type ChangeEvent,
    type FormEvent,
} from "react";

import "./ContactPage.css";

import Header from "../../components/layout/Header";
import Footer from "../../components/home/Footer";

const PRICE_PER_MUG = 24.99;

const ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
];

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

function ContactPage() {

    const [imageName, setImageName] = useState("");
    const [mugSize, setMugSize] = useState("15 oz");
    const [mugColor, setMugColor] = useState("Black");
    const [quantity, setQuantity] = useState(1);

    const [customStatus, setCustomStatus] =
        useState<"idle" | "sending" | "success" | "error">("idle");

    const [supportStatus, setSupportStatus] =
        useState<"idle" | "sending" | "success" | "error">("idle");

    const [imageError, setImageError] = useState("");

    const estimatedTotal =
        PRICE_PER_MUG * quantity;


    /* ============================================================
       IMAGE
       ============================================================ */

    const handleImageChange = (
        event: ChangeEvent<HTMLInputElement>
    ) => {

        const file = event.target.files?.[0];

        setImageError("");
        setImageName("");

        if (!file) {
            return;
        }

        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {

            setImageError(
                "Please upload a JPG, PNG or WEBP image."
            );

            event.target.value = "";

            return;
        }

        if (file.size > MAX_IMAGE_SIZE) {

            setImageError(
                "The image must be smaller than 10 MB."
            );

            event.target.value = "";

            return;
        }

        setImageName(file.name);
    };


    /* ============================================================
       CUSTOM REQUEST
       ============================================================ */

    const handleCustomRequestSubmit = (
        event: FormEvent<HTMLFormElement>
    ) => {

        event.preventDefault();

        if (imageError) {
            return;
        }

        setCustomStatus("sending");

        /*
         * Frontend only for now.
         *
         * The real email/API connection will be added
         * when the backend is created.
         */

        window.setTimeout(() => {

            setCustomStatus("success");

        }, 800);
    };


    /* ============================================================
       SUPPORT
       ============================================================ */

    const handleSupportSubmit = (
        event: FormEvent<HTMLFormElement>
    ) => {

        event.preventDefault();

        setSupportStatus("sending");

        /*
         * Frontend only for now.
         *
         * The real email/API connection will be added
         * when the backend is created.
         */

        window.setTimeout(() => {

            setSupportStatus("success");

        }, 800);
    };


    /* ============================================================
       QUANTITY
       ============================================================ */

    const decreaseQuantity = () => {

        setQuantity((current) =>
            Math.max(1, current - 1)
        );
    };

    const increaseQuantity = () => {

        setQuantity((current) =>
            current + 1
        );
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
                                    minLength={2}
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
                                        JPG, PNG or WEBP • Max 10 MB
                                    </small>

                                </label>

                                <input
                                    id="custom-image"
                                    name="image"
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={handleImageChange}
                                />

                                {imageError && (
                                    <small
                                        style={{
                                            color: "#d95c5c",
                                            marginTop: "6px",
                                        }}
                                    >
                                        {imageError}
                                    </small>
                                )}

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
                                    maxLength={500}
                                />

                            </div>


                            {/* MODEL */}

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
                                        setMugSize(
                                            event.target.value
                                        )
                                    }
                                >

                                    <option value="11 oz">
                                        11 oz
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
                                        setMugColor(
                                            event.target.value
                                        )
                                    }
                                >

                                    <option value="Black">
                                        Black
                                    </option>

                                    <option value="White">
                                        White
                                    </option>

                                    <option value="Magic Black">
                                        Magic Black
                                    </option>

                                    <option value="Red">
                                        Red
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
                                        onClick={
                                            decreaseQuantity
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
                                        onClick={
                                            increaseQuantity
                                        }
                                        aria-label="Increase quantity"
                                    >
                                        +
                                    </button>

                                </div>

                            </div>


                            {/* DETAILS */}

                            <div className="contact-field contact-field--full">

                                <label htmlFor="custom-notes">
                                    Additional Details
                                </label>

                                <textarea
                                    id="custom-notes"
                                    name="notes"
                                    rows={4}
                                    placeholder="Tell us anything else we should know about your design..."
                                    maxLength={1000}
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
                                ${PRICE_PER_MUG.toFixed(2)} per mug
                            </small>

                        </div>


                        {/* STATUS */}

                        {customStatus === "success" && (

                            <div
                                style={{
                                    marginTop: "18px",
                                    padding: "14px 16px",
                                    borderRadius: "6px",
                                    background:
                                        "rgba(76, 175, 80, 0.10)",
                                    border:
                                        "1px solid rgba(76, 175, 80, 0.35)",
                                    color: "#72c878",
                                    fontSize: "12px",
                                }}
                            >
                                Your custom request is ready to be
                                connected to our email system.
                            </div>

                        )}


                        {customStatus === "error" && (

                            <div
                                style={{
                                    marginTop: "18px",
                                    color: "#d95c5c",
                                    fontSize: "12px",
                                }}
                            >
                                Something went wrong. Please try again.
                            </div>

                        )}


                        <button
                            type="submit"
                            className="contact-primary-button"
                            disabled={
                                customStatus === "sending"
                            }
                        >

                            {customStatus === "sending"
                                ? "Preparing Request..."
                                : "Send Custom Request"
                            }

                            <span>
                                →
                            </span>

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
                                        business.magic.t.d@gmail.com
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


                    {/* SUPPORT IMAGE */}

                    <div className="contact-support__image">

                        <img
                            src="/images/contact/contact-support.jpg"
                            alt="Magic Touch Designs customer support"
                        />

                    </div>


                    {/* SUPPORT FORM */}

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
                                minLength={2}
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
                                maxLength={50}
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
                                minLength={5}
                                maxLength={2000}
                                required
                            />

                        </div>


                        {supportStatus === "success" && (

                            <div
                                style={{
                                    padding: "14px 16px",
                                    borderRadius: "6px",
                                    background:
                                        "rgba(76, 175, 80, 0.10)",
                                    border:
                                        "1px solid rgba(76, 175, 80, 0.35)",
                                    color: "#72c878",
                                    fontSize: "12px",
                                }}
                            >
                                Your support message is ready to be
                                connected to our email system.
                            </div>

                        )}


                        {supportStatus === "error" && (

                            <div
                                style={{
                                    color: "#d95c5c",
                                    fontSize: "12px",
                                }}
                            >
                                Something went wrong. Please try again.
                            </div>

                        )}


                        <button
                            type="submit"
                            className="contact-secondary-button"
                            disabled={
                                supportStatus === "sending"
                            }
                        >

                            {supportStatus === "sending"
                                ? "Preparing Message..."
                                : "Send Message"
                            }

                            <span>
                                →
                            </span>

                        </button>

                    </form>

                </section>

            </main>

            <Footer />

        </>

    );
}

export default ContactPage;