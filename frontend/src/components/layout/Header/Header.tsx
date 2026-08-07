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

import {

    NavLink

} from "react-router-dom";

import {

    APP_CONFIG

} from "../../../constants/config";

import {

    navigation

} from "../../../constants/navigation";

function Header() {

    return (

        <header className="header">

            <div className="header__container">

                <NavLink
                    to="/"
                    className="header__logo"
                >

                    <img
                        src={APP_CONFIG.logo}
                        alt={APP_CONFIG.companyName}
                    />

                </NavLink>

                <nav className="header__nav">

                    {

                        navigation.map(

                            (

                                item

                            ) => (

                                <NavLink

                                    key={item.id}

                                    to={item.path}

                                    className={({ isActive }) => {

                                        let classes = "header__link";

                                        if (isActive) {

                                            classes += " header__link--active";

                                        }

                                        return classes;

                                    }}

                                >

                                    {item.label}

                                </NavLink>

                            )

                        )

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

                        <span>

                            0

                        </span>

                    </button>

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