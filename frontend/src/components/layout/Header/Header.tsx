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

import {
    useEffect,
    useState,
} from "react";

import {
    Search,
    User,
    ShoppingCart,
    Menu,
    X,
    ShoppingBag,
    Star,
    LogOut,
    ChevronDown,
} from "lucide-react";

import {
    NavLink,
    useNavigate,
} from "react-router-dom";

import {
    getCartItems,
} from "../../../utils/cart";

import {
    APP_CONFIG,
} from "../../../constants/config";

import {
    navigation,
} from "../../../constants/navigation";

import {
    useLanguage,
} from "../../../contexts/LanguageContext";

import {
    translations,
} from "../../../translations";

import {
    apiRequest,
} from "../../../services/api";


interface AuthenticatedUser {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

interface SettingsData {
    websiteName: string;
    browserTitle: string;
    logoUrl: string | null;
}

const formatBrandName = (websiteName: string): { title: string; subtitle: string } => {
    const normalizedName = websiteName.trim();
    if (!normalizedName) return { title: "MAGIC TOUCH", subtitle: "DESIGNS" };
    const words = normalizedName.split(/\s+/);
    if (words.length === 1) return { title: words[0].toUpperCase(), subtitle: "" };
    const subtitle = words[words.length - 1];
    const title = words.slice(0, -1).join(" ");
    return { title: title.toUpperCase(), subtitle: subtitle.toUpperCase() };
};

function Header() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [cartCount, setCartCount] = useState(0);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(null);
    const [accountMenuOpen, setAccountMenuOpen] = useState(false);
    const [websiteName, setWebsiteName] = useState(APP_CONFIG.companyName);
    const [logoUrl, setLogoUrl] = useState(APP_CONFIG.logo);
    const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);
    const navigate = useNavigate();
    const { language, setLanguage } = useLanguage();
    const t = translations[language];
    const brand = formatBrandName(websiteName);

    const getUserInitials = (user: AuthenticatedUser) => {
        const firstInitial = user.first_name?.trim().charAt(0).toUpperCase();
        const lastInitial = user.last_name?.trim().charAt(0).toUpperCase();
        const initials = `${firstInitial || ""}${lastInitial || ""}`;
        return initials || user.username.slice(0, 2).toUpperCase();
    };

    useEffect(() => {
        const updateMobileView = () => setIsMobileView(window.innerWidth <= 768);
        updateMobileView();
        window.addEventListener("resize", updateMobileView);
        return () => window.removeEventListener("resize", updateMobileView);
    }, []);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const result = await apiRequest<{ status: string; settings: SettingsData }>(
                    `/api/settings?public_refresh=${Date.now()}`,
                    { cache: "no-store" }
                );
                if (result.settings?.websiteName) setWebsiteName(result.settings.websiteName);
                if (result.settings?.logoUrl) setLogoUrl(result.settings.logoUrl);
                if (result.settings?.browserTitle) document.title = result.settings.browserTitle;
            } catch (error) {
                console.error("Unable to load website settings:", error);
            }
        };
        loadSettings();
    }, []);

    useEffect(() => {
        const updateCartCount = () => {
            const items = getCartItems();
            setCartCount(items.reduce((sum, item) => sum + item.quantity, 0));
        };
        updateCartCount();
        window.addEventListener("magic-touch-cart-updated", updateCartCount);
        return () => window.removeEventListener("magic-touch-cart-updated", updateCartCount);
    }, []);

    useEffect(() => {
        const loadCurrentUser = async () => {
            const token = localStorage.getItem("auth_token");
            if (!token) { setCurrentUser(null); return; }
            try {
                const result = await apiRequest<{ status: string; user: AuthenticatedUser }>("/api/user/me");
                setCurrentUser(result.user);
                localStorage.setItem("auth_user", JSON.stringify(result.user));
            } catch (error) {
                console.error("Unable to load authenticated user:", error);
                localStorage.removeItem("auth_token");
                localStorage.removeItem("auth_user");
                setCurrentUser(null);
            }
        };
        loadCurrentUser();
    }, []);

    const toggleAccountMenu = () => {
        if (!currentUser) { navigate("/login"); return; }
        setAccountMenuOpen(previous => !previous);
    };

    const openAccountPage = () => {
        setAccountMenuOpen(false);
        navigate(currentUser?.role === "ADMIN" ? "/admin" : "/account");
    };

    const openOrders = () => { setAccountMenuOpen(false); navigate("/account/orders"); };
    const openReviews = () => { setAccountMenuOpen(false); navigate("/account/reviews"); };

    const handleLogout = () => {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        setCurrentUser(null);
        setAccountMenuOpen(false);
        navigate("/login");
    };

    return (
        <header className="header">
            <div className="header__container">
                <NavLink to="/" className="header__brand" onClick={() => { setMenuOpen(false); setAccountMenuOpen(false); }}>
                    <img src={logoUrl} alt={websiteName} className="header__logo" />
                    <div className="header__brand-text">
                        <span className="header__brand-title">{brand.title}</span>
                        {brand.subtitle && <span className="header__brand-subtitle">{brand.subtitle}</span>}
                    </div>
                </NavLink>

                <nav className="header__nav">
                    {navigation.map(item => (
                        <NavLink key={item.id} to={item.path} className={({ isActive }) => item.label === "Customize" ? `header__link header__link--cta ${isActive ? "header__link--active" : ""}` : `header__link ${isActive ? "header__link--active" : ""}`}>
                            {item.label === "Shop" ? t.navigation.shop : item.label === "Company" ? t.navigation.company : item.label === "Support" ? t.navigation.support : item.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="header__actions">
                    <button type="button" className="header__icon" aria-label="Search" onClick={() => setSearchOpen(previous => !previous)}><Search size={20} /></button>
                    {searchOpen && <div className="header__search"><input type="text" value={searchQuery} onChange={event => setSearchQuery(event.target.value)} onKeyDown={event => { if (event.key === "Enter") { navigate(`/products?search=${encodeURIComponent(searchQuery)}`); setSearchOpen(false); } }} placeholder="Search products..." aria-label="Search products" autoFocus /></div>}

                    <div className="header__account">
                        <button type="button" className={`header__account-trigger ${currentUser ? "header__account-trigger--authenticated" : ""}`} aria-label={currentUser ? `Account: ${currentUser.username}` : "Account"} aria-expanded={accountMenuOpen} onClick={toggleAccountMenu}>
                            <span className="header__account-icon"><User size={20} /></span>
                            {currentUser && <span className="header__username">{isMobileView ? getUserInitials(currentUser) : currentUser.username}</span>}
                            {currentUser && <ChevronDown size={15} className={`header__account-chevron ${accountMenuOpen ? "header__account-chevron--open" : ""}`} />}
                        </button>

                        {currentUser && accountMenuOpen && (
                            <div className="header__account-menu">
                                <div className="header__account-user"><div className="header__account-avatar"><User size={18} /></div><div className="header__account-user-info"><strong>{currentUser.username}</strong><span>{currentUser.email}</span></div></div>
                                <div className="header__account-divider" />
                                <button type="button" className="header__account-item" onClick={openAccountPage}><User size={17} /><span>{language === "es" ? "Mi cuenta" : "My account"}</span></button>
                                <button type="button" className="header__account-item" onClick={openOrders}><ShoppingBag size={17} /><span>{language === "es" ? "Últimas compras" : "Recent purchases"}</span></button>
                                <button type="button" className="header__account-item" onClick={openReviews}><Star size={17} /><span>{language === "es" ? "Mis reviews" : "My reviews"}</span></button>
                                <div className="header__account-divider" />
                                <button type="button" className="header__account-item header__account-item--logout" onClick={handleLogout}><LogOut size={17} /><span>{language === "es" ? "Cerrar sesión" : "Sign out"}</span></button>
                            </div>
                        )}
                    </div>

                    <button type="button" className="header__icon header__cart" aria-label="Shopping Cart" onClick={() => navigate("/cart")}><ShoppingCart size={20} /><span>{cartCount}</span></button>

                    <div className="header__language">
                        <button type="button" className={language === "en" ? "header__language--active" : ""} onClick={() => setLanguage("en")} aria-pressed={language === "en"}>EN</button>
                        <span>|</span>
                        <button type="button" className={language === "es" ? "header__language--active" : ""} onClick={() => setLanguage("es")} aria-pressed={language === "es"}>ES</button>
                    </div>

                    <button type="button" className="header__menu" aria-label="Menu" onClick={() => setMenuOpen(previous => !previous)}>{menuOpen ? <X size={24} /> : <Menu size={24} />}</button>
                </div>
            </div>

            <nav className={`header__mobile ${menuOpen ? "header__mobile--open" : ""}`}>
                {navigation.map(item => (
                    <NavLink key={item.id} to={item.path} className="header__mobile-link" onClick={() => setMenuOpen(false)}>
                        {item.label === "Home" ? t.navigation.home : item.label === "Products" ? t.navigation.products : item.label === "Collections" ? t.navigation.collections : item.label === "Customize" ? t.navigation.customize : item.label === "Contact" ? t.navigation.contact : item.label}
                    </NavLink>
                ))}

                {currentUser && (
                    <div className="header__mobile-account">
                        <button type="button" className="header__mobile-account-user" onClick={() => setAccountMenuOpen(previous => !previous)}><User size={18} /><span>{currentUser.username}</span><ChevronDown size={15} className={accountMenuOpen ? "header__account-chevron--open" : ""} /></button>
                        {accountMenuOpen && <div className="header__mobile-account-menu">
                            <button type="button" onClick={openAccountPage}><User size={16} />{language === "es" ? "Mi cuenta" : "My account"}</button>
                            <button type="button" onClick={openOrders}><ShoppingBag size={16} />{language === "es" ? "Últimas compras" : "Recent purchases"}</button>
                            <button type="button" onClick={openReviews}><Star size={16} />{language === "es" ? "Mis reviews" : "My reviews"}</button>
                            <button type="button" className="header__mobile-account-logout" onClick={handleLogout}><LogOut size={16} />{language === "es" ? "Cerrar sesión" : "Sign out"}</button>
                        </div>}
                    </div>
                )}

                <div className="header__mobile-language">
                    <button type="button" className={language === "en" ? "header__language--active" : ""} onClick={() => setLanguage("en")} aria-pressed={language === "en"}>EN</button>
                    <span>|</span>
                    <button type="button" className={language === "es" ? "header__language--active" : ""} onClick={() => setLanguage("es")} aria-pressed={language === "es"}>ES</button>
                </div>
            </nav>
        </header>
    );
}

export default Header;
