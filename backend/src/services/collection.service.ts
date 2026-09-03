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

interface CreateCollectionProductData {

    product_id?: string;

    name?: string;

    slug?: string;

    description?: string;

    price?: number;

    image_url?: string;

    features?: string[];

    is_active?: boolean;

}


interface UpdateCollectionProductData {

    name?: string;

    slug?: string;

    description?: string;

    price?: number;

    image_url?: string;

    features?: string[];

    is_active?: boolean;

}


interface UpdateCollectionData {

    name?: string;

    slug?: string;

    description?: string;

    image_url?: string;

    is_active?: boolean;

    sort_order?: number;

}


/* ===============================================================
   GET COLLECTION BY SLUG
================================================================ */

export const getCollectionBySlug =
    async (
        slug: string
    ) => {

        const result =
            await pool.query(
                `
                SELECT
                    id,
                    name,
                    slug,
                    description,
                    image_url,
                    is_active,
                    sort_order,
                    created_at,
                    updated_at

                FROM collections

                WHERE
                    slug = $1

                LIMIT 1
                `,
                [
                    slug,
                ]
            );


        return result.rows[
            0
        ]
        || null;

    };


/* ===============================================================
   GET PRODUCTS BY COLLECTION SLUG
================================================================ */

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
                    p.created_at ASC
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

export const getAvailableProductsForCollection =
    async (
        collectionSlug: string
    ) => {

        const collection =
            await getCollectionBySlug(
                collectionSlug
            );


        if (
            !collection
        ) {

            return null;

        }


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

                        WHERE
                            cp.collection_id = $1

                            AND cp.product_id =
                                p.product_id

                    )

                ORDER BY
                    p.created_at DESC
                `,
                [
                    collection.id,
                ]
            );


        return result.rows;

    };


/* ===============================================================
   ADD PRODUCT TO COLLECTION

   IMPORTANT:

   This function supports two modes:

   1. Existing product:
      {
          product_id: "..."
      }

   2. New product:
      {
          name,
          slug,
          description,
          price,
          image_url,
          features,
          is_active
      }

   New products are placed first in the collection.
================================================================ */

export const addProductToCollection =
    async (
        collectionSlug: string,
        data: CreateCollectionProductData
    ) => {

        const client =
            await pool.connect();


        try {

            await client.query(
                `
                BEGIN
                `
            );


            /* =====================================================
               FIND COLLECTION
            ===================================================== */

            const collectionResult =
                await client.query(
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

                await client.query(
                    `
                    ROLLBACK
                    `
                );


                return null;

            }


            let productId:
                string;


            let createdProduct:
                unknown;


            /* =====================================================
               EXISTING PRODUCT MODE
            ===================================================== */

            if (
                data.product_id
            ) {

                const productResult =
                    await client.query(
                        `
                        SELECT
                            product_id

                        FROM products

                        WHERE
                            product_id = $1

                        LIMIT 1
                        `,
                        [
                            data.product_id,
                        ]
                    );


                const existingProduct =
                    productResult.rows[
                        0
                    ];


                if (
                    !existingProduct
                ) {

                    await client.query(
                        `
                        ROLLBACK
                        `
                    );


                    return null;

                }


                productId =
                    existingProduct.product_id;


                const existingCollectionProductResult =
                    await client.query(
                        `
                        SELECT
                            collection_product_id,
                            collection_id,
                            product_id,
                            sort_order,
                            created_at

                        FROM collection_products

                        WHERE
                            collection_id = $1

                            AND product_id = $2

                        LIMIT 1
                        `,
                        [
                            collection.id,
                            productId,
                        ]
                    );


                const existingCollectionProduct =
                    existingCollectionProductResult.rows[
                        0
                    ];


                if (
                    existingCollectionProduct
                ) {

                    await client.query(
                        `
                        COMMIT
                        `
                    );


                    return existingCollectionProduct;

                }

            }


            /* =====================================================
               CREATE NEW PRODUCT MODE
            ===================================================== */

            else {

                const productResult =
                    await client.query(
                        `
                        INSERT INTO
                            products (

                                name,

                                slug,

                                description,

                                price,

                                image_url,

                                features,

                                is_active,

                                sort_order

                            )

                        VALUES (

                            $1,

                            $2,

                            $3,

                            $4,

                            $5,

                            $6,

                            $7,

                            0

                        )

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
                            ?? "",

                            data.slug
                            ?? "",

                            data.description
                            ?? "",

                            data.price
                            ?? 0,

                            data.image_url
                            ?? "",

                            data.features
                            ?? [],

                            data.is_active
                            ?? true,
                        ]
                    );


                createdProduct =
                    productResult.rows[
                        0
                    ];


                if (
                    !createdProduct
                ) {

                    await client.query(
                        `
                        ROLLBACK
                        `
                    );


                    return null;

                }


                productId =
                    productResult.rows[
                        0
                    ].product_id;

            }


            /* =====================================================
               MOVE EXISTING PRODUCTS DOWN

               The new product will be placed in position 1.
            ===================================================== */

            await client.query(
                `
                UPDATE collection_products

                SET
                    sort_order =
                        sort_order + 1

                WHERE
                    collection_id = $1
                `,
                [
                    collection.id,
                ]
            );


            /* =====================================================
               ADD PRODUCT TO COLLECTION

               New products are always placed first.
            ===================================================== */

            const collectionProductResult =
                await client.query(
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

                        1

                    )

                    RETURNING

                        collection_product_id,

                        collection_id,

                        product_id,

                        sort_order,

                        created_at
                    `,
                    [
                        collection.id,
                        productId,
                    ]
                );


            /* =====================================================
               COMMIT TRANSACTION
            ===================================================== */

            await client.query(
                `
                COMMIT
                `
            );


            /* =====================================================
               RETURN NEW PRODUCT
            ===================================================== */

            if (
                createdProduct
            ) {

                return createdProduct;

            }


            return collectionProductResult.rows[
                0
            ]
            || null;

        } catch (
            error
        ) {

            await client.query(
                `
                ROLLBACK
                `
            );


            throw error;

        } finally {

            client.release();

        }

    };


/* ===============================================================
   REMOVE PRODUCT FROM COLLECTION
================================================================ */

export const removeProductFromCollection =
    async (
        collectionSlug: string,
        productId: string
    ) => {

        const client =
            await pool.connect();


        try {

            await client.query(
                `
                BEGIN
                `
            );


            const collectionResult =
                await client.query(
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

                await client.query(
                    `
                    ROLLBACK
                    `
                );


                return null;

            }


            const result =
                await client.query(
                    `
                    DELETE FROM
                        collection_products

                    WHERE
                        collection_id = $1

                        AND product_id = $2

                    RETURNING
                        collection_product_id,
                        collection_id,
                        product_id
                    `,
                    [
                        collection.id,
                        productId,
                    ]
                );


            const removedProduct =
                result.rows[
                    0
                ];


            if (
                !removedProduct
            ) {

                await client.query(
                    `
                    ROLLBACK
                    `
                );


                return null;

            }


            await client.query(
                `
                WITH ordered_products AS (

                    SELECT
                        collection_product_id,

                        ROW_NUMBER()
                        OVER (
                            ORDER BY
                                sort_order ASC,
                                created_at ASC
                        )
                        AS new_sort_order

                    FROM collection_products

                    WHERE
                        collection_id = $1

                )

                UPDATE collection_products cp

                SET
                    sort_order =
                        ordered_products.new_sort_order

                FROM ordered_products

                WHERE
                    cp.collection_product_id =
                        ordered_products.collection_product_id
                `,
                [
                    collection.id,
                ]
            );


            await client.query(
                `
                COMMIT
                `
            );


            return removedProduct;

        } catch (
            error
        ) {

            await client.query(
                `
                ROLLBACK
                `
            );


            throw error;

        } finally {

            client.release();

        }

    };


/* ===============================================================
   UPDATE COLLECTION
================================================================ */

export const updateCollection =
    async (
        collectionSlug: string,
        data: UpdateCollectionData
    ) => {

        const collection =
            await getCollectionBySlug(
                collectionSlug
            );


        if (
            !collection
        ) {

            return null;

        }


        const result =
            await pool.query(
                `
                UPDATE collections

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

                    image_url =
                        COALESCE(
                            $4,
                            image_url
                        ),

                    is_active =
                        COALESCE(
                            $5,
                            is_active
                        ),

                    sort_order =
                        COALESCE(
                            $6,
                            sort_order
                        ),

                    updated_at =
                        NOW()

                WHERE
                    id = $7

                RETURNING
                    id,
                    name,
                    slug,
                    description,
                    image_url,
                    is_active,
                    sort_order,
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

                    data.image_url
                    ?? null,

                    data.is_active
                    ?? null,

                    data.sort_order
                    ?? null,

                    collection.id,
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

                    is_active =
                        COALESCE(
                            $7,
                            is_active
                        ),

                    updated_at =
                        NOW()

                WHERE
                    product_id = $8

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

                    data.is_active
                    ?? null,

                    productId,
                ]
            );


        return result.rows[
            0
        ]
        || null;

    };


/* ===============================================================
   SET COLLECTION PRODUCT STATUS
================================================================ */

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
        ]
        || null;

    };


/* ===============================================================
   UPDATE COLLECTION PRODUCT ORDER
================================================================ */

export const updateCollectionProductOrder =
    async (
        collectionSlug: string,
        productId: string,
        sortOrder: number
    ) => {

        const client =
            await pool.connect();


        try {

            await client.query(
                `
                BEGIN
                `
            );


            const collectionResult =
                await client.query(
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

                await client.query(
                    `
                    ROLLBACK
                    `
                );


                return null;

            }


            const productsResult =
                await client.query(
                    `
                    SELECT
                        product_id

                    FROM collection_products

                    WHERE
                        collection_id = $1

                    ORDER BY
                        sort_order ASC,
                        created_at ASC
                    `,
                    [
                        collection.id,
                    ]
                );


            const productIds =
                productsResult.rows.map(
                    (
                        row
                    ) =>
                        row.product_id
                );


            const currentIndex =
                productIds.indexOf(
                    productId
                );


            if (
                currentIndex === -1
            ) {

                await client.query(
                    `
                    ROLLBACK
                    `
                );


                return null;

            }


            const requestedIndex =
                Math.min(
                    Math.max(
                        sortOrder - 1,
                        0
                    ),
                    productIds.length - 1
                );


            productIds.splice(
                currentIndex,
                1
            );


            productIds.splice(
                requestedIndex,
                0,
                productId
            );


            for (
                let index = 0;
                index < productIds.length;
                index++
            ) {

                await client.query(
                    `
                    UPDATE collection_products

                    SET
                        sort_order = $1

                    WHERE
                        collection_id = $2

                        AND product_id = $3
                    `,
                    [
                        index + 1,
                        collection.id,
                        productIds[
                            index
                        ],
                    ]
                );

            }


            await client.query(
                `
                COMMIT
                `
            );


            return {
                collection_id:
                    collection.id,

                product_id:
                    productId,

                sort_order:
                    requestedIndex + 1,
            };

        } catch (
            error
        ) {

            await client.query(
                `
                ROLLBACK
                `
            );


            throw error;

        } finally {

            client.release();

        }

    };


/* ===============================================================
   REORDER COLLECTION PRODUCTS
================================================================ */

export const reorderCollectionProducts =
    async (
        collectionSlug: string,
        productIds: string[]
    ) => {

        const client =
            await pool.connect();


        try {

            await client.query(
                `
                BEGIN
                `
            );


            const collectionResult =
                await client.query(
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

                await client.query(
                    `
                    ROLLBACK
                    `
                );


                return null;

            }


            const existingProductsResult =
                await client.query(
                    `
                    SELECT
                        product_id

                    FROM collection_products

                    WHERE
                        collection_id = $1
                    `,
                    [
                        collection.id,
                    ]
                );


            const existingProductIds =
                existingProductsResult.rows.map(
                    (
                        row
                    ) =>
                        row.product_id
                );


            const existingIdsSet =
                new Set(
                    existingProductIds
                );


            const requestedIdsSet =
                new Set(
                    productIds
                );


            if (
                existingProductIds.length !==
                productIds.length
            ) {

                await client.query(
                    `
                    ROLLBACK
                    `
                );


                return null;

            }


            if (
                existingIdsSet.size !==
                requestedIdsSet.size
            ) {

                await client.query(
                    `
                    ROLLBACK
                    `
                );


                return null;

            }


            for (
                const productId
                of productIds
            ) {

                if (
                    !existingIdsSet.has(
                        productId
                    )
                ) {

                    await client.query(
                        `
                        ROLLBACK
                        `
                    );


                    return null;

                }

            }


            for (
                let index = 0;
                index < productIds.length;
                index++
            ) {

                await client.query(
                    `
                    UPDATE collection_products

                    SET
                        sort_order = $1

                    WHERE
                        collection_id = $2

                        AND product_id = $3
                    `,
                    [
                        index + 1,
                        collection.id,
                        productIds[
                            index
                        ],
                    ]
                );

            }


            await client.query(
                `
                COMMIT
                `
            );


            return true;

        } catch (
            error
        ) {

            await client.query(
                `
                ROLLBACK
                `
            );


            throw error;

        } finally {

            client.release();

        }

    };