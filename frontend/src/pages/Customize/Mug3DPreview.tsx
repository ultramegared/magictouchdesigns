/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: Mug3DPreview.tsx
 * Module: Customize
 * Language: TypeScript React
 * Description:
 * Dependency-free interactive mug preview. Uses a responsive Canvas
 * renderer so the editor works reliably on Safari/iPhone without a
 * third-party WebGL CDN. Artwork is projected across a cylindrical
 * surface and follows scale, position, rotation and mug rotation.
 * ================================================================
 */

import { useEffect, useRef } from "react";

type MugStyle = "colored-handle" | "solid";
type MugSize = "11 oz" | "15 oz";

type Mug3DPreviewProps = {
    mugStyle: MugStyle;
    mugSize: MugSize;
    mugBodyColor: string;
    mugAccentColor: string;
    designUrl: string | null;
    designScale: number;
    designX: number;
    designY: number;
    designRotation: number;
    rotation: number;
    onRotationChange: (rotation: number) => void;
};

type DragState = { active: boolean; startX: number; startRotation: number };

const TAU = Math.PI * 2;

function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
}

function hexToRgb(hex: string) {
    const value = hex.replace("#", "");
    const normalized = value.length === 3 ? value.split("").map((part) => part + part).join("") : value;
    const number = Number.parseInt(normalized, 16);
    return {
        r: (number >> 16) & 255,
        g: (number >> 8) & 255,
        b: number & 255,
    };
}

function roundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function drawWrappedArtwork(
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement,
    body: { x: number; y: number; width: number; height: number },
    rotation: number,
    scale: number,
    offsetX: number,
    offsetY: number,
    mugRotation: number,
) {
    const projectedAngle = ((mugRotation % TAU) + TAU) % TAU;
    const centerSource = ((projectedAngle / TAU) * image.width + image.width) % image.width;
    const sourceSpan = image.width * clamp(scale, 0.4, 1.6) * 0.78;
    const sourceLeft = centerSource - sourceSpan / 2 + (offsetX / 100) * image.width;
    const targetHeight = Math.min(body.height * 0.68 * scale, body.height * 0.9);
    const aspect = image.width / Math.max(1, image.height);
    const targetWidth = Math.min(body.width * 0.82 * scale, targetHeight * aspect);
    const centerY = body.y + body.height / 2 - (offsetY / 100) * body.height;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(body.x + 7, body.y + 13);
    ctx.bezierCurveTo(body.x + body.width * 0.08, body.y + 2, body.x + body.width * 0.92, body.y + 2, body.x + body.width - 7, body.y + 13);
    ctx.lineTo(body.x + body.width - 16, body.y + body.height - 13);
    ctx.bezierCurveTo(body.x + body.width * 0.88, body.y + body.height + 4, body.x + body.width * 0.12, body.y + body.height + 4, body.x + 16, body.y + body.height - 13);
    ctx.closePath();
    ctx.clip();

    const columns = 180;
    const start = -Math.PI / 2;
    const end = Math.PI / 2;
    for (let i = 0; i < columns; i += 1) {
        const t0 = i / columns;
        const t1 = (i + 1) / columns;
        const angle0 = start + (end - start) * t0;
        const angle1 = start + (end - start) * t1;
        const mid = (angle0 + angle1) / 2;
        const depth = Math.max(0.08, Math.cos(mid));
        const x = body.x + body.width * t0;
        const width = Math.max(1, body.width * (t1 - t0) * (0.86 + depth * 0.14));
        const sourceT = t0;
        const sx = ((sourceLeft + sourceT * sourceSpan) % image.width + image.width) % image.width;
        const sw = Math.max(1, (sourceSpan / columns) * 1.25);
        const sy = clamp((image.height - targetHeight / Math.max(0.1, scale)) / 2, 0, image.height);
        const sh = Math.min(image.height, targetHeight / Math.max(0.1, scale));

        ctx.save();
        ctx.translate(x + width / 2, centerY);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.globalAlpha = 0.98;
        ctx.drawImage(image, sx, sy, sw, sh, -width / 2, -targetHeight / 2, width, targetHeight);
        ctx.restore();
    }
    ctx.restore();
}

function drawMug(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    props: Mug3DPreviewProps,
    image: HTMLImageElement | null,
) {
    const dpr = window.devicePixelRatio || 1;
    void dpr;
    ctx.clearRect(0, 0, width, height);

    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, "#fbfaf7");
    bg.addColorStop(0.55, "#f3f0eb");
    bg.addColorStop(1, "#e7e1d8");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height * 0.53;
    const mugHeight = Math.min(height * 0.58, width * 0.72) * (props.mugSize === "15 oz" ? 1.08 : 1);
    const mugWidth = mugHeight * 0.93;
    const body = { x: cx - mugWidth / 2, y: cy - mugHeight / 2, width: mugWidth, height: mugHeight };
    const turn = ((props.rotation % TAU) + TAU) % TAU;
    const facing = Math.cos(turn);
    const side = Math.sin(turn);
    const bodyRgb = hexToRgb(props.mugBodyColor);
    const accentRgb = hexToRgb(props.mugAccentColor);

    ctx.save();
    ctx.translate(cx, cy + mugHeight * 0.57);
    ctx.scale(1 + Math.abs(side) * 0.05, 1);
    ctx.filter = "blur(9px)";
    const shadow = ctx.createRadialGradient(0, 0, 8, 0, 0, mugWidth * 0.62);
    shadow.addColorStop(0, "rgba(30,24,20,.28)");
    shadow.addColorStop(1, "rgba(30,24,20,0)");
    ctx.fillStyle = shadow;
    ctx.beginPath();
    ctx.ellipse(0, 0, mugWidth * 0.48, mugHeight * 0.07, 0, 0, TAU);
    ctx.fill();
    ctx.restore();

    const handleVisible = Math.abs(side) < 0.78;
    if (handleVisible) {
        ctx.save();
        const handleX = body.x + body.width * (0.98 + Math.max(0, side) * 0.09);
        const handleScale = 0.72 + Math.abs(facing) * 0.28;
        ctx.strokeStyle = `rgb(${accentRgb.r},${accentRgb.g},${accentRgb.b})`;
        ctx.lineWidth = Math.max(16, mugWidth * 0.105 * handleScale);
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.arc(handleX, cy, mugHeight * 0.22 * handleScale, -Math.PI / 2, Math.PI / 2);
        ctx.stroke();
        ctx.strokeStyle = "rgba(255,255,255,.26)";
        ctx.lineWidth = Math.max(4, mugWidth * 0.022);
        ctx.beginPath();
        ctx.arc(handleX - 2, cy - 1, mugHeight * 0.22 * handleScale, -Math.PI / 2, Math.PI / 2);
        ctx.stroke();
        ctx.restore();
    }

    ctx.save();
    const mugGradient = ctx.createLinearGradient(body.x, 0, body.x + body.width, 0);
    mugGradient.addColorStop(0, `rgb(${Math.max(0, bodyRgb.r - 24)},${Math.max(0, bodyRgb.g - 24)},${Math.max(0, bodyRgb.b - 24)})`);
    mugGradient.addColorStop(0.18, `rgb(${Math.min(255, bodyRgb.r + 8)},${Math.min(255, bodyRgb.g + 8)},${Math.min(255, bodyRgb.b + 8)})`);
    mugGradient.addColorStop(0.5, `rgb(${bodyRgb.r},${bodyRgb.g},${bodyRgb.b})`);
    mugGradient.addColorStop(0.82, `rgb(${Math.max(0, bodyRgb.r - 12)},${Math.max(0, bodyRgb.g - 12)},${Math.max(0, bodyRgb.b - 12)})`);
    mugGradient.addColorStop(1, `rgb(${Math.max(0, bodyRgb.r - 34)},${Math.max(0, bodyRgb.g - 34)},${Math.max(0, bodyRgb.b - 34)})`);
    ctx.fillStyle = mugGradient;
    ctx.beginPath();
    ctx.moveTo(body.x + body.width * 0.05, body.y + 16);
    ctx.quadraticCurveTo(body.x + body.width * 0.5, body.y - 2, body.x + body.width * 0.95, body.y + 16);
    ctx.lineTo(body.x + body.width * 0.89, body.y + body.height - 15);
    ctx.quadraticCurveTo(body.x + body.width * 0.5, body.y + body.height + 3, body.x + body.width * 0.11, body.y + body.height - 15);
    ctx.closePath();
    ctx.fill();

    if (image) drawWrappedArtwork(ctx, image, body, props.designRotation, props.designScale, props.designX, props.designY, props.rotation);

    const sheen = ctx.createLinearGradient(body.x, 0, body.x + body.width, 0);
    sheen.addColorStop(0, "rgba(0,0,0,.20)");
    sheen.addColorStop(0.14, "rgba(255,255,255,.26)");
    sheen.addColorStop(0.34, "rgba(255,255,255,.06)");
    sheen.addColorStop(0.72, "rgba(0,0,0,.04)");
    sheen.addColorStop(1, "rgba(0,0,0,.18)");
    ctx.fillStyle = sheen;
    ctx.beginPath();
    ctx.moveTo(body.x + body.width * 0.05, body.y + 16);
    ctx.quadraticCurveTo(body.x + body.width * 0.5, body.y - 2, body.x + body.width * 0.95, body.y + 16);
    ctx.lineTo(body.x + body.width * 0.89, body.y + body.height - 15);
    ctx.quadraticCurveTo(body.x + body.width * 0.5, body.y + body.height + 3, body.x + body.width * 0.11, body.y + body.height - 15);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = `rgb(${accentRgb.r},${accentRgb.g},${accentRgb.b})`;
    ctx.beginPath();
    ctx.ellipse(cx, body.y + 14, body.width * 0.47, body.width * 0.09, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = `rgb(${Math.max(0, bodyRgb.r - 15)},${Math.max(0, bodyRgb.g - 15)},${Math.max(0, bodyRgb.b - 15)})`;
    ctx.beginPath();
    ctx.ellipse(cx, body.y + 13, body.width * 0.40, body.width * 0.058, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.88)";
    ctx.beginPath();
    ctx.ellipse(cx, body.y + 10, body.width * 0.31, body.width * 0.035, 0, 0, TAU);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,.72)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(body.x + 15, body.y + 25);
    ctx.quadraticCurveTo(body.x + body.width * 0.5, body.y + 9, body.x + body.width - 15, body.y + 25);
    ctx.stroke();
    ctx.restore();

    const angleText = Math.round((((props.rotation % TAU) + TAU) % TAU) * 180 / Math.PI);
    ctx.save();
    ctx.fillStyle = "rgba(72,56,38,.72)";
    ctx.font = "600 11px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${angleText}° · LIVE PRODUCT PREVIEW`, cx, height - 28);
    ctx.restore();
}

function Mug3DPreview(props: Mug3DPreviewProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);
    const rotationRef = useRef(props.rotation);
    const dragRef = useRef<DragState>({ active: false, startX: 0, startRotation: props.rotation });
    const zoomRef = useRef(1);

    useEffect(() => {
        rotationRef.current = props.rotation;
    }, [props.rotation]);

    useEffect(() => {
        const image = new Image();
        image.onload = () => { imageRef.current = image; render(); };
        image.onerror = () => { imageRef.current = null; render(); };
        if (props.designUrl) image.src = props.designUrl;
        else { imageRef.current = null; render(); }
        return () => { image.onload = null; image.onerror = null; };
    }, [props.designUrl]);

    const render = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const width = Math.max(1, rect.width);
        const height = Math.max(1, rect.height);
        const pixelWidth = Math.round(width * dpr);
        const pixelHeight = Math.round(height * dpr);
        if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
            canvas.width = pixelWidth;
            canvas.height = pixelHeight;
        }
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.setTransform(dpr * zoomRef.current, 0, 0, dpr * zoomRef.current, width * dpr / 2 * (1 - zoomRef.current), height * dpr / 2 * (1 - zoomRef.current));
        drawMug(ctx, width, height, { ...props, rotation: rotationRef.current }, imageRef.current);
    };

    useEffect(() => {
        render();
        const observer = new ResizeObserver(render);
        if (canvasRef.current) observer.observe(canvasRef.current);
        return () => observer.disconnect();
    }, [props.mugStyle, props.mugSize, props.mugBodyColor, props.mugAccentColor, props.designScale, props.designX, props.designY, props.designRotation, props.designUrl, props.rotation]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const onPointerDown = (event: PointerEvent) => {
            dragRef.current = { active: true, startX: event.clientX, startRotation: rotationRef.current };
            canvas.setPointerCapture?.(event.pointerId);
            canvas.style.cursor = "grabbing";
        };
        const onPointerMove = (event: PointerEvent) => {
            if (!dragRef.current.active) return;
            const next = dragRef.current.startRotation + (event.clientX - dragRef.current.startX) * 0.012;
            rotationRef.current = next;
            props.onRotationChange(next);
            render();
        };
        const onPointerUp = () => {
            dragRef.current.active = false;
            canvas.style.cursor = "grab";
        };
        const onWheel = (event: WheelEvent) => {
            event.preventDefault();
            zoomRef.current = clamp(zoomRef.current + (event.deltaY > 0 ? -0.08 : 0.08), 0.88, 1.18);
            render();
        };
        canvas.addEventListener("pointerdown", onPointerDown);
        canvas.addEventListener("pointermove", onPointerMove);
        canvas.addEventListener("pointerup", onPointerUp);
        canvas.addEventListener("pointercancel", onPointerUp);
        canvas.addEventListener("wheel", onWheel, { passive: false });
        canvas.style.touchAction = "none";
        canvas.style.cursor = "grab";
        return () => {
            canvas.removeEventListener("pointerdown", onPointerDown);
            canvas.removeEventListener("pointermove", onPointerMove);
            canvas.removeEventListener("pointerup", onPointerUp);
            canvas.removeEventListener("pointercancel", onPointerUp);
            canvas.removeEventListener("wheel", onWheel);
        };
    }, [props.onRotationChange]);

    return (
        <div className="mug-3d-preview">
            <div className="mug-3d-preview__topbar">
                <span className="mug-3d-preview__badge"><span className="mug-3d-preview__live-dot" /> LIVE 3D PREVIEW</span>
                <span className="mug-3d-preview__size">{props.mugSize} · {props.mugStyle === "solid" ? "Solid" : "Colored Handle"}</span>
            </div>
            <canvas ref={canvasRef} className="mug-3d-preview__canvas" aria-label="Interactive custom mug preview" />
            {!props.designUrl && <div className="mug-3d-preview__empty"><strong>Your artwork will appear here</strong><span>Upload an image to see your custom mug come to life.</span></div>}
            <div className="mug-3d-preview__hint"><span>↔</span> Drag to rotate · Scroll/pinch to zoom · Inspect every side</div>
        </div>
    );
}

export default Mug3DPreview;
