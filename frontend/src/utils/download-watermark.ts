/**
 * Download watermark rules for the Customize studio.
 *
 * Business rule (owner-approved 2026-10-29):
 * - The FIRST download of a given design is free, no watermark.
 * - The SECOND and later downloads of the same design carry a
 *   "PREVIEW · jqydesigns.com" diagonal watermark.
 * - Once the customer pays for an order containing that design, the
 *   watermark is removed (clean downloads again).
 *
 * Phase 1 is client-side only: counters and purchase flags live in
 * localStorage, keyed by a SHA-256 fingerprint of the design artwork.
 * This is a soft deterrent for honest customers, not DRM — it can be
 * bypassed with a fresh browser profile. Server-side tracking is the
 * planned phase 2 if abuse ever appears.
 */

const COUNT_PREFIX = "mtd-dl-count:";
const PURCHASED_PREFIX = "mtd-purchased:";

function simpleHash(value: string): string {
    let h1 = 0x811c9dc5;
    let h2 = 0x01000193;
    for (let i = 0; i < value.length; i += 1) {
        const c = value.charCodeAt(i);
        h1 = Math.imul(h1 ^ c, 16777619);
        h2 = Math.imul(h2 ^ (c + 31), 16777619);
    }
    return `${(h1 >>> 0).toString(16)}${(h2 >>> 0).toString(16)}`;
}

/** Stable fingerprint for one design version (artwork bytes). */
export async function designFingerprint(designUrl: string): Promise<string> {
    try {
        if (typeof crypto !== "undefined" && crypto.subtle) {
            const bytes = new TextEncoder().encode(designUrl);
            const digest = await crypto.subtle.digest("SHA-256", bytes);
            return Array.from(new Uint8Array(digest))
                .map((b) => b.toString(16).padStart(2, "0"))
                .join("")
                .slice(0, 32);
        }
    } catch {
        // Fall through to the non-crypto hash.
    }
    return simpleHash(designUrl);
}

function readNumber(key: string): number {
    try {
        const raw = window.localStorage.getItem(key);
        const n = raw ? parseInt(raw, 10) : 0;
        return Number.isFinite(n) && n > 0 ? n : 0;
    } catch {
        return 0;
    }
}

/** How many times this design fingerprint has been downloaded. */
export function getDownloadCount(fingerprint: string): number {
    return readNumber(`${COUNT_PREFIX}${fingerprint}`);
}

/** Record a download; returns the new total. */
export function recordDownload(fingerprint: string): number {
    const next = getDownloadCount(fingerprint) + 1;
    try {
        window.localStorage.setItem(`${COUNT_PREFIX}${fingerprint}`, String(next));
    } catch {
        // Storage unavailable — the download still proceeds.
    }
    return next;
}

/** True when this design was purchased (watermark lifted). */
export function isDesignPurchased(fingerprint: string): boolean {
    try {
        return window.localStorage.getItem(`${PURCHASED_PREFIX}${fingerprint}`) === "1";
    } catch {
        return false;
    }
}

/** Lift the watermark for this design after a paid order. */
export function markDesignPurchased(fingerprint: string): void {
    try {
        window.localStorage.setItem(`${PURCHASED_PREFIX}${fingerprint}`, "1");
    } catch {
        // Storage unavailable — nothing else to do.
    }
}

/**
 * Paint the diagonal preview watermark over a finished print canvas.
 * Matches the owner-approved mockup: "PREVIEW · jqydesigns.com" repeated
 * diagonally in translucent brand red.
 */
export function drawDownloadWatermark(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const text = "PREVIEW \u00b7 jqydesigns.com  ";
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate((-30 * Math.PI) / 180);
    const fontSize = Math.max(48, Math.round(width / 28));
    ctx.font = `700 ${fontSize}px Arial, Helvetica, sans-serif`;
    ctx.fillStyle = "rgba(198, 40, 40, 0.35)";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    const metrics = ctx.measureText(text);
    const stepX = metrics.width + fontSize * 1.6;
    const stepY = fontSize * 3.4;
    const diag = Math.hypot(width, height);
    for (let y = -diag / 2; y < diag / 2 + stepY; y += stepY) {
        for (let x = -diag / 2; x < diag / 2 + stepX; x += stepX) {
            ctx.fillText(text, x, y);
        }
    }
    ctx.restore();
}
