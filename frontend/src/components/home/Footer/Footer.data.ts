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
            {
                label: "Gift Cards",
                href: "/gift-cards",
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
                href: "/privacy-policy",
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

    phone: "336 (646) 9668",

    copyright:
        "© 2026 Magic Touch Designs. All rights reserved.",

    designer:
        "Designed by ultramegared",

};