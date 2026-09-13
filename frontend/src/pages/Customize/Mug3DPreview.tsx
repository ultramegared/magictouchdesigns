/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: Mug3DPreview.tsx
 * Module: Customize
 * Language: TypeScript React
 * Description:
 * Dependency-free interactive mug preview using Canvas.
 *
 * Artwork is mapped across the full 180° printable front arc:
 * handle-to-handle. The artwork remains centered on the printable
 * surface while the mug rotates, with cylindrical perspective and
 * stronger edge shading.
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

type DragState = {
    active: boolean;
    startX: number;
    startRotation: number;
};

type Rgb = { r: number; g: number; b: number };

const TAU = Math.PI * 2;
const PRINT_ARC = Math.PI;
const PRINT_START = -Math.PI / 2;
const clamp = (value: number, min: number, max: number) =>
    Math.max(min, Math.min(max, value));

function hexToRgb(hex: string): Rgb {
    const value = hex.replace("#", "").trim();
    const normalized = value.length === 3
        ? value.split("").map((part) => part + part).join("")
        : value;
    const parsed = Number.parseInt(normalized, 16);
    return {
        r: (parsed >> 16) & 255,
        g: (parsed >> 8) & 255,
        b: parsed & 255,
    };
}

function normalizeAngle(angle: number) {
    let value = angle % TAU;
    if (value <= -Math.PI) value += TAU;
    if (value > Math.PI) value -= TAU;
    return value;
}

function mugPath(ctx: CanvasRenderingContext2D, body: { x: number; y: number; width: number; height: number }) {
    ctx.beginPath();
    ctx.moveTo(body.x + body.width * 0.045, body.y + 15);
    ctx.quadraticCurveTo(body.x + body.width * 0.5, body.y - 3, body.x + body.width * 0.955, body.y + 15);
    ctx.lineTo(body.x + body.width * 0.89, body.y + body.height - 15);
    ctx.quadraticCurveTo(body.x + body.width * 0.5, body.y + body.height + 3, body.x + body.width * 0.11, body.y + body.height - 15);
    ctx.closePath();
}

function createPrintTexture(image: HTMLImageElement, designScale: number, designX: number, designY: number, designRotation: number) {
    const textureWidth = 2048;
    const textureHeight = 900;
    const texture = document.createElement("canvas");
    texture.width = textureWidth;
    texture.height = textureHeight;
    const tctx = texture.getContext("2d");
    if (!tctx) return texture;

    const scale = clamp(designScale, 0.55, 1.55);
    const aspect = image.width / Math.max(1, image.height);
    const maxArtworkWidth = textureWidth * 0.99;
    const maxArtworkHeight = textureHeight * 0.88;
    let artworkHeight = maxArtworkHeight * scale;
    let artworkWidth = artworkHeight * aspect;
    if (artworkWidth > maxArtworkWidth) {
        artworkWidth = maxArtworkWidth;
        artworkHeight = artworkWidth / Math.max(aspect, 0.01);
    }
    artworkHeight = Math.min(artworkHeight, textureHeight * 0.96);

    const centerX = textureWidth * 0.5 + (designX / 100) * textureWidth * 0.24;
    const centerY = textureHeight * 0.5 - (designY / 100) * textureHeight * 0.24;
    tctx.clearRect(0, 0, textureWidth, textureHeight);
    tctx.save();
    tctx.translate(centerX, centerY);
    tctx.rotate((designRotation * Math.PI) / 180);
    tctx.imageSmoothingEnabled = true;
    tctx.drawImage(image, -artworkWidth / 2, -artworkHeight / 2, artworkWidth, artworkHeight);
    tctx.restore();
    return texture;
}

function drawArtworkOnMug(ctx: CanvasRenderingContext2D, image: HTMLImageElement, body: { x: number; y: number; width: number; height: number }, designScale: number, designX: number, designY: number, designRotation: number, mugRotation: number) {
    const texture = createPrintTexture(image, designScale, designX, designY, designRotation);
    ctx.save();
    mugPath(ctx, body);
    ctx.clip();

    const centerX = body.x + body.width * 0.5;
    const radius = body.width * 0.5;
    const columns = Math.max(420, Math.round(body.width * 2.6));

    for (let i = 0; i < columns; i += 1) {
        const u0 = i / columns;
        const u1 = (i + 1) / columns;
        const localA0 = PRINT_START + u0 * PRINT_ARC;
        const localA1 = PRINT_START + u1 * PRINT_ARC;
        const localMid = (localA0 + localA1) * 0.5;
        const cameraA0 = normalizeAngle(localA0 + mugRotation);
        const cameraA1 = normalizeAngle(localA1 + mugRotation);
        const cameraMid = normalizeAngle(localMid + mugRotation);
        const depth = Math.cos(cameraMid);
        if (depth <= 0.015) continue;

        const x0 = centerX + Math.sin(cameraA0) * radius;
        const x1 = centerX + Math.sin(cameraA1) * radius;
        const left = Math.min(x0, x1);
        const projectedWidth = Math.max(0.5, Math.abs(x1 - x0) + 0.55);
        const sourceX = u0 * texture.width;
        const sourceWidth = Math.max(2, (u1 - u0) * texture.width + 1.25);
        const shade = 0.68 + clamp(depth, 0, 1) * 0.32;

        ctx.save();
        ctx.globalAlpha = shade;
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(texture, sourceX, 0, sourceWidth, texture.height, left, body.y, projectedWidth, body.height);
        ctx.restore();
    }
    ctx.restore();
}

function drawMug(ctx: CanvasRenderingContext2D, width: number, height: number, props: Mug3DPreviewProps, image: HTMLImageElement | null) {
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
    const turn = normalizeAngle(props.rotation);
    const bodyRgb = hexToRgb(props.mugBodyColor);
    const accentRgb = hexToRgb(props.mugAccentColor);

    ctx.save();
    ctx.translate(cx, cy + mugHeight * 0.57);
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
    const mugGradient = ctx.createLinearGradient(body.x, 0, body.x + body.width, 0);
    mugGradient.addColorStop(0, `rgb(${Math.max(0, bodyRgb.r - 24)},${Math.max(0, bodyRgb.g - 24)},${Math.max(0, bodyRgb.b - 24)})`);
    mugGradient.addColorStop(0.2, `rgb(${Math.min(255, bodyRgb.r + 8)},${Math.min(255, bodyRgb.g + 8)},${Math.min(255, bodyRgb.b + 8)})`);
    mugGradient.addColorStop(0.5, `rgb(${bodyRgb.r},${bodyRgb.g},${bodyRgb.b})`);
    mugGradient.addColorStop(0.82, `rgb(${Math.max(0, bodyRgb.r - 12)},${Math.max(0, bodyRgb.g - 12)},${Math.max(0, bodyRgb.b - 12)})`);
    mugGradient.addColorStop(1, `rgb(${Math.max(0, bodyRgb.r - 34)},${Math.max(0, bodyRgb.g - 34)},${Math.max(0, bodyRgb.b - 34)})`);
    ctx.fillStyle = mugGradient;
    mugPath(ctx, body);
    ctx.fill();
    ctx.restore();

    if (image) drawArtworkOnMug(ctx, image, body, props.designScale, props.designX, props.designY, props.designRotation, turn);

    ctx.save();
    const sheen = ctx.createLinearGradient(body.x, 0, body.x + body.width, 0);
    sheen.addColorStop(0, "rgba(0,0,0,.18)");
    sheen.addColorStop(0.13, "rgba(255,255,255,.24)");
    sheen.addColorStop(0.34, "rgba(255,255,255,.08)");
    sheen.addColorStop(0.7, "rgba(0,0,0,.035)");
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
    ctx.ellipse(cx, body.y + 13, body.width * 0.4, body.width * 0.058, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.9)";
    ctx.beginPath();
    ctx.ellipse(cx, body.y + 10, body.width * 0.31, body.width * 0.035, 0, 0, TAU);
    ctx.fill();
    ctx.restore();

    // Draw the handle after the body/print so the artwork can never cover its junction.
    const side = Math.sin(turn);
    const facing = Math.cos(turn);
    const handleScale = 0.68 + Math.abs(facing) * 0.32;
    const handleX = body.x + body.width * (0.99 + Math.max(0, side) * 0.08);
    ctx.save();
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

    const angleText = Math.round((((turn + TAU) % TAU) * 180) / Math.PI) % 360;
    ctx.save();
    ctx.fillStyle = "rgba(72,56,38,.72)";
    ctx.font = "600 11px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${angleText}° · HANDLE-TO-HANDLE PRINT`, cx, height - 28);
    ctx.restore();
}

function Mug3DPreview(props: Mug3DPreviewProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);
    const rotationRef = useRef(props.rotation);
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
        drawMug(ctx, width, height, { ...props, rotation: rotationRef.current }, imageRef.current);
    };

    useEffect(() => {
        rotationRef.current = props.rotation;
        render();
    }, [props.rotation]);

    useEffect(() => {
        const image = new Image();
        image.onload = () => { imageRef.current = image; render(); };
        image.onerror = () => { imageRef.current = null; render(); };
        if (props.designUrl) image.src = props.designUrl;
        else { imageRef.current = null; render(); }
        return () => { image.onload = null; image.onerror = null; };
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
        const stopDragging = () => { dragRef.current.active = false; canvas.style.cursor = "grab"; };
        const onWheel = (event: WheelEvent) => { event.preventDefault(); };
        canvas.addEventListener("pointerdown", onPointerDown);
        canvas.addEventListener("pointermove", onPointerMove);
        canvas.addEventListener("pointerup", stopDragging);
        canvas.addEventListener("pointercancel", stopDragging);
        canvas.addEventListener("wheel", onWheel, { passive: false });
        return () => {
            canvas.removeEventListener("pointerdown", onPointerDown);
            canvas.removeEventListener("pointermove", onPointerMove);
            canvas.removeEventListener("pointerup", stopDragging);
            canvas.removeEventListener("pointercancel", stopDragging);
            canvas.removeEventListener("wheel", onWheel);
        };
    });

    return (
        <div className="mug-3d-preview" role="img" aria-label="3D mug preview">
            <canvas ref={canvasRef} className="mug-3d-preview__canvas" />
            <div className="mug-3d-preview__badge">LIVE 3D PREVIEW</div>
            <div className="mug-3d-preview__size">
                {props.mugSize} · {props.mugStyle === "colored-handle" ? "Colored Handle" : "Solid"}
            </div>
            <div className="mug-3d-preview__hint">↔ Drag to rotate · Scroll/pinch to zoom · Inspect every side</div>
        </div>
    );
}

export default Mug3DPreview;
