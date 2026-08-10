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

import { useEffect, useState } from "react";

import {
    Search,
    User,
    ShoppingCart,
    Menu,
    X
} from "lucide-react";

import { NavLink, useNavigate } from "react-router-dom";
import { getCartItems } from "../../../utils/cart";


import { APP_CONFIG } from "../../../constants/config";
import { navigation } from "../../../constants/navigation";

function Header() {

    const [menuOpen, setMenuOpen] = useState(false);
    const [cartCount, setCartCount] = useState(0);

const navigate = useNavigate();


    return (

        <header className="header">

            <div className="header__container">

                <NavLink
                    to="/"
                    className="header__brand"
                    onClick={() => setMenuOpen(false)}
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
    type="button"
    className="header__icon header__cart"
    aria-label="Shopping Cart"
    onClick={() => navigate("/cart")}
>

    <ShoppingCart size={20} />

    <span>{cartCount}</span>

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
                        onClick={() => setMenuOpen(!menuOpen)}
                    >

                        {

                            menuOpen

                                ? <X size={24} />

                                : <Menu size={24} />

                        }

                    </button>

                </div>

            </div>

                        <nav
                className={`header__mobile ${menuOpen ? "header__mobile--open" : ""}`}
            >

                {

                    navigation.map((item) => (

                        <NavLink
                            key={item.id}
                            to={item.path}
                            className="header__mobile-link"
                            onClick={() => setMenuOpen(false)}
                        >

                            {item.label}

                        </NavLink>

                    ))

                }

                <div className="header__mobile-language">

                    <button className="header__language--active">

                        EN

                    </button>

                    <span>|</span>

                    <button>

                        ES

                    </button>

                </div>

            </nav>

        </header>

    );

}

export default Header;