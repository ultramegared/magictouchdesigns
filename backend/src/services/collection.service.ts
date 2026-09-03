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
   TYPES
================================================================ */

interface UpdateCollectionProductData {

    name?: string;

    slug?: string;

    description?: string;

    price?: number;

    image_url?: string;

    features?: string[];

}


/* ===============================================================
   GET PRODUCTS BY COLLECTION SLUG
================================================================ */

/**
 * Returns all active products
 * assigned to a specific collection.
 *
 * Public use.
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


/* ===============================================================
   GET COLLECTION PRODUCTS FOR ADMIN
================================================================ */

/**
 * Returns all products assigned
 * to a specific collection.
 *
 * Includes active and inactive products.
 *
 * Administrator use only.
 */

export const getCollectionProductsForAdmin =
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


/* ===============================================================
   GET COLLECTION PRODUCT FOR ADMIN
================================================================ */

/**
 * Returns one specific product
 * only if it belongs to the
 * requested collection.
 *
 * Administrator use only.
 */

export const getCollectionProductForAdmin =
    async (
        collectionSlug: string,
        productId: string
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

                    AND p.product_id = $2

                LIMIT 1
                `,
                [
                    collectionSlug,
                    productId,
                ]
            );


        return result.rows[
            0
        ]
        || null;

    };


/* ===============================================================
   GET AVAILABLE PRODUCTS FOR COLLECTION
================================================================ */

/**
 * Returns products that are
 * not currently assigned to
 * the requested collection.
 *
 * Administrator use only.
 */

export const getAvailableProductsForCollection =
    async (
        collectionSlug: string
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
                    p.updated_at

                FROM products p

                WHERE
                    NOT EXISTS (

                        SELECT
                            1

                        FROM collection_products cp

                        INNER JOIN collections c
                            ON c.id =
                            cp.collection_id

                        WHERE
                            c.slug = $1

                            AND cp.product_id =
                            p.product_id

                    )

                ORDER BY
                    p.created_at DESC
                `,
                [
                    collectionSlug,
                ]
            );


        return result.rows;

    };


/* ===============================================================
   ADD PRODUCT TO COLLECTION
================================================================ */

/**
 * Assigns an existing product
 * to a collection.
 *
 * The product receives the
 * next available display order.
 *
 * Administrator use only.
 */

export const addProductToCollection =
    async (
        collectionSlug: string,
        productId: string
    ) => {

        const collectionResult =
            await pool.query(
                `
                SELECT
                    id

                FROM collections

                WHERE
                    slug = $1

                LIMIT 1
                `,
                [
                    collectionSlug,
                ]
            );


        const collection =
            collectionResult.rows[
                0
            ];


        if (
            !collection
        ) {

            return null;

        }


        const productResult =
            await pool.query(
                `
                SELECT
                    product_id

                FROM products

                WHERE
                    product_id = $1

                LIMIT 1
                `,
                [
                    productId,
                ]
            );


        const product =
            productResult.rows[
                0
            ];


        if (
            !product
        ) {

            return null;

        }


        const orderResult =
            await pool.query(
                `
                SELECT
                    COALESCE(
                        MAX(
                            sort_order
                        ),
                        0
                    ) + 1
                    AS next_sort_order

                FROM collection_products

                WHERE
                    collection_id = $1
                `,
                [
                    collection.id,
                ]
            );


        const nextSortOrder =
            orderResult.rows[
                0
            ].next_sort_order;


        const result =
            await pool.query(
                `
                INSERT INTO
                    collection_products (
                        collection_id,
                        product_id,
                        sort_order
                    )

                VALUES (
                    $1,
                    $2,
                    $3
                )

                ON CONFLICT (
                    collection_id,
                    product_id
                )

                DO NOTHING

                RETURNING
                    collection_id,
                    product_id,
                    sort_order
                `,
                [
                    collection.id,
                    productId,
                    nextSortOrder,
                ]
            );


        return result.rows[
            0
        ]
        || null;

    };


/* ===============================================================
   REMOVE PRODUCT FROM COLLECTION
================================================================ */

/**
 * Removes a product assignment
 * from a collection.
 *
 * The product itself is not
 * deleted from the database.
 *
 * Administrator use only.
 */

export const removeProductFromCollection =
    async (
        collectionSlug: string,
        productId: string
    ) => {

        const result =
            await pool.query(
                `
                DELETE FROM
                    collection_products cp

                USING
                    collections c

                WHERE
                    cp.collection_id = c.id

                    AND c.slug = $1

                    AND cp.product_id = $2

                RETURNING
                    cp.collection_id,
                    cp.product_id
                `,
                [
                    collectionSlug,
                    productId,
                ]
            );


        return result.rows[
            0
        ]
        || null;

    };


/* ===============================================================
   UPDATE COLLECTION PRODUCT
================================================================ */

/**
 * Updates product information
 * for a product belonging to
 * a specific collection.
 *
 * Product information is stored
 * in the products table.
 *
 * Administrator use only.
 */

export const updateCollectionProduct =
    async (
        collectionSlug: string,
        productId: string,
        data: UpdateCollectionProductData
    ) => {

        const product =
            await getCollectionProductForAdmin(
                collectionSlug,
                productId
            );


        if (
            !product
        ) {

            return null;

        }


        const result =
            await pool.query(
                `
                UPDATE products

                SET

                    name =
                        COALESCE(
                            $1,
                            name
                        ),

                    slug =
                        COALESCE(
                            $2,
                            slug
                        ),

                    description =
                        COALESCE(
                            $3,
                            description
                        ),

                    price =
                        COALESCE(
                            $4,
                            price
                        ),

                    image_url =
                        COALESCE(
                            $5,
                            image_url
                        ),

                    features =
                        COALESCE(
                            $6,
                            features
                        ),

                    updated_at =
                        NOW()

                WHERE
                    product_id = $7

                RETURNING
                    product_id,
                    name,
                    slug,
                    description,
                    price,
                    image_url,
                    is_active,
                    sort_order,
                    features,
                    created_at,
                    updated_at
                `,
                [
                    data.name
                    ?? null,

                    data.slug
                    ?? null,

                    data.description
                    ?? null,

                    data.price
                    ?? null,

                    data.image_url
                    ?? null,

                    data.features
                    ?? null,

                    productId,
                ]
            );


        return result.rows[
            0
        ];

    };


/* ===============================================================
   SET COLLECTION PRODUCT STATUS
================================================================ */

/**
 * Activates or deactivates
 * a product belonging to
 * a specific collection.
 *
 * Administrator use only.
 */

export const setCollectionProductStatus =
    async (
        collectionSlug: string,
        productId: string,
        isActive: boolean
    ) => {

        const product =
            await getCollectionProductForAdmin(
                collectionSlug,
                productId
            );


        if (
            !product
        ) {

            return null;

        }


        const result =
            await pool.query(
                `
                UPDATE products

                SET

                    is_active =
                        $1,

                    updated_at =
                        NOW()

                WHERE
                    product_id = $2

                RETURNING
                    product_id,
                    is_active,
                    updated_at
                `,
                [
                    isActive,
                    productId,
                ]
            );


        return result.rows[
            0
        ];

    };


/* ===============================================================
   UPDATE COLLECTION PRODUCT ORDER
================================================================ */

/**
 * Updates the display order
 * of a product inside a
 * specific collection.
 *
 * The order belongs to the
 * collection_products table.
 *
 * Administrator use only.
 */

export const updateCollectionProductOrder =
    async (
        collectionSlug: string,
        productId: string,
        sortOrder: number
    ) => {

        const result =
            await pool.query(
                `
                UPDATE collection_products cp

                SET

                    sort_order =
                        $1

                FROM collections c

                WHERE
                    cp.collection_id = c.id

                    AND c.slug = $2

                    AND cp.product_id = $3

                RETURNING
                    cp.collection_id,
                    cp.product_id,
                    cp.sort_order
                `,
                [
                    sortOrder,
                    collectionSlug,
                    productId,
                ]
            );


        return result.rows[
            0
        ]
        || null;

    };