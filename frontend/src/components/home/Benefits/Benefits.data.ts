/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: Benefits.data.ts
 * Module: Home
 * Language: TypeScript
 * Description:
 * Benefits Section Data.
 * ================================================================
 */

import {

    Truck,
    Flag,
    Gem,
    ShieldCheck

} from "lucide-react";

import type {

    Benefit

} from "./Benefits.types";

export const benefits: Benefit[] = [

    {

        id: 1,

        title: "Fast Shipping",

        description: "2–5 business days directly to your door.",

        icon: Truck

    },

    {

        id: 2,

        title: "Made in USA",

        description: "Proudly designed and printed in the United States.",

        icon: Flag

    },

    {

        id: 3,

        title: "Premium Quality",

        description: "High-quality ceramic with vibrant long-lasting prints.",

        icon: Gem

    },

    {

        id: 4,

        title: "Secure Checkout",

        description: "100% secure payments with trusted providers.",

        icon: ShieldCheck

    }

];