import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RotateCcw, Upload, ShieldCheck } from "lucide-react";

import Header from "../../components/layout/Header";
import Footer from "../../components/home/Footer";
import { addToCart } from "../../utils/cart";
import { createCustomizationId, saveCustomizationSession } from "../../utils/customization";
import Mug3DPreview from "./Mug3DPreview";
import "./Mug3DPreview.css";
import "./CustomizePage.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

type MugVariant = {
    id: string;
    name: string;
    family: "colored-handle" | "solid";
    bodyColor: string;
    accentColor: string;
    swatchColor: string;
};

const MUG_VARIANTS: MugVariant[] = [
    { id: "white-pink", name: "White + Pink Handle", family: "colored-handle", bodyColor: "#f8f8f6", accentColor: "#e38ca8", swatchColor: "#e38ca8" },
    { id: "white-blue", name: "White + Blue Handle", family: "colored-handle", bodyColor: "#f8f8f6", accentColor: "#2f65b0", swatchColor: "#2f65b0" },
    { id: "white-green", name: "White + Green Handle", family: "colored-handle", bodyColor: "#f8f8f6", accentColor: "#2e7b4a", swatchColor: "#2e7b4a" },
    { id: "white-red", name: "White + Red Handle", family: "colored-handle", bodyColor: "#f8f8f6", accentColor: "#c52e35", swatchColor: "#c52e35" },
    { id: "white-black", name: "White + Black Handle", family: "colored-handle", bodyColor: "#f8f8f6", accentColor: "#171717", swatchColor: "#171717" },
    { id: "solid-white", name: "Solid White", family: "solid", bodyColor: "#f8f8f6", accentColor: "#f8f8f6", swatchColor: "#f8f8f6" },
    { id: "solid-red", name: "Solid Red", family: "solid", bodyColor: "#c52e35", accentColor: "#c52e35", swatchColor: "#c52e35" },
    { id: "solid-black", name: "Solid Black", family: "solid", bodyColor: "#171717", accentColor: "#171717", swatchColor: "#171717" },
    { id: "solid-blue", name: "Solid Blue", family: "solid", bodyColor: "#2f65b0", accentColor: "#2f65b0", swatchColor: "#2f65b0" },
];

type Product = {
    product_id: string;
    name: string;
    price: number;
    image_url?: string | null;
    is_active?: boolean;
};

type ProductsResponse = { products?: Product[] };

function readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Unable to read the image."));
        reader.readAsDataURL(file);
    });
}

function CustomizePage() {
    const navigate = useNavigate();
    const [products, setProducts] = useState<Product[]>([]);
    const [productId, setProductId] = useState("");
    const [size, setSize] = useState<"11 oz" | "15 oz">("11 oz");
    const [variantId, setVariantId] = useState("white-pink");
    const [designUrl, setDesignUrl] = useState<string | null>(null);
    const [designFileName, setDesignFileName] = useState<string | null>(null);
    const [designScale, setDesignScale] = useState(1);
    const [designX, setDesignX] = useState(0);
    const [designY, setDesignY] = useState(0);
    const [designRotation, setDesignRotation] = useState(0);
    const [mugRotation, setMugRotation] = useState(0);
    const [error, setError] = useState("");
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const loadProducts = async () => {
            try {
                const response = await fetch(`${API_URL}/products/public`);
                if (!response.ok) throw new Error("Unable to load products.");
                const data = (await response.json()) as ProductsResponse;
                const activeProducts = (data.products || []).filter((product) => product.is_active !== false);
                if (!cancelled) {
                    setProducts(activeProducts);
                    setProductId(activeProducts[0]?.product_id || "");
                }
            } catch {
                if (!cancelled) setError("Unable to load the available mug models.");
            }
        };
        void loadProducts();
        return () => { cancelled = true; };
    }, []);

    const selectedProduct = useMemo(() => products.find((product) => product.product_id === productId) || null, [products, productId]);
    const selectedVariant = MUG_VARIANTS.find((variant) => variant.id === variantId) || MUG_VARIANTS[0];
    const price = Number(selectedProduct?.price || 0);

    const resetDesign = () => {
        setDesignScale(1);
        setDesignX(0);
        setDesignY(0);
        setDesignRotation(0);
        setMugRotation(0);
    };

    const handleImage = async (file: File | undefined) => {
        if (!file) return;
        setError("");
        if (!file.type.startsWith("image/")) {
            setError("Please choose a PNG, JPG, JPEG or GIF image.");
            return;
        }
        if (file.size > 8 * 1024 * 1024) {
            setError("The image must be 8 MB or smaller.");
            return;
        }
        try {
            const dataUrl = await readFileAsDataUrl(file);
            setDesignUrl(dataUrl);
            setDesignFileName(file.name);
            resetDesign();
        } catch {
            setError("The image could not be loaded. Please try another file.");
        }
    };

    const saveAndAddToCart = () => {
        if (!selectedProduct) return setError("Choose a mug model before continuing.");
        if (!designUrl) return setError("Upload your design before adding the custom mug to the cart.");
        setAdding(true);
        setError("");
        const customizationId = createCustomizationId();
        saveCustomizationSession({
            id: customizationId,
            productId: selectedProduct.product_id,
            productName: selectedProduct.name,
            size,
            color: selectedVariant.name,
            designDataUrl: designUrl,
            designFileName,
            designScale,
            designX,
            designY,
            designRotation,
            mugRotation,
            createdAt: new Date().toISOString(),
        });
        addToCart({
            id: selectedProduct.product_id,
            name: selectedProduct.name,
            model: `Custom · ${selectedVariant.name}`,
            size,
            color: selectedVariant.name,
            price,
            image: selectedProduct.image_url || "/images/products/placeholder.jpg",
            customizationId,
        });
        navigate("/cart");
    };

    return (
        <>
            <Header />
            <main className="customize-page">
                <div className="customize-shell">
                    <header className="customize-heading">
                        <div>
                            <span className="customize-heading__eyebrow">MAGIC TOUCH CUSTOM STUDIO</span>
                            <h1>Design Your Mug</h1>
                            <p>Choose the exact mug style you use, upload your artwork and inspect the finished mug in realistic 3D before ordering.</p>
                        </div>
                    </header>
                    {error && <div className="customize-error">{error}</div>}
                    <section className="customize-engine">
                        <aside className="customize-panel customize-panel--controls">
                            <div className="customize-step">
                                <div className="customize-step__title"><span className="customize-step__number">1</span>Choose Product</div>
                                <select className="customize-select" value={productId} onChange={(event) => setProductId(event.target.value)}>
                                    {!products.length && <option value="">Loading mug models…</option>}
                                    {products.map((product) => <option key={product.product_id} value={product.product_id}>{product.name}</option>)}
                                </select>
                            </div>
                            <div className="customize-step">
                                <div className="customize-step__title"><span className="customize-step__number">2</span>Select Size</div>
                                <div className="customize-size-grid">
                                    {(["11 oz", "15 oz"] as const).map((option) => <button key={option} type="button" className={`customize-choice ${size === option ? "customize-choice--active" : ""}`} onClick={() => setSize(option)}>{option}</button>)}
                                </div>
                            </div>
                            <div className="customize-step">
                                <div className="customize-step__title"><span className="customize-step__number">3</span>Choose Your Real Mug Style</div>
                                <p className="customize-step__description">These are the mug combinations you actually use. The 3D model changes to match the selected style.</p>
                                <div className="customize-colors">
                                    {MUG_VARIANTS.map((option) => (
                                        <button key={option.id} type="button" title={option.name} aria-label={`Choose ${option.name}`} className={`customize-color customize-color--${option.id} ${variantId === option.id ? "customize-color--active" : ""}`} style={{ "--mug-swatch": option.swatchColor } as CSSProperties} onClick={() => { setVariantId(option.id); setMugRotation(0); }}>
                                            <span />
                                            <small>{option.name}</small>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="customize-step">
                                <div className="customize-step__title"><span className="customize-step__number">4</span>Add Your Design</div>
                                <label className="customize-upload">
                                    <Upload size={22} />
                                    <strong>{designUrl ? "Change Image" : "Upload Your Image"}</strong>
                                    <span>PNG, JPG, JPEG or GIF · max 8 MB</span>
                                    <input type="file" accept="image/png,image/jpeg,image/gif" onChange={(event) => void handleImage(event.target.files?.[0])} />
                                </label>
                                {designFileName && <div className="customize-file-name" title={designFileName}>{designFileName}</div>}
                            </div>
                            <div className="customize-step">
                                <div className="customize-step__title"><span className="customize-step__number">5</span>Adjust Design</div>
                                <div className="customize-control-row"><label htmlFor="design-scale">Scale</label><span className="customize-control-value">{Math.round(designScale * 100)}%</span><input id="design-scale" className="customize-range" type="range" min="0.4" max="1.6" step="0.01" value={designScale} onChange={(event) => setDesignScale(Number(event.target.value))} /></div>
                                <div className="customize-control-row"><label htmlFor="design-x">Horizontal</label><span className="customize-control-value">{designX}%</span><input id="design-x" className="customize-range" type="range" min="-35" max="35" step="1" value={designX} onChange={(event) => setDesignX(Number(event.target.value))} /></div>
                                <div className="customize-control-row"><label htmlFor="design-y">Vertical</label><span className="customize-control-value">{designY}%</span><input id="design-y" className="customize-range" type="range" min="-25" max="25" step="1" value={designY} onChange={(event) => setDesignY(Number(event.target.value))} /></div>
                                <div className="customize-control-row"><label htmlFor="design-rotation">Artwork rotation</label><span className="customize-control-value">{designRotation}°</span><input id="design-rotation" className="customize-range" type="range" min="-180" max="180" step="1" value={designRotation} onChange={(event) => setDesignRotation(Number(event.target.value))} /></div>
                                <button type="button" className="customize-reset" onClick={resetDesign}><RotateCcw size={14} /> Reset Design</button>
                            </div>
                        </aside>
                        <section className="customize-center">
                            <div className="customize-view-tabs">
                                <button type="button" className="customize-view-tab customize-view-tab--active">Realistic 3D</button>
                                <button type="button" className="customize-view-tab" onClick={() => setMugRotation(0)}>Front View</button>
                                <button type="button" className="customize-view-tab" onClick={() => setMugRotation(Math.PI)}>Back View</button>
                                <button type="button" className="customize-view-tab" onClick={() => setMugRotation(Math.PI / 2)}>Side View</button>
                            </div>
                            <Mug3DPreview mugStyle={selectedVariant.family} mugSize={size} mugBodyColor={selectedVariant.bodyColor} mugAccentColor={selectedVariant.accentColor} designUrl={designUrl} designScale={designScale} designX={designX} designY={designY} designRotation={designRotation} rotation={mugRotation} onRotationChange={setMugRotation} />
                            <div className="customize-side-preview">
                                <button type="button" onClick={() => setMugRotation(0)}>Front</button>
                                <button type="button" onClick={() => setMugRotation(Math.PI / 2)}>Right Side</button>
                                <button type="button" onClick={() => setMugRotation(Math.PI)}>Back</button>
                                <button type="button" onClick={() => setMugRotation(-Math.PI / 2)}>Left Side</button>
                            </div>
                        </section>
                        <aside className="customize-panel customize-panel--summary">
                            <div className="customize-summary">
                                <div>
                                    <span className="customize-summary__label">YOUR CREATION</span>
                                    <h2>Product Details</h2>
                                    <div className="customize-summary__product"><div><strong>{selectedProduct?.name || "Ceramic Mug"}</strong><span>{size} · {selectedVariant.name} · Custom artwork</span></div><span className="customize-summary__price">${price.toFixed(2)}</span></div>
                                </div>
                                <div className="customize-summary__specs">
                                    <div className="customize-summary__spec"><span>Size</span><strong>{size}</strong></div>
                                    <div className="customize-summary__spec"><span>Mug style</span><strong>{selectedVariant.name}</strong></div>
                                    <div className="customize-summary__spec"><span>Artwork</span><strong>{designUrl ? "Uploaded" : "Required"}</strong></div>
                                </div>
                                <div>
                                    <div className="customize-summary__note">Shipping and taxes are calculated automatically at checkout from the customer's delivery destination.</div>
                                    <button type="button" className="customize-summary__button" disabled={!selectedProduct || !designUrl || adding} onClick={saveAndAddToCart}>{adding ? "Adding…" : "Add Custom Mug to Cart →"}</button>
                                    <div className="customize-summary__secure"><ShieldCheck size={13} /> Your original artwork stays in the temporary browser session and is not permanently stored by the store.</div>
                                </div>
                            </div>
                        </aside>
                    </section>
                </div>
            </main>
            <Footer />
        </>
    );
}

export default CustomizePage;
