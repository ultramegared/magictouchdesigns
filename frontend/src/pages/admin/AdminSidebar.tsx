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

import { useEffect, useState } from "react";
import { LayoutDashboard, ShoppingBag, Users, Star, Image, BarChart3, Settings, Store, Menu, X, LogOut, FolderKanban, Mail } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import "./AdminSidebar.css";

interface AdminSidebarProps { username?: string; }

function AdminSidebar({ username }: AdminSidebarProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const navigate = useNavigate();
    useEffect(() => { document.body.style.overflow = mobileMenuOpen ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [mobileMenuOpen]);
    const closeMobileMenu = () => { setMobileMenuOpen(false); };
    const getNavLinkClass = ({ isActive }: { isActive: boolean }) => `admin-sidebar__link ${isActive ? "admin-sidebar__link--active" : ""}`;
    const handleLogout = () => { localStorage.removeItem("auth_token"); sessionStorage.removeItem("auth_token"); localStorage.removeItem("auth_user"); sessionStorage.removeItem("auth_user"); closeMobileMenu(); navigate("/admin-login"); };
    return (
        <>
            <header className="admin-sidebar-mobile-header">
                <button type="button" className="admin-sidebar-mobile-menu" aria-label="Open administrator menu" onClick={() => setMobileMenuOpen(true)}><Menu size={24} /></button>
                <div className="admin-sidebar-mobile-brand"><strong>MAGIC TOUCH</strong><span>ADMIN</span></div>
                <div className="admin-sidebar-mobile-user">{username ? username.slice(0, 2).toUpperCase() : "AD"}</div>
            </header>
            {mobileMenuOpen && <button type="button" className="admin-sidebar-overlay" aria-label="Close administrator menu" onClick={closeMobileMenu} />}
            <aside className={`admin-sidebar ${mobileMenuOpen ? "admin-sidebar--open" : ""}`}>
                <div className="admin-sidebar__brand"><div className="admin-sidebar__brand-mark">MTD</div><div className="admin-sidebar__brand-text"><strong>MAGIC TOUCH</strong><span>ADMINISTRATION</span></div><button type="button" className="admin-sidebar__close" aria-label="Close administrator menu" onClick={closeMobileMenu}><X size={22} /></button></div>
                <div className="admin-sidebar__user"><div className="admin-sidebar__user-avatar">{username ? username.slice(0, 2).toUpperCase() : "AD"}</div><div className="admin-sidebar__user-info"><strong>{username || "Administrator"}</strong><span>Administrator</span></div></div>
                <nav className="admin-sidebar__nav">
                    <NavLink to="/admin" end className={getNavLinkClass} onClick={closeMobileMenu}><LayoutDashboard size={20} /><span>Dashboard</span></NavLink>
                    <NavLink to="/admin/sales" className={getNavLinkClass} onClick={closeMobileMenu}><BarChart3 size={20} /><span>Sales</span></NavLink>
                    <NavLink to="/admin/orders" className={getNavLinkClass} onClick={closeMobileMenu}><ShoppingBag size={20} /><span>Orders</span></NavLink>
                    <NavLink to="/admin/collections" className={getNavLinkClass} onClick={closeMobileMenu}><FolderKanban size={20} /><span>Collections</span></NavLink>
                    <NavLink to="/admin/users" className={getNavLinkClass} onClick={closeMobileMenu}><Users size={20} /><span>Users</span></NavLink>
                    <NavLink to="/admin/subscribers" className={getNavLinkClass} onClick={closeMobileMenu}><Mail size={20} /><span>Subscribers</span></NavLink>
                    <NavLink to="/admin/reviews" className={getNavLinkClass} onClick={closeMobileMenu}><Star size={20} /><span>Reviews</span></NavLink>
                    <NavLink to="/admin/content" className={getNavLinkClass} onClick={closeMobileMenu}><Image size={20} /><span>Portfolio</span></NavLink>
                    <NavLink to="/admin/reports" className={getNavLinkClass} onClick={closeMobileMenu}><BarChart3 size={20} /><span>Reports</span></NavLink>
                    <NavLink to="/admin/settings" className={getNavLinkClass} onClick={closeMobileMenu}><Settings size={20} /><span>Settings</span></NavLink>
                </nav>
                <div className="admin-sidebar__bottom">
                    <button type="button" className="admin-sidebar__store" onClick={() => { closeMobileMenu(); navigate("/"); }}><Store size={19} /><span>View Store</span></button>
                    <button type="button" className="admin-sidebar__logout" onClick={handleLogout}><LogOut size={19} /><span>Sign Out</span></button>
                </div>
            </aside>
        </>
    );
}
export default AdminSidebar;
