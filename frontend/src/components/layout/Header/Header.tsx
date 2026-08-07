/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: Header.tsx
 * Module: Layout
 * Language: TypeScript React
 * Description:
 * Main website header.
 * ================================================================
 */

import "./Header.css";

import {
    Search,
    User,
    ShoppingCart,
    Menu
} from "lucide-react";

import { NavLink } from "react-router-dom";

import { APP_CONFIG } from "../../../constants/config";
import { navigation } from "../../../constants/navigation";

function Header() {

    return (

        <header className="header">

            <div className="header__container">

                <NavLink
                    to="/"
                    className="header__brand"
                >

                    <img
                        src={APP_CONFIG.logo}
                        alt={APP_CONFIG.companyName}
                        className="header__logo"
                    />

                    <div className="header__brand-text">

                        <span className="header__brand-title">

                            MAGIC TOUCH

                        </span>

                        <span className="header__brand-subtitle">

                            DESIGNS

                        </span>

                    </div>

                </NavLink>

                <nav className="header__nav">

                    {

                        navigation.map((item) => (

                            <NavLink

                                key={item.id}

                                to={item.path}

                                className={({ isActive }) =>

                                    item.label === "Customize"

                                        ? `header__link header__link--cta ${isActive ? "header__link--active" : ""}`

                                        : `header__link ${isActive ? "header__link--active" : ""}`

                                }

                            >

                                {item.label}

                            </NavLink>

                        ))

                    }

                </nav>

                <div className="header__actions">

                    <button
                        className="header__icon"
                        aria-label="Search"
                    >
                        <Search size={20} />
                    </button>

                    <button
                        className="header__icon"
                        aria-label="Account"
                    >
                        <User size={20} />
                    </button>

                    <button
                        className="header__icon header__cart"
                        aria-label="Shopping Cart"
                    >
                        <ShoppingCart size={20} />
                        <span>0</span>
                    </button>

                    <div className="header__language">

                        <button className="header__language--active">

                            EN

                        </button>

                        <span>|</span>

                        <button>

                            ES

                        </button>

                    </div>

                    <button
                        className="header__menu"
                        aria-label="Menu"
                    >
                        <Menu size={24} />
                    </button>

                </div>

            </div>

        </header>

    );

}

export default Header;