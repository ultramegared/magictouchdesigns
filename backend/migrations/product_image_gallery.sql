-- Product gallery: up to 3 images per product.
-- image_url remains the primary/legacy image for existing consumers.
ALTER TABLE products
ADD COLUMN IF NOT EXISTS image_urls JSONB NOT NULL DEFAULT '[]'::jsonb;

UPDATE products
SET image_urls = jsonb_build_array(image_url)
WHERE image_url IS NOT NULL
  AND NULLIF(BTRIM(image_url), '') IS NOT NULL
  AND (image_urls = '[]'::jsonb OR image_urls IS NULL);
