import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import Header from "../layout/Header";
import Footer from "../home/Footer";
import { useLanguage } from "../../contexts/LanguageContext";
import { addToCart } from "../../utils/cart";
import { apiRequest } from "../../services/api";
import "./UnifiedCollectionPage.css";

type ProductFeatureOption = { id?: string; label?: string };
type ProductFeature = { id?: string; name?: string; options?: ProductFeatureOption[] };
type CollectionProduct = {
    product_id: string;
    name: string;
    slug: string;
    description?: string | null;
    price: number | string;
    image_url?: string | null;
    is_active: boolean;
    features?: unknown[] | Record<string, unknown>;
    created_at?: string;
    collection_sort_order?: number;
};

type CollectionConfig = {
    name: { en: string; es: string };
    eyebrow: { en: string; es: string };
    hero: string;
    description: { en: string; es: string };
};

const COLLECTIONS: Record<string, CollectionConfig> = {
    "love-romance": {
        name: { en: "Love & Romance", es: "Amor y Romance" },
        eyebrow: { en: "LOVE & ROMANCE", es: "AMOR Y ROMANCE" },
        hero: "/images/collections/love-romance.jpg",
        description: { en: "Designs made for love, meaningful moments and unforgettable gifts.", es: "Diseños creados para el amor, momentos especiales y regalos inolvidables." },
    },
    "family-memories": {
        name: { en: "Family & Memories", es: "Familia y Recuerdos" },
        eyebrow: { en: "FAMILY & MEMORIES", es: "FAMILIA Y RECUERDOS" },
        hero: "/images/collections/family-memories.jpg",
        description: { en: "Personalized designs for the people and memories that matter most.", es: "Diseños personalizados para las personas y recuerdos que más importan." },
    },
    "business-branding": {
        name: { en: "Business & Branding", es: "Negocios y Marca" },
        eyebrow: { en: "BUSINESS & BRANDING", es: "NEGOCIOS Y MARCA" },
        hero: "/images/collections/business-branding.jpg",
        description: { en: "Professional products created to showcase your brand with style.", es: "Productos profesionales creados para mostrar tu marca con estilo." },
    },
    "special-occasions": {
        name: { en: "Special Occasions", es: "Ocasiones Especiales" },
        eyebrow: { en: "SPECIAL OCCASIONS", es: "OCASIONES ESPECIALES" },
        hero: "/images/collections/special-occasions.jpg",
        description: { en: "Unique designs for birthdays, celebrations and every special occasion.", es: "Diseños únicos para cumpleaños, celebraciones y cada ocasión especial." },
    },
};

const DEFAULT_COLORS = ["White", "Black", "Red"];
const DEFAULT_SIZES = ["11 oz", "15 oz"];
const COLOR_HEX: Record<string, string> = {
    white: "#ffffff", black: "#080808", red: "#d71920", green: "#168a45", blue: "#1f5fbf",
    purple: "#7b3fb5", yellow: "#f0c419", pink: "#e98ca8", orange: "#ef7d24", gray: "#777777",
    grey: "#777777", brown: "#7a4b2a", navy: "#162b55", teal: "#159b9b", gold: "#d8a82d",
    silver: "#bfc3c7", beige: "#d8c5a2", maroon: "#6f1d2b", turquoise: "#20b8b8",
};

function normalizeFeatures(value: CollectionProduct["features"]): ProductFeature[] {
    if (Array.isArray(value)) {
        return value.flatMap((item) => {
            if (!item || typeof item !== "object") return [];
            const raw = item as { name?: unknown; options?: unknown };
            if (!raw.name) return [];
            const options = Array.isArray(raw.options)
                ? raw.options.map((option) => typeof option === "object" && option !== null
                    ? String((option as ProductFeatureOption).label ?? "")
                    : String(option ?? ""))
                : [];
            return [{ name: String(raw.name), options: options.filter(Boolean).map((label) => ({ label })) }];
        });
    }
    if (value && typeof value === "object") {
        return Object.entries(value).map(([name, raw]) => ({
            name,
            options: (Array.isArray(raw) ? raw : [raw]).map((option) => ({ label: String(option ?? "") })),
        }));
    }
    return [];
}

function featureByName(features: ProductFeature[], names: string[]) {
    const normalized = names.map((name) => name.toLowerCase());
    return features.find((feature) => normalized.includes(String(feature.name || "").trim().toLowerCase()));
}

function swatchColor(label: string) {
    const key = label.trim().toLowerCase();
    return COLOR_HEX[key] || label;
}

function UnifiedCollectionPage({ slug }: { slug: string }) {
    const { language } = useLanguage();
    const config = COLLECTIONS[slug] || COLLECTIONS["love-romance"];
    const [products, setProducts] = useState<CollectionProduct[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<CollectionProduct | null>(null);
    const [selectedOptions, setSelectedOptions] = useState<Record<string, Record<string, string>>>({});
    const [quantities, setQuantities] = useState<Record<string, number>>({});
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setLoading(true);
            setError(false);
            try {
                const data = await apiRequest<{ products?: CollectionProduct[] }>(`/api/collections/${slug}/products`, { cache: "no-store" });
                if (!cancelled) {
                    setProducts((data.products || []).filter((product: CollectionProduct) => product.is_active));
                    setCurrentPage(1);
                }
            } catch (err) {
                console.error(err);
                if (!cancelled) setError(true);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        void load();
        return () => { cancelled = true; };
    }, [slug]);

    const orderedProducts = useMemo(() => [...products].sort((a, b) => {
        const aOrder = Number(a.collection_sort_order ?? 999999);
        const bOrder = Number(b.collection_sort_order ?? 999999);
        return aOrder - bOrder;
    }), [products]);

    const PRODUCTS_PER_PAGE = 8;
    const totalPages = Math.max(1, Math.ceil(orderedProducts.length / PRODUCTS_PER_PAGE));
    const pageProducts = useMemo(() => {
        const start = (currentPage - 1) * PRODUCTS_PER_PAGE;
        return orderedProducts.slice(start, start + PRODUCTS_PER_PAGE);
    }, [orderedProducts, currentPage]);

    useEffect(() => {
        if (currentPage > totalPages) setCurrentPage(totalPages);
    }, [currentPage, totalPages]);

    const getProductState = (product: CollectionProduct) => {
        const features = normalizeFeatures(product.features);
        const colorFeature = featureByName(features, ["color", "colour"]);
        const sizeFeature = featureByName(features, ["size", "tamaño", "tamaño"]);
        const colorOptions = (colorFeature?.options || []).map((option) => String(option.label || "")).filter(Boolean);
        const sizeOptions = (sizeFeature?.options || []).map((option) => String(option.label || "")).filter(Boolean);
        return {
            features,
            colorOptions: colorOptions.length ? colorOptions : DEFAULT_COLORS,
            sizeOptions: sizeOptions.length ? sizeOptions : DEFAULT_SIZES,
        };
    };

    const getSelection = (product: CollectionProduct) => {
        const state = getProductState(product);
        const current = selectedOptions[product.product_id] || {};
        const selection: Record<string, string> = { ...current };
        if (state.colorOptions.length && !selection.Color) selection.Color = state.colorOptions[0];
        if (state.sizeOptions.length && !selection.Size) selection.Size = state.sizeOptions[0];
        return selection;
    };

    const setOption = (product: CollectionProduct, name: string, value: string) => {
        setSelectedOptions((current) => ({
            ...current,
            [product.product_id]: { ...getSelection(product), [name]: value },
        }));
    };

    const addProductToCart = (product: CollectionProduct, quantity: number) => {
        const selection = getSelection(product);
        addToCart({
            id: product.product_id,
            name: product.name,
            model: config.name.en,
            size: selection.Size || "",
            color: selection.Color || "",
            options: selection,
            price: Number(product.price),
            image: product.image_url || "/images/products/placeholder.jpg",
        }, quantity);
    };

    const quantityFor = (product: CollectionProduct) => quantities[product.product_id] || 1;
    const changeQuantity = (product: CollectionProduct, delta: number) => {
        setQuantities((current) => ({ ...current, [product.product_id]: Math.max(1, quantityFor(product) + delta) }));
    };

    const renderOptions = (product: CollectionProduct, lightbox = false) => {
        const state = getProductState(product);
        const selection = getSelection(product);
        const otherFeatures = state.features.filter((feature) => {
            const name = String(feature.name || "").toLowerCase();
            return name !== "color" && name !== "colour" && name !== "size" && name !== "tamaño" && name !== "tamaño";
        });
        return <div className={`unified-options${lightbox ? " unified-options--lightbox" : ""}`}>
            <div className="unified-option-group">
                <span className="unified-option-label">COLOR</span>
                <div className="unified-color-list">
                    {state.colorOptions.map((color) => (
                        <button key={color} type="button" className={`unified-color${selection.Color === color ? " is-selected" : ""}`} onClick={() => setOption(product, "Color", color)} aria-label={color} aria-pressed={selection.Color === color}>
                            <span style={{ backgroundColor: swatchColor(color) }} />
                        </button>
                    ))}
                </div>
            </div>
            <div className="unified-option-group">
                <span className="unified-option-label">{language === "es" ? "TAMAÑO" : "SIZE"}</span>
                <div className="unified-size-list">
                    {state.sizeOptions.map((size) => (
                        <button key={size} type="button" className={`unified-size${selection.Size === size ? " is-selected" : ""}`} onClick={() => setOption(product, "Size", size)} aria-pressed={selection.Size === size}>{size}</button>
                    ))}
                </div>
            </div>
            {otherFeatures.map((feature) => {
                const name = String(feature.name || "Option");
                const options = (feature.options || []).map((option) => String(option.label || "")).filter(Boolean);
                if (!options.length) return null;
                return <div className="unified-option-group" key={name}>
                    <span className="unified-option-label">{name.toUpperCase()}</span>
                    <div className="unified-size-list">
                        {options.map((option) => <button key={option} type="button" className={`unified-size${selection[name] === option ? " is-selected" : ""}`} onClick={() => setOption(product, name, option)} aria-pressed={selection[name] === option}>{option}</button>)}
                    </div>
                </div>;
            })}
        </div>;
    };

    return <>
        <Header />
        <main className="unified-collection-page">
            <section className="unified-collection-hero">
                <img src={config.hero} alt={config.name[language]} />
                <div className="unified-collection-hero__overlay" />
                <div className="unified-collection-hero__content">
                    <Link to="/collections">← {language === "es" ? "VOLVER A COLECCIONES" : "BACK TO COLLECTIONS"}</Link>
                    <span>{config.eyebrow[language]}</span>
                    <h1>{config.name[language]}</h1>
                    <div className="unified-ornament"><i /><b>♥</b><i /></div>
                    <p>{config.description[language]}</p>
                </div>
            </section>

            <section className="unified-products-section">
                <div className="unified-section-heading">
                    <span>{config.eyebrow[language]}</span>
                    <h2>{language === "es" ? "DISEÑOS PARA" : "DESIGNS FOR"} <strong>{language === "es" ? "TI" : "YOU"}</strong></h2>
                </div>

                {loading && <div className="unified-state">{language === "es" ? "Cargando productos..." : "Loading products..."}</div>}
                {!loading && error && <div className="unified-state unified-state--error">{language === "es" ? "No se pudieron cargar los productos." : "Unable to load products."}</div>}

                {!loading && !error && <>
                    <div className="unified-products-grid">
                        {pageProducts.map((product, index) => {
                            const quantity = quantityFor(product);
                            const productNumber = (currentPage - 1) * PRODUCTS_PER_PAGE + index + 1;
                            return <article className="unified-product" key={product.product_id}>
                                <div className="unified-product__image" aria-label={language === "es" ? `Imagen de ${product.name}` : `Image of ${product.name}`}>
                                    <img src={product.image_url || "/images/products/placeholder.jpg"} alt={product.name} />
                                    <span className="unified-product__number">{String(productNumber).padStart(2, "0")}</span>
                                    <button type="button" className="unified-product__zoom" onClick={() => setSelectedProduct(product)} aria-label={language === "es" ? `Ver ${product.name} en grande` : `View ${product.name} enlarged`}>⌕</button>
                                    <div className="unified-product__gradient" />
                                </div>
                                <div className="unified-product__body">
                                    <div className="unified-product__title-row">
                                        <h3>{product.name}</h3>
                                        <strong>${Number(product.price).toFixed(2)}</strong>
                                    </div>
                                    <div className="unified-rating" aria-label="5 out of 5 stars">★★★★★</div>
                                    <div className="unified-divider"><span>♥</span></div>
                                    {product.description && <p className="unified-product__description">{product.description}</p>}
                                    {renderOptions(product)}
                                    <div className="unified-product__quantity"><button type="button" onClick={() => changeQuantity(product, -1)}>−</button><span>{quantity}</span><button type="button" onClick={() => changeQuantity(product, 1)}>+</button></div>
                                    <button type="button" className="unified-add-cart" onClick={() => addProductToCart(product, quantity)}>{language === "es" ? "AGREGAR AL CARRITO" : "ADD TO CART"}</button>
                                </div>
                            </article>;
                        })}
                        {!orderedProducts.length && <div className="unified-state">{language === "es" ? "No hay productos disponibles." : "No products available."}</div>}
                    </div>

                    {totalPages > 1 && <nav className="unified-pagination" aria-label={language === "es" ? "Paginación de productos" : "Product pagination"}>
                        <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1}>←</button>
                        {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                            <button key={page} type="button" className={currentPage === page ? "is-current" : ""} onClick={() => setCurrentPage(page)} aria-current={currentPage === page ? "page" : undefined}>{page}</button>
                        ))}
                        <button type="button" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages}>→</button>
                    </nav>}
                </>}
            </section>

            {selectedProduct && <div className="unified-lightbox" role="dialog" aria-modal="true" aria-label={selectedProduct.name} onClick={() => setSelectedProduct(null)}>
                <div className="unified-lightbox__panel" onClick={(event) => event.stopPropagation()}>
                    <button type="button" className="unified-lightbox__close" onClick={() => setSelectedProduct(null)} aria-label={language === "es" ? "Cerrar" : "Close"}><X size={24} /></button>
                    <div className="unified-lightbox__image-wrap">
                        <img src={selectedProduct.image_url || "/images/products/placeholder.jpg"} alt={selectedProduct.name} />
                        <div className="unified-lightbox__gradient" />
                    </div>
                    <div className="unified-lightbox__details">
                        <span className="unified-lightbox__eyebrow">{config.eyebrow[language]}</span>
                        <h2>{selectedProduct.name}</h2>
                        <div className="unified-rating">★★★★★</div>
                        <div className="unified-divider"><span>♥</span></div>
                        <p className="unified-lightbox__description">{selectedProduct.description || (language === "es" ? "Producto de muestra" : "Sample product")}</p>
                        {renderOptions(selectedProduct, true)}
                        <div className="unified-lightbox__price"><span>{language === "es" ? "PRECIO" : "PRICE"}</span><strong>${Number(selectedProduct.price).toFixed(2)}</strong></div>
                        <button type="button" className="unified-add-cart unified-add-cart--large" onClick={() => addProductToCart(selectedProduct, 1)}>{language === "es" ? "AGREGAR AL CARRITO" : "ADD TO CART"}</button>
                    </div>
                </div>
            </div>}
        </main>
        <Footer />
    </>;
}

export default UnifiedCollectionPage;
