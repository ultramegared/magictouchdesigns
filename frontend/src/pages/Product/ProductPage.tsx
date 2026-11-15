import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Header from "../../components/layout/Header";
import Footer from "../../components/home/Footer";
import { useLanguage } from "../../contexts/LanguageContext";
import { addToCart } from "../../utils/cart";
import {
    COLLECTIONS,
    DEFAULT_COLORS,
    DEFAULT_SIZES,
    featureByName,
    normalizeFeatures,
    swatchColor,
    type CollectionProduct,
} from "../../components/collections/UnifiedCollectionPage";
import "../../components/collections/UnifiedCollectionPage.css";
import "./ProductPage.css";

const SITE_URL = "https://www.jqydesigns.com";
const API_BASE = "https://api.jqydesigns.com";
const COLLECTION_SLUGS = Object.keys(COLLECTIONS);

type FoundProduct = { product: CollectionProduct; collection: string };

const upsertMeta = (attribute: "name" | "property", key: string, content: string) => {
    let element = document.head.querySelector(`meta[${attribute}="${key}"]`) as HTMLMetaElement | null;
    if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attribute, key);
        document.head.appendChild(element);
    }
    element.content = content;
};

const upsertLink = (rel: string, href: string) => {
    let element = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
    if (!element) {
        element = document.createElement("link");
        element.rel = rel;
        document.head.appendChild(element);
    }
    element.href = href;
};

function ProductPage() {
    const { productSlug } = useParams<{ productSlug: string }>();
    const { language } = useLanguage();
    const [status, setStatus] = useState<"loading" | "ready" | "notfound" | "error">("loading");
    const [found, setFound] = useState<FoundProduct | null>(null);
    const [imageIndex, setImageIndex] = useState(0);
    const [selection, setSelection] = useState<Record<string, string>>({});
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setStatus("loading");
            try {
                const results = await Promise.all(
                    COLLECTION_SLUGS.map(async (collection) => {
                        const response = await fetch(`${API_BASE}/api/collections/${collection}/products`, {
                            method: "GET",
                            headers: { Accept: "application/json" },
                            cache: "no-store",
                            credentials: "omit",
                        });
                        if (!response.ok) throw new Error(`Products request failed (${response.status})`);
                        const data = (await response.json()) as { products?: CollectionProduct[] };
                        return (data.products || [])
                            .filter((product) => product.is_active)
                            .map((product) => ({ product, collection }));
                    }),
                );
                if (cancelled) return;
                const match = results.flat().find((entry) => entry.product.slug === productSlug);
                if (match) {
                    setFound(match);
                    setStatus("ready");
                } else {
                    setStatus("notfound");
                }
            } catch (err) {
                console.error(err);
                if (!cancelled) setStatus("error");
            }
        };
        void load();
        return () => {
            cancelled = true;
        };
    }, [productSlug]);

    const product = found?.product ?? null;
    const collectionSlug = found?.collection ?? "";
    const collectionConfig = COLLECTIONS[collectionSlug] || COLLECTIONS["love-romance"];

    const features = useMemo(() => (product ? normalizeFeatures(product.features) : []), [product]);
    const colorFeature = featureByName(features, ["color", "colour"]);
    const sizeFeature = featureByName(features, ["size", "tamaño", "tamaño"]);
    const colorOptions = (colorFeature?.options || []).map((option) => String(option.label || "")).filter(Boolean);
    const sizeOptions = (sizeFeature?.options || []).map((option) => String(option.label || "")).filter(Boolean);
    const effectiveColors = colorOptions.length ? colorOptions : DEFAULT_COLORS;
    const effectiveSizes = sizeOptions.length ? sizeOptions : DEFAULT_SIZES;
    const otherFeatures = features.filter((feature) => {
        const name = String(feature.name || "").toLowerCase();
        return name !== "color" && name !== "colour" && name !== "size" && name !== "tamaño" && name !== "tamaño";
    });

    const effectiveSelection: Record<string, string> = { ...selection };
    if (effectiveColors.length && !effectiveSelection.Color) effectiveSelection.Color = effectiveColors[0];
    if (effectiveSizes.length && !effectiveSelection.Size) effectiveSelection.Size = effectiveSizes[0];

    const images = useMemo(() => {
        if (!product) return [] as string[];
        return (product.image_urls?.length ? product.image_urls : product.image_url ? [product.image_url] : []).slice(0, 3);
    }, [product]);
    const safeImageIndex = Math.min(imageIndex, Math.max(images.length - 1, 0));
    const currentImage = images[safeImageIndex] || "/images/products/placeholder.jpg";

    /* La ficha del producto manda en el <head> de esta ruta: la Seo global
       salta /products/* y esta pagina pone titulo, descripcion, Open Graph,
       canonical y el JSON-LD Product propios. */
    useEffect(() => {
        if (!product) return;
        const url = `${SITE_URL}/products/${product.slug}`;
        const title = `${product.name} | JQYDesigns`;
        const description = String(product.description || "").replace(/\s+/g, " ").trim().slice(0, 300)
            || `${product.name} — personalized gift by JQYDesigns, made to order in Katy, TX.`;
        const image = product.image_url || product.image_urls?.[0] || "";

        document.title = title;
        upsertMeta("name", "description", description);
        upsertMeta("property", "og:title", title);
        upsertMeta("property", "og:description", description);
        upsertMeta("property", "og:url", url);
        upsertMeta("property", "og:type", "product");
        upsertMeta("property", "og:site_name", "JQYDesigns");
        if (image) upsertMeta("property", "og:image", image);
        upsertMeta("name", "twitter:title", title);
        upsertMeta("name", "twitter:description", description);
        if (image) upsertMeta("name", "twitter:image", image);
        upsertMeta("name", "twitter:card", "summary_large_image");
        upsertLink("canonical", url);

        const jsonLd = {
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.name,
            ...(images.length ? { image: images } : {}),
            description: product.description || "",
            sku: String(product.product_id ?? product.slug),
            brand: { "@type": "Brand", name: "JQYDesigns" },
            offers: {
                "@type": "Offer",
                url,
                priceCurrency: "USD",
                price: Number(product.price).toFixed(2),
                availability: "https://schema.org/InStock",
                itemCondition: "https://schema.org/NewCondition",
            },
        };
        const script = document.createElement("script");
        script.type = "application/ld+json";
        script.id = "jqy-product-jsonld";
        script.textContent = JSON.stringify(jsonLd);
        document.head.appendChild(script);
        return () => {
            script.remove();
        };
    }, [product, images]);

    const handleAddToCart = () => {
        if (!product) return;
        addToCart(
            {
                id: product.product_id,
                name: product.name,
                model: collectionConfig.name.en,
                size: effectiveSelection.Size || "",
                color: effectiveSelection.Color || "",
                options: effectiveSelection,
                price: Number(product.price),
                image: product.image_url || "/images/products/placeholder.jpg",
            },
            quantity,
        );
    };

    return (
        <>
            <Header />
            <main className="product-page">
                {status === "loading" && (
                    <div className="unified-state">{language === "es" ? "Cargando producto..." : "Loading product..."}</div>
                )}
                {status === "error" && (
                    <div className="unified-state unified-state--error">
                        {language === "es" ? "No se pudo cargar el producto." : "Unable to load this product."}{" "}
                        <Link to="/collections">{language === "es" ? "Ver colecciones" : "Browse collections"}</Link>
                    </div>
                )}
                {status === "notfound" && (
                    <div className="unified-state">
                        {language === "es" ? "Ese producto ya no está disponible." : "That product is no longer available."}{" "}
                        <Link to="/collections">{language === "es" ? "Ver colecciones" : "Browse collections"}</Link>
                    </div>
                )}
                {status === "ready" && product && (
                    <>
                        <nav className="product-page__crumbs" aria-label="breadcrumb">
                            <Link to="/">{language === "es" ? "Inicio" : "Home"}</Link>
                            <span aria-hidden="true">/</span>
                            <Link to={`/collections/${collectionSlug}`}>{collectionConfig.name[language]}</Link>
                            <span aria-hidden="true">/</span>
                            <span aria-current="page">{product.name}</span>
                        </nav>
                        <section className="product-page__panel">
                            <div className="unified-lightbox__image-wrap">
                                <img src={currentImage} alt={product.name} />
                                <div className="unified-lightbox__gradient" />
                                {images.length > 1 && (
                                    <>
                                        <button
                                            type="button"
                                            className="unified-lightbox__nav unified-lightbox__nav--prev"
                                            onClick={() => setImageIndex((index) => (index - 1 + images.length) % images.length)}
                                            aria-label={language === "es" ? "Imagen anterior" : "Previous image"}
                                        >
                                            ‹
                                        </button>
                                        <button
                                            type="button"
                                            className="unified-lightbox__nav unified-lightbox__nav--next"
                                            onClick={() => setImageIndex((index) => (index + 1) % images.length)}
                                            aria-label={language === "es" ? "Siguiente imagen" : "Next image"}
                                        >
                                            ›
                                        </button>
                                        <div className="unified-lightbox__counter">
                                            {safeImageIndex + 1}/{images.length}
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="unified-lightbox__details">
                                <span className="unified-lightbox__eyebrow">{collectionConfig.eyebrow[language]}</span>
                                <h1 className="product-page__title">{product.name}</h1>
                                <div className="unified-rating" aria-label="5 out of 5 stars">★★★★★</div>
                                <div className="unified-divider"><span>♥</span></div>
                                <p className="unified-lightbox__description">
                                    {product.description || (language === "es" ? "Producto de muestra" : "Sample product")}
                                </p>
                                <p className="product-page__stock">
                                    {language === "es" ? "En stock — hecho a pedido en Katy, TX" : "In stock — made to order in Katy, TX"}
                                </p>
                                <div className="unified-options unified-options--lightbox">
                                    <div className="unified-option-group">
                                        <span className="unified-option-label">COLOR</span>
                                        <div className="unified-color-list">
                                            {effectiveColors.map((color) => (
                                                <button
                                                    key={color}
                                                    type="button"
                                                    className={`unified-color${effectiveSelection.Color === color ? " is-selected" : ""}`}
                                                    onClick={() => setSelection((current) => ({ ...current, Color: color }))}
                                                    aria-label={color}
                                                    aria-pressed={effectiveSelection.Color === color}
                                                >
                                                    <span style={{ backgroundColor: swatchColor(color) }} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="unified-option-group">
                                        <span className="unified-option-label">{language === "es" ? "TAMAÑO" : "SIZE"}</span>
                                        <div className="unified-size-list">
                                            {effectiveSizes.map((size) => (
                                                <button
                                                    key={size}
                                                    type="button"
                                                    className={`unified-size${effectiveSelection.Size === size ? " is-selected" : ""}`}
                                                    onClick={() => setSelection((current) => ({ ...current, Size: size }))}
                                                    aria-pressed={effectiveSelection.Size === size}
                                                >
                                                    {size}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    {otherFeatures.map((feature) => {
                                        const name = String(feature.name || "Option");
                                        const options = (feature.options || []).map((option) => String(option.label || "")).filter(Boolean);
                                        if (!options.length) return null;
                                        return (
                                            <div className="unified-option-group" key={name}>
                                                <span className="unified-option-label">{name.toUpperCase()}</span>
                                                <div className="unified-size-list">
                                                    {options.map((option) => (
                                                        <button
                                                            key={option}
                                                            type="button"
                                                            className={`unified-size${effectiveSelection[name] === option ? " is-selected" : ""}`}
                                                            onClick={() => setSelection((current) => ({ ...current, [name]: option }))}
                                                            aria-pressed={effectiveSelection[name] === option}
                                                        >
                                                            {option}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="unified-product__quantity">
                                    <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))}>−</button>
                                    <span>{quantity}</span>
                                    <button type="button" onClick={() => setQuantity((value) => value + 1)}>+</button>
                                </div>
                                <div className="unified-lightbox__price">
                                    <span>{language === "es" ? "PRECIO" : "PRICE"}</span>
                                    <strong>${Number(product.price).toFixed(2)}</strong>
                                </div>
                                <button type="button" className="unified-add-cart unified-add-cart--large" onClick={handleAddToCart}>
                                    {language === "es" ? "AGREGAR AL CARRITO" : "ADD TO CART"}
                                </button>
                                <p className="product-page__back">
                                    <Link to={`/collections/${collectionSlug}`}>
                                        ← {language === "es" ? "Volver a" : "Back to"} {collectionConfig.name[language]}
                                    </Link>
                                </p>
                            </div>
                        </section>
                    </>
                )}
            </main>
            <Footer />
        </>
    );
}

export default ProductPage;
