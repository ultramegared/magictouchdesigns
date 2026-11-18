/**
 * ================================================================
 * Project: Magic Touch Designs
 * Author: ultramegared
 * File: marketing-image-gen.service.ts
 * Module: Marketing Image Generation Service
 * Language: TypeScript
 * Description:
 * Invents a brand-new ad image for robot proposals via Cloudflare
 * Workers AI (FREE tier: 10,000 neurons/day, FLUX.1-schnell, no card).
 * Owner rule: the robot never reuses an uploaded/catalog photo and
 * never repeats a design — each proposal gets an invented ad.
 * Ad image ONLY: this never creates store products or flat artwork.
 * Env: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN.
 * API verified 2026-11-17 against Cloudflare's official docs:
 * - REST: POST https://api.cloudflare.com/client/v4/accounts/{id}/ai/run/@cf/black-forest-labs/flux-1-schnell
 * - Auth: Authorization: Bearer <token>
 * - Body: { prompt (max 2048 chars), steps (default 4, max 8) };
 *   no width/height parameters exist for this model.
 * - Response: JSON envelope { success, errors, result }; the image
 *   is result.image, a base64-encoded JPEG (1024x1024).
 * - Quota exhausted: HTTP 429, internal code 3036 (Account limited).
 *   Out of capacity: HTTP 429, code 3040 (transient, retry once).
 * Languages: English (en) | Español (es)
 * ================================================================
 */

import { uploadImageAsset } from "./upload.service";

const MODEL_ID = "@cf/black-forest-labs/flux-1-schnell";
const CF_API_BASE = "https://api.cloudflare.com/client/v4";
const FETCH_TIMEOUT_MS = 60_000;
const RETRY_DELAY_MS = 2_000;
const MAX_PROMPT_CHARS = 2048;
// Workers AI internal error codes (developers.cloudflare.com/workers-ai/platform/errors/):
const QUOTA_ERROR_CODE = 3036; // Account limited: daily free neurons used up — never retry.
const CAPACITY_ERROR_CODE = 3040; // Out of capacity: transient — retry once.

export interface InventedAdImageInput {
    productName: string;
    theme?: string;
    season?: string;
}

export interface InventedAdImage {
    imageUrl: string;
    model: string;
}

type SeasonKey = "christmas" | "valentine" | "mothers-day" | "evergreen";

const SEASON_SUBJECTS: Record<SeasonKey, string[]> = {
    christmas: [
        "a red cardinal bird perched on snowy pine branches with golden accents and delicate snowflakes",
        "a cozy snow-covered village with warm glowing windows and a Christmas tree",
        "a gentle reindeer family in a snowy pine forest with soft golden lights",
        "an elegant snowy pine wreath with red berries, gold ornaments and falling snow",
        "a warm cabin window glowing in the snow with a Christmas tree and garlands",
    ],
    valentine: [
        "romantic watercolor roses and soft hearts with warm golden light",
        "two lovebirds on a blossoming branch with soft pink petals",
    ],
    "mothers-day": [
        "soft watercolor tulips and peonies with a tender spring morning light",
        "a delicate bouquet of wildflowers tied with a ribbon",
    ],
    evergreen: [
        "a cheerful watercolor sunflower field under a bright blue sky",
        "a peaceful watercolor mountain lake at sunrise with wildflowers",
        "a cute watercolor garden with butterflies and blooming flowers",
    ],
};

const SEASON_SCENES: Record<SeasonKey, string> = {
    christmas: "on a rustic wooden table in a cozy elegant Christmas scene, soft warm bokeh lights, pine branches and a small wrapped gift beside it",
    valentine: "on a soft linen table with rose petals and warm candlelight, romantic elegant atmosphere",
    "mothers-day": "on a bright table with fresh spring flowers and soft morning light",
    evergreen: "on a bright clean table with soft natural light, fresh and cheerful atmosphere",
};

/** Houston season, mirroring the proposal occasion logic (Christmas from Nov 15). */
const currentSeason = (): SeasonKey => {
    const now = new Date(
        new Date().toLocaleString("en-US", { timeZone: "America/Chicago" }),
    );
    const month = now.getMonth() + 1;
    const day = now.getDate();
    if (month === 12 || (month === 11 && day >= 15)) return "christmas";
    if (month === 2 && day <= 14) return "valentine";
    if (month === 5 && day <= 12) return "mothers-day";
    return "evergreen";
};

const normalizeSeason = (season?: string): SeasonKey => {
    const key = String(season || "").trim().toLowerCase();
    if (key === "christmas" || key === "navidad" || key === "valentine" || key === "mothers-day") {
        return key === "navidad" ? "christmas" : (key as SeasonKey);
    }
    return currentSeason();
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Builds the image prompt. The product name is deliberately NOT fed to
 * the image model: naming the product would steer the model toward
 * copying its existing design, which the owner forbade. The design is
 * invented from the season/theme only. The subject rotates daily so
 * consecutive proposals (3+ days apart) never repeat a design.
 */
const buildAdPrompt = (input: InventedAdImageInput): string => {
    const season = normalizeSeason(input.season);
    const subjects = SEASON_SUBJECTS[season];
    const dayIndex = Math.floor(Date.now() / 86_400_000) % subjects.length;
    const subject = subjects[dayIndex];
    const themeLine = input.theme ? ` Theme: ${String(input.theme).trim()}.` : "";
    const prompt = [
        "Photorealistic professional advertising photo of a BRAND-NEW, never-before-seen personalized ceramic mug design, invented just for this ad:",
        `a white ceramic mug with an elegant realistic watercolor illustration of ${subject}.`,
        "The design is completely original and must not copy any existing product.",
        `The mug sits ${SEASON_SCENES[season]}, large and sharp in the frame.`,
        "No text, no words, no letters anywhere in the image. No prices.",
        themeLine,
    ].join(" ");
    return prompt.slice(0, MAX_PROMPT_CHARS);
};

const errorCodesOf = (payload: any): number[] => {
    const errors = Array.isArray(payload?.errors) ? payload.errors : [];
    return errors
        .map((e: any) => Number(e?.code))
        .filter((code: number) => Number.isFinite(code));
};

const errorMessageOf = (payload: any): string => {
    const errors = Array.isArray(payload?.errors) ? payload.errors : [];
    const first = errors.find((e: any) => typeof e?.message === "string");
    return typeof first?.message === "string"
        ? first.message.replace(/\s+/g, " ").slice(0, 300)
        : "";
};

/**
 * Calls Cloudflare Workers AI once (plus one retry on transient failure).
 * Returns the raw JPEG bytes, or null on any failure. Never throws and
 * never logs the token. Quota exhaustion (3036) is NOT retried: the
 * daily allowance resets at 00:00 UTC, so retrying cannot help.
 */
const callCloudflare = async (
    accountId: string,
    token: string,
    prompt: string,
): Promise<Buffer | null> => {
    for (let attempt = 0; attempt < 2; attempt++) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
        try {
            const response = await fetch(
                `${CF_API_BASE}/accounts/${accountId}/ai/run/${MODEL_ID}`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ prompt, steps: 4 }),
                    signal: controller.signal,
                },
            );
            const payload: any = await response.json().catch(() => ({}));
            if (!response.ok) {
                const codes = errorCodesOf(payload);
                if (codes.includes(QUOTA_ERROR_CODE)) {
                    console.error("[marketing-image-gen] Cloudflare daily free neuron allowance used up (code 3036); resets at 00:00 UTC");
                    return null;
                }
                const transient =
                    (response.status === 429 && codes.includes(CAPACITY_ERROR_CODE)) ||
                    response.status >= 500;
                if (transient && attempt === 0) {
                    await sleep(RETRY_DELAY_MS);
                    continue;
                }
                console.error("[marketing-image-gen] Cloudflare Workers AI request failed", {
                    httpStatus: response.status,
                    codes: codes.length ? codes : ["unknown"],
                    message: errorMessageOf(payload) || "No provider error message returned",
                    model: MODEL_ID,
                });
                return null;
            }
            const base64 = payload?.result?.image;
            if (typeof base64 !== "string" || !base64) {
                console.error("[marketing-image-gen] Cloudflare response had no result.image");
                return null;
            }
            return Buffer.from(base64, "base64");
        } catch (err: any) {
            // Network error or timeout: one retry, then give up quietly.
            if (attempt === 0) {
                await sleep(RETRY_DELAY_MS);
                continue;
            }
            console.error("[marketing-image-gen] Cloudflare request error", {
                message: String(err?.message || err).slice(0, 200),
                model: MODEL_ID,
            });
            return null;
        } finally {
            clearTimeout(timer);
        }
    }
    return null;
};

/**
 * Invents a brand-new ad image for a proposal and uploads it to
 * Cloudinary (magic-touch-designs/generated-ads/). Returns the
 * Cloudinary URL, or null when generation is unavailable (no env
 * vars, quota exhausted, provider error, upload failure). Never
 * throws: the caller skips the proposal when this returns null,
 * so a catalog photo is never offered as a fallback.
 */
export async function generateInventedAdImage(
    input: InventedAdImageInput,
): Promise<InventedAdImage | null> {
    try {
        const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
        const token = process.env.CLOUDFLARE_API_TOKEN?.trim();
        if (!accountId || !token) return null;
        const prompt = buildAdPrompt(input);
        const bytes = await callCloudflare(accountId, token, prompt);
        if (!bytes || bytes.length === 0) return null;
        const asset = await uploadImageAsset(bytes, "generated-ads");
        return { imageUrl: asset.imageUrl, model: MODEL_ID };
    } catch (err: any) {
        console.error("[marketing-image-gen] Invented ad image failed", {
            productName: input.productName,
            message: String(err?.message || err).slice(0, 200),
        });
        return null;
    }
}
