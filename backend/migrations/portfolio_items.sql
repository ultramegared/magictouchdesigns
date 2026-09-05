-- Magic Touch Designs
-- Dedicated portfolio gallery table. Not a product/catalog table.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS portfolio_items (
    portfolio_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_url TEXT NOT NULL,
    cloudinary_public_id TEXT NOT NULL,
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

CREATE INDEX IF NOT EXISTS portfolio_items_active_order_idx
    ON portfolio_items (is_active, sort_order, created_at DESC);
