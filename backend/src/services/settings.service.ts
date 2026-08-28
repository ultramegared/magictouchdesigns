/**
 * ================================================================
 * Project: Magic Touch Designs
 * Author: ultramegared
 * File: settings.service.ts
 * Module: Settings
 * Language: TypeScript
 * Description:
 * Service responsible for managing global application settings.
 * ================================================================
 */

import {
    pool,
} from "../config/database";


/* ===============================================================
   TYPES
================================================================ */

export interface Settings {

    websiteName:
        string;

    browserTitle:
        string;

    slogan:
        string;

    logoUrl:
        string | null;

    supportEmail:
        string;

    notificationsEnabled:
        boolean;

}


export interface UpdateSettingsData {

    websiteName?:
        string;

    browserTitle?:
        string;

    slogan?:
        string;

    logoUrl?:
        string | null;

    supportEmail?:
        string;

    notificationsEnabled?:
        boolean;

}


/* ===============================================================
   DATABASE SETTINGS ROW
================================================================ */

interface SettingsRow {

    id:
        string;

    website_name:
        string;

    browser_title:
        string;

    slogan:
        string | null;

    logo_url:
        string | null;

    support_email:
        string | null;

    notifications_enabled:
        boolean;

}


/* ===============================================================
   DEFAULT SETTINGS
================================================================ */

const DEFAULT_SETTINGS:
    Settings = {

        websiteName:
            "Magic Touch Designs",

        browserTitle:
            "Magic Touch Designs | Personalized Gifts & Designs",

        slogan:
            "Personalized Gifts & Designs",

        logoUrl:
            null,

        supportEmail:
            "",

        notificationsEnabled:
            true,

    };


/* ===============================================================
   HELPERS
================================================================ */

const mapSettingsRow =
    (
        row:
            SettingsRow
    ): Settings => {

        return {

            websiteName:
                row.website_name,

            browserTitle:
                row.browser_title,

            slogan:
                row.slogan
                ?? "",

            logoUrl:
                row.logo_url,

            supportEmail:
                row.support_email
                ?? "",

            notificationsEnabled:
                row.notifications_enabled,

        };

    };


const normalizeText =
    (
        value:
            string
    ): string => {

        return value.trim();

    };


/* ===============================================================
   GET SETTINGS
================================================================ */

export const getSettings =
    async (): Promise<Settings> => {

        const result =
            await pool.query<SettingsRow>(
                `
                    SELECT
                        id,
                        website_name,
                        browser_title,
                        slogan,
                        logo_url,
                        support_email,
                        notifications_enabled
                    FROM settings
                    ORDER BY created_at ASC
                    LIMIT 1
                `
            );


        if (
            result.rows.length === 0
        ) {

            return DEFAULT_SETTINGS;

        }


        return mapSettingsRow(
            result.rows[0]
        );

    };


/* ===============================================================
   UPDATE SETTINGS
================================================================ */

export const updateSettings =
    async (
        data:
            UpdateSettingsData
    ): Promise<Settings> => {

        const existingResult =
            await pool.query<SettingsRow>(
                `
                    SELECT
                        id,
                        website_name,
                        browser_title,
                        slogan,
                        logo_url,
                        support_email,
                        notifications_enabled
                    FROM settings
                    ORDER BY created_at ASC
                    LIMIT 1
                `
            );


        const currentSettings =
            existingResult.rows.length > 0

                ? mapSettingsRow(
                    existingResult.rows[0]
                )

                : DEFAULT_SETTINGS;


        const updatedSettings:
            Settings = {

                websiteName:
                    data.websiteName !== undefined

                        ? normalizeText(
                            data.websiteName
                        )

                        : currentSettings.websiteName,


                browserTitle:
                    data.browserTitle !== undefined

                        ? normalizeText(
                            data.browserTitle
                        )

                        : currentSettings.browserTitle,


                slogan:
                    data.slogan !== undefined

                        ? normalizeText(
                            data.slogan
                        )

                        : currentSettings.slogan,


                logoUrl:
                    data.logoUrl !== undefined

                        ? data.logoUrl

                        : currentSettings.logoUrl,


                supportEmail:
                    data.supportEmail !== undefined

                        ? normalizeText(
                            data.supportEmail
                        )

                        : currentSettings.supportEmail,


                notificationsEnabled:
                    data.notificationsEnabled
                    ?? currentSettings.notificationsEnabled,

            };


        /* ===========================================================
           VALIDATION
        =========================================================== */

        if (
            !updatedSettings.websiteName
        ) {

            throw new Error(
                "Website name is required."
            );

        }


        if (
            !updatedSettings.browserTitle
        ) {

            throw new Error(
                "Browser title is required."
            );

        }


        /* ===========================================================
           INSERT SETTINGS
        =========================================================== */

        if (
            existingResult.rows.length === 0
        ) {

            const insertResult =
                await pool.query<SettingsRow>(
                    `
                        INSERT INTO settings (
                            website_name,
                            browser_title,
                            slogan,
                            logo_url,
                            support_email,
                            notifications_enabled
                        )
                        VALUES (
                            $1,
                            $2,
                            $3,
                            $4,
                            $5,
                            $6
                        )
                        RETURNING
                            id,
                            website_name,
                            browser_title,
                            slogan,
                            logo_url,
                            support_email,
                            notifications_enabled
                    `,
                    [
                        updatedSettings.websiteName,

                        updatedSettings.browserTitle,

                        updatedSettings.slogan,

                        updatedSettings.logoUrl,

                        updatedSettings.supportEmail,

                        updatedSettings.notificationsEnabled,
                    ]
                );


            return mapSettingsRow(
                insertResult.rows[0]
            );

        }


        /* ===========================================================
           UPDATE SETTINGS
        =========================================================== */

        const updateResult =
            await pool.query<SettingsRow>(
                `
                    UPDATE settings
                    SET
                        website_name = $1,
                        browser_title = $2,
                        slogan = $3,
                        logo_url = $4,
                        support_email = $5,
                        notifications_enabled = $6,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = $7
                    RETURNING
                        id,
                        website_name,
                        browser_title,
                        slogan,
                        logo_url,
                        support_email,
                        notifications_enabled
                `,
                [
                    updatedSettings.websiteName,

                    updatedSettings.browserTitle,

                    updatedSettings.slogan,

                    updatedSettings.logoUrl,

                    updatedSettings.supportEmail,

                    updatedSettings.notificationsEnabled,

                    existingResult.rows[0].id,
                ]
            );


        return mapSettingsRow(
            updateResult.rows[0]
        );

    };