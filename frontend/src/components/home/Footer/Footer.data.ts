/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: Footer.data.ts
 * Module: Layout
 * Language: TypeScript
 * Description:
 * Footer content data.
 * ================================================================
 */

import type { FooterContent } from "./Footer.types";

export const footerContent: FooterContent = {

    shop: {
        title: "SHOP",
        links: [
            {
                label: "All Models",
                href: "/products",
            },
            {
                label: "Collections",
                href: "/collections",
            },
            {
                label: "Customize",
                href: "/customize",
            },
        ],
    },

    company: {
        title: "COMPANY",
        links: [
            {
                label: "About Us",
                href: "/about",
            },
            {
                label: "How It Works",
                href: "/how-it-works",
            },
            {
                label: "Shipping & Returns",
                href: "/shipping-returns",
            },
            {
                label: "FAQs",
                href: "/faqs",
            },
        ],
    },

    support: {
        title: "SUPPORT",
        links: [
            {
                label: "Contact Us",
                href: "/contact",
            },
            {
                label: "Track My Order",
                href: "/track-order",
            },
            {
                label: "Privacy Policy",
                href: "/privacy",
            },
            {
                label: "Terms of Service",
                href: "/terms-of-service",
            },
        ],
    },

    social: [
        {
            name: "Instagram",
            href: "#",
        },
        {
            name: "Facebook",
            href: "#",
        },
        {
            name: "TikTok",
            href: "#",
        },
        {
            name: "YouTube",
            href: "#",
        },
    ],

    phone: "+1 (346) 760-3007",

    copyright:
        "© 2026 Magic Touch Designs. All rights reserved.",

    designer:
        "Designed by ultramegared",

};