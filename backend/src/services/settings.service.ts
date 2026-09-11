import { pool } from "../config/database";
import { translateEnglishToSpanish } from "./translation.service";

export interface LocalizedText { en: string; es: string; }
export interface HeroSlideConfig { id: string; image: string; background: string; order: number; active: boolean; title: LocalizedText; subtitle: LocalizedText; primaryButton: LocalizedText; primaryLink: string; secondaryButton: LocalizedText; secondaryLink: string; }
export interface NavLinkConfig { id: string; label: LocalizedText; path: string; active: boolean; order: number; }
export interface FooterSectionConfig { id: string; title: LocalizedText; links: NavLinkConfig[]; active: boolean; order: number; }
export interface SocialLinkConfig { id: string; name: string; url: string; active: boolean; order: number; }
export interface SitePageConfig { id: string; title: LocalizedText; slug: string; body: LocalizedText; active: boolean; }
export interface SiteConfig {
    websiteName: LocalizedText;
    browserTitle: LocalizedText;
    slogan: LocalizedText;
    designerName: LocalizedText;
    designerTitle: LocalizedText;
    designerBio: LocalizedText;
    businessPhone: string;
    businessAddress: string;
    heroSlides: HeroSlideConfig[];
    headerLinks: NavLinkConfig[];
    footerSections: FooterSectionConfig[];
    socialLinks: SocialLinkConfig[];
    pages: SitePageConfig[];
}

const localized = (en: string, es = ""): LocalizedText => ({ en, es });
const id = (prefix: string, n: number) => `${prefix}-${n}`;

const DEFAULT_CONFIG: SiteConfig = {
    websiteName: localized("Magic Touch Designs", "Magic Touch Designs"),
    browserTitle: localized("Magic Touch Designs | Personalized Gifts & Designs", "Magic Touch Designs | Regalos y diseños personalizados"),
    slogan: localized("Personalized Gifts & Designs", "Regalos y diseños personalizados"),
    designerName: localized("J.Q", "J.Q"),
    designerTitle: localized("Webmaster & Designer", "Webmaster y diseñador"),
    designerBio: localized("Magic Touch Designs creator and webmaster.", "Creador y webmaster de Magic Touch Designs."),
    businessPhone: "+1 (346) 760-3007",
    businessAddress: "",
    heroSlides: [
        { id: "hero-1", image: "/images/hero/hero-mug.png", background: "/images/hero/hero-background.jpg", order: 1, active: true, title: localized("YOUR STORY.\nYOUR MUG.", "TU HISTORIA.\nTU TAZA."), subtitle: localized("Design a premium personalized mug with your name, logo or favorite photo. Crafted to create unforgettable gifts and lasting memories.", "Diseña una taza personalizada premium con tu nombre, logo o foto favorita. Creada para regalos inolvidables y recuerdos que duran."), primaryButton: localized("CREATE YOUR MUG", "CREA TU TAZA"), primaryLink: "/customize", secondaryButton: localized("SHOP MUGS", "COMPRAR TAZAS"), secondaryLink: "/products" },
        { id: "hero-2", image: "/images/hero/hero-cap.png", background: "/images/hero/hero-background.jpg", order: 2, active: true, title: localized("WEAR\nYOUR BRAND.", "LLEVA\nTU MARCA."), subtitle: localized("Create premium custom caps with your logo, business name or team design. Perfect for businesses, events and everyday wear.", "Crea gorras personalizadas premium con tu logo, nombre de negocio o diseño de equipo. Perfectas para negocios, eventos y uso diario."), primaryButton: localized("CREATE YOUR CAP", "CREA TU GORRA"), primaryLink: "/customize", secondaryButton: localized("SHOP CAPS", "COMPRAR GORRAS"), secondaryLink: "/products" },
        { id: "hero-3", image: "/images/hero/hero-shirt.png", background: "/images/hero/hero-background.jpg", order: 3, active: true, title: localized("YOUR STYLE.\nYOUR SHIRT.", "TU ESTILO.\nTU CAMISETA."), subtitle: localized("Design premium custom t-shirts with your logo, artwork or business branding. Perfect for teams, businesses and special events.", "Diseña camisetas personalizadas premium con tu logo, arte o marca empresarial. Perfectas para equipos, negocios y eventos especiales."), primaryButton: localized("CREATE YOUR SHIRT", "CREA TU CAMISETA"), primaryLink: "/customize", secondaryButton: localized("SHOP T-SHIRTS", "COMPRAR CAMISETAS"), secondaryLink: "/products" },
    ],
    headerLinks: [
        { id: id("nav",1), label: localized("Home","Inicio"), path: "/", active: true, order: 1 },
        { id: id("nav",2), label: localized("Products","Productos"), path: "/products", active: true, order: 2 },
        { id: id("nav",3), label: localized("Collections","Colecciones"), path: "/collections", active: true, order: 3 },
        { id: id("nav",4), label: localized("Customize","Personalizar"), path: "/customize", active: true, order: 4 },
        { id: id("nav",5), label: localized("Contact","Contacto"), path: "/contact", active: true, order: 5 },
    ],
    footerSections: [
        { id: "footer-shop", title: localized("SHOP","TIENDA"), active: true, order: 1, links: [
            { id:"f-products", label:localized("All Models","Todos los modelos"), path:"/products", active:true, order:1 },
            { id:"f-collections", label:localized("Collections","Colecciones"), path:"/collections", active:true, order:2 },
            { id:"f-customize", label:localized("Customize","Personalizar"), path:"/customize", active:true, order:3 },
        ]},
        { id: "footer-company", title: localized("COMPANY","EMPRESA"), active: true, order: 2, links: [
            { id:"f-about", label:localized("About Us","Nosotros"), path:"/about", active:true, order:1 },
            { id:"f-how", label:localized("How It Works","Cómo funciona"), path:"/how-it-works", active:true, order:2 },
            { id:"f-shipping", label:localized("Shipping & Returns","Envíos y devoluciones"), path:"/shipping-returns", active:true, order:3 },
            { id:"f-faq", label:localized("FAQs","Preguntas frecuentes"), path:"/faqs", active:true, order:4 },
        ]},
        { id: "footer-support", title: localized("SUPPORT","SOPORTE"), active: true, order: 3, links: [
            { id:"f-contact", label:localized("Contact Us","Contáctanos"), path:"/contact", active:true, order:1 },
            { id:"f-track", label:localized("Track My Order","Rastrear mi pedido"), path:"/track-order", active:true, order:2 },
            { id:"f-privacy", label:localized("Privacy Policy","Política de privacidad"), path:"/privacy", active:true, order:3 },
            { id:"f-terms", label:localized("Terms of Service","Términos del servicio"), path:"/terms-of-service", active:true, order:4 },
        ]},
    ],
    socialLinks: [
        {id:"social-instagram",name:"Instagram",url:"https://www.instagram.com/magic.touch_designs",active:true,order:1},
        {id:"social-facebook",name:"Facebook",url:"https://www.facebook.com/share/1ciBB3BuE3/?mibextid=wwXIfr",active:true,order:2},
        {id:"social-tiktok",name:"TikTok",url:"#",active:true,order:3},
        {id:"social-youtube",name:"YouTube",url:"https://youtube.com/@magictouchdesigns-u7t",active:true,order:4},
    ],
    pages: [],
};

let initialized = false;
export const ensureSettingsTables = async (): Promise<void> => {
    if (initialized) return;
    await pool.query(`ALTER TABLE settings ADD COLUMN IF NOT EXISTS site_config JSONB NOT NULL DEFAULT '{}'::jsonb;`);
    initialized = true;
};

const mergeConfig = (raw: unknown): SiteConfig => {
    if (!raw || typeof raw !== "object") return DEFAULT_CONFIG;
    const value = raw as Partial<SiteConfig>;
    const configuredSocials = Array.isArray(value.socialLinks) ? value.socialLinks : [];
    const socialLinks = configuredSocials.length
        ? [...configuredSocials, ...DEFAULT_CONFIG.socialLinks.filter(defaultSocial => !configuredSocials.some(currentSocial => String(currentSocial.name).trim().toLowerCase() === String(defaultSocial.name).trim().toLowerCase()))]
        : DEFAULT_CONFIG.socialLinks;
    return {
        ...DEFAULT_CONFIG,
        ...value,
        websiteName: value.websiteName && typeof value.websiteName === "object" ? value.websiteName : DEFAULT_CONFIG.websiteName,
        browserTitle: value.browserTitle && typeof value.browserTitle === "object" ? value.browserTitle : DEFAULT_CONFIG.browserTitle,
        heroSlides: Array.isArray(value.heroSlides) && value.heroSlides.length ? value.heroSlides : DEFAULT_CONFIG.heroSlides,
        headerLinks: Array.isArray(value.headerLinks) && value.headerLinks.length ? value.headerLinks : DEFAULT_CONFIG.headerLinks,
        footerSections: Array.isArray(value.footerSections) && value.footerSections.length ? value.footerSections : DEFAULT_CONFIG.footerSections,
        socialLinks,
        pages: Array.isArray(value.pages) ? value.pages : DEFAULT_CONFIG.pages,
    } as SiteConfig;
};

export const getSettings = async () => {
    await ensureSettingsTables();
    const result = await pool.query(`SELECT id, website_name, browser_title, slogan, logo_url, support_email, notifications_enabled, site_config FROM settings ORDER BY created_at DESC LIMIT 1`);
    if (!result.rows[0]) return { websiteName:"Magic Touch Designs", browserTitle:"Magic Touch Designs | Personalized Gifts & Designs", slogan:DEFAULT_CONFIG.slogan.en, logoUrl:null, supportEmail:"", notificationsEnabled:true, config:DEFAULT_CONFIG };
    const row = result.rows[0];
    return { websiteName:row.website_name, browserTitle:row.browser_title, slogan:row.slogan ?? "", logoUrl:row.logo_url, supportEmail:row.support_email ?? "", notificationsEnabled:row.notifications_enabled, config:mergeConfig(row.site_config) };
};

const translateIfChanged = async (text: LocalizedText, previous?: LocalizedText): Promise<LocalizedText> => {
    const en = String(text?.en ?? "").trim();
    const es = String(text?.es ?? "").trim();
    const previousEn = String(previous?.en ?? "").trim();
    const englishChanged = previous !== undefined && en !== previousEn;
    if (!en) return { en: "", es: "" };
    if (englishChanged || !es) {
        try {
            const result = await translateEnglishToSpanish(en);
            return { en, es: result.translation };
        } catch (error) {
            console.error("Automatic English-to-Spanish translation failed.", error);
            throw new Error("Unable to translate English content to Spanish. Changes were not saved.");
        }
    }
    return { en, es };
};

const translateConfig = async (config: SiteConfig, previous: SiteConfig): Promise<SiteConfig> => {
    const previousHero = new Map(previous.heroSlides.map(item => [item.id, item]));
    const heroSlides = await Promise.all(config.heroSlides.map(async slide => {
        const old = previousHero.get(slide.id);
        return { ...slide, title: await translateIfChanged(slide.title, old?.title), subtitle: await translateIfChanged(slide.subtitle, old?.subtitle), primaryButton: await translateIfChanged(slide.primaryButton, old?.primaryButton), secondaryButton: await translateIfChanged(slide.secondaryButton, old?.secondaryButton) };
    }));
    const previousHeader = new Map(previous.headerLinks.map(item => [item.id, item]));
    const headerLinks = await Promise.all(config.headerLinks.map(async item => ({ ...item, label: await translateIfChanged(item.label, previousHeader.get(item.id)?.label) })));
    const previousFooter = new Map(previous.footerSections.map(section => [section.id, section]));
    const footerSections = await Promise.all(config.footerSections.map(async section => {
        const oldSection = previousFooter.get(section.id);
        const previousLinks = new Map((oldSection?.links ?? []).map(item => [item.id, item]));
        return { ...section, title: await translateIfChanged(section.title, oldSection?.title), links: await Promise.all(section.links.map(async item => ({ ...item, label: await translateIfChanged(item.label, previousLinks.get(item.id)?.label) }))) };
    }));
    const previousPages = new Map(previous.pages.map(item => [item.id, item]));
    const pages = await Promise.all(config.pages.map(async page => {
        const old = previousPages.get(page.id);
        return { ...page, title: await translateIfChanged(page.title, old?.title), body: await translateIfChanged(page.body, old?.body) };
    }));
    return {
        ...config,
        websiteName: await translateIfChanged(config.websiteName, previous.websiteName),
        browserTitle: await translateIfChanged(config.browserTitle, previous.browserTitle),
        slogan: await translateIfChanged(config.slogan, previous.slogan),
        designerName: await translateIfChanged(config.designerName, previous.designerName),
        designerTitle: await translateIfChanged(config.designerTitle, previous.designerTitle),
        designerBio: await translateIfChanged(config.designerBio, previous.designerBio),
        heroSlides,
        headerLinks,
        footerSections,
        pages,
    };
};

export const updateSettings = async (data: any) => {
    await ensureSettingsTables();
    const current = await getSettings();
    const incomingConfig = { ...current.config, ...(data.config || {}) } as SiteConfig;
    incomingConfig.websiteName = { en: String(data.websiteName ?? current.websiteName).trim(), es: current.config.websiteName?.es || "" };
    incomingConfig.browserTitle = { en: String(data.browserTitle ?? current.browserTitle).trim(), es: current.config.browserTitle?.es || "" };

    const requestedLogo = data.logoUrl !== undefined ? data.logoUrl : current.logoUrl;
    const logoChanged = requestedLogo !== current.logoUrl;
    const requestedSupportEmail = String(data.supportEmail ?? current.supportEmail).trim();
    const notificationsChanged = data.notificationsEnabled !== undefined && data.notificationsEnabled !== current.notificationsEnabled;
    const textConfigChanged =
        incomingConfig.websiteName.en !== current.config.websiteName.en ||
        incomingConfig.browserTitle.en !== current.config.browserTitle.en ||
        incomingConfig.slogan.en !== current.config.slogan.en ||
        incomingConfig.designerName.en !== current.config.designerName.en ||
        incomingConfig.designerTitle.en !== current.config.designerTitle.en ||
        incomingConfig.designerBio.en !== current.config.designerBio.en ||
        JSON.stringify(incomingConfig.heroSlides) !== JSON.stringify(current.config.heroSlides) ||
        JSON.stringify(incomingConfig.headerLinks) !== JSON.stringify(current.config.headerLinks) ||
        JSON.stringify(incomingConfig.footerSections) !== JSON.stringify(current.config.footerSections) ||
        JSON.stringify(incomingConfig.pages) !== JSON.stringify(current.config.pages);

    // Images/logos are not translatable. A logo-only/settings-only save must never depend on the translator.
    const config = textConfigChanged
        ? await translateConfig(incomingConfig, current.config)
        : current.config;

    const websiteName = config.websiteName.en;
    const browserTitle = config.browserTitle.en;
    if (!websiteName) throw new Error("Website name is required.");
    if (!browserTitle) throw new Error("Browser title is required.");

    const values = [websiteName, browserTitle, config.slogan.en, logoChanged ? requestedLogo : current.logoUrl, requestedSupportEmail, data.notificationsEnabled ?? current.notificationsEnabled, JSON.stringify(config)];
    const existing = await pool.query(`SELECT id FROM settings ORDER BY created_at DESC LIMIT 1`);
    if (existing.rows[0]) {
        await pool.query(`UPDATE settings SET website_name=$1, browser_title=$2, slogan=$3, logo_url=$4, support_email=$5, notifications_enabled=$6, site_config=$7, updated_at=CURRENT_TIMESTAMP WHERE id=$8`, [...values, existing.rows[0].id]);
    } else {
        await pool.query(`INSERT INTO settings (website_name,browser_title,slogan,logo_url,support_email,notifications_enabled,site_config) VALUES ($1,$2,$3,$4,$5,$6,$7)`, values);
    }
    return getSettings();
};

export const getPublicSiteConfig = async () => (await getSettings()).config;
