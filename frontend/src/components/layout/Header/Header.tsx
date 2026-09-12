import "./Header.css";
import { useEffect, useState } from "react";
import { Search, User, ShoppingCart, Menu, X, ShoppingBag, Star, LogOut, ChevronDown } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { getCartItems } from "../../../utils/cart";
import { navigation } from "../../../constants/navigation";
import { useLanguage } from "../../../contexts/LanguageContext";
import { translations } from "../../../translations";
import { apiRequest } from "../../../services/api";
import UserLoginPopover, { type HeaderUser } from "./UserLoginPopover";

interface AuthenticatedUser { id: string; username: string; first_name: string; last_name: string; email: string; role: string; is_active: boolean; created_at: string; updated_at: string; }
interface LocalizedText { en: string; es: string; }
interface SettingsData { websiteName: string; browserTitle: string; logoUrl: string | null; config?: { websiteName?: LocalizedText; browserTitle?: LocalizedText }; }

const formatBrandName = (websiteName: string): { title: string; subtitle: string } => { const normalizedName = websiteName.trim(); if (!normalizedName) return { title: "MAGIC TOUCH", subtitle: "DESIGNS" }; const words = normalizedName.split(/\s+/); if (words.length === 1) return { title: words[0].toUpperCase(), subtitle: "" }; return { title: words.slice(0, -1).join(" ").toUpperCase(), subtitle: words[words.length - 1].toUpperCase() }; };
const localized = (value: LocalizedText | undefined, language: "en" | "es", fallback: string) => { const selected = language === "es" ? value?.es : value?.en; return String(selected || value?.en || fallback); };

function Header() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [cartCount, setCartCount] = useState(0);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(null);
    const [accountMenuOpen, setAccountMenuOpen] = useState(false);
    const [loginPopoverOpen, setLoginPopoverOpen] = useState(false);
    const [websiteName, setWebsiteName] = useState("");
    const [localizedWebsiteName, setLocalizedWebsiteName] = useState<LocalizedText | undefined>();
    const [localizedBrowserTitle, setLocalizedBrowserTitle] = useState<LocalizedText | undefined>();
    const [logoUrl, setLogoUrl] = useState("");
    const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);
    const navigate = useNavigate();
    const { language, setLanguage } = useLanguage();
    const t = translations[language];
    const brand = formatBrandName(localized(localizedWebsiteName, language, websiteName));
    const getUserInitials = (user: AuthenticatedUser) => { const initials = `${user.first_name?.trim().charAt(0).toUpperCase() || ""}${user.last_name?.trim().charAt(0).toUpperCase() || ""}`; return initials || user.username.slice(0, 2).toUpperCase(); };
    useEffect(() => { const updateMobileView = () => setIsMobileView(window.innerWidth <= 768); updateMobileView(); window.addEventListener("resize", updateMobileView); return () => window.removeEventListener("resize", updateMobileView); }, []);
    useEffect(() => { const loadSettings = async () => { try { const result = await apiRequest<{ status: string; settings: SettingsData }>(`/api/settings?public_refresh=${Date.now()}`, { cache: "no-store" }); if (result.settings?.websiteName) setWebsiteName(result.settings.websiteName); setLocalizedWebsiteName(result.settings?.config?.websiteName); setLocalizedBrowserTitle(result.settings?.config?.browserTitle); setLogoUrl(result.settings?.logoUrl || ""); } catch (error) { setLogoUrl(""); console.error("Unable to load website settings:", error); } }; void loadSettings(); }, []);
    useEffect(() => { const title = localized(localizedBrowserTitle, language, "Magic Touch Designs | Personalized Gifts & Designs"); document.title = title; }, [language, localizedBrowserTitle]);
    useEffect(() => { const updateCartCount = () => setCartCount(getCartItems().reduce((sum, item) => sum + item.quantity, 0)); updateCartCount(); window.addEventListener("magic-touch-cart-updated", updateCartCount); return () => window.removeEventListener("magic-touch-cart-updated", updateCartCount); }, []);
    useEffect(() => { const loadCurrentUser = async () => { const token = localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token"); if (!token) { setCurrentUser(null); return; } try { const result = await apiRequest<{ status: string; user: AuthenticatedUser }>("/api/user/me", { headers: { Authorization: `Bearer ${token}` } }); setCurrentUser(result.user); localStorage.setItem("auth_user", JSON.stringify(result.user)); } catch (error) { console.error("Unable to load authenticated user:", error); localStorage.removeItem("auth_token"); sessionStorage.removeItem("auth_token"); localStorage.removeItem("auth_user"); setCurrentUser(null); } }; void loadCurrentUser(); }, []);

    const toggleAccountMenu = () => { if (currentUser) { setAccountMenuOpen(previous => !previous); setLoginPopoverOpen(false); } else { setLoginPopoverOpen(previous => !previous); setAccountMenuOpen(false); } };
    const handleAuthenticated = (user: HeaderUser) => { setCurrentUser(user); setLoginPopoverOpen(false); };
    const openAccountPage = () => { setAccountMenuOpen(false); navigate(currentUser?.role === "ADMIN" ? "/admin" : "/account"); };
    const openOrders = () => { setAccountMenuOpen(false); navigate("/account/orders"); };
    const openReviews = () => { setAccountMenuOpen(false); navigate("/account/reviews"); };
    const handleLogout = () => { localStorage.removeItem("auth_token"); sessionStorage.removeItem("auth_token"); localStorage.removeItem("auth_user"); setCurrentUser(null); setAccountMenuOpen(false); navigate("/"); };

    return (
        <header className="header">
            <div className="header__container">
                <NavLink to="/" className="header__brand" onClick={() => { setMenuOpen(false); setAccountMenuOpen(false); setLoginPopoverOpen(false); }}>
                    {logoUrl && <img src={logoUrl} alt={localized(localizedWebsiteName, language, websiteName)} className="header__logo" />}
                    <div className="header__brand-text"><span className="header__brand-title">{brand.title}</span>{brand.subtitle && <span className="header__brand-subtitle">{brand.subtitle}</span>}</div>
                </NavLink>
                <nav className="header__nav">{navigation.map(item => <NavLink key={item.id} to={item.path} className={({ isActive }) => item.label === "Customize" ? `header__link header__link--cta ${isActive ? "header__link--active" : ""}` : `header__link ${isActive ? "header__link--active" : ""}`}>{item.label === "Shop" ? t.navigation.shop : item.label === "Company" ? t.navigation.company : item.label === "Support" ? t.navigation.support : item.label === "Home" ? t.navigation.home : item.label === "Products" ? t.navigation.products : item.label === "Collections" ? t.navigation.collections : item.label === "Customize" ? t.navigation.customize : item.label === "Contact" ? t.navigation.contact : item.label}</NavLink>)}</nav>
                <div className="header__actions">
                    <button type="button" className="header__icon" aria-label={language === "es" ? "Buscar" : "Search"} onClick={() => setSearchOpen(previous => !previous)}><Search size={20} /></button>
                    {searchOpen && <div className="header__search"><input type="text" value={searchQuery} onChange={event => setSearchQuery(event.target.value)} onKeyDown={event => { if (event.key === "Enter") { navigate(`/products?search=${encodeURIComponent(searchQuery)}`); setSearchOpen(false); } }} placeholder={language === "es" ? "Buscar productos..." : "Search products..."} aria-label={language === "es" ? "Buscar productos" : "Search products"} autoFocus /></div>}
                    <div className="header__account">
                        <button type="button" className={`header__account-trigger ${currentUser ? "header__account-trigger--authenticated" : ""}`} aria-label={currentUser ? `${language === "es" ? "Cuenta" : "Account"}: ${currentUser.username}` : language === "es" ? "Cuenta" : "Account"} aria-expanded={currentUser ? accountMenuOpen : loginPopoverOpen} onClick={toggleAccountMenu}><span className="header__account-icon"><User size={20} /></span>{currentUser && <span className="header__username">{isMobileView ? getUserInitials(currentUser) : currentUser.username}</span>}{currentUser && <ChevronDown size={15} className={`header__account-chevron ${accountMenuOpen ? "header__account-chevron--open" : ""}`} />}</button>
                        {!currentUser && loginPopoverOpen && <UserLoginPopover onAuthenticated={handleAuthenticated} onClose={() => setLoginPopoverOpen(false)} />}
                        {currentUser && accountMenuOpen && <div className="header__account-menu"><div className="header__account-user"><div className="header__account-avatar"><User size={18} /></div><div className="header__account-user-info"><strong>{currentUser.username}</strong><span>{currentUser.email}</span></div></div><div className="header__account-divider" /><button type="button" className="header__account-item" onClick={openAccountPage}><User size={17} /><span>{language === "es" ? "Mi cuenta" : "My account"}</span></button><button type="button" className="header__account-item" onClick={openOrders}><ShoppingBag size={17} /><span>{language === "es" ? "Últimas compras" : "Recent purchases"}</span></button><button type="button" className="header__account-item" onClick={openReviews}><Star size={17} /><span>{language === "es" ? "Mis reviews" : "My reviews"}</span></button><div className="header__account-divider" /><button type="button" className="header__account-item header__account-item--logout" onClick={handleLogout}><LogOut size={17} /><span>{language === "es" ? "Cerrar sesión" : "Sign out"}</span></button></div>}
                    </div>
                    <button type="button" className="header__icon header__cart" aria-label={language === "es" ? "Carrito de compras" : "Shopping Cart"} onClick={() => navigate("/cart")}><ShoppingCart size={20} /><span>{cartCount}</span></button>
                    <div className="header__language"><button type="button" className={language === "en" ? "header__language--active" : ""} onClick={() => setLanguage("en")} aria-pressed={language === "en"}>EN</button><span>|</span><button type="button" className={language === "es" ? "header__language--active" : ""} onClick={() => setLanguage("es")} aria-pressed={language === "es"}>ES</button></div>
                    <button type="button" className="header__menu" aria-label={language === "es" ? "Menú" : "Menu"} onClick={() => setMenuOpen(previous => !previous)}>{menuOpen ? <X size={24} /> : <Menu size={24} />}</button>
                </div>
            </div>
            <nav className={`header__mobile ${menuOpen ? "header__mobile--open" : ""}`}>
                {navigation.map(item => <NavLink key={item.id} to={item.path} className="header__mobile-link" onClick={() => setMenuOpen(false)}>{item.label === "Home" ? t.navigation.home : item.label === "Products" ? t.navigation.products : item.label === "Collections" ? t.navigation.collections : item.label === "Customize" ? t.navigation.customize : item.label === "Contact" ? t.navigation.contact : item.label}</NavLink>)}
                {currentUser && <div className="header__mobile-account"><button type="button" className="header__mobile-account-user" onClick={() => setAccountMenuOpen(previous => !previous)}><User size={18} /><span>{currentUser.username}</span><ChevronDown size={15} className={accountMenuOpen ? "header__account-chevron--open" : ""} /></button>{accountMenuOpen && <div className="header__mobile-account-menu"><button type="button" onClick={openAccountPage}><User size={16} />{language === "es" ? "Mi cuenta" : "My account"}</button><button type="button" onClick={openOrders}><ShoppingBag size={16} />{language === "es" ? "Últimas compras" : "Recent purchases"}</button><button type="button" onClick={openReviews}><Star size={16} />{language === "es" ? "Mis reviews" : "My reviews"}</button><button type="button" className="header__mobile-account-logout" onClick={handleLogout}><LogOut size={16} />{language === "es" ? "Cerrar sesión" : "Sign out"}</button></div>}</div>}
                <div className="header__mobile-language"><button type="button" className={language === "en" ? "header__language--active" : ""} onClick={() => setLanguage("en")} aria-pressed={language === "en"}>EN</button><span>|</span><button type="button" className={language === "es" ? "header__language--active" : ""} onClick={() => setLanguage("es")} aria-pressed={language === "es"}>ES</button></div>
            </nav>
        </header>
    );
}
export default Header;
