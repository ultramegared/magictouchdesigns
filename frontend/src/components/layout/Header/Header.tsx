/**
 * ===============================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: Header.tsx
 * Module: Frontend
 * Language: TypeScript React
 * Description:
 * Main website header.
 * ===============================================================
 */

import "./Header.css";

import {

    NavigationItem

} from "./Header.types";

const navigation: NavigationItem[] = [

    {

        label: "Home",

        path: "/"

    },

    {

        label: "Models",

        path: "/models"

    },

    {

        label: "Collections",

        path: "/collections"

    },

    {

        label: "Customize",

        path: "/customize"

    },

    {

        label: "Contact",

        path: "/contact"

    }

];

function Header() {

    return (

        <header>

            <div>

                MT

            </div>

            <nav>

                {

                    navigation.map(

                        (

                            item

                        ) => (

                            <a

                                key={item.path}

                                href={item.path}

                            >

                                {item.label}

                            </a>

                        )

                    )

                }

            </nav>

            <div>

                🔍 👤 🛒 EN | ES

            </div>

        </header>

    );

}

export default Header;