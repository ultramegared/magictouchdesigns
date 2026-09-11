import {
    Request,
    Response,
} from "express";

import {
    getSettings,
    updateSettings,
} from "../services/settings.service";

const errorMessage = (error: unknown, fallback: string): string => {
    if (error instanceof Error && error.message.trim()) {
        return error.message;
    }
    return fallback;
};

export const getSettingsController =
    async (_request: Request, response: Response): Promise<void> => {
        try {
            const settings = await getSettings();
            response.status(200).json({ status: "success", settings });
        } catch (error) {
            console.error("Unable to get settings:", error);
            response.status(500).json({
                status: "error",
                message: errorMessage(error, "Unable to retrieve settings."),
            });
        }
    };

export const updateSettingsController =
    async (request: Request, response: Response): Promise<void> => {
        try {
            const settings = await updateSettings(request.body);
            response.status(200).json({
                status: "success",
                message: "Settings updated successfully.",
                settings,
            });
        } catch (error) {
            console.error("Unable to update settings:", error);
            response.status(500).json({
                status: "error",
                message: errorMessage(error, "Unable to update settings."),
            });
        }
    };
