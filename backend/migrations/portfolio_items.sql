-- Magic Touch Designs
-- Dedicated portfolio gallery table. Not a product/catalog table.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

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

-- Existing gallery images are website assets, not Cloudinary assets.
-- Import them into portfolio records so the Admin panel can manage them.
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
