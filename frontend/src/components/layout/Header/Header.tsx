/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: Header.tsx
 * Module: Layout
 * Language: TypeScript React
 * Description:
 * Main website header with authenticated user menu.
 * ================================================================
 */

import "./Header.css";

import { useEffect, useState } from "react";

import {
    Search,
    User,
    ShoppingCart,
    Menu,
    X,
    Heart,
    ShoppingBag,
    Star,
    LogOut,
    ChevronDown
} from "lucide-react";

import { NavLink, useNavigate } from "react-router-dom";
import { getCartItems } from "../../../utils/cart";

import { APP_CONFIG } from "../../../constants/config";
import { navigation } from "../../../constants/navigation";

import {
    useLanguage,
} from "../../../contexts/LanguageContext";

import { translations } from "../../../translations";
import { apiRequest } from "../../../services/api";

interface AuthenticatedUser {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

function Header() {

    const [menuOpen, setMenuOpen] =
        useState(false);

    const [cartCount, setCartCount] =
        useState(0);

    const [searchOpen, setSearchOpen] =
        useState(false);

    const [searchQuery, setSearchQuery] =
        useState("");

    const [currentUser, setCurrentUser] =
        useState<AuthenticatedUser | null>(null);

    const [accountMenuOpen, setAccountMenuOpen] =
        useState(false);

    const navigate = useNavigate();

    const {
        language,
        setLanguage,
    } = useLanguage();

    const t = translations[language];

    /**
     * ============================================================
     * CART
     * ============================================================
     */

    useEffect(() => {

        const updateCartCount = () => {

            const items = getCartItems();

            const total = items.reduce(
                (sum, item) =>
                    sum + item.quantity,
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

    /**
     * ============================================================
     * AUTHENTICATED USER
     * ============================================================
     */

    useEffect(() => {

        const loadCurrentUser = async () => {

            const token =
                localStorage.getItem(
                    "auth_token"
                );

            if (!token) {

                setCurrentUser(null);

                return;
            }

            try {

                const result =
                    await apiRequest<{
                        status: string;
                        user: AuthenticatedUser;
                    }>("/api/user/me");

                setCurrentUser(
                    result.user
                );

                localStorage.setItem(
                    "auth_user",
                    JSON.stringify(
                        result.user
                    )
                );

            } catch (error) {

                console.error(
                    "Unable to load authenticated user:",
                    error
                );

                localStorage.removeItem(
                    "auth_token"
                );

                localStorage.removeItem(
                    "auth_user"
                );

                setCurrentUser(null);

            }

        };

        loadCurrentUser();

    }, []);

    /**
     * ============================================================
     * ACCOUNT MENU
     * ============================================================
     */

    const toggleAccountMenu = () => {

        if (!currentUser) {

            navigate("/login");

            return;
        }

        setAccountMenuOpen(
            previous => !previous
        );

    };

    /**
     * ============================================================
     * ACCOUNT NAVIGATION
     * ============================================================
     */

    const openAccountPage = () => {

        setAccountMenuOpen(false);

        navigate("/account");

    };

    const openFavorites = () => {

        setAccountMenuOpen(false);

        navigate("/account/favorites");

    };

    const openOrders = () => {

        setAccountMenuOpen(false);

        navigate("/account/orders");

    };

    const openReviews = () => {

        setAccountMenuOpen(false);

        navigate("/account/reviews");

    };

    /**
     * ============================================================
     * LOGOUT
     * ============================================================
     */

    const handleLogout = () => {

        localStorage.removeItem(
            "auth_token"
        );

        localStorage.removeItem(
            "auth_user"
        );

        setCurrentUser(null);

        setAccountMenuOpen(false);

        navigate("/login");

    };

    return (

        <header className="header">

            <div className="header__container">

                {/* ==================================================
                    BRAND
                   ================================================== */}

                <NavLink
                    to="/"
                    className="header__brand"
                    onClick={() => {

                        setMenuOpen(false);
                        setAccountMenuOpen(false);

                    }}
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

                {/* ==================================================
                    DESKTOP NAVIGATION
                   ================================================== */}

                <nav className="header__nav">

                    {

                        navigation.map(
                            (item) => (

                                <NavLink
                                    key={item.id}
                                    to={item.path}
                                    className={({
                                        isActive
                                    }) =>
                                        item.label ===
                                        "Customize"

                                            ? `header__link header__link--cta ${
                                                isActive
                                                    ? "header__link--active"
                                                    : ""
                                            }`

                                            : `header__link ${
                                                isActive
                                                    ? "header__link--active"
                                                    : ""
                                            }`
                                    }
                                >

                                    {
                                        item.label ===
                                        "Shop"

                                            ? t.navigation.shop

                                            : item.label ===
                                              "Company"

                                                ? t.navigation.company

                                                : item.label ===
                                                  "Support"

                                                    ? t.navigation.support

                                                    : item.label
                                    }

                                </NavLink>

                            )
                        )

                    }

                </nav>

                {/* ==================================================
                    HEADER ACTIONS
                   ================================================== */}

                <div className="header__actions">

                    {/* SEARCH */}

                    <button
                        type="button"
                        className="header__icon"
                        aria-label="Search"
                        onClick={() =>
                            setSearchOpen(
                                previous =>
                                    !previous
                            )
                        }
                    >

                        <Search size={20} />

                    </button>

                    {searchOpen && (

                        <div className="header__search">

                            <input
                                type="text"
                                value={searchQuery}
                                onChange={event =>
                                    setSearchQuery(
                                        event.target.value
                                    )
                                }
                                onKeyDown={event => {

                                    if (
                                        event.key ===
                                        "Enter"
                                    ) {

                                        navigate(
                                            `/products?search=${encodeURIComponent(
                                                searchQuery
                                            )}`
                                        );

                                        setSearchOpen(
                                            false
                                        );

                                    }

                                }}
                                placeholder="Search products..."
                                aria-label="Search products"
                                autoFocus
                            />

                        </div>

                    )}

                    {/* ==================================================
                        ACCOUNT
                       ================================================== */}

                    <div className="header__account">

                        <button
                            type="button"
                            className={`header__account-trigger ${
                                currentUser
                                    ? "header__account-trigger--authenticated"
                                    : ""
                            }`}
                            aria-label={
                                currentUser
                                    ? `Account: ${currentUser.username}`
                                    : "Account"
                            }
                            aria-expanded={
                                accountMenuOpen
                            }
                            onClick={
                                toggleAccountMenu
                            }
                        >

                            <span className="header__account-icon">

                                <User size={20} />

                            </span>

                            {currentUser && (

                                <span className="header__username">

                                    {currentUser.username}

                                </span>

                            )}

                            {currentUser && (

                                <ChevronDown
                                    size={15}
                                    className={`header__account-chevron ${
                                        accountMenuOpen
                                            ? "header__account-chevron--open"
                                            : ""
                                    }`}
                                />

                            )}

                        </button>

                        {/* ==================================================
                            ACCOUNT DROPDOWN
                           ================================================== */}

                        {currentUser &&
                            accountMenuOpen && (

                            <div className="header__account-menu">

                                {/* USER */}

                                <div className="header__account-user">

                                    <div className="header__account-avatar">

                                        <User
                                            size={18}
                                        />

                                    </div>

                                    <div className="header__account-user-info">

                                        <strong>
                                            {currentUser.username}
                                        </strong>

                                        <span>
                                            {currentUser.email}
                                        </span>

                                    </div>

                                </div>

                                <div className="header__account-divider" />

                                {/* ACCOUNT */}

                                <button
                                    type="button"
                                    className="header__account-item"
                                    onClick={
                                        openAccountPage
                                    }
                                >

                                    <User
                                        size={17}
                                    />

                                    <span>
                                        {language === "es"
                                            ? "Mi cuenta"
                                            : "My account"}
                                    </span>

                                </button>

                                {/* FAVORITES */}

                                <button
                                    type="button"
                                    className="header__account-item"
                                    onClick={
                                        openFavorites
                                    }
                                >

                                    <Heart
                                        size={17}
                                    />

                                    <span>
                                        {language === "es"
                                            ? "Favoritos"
                                            : "Favorites"}
                                    </span>

                                </button>

                                {/* ORDERS */}

                                <button
                                    type="button"
                                    className="header__account-item"
                                    onClick={
                                        openOrders
                                    }
                                >

                                    <ShoppingBag
                                        size={17}
                                    />

                                    <span>
                                        {language === "es"
                                            ? "Últimas compras"
                                            : "Recent purchases"}
                                    </span>

                                </button>

                                {/* REVIEWS */}

                                <button
                                    type="button"
                                    className="header__account-item"
                                    onClick={
                                        openReviews
                                    }
                                >

                                    <Star
                                        size={17}
                                    />

                                    <span>
                                        {language === "es"
                                            ? "Mis reviews"
                                            : "My reviews"}
                                    </span>

                                </button>

                                <div className="header__account-divider" />

                                {/* LOGOUT */}

                                <button
                                    type="button"
                                    className="header__account-item header__account-item--logout"
                                    onClick={
                                        handleLogout
                                    }
                                >

                                    <LogOut
                                        size={17}
                                    />

                                    <span>
                                        {language === "es"
                                            ? "Cerrar sesión"
                                            : "Sign out"}
                                    </span>

                                </button>

                            </div>

                        )}

                    </div>

                    {/* ==================================================
                        CART
                       ================================================== */}

                    <button
                        type="button"
                        className="header__icon header__cart"
                        aria-label="Shopping Cart"
                        onClick={() =>
                            navigate("/cart")
                        }
                    >

                        <ShoppingCart
                            size={20}
                        />

                        <span>
                            {cartCount}
                        </span>

                    </button>

                    {/* LANGUAGE */}

                    <div className="header__language">

                        <button
                            type="button"
                            className={
                                language === "en"
                                    ? "header__language--active"
                                    : ""
                            }
                            onClick={() =>
                                setLanguage("en")
                            }
                            aria-pressed={
                                language === "en"
                            }
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
                            onClick={() =>
                                setLanguage("es")
                            }
                            aria-pressed={
                                language === "es"
                            }
                        >
                            ES
                        </button>

                    </div>

                    {/* MOBILE MENU */}

                    <button
                        className="header__menu"
                        aria-label="Menu"
                        onClick={() =>
                            setMenuOpen(
                                previous =>
                                    !previous
                            )
                        }
                    >

                        {
                            menuOpen
                                ? <X size={24} />
                                : <Menu size={24} />
                        }

                    </button>

                </div>

            </div>

            {/* ==========================================================
                MOBILE NAVIGATION
               ========================================================== */}

            <nav
                className={`header__mobile ${
                    menuOpen
                        ? "header__mobile--open"
                        : ""
                }`}
            >

                {

                    navigation.map(
                        item => (

                            <NavLink
                                key={item.id}
                                to={item.path}
                                className="header__mobile-link"
                                onClick={() =>
                                    setMenuOpen(false)
                                }
                            >

                                {
                                    item.label ===
                                    "Home"

                                        ? t.navigation.home

                                        : item.label ===
                                          "Products"

                                            ? t.navigation.products

                                            : item.label ===
                                              "Collections"

                                                ? t.navigation.collections

                                                : item.label ===
                                                  "Customize"

                                                    ? t.navigation.customize

                                                    : item.label ===
                                                      "Contact"

                                                        ? t.navigation.contact

                                                        : item.label
                                }

                            </NavLink>

                        )
                    )

                }

                {/* MOBILE ACCOUNT */}

                {currentUser && (

                    <div className="header__mobile-account">

                        <button
                            type="button"
                            className="header__mobile-account-user"
                            onClick={() =>
                                setAccountMenuOpen(
                                    previous =>
                                        !previous
                                )
                            }
                        >

                            <User
                                size={18}
                            />

                            <span>
                                {currentUser.username}
                            </span>

                            <ChevronDown
                                size={15}
                                className={
                                    accountMenuOpen
                                        ? "header__account-chevron--open"
                                        : ""
                                }
                            />

                        </button>

                        {accountMenuOpen && (

                            <div className="header__mobile-account-menu">

                                <button
                                    type="button"
                                    onClick={
                                        openAccountPage
                                    }
                                >
                                    <User size={16} />
                                    {language === "es"
                                        ? "Mi cuenta"
                                        : "My account"}
                                </button>

                                <button
                                    type="button"
                                    onClick={
                                        openFavorites
                                    }
                                >
                                    <Heart size={16} />
                                    {language === "es"
                                        ? "Favoritos"
                                        : "Favorites"}
                                </button>

                                <button
                                    type="button"
                                    onClick={
                                        openOrders
                                    }
                                >
                                    <ShoppingBag
                                        size={16}
                                    />
                                    {language === "es"
                                        ? "Últimas compras"
                                        : "Recent purchases"}
                                </button>

                                <button
                                    type="button"
                                    onClick={
                                        openReviews
                                    }
                                >
                                    <Star size={16} />
                                    {language === "es"
                                        ? "Mis reviews"
                                        : "My reviews"}
                                </button>

                                <button
                                    type="button"
                                    className="header__mobile-account-logout"
                                    onClick={
                                        handleLogout
                                    }
                                >
                                    <LogOut
                                        size={16}
                                    />
                                    {language === "es"
                                        ? "Cerrar sesión"
                                        : "Sign out"}
                                </button>

                            </div>

                        )}

                    </div>

                )}

                {/* MOBILE LANGUAGE */}

                <div className="header__mobile-language">

                    <button
                        type="button"
                        className={
                            language === "en"
                                ? "header__language--active"
                                : ""
                        }
                        onClick={() =>
                            setLanguage("en")
                        }
                        aria-pressed={
                            language === "en"
                        }
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
                        onClick={() =>
                            setLanguage("es")
                        }
                        aria-pressed={
                            language === "es"
                        }
                    >
                        ES
                    </button>

                </div>

            </nav>

        </header>

    );
}

export default Header;