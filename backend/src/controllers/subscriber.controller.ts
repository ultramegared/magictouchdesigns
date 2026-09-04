/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: subscriber.controller.ts
 * Module: Subscribers / Newsletter
 * Language: TypeScript
 * Description:
 * Controller for newsletter subscribers and subscriber management.
 * ================================================================
 */

import type {
    Request,
    Response,
} from "express";


import type {
    AuthenticatedRequest,
} from "../middleware/auth.middleware";


import {
    deleteSubscriber,
    getSubscriberCounts,
    getSubscribers,
    subscribeEmail,
    updateSubscriberLanguage,
    updateSubscriberStatus,
    type SubscriberLanguage,
} from "../services/subscriber.service";


/**
 * ================================================================
 * EMAIL VALIDATION
 * ================================================================
 *
 * Validates the basic email format before saving a subscriber.
 */
const isValidEmail = (
    email:
        string
): boolean =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
    );


/**
 * ================================================================
 * LANGUAGE NORMALIZATION
 * ================================================================
 *
 * Only English and Spanish are supported.
 *
 * Any value other than "en" defaults to Spanish.
 */
const normalizeLanguage = (
    value:
        unknown
): SubscriberLanguage =>
    value === "en"
        ? "en"
        : "es";


/**
 * ================================================================
 * SUBSCRIBE TO NEWSLETTER
 * ================================================================
 *
 * Public endpoint used by the Newsletter form.
 *
 * Stores:
 *
 * - Email address
 * - Visitor language preference
 */
export const subscribe = async (
    req:
        Request,

    res:
        Response
): Promise<void> => {

    try {

        const email =
            typeof req.body?.email === "string"
                ? req.body.email.trim()
                : "";


        const language =
            normalizeLanguage(
                req.body?.language
            );


        if (
            !email ||
            !isValidEmail(
                email
            )
        ) {

            res.status(
                400
            ).json({

                status:
                    "error",

                message:
                    language === "es"
                        ? "Por favor, ingresa un correo electrónico válido."
                        : "Please enter a valid email address.",

            });


            return;

        }


        await subscribeEmail(
            email,
            language
        );


        res.status(
            200
        ).json({

            status:
                "success",

            message:
                language === "es"
                    ? "¡Listo! Te has suscrito correctamente."
                    : "You're subscribed successfully.",

        });

    } catch (
        error
    ) {

        console.error(
            "Subscribe error:",
            error
        );


        res.status(
            500
        ).json({

            status:
                "error",

            message:
                "Unable to subscribe at this time.",

        });

    }

};


/**
 * ================================================================
 * GET ADMIN SUBSCRIBERS
 * ================================================================
 *
 * Returns subscribers for the administrative panel.
 *
 * Supports:
 *
 * - Search by email
 * - Active subscribers
 * - Inactive subscribers
 */
export const listSubscribers = async (
    req:
        AuthenticatedRequest,

    res:
        Response
): Promise<void> => {

    try {

        const search =
            typeof req.query.search === "string"
                ? req.query.search
                : "";


        const rawStatus =
            typeof req.query.status === "string"
                ? req.query.status
                : "all";


        const status =
            rawStatus === "active" ||
            rawStatus === "inactive"
                ? rawStatus
                : "all";


        const subscribers =
            await getSubscribers({

                search,

                status,

            });


        res.status(
            200
        ).json({

            status:
                "success",

            subscribers,

        });

    } catch (
        error
    ) {

        console.error(
            "List subscribers error:",
            error
        );


        res.status(
            500
        ).json({

            status:
                "error",

            message:
                "Unable to retrieve subscribers.",

        });

    }

};


/**
 * ================================================================
 * GET SUBSCRIBER COUNTS
 * ================================================================
 *
 * Returns subscriber statistics for the administrative panel.
 */
export const subscriberCounts = async (
    _req:
        AuthenticatedRequest,

    res:
        Response
): Promise<void> => {

    try {

        const counts =
            await getSubscriberCounts();


        res.status(
            200
        ).json({

            status:
                "success",

            counts: {

                total:
                    Number(
                        counts.total
                    ),

                active:
                    Number(
                        counts.active
                    ),

                inactive:
                    Number(
                        counts.inactive
                    ),

                active_en:
                    Number(
                        counts.active_en
                    ),

                active_es:
                    Number(
                        counts.active_es
                    ),

            },

        });

    } catch (
        error
    ) {

        console.error(
            "Get subscriber counts error:",
            error
        );


        res.status(
            500
        ).json({

            status:
                "error",

            message:
                "Unable to retrieve subscriber counts.",

        });

    }

};


/**
 * ================================================================
 * UPDATE SUBSCRIBER STATUS
 * ================================================================
 *
 * Activates or deactivates a subscriber.
 */
export const changeStatus = async (
    req:
        AuthenticatedRequest,

    res:
        Response
): Promise<void> => {

    try {

        const id =
            String(
                req.params.id ?? ""
            );


        const isActive =
            req.body?.is_active;


        if (
            !id ||
            typeof isActive !== "boolean"
        ) {

            res.status(
                400
            ).json({

                status:
                    "error",

                message:
                    "A valid subscriber ID and status are required.",

            });


            return;

        }


        const subscriber =
            await updateSubscriberStatus(
                id,
                isActive
            );


        res.status(
            200
        ).json({

            status:
                "success",

            message:
                "Subscriber status updated.",

            subscriber,

        });

    } catch (
        error
    ) {

        console.error(
            "Update subscriber status error:",
            error
        );


        if (
            error instanceof Error &&
            error.message ===
                "Subscriber not found."
        ) {

            res.status(
                404
            ).json({

                status:
                    "error",

                message:
                    "Subscriber not found.",

            });


            return;

        }


        res.status(
            500
        ).json({

            status:
                "error",

            message:
                "Unable to update subscriber status.",

        });

    }

};


/**
 * ================================================================
 * UPDATE SUBSCRIBER LANGUAGE
 * ================================================================
 *
 * Allows the administrator to manually change the language
 * associated with a subscriber.
 */
export const changeLanguage = async (
    req:
        AuthenticatedRequest,

    res:
        Response
): Promise<void> => {

    try {

        const id =
            String(
                req.params.id ?? ""
            );


        const rawLanguage =
            req.body?.language;


        if (
            !id ||
            (
                rawLanguage !== "en" &&
                rawLanguage !== "es"
            )
        ) {

            res.status(
                400
            ).json({

                status:
                    "error",

                message:
                    "A valid subscriber ID and language are required.",

            });


            return;

        }


        const language =
            normalizeLanguage(
                rawLanguage
            );


        const subscriber =
            await updateSubscriberLanguage(
                id,
                language
            );


        res.status(
            200
        ).json({

            status:
                "success",

            message:
                "Subscriber language updated.",

            subscriber,

        });

    } catch (
        error
    ) {

        console.error(
            "Update subscriber language error:",
            error
        );


        if (
            error instanceof Error &&
            error.message ===
                "Subscriber not found."
        ) {

            res.status(
                404
            ).json({

                status:
                    "error",

                message:
                    "Subscriber not found.",

            });


            return;

        }


        res.status(
            500
        ).json({

            status:
                "error",

            message:
                "Unable to update subscriber language.",

        });

    }

};


/**
 * ================================================================
 * DELETE SUBSCRIBER
 * ================================================================
 *
 * Permanently removes a subscriber from the newsletter list.
 */
export const remove = async (
    req:
        AuthenticatedRequest,

    res:
        Response
): Promise<void> => {

    try {

        const id =
            String(
                req.params.id ?? ""
            );


        if (
            !id
        ) {

            res.status(
                400
            ).json({

                status:
                    "error",

                message:
                    "Subscriber ID is required.",

            });


            return;

        }


        await deleteSubscriber(
            id
        );


        res.status(
            200
        ).json({

            status:
                "success",

            message:
                "Subscriber deleted successfully.",

        });

    } catch (
        error
    ) {

        console.error(
            "Delete subscriber error:",
            error
        );


        if (
            error instanceof Error &&
            error.message ===
                "Subscriber not found."
        ) {

            res.status(
                404
            ).json({

                status:
                    "error",

                message:
                    "Subscriber not found.",

            });


            return;

        }


        res.status(
            500
        ).json({

            status:
                "error",

            message:
                "Unable to delete subscriber.",

        });

    }

};