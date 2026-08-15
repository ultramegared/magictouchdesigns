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
import {
    useLanguage,
} from "../../../contexts/LanguageContext";

import { translations } from "../../../translations";

function Header() {

    const [menuOpen, setMenuOpen] = useState(false);
    const [cartCount, setCartCount] = useState(0);
    const [searchOpen, setSearchOpen] = useState(false);
const [searchQuery, setSearchQuery] = useState("");

    const navigate = useNavigate();
    const {
    language,
    setLanguage,
} = useLanguage();
const t = translations[language];
    

    useEffect(() => {

    const updateCartCount = () => {

        const items = getCartItems();

        const total = items.reduce(
            (sum, item) => sum + item.quantity,
            0
        );

        setCartCount(total);

    };

    updateCartCount();

    window.addEventListener(
        "magic-touch-cart-updated",
        updateCartCount
    );

    return () => {

        window.removeEventListener(
            "magic-touch-cart-updated",
            updateCartCount
        );

    };

}, []);
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

                                {item.label === "Shop"
    ? t.navigation.shop
    : item.label === "Company"
        ? t.navigation.company
        : item.label === "Support"
            ? t.navigation.support
            : item.label}

                            </NavLink>

                        ))

                    }

                </nav>

                <div className="header__actions">

                    <button
    type="button"
    className="header__icon"
    aria-label="Search"
    onClick={() => setSearchOpen(!searchOpen)}
>

    <Search size={20} />

</button>
 
 {searchOpen && (
    <div className="header__search">
        <input
            type="text"
            value={searchQuery}
            onChange={(event) =>
                setSearchQuery(event.target.value)
            }
            onKeyDown={(event) => {
                if (event.key === "Enter") {
                    navigate(
                        `/products?search=${encodeURIComponent(
                            searchQuery
                        )}`
                    );
                    setSearchOpen(false);
                }
            }}
            placeholder="Search products..."
            aria-label="Search products"
            autoFocus
        />
    </div>
)}

                    <button
    type="button"
    className="header__icon"
    aria-label="Account"
    onClick={() => navigate("/login")}
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

    <button
        type="button"
        className={
            language === "en"
                ? "header__language--active"
                : ""
        }
        onClick={() => setLanguage("en")}
        aria-pressed={language === "en"}
    >
        EN
    </button>

    <span>|</span>

    <button
        type="button"
        className={
            language === "es"
                ? "header__language--active"
                : ""
        }
        onClick={() => setLanguage("es")}
        aria-pressed={language === "es"}
    >
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

                            {item.label === "Home"
    ? t.navigation.home
    : item.label === "Products"
        ? t.navigation.products
        : item.label === "Collections"
            ? t.navigation.collections
            : item.label === "Customize"
                ? t.navigation.customize
                : item.label === "Contact"
                    ? t.navigation.contact
                    : item.label}
                    
                        </NavLink>

                    ))

                }

               <div className="header__mobile-language">

    <button
        type="button"
        className={
            language === "en"
                ? "header__language--active"
                : ""
        }
        onClick={() => setLanguage("en")}
        aria-pressed={language === "en"}
    >
        EN
    </button>

    <span>|</span>

    <button
        type="button"
        className={
            language === "es"
                ? "header__language--active"
                : ""
        }
        onClick={() => setLanguage("es")}
        aria-pressed={language === "es"}
    >
        ES
    </button>

</div>

            </nav>

        </header>

    );

}

export default Header;