/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: ContactPage.tsx
 * Module: Frontend
 * Language: TypeScript React
 * Description:
 * Contact page with multilingual support.
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

import { useLanguage } from "../../contexts/LanguageContext";
import { translations } from "../../translations";

const PRICE_PER_MUG = 24.99;

const ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
];

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

function ContactPage() {

    const { language } = useLanguage();

    const t = translations[language].contact;

    const [imageName, setImageName] = useState("");

    const [mugSize, setMugSize] = useState("15 oz");

    const [mugColor, setMugColor] = useState("Black");

    const [quantity, setQuantity] = useState(1);

    const [imageError, setImageError] = useState("");

    const [customStatus, setCustomStatus] = useState<
        "idle" | "sending" | "success" | "error"
    >("idle");

    const [supportStatus, setSupportStatus] = useState<
        "idle" | "sending" | "success" | "error"
    >("idle");


    const estimatedTotal =
        PRICE_PER_MUG * quantity;


    /* ============================================================
       IMAGE VALIDATION
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
                t.customRequest.imageError
            );

            event.target.value = "";

            return;
        }

        if (file.size > MAX_IMAGE_SIZE) {

            setImageError(
                t.customRequest.imageSizeError
            );

            event.target.value = "";

            return;
        }

        setImageName(file.name);
    };


    /* ============================================================
       CUSTOM MUG REQUEST
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
         * Email / backend integration will be connected later.
         * Frontend structure remains ready for the backend.
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

        /*
         * Email / backend integration will be connected later.
         */

        setSupportStatus("sending");

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
                        {t.eyebrow}
                    </span>

                    <h1>
                        {t.title}
                    </h1>

                    <p>
                        {t.intro}
                    </p>

                </section>


                {/* ==================================================
                   CUSTOM MUG REQUEST
                   ================================================== */}

                <section className="contact-custom">

                    <div className="contact-section-heading">

                        <span>
                            {t.customRequest.label}
                        </span>

                        <h2>
                            {t.customRequest.title}
                        </h2>

                        <p>
                            {t.customRequest.description}
                        </p>

                    </div>


                    <form
                        className="contact-custom__form"
                        onSubmit={
                            handleCustomRequestSubmit
                        }
                    >

                        <div className="contact-form-grid">


                            {/* ==================================================
                               FULL NAME
                               ================================================== */}

                            <div className="contact-field">

                                <label htmlFor="custom-name">
                                    {t.customRequest.fullName}
                                </label>

                                <input
                                    id="custom-name"
                                    name="name"
                                    type="text"
                                    placeholder={
                                        t.customRequest.namePlaceholder
                                    }
                                    minLength={2}
                                    required
                                />

                            </div>


                            {/* ==================================================
                               EMAIL
                               ================================================== */}

                            <div className="contact-field">

                                <label htmlFor="custom-email">
                                    {t.customRequest.email}
                                </label>

                                <input
                                    id="custom-email"
                                    name="email"
                                    type="email"
                                    placeholder={
                                        t.customRequest.emailPlaceholder
                                    }
                                    required
                                />

                            </div>


                            {/* ==================================================
                               IMAGE UPLOAD
                               ================================================== */}

                            <div className="contact-field contact-field--full">

                                <label htmlFor="custom-image">
                                    {t.customRequest.uploadImage}
                                </label>

                                <label
                                    className="contact-upload"
                                    htmlFor="custom-image"
                                >

                                    <span className="contact-upload__icon">
                                        ↑
                                    </span>

                                    <strong>
                                        {
                                            imageName ||
                                            t.customRequest.chooseImage
                                        }
                                    </strong>

                                    <small>
                                        {t.customRequest.imageFormats}
                                    </small>

                                </label>

                                <input
                                    id="custom-image"
                                    name="image"
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={
                                        handleImageChange
                                    }
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


                            {/* ==================================================
                               TEXT FOR MUG
                               ================================================== */}

                            <div className="contact-field contact-field--full">

                                <label htmlFor="custom-text">
                                    {t.customRequest.textForMug}
                                </label>

                                <textarea
                                    id="custom-text"
                                    name="text"
                                    rows={4}
                                    placeholder={
                                        t.customRequest.textPlaceholder
                                    }
                                    maxLength={500}
                                />

                            </div>


                            {/* ==================================================
                               MUG MODEL
                               ================================================== */}

                            <div className="contact-field">

                                <label htmlFor="mug-model">
                                    {t.customRequest.mugModel}
                                </label>

                                <select
                                    id="mug-model"
                                    name="model"
                                    defaultValue="Classic"
                                >

                                    <option value="Classic">
                                        {t.customRequest.classic}
                                    </option>

                                    <option value="Premium">
                                        {t.customRequest.premium}
                                    </option>

                                </select>

                            </div>


                            {/* ==================================================
                               MUG SIZE
                               ================================================== */}

                            <div className="contact-field">

                                <label htmlFor="mug-size">
                                    {t.customRequest.mugSize}
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
                                        {t.customRequest.size11}
                                    </option>

                                    <option value="15 oz">
                                        {t.customRequest.size15}
                                    </option>

                                </select>

                            </div>


                            {/* ==================================================
                               MUG COLOR
                               ================================================== */}

                            <div className="contact-field">

                                <label htmlFor="mug-color">
                                    {t.customRequest.mugColor}
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
                                        {t.customRequest.black}
                                    </option>

                                    <option value="White">
                                        {t.customRequest.white}
                                    </option>

                                    <option value="Magic Black">
                                        {t.customRequest.magicBlack}
                                    </option>

                                    <option value="Red">
                                        {t.customRequest.red}
                                    </option>

                                </select>

                            </div>


                            {/* ==================================================
                               QUANTITY
                               ================================================== */}

                            <div className="contact-field">

                                <label htmlFor="mug-quantity">
                                    {t.customRequest.quantity}
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


                            {/* ==================================================
                               ADDITIONAL DETAILS
                               ================================================== */}

                            <div className="contact-field contact-field--full">

                                <label htmlFor="custom-notes">
                                    {t.customRequest.additionalDetails}
                                </label>

                                <textarea
                                    id="custom-notes"
                                    name="notes"
                                    rows={4}
                                    placeholder={
                                        t.customRequest.detailsPlaceholder
                                    }
                                    maxLength={1000}
                                />

                            </div>

                        </div>


                        {/* ==================================================
                           PRICE
                           ================================================== */}

                        <div className="contact-price">

                            <div>

                                <span>
                                    {t.customRequest.estimatedPrice}
                                </span>

                                <strong>
                                    ${estimatedTotal.toFixed(2)}
                                </strong>

                            </div>

                            <small>
                                ${PRICE_PER_MUG.toFixed(2)}{" "}
                                {t.customRequest.perMug}
                            </small>

                        </div>


                        {/* ==================================================
                           CUSTOM SUCCESS
                           ================================================== */}

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
                                {
                                    t.customRequest
                                        .successMessage
                                }
                            </div>

                        )}


                        {/* ==================================================
                           CUSTOM ERROR
                           ================================================== */}

                        {customStatus === "error" && (

                            <div
                                style={{
                                    marginTop: "18px",
                                    color: "#d95c5c",
                                    fontSize: "12px",
                                }}
                            >
                                {
                                    t.customRequest
                                        .errorMessage
                                }
                            </div>

                        )}


                        {/* ==================================================
                           CUSTOM BUTTON
                           ================================================== */}

                        <button
                            type="submit"
                            className="contact-primary-button"
                            disabled={
                                customStatus === "sending"
                            }
                        >

                            {
                                customStatus === "sending"
                                    ? t.customRequest
                                        .preparingRequest
                                    : t.customRequest
                                        .sendRequest
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


                    {/* ==================================================
                       SUPPORT CONTENT
                       ================================================== */}

                    <div className="contact-support__content">

                        <span className="contact-section-label">
                            {t.support.label}
                        </span>

                        <h2>
                            {t.support.title}
                        </h2>

                        <p>
                            {t.support.description}
                        </p>


                        <div className="contact-info">


                            {/* EMAIL */}

                            <div className="contact-info__item">

                                <span className="contact-info__icon">
                                    @
                                </span>

                                <div>

                                    <strong>
                                        {t.support.email}
                                    </strong>

                                    <span>
                                        business.magic.t.d@gmail.com
                                    </span>

                                </div>

                            </div>


                            {/* CUSTOMER SUPPORT */}

                            <div className="contact-info__item">

                                <span className="contact-info__icon">
                                    ?
                                </span>

                                <div>

                                    <strong>
                                        {t.support.customerSupport}
                                    </strong>

                                    <span>
                                        {
                                            t.support
                                                .customerSupportDescription
                                        }
                                    </span>

                                </div>

                            </div>

                        </div>

                    </div>


                    {/* ==================================================
                       SUPPORT IMAGE
                       ================================================== */}

                    <div className="contact-support__image">

                        <img
                            src="/images/contact/contact-support.jpg"
                            alt={t.support.title}
                        />

                    </div>


                    {/* ==================================================
                       SUPPORT FORM
                       ================================================== */}

                    <form
                        className="contact-support__form"
                        onSubmit={
                            handleSupportSubmit
                        }
                    >


                        {/* FULL NAME */}

                        <div className="contact-field">

                            <label htmlFor="support-name">
                                {t.support.fullName}
                            </label>

                            <input
                                id="support-name"
                                name="name"
                                type="text"
                                placeholder={
                                    t.support.namePlaceholder
                                }
                                minLength={2}
                                required
                            />

                        </div>


                        {/* EMAIL */}

                        <div className="contact-field">

                            <label htmlFor="support-email">
                                {t.support.emailLabel}
                            </label>

                            <input
                                id="support-email"
                                name="email"
                                type="email"
                                placeholder={
                                    t.support.emailPlaceholder
                                }
                                required
                            />

                        </div>


                        {/* ORDER NUMBER */}

                        <div className="contact-field">

                            <label htmlFor="support-order">
                                {t.support.orderNumber}
                            </label>

                            <input
                                id="support-order"
                                name="orderNumber"
                                type="text"
                                placeholder={
                                    t.support.orderOptional
                                }
                                maxLength={50}
                            />

                        </div>


                        {/* MESSAGE */}

                        <div className="contact-field">

                            <label htmlFor="support-message">
                                {t.support.message}
                            </label>

                            <textarea
                                id="support-message"
                                name="message"
                                rows={5}
                                placeholder={
                                    t.support.messagePlaceholder
                                }
                                minLength={5}
                                maxLength={2000}
                                required
                            />

                        </div>


                        {/* ==================================================
                           SUPPORT SUCCESS
                           ================================================== */}

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
                                {
                                    t.support
                                        .successMessage
                                }
                            </div>

                        )}


                        {/* ==================================================
                           SUPPORT ERROR
                           ================================================== */}

                        {supportStatus === "error" && (

                            <div
                                style={{
                                    color: "#d95c5c",
                                    fontSize: "12px",
                                }}
                            >
                                {
                                    t.support
                                        .errorMessage
                                }
                            </div>

                        )}


                        {/* ==================================================
                           SUPPORT BUTTON
                           ================================================== */}

                        <button
                            type="submit"
                            className="contact-secondary-button"
                            disabled={
                                supportStatus === "sending"
                            }
                        >

                            {
                                supportStatus === "sending"
                                    ? t.support
                                        .preparingMessage
                                    : t.support
                                        .sendMessage
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