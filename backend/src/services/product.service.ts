/**
 * ================================================================
 * Project: Magic Touch Designs
 * Author: ultramegared
 * File: product.service.ts
 * Module: Product Service
 * Language: TypeScript
 * Description:
 * Product business logic and database operations.
 * Languages: English (en) | Español (es)
 * ================================================================
 */

import {
    pool,
} from "../config/database";


/* ===============================================================
   TYPES
================================================================ */

export interface CreateProductData {

    collection_id:
        string;

    name:
        string;

    slug:
        string;

    description?:
        string | null;

    price:
        number;

    image_url?:
        string | null;

    is_active?:
        boolean;

    sort_order?:
        number;

}


export interface UpdateProductData {

    collection_id?:
        string;

    name?:
        string;

    slug?:
        string;

    description?:
        string | null;

    price?:
        number;

    image_url?:
        string | null;

    is_active?:
        boolean;

    sort_order?:
        number;

}


/* ===============================================================
   GET ALL PRODUCTS
================================================================ */

/**
 * Returns all products.
 *
 * Intended for administrator access.
 *
 * Products are ordered by:
 *
 * 1. sort_order
 * 2. created_at
 */

export const getAllProducts =
    async () => {

        const query = `
            SELECT
                *
            FROM products

            ORDER BY
                sort_order ASC,
                created_at DESC;
        `;


        const result =
            await pool.query(
                query
            );


        return result.rows;

    };


/* ===============================================================
   GET ACTIVE PRODUCTS
================================================================ */

/**
 * Returns products available
 * for public display.
 */

export const getActiveProducts =
    async () => {

        const query = `
            SELECT
                *
            FROM products

            WHERE
                is_active = TRUE

            ORDER BY
                sort_order ASC,
                created_at DESC;
        `;


        const result =
            await pool.query(
                query
            );


        return result.rows;

    };


/* ===============================================================
   GET PRODUCT BY ID
================================================================ */

/**
 * Returns one product by ID.
 */

export const getProductById =
    async (
        productId:
            string
    ) => {

        const query = `
            SELECT
                *
            FROM products

            WHERE
                id = $1;
        `;


        const result =
            await pool.query(
                query,
                [
                    productId,
                ]
            );


        return (
            result.rows[0]
            || null
        );

    };


/* ===============================================================
   GET PRODUCT BY SLUG
================================================================ */

/**
 * Returns one product by slug.
 */

export const getProductBySlug =
    async (
        slug:
            string
    ) => {

        const query = `
            SELECT
                *
            FROM products

            WHERE
                slug = $1;
        `;


        const result =
            await pool.query(
                query,
                [
                    slug,
                ]
            );


        return (
            result.rows[0]
            || null
        );

    };


/* ===============================================================
   CREATE PRODUCT
================================================================ */

/**
 * Creates a new product.
 */

export const createProduct =
    async (
        data:
            CreateProductData
    ) => {

        const {

            collection_id,

            name,

            slug,

            description = null,

            price,

            image_url = null,

            is_active = true,

            sort_order = 0,

        } = data;


        const query = `
            INSERT INTO products (

                collection_id,

                name,

                slug,

                description,

                price,

                image_url,

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

                $8

            )

            RETURNING *;
        `;


        const values = [

            collection_id,

            name,

            slug,

            description,

            price,

            image_url,

            is_active,

            sort_order,

        ];


        const result =
            await pool.query(
                query,
                values
            );


        return result.rows[0];

    };


/* ===============================================================
   UPDATE PRODUCT
================================================================ */

/**
 * Updates an existing product.
 *
 * Only provided fields are modified.
 *
 * Fields may intentionally be updated
 * to NULL when required.
 */

export const updateProduct =
    async (

        productId:
            string,

        data:
            UpdateProductData

    ) => {

        const fields:
            string[] = [];


        const values:
            unknown[] = [];


        let parameterIndex =
            1;


        /*
        ------------------------------------------------------------
        COLLECTION
        ------------------------------------------------------------
        */

        if (
            data.collection_id !== undefined
        ) {

            fields.push(
                `collection_id = $${parameterIndex}`
            );


            values.push(
                data.collection_id
            );


            parameterIndex++;

        }


        /*
        ------------------------------------------------------------
        NAME
        ------------------------------------------------------------
        */

        if (
            data.name !== undefined
        ) {

            fields.push(
                `name = $${parameterIndex}`
            );


            values.push(
                data.name
            );


            parameterIndex++;

        }


        /*
        ------------------------------------------------------------
        SLUG
        ------------------------------------------------------------
        */

        if (
            data.slug !== undefined
        ) {

            fields.push(
                `slug = $${parameterIndex}`
            );


            values.push(
                data.slug
            );


            parameterIndex++;

        }


        /*
        ------------------------------------------------------------
        DESCRIPTION
        ------------------------------------------------------------
        */

        if (
            data.description !== undefined
        ) {

            fields.push(
                `description = $${parameterIndex}`
            );


            values.push(
                data.description
            );


            parameterIndex++;

        }


        /*
        ------------------------------------------------------------
        PRICE
        ------------------------------------------------------------
        */

        if (
            data.price !== undefined
        ) {

            fields.push(
                `price = $${parameterIndex}`
            );


            values.push(
                data.price
            );


            parameterIndex++;

        }


        /*
        ------------------------------------------------------------
        IMAGE URL
        ------------------------------------------------------------
        */

        if (
            data.image_url !== undefined
        ) {

            fields.push(
                `image_url = $${parameterIndex}`
            );


            values.push(
                data.image_url
            );


            parameterIndex++;

        }


        /*
        ------------------------------------------------------------
        ACTIVE STATUS
        ------------------------------------------------------------
        */

        if (
            data.is_active !== undefined
        ) {

            fields.push(
                `is_active = $${parameterIndex}`
            );


            values.push(
                data.is_active
            );


            parameterIndex++;

        }


        /*
        ------------------------------------------------------------
        SORT ORDER
        ------------------------------------------------------------
        */

        if (
            data.sort_order !== undefined
        ) {

            fields.push(
                `sort_order = $${parameterIndex}`
            );


            values.push(
                data.sort_order
            );


            parameterIndex++;

        }


        /*
        ------------------------------------------------------------
        UPDATED AT
        ------------------------------------------------------------
        */

        fields.push(
            "updated_at = NOW()"
        );


        /*
        ------------------------------------------------------------
        PRODUCT ID
        ------------------------------------------------------------
        */

        values.push(
            productId
        );


        const query = `
            UPDATE products

            SET
                ${fields.join(", ")}

            WHERE
                id = $${parameterIndex}

            RETURNING *;
        `;


        const result =
            await pool.query(
                query,
                values
            );


        return (
            result.rows[0]
            || null
        );

    };


/* ===============================================================
   DELETE PRODUCT
================================================================ */

/**
 * Deletes a product permanently.
 */

export const deleteProduct =
    async (
        productId:
            string
    ) => {

        const query = `
            DELETE FROM products

            WHERE
                id = $1

            RETURNING
                id;
        `;


        const result =
            await pool.query(
                query,
                [
                    productId,
                ]
            );


        return (
            result.rows[0]
            || null
        );

    };


/* ===============================================================
   UPDATE PRODUCT STATUS
================================================================ */

/**
 * Updates the active status
 * of a product.
 */

export const updateProductStatus =
    async (

        productId:
            string,

        isActive:
            boolean

    ) => {

        const query = `
            UPDATE products

            SET

                is_active =
                    $1,

                updated_at =
                    NOW()

            WHERE
                id = $2

            RETURNING *;
        `;


        const result =
            await pool.query(

                query,

                [

                    isActive,

                    productId,

                ]

            );


        return (
            result.rows[0]
            || null
        );

    };


/* ===============================================================
   ACTIVATE PRODUCT
================================================================ */

/**
 * Activates a product.
 */

export const activateProduct =
    async (
        productId:
            string
    ) => {

        return updateProductStatus(
            productId,
            true
        );

    };


/* ===============================================================
   DEACTIVATE PRODUCT
================================================================ */

/**
 * Deactivates a product.
 */

export const deactivateProduct =
    async (
        productId:
            string
    ) => {

        return updateProductStatus(
            productId,
            false
        );

    };