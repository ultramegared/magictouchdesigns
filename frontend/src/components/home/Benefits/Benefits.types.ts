/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: Benefits.types.ts
 * Module: Home
 * Language: TypeScript
 * Description:
 * Benefits Section Types.
 * ================================================================
 */

import type { LucideIcon } from "lucide-react";

export interface Benefit {

    id: number;

title: {
    en: string;
    es: string;
};

description: {
    en: string;
    es: string;
};

    icon: LucideIcon;

}