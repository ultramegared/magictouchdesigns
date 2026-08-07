/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: HeroSlider.data.ts
 * Module: Home
 * Language: TypeScript
 * Description:
 * Hero Slider Data.
 * ================================================================
 */

import type { HeroSlide } from "./HeroSlider.types";

export const heroSlides: HeroSlide[] = [

    {

        id: 1,

        title: "YOUR STORY.\nYOUR MUG.",

subtitle:
    "Design a premium personalized mug with your name, logo or favorite photo. Crafted to create unforgettable gifts and lasting memories.",

primaryButton: "CREATE YOUR MUG",

secondaryButton: "SHOP MUGS",

        image: "/images/hero/hero-mug.png",

        background: "/images/hero/hero-background.jpg",

    },

    {

        id: 2,

        title: "CUSTOM GIFTS MADE WITH LOVE.",

        subtitle:
            "Celebrate anniversaries and unforgettable moments with personalized mugs designed just for you.",

        primaryButton: "EXPLORE COLLECTION",

        secondaryButton: "CUSTOMIZE NOW",

        image: "/images/hero/hero-slide-2.png",

        background: "/images/hero/hero-background.jpg",

    },

    {

        id: 3,

        title: "DISCOVER OUR PREMIUM COLLECTION.",

        subtitle:
            "Elegant mugs crafted with premium materials for every special occasion.",

        primaryButton: "SHOP COLLECTION",

        secondaryButton: "VIEW ALL MODELS",

        image: "/images/hero/hero-slide-3.png",

        background: "/images/hero/hero-background.jpg",

    }

];