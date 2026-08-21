/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: Footer.tsx
 * Module: Layout
 * Language: TypeScript React
 * Description:
 * Responsive site footer.
 * ================================================================
 */

import { useState } from "react";

import {
    useLanguage,
} from "../../../contexts/LanguageContext";

import "./Footer.css";

import { footerContent } from "./Footer.data";
import { translations } from "../../../translations";

function Footer() {

    const [openSection, setOpenSection] = useState<string | null>(null);
    const {
    language,
    setLanguage,
} = useLanguage();
const t = translations[language];
const footerLinkTranslations: Record<string, string> = {
    "All Models": t.footer.allModels,
    "Collections": t.footer.collections,
    "Customize": t.footer.customize,
    "About Us": t.footer.aboutUs,
    "How It Works": t.footer.howItWorks,
    "Shipping & Returns": t.footer.shippingReturns,
    "FAQs": t.footer.faqs,
    "Contact Us": t.footer.contactUs,
    "Track My Order": t.footer.trackOrder,
    "Privacy Policy": t.footer.privacyPolicy,
    "Terms of Service": t.footer.termsOfService,
};

    const toggleSection = (section: string) => {

        setOpenSection(
            openSection === section ? null : section
        );

    };

    const renderSection = (
        key: string,
        title: string,
        links: typeof footerContent.shop.links
    ) => (

        <div className="footer__section">

            <button
                type="button"
                className="footer__section-title"
                onClick={() => toggleSection(key)}
                aria-expanded={openSection === key}
            >

                <span>
                    {title}
                </span>

                <span
                    className={`footer__section-icon ${
                        openSection === key ? "is-open" : ""
                    }`}
                    aria-hidden="true"
                >
                    +
                </span>

            </button>

            <div
                className={`footer__section-content ${
                    openSection === key ? "is-open" : ""
                }`}
            >

                {links.map((link) => (

                    <a
                        key={link.label}
                        href={link.href}
                        className="footer__link"
                    >
                       {footerLinkTranslations[link.label] ?? link.label}
                    </a>

                ))}

            </div>

        </div>

    );

    return (

    <footer className="footer">
        <div className="footer__container">

                <div className="footer__desktop-grid">

                    {renderSection(
                        "shop",
                        t.navigation.shop,
                        footerContent.shop.links
                    )}

                    {renderSection(
                        "company",
                        t.navigation.company,
                        footerContent.company.links
                    )}

                    <div className="footer__section footer__section--support">

                        <div className="footer__section-heading">
           {t.navigation.support}
                        </div>

                        <a
                            href={`tel:${footerContent.phone.replace(/\D/g, "")}`}
                            className="footer__phone"
                        >
                            ☎ {footerContent.phone}
                        </a>

                        {footerContent.support.links.map((link) => (

                            <a
                                key={link.label}
                                href={link.href}
                                className="footer__link"
                            >
                                {footerLinkTranslations[link.label] ?? link.label}
                            </a>

                        ))}

                    </div>

                    <div className="footer__section footer__section--payments">

                        <div className="footer__section-heading">
                            {t.footer.paymentMethods}
                        </div>

                        <div className="footer__payments">

                            <span>VISA</span>
                            <span>AMEX</span>
                            <span>PayPal</span>
                            <span> Pay</span>

                        </div>

                        <div className="footer__section-heading footer__language-heading">
                            {t.footer.language}
                        </div>

                        <div className="footer__languages">

    <button
        type="button"
        className={
            language === "en"
                ? "footer__language footer__language--active"
                : "footer__language"
        }
        onClick={() => setLanguage("en")}
        aria-pressed={language === "en"}
    >
        EN
    </button>

    <button
        type="button"
        className={
            language === "es"
                ? "footer__language footer__language--active"
                : "footer__language"
        }
        onClick={() => setLanguage("es")}
        aria-pressed={language === "es"}
    >
        ES
    </button>

</div>

                    </div>

                </div>

                <div className="footer__mobile-sections">

                    {renderSection(
                        "shop-mobile",
                        t.navigation.shop,
                        footerContent.shop.links
                    )}

                    {renderSection(
                        "company-mobile",
                        t.navigation.company,
                        footerContent.company.links
                    )}

                    {renderSection(
                        "support-mobile",
                        t.navigation.support,
                        footerContent.support.links
                    )}

                    <div className="footer__section">

                        <button
                            type="button"
                            className="footer__section-title"
                            onClick={() =>
                                toggleSection("payments-mobile")
                            }
                            aria-expanded={
                                openSection === "payments-mobile"
                            }
                        >

                            <span>
                                {t.footer.paymentMethods}
                            </span>

                            <span
                                className={`footer__section-icon ${
                                    openSection === "payments-mobile"
                                        ? "is-open"
                                        : ""
                                }`}
                                aria-hidden="true"
                            >
                                +
                            </span>

                        </button>

                        <div
                            className={`footer__section-content ${
                                openSection === "payments-mobile"
                                    ? "is-open"
                                    : ""
                            }`}
                        >

                            <div className="footer__payments">

                                <span>VISA</span> 
                                <span>AMEX</span>
                                <span>PayPal</span>
                                <span> Pay</span>

                            </div>

                        </div>

                    </div>

                    <div className="footer__section">

                        <button
                            type="button"
                            className="footer__section-title"
                            onClick={() =>
                                toggleSection("language-mobile")
                            }
                            aria-expanded={
                                openSection === "language-mobile"
                            }
                        >

                            <span>
                                {t.footer.language}
                            </span>

                            <span
                                className={`footer__section-icon ${
                                    openSection === "language-mobile"
                                        ? "is-open"
                                        : ""
                                }`}
                                aria-hidden="true"
                            >
                                +
                            </span>

                        </button>

                        <div
                            className={`footer__section-content ${
                                openSection === "language-mobile"
                                    ? "is-open"
                                    : ""
                            }`}
                        >

                            <div className="footer__languages">

    <button
        type="button"
        className={
            language === "en"
                ? "footer__language footer__language--active"
                : "footer__language"
        }
        onClick={() => setLanguage("en")}
        aria-pressed={language === "en"}
    >
        EN
    </button>

    <button
        type="button"
        className={
            language === "es"
                ? "footer__language footer__language--active"
                : "footer__language"
        }
        onClick={() => setLanguage("es")}
        aria-pressed={language === "es"}
    >
        ES
    </button>

</div>

                        </div>

                    </div>

                </div>

                <div className="footer__contact">

                    <a
                        href={`tel:${footerContent.phone.replace(/\D/g, "")}`}
                    >
                        <span className="footer__contact-label">
                            {t.footer.contactUs}
                        </span>

                        <span className="footer__contact-number">
                            {footerContent.phone}
                        </span>
                    </a>

                </div>

                <div className="footer__social">

    <a
        href={footerContent.social.find((social) => social.name === "Instagram")?.href ?? "#"}
        
        className="footer__social-link footer__social-link--instagram"
        aria-label="Instagram"
        title="Instagram"
        target="_blank"
        rel="noopener noreferrer"
    >
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <rect
                x="3"
                y="3"
                width="18"
                height="18"
                rx="5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
            />

            <circle
                cx="12"
                cy="12"
                r="4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
            />

            <circle
                cx="17.5"
                cy="6.5"
                r="1"
                fill="currentColor"
            />
        </svg>
    </a>


    <a
        href={footerContent.social.find((social) => social.name === "Facebook")?.href ?? "#"}
        className="footer__social-link footer__social-link--facebook"
        aria-label="Facebook"
        title="Facebook"
        target="_blank"
        rel="noopener noreferrer"
    >
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <path
                d="M14 8h3V4h-3c-3.3 0-5 1.9-5 5v3H6v4h3v4h4v-4h3l1-4h-4V9c0-.7.3-1 1-1Z"
                fill="currentColor"
            />
        </svg>
    </a>


    <a
        href={footerContent.social.find((social) => social.name === "TikTok")?.href ?? "#"}
        className="footer__social-link footer__social-link--tiktok"
        aria-label="TikTok"
        title="TikTok"
        target="_blank"
        rel="noopener noreferrer"
    >
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <path
                d="M15 4c.4 2.4 1.8 3.8 4 4v3.1c-1.5-.1-2.9-.6-4-1.4V15a5 5 0 1 1-4.3-5v3.2a1.9 1.9 0 1 0 1.3 1.8V4H15Z"
                fill="currentColor"
            />
        </svg>
    </a>


    <a
        href={footerContent.social.find((social) => social.name === "YouTube")?.href ?? "#"}
        className="footer__social-link footer__social-link--youtube"
        aria-label="YouTube"
        title="YouTube"
        target="_blank"
        rel="noopener noreferrer"
    >
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <path
                d="M21 8.2a2.8 2.8 0 0 0-2-2C17.2 5.7 12 5.7 12 5.7s-5.2 0-7 .5a2.8 2.8 0 0 0-2 2A29 29 0 0 0 2.5 12c0 1.3.2 2.7.5 3.8a2.8 2.8 0 0 0 2 2c1.8.5 7 .5 7 .5s5.2 0 7-.5a2.8 2.8 0 0 0 2-2c.3-1.1.5-2.5.5-3.8s-.2-2.7-.5-3.8Z"
                fill="currentColor"
            />

            <path
                d="m10 9 5 3-5 3V9Z"
                fill="#05080C"
            />
        </svg>
    </a>

</div>

                <div className="footer__bottom">

                    <p className="footer__copyright">
{t.footer.copyright}
                    </p>

                    <p className="footer__designer">
{t.footer.designer}
                    </p>

                </div>

            </div>

        </footer>

    );

}


export default Footer;


