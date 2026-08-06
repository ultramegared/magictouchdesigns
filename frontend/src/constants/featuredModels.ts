/**
 * ===============================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: featuredModels.ts
 * Module: Frontend
 * Language: TypeScript
 * Description:
 * Featured models displayed on the Home page.
 * ===============================================================
 */

import type { FeaturedModel } from "../components/home/FeaturedModels/FeaturedModels.types";

export const featuredModels: FeaturedModel[] = [
    {
        id: 1,
        name: "Classic White Mug",
        image: "/images/models/classic-white-mug.webp",
        price: 19.99
    },
    {
        id: 2,
        name: "Magic Black Mug",
        image: "/images/models/magic-black-mug.webp",
        price: 24.99
    },
    {
        id: 3,
        name: "Golden Premium Mug",
        image: "/images/models/golden-premium-mug.webp",
        price: 29.99
    },
    {
        id: 4,
        name: "Minimal Ceramic Mug",
        image: "/images/models/minimal-ceramic-mug.webp",
        price: 21.99
    },
    {
        id: 5,
        name: "Marble Collection Mug",
        image: "/images/models/marble-mug.webp",
        price: 27.99
    },
    {
        id: 6,
        name: "Custom Photo Mug",
        image: "/images/models/custom-photo-mug.webp",
        price: 26.99
    }
];