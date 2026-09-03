/**
 * ================================================================
 * Project: Magic Touch Designs
 * Author: ultramegared
 * File: collection.controller.ts
 * Module: Collection Controller
 * Language: TypeScript
 * Description:
 * Handles collection API requests.
 * ================================================================
 */

import {
    Request,
    Response,
} from "express";

import {
    getProductsByCollectionSlug,

    getCollectionProductsForAdmin as
        getCollectionProductsForAdminService,

} from "../services/collection.service";


/* ===============================================================
   GET PRODUCTS BY COLLECTION
================================================================ */

export const getCollectionProducts =
    async (
        request: Request,
        response: Response
    ) => {

        try {

            const {
                slug,
            } = request.params;


            const products =
                await getProductsByCollectionSlug(
                    slug
                );


            return response.json(
                {
                    status:
                        "success",

                    products,
                }
            );

        } catch (
            error
        ) {

            console.error(
                "Unable to load collection products:",
                error
            );


            return response.status(
                500
            ).json(
                {
                    status:
                        "error",

                    message:
                        "Unable to load collection products.",
                }
            );

        }

    };


/* ===============================================================
   GET COLLECTION PRODUCTS FOR ADMIN
================================================================ */

export const getCollectionProductsForAdmin =
    async (
        request: Request,
        response: Response
    ) => {

        try {

            const {
                slug,
            } = request.params;


            const products =
                await getCollectionProductsForAdminService(
                    slug
                );


            return response.json(
                {
                    status:
                        "success",

                    products,
                }
            );

        } catch (
            error
        ) {

            console.error(
                "Unable to load collection products for administrator:",
                error
            );


            return response.status(
                500
            ).json(
                {
                    status:
                        "error",

                    message:
                        "Unable to load collection products.",
                }
            );

        }

    };