/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: WhyChooseUs.data.ts
 * Module: Home
 * Language: TypeScript
 * Description:
 * Why Choose Us Data.
 * ================================================================
 */

import {
    Diamond,
    Printer,
    ShieldCheck,
    Package
} from "lucide-react";

import type {
    WhyChooseUsBenefit,
    WhyChooseUsStep
} from "./WhyChooseUs.types";


export const whyChooseUsBenefits: WhyChooseUsBenefit[] = [

    {
        id: 1,

        title: "PREMIUM MATERIALS",

        description:
            "We use high quality ceramic mugs built to last.",

        icon: Diamond,
    },

    {
        id: 2,

        title: "EXPERT PRINTING",

        description:
            "Vibrant and long lasting prints with sharp detail.",

        icon: Printer,
    },

    {
        id: 3,

        title: "QUALITY CHECKED",

        description:
            "Every mug is carefully inspected to ensure perfection.",

        icon: ShieldCheck,
    },

    {
        id: 4,

        title: "CAREFUL PACKAGING",

        description:
            "Secure and elegant packaging to protect your mug.",

        icon: Package,
    },

];


export const whyChooseUsSteps: WhyChooseUsStep[] = [

    {
        id: 1,

        title: "YOUR IDEA",

        description:
            "You share your idea, logo, photo or special design with us.",

        image: "/images/why-choose-us/why-choose-1.png",
    },

    {
        id: 2,

        title: "WE PRINT IT",

        description:
            "Our experts print your design with precision and care.",

        image: "/images/why-choose-us/why-choose-2.png",
    },

    {
        id: 3,

        title: "QUALITY CHECK",

        description:
            "Each mug is carefully checked to guarantee the highest quality.",

        image: "/images/why-choose-us/why-choose-3.png",
    },

    {
        id: 4,

        title: "PACKED WITH CARE",

        description:
            "We pack it securely and ship it to your door with love.",

        image: "/images/why-choose-us/why-choose-4.png",
    },

];