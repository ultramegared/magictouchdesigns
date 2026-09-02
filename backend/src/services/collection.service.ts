/**
 * ================================================================
 * Project: Magic Touch Designs
 * Author: ultramegared
 * File: collection.service.ts
 * Module: Collection Service
 * Language: TypeScript
 * Description:
 * Collection database operations.
 * ================================================================
 */

import {
    pool,
} from "../config/database";


/* ===============================================================
   GET PRODUCTS BY COLLECTION SLUG
================================================================ */

/**
 * Returns all active products
 * assigned to a specific collection.
 */

export const getProductsByCollectionSlug =
    async (
        slug: string
    ) => {

        const result =
            await pool.query(
                `
                SELECT
                    p.product_id,
                    p.name,
                    p.slug,
                    p.description,
                    p.price,
                    p.image_url,
                    p.is_active,
                    p.sort_order,
                    p.features,
                    p.created_at,
                    p.updated_at,

                    cp.sort_order AS collection_sort_order

                FROM collections c

                INNER JOIN collection_products cp
                    ON cp.collection_id = c.id

                INNER JOIN products p
                    ON p.product_id = cp.product_id

                WHERE
                    c.slug = $1

                    AND p.is_active = TRUE

                ORDER BY
                    cp.sort_order ASC,
                    p.created_at DESC
                `,
                [
                    slug,
                ]
            );


        return result.rows;

    };