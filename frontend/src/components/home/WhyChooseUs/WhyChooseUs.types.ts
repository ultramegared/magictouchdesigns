/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: WhyChooseUs.types.ts
 * Module: Home
 * Language: TypeScript
 * Description:
 * Why Choose Us Types.
 * ================================================================
 */

import type { LucideIcon } from "lucide-react";

export interface WhyChooseUsBenefit {

    id: number;

    title: string;

    description: string;

    icon: LucideIcon;

}

export interface WhyChooseUsStep {

    id: number;

    title: string;

    description: string;

    image: string;

}