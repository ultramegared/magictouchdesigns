import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RotateCcw, Upload, ShieldCheck, Download } from "lucide-react";

import Header from "../../components/layout/Header";
import Footer from "../../components/home/Footer";
import { addToCart } from "../../utils/cart";
import { createCustomizationId, saveCustomizationSession } from "../../utils/customization";
import Mug3DPreview from "./Mug3DPreview";
import "./Mug3DPreview.css";
import "./CustomizePage.css";

const API_URL = "https://api.jqydesigns.com/api";

type MugVariant = { id: string; name: string; family: "colored-handle" | "solid"; bodyColor: string; accentColor: string; swatchColor: string };
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

type Product = { product_id: string; name: string; price: number; image_url?: string | null; is_active?: boolean };
type ProductsResponse = { products?: Product[] };
function fileToDataUrl(file: Blob): Promise<string> { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error("Unable to read the image.")); reader.readAsDataURL(file); }); }
async function prepareImageForCheckout(file: File): Promise<string> {
    const limit = 2.8 * 1024 * 1024;
    if (file.size <= limit) return fileToDataUrl(file);
    const objectUrl = URL.createObjectURL(file);
    try {
        const image = new Image(); image.src = objectUrl;
        await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error("Unable to decode image.")); });
        const maxDimension = 2400;
        const factor = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.naturalWidth * factor)); canvas.height = Math.max(1, Math.round(image.naturalHeight * factor));
        const context = canvas.getContext("2d"); if (!context) throw new Error("Image processing is unavailable.");
        context.imageSmoothingEnabled = true; context.imageSmoothingQuality = "high"; context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const toBlob = (type: string, quality?: number) => new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
        if (file.type === "image/png") { const png = await toBlob("image/png"); if (png && png.size <= limit) return fileToDataUrl(png); }
        context.globalCompositeOperation = "destination-over"; context.fillStyle = "#ffffff"; context.fillRect(0, 0, canvas.width, canvas.height);
        for (const quality of [0.9, 0.82, 0.74, 0.66, 0.58]) { const blob = await toBlob("image/jpeg", quality); if (blob && blob.size <= limit) return fileToDataUrl(blob); }
        throw new Error("This image is too large to process. Please choose a smaller photo.");
    } finally { URL.revokeObjectURL(objectUrl); }
}
const TEXT_FONTS = [
    { label: "Elegant Script", value: "'Brush Script MT', 'Segoe Script', cursive" },
    { label: "Classic Serif", value: "Georgia, 'Times New Roman', serif" },
    { label: "Modern Sans", value: "Arial, Helvetica, sans-serif" },
    { label: "Bold", value: "Impact, Haettenschweiler, sans-serif" },
    { label: "Handwritten", value: "'Comic Sans MS', cursive" },
    { label: "Typewriter", value: "'Courier New', monospace" },
    { label: "Rounded", value: "'Trebuchet MS', sans-serif" },
    { label: "Luxury", value: "Garamond, Georgia, serif" },
];
function escapeXml(value: string) { return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;"); }
function createTextArtwork(text: string, font: string, color: string, size: number) {
    const safeText = escapeXml(text.trim().slice(0, 36));
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="900" viewBox="0 0 1800 900"><text x="900" y="450" text-anchor="middle" dominant-baseline="middle" font-family="${escapeXml(font)}" font-size="${Math.max(32, Math.min(260, size))}" font-weight="600" fill="${escapeXml(color)}">${safeText}</text></svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}


async function downloadPrintReadyArtwork(designUrl: string, size: "11 oz" | "15 oz", scale: number, designX: number, designY: number, rotation: number) {
    // Common sublimation wrap sizes at 300 DPI; the file is exported at full print resolution.
    const widthInches = size === "15 oz" ? 8.75 : 8.5;
    const heightInches = size === "15 oz" ? 4.25 : 3.5;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(widthInches * 300);
    canvas.height = Math.round(heightInches * 300);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not prepare the print file.");
    // Keep the export edge-to-edge: no white background, border, or handle gap.
    const image = new Image();
    image.src = designUrl;
    await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error("Could not load your design for download.")); });
    const drawScale = Math.max(canvas.width * Math.max(0.4, Math.min(1.6, scale)) / image.naturalWidth, canvas.height * Math.max(0.4, Math.min(1.6, scale)) / image.naturalHeight);
    const w = image.naturalWidth * drawScale;
    const h = image.naturalHeight * drawScale;
    const x = canvas.width / 2 + (designX / 100) * Math.max(0, w - canvas.width);
    const y = canvas.height / 2 + (designY / 100) * Math.max(0, h - canvas.height);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation * Math.PI / 180);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(image, -w / 2, -h / 2, w, h);
    ctx.restore();
    canvas.toBlob((blob) => {
        if (!blob) { alert("Could not create the PNG file. Please try again."); return; }
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `JQYDesigns-Mug-${size.replace(" ", "")}-${widthInches}x${heightInches}in-300dpi.png`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    }, "image/png");
}

function CustomizePage() {
    const navigate = useNavigate();
    const [products, setProducts] = useState<Product[]>([]);
    const [productId, setProductId] = useState("");
    const [size, setSize] = useState<"11 oz" | "15 oz">("11 oz");
    const [variantId, setVariantId] = useState("white-pink");
    const [designUrl, setDesignUrl] = useState<string | null>(null);
    const [originalDesignUrl, setOriginalDesignUrl] = useState<string | null>(null);
    const [designFileName, setDesignFileName] = useState<string | null>(null);
    const [artworkMode, setArtworkMode] = useState<"photo" | "text">("photo");
    const [customText, setCustomText] = useState("");
    const [textFont, setTextFont] = useState(TEXT_FONTS[0].value);
    const [textColor, setTextColor] = useState("#172b55");
    const [textFontSize, setTextFontSize] = useState(112);
    const [draggingText, setDraggingText] = useState(false);
    const [designScale, setDesignScale] = useState(1);
    const [designX, setDesignX] = useState(0);
    const [designY, setDesignY] = useState(0);
    const [designRotation, setDesignRotation] = useState(0);
    const [mugRotation, setMugRotation] = useState(0);
    const [activeView, setActiveView] = useState<"3d" | "front" | "back" | "side">("3d");
    const [error, setError] = useState("");
    const [adding, setAdding] = useState(false);
    useEffect(() => { let cancelled = false; const loadProducts = async () => { try { const response = await fetch(`${API_URL}/products/public`); if (!response.ok) throw new Error("Unable to load products."); const data = await response.json() as ProductsResponse; const activeProducts = (data.products || []).filter((product) => product.is_active !== false); if (!cancelled) { setProducts(activeProducts); setProductId(activeProducts[0]?.product_id || ""); } } catch { if (!cancelled) setError("Unable to load the available mug models."); } }; void loadProducts(); return () => { cancelled = true; }; }, []);
    const selectedProduct = useMemo(() => products.find((product) => product.product_id === productId) || null, [products, productId]);
    const selectedVariant = MUG_VARIANTS.find((variant) => variant.id === variantId) || MUG_VARIANTS[0];
    const price = Number(selectedProduct?.price || 0);
    const resetDesign = () => { setDesignScale(1); setDesignX(0); setDesignY(0); setDesignRotation(0); setMugRotation(0); setActiveView("3d"); };
    const handleImage = async (file: File | undefined) => { if (!file) return; setError(""); if (!file.type.startsWith("image/")) return setError("Please choose a PNG, JPG, JPEG or GIF image."); try { const originalDataUrl = await fileToDataUrl(file); const dataUrl = await prepareImageForCheckout(file); setOriginalDesignUrl(originalDataUrl); setDesignUrl(dataUrl); setDesignFileName(file.name); resetDesign(); } catch (error) { setError(error instanceof Error ? error.message : "The image could not be processed. Please try another file."); } };
    const handleTextChange = (value: string, font = textFont, color = textColor) => {
        setCustomText(value.slice(0, 36));
        if (!value.trim()) {
            setDesignUrl(null);
            setOriginalDesignUrl(null);
            setDesignFileName(null);
            return;
        }
        setOriginalDesignUrl(null);
        setDesignUrl(createTextArtwork(value, font, color, textFontSize));
        setDesignFileName("Personalized-text.svg");
        resetDesign();
    };
    const saveAndAddToCart = () => { if (!selectedProduct) return setError("Choose a mug model before continuing."); if (!designUrl) return setError("Upload your design before adding the custom mug to the cart."); setAdding(true); setError(""); const customizationId = createCustomizationId(); saveCustomizationSession({ id: customizationId, productId: selectedProduct.product_id, productName: selectedProduct.name, size, color: selectedVariant.name, designDataUrl: designUrl, designFileName, designScale, designX, designY, designRotation, mugRotation, createdAt: new Date().toISOString() }); addToCart({ id: selectedProduct.product_id, name: selectedProduct.name, model: `Custom · ${selectedVariant.name}`, size, color: selectedVariant.name, price, image: selectedProduct.image_url || "/images/products/placeholder.jpg", customizationId }); navigate("/cart"); };
    const chooseView = (view: "3d" | "front" | "back" | "side") => { setActiveView(view); if (view === "front") setMugRotation(0); if (view === "back") setMugRotation(Math.PI); if (view === "side") setMugRotation(Math.PI / 2); };
    return <><Header /><main className="customize-page"><div className="customize-shell"><header className="customize-heading"><div><span className="customize-heading__eyebrow">MAGIC TOUCH CUSTOM STUDIO</span><h1>Design Your Mug</h1><p>Choose the exact mug style you use, upload your artwork and inspect the finished mug in realistic 3D before ordering.</p></div></header>{error && <div className="customize-error">{error}</div>}<section className="customize-engine"><aside className="customize-panel customize-panel--controls"><div className="customize-step"><div className="customize-step__title"><span className="customize-step__number">1</span>Select Size</div><div className="customize-size-grid">{(["11 oz", "15 oz"] as const).map((option) => <button key={option} type="button" className={`customize-choice ${size === option ? "customize-choice--active" : ""}`} onClick={() => setSize(option)}>{option}</button>)}</div></div><div className="customize-step"><div className="customize-step__title"><span className="customize-step__number">2</span>Choose Your Real Mug Style</div><p className="customize-step__description">These are the mug combinations you actually use. The 3D model changes to match the selected style.</p><div className="customize-colors">{MUG_VARIANTS.map((option) => <button key={option.id} type="button" title={option.name} aria-label={`Choose ${option.name}`} className={`customize-color customize-color--${option.id} ${variantId === option.id ? "customize-color--active" : ""}`} style={{ "--mug-swatch": option.swatchColor } as CSSProperties} onClick={() => { setVariantId(option.id); setMugRotation(0); setActiveView("3d"); }}><span /><small>{option.name}</small></button>)}</div></div><div className="customize-step"><div className="customize-step__title"><span className="customize-step__number">3</span>Personalize Your Mug</div>
                        <div className="customize-size-grid customize-artwork-mode">
                            <button type="button" className={`customize-choice ${artworkMode === "photo" ? "customize-choice--active" : ""}`} onClick={() => { setArtworkMode("photo"); setDesignUrl(null); setOriginalDesignUrl(null); setDesignFileName(null); }}>Photo</button>
                            <button type="button" className={`customize-choice ${artworkMode === "text" ? "customize-choice--active" : ""}`} onClick={() => { setArtworkMode("text"); setDesignUrl(null); setOriginalDesignUrl(null); setDesignFileName(null); setCustomText(""); }}>Letters / Name</button>
                        </div>
                        {artworkMode === "text" ? <div className="customize-text-design">
                            <label className="customize-text-label">Text or name (up to 36 characters)
                                <input className="customize-select" type="text" maxLength={36} value={customText} placeholder="Enter a name or short message" onChange={(event) => handleTextChange(event.target.value)} />
                            </label>
                            <label className="customize-text-label">Letter style
                                <select className="customize-select" value={textFont} onChange={(event) => { setTextFont(event.target.value); if (customText.trim()) { setDesignUrl(createTextArtwork(customText, event.target.value, textColor, textFontSize)); setDesignFileName("Personalized-text.svg"); } }}>
                                    {TEXT_FONTS.map((font) => <option key={font.label} value={font.value}>{font.label}</option>)}
                                </select>
                            </label>
                            <label className="customize-text-label">Text color
                                <input type="color" value={textColor} aria-label="Text color" onChange={(event) => { setTextColor(event.target.value); if (customText.trim()) { setDesignUrl(createTextArtwork(customText, textFont, event.target.value, textFontSize)); setDesignFileName("Personalized-text.svg"); } }} />
                            </label>
                            <label className="customize-text-label">Letter size <strong>{textFontSize}px</strong>
                                <input className="customize-range" type="range" min="32" max="260" step="2" value={textFontSize} onChange={(event) => { const nextSize = Number(event.target.value); setTextFontSize(nextSize); if (customText.trim()) { setDesignUrl(createTextArtwork(customText, textFont, textColor, nextSize)); setDesignFileName("Personalized-text.svg"); } }} />
                            </label>
                            <div className="customize-text-position">
                                <strong>Position the lettering</strong>
                                <span>Drag with your finger or mouse to move it on the mug.</span>
                                <div className={`customize-text-position__pad ${draggingText ? "is-dragging" : ""}`}
                                    role="application" aria-label="Drag area to position lettering"
                                    onPointerDown={(event) => { setDraggingText(true); event.currentTarget.setPointerCapture(event.pointerId); const rect = event.currentTarget.getBoundingClientRect(); setDesignX(Math.round(Math.max(-35, Math.min(35, ((event.clientX - rect.left) / rect.width - 0.5) * 70)))); setDesignY(Math.round(Math.max(-25, Math.min(25, (0.5 - (event.clientY - rect.top) / rect.height) * 50)))); }}
                                    onPointerMove={(event) => { if (!draggingText) return; const rect = event.currentTarget.getBoundingClientRect(); setDesignX(Math.round(Math.max(-35, Math.min(35, ((event.clientX - rect.left) / rect.width - 0.5) * 70)))); setDesignY(Math.round(Math.max(-25, Math.min(25, (0.5 - (event.clientY - rect.top) / rect.height) * 50)))); }}
                                    onPointerUp={() => setDraggingText(false)} onPointerCancel={() => setDraggingText(false)}>
                                    <span className="customize-text-position__crosshair">＋</span>
                                    <span className="customize-text-position__label">Touch and drag</span>
                                </div>
                                <div className="customize-text-position__values"><span>Horizontal: {designX}%</span><span>Vertical: {designY}%</span></div>
                            </div>
                            <p className="customize-step__description">Your text will appear on the 3D mug preview. No photo is required.</p>
                        </div> : <><label className="customize-upload"><Upload size={22} /><strong>{designUrl ? "Change Image" : "Upload Your Image"}</strong><span>PNG, JPG, JPEG or GIF · max 3 MB</span><input type="file" accept="image/png,image/jpeg,image/gif" onChange={(event) => void handleImage(event.target.files?.[0])} /></label>{designUrl && <div className="customize-photo-editor"><strong>Print area · {size}</strong><span>Drag the photo inside this fixed frame. Use Scale below to resize it.</span><div className="customize-photo-frame" role="application" aria-label="Move photo inside the fixed mug print area" onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); const rect = event.currentTarget.getBoundingClientRect(); setDesignX(Math.round(Math.max(-35, Math.min(35, ((event.clientX - rect.left) / rect.width - 0.5) * 70)))); setDesignY(Math.round(Math.max(-25, Math.min(25, (0.5 - (event.clientY - rect.top) / rect.height) * 50)))); }} onPointerMove={(event) => { if (!event.currentTarget.hasPointerCapture(event.pointerId)) return; const rect = event.currentTarget.getBoundingClientRect(); setDesignX(Math.round(Math.max(-35, Math.min(35, ((event.clientX - rect.left) / rect.width - 0.5) * 70)))); setDesignY(Math.round(Math.max(-25, Math.min(25, (0.5 - (event.clientY - rect.top) / rect.height) * 50)))); }} onPointerUp={(event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }} onPointerCancel={(event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}><img src={designUrl} alt="Photo inside fixed print boundary" style={{ objectPosition: `${Math.max(0, Math.min(100, 50 - designX))}% ${Math.max(0, Math.min(100, 50 - designY))}%`, transform: `scale(${designScale}) rotate(${designRotation}deg)` }} /><span className="customize-photo-frame__caption">PRINT BOUNDARY</span></div><div className="customize-photo-editor__values"><span>Horizontal {designX}%</span><span>Vertical {designY}%</span></div></div>}</>}{artworkMode === "photo" && designFileName && (
                            <div className="customize-uploaded-artwork">
                                <div className="customize-uploaded-artwork__thumb">{designUrl && <img src={designUrl} alt="Uploaded mug artwork" />}</div>
                                <div className="customize-uploaded-artwork__info"><strong>Image loaded</strong><span title={designFileName}>{designFileName}</span></div>
                                <span className="customize-uploaded-artwork__check">✓</span>
                            </div>
                        )}</div><div className="customize-step"><div className="customize-step__title"><span className="customize-step__number">4</span>Adjust Design</div><div className="customize-control-row"><label htmlFor="design-scale">Scale</label><span className="customize-control-value">{Math.round(designScale * 100)}%</span><input id="design-scale" className="customize-range" type="range" min="0.4" max="1.6" step="0.01" value={designScale} onChange={(event) => setDesignScale(Number(event.target.value))} /></div><div className="customize-control-row"><label htmlFor="design-x">Horizontal</label><span className="customize-control-value">{designX}%</span><input id="design-x" className="customize-range" type="range" min="-35" max="35" step="1" value={designX} onChange={(event) => setDesignX(Number(event.target.value))} /></div><div className="customize-control-row"><label htmlFor="design-y">Vertical</label><span className="customize-control-value">{designY}%</span><input id="design-y" className="customize-range" type="range" min="-25" max="25" step="1" value={designY} onChange={(event) => setDesignY(Number(event.target.value))} /></div><div className="customize-control-row"><label htmlFor="design-rotation">Artwork rotation</label><span className="customize-control-value">{designRotation}°</span><input id="design-rotation" className="customize-range" type="range" min="-180" max="180" step="1" value={designRotation} onChange={(event) => setDesignRotation(Number(event.target.value))} /></div><button type="button" className="customize-reset" onClick={resetDesign}><RotateCcw size={14} /> Reset Design</button></div></aside><section className="customize-center"><div className="customize-view-tabs">{([ ["3d", "Realistic 3D"], ["front", "Front View"], ["back", "Back View"], ["side", "Side View"] ] as const).map(([view, label]) => <button key={view} type="button" className={`customize-view-tab ${activeView === view ? "customize-view-tab--active" : ""}`} onClick={() => chooseView(view)}>{label}</button>)}</div><Mug3DPreview mugStyle={selectedVariant.family} mugSize={size} mugBodyColor={selectedVariant.bodyColor} mugAccentColor={selectedVariant.accentColor} designUrl={designUrl} designScale={designScale} designX={designX} designY={designY} designRotation={designRotation} rotation={mugRotation} onRotationChange={(value) => { setMugRotation(value); setActiveView("3d"); }} /><div className="customize-side-preview"><button type="button" onClick={() => chooseView("front")}>Front</button><button type="button" onClick={() => chooseView("side")}>Right Side</button><button type="button" onClick={() => chooseView("back")}>Back</button><button type="button" onClick={() => { setActiveView("side"); setMugRotation(-Math.PI / 2); }}>Left Side</button></div></section><aside className="customize-panel customize-panel--summary"><div className="customize-summary"><div><span className="customize-summary__label">YOUR CREATION</span><h2>Product Details</h2><div className="customize-summary__product"><div><strong>{selectedProduct?.name || "Ceramic Mug"}</strong><span>{size} · {selectedVariant.name} · Custom artwork</span></div><span className="customize-summary__price">${price.toFixed(2)}</span></div></div><div className="customize-summary__specs"><div className="customize-summary__spec"><span>Size</span><strong>{size}</strong></div><div className="customize-summary__spec"><span>Mug style</span><strong>{selectedVariant.name}</strong></div><div className="customize-summary__spec"><span>Artwork</span><strong>{designUrl ? "Uploaded" : "Required"}</strong></div></div><div><div className="customize-summary__note">Shipping and taxes are calculated automatically at checkout from the customer's delivery destination.</div><button type="button" className="customize-summary__button" disabled={!selectedProduct || !designUrl || adding} onClick={saveAndAddToCart}>{adding ? "Adding…" : "Add Custom Mug to Cart →"}</button><button type="button" className="customize-download__button" disabled={!designUrl} onClick={() => { if (designUrl) void downloadPrintReadyArtwork(originalDesignUrl || designUrl, size, designScale, designX, designY, designRotation); }}><Download size={16} /> Download print design · {size}</button><p className="customize-download__note">PNG at 300 DPI · {size === "15 oz" ? "8.75 × 4.25 in" : "8.5 × 3.5 in"}. Saves to your phone or computer.</p><div className="customize-summary__secure"><ShieldCheck size={13} /> Your artwork is kept only temporarily for order processing and is deleted after the production email is sent.</div></div></div></aside></section></div></main><Footer /></>;
}
export default CustomizePage;
