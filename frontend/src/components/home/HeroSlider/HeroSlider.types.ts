/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: HeroSlider.types.ts
 * Module: Home
 * Language: TypeScript
 * Description:
 * Hero Slider Types.
 * ================================================================
 */

export type HeroSlideKey =
    | "mug"
    | "cap"
    | "shirt";

export interface HeroSlide {

    id: number;

    translationKey: HeroSlideKey;

    image: string;

    background: string;

}