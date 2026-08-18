
/**
* ===============================================================
* Author: ultramegared
* Project: Magic Touch Designs
* File: CustomizePage.tsx
* Module: Frontend
* Language: TypeScript React
* Description:
* Interactive mug customization editor with live text, image editing,
* mug color/size selection and a realistic CSS 3D preview.
* ===============================================================
*/
import {
useRef,
useState,
type CSSProperties,
type PointerEvent as ReactPointerEvent,
} from "react";
import "./CustomizePage.css";
import Header from "../../components/layout/Header";
import Footer from "../../components/home/Footer";
type MugView = "front" | "back";
type DesignType = "image" | "text";
type MugColor = "white" | "black" | "magic-black" | "red";
type MugSize = "11 oz" | "15 oz";
interface DesignImage {
src: string;
x: number;
y: number;
width: number;
height: number;
}
interface DesignText {
    value: string;
    x: number;
    y: number;
    fontSize: number;
    color: string;
    fontFamily: string;
}

interface ViewDesign {
    image: DesignImage | null;
    text: DesignText | null;
}

interface DragState {
    type: DesignType;
    startX: number;
    startY: number;
    originalX: number;
    originalY: number;
}

interface ResizeState {
    type: DesignType;
    startX: number;
    startY: number;
    originalWidth?: number;
    originalHeight?: number;
    originalSize?: number;
}
const mugColorMap: Record<MugColor, string> = {
white: "#f5f5f2",
black: "#111111",
"magic-black": "#090909",
red: "#a91520",
};
function CustomizePage() {
const [activeView, setActiveView] = useState<MugView>("front");
const [quantity, setQuantity] = useState(1);
const [mugRotation, setMugRotation] = useState(0);
const [selectedDesign, setSelectedDesign] = useState<DesignType | null>(null);
const [mugColor, setMugColor] = useState<MugColor>("white");
const [mugSize, setMugSize] = useState<MugSize>("15 oz");
const [designs, setDesigns] = useState<Record<MugView, ViewDesign>>({
front: { image: null, text: null },
back: { image: null, text: null },
});
const imageInputRef = useRef<HTMLInputElement>(null);
const isMugDragging = useRef(false);
const lastMugPointerX = useRef(0);
const dragState = useRef<DragState | null>(null);
const resizeState = useRef<ResizeState | null>(null);
const currentDesign = designs[activeView];
const currentImage = currentDesign.image;
const currentText = currentDesign.text;
const updateCurrentDesign = (
type: DesignType,
) => {
updater: (current: DesignImage | DesignText | null) => DesignImage | DesignText | null,
setDesigns((current) => {
const view = current[activeView];
if (type === "image") {
return {
...current,
[activeView]: {
...view,
image: updater(view.image) as DesignImage | null,
},
};
}
return {
...current,
[activeView]: {
...view,
text: updater(view.text) as DesignText | null,
},
};
});
};
const handleMugPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
if (selectedDesign) return;
isMugDragging.current = true;
lastMugPointerX.current = event.clientX;
event.currentTarget.setPointerCapture(event.pointerId);
};
const handleMugPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
if (!isMugDragging.current) return;
const deltaX = event.clientX - lastMugPointerX.current;
lastMugPointerX.current = event.clientX;
setMugRotation((current) => Math.max(0, Math.min(360, current + deltaX * 0.8)));
};
const handleMugPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
isMugDragging.current = false;
if (event.currentTarget.hasPointerCapture(event.pointerId)) {
event.currentTarget.releasePointerCapture(event.pointerId);
}
};
const handleViewChange = (view: MugView) => {
setActiveView(view);
setSelectedDesign(null);
setMugRotation(view === "front" ? 0 : 180);
};
const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
const file = event.target.files?.[0];
if (!file) return;
const imageUrl = URL.createObjectURL(file);
setDesigns((current) => ({
...current,
[activeView]: {
...current[activeView],
image: {
src: imageUrl,
x: 50,
y: 48,
width: 70,
height: 55,
},
},
}));
setSelectedDesign("image");
event.target.value = "";
};
const handleTextChange = (value: string) => {
setDesigns((current) => ({
...current,
[activeView]: {
...current[activeView],
text: current[activeView].text
? { ...current[activeView].text!, value }
: {
value,
x: 50,
y: 72,
fontSize: 28,
color: "#111111",
fontFamily: "Arial, sans-serif",
},
},
}));
setSelectedDesign(value ? "text" : null);
};
const handleDesignPointerDown = (
event: ReactPointerEvent<HTMLDivElement>,
type: DesignType,
) => {
event.stopPropagation();
const design = type === "image" ? currentImage : currentText;
if (!design) return;
setSelectedDesign(type);
dragState.current = {
type,
startX: event.clientX,
startY: event.clientY,
originalX: design.x,
originalY: design.y,
};
event.currentTarget.setPointerCapture(event.pointerId);
};
const handleDesignPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
event.stopPropagation();
const state = dragState.current;
if (!state) return;
const rect = event.currentTarget.parentElement?.getBoundingClientRect();
if (!rect) return;
const deltaX = ((event.clientX - state.startX) / rect.width) * 100;
const deltaY = ((event.clientY - state.startY) / rect.height) * 100;
updateCurrentDesign(state.type, (current) => {
if (!current) return current;
return {
...current,
x: Math.max(5, Math.min(95, state.originalX + deltaX)),
y: Math.max(5, Math.min(95, state.originalY + deltaY)),
};
});
};
const handleDesignPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
event.stopPropagation();
dragState.current = null;
if (event.currentTarget.hasPointerCapture(event.pointerId)) {
event.currentTarget.releasePointerCapture(event.pointerId);
}
};
const handleResizePointerDown = (
event: ReactPointerEvent<HTMLButtonElement>,
type: DesignType,
) => {
event.stopPropagation();
const design = type === "image" ? currentImage : currentText;
if (!design) return;
if (type === "image") {
resizeState.current = {
type,
startX: event.clientX,
startY: event.clientY,
originalWidth: design.width,
originalHeight: design.height,
};
} else {
resizeState.current = {
type,
startX: event.clientX,
startY: event.clientY,
originalSize: design.fontSize,
};
}
setSelectedDesign(type);
event.currentTarget.setPointerCapture(event.pointerId);
};
const handleResizePointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
event.stopPropagation();
const state = resizeState.current;
if (!state) return;
const deltaX = event.clientX - state.startX;
const deltaY = event.clientY - state.startY;
if (state.type === "image") {
const width = Math.max(12, Math.min(100, (state.originalWidth ?? 50) + deltaX * 0.12));
const height = Math.max(12, Math.min(100, (state.originalHeight ?? 50) + deltaY * 0.12));
updateCurrentDesign("image", (current) => (current ? { ...current, width, height } : current));
} else {
const fontSize = Math.max(12, Math.min(110, (state.originalSize ?? 28) + deltaX * 0.15));
updateCurrentDesign("text", (current) => (current ? { ...current, fontSize } : current));
}
};
const handleResizePointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
event.stopPropagation();
resizeState.current = null;
if (event.currentTarget.hasPointerCapture(event.pointerId)) {
event.currentTarget.releasePointerCapture(event.pointerId);
}
};
const handleDeleteSelected = () => {
if (!selectedDesign) return;
setDesigns((current) => ({
...current,
[activeView]: {
...current[activeView],
[selectedDesign]: null,
},
}));
setSelectedDesign(null);
};
const handleReset = () => {
setDesigns((current) => ({
...current,
[activeView]: { image: null, text: null },
}));
setSelectedDesign(null);
};
const handleColorChange = (color: string) => {
if (!currentText) return;
updateCurrentDesign("text", (current) => (current && "value" in current ? { ...current, color } : current));
};
const handleFontChange = (fontFamily: string) => {
if (!currentText) return;
updateCurrentDesign("text", (current) => (current && "value" in current ? { ...current, fontFamily } :
current));
};
const mugStyle = {
"--mug-rotation": `${mugRotation}deg`,
"--mug-color": mugColorMap[mugColor],
} as CSSProperties;
return (
<>
<Header />
<main className="customize-page">
<section className="customize-intro">
<span className="customize-eyebrow">PERSONALIZE YOUR DESIGN</span>
<h1>Customize Your Mug</h1>
<p>Create something uniquely yours. Add your photo, text and personal details to make your mug
special.</p>
</section>
<nav className="customize-steps" aria-label="Customization steps">
<div className="customize-step customize-step--active"><span>01</span><strong>Design</strong></div>
<div className="customize-step"><span>02</span><strong>Review</strong></div>
<div className="customize-step"><span>03</span><strong>Add to Cart</strong></div>
</nav>
<section className="customize-workspace">
<aside className="customize-panel">
<div className="customize-panel__header">
<span>YOUR DESIGN</span>
<strong>Customize</strong>
</div>
<div className="customize-tool">
<div className="customize-tool__title"><span className="customize-tool__icon">■</
span><div><strong>Mug</strong><small>Choose size and color</small></div></div>
<div className="customize-option-label">SIZE</div>
<div className="customize-size-options">
{(["11 oz", "15 oz"] as MugSize[]).map((size) => (
<button key={size} type="button" className={mugSize === size ? "is-selected" : ""}
onClick={() => setMugSize(size)}>{size}</button>
))}
</div>
<div className="customize-option-label">COLOR</div>
<div className="customize-mug-colors">
{(["white", "black", "magic-black", "red"] as MugColor[]).map((color) => (
<button key={color} type="button" className={`mug-swatch mug-swatch--${color} ${
mugColor === color ? "is-selected" : ""}`} aria-label={color} onClick={() => setMugColor(color)} />
))}
</div>
</div>
<div className="customize-tool">
<div className="customize-tool__title"><span className="customize-tool__icon">↑</
span><div><strong>Upload Image</strong><small>JPG, PNG or WEBP</small></div></div>
<input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden
onChange={handleImageChange} />
<button type="button" onClick={() => imageInputRef.current?.click()}>Choose Image</button>
</div>
<div className="customize-tool">
<div className="customize-tool__title"><span className="customize-tool__icon">T</
span><div><strong>Add Text</strong><small>Write directly on the design</small></div></div>
<textarea
className="customize-text-input"
value={currentText?.value ?? ""}
onChange={(event) => handleTextChange(event.target.value)}
placeholder="Write your text here..."
rows={3}
/>
</div>
<div className="customize-tool">
<div className="customize-tool__title"><span className="customize-tool__icon">A</
span><div><strong>Font</strong><small>Choose your style</small></div></div>
<select value={currentText?.fontFamily ?? "Arial, sans-serif"} onChange={(event) =>
handleFontChange(event.target.value)}>
<option value="Arial, sans-serif">Classic</option>
<option value="Georgia, serif">Elegant</option>
<option value="Verdana, sans-serif">Modern</option>
</select>
</div>
<div className="customize-tool">
<div className="customize-tool__title"><span className="customize-tool__icon">●</
span><div><strong>Text Color</strong><small>Choose a color</small></div></div>
<div className="customize-color-options">
<button type="button" className="customize-color customize-color--black" aria-
label="Black" onClick={() => handleColorChange("#111111")} />
<button type="button" className="customize-color customize-color--white" aria-
label="White" onClick={() => handleColorChange("#ffffff")} />
<button type="button" className="customize-color customize-color--gold" aria-
label="Gold" onClick={() => handleColorChange("#c89b3c")} />
</div>
</div>
{selectedDesign && (
<div className="customize-selected-actions">
<span>{selectedDesign === "image" ? "Image selected" : "Text selected"}</span>
<button type="button" onClick={handleDeleteSelected}>Delete</button>
</div>
)}
<div className="customize-panel__actions">
<button type="button" onClick={handleReset}>Reset</button>
</div>
</aside>
<section className="customize-preview">
<div className="customize-preview__top">
<div><span>PREVIEW</span><strong>{mugSize} • {mugColor.replace("-", " ")}</strong></div>
<span className="customize-preview__status">DRAG TO ROTATE</span>
</div>
<div className="customize-product">
<div
className="customize-mug-stage"
onPointerDown={handleMugPointerDown}
onPointerMove={handleMugPointerMove}
onPointerUp={handleMugPointerUp}
onPointerCancel={handleMugPointerUp}
style={mugStyle}
role="application"
aria-label="Drag to rotate your mug"
>
<div className="customize-mug">
<div className="customize-mug__handle" />
<div className="customize-mug__body">
<div className="customize-mug__rim" />
<div className="customize-mug__print">
{!currentImage && !currentText && <span className="customize-
mug__placeholder">YOUR DESIGN</span>}
{currentImage && (
<div
className={`design-object design-image-object ${selectedDesign ===
"image" ? "is-selected" : ""}`}
style={{ left: `${currentImage.x}%`, top: `${currentImage.y}%`,
width: `${currentImage.width}%`, height: `${currentImage.height}%` }}
onPointerDown={(event) => handleDesignPointerDown(event, "image")}
onPointerMove={handleDesignPointerMove}
onPointerUp={handleDesignPointerUp}
onPointerCancel={handleDesignPointerUp}
>
<img src={currentImage.src} alt="Your uploaded design" draggable={
false} />
{selectedDesign === "image" && (
<button type="button" className="resize-handle resize-handle--
corner" aria-label="Resize image" onPointerDown={(event) => handleResizePointerDown(event, "image")} onPointerMove={
handleResizePointerMove} onPointerUp={handleResizePointerUp} onPointerCancel={handleResizePointerUp} />
)}
</div>
)}
{currentText?.value && (
<div
className={`design-object design-text-object ${selectedDesign ===
"text" ? "is-selected" : ""}`}
style={{ left: `${currentText.x}%`, top: `${currentText.y}%`,
fontSize: `${currentText.fontSize}px`, color: currentText.color, fontFamily: currentText.fontFamily }}
onPointerDown={(event) => handleDesignPointerDown(event, "text")}
onPointerMove={handleDesignPointerMove}
onPointerUp={handleDesignPointerUp}
onPointerCancel={handleDesignPointerUp}
>
{currentText.value}
{selectedDesign === "text" && (
<button type="button" className="resize-handle resize-handle--
corner" aria-label="Resize text" onPointerDown={(event) => handleResizePointerDown(event, "text")} onPointerMove={
handleResizePointerMove} onPointerUp={handleResizePointerUp} onPointerCancel={handleResizePointerUp} />
)}
</div>
)}
</div>
</div>
</div>
</div>
</div>
<div className="customize-view-controls">
{(["front", "back"] as MugView[]).map((view) => (
<button key={view} type="button" className={activeView === view ? "is-active" : ""}
onClick={() => handleViewChange(view)}>{view}</button>
))}
<button type="button" onClick={() => setMugRotation(0)}>0°</button>
<button type="button" onClick={() => setMugRotation(90)}>90°</button>
<button type="button" onClick={() => setMugRotation(180)}>180°</button>
<button type="button" onClick={() => setMugRotation(270)}>270°</button>
</div>
<div className="customize-preview__bottom">
<div className="customize-price"><span>PRICE</span><strong>$24.99</strong></div>
<div className="customize-quantity"><span>QTY</span><div><button type="button" onClick={()
=> setQuantity(Math.max(1, quantity - 1))}>−</button><strong>{quantity}</strong><button type="button" onClick={() =>
setQuantity(quantity + 1)}>+</button></div></div>
<button type="button" className="customize-add-cart">Add to Cart <span>→</span></button>
</div>
</section>
</section>
</main>
<Footer />
</>
);
}
export default CustomizePage;