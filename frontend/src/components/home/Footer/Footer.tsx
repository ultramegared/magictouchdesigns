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

import "./Footer.css";

import { footerContent } from "./Footer.data";

function Footer() {

    const [openSection, setOpenSection] = useState<string | null>(null);

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
                        {link.label}
                    </a>

                ))}

            </div>

        </div>

    );

    return (

    <footer className="footer">

        <div style={{ color: "red", fontSize: "30px" }}>
            FOOTER TEST
        </div>

        <div className="footer__container">

                <div className="footer__desktop-grid">

                    {renderSection(
                        "shop",
                        footerContent.shop.title,
                        footerContent.shop.links
                    )}

                    {renderSection(
                        "company",
                        footerContent.company.title,
                        footerContent.company.links
                    )}

                    <div className="footer__section footer__section--support">

                        <div className="footer__section-heading">
                            SUPPORT
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
                                {link.label}
                            </a>

                        ))}

                    </div>

                    <div className="footer__section footer__section--payments">

                        <div className="footer__section-heading">
                            PAYMENT METHODS
                        </div>

                        <div className="footer__payments">

                            <span>VISA</span>
                            <span>MC</span>
                            <span>AMEX</span>
                            <span>PayPal</span>
                            <span> Pay</span>

                        </div>

                        <div className="footer__section-heading footer__language-heading">
                            LANGUAGE
                        </div>

                        <div className="footer__languages">

                            <button
                                type="button"
                                className="footer__language footer__language--active"
                            >
                                EN
                            </button>

                            <button
                                type="button"
                                className="footer__language"
                            >
                                ES
                            </button>

                        </div>

                    </div>

                </div>

                <div className="footer__mobile-sections">

                    {renderSection(
                        "shop-mobile",
                        footerContent.shop.title,
                        footerContent.shop.links
                    )}

                    {renderSection(
                        "company-mobile",
                        footerContent.company.title,
                        footerContent.company.links
                    )}

                    {renderSection(
                        "support-mobile",
                        footerContent.support.title,
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
                                PAYMENT METHODS
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
                                <span>MC</span>
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
                                LANGUAGE
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
                                    className="footer__language footer__language--active"
                                >
                                    EN
                                </button>

                                <button
                                    type="button"
                                    className="footer__language"
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
                            CONTACT US
                        </span>

                        <span className="footer__contact-number">
                            {footerContent.phone}
                        </span>
                    </a>

                </div>

                <div className="footer__social">

                    {footerContent.social.map((social) => (

                        <a
                            key={social.name}
                            href={social.href}
                            className="footer__social-link"
                            aria-label={social.name}
                            title={social.name}
                        >
                            {social.name.charAt(0)}
                        </a>

                    ))}

                </div>

                <div className="footer__bottom">

                    <p className="footer__copyright">
                        {footerContent.copyright}
                    </p>

                    <p className="footer__designer">
                        {footerContent.designer}
                    </p>

                </div>

            </div>

        </footer>

    );

}

export default Footer;