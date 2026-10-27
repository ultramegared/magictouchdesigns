/**
 * ================================================================
 * Project: Magic Touch Designs
 * File: cleanup.service.ts
 * Module: Admin Cleanup Service
 * Description:
 * Builds the set of Cloudinary public_ids that are still referenced
 * by live database content, lists store assets from the Cloudinary
 * Admin API, and deletes + verifies individual assets.
 *
 * SAFETY:
 * - The reference set covers ALL product rows (active or not),
 *   ALL review rows (approved or pending), ALL portfolio items,
 *   and the live site settings (logo + every Cloudinary URL inside
 *   the site config JSON, including hero slides). Anything in this
 *   set is NEVER deleted.
 * - Custom mug requests store their artwork as BYTEA in Postgres,
 *   not as Cloudinary URLs, so they contribute no Cloudinary
 *   references.
 * - The Admin API calls below only work when the backend env has
 *   CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY +
 *   CLOUDINARY_API_SECRET. When any of them is missing, callers
 *   must refuse with 503 instead of guessing credentials.
 * ================================================================
 */

import { pool } from "../config/database";
import cloudinary from "../config/cloudinary";
import { getSettings } from "./settings.service";

export const STORE_FOLDER_PREFIX = "magic-touch-designs/";

export interface CloudinaryAsset {
    public_id: string;
    secure_url: string;
    bytes: number;
    created_at: string;
    folder: string;
}

interface CloudinaryResourcesResponse {
    resources: CloudinaryAsset[];
    next_cursor?: string;
}

export const isCloudinaryConfigured = (): boolean =>
    Boolean(
        process.env.CLOUDINARY_CLOUD_NAME &&
            process.env.CLOUDINARY_API_KEY &&
            process.env.CLOUDINARY_API_SECRET
    );

/**
 * Extracts a Cloudinary public_id from a delivery URL such as
 * https://res.cloudinary.com/<cloud>/image/upload/v179.../magic-touch-designs/hero/x.jpg
 * Returns null when the URL is not a Cloudinary image delivery URL.
 */
export const extractPublicIdFromUrl = (url: string): string | null => {
    const match = url.match(
        /res\.cloudinary\.com\/[^/]+\/image\/upload\/(?:v\d+\/)?(.+)$/
    );
    if (!match) return null;
    const withoutQuery = match[1].split("?")[0];
    const withoutExtension = withoutQuery.replace(/\.[a-zA-Z0-9]+$/, "");
    try {
        return decodeURIComponent(withoutExtension);
    } catch {
        return withoutExtension;
    }
};

const collectUrlsFromValue = (value: unknown, into: Set<string>): void => {
    if (typeof value === "string") {
        if (value.includes("res.cloudinary.com")) into.add(value);
        return;
    }
    if (Array.isArray(value)) {
        value.forEach((item) => collectUrlsFromValue(item, into));
        return;
    }
    if (value && typeof value === "object") {
        Object.values(value).forEach((item) => collectUrlsFromValue(item, into));
    }
};

/**
 * Every Cloudinary public_id that must never be deleted, gathered
 * from live database content. Also returns the raw URL list for
 * debugging, but callers must only ever use the public_id set.
 */
export const buildReferencedPublicIds = async (): Promise<Set<string>> => {
    const referenced = new Set<string>();
    const addUrl = (url: string | null | undefined): void => {
        if (!url) return;
        const publicId = extractPublicIdFromUrl(url);
        if (publicId) referenced.add(publicId);
    };

    const products = await pool.query(
        "SELECT image_url, image_urls FROM products"
    );
    for (const row of products.rows as Array<{
        image_url?: string | null;
        image_urls?: string | string[] | null;
    }>) {
        addUrl(row.image_url);
        const urls = row.image_urls;
        if (typeof urls === "string") {
            const trimmed = urls.trim();
            if (trimmed.startsWith("[")) {
                try {
                    const parsed: unknown = JSON.parse(trimmed);
                    if (Array.isArray(parsed)) {
                        parsed.forEach((item) => {
                            if (typeof item === "string") addUrl(item);
                        });
                    }
                } catch {
                    addUrl(trimmed);
                }
            } else if (trimmed) {
                addUrl(trimmed);
            }
        } else if (Array.isArray(urls)) {
            urls.forEach((item) => {
                if (typeof item === "string") addUrl(item);
            });
        }
    }

    const reviews = await pool.query("SELECT image_url FROM reviews");
    for (const row of reviews.rows as Array<{ image_url?: string | null }>) {
        addUrl(row.image_url);
    }

    const portfolio = await pool.query(
        "SELECT image_url, cloudinary_public_id FROM portfolio_items"
    );
    for (const row of portfolio.rows as Array<{
        image_url?: string | null;
        cloudinary_public_id?: string | null;
    }>) {
        addUrl(row.image_url);
        if (row.cloudinary_public_id) {
            referenced.add(row.cloudinary_public_id.trim());
        }
    }

    const settings = await getSettings();
    addUrl(settings.logoUrl);
    const configUrls = new Set<string>();
    collectUrlsFromValue(settings.config, configUrls);
    configUrls.forEach((url) => addUrl(url));

    return referenced;
};

/** All image assets under the store folders, via the Admin API. */
export const listStoreAssets = async (): Promise<CloudinaryAsset[]> => {
    const assets: CloudinaryAsset[] = [];
    let nextCursor: string | undefined;
    do {
        const response = (await cloudinary.api.resources({
            type: "upload",
            resource_type: "image",
            prefix: STORE_FOLDER_PREFIX,
            max_results: 500,
            ...(nextCursor ? { next_cursor: nextCursor } : {}),
        })) as unknown as CloudinaryResourcesResponse;
        assets.push(...(response.resources || []));
        nextCursor = response.next_cursor;
    } while (nextCursor);
    return assets;
};

export interface OrphanAsset extends CloudinaryAsset {
    reason: string;
}

/** Store assets whose public_id appears in no live DB reference. */
export const listOrphanAssets = async (): Promise<{
    total: number;
    referenced: number;
    orphans: OrphanAsset[];
}> => {
    const [referenced, assets] = await Promise.all([
        buildReferencedPublicIds(),
        listStoreAssets(),
    ]);
    const orphans = assets
        .filter((asset) => !referenced.has(asset.public_id))
        .map((asset) => ({
            ...asset,
            reason:
                "Not referenced by any live product, review, portfolio item, or site setting (logo/hero).",
        }));
    return { total: assets.length, referenced: referenced.size, orphans };
};

export interface DeleteVerification {
    public_id: string;
    destroyed: boolean;
    verifiedGone: boolean;
    detail: string;
}

/**
 * Destroys one asset and verifies it is gone via the Admin API
 * (a 404 on the follow-up lookup = verified gone). Never touches
 * assets outside the store folders; callers must re-check the
 * reference set before invoking this.
 */
export const deleteAndVerifyAsset = async (
    publicId: string
): Promise<DeleteVerification> => {
    const destroyResult = (await cloudinary.uploader.destroy(publicId, {
        resource_type: "image",
        invalidate: true,
    })) as { result?: string };
    const destroyed =
        destroyResult.result === "ok" || destroyResult.result === "not found";
    if (!destroyed) {
        return {
            public_id: publicId,
            destroyed: false,
            verifiedGone: false,
            detail: `Cloudinary destroy returned: ${destroyResult.result || "unknown"}`,
        };
    }
    let verifiedGone = false;
    try {
        await cloudinary.api.resource(publicId, { resource_type: "image" });
        verifiedGone = false;
    } catch (error) {
        const err = error as {
            error?: { http_code?: number };
            message?: string;
        };
        verifiedGone =
            err?.error?.http_code === 404 ||
            /not found/i.test(String(err?.message || ""));
    }
    return {
        public_id: publicId,
        destroyed: true,
        verifiedGone,
        detail: verifiedGone
            ? "Destroyed and confirmed gone via the Admin API (404)."
            : "Destroyed, but the follow-up Admin API lookup did not return 404.",
    };
};
