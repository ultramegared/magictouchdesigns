/**
 * Magic Touch Designs - Portfolio Service
 * Dedicated gallery storage. Portfolio items are not products.
 */

import crypto from "crypto";
import { pool } from "../config/database";
import { translateEnglishToSpanish } from "./translation.service";
import { deleteImage } from "./upload.service";

let tableReady: Promise<void> | null = null;

const ensureTable = async (): Promise<void> => {
    if (!tableReady) {
        tableReady = pool.query(`
            CREATE TABLE IF NOT EXISTS portfolio_items (
                portfolio_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                image_url TEXT NOT NULL,
                cloudinary_public_id TEXT,
                title_en TEXT NOT NULL,
                title_es TEXT,
                description_en TEXT,
                description_es TEXT,
                characteristics_en TEXT,
                characteristics_es TEXT,
                translation_source_hash TEXT,
                is_active BOOLEAN NOT NULL DEFAULT TRUE,
                sort_order INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            ALTER TABLE portfolio_items
                ALTER COLUMN cloudinary_public_id DROP NOT NULL;

            CREATE INDEX IF NOT EXISTS portfolio_items_active_order_idx
                ON portfolio_items (is_active, sort_order, created_at DESC);

            INSERT INTO portfolio_items (
                image_url,
                cloudinary_public_id,
                title_en,
                title_es,
                is_active,
                sort_order
            )
            SELECT legacy.image_url,
                   NULL,
                   legacy.title_en,
                   legacy.title_en,
                   TRUE,
                   legacy.sort_order
            FROM (
                VALUES
                    ('/images/portfolio/portfolio-01.jpg', 'Completed Work 01', 1),
                    ('/images/portfolio/portfolio-02.jpg', 'Completed Work 02', 2),
                    ('/images/portfolio/portfolio-03.jpg', 'Completed Work 03', 3),
                    ('/images/portfolio/portfolio-04.jpg', 'Completed Work 04', 4)
            ) AS legacy(image_url, title_en, sort_order)
            WHERE NOT EXISTS (
                SELECT 1
                FROM portfolio_items existing
                WHERE existing.image_url = legacy.image_url
            );
        `).then(() => undefined);
    }
    await tableReady;
};

const translationHash = (text: string): string =>
    crypto.createHash("sha256").update(text).digest("hex");

const translateFields = async (
    title: string,
    description: string | null,
    characteristics: string | null,
    existingHash?: string | null
) => {
    const source = [
        title.trim(),
        description?.trim() || "",
        characteristics?.trim() || "",
    ].join("\n\n");

    const hash = translationHash(source);

    if (existingHash === hash) {
        return null;
    }

    try {
        const translated = await translateEnglishToSpanish(source);
        const parts = translated.translation.split("\n\n");

        return {
            titleEs: parts[0]?.trim() || title,
            descriptionEs: description ? (parts[1]?.trim() || description) : null,
            characteristicsEs: characteristics ? (parts[2]?.trim() || characteristics) : null,
            hash,
        };
    } catch (error) {
        // Translation must never prevent a completed portfolio work from being saved.
        // English remains the safe fallback and can be translated on a later edit.
        console.error("Portfolio translation failed; saving English fallback:", error);
        return {
            titleEs: title,
            descriptionEs: description,
            characteristicsEs: characteristics,
            hash,
        };
    }
};

export const getActivePortfolio = async () => {
    await ensureTable();
    const result = await pool.query(`
        SELECT * FROM portfolio_items
        WHERE is_active = TRUE
        ORDER BY sort_order ASC, created_at DESC;
    `);
    return result.rows;
};

export const getAllPortfolio = async () => {
    await ensureTable();
    const result = await pool.query(`
        SELECT * FROM portfolio_items
        ORDER BY sort_order ASC, created_at DESC;
    `);
    return result.rows;
};

export const createPortfolio = async (data: {
    imageUrl: string;
    publicId: string;
    title: string;
    description?: string | null;
    characteristics?: string | null;
    isActive?: boolean;
    sortOrder?: number;
}) => {
    await ensureTable();

    const title = data.title.trim();
    const description = data.description?.trim() || null;
    const characteristics = data.characteristics?.trim() || null;
    const translation = await translateFields(title, description, characteristics);

    const result = await pool.query(`
        INSERT INTO portfolio_items (
            image_url, cloudinary_public_id,
            title_en, title_es,
            description_en, description_es,
            characteristics_en, characteristics_es,
            translation_source_hash, is_active, sort_order
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        RETURNING *;
    `, [
        data.imageUrl,
        data.publicId,
        title,
        translation?.titleEs || title,
        description,
        translation?.descriptionEs || null,
        characteristics,
        translation?.characteristicsEs || null,
        translation?.hash || translationHash([title, description || "", characteristics || ""].join("\n\n")),
        data.isActive ?? true,
        data.sortOrder ?? 0,
    ]);

    return result.rows[0];
};

export const updatePortfolio = async (
    id: string,
    data: {
        imageUrl?: string;
        publicId?: string;
        title?: string;
        description?: string | null;
        characteristics?: string | null;
        isActive?: boolean;
        sortOrder?: number;
    }
) => {
    await ensureTable();
    const currentResult = await pool.query(
        "SELECT * FROM portfolio_items WHERE portfolio_id = $1",
        [id]
    );
    const current = currentResult.rows[0];
    if (!current) return null;

    const title = data.title !== undefined ? data.title.trim() : current.title_en;
    const description = data.description !== undefined ? (data.description?.trim() || null) : current.description_en;
    const characteristics = data.characteristics !== undefined ? (data.characteristics?.trim() || null) : current.characteristics_en;

    const sourceHash = translationHash([
        title,
        description || "",
        characteristics || "",
    ].join("\n\n"));

    let titleEs = current.title_es;
    let descriptionEs = current.description_es;
    let characteristicsEs = current.characteristics_es;

    if (sourceHash !== current.translation_source_hash) {
        const translation = await translateFields(title, description, characteristics, current.translation_source_hash);
        if (translation) {
            titleEs = translation.titleEs;
            descriptionEs = translation.descriptionEs;
            characteristicsEs = translation.characteristicsEs;
        }
    }

    const result = await pool.query(`
        UPDATE portfolio_items SET
            image_url = $1,
            cloudinary_public_id = $2,
            title_en = $3,
            title_es = $4,
            description_en = $5,
            description_es = $6,
            characteristics_en = $7,
            characteristics_es = $8,
            translation_source_hash = $9,
            is_active = $10,
            sort_order = $11,
            updated_at = NOW()
        WHERE portfolio_id = $12
        RETURNING *;
    `, [
        data.imageUrl ?? current.image_url,
        data.publicId ?? current.cloudinary_public_id,
        title,
        titleEs,
        description,
        descriptionEs,
        characteristics,
        characteristicsEs,
        sourceHash,
        data.isActive ?? current.is_active,
        data.sortOrder ?? current.sort_order,
        id,
    ]);

    if (
        data.publicId &&
        current.cloudinary_public_id &&
        data.publicId !== current.cloudinary_public_id
    ) {
        try {
            await deleteImage(current.cloudinary_public_id);
        } catch (error) {
            console.error("Unable to delete replaced portfolio image:", error);
        }
    }

    return result.rows[0] || null;
};

export const deletePortfolio = async (id: string) => {
    await ensureTable();
    const result = await pool.query(
        "SELECT cloudinary_public_id FROM portfolio_items WHERE portfolio_id = $1",
        [id]
    );
    const item = result.rows[0];
    if (!item) return null;

    if (item.cloudinary_public_id) {
        await deleteImage(item.cloudinary_public_id);
    }

    const deleted = await pool.query(
        "DELETE FROM portfolio_items WHERE portfolio_id = $1 RETURNING portfolio_id",
        [id]
    );

    return deleted.rows[0] || null;
};
