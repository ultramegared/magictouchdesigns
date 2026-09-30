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
    useEffect,
    type ChangeEvent,
    type FormEvent,
} from "react";

import "./ContactPage.css";

import Header from "../../components/layout/Header";
import Footer from "../../components/home/Footer";

import { useLanguage } from "../../contexts/LanguageContext";
import { translations } from "../../translations";
import { apiRequest } from "../../services/api";
import { useNavigate } from "react-router-dom";
import { addToCart } from "../../utils/cart";

const BASE_PRICES: Record<string, Record<string, number>> = { Classic: { "11 oz": 13, "15 oz": 15 }, Premium: { "11 oz": 17, "15 oz": 17 } };
const COLORED_HANDLE_SURCHARGE = 2;
const SECOND_SIDE_SURCHARGE = 2;

const FONT_OPTIONS = [
    { id: "modern", name: "Montserrat", label: "Modern", className: "modern", fontFamily: "Montserrat, Arial, sans-serif" },
    { id: "elegant", name: "Playfair Display", label: "Elegant", className: "elegant", fontFamily: "Playfair Display, Georgia, serif" },
    { id: "script", name: "Dancing Script", label: "Script", className: "script", fontFamily: "Dancing Script, cursive" },
    { id: "handwritten", name: "Great Vibes", label: "Handwritten", className: "handwritten", fontFamily: "Great Vibes, cursive" },
    { id: "bold", name: "Bebas Neue", label: "Bold", className: "bold", fontFamily: "Bebas Neue, Impact, sans-serif" },
    { id: "classic", name: "Cormorant Garamond", label: "Classic", className: "classic", fontFamily: "Cormorant Garamond, Georgia, serif" },
    { id: "playful", name: "Pacifico", label: "Playful", className: "playful", fontFamily: "Pacifico, cursive" },
    { id: "luxury", name: "Cinzel", label: "Luxury", className: "luxury", fontFamily: "Cinzel, Georgia, serif" },
];

const ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
];

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

function ContactPage() {

    const { language } = useLanguage();
    const navigate = useNavigate();

    const t = translations[language].contact;
    const fontText = language === "es"
        ? { label: "Estilo de Letra", sample: "Tu Nombre", help: "Elige el estilo de letra que prefieres. Usaremos esta preferencia al preparar tu diseño." }
        : { label: "Font Style", sample: "Your Name", help: "Choose the lettering style you prefer. We will use this preference when preparing your design." };

    const [contactRecipientEmail, setContactRecipientEmail] = useState("");

    const [imageName, setImageName] = useState("");
    const [imagePreviewUrl, setImagePreviewUrl] = useState("");

    const [mugModel, setMugModel] = useState("Classic");
    const [mugSize, setMugSize] = useState("15 oz");
    const [printSides, setPrintSides] = useState("1");

    const [mugColor, setMugColor] = useState("White");
    const [fontStyle, setFontStyle] = useState("modern");

    const [quantity, setQuantity] = useState(1);

    const [imageError, setImageError] = useState("");

    const [customStatus, setCustomStatus] = useState<
        "idle" | "sending" | "success" | "error"
    >("idle");

    const [supportStatus, setSupportStatus] = useState<
        "idle" | "sending" | "success" | "error"
    >("idle");

    useEffect(() => {
        apiRequest<{ status: string; settings: { supportEmail: string } }>(
            `/api/settings?contact_email_refresh=${Date.now()}`,
            { cache: "no-store" }
        )
            .then((response) => {
                setContactRecipientEmail(response.settings.supportEmail || "");
            })
            .catch(() => {
                setContactRecipientEmail("");
            });
    }, []);


    const selectedColorIsHandle = mugColor.startsWith("White + ");
    const unitPrice =
        (BASE_PRICES[mugModel]?.[mugSize] || 0) +
        (selectedColorIsHandle ? COLORED_HANDLE_SURCHARGE : 0) +
        (printSides === "2" ? SECOND_SIDE_SURCHARGE : 0);
    const estimatedTotal = unitPrice * quantity;
    const selectedFont = FONT_OPTIONS.find((font) => font.id === fontStyle) || FONT_OPTIONS[0];


    /* ============================================================
       IMAGE VALIDATION
       ============================================================ */

    const handleImageChange = (
        event: ChangeEvent<HTMLInputElement>
    ) => {

        const file = event.target.files?.[0];

        setImageError("");
        setImageName("");
        setImagePreviewUrl((current) => {
            if (current) URL.revokeObjectURL(current);
            return "";
        });

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
        setImagePreviewUrl(URL.createObjectURL(file));
    };


    /* ============================================================
       CUSTOM MUG REQUEST
       ============================================================ */

    const handleCustomRequestSubmit = async (
        event: FormEvent<HTMLFormElement>
    ) => {

        event.preventDefault();

        if (imageError) {
            return;
        }

        setCustomStatus("sending");

        try {
            const form = event.currentTarget;
            const formData = new FormData(form);

            formData.set("quantity", String(quantity));
            formData.set("model", mugModel);
            formData.set("size", mugSize);
            formData.set("color", mugColor);
            formData.set("printSides", printSides);
            formData.set("fontStyle", fontStyle);
            formData.set("fontName", FONT_OPTIONS.find((font) => font.id === fontStyle)?.name || "Montserrat");

            const response = await apiRequest<{ checkoutRequestId: string; requestCode?: string; unitPrice?: number }>(
                "/api/contact/custom-request",
                {
                    method: "POST",
                    body: formData,
                }
            );

            if (!response.checkoutRequestId) {
                throw new Error("The custom request was created without a payment reference.");
            }

            const requestOptions: Record<string, string> = {
                "Design Views": printSides === "2" ? "Front + Back" : "Front",
                "Font": selectedFont.name,
                "Text": formData.get("text") ? String(formData.get("text")).trim() : "",
                "Details": formData.get("notes") ? String(formData.get("notes")).trim() : "",
                "Request": response.requestCode || response.checkoutRequestId,
            };
            addToCart(
                {
                    id: `custom-request:${response.checkoutRequestId}`,
                    name: `Custom Mug — ${mugModel} ${mugSize}`,
                    model: mugModel,
                    size: mugSize,
                    color: mugColor,
                    options: requestOptions,
                    price: Number(response.unitPrice ?? unitPrice),
                    image: imagePreviewUrl,
                    customRequestId: response.checkoutRequestId,
                },
                quantity,
            );

            setCustomStatus("success");
            form.reset();
            setImageName("");
            setImagePreviewUrl((current) => {
                if (current) URL.revokeObjectURL(current);
                return "";
            });
            setQuantity(1);
            setMugModel("Classic");
            setMugSize("15 oz");
            setMugColor("White");
            setPrintSides("1");
            setFontStyle("modern");

            navigate("/cart");
        } catch (error) {
            console.error(
                "Custom request submission error:",
                error
            );
            setCustomStatus("error");
        }
    };


    /* ============================================================
       SUPPORT
       ============================================================ */

    const handleSupportSubmit = async (
        event: FormEvent<HTMLFormElement>
    ) => {

        event.preventDefault();

        setSupportStatus("sending");

        try {
            const form = event.currentTarget;
            const formData = new FormData(form);

            await apiRequest(
                "/api/contact/support",
                {
                    method: "POST",
                    body: formData,
                }
            );

            setSupportStatus("success");
            form.reset();
        } catch (error) {
            console.error(
                "Support message submission error:",
                error
            );
            setSupportStatus("error");
        }
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

                        <input
                            type="text"
                            name="website"
                            tabIndex={-1}
                            autoComplete="off"
                            aria-hidden="true"
                            style={{ display: "none" }}
                        />

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

                                {imagePreviewUrl && (
                                    <div className="contact-image-preview" aria-label={language === "es" ? "Vista previa de la imagen" : "Image preview"}>
                                        <img
                                            src={imagePreviewUrl}
                                            alt={imageName || (language === "es" ? "Vista previa" : "Preview")}
                                        />
                                        <div className="contact-image-preview__meta">
                                            <strong>{language === "es" ? "Vista previa" : "Preview"}</strong>
                                            <span>{imageName}</span>
                                        </div>
                                    </div>
                                )}

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
                                    placeholder={t.customRequest.textPlaceholder}
                                    maxLength={500}
                                    style={{
                                        fontFamily: selectedFont.fontFamily,
                                        fontSize: "18px",
                                        lineHeight: 1.55,
                                    }}
                                />

                            </div>


                            {/* ==================================================
                               FONT STYLE — COMPACT LIVE SELECTOR
                               ================================================== */}

                            <div className="contact-field contact-field--full">

                                <label>
                                    {fontText.label}
                                </label>

                                <div
                                    role="radiogroup"
                                    aria-label={fontText.label}
                                    style={{
                                        display: "flex",
                                        flexWrap: "wrap",
                                        gap: "7px",
                                        marginTop: "8px",
                                    }}
                                >
                                    {FONT_OPTIONS.map((font) => {
                                        const isSelected = fontStyle === font.id;

                                        return (
                                            <button
                                                key={font.id}
                                                type="button"
                                                role="radio"
                                                aria-checked={isSelected}
                                                onClick={() => setFontStyle(font.id)}
                                                style={{
                                                    flex: "1 1 86px",
                                                    minWidth: "82px",
                                                    minHeight: "36px",
                                                    padding: "7px 10px",
                                                    borderRadius: "999px",
                                                    border: isSelected
                                                        ? "1px solid var(--skin-primary)"
                                                        : "1px solid var(--skin-border)",
                                                    background: isSelected
                                                        ? "var(--skin-primary)"
                                                        : "var(--skin-surface-alt)",
                                                    color: isSelected
                                                        ? "var(--skin-button-text)"
                                                        : "var(--skin-text)",
                                                    fontFamily: font.fontFamily,
                                                    fontSize: "13px",
                                                    fontWeight: 600,
                                                    lineHeight: 1,
                                                    letterSpacing: "0.1px",
                                                    cursor: "pointer",
                                                    boxShadow: isSelected
                                                        ? "0 4px 12px var(--skin-shadow)"
                                                        : "none",
                                                    transition: "transform .16s ease, background .16s ease, border-color .16s ease, box-shadow .16s ease",
                                                }}
                                                title={font.name}
                                            >
                                                {font.name}
                                            </button>
                                        );
                                    })}
                                </div>

                                <input type="hidden" name="fontStyle" value={fontStyle} />
                                <input
                                    type="hidden"
                                    name="fontName"
                                    value={selectedFont.name}
                                />

                                <small
                                    style={{
                                        display: "block",
                                        marginTop: "8px",
                                        color: "var(--skin-text-muted)",
                                        fontSize: "10px",
                                        lineHeight: 1.45,
                                    }}
                                >
                                    {fontText.help}
                                </small>
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
                                    value={mugModel}
                                    onChange={(event) => setMugModel(event.target.value)}
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

                                    <option value="White">
                                        {t.customRequest.white}
                                    </option>

                                    <option value="White + Red Handle">
                                        {t.customRequest.whiteRedHandle}
                                    </option>

                                    <option value="White + Black Handle">
                                        {t.customRequest.whiteBlackHandle}
                                    </option>

                                    <option value="White + Blue Handle">
                                        {t.customRequest.whiteBlueHandle}
                                    </option>

                                </select>

                            </div>


                            {/* ==================================================
                               PRINT SIDES
                               ================================================== */}

                            <div className="contact-field">
                                <label htmlFor="print-sides">
                                    {t.customRequest.printSides}
                                </label>
                                <select
                                    id="print-sides"
                                    name="printSides"
                                    value={printSides}
                                    onChange={(event) => setPrintSides(event.target.value)}
                                >
                                    <option value="1">{t.customRequest.oneSide}</option>
                                    <option value="2">{t.customRequest.twoSides}</option>
                                </select>
                            </div>


                            {/* ==================================================
                               QUANTITY
                               ================================================== */}

                            <div className="contact-field">

                                <label htmlFor="mug-quantity">
                                    {t.customRequest.quantity}
                                </label>

                                <input
                                    type="hidden"
                                    name="quantity"
                                    value={quantity}
                                />

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
                                ${unitPrice.toFixed(2)}{" "}
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
                                    ? (language === "es" ? "Preparando..." : "Adding to Cart...")
                                    : (language === "es" ? "AGREGAR AL CARRITO" : "ADD TO CART")
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
                                        {contactRecipientEmail || "Contact us through the form"}
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

                        <input
                            type="text"
                            name="website"
                            tabIndex={-1}
                            autoComplete="off"
                            aria-hidden="true"
                            style={{ display: "none" }}
                        />


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