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

function Header() {

    return (

        <header>

            <div>

                MT

            </div>

            <nav>

                <a href="/">

                    Home

                </a>

                <a href="/models">

                    Models

                </a>

                <a href="/collections">

                    Collections

                </a>

                <a href="/customize">

                    Customize

                </a>

                <a href="/contact">

                    Contact

                </a>

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