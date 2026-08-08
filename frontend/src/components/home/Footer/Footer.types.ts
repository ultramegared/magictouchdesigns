/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: Footer.types.ts
 * Module: Layout
 * Language: TypeScript
 * Description:
 * Footer types.
 * ================================================================
 */

export interface FooterLink {
    label: string;
    href: string;
}

export interface FooterSection {
    title: string;
    links: FooterLink[];
}

export interface FooterSocial {
    name: string;
    href: string;
}

export interface FooterContent {
    shop: FooterSection;
    company: FooterSection;
    support: FooterSection;
    social: FooterSocial[];
    phone: string;
    copyright: string;
    designer: string;
}