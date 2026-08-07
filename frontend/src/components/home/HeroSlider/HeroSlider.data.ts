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

    title: "WEAR YOUR\nBRAND.",

    subtitle:
        "Create premium custom caps with your logo, business name or team design. Perfect for companies, events and everyday style.",

    primaryButton: "CREATE YOUR CAP",

    secondaryButton: "SHOP CAPS",

    image: "/images/hero/hero-cap.png",

    background: "/images/hero/hero-background.jpg",
},

    {
    id: 3,

    title: "WEAR YOUR\nIDENTITY.",

    subtitle:
        "Design premium custom t-shirts with your logo, artwork or business branding. Made for teams, events and everyday style.",

    primaryButton: "CREATE YOUR SHIRT",

    secondaryButton: "SHOP T-SHIRTS",

    image: "/images/hero/hero-shirt.png",

    background: "/images/hero/hero-background.jpg",
},

];