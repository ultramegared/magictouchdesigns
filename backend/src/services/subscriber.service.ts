/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: subscriber.service.ts
 * Module: Subscriber Service
 * Language: TypeScript
 * Description:
 * Business logic and database operations for newsletter subscribers.
 * ================================================================
 */

import {
    pool,
} from "../config/database";


/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

export type SubscriberLanguage =
    | "en"
    | "es";


export interface Subscriber {
    id:
        string;

    email:
        string;

    is_active:
        boolean;

    language:
        SubscriberLanguage;

    created_at:
        string;

    updated_at:
        string;
}


export interface SubscriberFilters {
    search?:
        string;

    status?:
        "all"
        | "active"
        | "inactive";
}


export interface SubscriberCounts {
    total:
        number;

    active:
        number;

    inactive:
        number;

    active_en:
        number;

    active_es:
        number;
}


/*
|--------------------------------------------------------------------------
| Subscribe
|--------------------------------------------------------------------------
*/

export const subscribeEmail =
    async (
        email:
            string,

        language:
            SubscriberLanguage =
                "es"
    ): Promise<Subscriber> => {

        const normalizedEmail =
            email
                .trim()
                .toLowerCase();


        const normalizedLanguage:
            SubscriberLanguage =
            language === "en"
                ? "en"
                : "es";


        const result =
            await pool.query<Subscriber>(
                `
                INSERT INTO subscribers (
                    email,
                    is_active,
                    language
                )
                VALUES (
                    $1,
                    TRUE,
                    $2
                )
                ON CONFLICT (
                    email
                )
                DO UPDATE SET
                    is_active = TRUE,
                    language = EXCLUDED.language,
                    updated_at = NOW()
                RETURNING
                    id,
                    email,
                    is_active,
                    language,
                    created_at,
                    updated_at
                `,
                [
                    normalizedEmail,
                    normalizedLanguage,
                ]
            );


        return result.rows[0];

    };


/*
|--------------------------------------------------------------------------
| Get Subscribers
|--------------------------------------------------------------------------
*/

export const getSubscribers =
    async (
        filters:
            SubscriberFilters = {}
    ): Promise<Subscriber[]> => {

        const {
            search,
            status = "all",
        } =
            filters;


        const conditions:
            string[] = [];

        const values:
            unknown[] = [];


        if (
            search &&
            search.trim()
        ) {

            values.push(
                `%${search.trim().toLowerCase()}%`
            );


            conditions.push(
                `LOWER(email) LIKE $${values.length}`
            );

        }


        if (
            status === "active"
        ) {

            conditions.push(
                "is_active = TRUE"
            );

        }


        if (
            status === "inactive"
        ) {

            conditions.push(
                "is_active = FALSE"
            );

        }


        const whereClause =
            conditions.length > 0
                ? `WHERE ${conditions.join(" AND ")}`
                : "";


        const result =
            await pool.query<Subscriber>(
                `
                SELECT
                    id,
                    email,
                    is_active,
                    language,
                    created_at,
                    updated_at
                FROM subscribers
                ${whereClause}
                ORDER BY created_at DESC
                `,
                values
            );


        return result.rows;

    };


/*
|--------------------------------------------------------------------------
| Get Subscriber Counts
|--------------------------------------------------------------------------
*/

export const getSubscriberCounts =
    async (): Promise<SubscriberCounts> => {

        const result =
            await pool.query<SubscriberCounts>(
                `
                SELECT
                    COUNT(*)::int AS total,

                    COUNT(*) FILTER (
                        WHERE is_active = TRUE
                    )::int AS active,

                    COUNT(*) FILTER (
                        WHERE is_active = FALSE
                    )::int AS inactive,

                    COUNT(*) FILTER (
                        WHERE
                            is_active = TRUE
                            AND language = 'en'
                    )::int AS active_en,

                    COUNT(*) FILTER (
                        WHERE
                            is_active = TRUE
                            AND language = 'es'
                    )::int AS active_es

                FROM subscribers
                `
            );


        return result.rows[0];

    };


/*
|--------------------------------------------------------------------------
| Update Subscriber Status
|--------------------------------------------------------------------------
*/

export const updateSubscriberStatus =
    async (
        id:
            string,

        isActive:
            boolean
    ): Promise<Subscriber> => {

        const result =
            await pool.query<Subscriber>(
                `
                UPDATE subscribers
                SET
                    is_active = $1,
                    updated_at = NOW()
                WHERE id = $2
                RETURNING
                    id,
                    email,
                    is_active,
                    language,
                    created_at,
                    updated_at
                `,
                [
                    isActive,
                    id,
                ]
            );


        if (
            result.rows.length === 0
        ) {

            throw new Error(
                "Subscriber not found."
            );

        }


        return result.rows[0];

    };


/*
|--------------------------------------------------------------------------
| Update Subscriber Language
|--------------------------------------------------------------------------
*/

export const updateSubscriberLanguage =
    async (
        id:
            string,

        language:
            SubscriberLanguage
    ): Promise<Subscriber> => {

        const normalizedLanguage:
            SubscriberLanguage =
            language === "en"
                ? "en"
                : "es";


        const result =
            await pool.query<Subscriber>(
                `
                UPDATE subscribers
                SET
                    language = $1,
                    updated_at = NOW()
                WHERE id = $2
                RETURNING
                    id,
                    email,
                    is_active,
                    language,
                    created_at,
                    updated_at
                `,
                [
                    normalizedLanguage,
                    id,
                ]
            );


        if (
            result.rows.length === 0
        ) {

            throw new Error(
                "Subscriber not found."
            );

        }


        return result.rows[0];

    };


/*
|--------------------------------------------------------------------------
| Delete Subscriber
|--------------------------------------------------------------------------
*/

export const deleteSubscriber =
    async (
        id:
            string
    ): Promise<void> => {

        const result =
            await pool.query(
                `
                DELETE FROM subscribers
                WHERE id = $1
                `,
                [
                    id,
                ]
            );


        if (
            result.rowCount === 0
        ) {

            throw new Error(
                "Subscriber not found."
            );

        }

    };