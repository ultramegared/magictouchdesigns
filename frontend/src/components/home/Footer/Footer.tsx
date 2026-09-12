import { useEffect, useState } from "react";
import { useLanguage } from "../../../contexts/LanguageContext";
import "./Footer.css";
import { footerContent } from "./Footer.data";
import { translations } from "../../../translations";
import { apiRequest } from "../../../services/api";

type LocalizedText = { en: string; es: string };
type FooterLink = { id: string; label: LocalizedText; path: string; active: boolean; order: number };
type FooterSection = { id: string; title: LocalizedText; links: FooterLink[]; active: boolean; order: number };
type SocialLink = { id: string; name: string; url: string; active: boolean; order: number };
type SiteConfig = { websiteName?: LocalizedText; slogan?: LocalizedText; businessPhone?: string; footerSections?: FooterSection[]; socialLinks?: SocialLink[] };

function SocialIcon({ name }: { name: string }) {
    const common = { viewBox: "0 0 24 24", "aria-hidden": true as const };
    if (name === "Instagram") return <svg {...common}><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>;
    if (name === "Facebook") return <svg {...common}><path d="M14 8h3V4h-3c-3.3 0-5 1.9-5 5v3H6v4h3v4h4v-4h3l1-4h-4V9c0-.7.3-1 1-1Z" fill="currentColor"/></svg>;
    if (name === "TikTok") return <svg {...common}><path d="M15 4c.4 2.4 1.8 3.8 4 4v3.1c-1.5-.1-2.9-.6-4-1.4V15a5 5 0 1 1-4.3-5v3.2a1.9 1.9 0 1 0 1.3 1.8V4H15Z" fill="currentColor"/></svg>;
    if (name === "YouTube") return <svg {...common}><path d="M21 8.2a2.8 2.8 0 0 0-2-2C17.2 5.7 12 5.7 12 5.7s-5.2 0-7 .5a2.8 2.8 0 0 0-2 2A29 29 0 0 0 2.5 12c0 1.3.2 2.7.5 3.8a2.8 2.8 0 0 0 2 2c1.8.5 7 .5 7 .5s5.2 0 7-.5a2.8 2.8 0 0 0 2-2c.3-1.1.5-2.5.5-3.8s-.2-2.7-.5-3.8Z" fill="currentColor"/><path d="m10 9 5 3-5 3V9Z" fill="#05080C"/></svg>;
    return <span className="footer__social-fallback">{name.slice(0, 1)}</span>;
}

const localize = (value: LocalizedText | undefined, language: "en" | "es", fallback: string) => {
    const selected = language === "es" ? value?.es : value?.en;
    return String(selected || value?.en || fallback);
};

function Footer() {
    const [openSection, setOpenSection] = useState<string | null>(null);
    const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
    const [logoUrl, setLogoUrl] = useState("");
    const { language, setLanguage } = useLanguage();
    const t = translations[language];

    useEffect(() => {
        let cancelled = false;
        apiRequest<{ status: string; settings: { config: SiteConfig; logoUrl?: string | null } }>(`/api/settings?footer_refresh=${Date.now()}`, { cache: "no-store" })
            .then(result => { if (!cancelled) { setSiteConfig(result.settings.config); setLogoUrl(result.settings.logoUrl || ""); } })
            .catch(() => {});
        return () => { cancelled = true; };
    }, [language]);

    const defaultSections: FooterSection[] = [
        { id: "shop", title: { en: "SHOP", es: "TIENDA" }, active: true, order: 1, links: footerContent.shop.links.map((x, i) => ({ id: `shop-${i}`, label: { en: x.label, es: x.label }, path: x.href, active: true, order: i + 1 })) },
        { id: "company", title: { en: "COMPANY", es: "EMPRESA" }, active: true, order: 2, links: footerContent.company.links.map((x, i) => ({ id: `company-${i}`, label: { en: x.label, es: x.label }, path: x.href, active: true, order: i + 1 })) },
        { id: "support", title: { en: "SUPPORT", es: "SOPORTE" }, active: true, order: 3, links: footerContent.support.links.map((x, i) => ({ id: `support-${i}`, label: { en: x.label, es: x.label }, path: x.href, active: true, order: i + 1 })) },
    ];
    const sections = (siteConfig?.footerSections?.length ? siteConfig.footerSections : defaultSections)
        .filter(x => x.active && (x.title?.en?.trim() || x.title?.es?.trim()))
        .sort((a, b) => a.order - b.order);
    const socialLinks = (siteConfig?.socialLinks?.length ? siteConfig.socialLinks : footerContent.social.map((x, i) => ({ id: `social-${i}`, name: x.name, url: x.href, active: true, order: i + 1 }))).filter(x => x.active && x.name && x.url);
    const phone = siteConfig?.businessPhone || footerContent.phone;
    const supportSection = sections.find(x => x.id === "footer-support") || sections.find(x => x.id === "support") || sections[sections.length - 1];
    const whatsapp = supportSection?.links.find(x => x.label.en.trim().toLowerCase() === "whatsapp") || { path: "https://wa.me/qr/6FQZEC7MEQN3N1", label: { en: "WhatsApp", es: "WhatsApp" } };
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(whatsapp.path)}`;
    const linkTranslation: Record<string, string> = {
        "All Models": t.footer.allModels, Collections: t.footer.collections, Customize: t.footer.customize, "About Us": t.footer.aboutUs,
        "How It Works": t.footer.howItWorks, "Shipping & Returns": t.footer.shippingReturns, FAQs: t.footer.faqs, "Contact Us": t.footer.contactUs,
        "Track My Order": t.footer.trackOrder, "Privacy Policy": t.footer.privacyPolicy, "Terms of Service": t.footer.termsOfService,
    };
    const translateLink = (link: FooterLink) => localize(link.label, language, link.label.en) || linkTranslation[link.label.en] || link.label.en;
    const renderSection = (section: FooterSection) => (
        <div className="footer__section" key={section.id}>
            <button type="button" className="footer__section-title" onClick={() => setOpenSection(openSection === section.id ? null : section.id)} aria-expanded={openSection === section.id}><span>{localize(section.title, language, section.title.en)}</span><span className={`footer__section-icon ${openSection === section.id ? "is-open" : ""}`}>+</span></button>
            <div className={`footer__section-content ${openSection === section.id ? "is-open" : ""}`}>{section.links.filter(x => x.active).sort((a,b) => a.order-b.order).map(link => <a key={link.id} href={link.path} className="footer__link">{translateLink(link)}</a>)}</div>
        </div>
    );
    const renderSocialLink = (social: SocialLink) => <a key={social.id} href={social.url === "#" ? undefined : social.url} className={`footer__social-card footer__social-card--${social.name.toLowerCase()}`} target={social.url === "#" ? undefined : "_blank"} rel={social.url === "#" ? undefined : "noopener noreferrer"} aria-label={social.name}><SocialIcon name={social.name} /><span>{social.name}</span></a>;
    const websiteName = localize(siteConfig?.websiteName, language, "Magic Touch Designs");
    const slogan = localize(siteConfig?.slogan, language, language === "es" ? "Regalos y diseños personalizados" : "Personalized Gifts & Designs");

    return (
        <footer className="footer">
            <div className="footer__container">
                <div className="footer__desktop-layout">
                    <div className="footer__brand">
                        <div className="footer__brand-mark" style={{ background: "transparent", border: 0, borderRadius: 0, boxShadow: "none", color: "transparent", backgroundImage: `url('${logoUrl || "/images/logo/jqyd-logo-256.png"}')`, backgroundPosition: "center", backgroundSize: "contain", backgroundRepeat: "no-repeat" }} aria-label="JQ & YD" />
                        <div className="footer__brand-name">{websiteName}</div>
                        <p>{slogan}.</p>
                        <div className="footer__benefits"><span>♢ <b>{language === "es" ? "Alta calidad" : "High Quality"}</b></span><span>⌁ <b>{language === "es" ? "Envío rápido" : "Fast Shipping"}</b></span><span>♡ <b>{language === "es" ? "Hecho con amor" : "Made with Love"}</b></span></div>
                    </div>
                    <div className="footer__connect">
                        <div className="footer__connect-heading"><span>{language === "es" ? "Conecta" : "Connect"}</span> {language === "es" ? "con Nosotros" : "With Us"}</div>
                        <p>{language === "es" ? "Síguenos, escríbenos o escanea el QR para hablar directamente por WhatsApp." : "Follow us, message us, or scan the QR code to chat directly on WhatsApp."}</p>
                        <div className="footer__social-grid">{socialLinks.map(renderSocialLink)}</div>
                        <div className="footer__whatsapp-card"><div className="footer__whatsapp-copy"><div className="footer__whatsapp-title"><span className="footer__whatsapp-icon">◔</span><span>{language === "es" ? "Chat en" : "Chat on"} <strong>WhatsApp</strong></span></div><p>{language === "es" ? "¡Contáctanos directamente!" : "Get in touch with us directly!"}</p><a href={whatsapp.path} className="footer__whatsapp-button" target="_blank" rel="noopener noreferrer">{language === "es" ? "Abrir WhatsApp" : "Open WhatsApp"}<span>→</span></a></div><div className="footer__qr-wrap"><img src={qrUrl} alt="WhatsApp QR code"/><span>{language === "es" ? "Escanéame" : "Scan Me!"}</span></div><a href={`tel:${phone.replace(/\D/g, "")}`} className="footer__whatsapp-phone">{phone}</a></div>
                    </div>
                    <div className="footer__quick-links"><div className="footer__quick-title">{language === "es" ? "Enlaces rápidos" : "Quick Links"}</div>{sections.flatMap(x => x.links.filter(l => l.active)).slice(0,8).map(link => <a key={`${link.id}-${link.path}`} href={link.path} className="footer__link">{translateLink(link)}</a>)}</div>
                </div>

                <div className="footer__mobile-sections">
                    {sections.map(renderSection)}
                    <div className="footer__section"><button type="button" className="footer__section-title" onClick={()=>setOpenSection(openSection === "payments" ? null : "payments")} aria-expanded={openSection === "payments"}><span>{t.footer.paymentMethods}</span><span className={`footer__section-icon ${openSection === "payments" ? "is-open" : ""}`}>+</span></button><div className={`footer__section-content ${openSection === "payments" ? "is-open" : ""}`}><div className="footer__payments"><span>VISA</span><span>AMEX</span><span>PayPal</span><span> Pay</span></div></div></div>
                    <div className="footer__section"><button type="button" className="footer__section-title" onClick={()=>setOpenSection(openSection === "language" ? null : "language")} aria-expanded={openSection === "language"}><span>{t.footer.language}</span><span className={`footer__section-icon ${openSection === "language" ? "is-open" : ""}`}>+</span></button><div className={`footer__section-content ${openSection === "language" ? "is-open" : ""}`}><div className="footer__languages"><button type="button" className={language === "en" ? "footer__language footer__language--active" : "footer__language"} onClick={()=>setLanguage("en")}>EN</button><button type="button" className={language === "es" ? "footer__language footer__language--active" : "footer__language"} onClick={()=>setLanguage("es")}>ES</button></div></div></div>
                </div>

                <div className="footer__mobile-connect"><div className="footer__connect-heading"><span>{language === "es" ? "Conecta" : "Connect"}</span> {language === "es" ? "con Nosotros" : "With Us"}</div><p>{language === "es" ? "Síguenos o escríbenos directamente por WhatsApp." : "Follow us or chat with us directly."}</p><div className="footer__social-grid">{socialLinks.map(renderSocialLink)}</div><div className="footer__whatsapp-card"><div className="footer__whatsapp-copy"><div className="footer__whatsapp-title"><span className="footer__whatsapp-icon">◔</span><span>{language === "es" ? "Chat en" : "Chat on"} <strong>WhatsApp</strong></span></div><p>{language === "es" ? "¡Contáctanos directamente!" : "Get in touch with us directly!"}</p><a href={whatsapp.path} className="footer__whatsapp-button" target="_blank" rel="noopener noreferrer">{language === "es" ? "Abrir WhatsApp" : "Open WhatsApp"}<span>→</span></a></div><div className="footer__qr-wrap"><img src={qrUrl} alt="WhatsApp QR code"/><span>{language === "es" ? "Escanéame" : "Scan Me!"}</span></div><a href={`tel:${phone.replace(/\D/g, "")}`} className="footer__whatsapp-phone">{phone}</a></div></div>

                <div className="footer__desktop-bottom"><div>{t.footer.copyright}</div><nav><a href="/privacy">{t.footer.privacyPolicy}</a><span>|</span><a href="/terms-of-service">{t.footer.termsOfService}</a><span>|</span><a href="/shipping-returns">{t.footer.shippingReturns}</a></nav><div className="footer__secure">♙ {language === "es" ? "Pagos seguros" : "Secure Payments"} <span>VISA</span><span>AMEX</span><span>PayPal</span><span> Pay</span></div></div>
                <div className="footer__bottom"><p className="footer__copyright">{t.footer.copyright}</p><p className="footer__designer">{t.footer.designer}</p></div>
            </div>
        </footer>
    );
}

export default Footer;
