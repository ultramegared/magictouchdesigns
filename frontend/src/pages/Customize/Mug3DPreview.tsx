/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: Mug3DPreview.tsx
 * Module: Customize
 * Language: TypeScript React
 * Description:
 * Stable Canvas-based interactive mug preview. The artwork is mapped
 * to a cylindrical surface with perspective-aware columns so it stays
 * attached to the mug while rotating on desktop and mobile.
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
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function hexToRgb(hex: string) {
    const value = hex.replace("#", "");
    const normalized = value.length === 3 ? value.split("").map((part) => part + part).join("") : value;
    const parsed = Number.parseInt(normalized, 16);
    return {
        r: (parsed >> 16) & 255,
        g: (parsed >> 8) & 255,
        b: parsed & 255,
    };
}

function mugPath(ctx: CanvasRenderingContext2D, body: { x: number; y: number; width: number; height: number }) {
    ctx.beginPath();
    ctx.moveTo(body.x + body.width * 0.045, body.y + 15);
    ctx.quadraticCurveTo(body.x + body.width * 0.5, body.y - 3, body.x + body.width * 0.955, body.y + 15);
    ctx.lineTo(body.x + body.width * 0.89, body.y + body.height - 15);
    ctx.quadraticCurveTo(body.x + body.width * 0.5, body.y + body.height + 3, body.x + body.width * 0.11, body.y + body.height - 15);
    ctx.closePath();
}

function drawArtworkOnCylinder(
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement,
    body: { x: number; y: number; width: number; height: number },
    designScale: number,
    designX: number,
    designY: number,
    designRotation: number,
    mugRotation: number,
) {
    const scale = clamp(designScale, 0.55, 1.55);
    const texture = document.createElement("canvas");
    const textureWidth = 720;
    const textureHeight = 720;
    texture.width = textureWidth;
    texture.height = textureHeight;
    const tctx = texture.getContext("2d");
    if (!tctx) return;

    const imageAspect = image.width / Math.max(1, image.height);
    const baseHeight = textureHeight * 0.70 * scale;
    const baseWidth = Math.min(textureWidth * 0.76 * scale, baseHeight * imageAspect);
    const centerX = textureWidth / 2 + (designX / 100) * textureWidth * 0.34;
    const centerY = textureHeight / 2 - (designY / 100) * textureHeight * 0.34;

    tctx.save();
    tctx.translate(centerX, centerY);
    tctx.rotate((designRotation * Math.PI) / 180);
    tctx.drawImage(image, -baseWidth / 2, -baseHeight / 2, baseWidth, baseHeight);
    tctx.restore();

    ctx.save();
    mugPath(ctx, body);
    ctx.clip();

    const columns = Math.max(140, Math.round(body.width * 0.95));
    const radius = body.width * 0.50;
    const center = body.x + body.width / 2;
    const halfAngle = Math.PI * 0.5;
    const turn = ((mugRotation % TAU) + TAU) % TAU;
    const textureOffset = (turn / TAU) * textureWidth;

    for (let i = 0; i < columns; i += 1) {
        const a0 = -halfAngle + (i / columns) * Math.PI;
        const a1 = -halfAngle + ((i + 1) / columns) * Math.PI;
        const mid = (a0 + a1) / 2;
        const x0 = center + Math.sin(a0) * radius;
        const x1 = center + Math.sin(a1) * radius;
        const projectedWidth = Math.max(0.55, Math.abs(x1 - x0) + 0.8);
        const x = Math.min(x0, x1);
        const sourceX = (((textureOffset + ((mid + halfAngle) / Math.PI) * textureWidth) % textureWidth) + textureWidth) % textureWidth;
        const sourceWidth = Math.max(1.5, textureWidth / columns * 1.8);
        const depth = Math.max(0.06, Math.cos(mid));
        const shade = 0.74 + depth * 0.26;

        ctx.save();
        ctx.globalAlpha = shade;
        ctx.drawImage(texture, sourceX, 0, sourceWidth, textureHeight, x, body.y, projectedWidth, body.height);
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
    zoom: number,
) {
    ctx.clearRect(0, 0, width, height);

    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, "#fbfaf7");
    bg.addColorStop(0.56, "#f3f0eb");
    bg.addColorStop(1, "#e7e1d8");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height * 0.53;
    const mugHeight = Math.min(height * 0.58, width * 0.72) * (props.mugSize === "15 oz" ? 1.08 : 1);
    const mugWidth = mugHeight * 0.93;
    const body = { x: cx - mugWidth / 2, y: cy - mugHeight / 2, width: mugWidth, height: mugHeight };
    const turn = ((props.rotation % TAU) + TAU) % TAU;
    const side = Math.sin(turn);
    const bodyRgb = hexToRgb(props.mugBodyColor);
    const accentRgb = hexToRgb(props.mugAccentColor);

    ctx.save();
    ctx.translate(cx, cy + mugHeight * 0.57);
    ctx.scale(1 + Math.abs(side) * 0.06, 1);
    ctx.filter = "blur(9px)";
    const shadow = ctx.createRadialGradient(0, 0, 8, 0, 0, mugWidth * 0.62);
    shadow.addColorStop(0, "rgba(30,24,20,.28)");
    shadow.addColorStop(1, "rgba(30,24,20,0)");
    ctx.fillStyle = shadow;
    ctx.beginPath();
    ctx.ellipse(0, 0, mugWidth * 0.48, mugHeight * 0.07, 0, 0, TAU);
    ctx.fill();
    ctx.restore();

    ctx.save();
    const handleScale = 0.72 + Math.abs(Math.cos(turn)) * 0.28;
    const handleX = body.x + body.width * (0.985 + Math.max(0, side) * 0.07);
    ctx.strokeStyle = `rgb(${accentRgb.r},${accentRgb.g},${accentRgb.b})`;
    ctx.lineWidth = Math.max(16, mugWidth * 0.105 * handleScale);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(handleX, cy, mugHeight * 0.22 * handleScale, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,.28)";
    ctx.lineWidth = Math.max(4, mugWidth * 0.022);
    ctx.beginPath();
    ctx.arc(handleX - 2, cy - 1, mugHeight * 0.22 * handleScale, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    const mugGradient = ctx.createLinearGradient(body.x, 0, body.x + body.width, 0);
    mugGradient.addColorStop(0, `rgb(${Math.max(0, bodyRgb.r - 24)},${Math.max(0, bodyRgb.g - 24)},${Math.max(0, bodyRgb.b - 24)})`);
    mugGradient.addColorStop(0.18, `rgb(${Math.min(255, bodyRgb.r + 8)},${Math.min(255, bodyRgb.g + 8)},${Math.min(255, bodyRgb.b + 8)})`);
    mugGradient.addColorStop(0.50, `rgb(${bodyRgb.r},${bodyRgb.g},${bodyRgb.b})`);
    mugGradient.addColorStop(0.82, `rgb(${Math.max(0, bodyRgb.r - 12)},${Math.max(0, bodyRgb.g - 12)},${Math.max(0, bodyRgb.b - 12)})`);
    mugGradient.addColorStop(1, `rgb(${Math.max(0, bodyRgb.r - 34)},${Math.max(0, bodyRgb.g - 34)},${Math.max(0, bodyRgb.b - 34)})`);
    ctx.fillStyle = mugGradient;
    mugPath(ctx, body);
    ctx.fill();
    ctx.restore();

    if (image) {
        drawArtworkOnCylinder(ctx, image, body, props.designScale, props.designX, props.designY, props.designRotation, props.rotation);
    }

    ctx.save();
    const sheen = ctx.createLinearGradient(body.x, 0, body.x + body.width, 0);
    sheen.addColorStop(0, "rgba(0,0,0,.18)");
    sheen.addColorStop(0.13, "rgba(255,255,255,.24)");
    sheen.addColorStop(0.33, "rgba(255,255,255,.07)");
    sheen.addColorStop(0.72, "rgba(0,0,0,.035)");
    sheen.addColorStop(1, "rgba(0,0,0,.18)");
    ctx.fillStyle = sheen;
    mugPath(ctx, body);
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
    ctx.fillStyle = "rgba(255,255,255,.90)";
    ctx.beginPath();
    ctx.ellipse(cx, body.y + 10, body.width * 0.31, body.width * 0.035, 0, 0, TAU);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,.68)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(body.x + 15, body.y + 25);
    ctx.quadraticCurveTo(body.x + body.width * 0.5, body.y + 9, body.x + body.width - 15, body.y + 25);
    ctx.stroke();
    ctx.restore();

    const angleText = Math.round((turn * 180) / Math.PI);
    ctx.save();
    ctx.fillStyle = "rgba(72,56,38,.72)";
    ctx.font = "600 11px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${angleText}° · LIVE PRODUCT PREVIEW`, cx, height - 28);
    ctx.restore();
    void zoom;
}

function Mug3DPreview(props: Mug3DPreviewProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);
    const rotationRef = useRef(props.rotation);
    const zoomRef = useRef(1);
    const dragRef = useRef<DragState>({ active: false, startX: 0, startRotation: props.rotation });

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
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        drawMug(ctx, width, height, { ...props, rotation: rotationRef.current }, imageRef.current, zoomRef.current);
    };

    useEffect(() => {
        rotationRef.current = props.rotation;
        render();
    }, [props.rotation]);

    useEffect(() => {
        const image = new Image();
        image.onload = () => {
            imageRef.current = image;
            render();
        };
        image.onerror = () => {
            imageRef.current = null;
            render();
        };
        if (props.designUrl) image.src = props.designUrl;
        else {
            imageRef.current = null;
            render();
        }
        return () => {
            image.onload = null;
            image.onerror = null;
        };
    }, [props.designUrl]);

    useEffect(() => {
        render();
        const observer = new ResizeObserver(render);
        if (canvasRef.current) observer.observe(canvasRef.current);
        return () => observer.disconnect();
    }, [props.mugStyle, props.mugSize, props.mugBodyColor, props.mugAccentColor, props.designScale, props.designX, props.designY, props.designRotation, props.designUrl]);

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
            zoomRef.current = clamp(zoomRef.current + (event.deltaY > 0 ? -0.08 : 0.08), 0.90, 1.14);
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
