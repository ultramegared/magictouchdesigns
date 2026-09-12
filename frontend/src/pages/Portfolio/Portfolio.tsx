import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { apiRequest } from "../../services/api";
import { useLanguage } from "../../contexts/LanguageContext";
import "./Portfolio.css";

interface PortfolioItem {
    portfolio_id: string;
    image_url: string;
    title_en: string;
    title_es: string | null;
    description_en: string | null;
    description_es: string | null;
    characteristics_en: string | null;
    characteristics_es: string | null;
    sort_order: number;
}

function Portfolio() {
    const { language } = useLanguage();
    const [items, setItems] = useState<PortfolioItem[]>([]);
    const [selected, setSelected] = useState<PortfolioItem | null>(null);
    const [direction, setDirection] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [loading, setLoading] = useState(true);

    const animationFrame = useRef<number | null>(null);
    const lastTime = useRef<number | null>(null);
    const pointerLastX = useRef(0);
    const pointerActive = useRef(false);

    useEffect(() => {
        let mounted = true;
        void apiRequest<{ portfolio: PortfolioItem[] }>("/api/portfolio")
            .then(response => {
                if (mounted) setItems(response.portfolio || []);
            })
            .catch(error => console.error("Portfolio load error:", error))
            .finally(() => {
                if (mounted) setLoading(false);
            });
        return () => { mounted = false; };
    }, []);

    const visibleItems = useMemo(() => {
        const maximum = typeof window !== "undefined" && window.innerWidth <= 700 ? 6 : 8;
        return items.slice(0, maximum);
    }, [items]);

    useEffect(() => {
        if (visibleItems.length < 2 || selected) return;

        const speed = 0.012;
        const animate = (timestamp: number) => {
            if (lastTime.current === null) lastTime.current = timestamp;
            const elapsed = timestamp - lastTime.current;
            lastTime.current = timestamp;
            if (!isDragging) {
                setRotation(previous => previous + direction * speed * elapsed);
            }
            animationFrame.current = requestAnimationFrame(animate);
        };

        animationFrame.current = requestAnimationFrame(animate);
        return () => {
            if (animationFrame.current !== null) cancelAnimationFrame(animationFrame.current);
            lastTime.current = null;
        };
    }, [direction, isDragging, selected, visibleItems.length]);

    const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
        pointerActive.current = true;
        pointerLastX.current = event.clientX;
        setIsDragging(true);
        event.currentTarget.setPointerCapture(event.pointerId);
    };

    const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
        if (!pointerActive.current) return;
        const movement = event.clientX - pointerLastX.current;
        if (Math.abs(movement) < 0.5) return;
        setRotation(previous => previous + movement * 0.45);
        setDirection(movement > 0 ? 1 : -1);
        pointerLastX.current = event.clientX;
    };

    const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
        pointerActive.current = false;
        setIsDragging(false);
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
    };

    const getItemStyle = (index: number): CSSProperties => {
        const total = visibleItems.length;
        const angleStep = 360 / total;
        const angle = rotation + index * angleStep;
        return {
            transform: `rotateY(${angle}deg) translateZ(var(--portfolio-radius)) rotateY(${-angle}deg)`,
        };
    };

    if (loading || visibleItems.length === 0) return null;

    const text = (item: PortfolioItem, field: "title" | "description" | "characteristics"): string => {
        if (language === "es") {
            if (field === "title") return item.title_es || item.title_en;
            if (field === "description") return item.description_es || item.description_en || "";
            return item.characteristics_es || item.characteristics_en || "";
        }
        if (field === "title") return item.title_en;
        if (field === "description") return item.description_en || "";
        return item.characteristics_en || "";
    };

    return (
        <section className="portfolio" aria-labelledby="portfolio-title">
            <div className="portfolio__container">
                <header className="portfolio__header">
                    <span className="portfolio__eyebrow">Our Latest Work</span>
                    <h2 id="portfolio-title">Latest Creations</h2>
                    <div className="portfolio__ornament" aria-hidden="true"><span /><b>◆</b><span /></div>
                </header>

                <div className={`portfolio__stage ${isDragging ? "is-dragging" : ""}`}>
                    <div
                        className="portfolio__scene"
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={() => { pointerActive.current = false; setIsDragging(false); }}
                    >
                        <div className="portfolio__carousel">
                            {visibleItems.map((item, index) => (
                                <article className="portfolio__card" key={item.portfolio_id} style={getItemStyle(index)}>
                                    <button
                                        type="button"
                                        className="portfolio__image-button"
                                        onClick={() => setSelected(item)}
                                        aria-label={`View ${text(item, "title")}`}
                                    >
                                        <span className="portfolio__frame">
                                            <img src={item.image_url} alt={text(item, "title")} loading="lazy" draggable="false" />
                                            <span className="portfolio__shine" aria-hidden="true" />
                                            <span className="portfolio__zoom" aria-hidden="true">
                                                <svg viewBox="0 0 24 24">
                                                    <circle cx="10.5" cy="10.5" r="6.5" />
                                                    <path d="M16 16L21 21" />
                                                    <path d="M10.5 7.5V13.5" />
                                                    <path d="M7.5 10.5H13.5" />
                                                </svg>
                                            </span>
                                        </span>
                                    </button>
                                </article>
                            ))}
                        </div>
                    </div>
                    <div className="portfolio__floor" aria-hidden="true" />
                </div>

                {visibleItems.length > 1 && (
                    <div className="portfolio__hint" aria-hidden="true"><span>←</span><span>Drag to explore</span><span>→</span></div>
                )}

                <div className="portfolio__cta">
                    <p>If you love one of our designs, let us create something uniquely yours.</p>
                    <a href="/contact" className="portfolio__cta-button">Contact Us</a>
                </div>
            </div>

            {selected && (
                <div className="portfolio__lightbox" role="dialog" aria-modal="true" aria-label={text(selected, "title")} onClick={() => setSelected(null)}>
                    <button type="button" className="portfolio__lightbox-close" onClick={() => setSelected(null)} aria-label="Close image">×</button>
                    <div className="portfolio__lightbox-frame" onClick={event => event.stopPropagation()}>
                        <span className="portfolio__lightbox-gold" aria-hidden="true" />
                        <img src={selected.image_url} alt={text(selected, "title")} />
                        <div className="portfolio__lightbox-info" style={{ padding: "24px 30px 28px", textAlign: "center" }}>
                            <h3 style={{ margin: "0 0 12px", color: "#fff", fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "clamp(24px, 3vw, 34px)", fontWeight: 500, letterSpacing: "-0.4px" }}>
                                {text(selected, "title")}
                            </h3>
                            <div aria-hidden="true" style={{ width: "70px", height: "1px", margin: "0 auto 18px", background: "#d8a63c", boxShadow: "0 0 12px rgba(216,166,60,.35)" }} />
                            {text(selected, "description") && (
                                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center", gap: "12px", maxWidth: "820px", margin: "0 auto", color: "rgba(255,255,255,.86)" }}>
                                    <span aria-hidden="true" style={{ flex: "0 0 auto", color: "#f1cc76", fontFamily: "Georgia, serif", fontSize: "48px", lineHeight: ".7", textShadow: "0 0 14px rgba(216,166,60,.35)" }}>“</span>
                                    <p style={{ margin: 0, padding: "0 2px", fontSize: "clamp(14px, 1.8vw, 18px)", lineHeight: 1.7, fontWeight: 400, letterSpacing: ".1px" }}>{text(selected, "description")}</p>
                                    <span aria-hidden="true" style={{ flex: "0 0 auto", alignSelf: "flex-end", color: "#f1cc76", fontFamily: "Georgia, serif", fontSize: "48px", lineHeight: ".7", textShadow: "0 0 14px rgba(216,166,60,.35)" }}>”</span>
                                </div>
                            )}
                            {text(selected, "characteristics") && (
                                <div className="portfolio__lightbox-characteristics" style={{ marginTop: "22px", paddingTop: "18px", borderTop: "1px solid rgba(216,166,60,.18)" }}>
                                    <strong style={{ color: "#f1cc76", fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase" }}>{language === "es" ? "Características" : "Characteristics"}</strong>
                                    <p style={{ margin: "8px 0 0", color: "rgba(255,255,255,.68)", fontSize: "13px", lineHeight: 1.6 }}>{text(selected, "characteristics")}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

export default Portfolio;
