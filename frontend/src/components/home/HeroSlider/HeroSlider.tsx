import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { apiRequest } from "../../../services/api";
import { useLanguage } from "../../../contexts/LanguageContext";
import { translations } from "../../../translations";
import "./HeroSlider.css";

type Text = { en: string; es: string };
type Slide = {
    id: string;
    image: string;
    background?: string;
    order: number;
    active: boolean;
    title: Text;
    subtitle: Text;
    primaryButton: Text;
    primaryLink: string;
    secondaryButton: Text;
    secondaryLink: string;
};

const fallback: Slide[] = [
    {
        id: "hero-1", image: "/images/hero/hero-mug.png", order: 1, active: true,
        title: { en: "YOUR STORY.\nYOUR MUG.", es: "TU HISTORIA.\nTU TAZA." },
        subtitle: { en: "Design a premium personalized mug with your name, logo or favorite photo. Crafted to create unforgettable gifts and lasting memories.", es: "Diseña una taza personalizada premium con tu nombre, logo o foto favorita. Creada para convertir momentos en regalos inolvidables y recuerdos duraderos." },
        primaryButton: { en: "CREATE YOUR MUG", es: "CREA TU TAZA" }, primaryLink: "/customize",
        secondaryButton: { en: "EXPLORE COLLECTIONS", es: "EXPLORAR COLECCIONES" }, secondaryLink: "/collections"
    },
    {
        id: "hero-2", image: "/images/hero/hero-cap.png", order: 2, active: true,
        title: { en: "WEAR\nYOUR BRAND.", es: "LLEVA\nTU MARCA." },
        subtitle: { en: "Create premium custom caps with your logo, business name or team design.", es: "Crea gorras personalizadas premium con tu logo, nombre de negocio o diseño de tu equipo." },
        primaryButton: { en: "CREATE YOUR CAP", es: "CREA TU GORRA" }, primaryLink: "/customize",
        secondaryButton: { en: "EXPLORE COLLECTIONS", es: "EXPLORAR COLECCIONES" }, secondaryLink: "/collections"
    },
    {
        id: "hero-3", image: "/images/hero/hero-shirt.png", order: 3, active: true,
        title: { en: "YOUR STYLE.\nYOUR SHIRT.", es: "TU ESTILO.\nTU CAMISETA." },
        subtitle: { en: "Design premium custom t-shirts with your logo, artwork or business branding.", es: "Diseña camisetas personalizadas premium con tu logo, arte o identidad de marca." },
        primaryButton: { en: "CREATE YOUR SHIRT", es: "CREA TU CAMISETA" }, primaryLink: "/customize",
        secondaryButton: { en: "EXPLORE COLLECTIONS", es: "EXPLORAR COLECCIONES" }, secondaryLink: "/collections"
    }
];

const safeLink = (link: string, fallbackLink: string) => {
    const value = String(link || "").trim();
    return value.toLowerCase() === "/products" || value.toLowerCase().startsWith("/products/") ? fallbackLink : value || fallbackLink;
};

function HeroSlider() {
    const { language } = useLanguage();
    const t = translations[language].home.hero;
    const [slides, setSlides] = useState<Slide[]>(fallback);
    const [current, setCurrent] = useState(0);
    const [paused, setPaused] = useState(false);

    useEffect(() => {
        apiRequest<{ status: string; settings: { config: { heroSlides: Slide[] } } }>("/api/settings")
            .then((r) => {
                const active = (r.settings.config.heroSlides || [])
                    .filter((x) => x.active && String(x.image || "").trim())
                    .sort((a, b) => a.order - b.order)
                    .map((x) => ({
                        ...x,
                        primaryLink: safeLink(x.primaryLink, "/customize"),
                        secondaryLink: safeLink(x.secondaryLink, "/collections"),
                        secondaryButton: x.secondaryLink?.toLowerCase().startsWith("/products")
                            ? { en: "EXPLORE COLLECTIONS", es: "EXPLORAR COLECCIONES" }
                            : x.secondaryButton
                    }));
                if (active.length) setSlides(active);
            })
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (paused || slides.length < 2) return;
        const timer = window.setInterval(() => setCurrent((v) => (v + 1) % slides.length), 8000);
        return () => window.clearInterval(timer);
    }, [paused, slides.length]);

    useEffect(() => { if (current >= slides.length) setCurrent(0); }, [current, slides.length]);

    const slide = slides[current] || slides[0];
    const text = language === "es" ? slide.title.es || slide.title.en : slide.title.en;
    const subtitle = language === "es" ? slide.subtitle.es || slide.subtitle.en : slide.subtitle.en;
    const primary = language === "es" ? slide.primaryButton.es || slide.primaryButton.en : slide.primaryButton.en;
    const secondary = language === "es" ? slide.secondaryButton.es || slide.secondaryButton.en : slide.secondaryButton.en;

    return (
        <section className="hero-slider" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
            <div key={slide.id} className="hero-slider__scene" aria-live="polite">
                <div className="hero-slider__content">
                    <div className="hero-slider__text">
                        <span className="hero-slider__eyebrow" aria-hidden="true" />
                        <h1>{text}</h1>
                        <p>{subtitle}</p>
                    </div>
                    <div className="hero-slider__visual" aria-hidden="true">
                        <img className="hero-slider__background-image" src={slide.image} alt="" />
                    </div>
                    <div className="hero-slider__buttons">
                        <button type="button" className="hero-slider__primary" onClick={() => { window.location.href = safeLink(slide.primaryLink, "/customize"); }}>{primary}</button>
                        <button type="button" className="hero-slider__secondary" onClick={() => { window.location.href = safeLink(slide.secondaryLink, "/collections"); }}>{secondary}</button>
                    </div>
                </div>
                <div className="hero-slider__overlay" />
                <div className="hero-slider__glow" />
            </div>

            {slides.length > 1 && <>
                <button type="button" className="hero-slider__arrow hero-slider__arrow--left" onClick={() => setCurrent((v) => v === 0 ? slides.length - 1 : v - 1)} aria-label={t.previousSlide}><ChevronLeft size={26} /></button>
                <button type="button" className="hero-slider__arrow hero-slider__arrow--right" onClick={() => setCurrent((v) => (v + 1) % slides.length)} aria-label={t.nextSlide}><ChevronRight size={26} /></button>
                <div className="hero-slider__dots">
                    {slides.map((x, i) => <button type="button" key={x.id} className={i === current ? "hero-slider__dot hero-slider__dot--active" : "hero-slider__dot"} onClick={() => setCurrent(i)} aria-label={`${t.goToSlide} ${i + 1}`} aria-current={i === current ? "true" : undefined} />)}
                </div>
            </>}
        </section>
    );
}

export default HeroSlider;
