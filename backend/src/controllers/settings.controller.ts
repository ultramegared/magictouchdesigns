/**
 * ================================================================
 * Project: Magic Touch Designs
 * Author: ultramegared
 * File: settings.controller.ts
 * Module: Settings
 * Language: TypeScript
 * Description:
 * Controller responsible for application settings requests.
 * ================================================================
 */

import {
    Request,
    Response,
} from "express";

import {
    getSettings,
    updateSettings,
} from "../services/settings.service";


/* ===============================================================
   GET SETTINGS
================================================================ */

export const getSettingsController =
    async (
        _request:
            Request,

        response:
            Response
    ): Promise<void> => {

        try {

            const settings =
                await getSettings();


            response.status(
                200
            ).json({

                status:
                    "success",

                settings,

            });

        } catch (
            error
        ) {

            console.error(
                "Unable to get settings:",
                error
            );


            response.status(
                500
            ).json({

                status:
                    "error",

                message:
                    "Unable to retrieve settings.",

            });

        }

    };


/* ===============================================================
   UPDATE SETTINGS
================================================================ */

export const updateSettingsController =
    async (
        request:
            Request,

        response:
            Response
    ): Promise<void> => {

        try {

            const settings =
                await updateSettings(
                    request.body
                );


            response.status(
                200
            ).json({

                status:
                    "success",

                message:
                    "Settings updated successfully.",

                settings,

            });

        } catch (
            error
        ) {

            console.error(
                "Unable to update settings:",
                error
            );


            response.status(
                500
            ).json({

                status:
                    "error",

                message:
                    "Unable to update settings.",

            });

        }

    };