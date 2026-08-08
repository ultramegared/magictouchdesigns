/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: CustomerGallery.data.ts
 * Module: Home
 * Language: TypeScript
 * Description:
 * Temporary Customer Gallery data.
 * ================================================================
 */

import type { CustomerGalleryItem } from "./CustomerGallery.types";

export const customerGalleryItems: CustomerGalleryItem[] = [

    {
        id: 1,

        image: "/images/customers/customer-1.png",

        customerName: "Emily",

        comment:
            "I absolutely love my personalized mug! It turned out beautiful.",

        createdAt: "2026-08-07",
    },

    {
        id: 2,

        image: "/images/customers/customer-2.png",

        customerName: "Michael",

        comment:
            "The quality is amazing and the design looks even better in person.",

        createdAt: "2026-08-06",
    },

    {
        id: 3,

        image: "/images/customers/customer-3.png",

        customerName: "Sophia",

        comment:
            "Such a special gift. The printing quality is excellent!",

        createdAt: "2026-08-05",
    },

    {
        id: 4,

        image: "/images/customers/customer-4.png",

        customerName: "Daniel",

        comment:
            "Beautiful mug, great quality, and exactly what I wanted.",

        createdAt: "2026-08-04",
    },

];