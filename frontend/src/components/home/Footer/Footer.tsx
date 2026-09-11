import { useState } from "react";
import { useLanguage } from "../../../contexts/LanguageContext";
import "./Footer.css";
import { footerContent } from "./Footer.data";
import { translations } from "../../../translations";

function SocialIcon({ name }: { name: string }) {
    const common = { viewBox: "0 0 24 24", "aria-hidden": true as const };
    if (name === "Instagram") return <svg {...common}><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>;
    if (name === "Facebook") return <svg {...common}><path d="M14 8h3V4h-3c-3.3 0-5 1.9-5 5v3H6v4h3v4h4v-4h3l1-4h-4V9c0-.7.3-1 1-1Z" fill="currentColor"/></svg>;
    if (name === "TikTok") return <svg {...common}><path d="M15 4c.4 2.4 1.8 3.8 4 4v3.1c-1.5-.1-2.9-.6-4-1.4V15a5 5 0 1 1-4.3-5v3.2a1.9 1.9 0 1 0 1.3 1.8V4H15Z" fill="currentColor"/></svg>;
    if (name === "YouTube") return <svg {...common}><path d="M21 8.2a2.8 2.8 0 0 0-2-2C17.2 5.7 12 5.7 12 5.7s-5.2 0-7 .5a2.8 2.8 0 0 0-2 2A29 29 0 0 0 2.5 12c0 1.3.2 2.7.5 3.8a2.8 2.8 0 0 0 2 2c1.8.5 7 .5 7 .5s5.2 0 7-.5a2.8 2.8 0 0 0 2-2c.3-1.1.5-2.5.5-3.8s-.2-2.7-.5-3.8Z" fill="currentColor"/><path d="m10 9 5 3-5 3V9Z" fill="#05080C"/></svg>;
    if (name === "Pinterest") return <svg {...common}><path d="M12 3a9 9 0 0 0-3.3 17.4c-.1-1.5 0-3.3.4-4.8l1.1-4.6s-.3-.7-.3-1.7c0-1.6.9-2.8 2.1-2.8 1 0 1.5.8 1.5 1.7 0 1-.6 2.4-.9 3.7-.3 1.1.6 2 1.7 2 2.1 0 3.7-2.2 3.7-5.3 0-2.8-2-4.8-4.9-4.8-3.3 0-5.2 2.5-5.2 5 0 1 .4 2 .9 2.6.1.1.1.2.1.4l-.3 1.2c-.1.4-.4.5-.7.3-1.8-.7-2.6-2.7-2.6-4.8C5.4 6 8 3.5 12.4 3.5c3.6 0 6.4 2.6 6.4 6.1 0 3.7-2.3 6.6-5.4 6.6-1.1 0-2.2-.6-2.6-1.3l-.7 2.7c-.3 1.2-1.1 2.7-1.6 3.6A9 9 0 1 0 12 3Z" fill="currentColor"/></svg>;
    return <span className="footer__social-fallback">{name.slice(0, 1)}</span>;
}

function Footer() {
    const [openSection, setOpenSection] = useState<string | null>(null);
    const { language, setLanguage } = useLanguage();
    const t = translations[language];
    const footerLinkTranslations: Record<string, string> = {
        "All Models": t.footer.allModels,
        Collections: t.footer.collections,
        Customize: t.footer.customize,
        "About Us": t.footer.aboutUs,
        "How It Works": t.footer.howItWorks,
        "Shipping & Returns": t.footer.shippingReturns,
        FAQs: t.footer.faqs,
        "Contact Us": t.footer.contactUs,
        "Track My Order": t.footer.trackOrder,
        "Privacy Policy": t.footer.privacyPolicy,
        "Terms of Service": t.footer.termsOfService,
    };
    const toggleSection = (section: string) => setOpenSection(openSection === section ? null : section);
    const renderSection = (key: string, title: string, links: typeof footerContent.shop.links) => (
        <div className="footer__section">
            <button type="button" className="footer__section-title" onClick={() => toggleSection(key)} aria-expanded={openSection === key}>
                <span>{title}</span><span className={`footer__section-icon ${openSection === key ? "is-open" : ""}`} aria-hidden="true">+</span>
            </button>
            <div className={`footer__section-content ${openSection === key ? "is-open" : ""}`}>
                {links.map((link) => <a key={link.label} href={link.href} className="footer__link">{footerLinkTranslations[link.label] ?? link.label}</a>)}
            </div>
        </div>
    );

    const supportLinks = footerContent.support.links;
    const whatsapp = supportLinks.find((link) => link.label.toLowerCase() === "whatsapp") ?? { label: "WhatsApp", href: "https://wa.me/qr/6FQZEC7MEQN3N1" };
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(whatsapp.href)}`;
    const socialLinks = footerContent.social.filter((social) => social.href && social.href !== "#");
    const shopLinks = footerContent.shop.links.slice(0, 5);
    const companyLinks = footerContent.company.links.slice(0, 5);

    return (
        <footer className="footer">
            <div className="footer__container">
                <div className="footer__desktop-layout">
                    <div className="footer__brand">
                        <div className="footer__brand-mark">MT<span>D</span></div>
                        <div className="footer__brand-name">MAGIC TOUCH <strong>DESIGNS</strong></div>
                        <p>Custom items for every occasion.<br />Personalized just for you.</p>
                        <div className="footer__benefits"><span>♢ <b>High Quality</b></span><span>⌁ <b>Fast Shipping</b></span><span>♡ <b>Made with Love</b></span></div>
                    </div>

                    <div className="footer__connect">
                        <div className="footer__connect-heading"><span>{language === "es" ? "Conecta" : "Connect"}</span> {language === "es" ? "con Nosotros" : "With Us"}</div>
                        <p>{language === "es" ? "Síguenos, escríbenos o escanea el QR para hablar directamente por WhatsApp." : "Follow us, message us, or scan the QR code to chat directly on WhatsApp."}</p>
                        <div className="footer__social-grid">
                            {socialLinks.map((social) => <a key={social.name} href={social.href} className={`footer__social-card footer__social-card--${social.name.toLowerCase()}`} target="_blank" rel="noopener noreferrer" aria-label={social.name}><SocialIcon name={social.name} /><span>{social.name}</span></a>)}
                        </div>
                        <div className="footer__whatsapp-card">
                            <div className="footer__whatsapp-copy">
                                <div className="footer__whatsapp-title"><span className="footer__whatsapp-icon">◔</span><span>Chat on <strong>WhatsApp</strong></span></div>
                                <p>{language === "es" ? "¡Contáctanos directamente!" : "Get in touch with us directly!"}</p>
                                <a href={whatsapp.href} className="footer__whatsapp-button" target="_blank" rel="noopener noreferrer">{language === "es" ? "Abrir WhatsApp" : "Open WhatsApp"}<span>→</span></a>
                            </div>
                            <div className="footer__qr-wrap"><img src={qrUrl} alt="WhatsApp QR code" /><span>Scan Me!</span></div>
                            <a href={`tel:${footerContent.phone.replace(/\D/g, "")}`} className="footer__whatsapp-phone">{footerContent.phone}</a>
                        </div>
                    </div>

                    <div className="footer__quick-links">
                        <div className="footer__quick-title">Quick Links</div>
                        {[...shopLinks, ...companyLinks].slice(0, 8).map((link) => <a key={`${link.label}-${link.href}`} href={link.href} className="footer__link">{footerLinkTranslations[link.label] ?? link.label}</a>)}
                    </div>
                </div>

                <div className="footer__mobile-sections">
                    {renderSection("shop-mobile", t.navigation.shop, footerContent.shop.links)}
                    {renderSection("company-mobile", t.navigation.company, footerContent.company.links)}
                    {renderSection("support-mobile", t.navigation.support, supportLinks)}
                    <div className="footer__section">
                        <button type="button" className="footer__section-title" onClick={() => toggleSection("payments-mobile")} aria-expanded={openSection === "payments-mobile"}><span>{t.footer.paymentMethods}</span><span className={`footer__section-icon ${openSection === "payments-mobile" ? "is-open" : ""}`}>+</span></button>
                        <div className={`footer__section-content ${openSection === "payments-mobile" ? "is-open" : ""}`}><div className="footer__payments"><span>VISA</span><span>AMEX</span><span>PayPal</span><span> Pay</span></div></div>
                    </div>
                    <div className="footer__section">
                        <button type="button" className="footer__section-title" onClick={() => toggleSection("language-mobile")} aria-expanded={openSection === "language-mobile"}><span>{t.footer.language}</span><span className={`footer__section-icon ${openSection === "language-mobile" ? "is-open" : ""}`}>+</span></button>
                        <div className={`footer__section-content ${openSection === "language-mobile" ? "is-open" : ""}`}><div className="footer__languages"><button type="button" className={language === "en" ? "footer__language footer__language--active" : "footer__language"} onClick={() => setLanguage("en")}>EN</button><button type="button" className={language === "es" ? "footer__language footer__language--active" : "footer__language"} onClick={() => setLanguage("es")}>ES</button></div></div>
                    </div>
                </div>

                <div className="footer__mobile-connect">
                    <div className="footer__connect-heading"><span>{language === "es" ? "Conecta" : "Connect"}</span> {language === "es" ? "con Nosotros" : "With Us"}</div>
                    <p>{language === "es" ? "Síguenos o escríbenos directamente por WhatsApp." : "Follow us or chat with us directly."}</p>
                    <div className="footer__social-grid">
                        {socialLinks.map((social) => <a key={social.name} href={social.href} className={`footer__social-card footer__social-card--${social.name.toLowerCase()}`} target="_blank" rel="noopener noreferrer" aria-label={social.name}><SocialIcon name={social.name} /><span>{social.name}</span></a>)}
                    </div>
                    <div className="footer__whatsapp-card">
                        <div className="footer__whatsapp-copy"><div className="footer__whatsapp-title"><span className="footer__whatsapp-icon">◔</span><span>Chat on <strong>WhatsApp</strong></span></div><p>{language === "es" ? "¡Contáctanos directamente!" : "Get in touch with us directly!"}</p><a href={whatsapp.href} className="footer__whatsapp-button" target="_blank" rel="noopener noreferrer">{language === "es" ? "Abrir WhatsApp" : "Open WhatsApp"}<span>→</span></a></div>
                        <div className="footer__qr-wrap"><img src={qrUrl} alt="WhatsApp QR code" /><span>Scan Me!</span></div>
                        <a href={`tel:${footerContent.phone.replace(/\D/g, "")}`} className="footer__whatsapp-phone">{footerContent.phone}</a>
                    </div>
                </div>

                <div className="footer__desktop-bottom">
                    <div>{t.footer.copyright}</div><nav><a href="/privacy">{t.footer.privacyPolicy}</a><span>|</span><a href="/terms-of-service">{t.footer.termsOfService}</a><span>|</span><a href="/shipping-returns">{t.footer.shippingReturns}</a></nav><div className="footer__secure">♙ Secure Payments <span>VISA</span><span>AMEX</span><span>PayPal</span><span> Pay</span></div>
                </div>
                <div className="footer__bottom"><p className="footer__copyright">{t.footer.copyright}</p><p className="footer__designer">{t.footer.designer}</p></div>
            </div>
        </footer>
    );
}

export default Footer;
