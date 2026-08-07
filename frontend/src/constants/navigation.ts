/**
 * ===============================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: navigation.ts
 * Module: Frontend
 * Language: TypeScript
 * Description:
 * Global navigation configuration.
 * ===============================================================
 */

import type { NavigationItem } from "../types/navigation";

export const navigation: NavigationItem[] = [

    {
        id: 1,
        label: "Home",
        path: "/"
    },

{
    id: 2,
    label: "Products",
    path: "/products"
},

    {
        id: 3,
        label: "Collections",
        path: "/collections"
    },

    {
        id: 4,
        label: "Customize",
        path: "/customize"
    },

    {
        id: 5,
        label: "Contact",
        path: "/contact"
    }

];