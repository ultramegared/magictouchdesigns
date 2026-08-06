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

import { navigation } from "../../../constants/navigation";

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

                                key={item.id}

                                href={item.path}

                            >

                                {item.label}

                            </a>

                        )

                    )

                }

            </nav>

            <div>

                <button>

                    🔍

                </button>

                <button>

                    👤

                </button>

                <button>

                    🛒

                </button>

                <button>

                    EN

                </button>

                <span>

                    |

                </span>

                <button>

                    ES

                </button>

            </div>

        </header>

    );

}

export default Header;