/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: CustomizePage.tsx
 * Module: Frontend
 * Language: TypeScript React
 * Description:
 * Realistic client-side mug customization editor.
 * ================================================================
 */

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RotateCcw, Upload, ShieldCheck } from "lucide-react";

import Header from "../../components/layout/Header";
import Footer from "../../components/home/Footer";
import { addToCart } from "../../utils/cart";
import {
    createCustomizationId,
    saveCustomizationSession,
} from "../../utils/customization";
import Mug3DPreview from "./Mug3DPreview";
import "./Mug3DPreview.css";
import "./CustomizePage.css";

const API_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const COLORS = [
    { name: "White", className: "white", value: "#f8f8f8" },
    { name: "Black", className: "black", value: "#121212" },
    { name: "Red", className: "red", value: "#ba2626" },
    { name: "Navy", className: "navy", value: "#13264a" },
    { name: "Pink", className: "pink", value: "#e9a2b8" },
    { name: "Blue", className: "blue", value: "#8cc4df" },
    { name: "Green", className: "green", value: "#2f7d4a" },
    { name: "Yellow", className: "yellow", value: "#f0c82e" },
    { name: "Orange", className: "orange", value: "#ed6d1e" },
    { name: "Purple", className: "purple", value: "#6b3fb2" },
];

type Product = {
    product_id: string;
    name: string;
    price: number;
    image_url?: string | null;
    is_active?: boolean;
};

type ProductsResponse = {
    products?: Product[];
};

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
    const [color, setColor] = useState(COLORS[0]);
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
                const activeProducts = (data.products || []).filter(
                    (product) => product.is_active !== false
                );

                if (!cancelled) {
                    setProducts(activeProducts);
                    setProductId(activeProducts[0]?.product_id || "");
                }
            } catch {
                if (!cancelled) {
                    setError("Unable to load the available mug models.");
                }
            }
        };

        void loadProducts();

        return () => {
            cancelled = true;
        };
    }, []);

    const selectedProduct = useMemo(
        () => products.find((product) => product.product_id === productId) || null,
        [products, productId]
    );

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
        if (!selectedProduct) {
            setError("Choose a mug model before continuing.");
            return;
        }

        setAdding(true);
        setError("");

        const customizationId = createCustomizationId();

        saveCustomizationSession({
            id: customizationId,
            productId: selectedProduct.product_id,
            productName: selectedProduct.name,
            size,
            color: color.name,
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
            model: "Custom",
            size,
            color: color.name,
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
                            <span className="customize-heading__eyebrow">
                                MAGIC TOUCH CUSTOM STUDIO
                            </span>
                            <h1>Design Your Mug</h1>
                            <p>
                                Build your mug before you buy it. Rotate the real-time
                                3D model, change the ceramic color and position your
                                artwork until it looks exactly how you want it.
                            </p>
                        </div>
                    </header>

                    {error && <div className="customize-error">{error}</div>}

                    <section className="customize-engine">
                        <aside className="customize-panel customize-panel--controls">
                            <div className="customize-step">
                                <div className="customize-step__title">
                                    <span className="customize-step__number">1</span>
                                    Choose Product
                                </div>
                                <select
                                    className="customize-select"
                                    value={productId}
                                    onChange={(event) => setProductId(event.target.value)}
                                >
                                    {!products.length && (
                                        <option value="">Loading mug models…</option>
                                    )}
                                    {products.map((product) => (
                                        <option key={product.product_id} value={product.product_id}>
                                            {product.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="customize-step">
                                <div className="customize-step__title">
                                    <span className="customize-step__number">2</span>
                                    Select Size
                                </div>
                                <div className="customize-size-grid">
                                    {(["11 oz", "15 oz"] as const).map((option) => (
                                        <button
                                            key={option}
                                            type="button"
                                            className={`customize-choice ${size === option ? "customize-choice--active" : ""}`}
                                            onClick={() => setSize(option)}
                                        >
                                            {option}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="customize-step">
                                <div className="customize-step__title">
                                    <span className="customize-step__number">3</span>
                                    Choose Mug Color
                                </div>
                                <div className="customize-colors">
                                    {COLORS.map((option) => (
                                        <button
                                            key={option.name}
                                            type="button"
                                            title={option.name}
                                            aria-label={`Choose ${option.name} mug`}
                                            className={`customize-color customize-color--${option.className} ${color.name === option.name ? "customize-color--active" : ""}`}
                                            onClick={() => setColor(option)}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="customize-step">
                                <div className="customize-step__title">
                                    <span className="customize-step__number">4</span>
                                    Add Your Design
                                </div>
                                <label className="customize-upload">
                                    <Upload size={22} />
                                    <strong>{designUrl ? "Change Image" : "Upload Your Image"}</strong>
                                    <span>PNG, JPG, JPEG or GIF · max 8 MB</span>
                                    <input
                                        type="file"
                                        accept="image/png,image/jpeg,image/gif"
                                        onChange={(event) => void handleImage(event.target.files?.[0])}
                                    />
                                </label>
                                {designFileName && (
                                    <div className="customize-file-name" title={designFileName}>
                                        {designFileName}
                                    </div>
                                )}
                            </div>

                            <div className="customize-step">
                                <div className="customize-step__title">
                                    <span className="customize-step__number">5</span>
                                    Adjust Design
                                </div>

                                <div className="customize-control-row">
                                    <label htmlFor="design-scale">Scale</label>
                                    <span className="customize-control-value">{Math.round(designScale * 100)}%</span>
                                    <input id="design-scale" className="customize-range" type="range" min="0.4" max="1.6" step="0.01" value={designScale} onChange={(event) => setDesignScale(Number(event.target.value))} />
                                </div>

                                <div className="customize-control-row">
                                    <label htmlFor="design-x">Horizontal</label>
                                    <span className="customize-control-value">{designX}%</span>
                                    <input id="design-x" className="customize-range" type="range" min="-35" max="35" step="1" value={designX} onChange={(event) => setDesignX(Number(event.target.value))} />
                                </div>

                                <div className="customize-control-row">
                                    <label htmlFor="design-y">Vertical</label>
                                    <span className="customize-control-value">{designY}%</span>
                                    <input id="design-y" className="customize-range" type="range" min="-25" max="25" step="1" value={designY} onChange={(event) => setDesignY(Number(event.target.value))} />
                                </div>

                                <div className="customize-control-row">
                                    <label htmlFor="design-rotation">Artwork rotation</label>
                                    <span className="customize-control-value">{designRotation}°</span>
                                    <input id="design-rotation" className="customize-range" type="range" min="-180" max="180" step="1" value={designRotation} onChange={(event) => setDesignRotation(Number(event.target.value))} />
                                </div>

                                <button type="button" className="customize-reset" onClick={resetDesign}>
                                    <RotateCcw size={14} /> Reset Design
                                </button>
                            </div>
                        </aside>

                        <section className="customize-center">
                            <div className="customize-view-tabs">
                                <button type="button" className="customize-view-tab customize-view-tab--active">Realistic 3D</button>
                                <button type="button" className="customize-view-tab" onClick={() => setMugRotation(0)}>Front View</button>
                                <button type="button" className="customize-view-tab" onClick={() => setMugRotation(Math.PI)}>Back View</button>
                                <button type="button" className="customize-view-tab" onClick={() => setMugRotation(Math.PI / 2)}>Side View</button>
                            </div>

                            <Mug3DPreview
                                mugColor={color.value}
                                designUrl={designUrl}
                                designScale={designScale}
                                designX={designX}
                                designY={designY}
                                designRotation={designRotation}
                                rotation={mugRotation}
                                onRotationChange={setMugRotation}
                            />

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
                                    <div className="customize-summary__product">
                                        <div>
                                            <strong>{selectedProduct?.name || "Ceramic Mug"}</strong>
                                            <span>{size} · {color.name} · Custom artwork</span>
                                        </div>
                                        <span className="customize-summary__price">${price.toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className="customize-summary__specs">
                                    <div className="customize-summary__spec"><span>Size</span><strong>{size}</strong></div>
                                    <div className="customize-summary__spec"><span>Mug color</span><strong>{color.name}</strong></div>
                                    <div className="customize-summary__spec"><span>Artwork</span><strong>{designUrl ? "Uploaded" : "Not added"}</strong></div>
                                </div>

                                <div>
                                    <div className="customize-summary__note">
                                        Shipping and taxes are calculated automatically at checkout from the customer's delivery destination.
                                    </div>

                                    <button type="button" className="customize-summary__button" disabled={!selectedProduct || adding} onClick={saveAndAddToCart}>
                                        {adding ? "Adding…" : "Add Custom Mug to Cart →"}
                                    </button>

                                    <div className="customize-summary__secure">
                                        <ShieldCheck size={13} /> Your original artwork stays in the temporary browser session until the order workflow is complete.
                                    </div>
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
