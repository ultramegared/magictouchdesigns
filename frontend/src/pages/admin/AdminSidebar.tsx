/**
 * ================================================================
 * Project: Magic Touch Designs
 * Author: ultramegared
 * File: AdminSidebar.tsx
 * Module: Administrator Panel
 * Language: TypeScript React
 * Description:
 * Responsive navigation sidebar for the administrative panel.
 * Languages: English (en) | Español (es)
 * ================================================================
 */

import {
    useState,
} from "react";

import {
    LayoutDashboard,
    ShoppingBag,
    Package,
    Users,
    Star,
    Image,
    BarChart3,
    Settings,
    Store,
    Menu,
    X,
    LogOut,
    FolderKanban,
    Mail,
} from "lucide-react";

import {
    NavLink,
    useNavigate,
} from "react-router-dom";

import "./AdminSidebar.css";


/* ===============================================================
   TYPES
================================================================ */

interface AdminSidebarProps {

    username?: string;

}


/* ===============================================================
   COMPONENT
================================================================ */

function AdminSidebar({
    username,
}: AdminSidebarProps) {


    /* ============================================================
       MOBILE MENU
    ============================================================ */

    const [
        mobileMenuOpen,
        setMobileMenuOpen,
    ] = useState(
        false
    );


    const navigate =
        useNavigate();


    /* ============================================================
       CLOSE MOBILE MENU
    ============================================================ */

    const closeMobileMenu =
        () => {

            setMobileMenuOpen(
                false
            );

        };


    /* ============================================================
       LOGOUT
    ============================================================ */

    const handleLogout =
        () => {

            localStorage.removeItem(
                "auth_token"
            );


            localStorage.removeItem(
                "auth_user"
            );


            closeMobileMenu();


            navigate(
                "/login"
            );

        };


    /* ============================================================
       RENDER
    ============================================================ */

    return (

        <>


            {/* ======================================================
                MOBILE TOP BAR
               ====================================================== */}

            <header
                className="admin-sidebar-mobile-header"
            >

                <button

                    type="button"

                    className="admin-sidebar-mobile-menu"

                    aria-label="Open administrator menu"

                    onClick={() =>

                        setMobileMenuOpen(
                            true
                        )

                    }

                >

                    <Menu
                        size={24}
                    />

                </button>


                <div
                    className="admin-sidebar-mobile-brand"
                >

                    <strong>

                        MAGIC TOUCH

                    </strong>


                    <span>

                        ADMIN

                    </span>

                </div>


                <div
                    className="admin-sidebar-mobile-user"
                >

                    {

                        username

                            ? username
                                .slice(
                                    0,
                                    2
                                )
                                .toUpperCase()

                            : "AD"

                    }

                </div>

            </header>


            {/* ======================================================
                MOBILE OVERLAY
               ====================================================== */}

            {

                mobileMenuOpen && (

                    <button

                        type="button"

                        className="admin-sidebar-overlay"

                        aria-label="Close administrator menu"

                        onClick={
                            closeMobileMenu
                        }

                    />

                )

            }


            {/* ======================================================
                SIDEBAR
               ====================================================== */}

            <aside

                className={`admin-sidebar ${
                    mobileMenuOpen

                        ? "admin-sidebar--open"

                        : ""
                }`}

            >


                {/* ==================================================
                    BRAND
                   ================================================== */}

                <div
                    className="admin-sidebar__brand"
                >

                    <div
                        className="admin-sidebar__brand-mark"
                    >

                        MTD

                    </div>


                    <div
                        className="admin-sidebar__brand-text"
                    >

                        <strong>

                            MAGIC TOUCH

                        </strong>


                        <span>

                            ADMINISTRATION

                        </span>

                    </div>


                    <button

                        type="button"

                        className="admin-sidebar__close"

                        aria-label="Close administrator menu"

                        onClick={
                            closeMobileMenu
                        }

                    >

                        <X
                            size={22}
                        />

                    </button>

                </div>


                {/* ==================================================
                    USER
                   ================================================== */}

                <div
                    className="admin-sidebar__user"
                >

                    <div
                        className="admin-sidebar__user-avatar"
                    >

                        {

                            username

                                ? username
                                    .slice(
                                        0,
                                        2
                                    )
                                    .toUpperCase()

                                : "AD"

                        }

                    </div>


                    <div
                        className="admin-sidebar__user-info"
                    >

                        <strong>

                            {
                                username
                                || "Administrator"
                            }

                        </strong>


                        <span>

                            Administrator

                        </span>

                    </div>

                </div>


                {/* ==================================================
                    NAVIGATION
                   ================================================== */}

                <nav
                    className="admin-sidebar__nav"
                >


                    {/* DASHBOARD */}

                    <NavLink

                        to="/admin"

                        end

                        className={
                            ({
                                isActive,
                            }) =>

                                `admin-sidebar__link ${
                                    isActive

                                        ? "admin-sidebar__link--active"

                                        : ""
                                }`

                        }

                        onClick={
                            closeMobileMenu
                        }

                    >

                        <LayoutDashboard
                            size={20}
                        />


                        <span>

                            Dashboard

                        </span>

                    </NavLink>


                    {/* SALES */}

                    <NavLink

                        to="/admin/sales"

                        className="admin-sidebar__link"

                        onClick={
                            closeMobileMenu
                        }

                    >

                        <BarChart3
                            size={20}
                        />


                        <span>

                            Sales

                        </span>

                    </NavLink>


                    {/* ORDERS */}

                    <NavLink

                        to="/admin/orders"

                        className="admin-sidebar__link"

                        onClick={
                            closeMobileMenu
                        }

                    >

                        <ShoppingBag
                            size={20}
                        />


                        <span>

                            Orders

                        </span>

                    </NavLink>


                    {/* PRODUCTS */}

                    <NavLink

                        to="/admin/products"

                        className="admin-sidebar__link"

                        onClick={
                            closeMobileMenu
                        }

                    >

                        <Package
                            size={20}
                        />


                        <span>

                            Products

                        </span>

                    </NavLink>


                    {/* COLLECTIONS */}

                    <NavLink

                        to="/admin/collections"

                        className="admin-sidebar__link"

                        onClick={
                            closeMobileMenu
                        }

                    >

                        <FolderKanban
                            size={20}
                        />


                        <span>

                            Collections

                        </span>

                    </NavLink>


                    {/* USERS */}

                    <NavLink

                        to="/admin/users"

                        className="admin-sidebar__link"

                        onClick={
                            closeMobileMenu
                        }

                    >

                        <Users
                            size={20}
                        />


                        <span>

                            Users

                        </span>

                    </NavLink>


                    {/* SUBSCRIBERS */}

                    <NavLink

                        to="/admin/subscribers"

                        className="admin-sidebar__link"

                        onClick={
                            closeMobileMenu
                        }

                    >

                        <Mail
                            size={20}
                        />


                        <span>

                            Subscribers

                        </span>

                    </NavLink>


                    {/* REVIEWS */}

                    <NavLink

                        to="/admin/reviews"

                        className="admin-sidebar__link"

                        onClick={
                            closeMobileMenu
                        }

                    >

                        <Star
                            size={20}
                        />


                        <span>

                            Reviews

                        </span>

                    </NavLink>


                    {/* CONTENT */}

                    <NavLink

                        to="/admin/content"

                        className="admin-sidebar__link"

                        onClick={
                            closeMobileMenu
                        }

                    >

                        <Image
                            size={20}
                        />


                        <span>

                            Content

                        </span>

                    </NavLink>


                    {/* REPORTS */}

                    <NavLink

                        to="/admin/reports"

                        className="admin-sidebar__link"

                        onClick={
                            closeMobileMenu
                        }

                    >

                        <BarChart3
                            size={20}
                        />


                        <span>

                            Reports

                        </span>

                    </NavLink>


                    {/* SETTINGS */}

                    <NavLink

                        to="/admin/settings"

                        className="admin-sidebar__link"

                        onClick={
                            closeMobileMenu
                        }

                    >

                        <Settings
                            size={20}
                        />


                        <span>

                            Settings

                        </span>

                    </NavLink>

                </nav>


                {/* ==================================================
                    BOTTOM
                   ================================================== */}

                <div
                    className="admin-sidebar__bottom"
                >


                    {/* VIEW STORE */}

                    <button

                        type="button"

                        className="admin-sidebar__store"

                        onClick={() => {

                            closeMobileMenu();


                            navigate(
                                "/"
                            );

                        }}

                    >

                        <Store
                            size={19}
                        />


                        <span>

                            View Store

                        </span>

                    </button>


                    {/* LOGOUT */}

                    <button

                        type="button"

                        className="admin-sidebar__logout"

                        onClick={
                            handleLogout
                        }

                    >

                        <LogOut
                            size={19}
                        />


                        <span>

                            Sign Out

                        </span>

                    </button>

                </div>

            </aside>

        </>

    );

}


export default AdminSidebar;