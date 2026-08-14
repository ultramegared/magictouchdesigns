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

        title: {
            en: "Fast Shipping",
            es: "Envío rápido",
        },

        description: {
            en: "2–5 business days directly to your door.",
            es: "De 2 a 5 días hábiles directamente hasta tu puerta.",
        },

        icon: Truck
    },

    {
        id: 2,

        title: {
            en: "Made in USA",
            es: "Hecho en EE. UU.",
        },

        description: {
            en: "Proudly designed and printed in the United States.",
            es: "Diseñado e impreso con orgullo en Estados Unidos.",
        },

        icon: Flag
    },

    {
        id: 3,

        title: {
            en: "Premium Quality",
            es: "Calidad premium",
        },

        description: {
            en: "High-quality ceramic with vibrant long-lasting prints.",
            es: "Cerámica de alta calidad con impresiones vibrantes y duraderas.",
        },

        icon: Gem
    },

    {
        id: 4,

        title: {
            en: "Secure Checkout",
            es: "Pago seguro",
        },

        description: {
            en: "100% secure payments with trusted providers.",
            es: "Pagos 100% seguros con proveedores de confianza.",
        },

        icon: ShieldCheck
    }

];