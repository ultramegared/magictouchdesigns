/**
 * ===============================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: featuredModels.ts
 * Module: Frontend
 * Language: TypeScript
 * Description:
 * Featured products displayed on Home.
 * ===============================================================
 */

import type {

    FeaturedModel

} from "../components/home/FeaturedModels/FeaturedModels.types";

export const featuredModels: FeaturedModel[] = [

    {

        id: 1,

        name: "Luxury Black Mug",

        image: "/images/models/luxury-black.png",

        price: 29.99

    },

    {

        id: 2,

        name: "Classic White Mug",

        image: "/images/models/classic-white.png",

        price: 24.99

    },

    {

        id: 3,

        name: "Magic Color Change Mug",

        image: "/images/models/magic-black.png",

        price: 34.99

    }

];