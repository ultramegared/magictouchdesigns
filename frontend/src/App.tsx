import { lazy, Suspense, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { apiRequest } from "./services/api";
import { translations } from "./translations";
import { useLanguage } from "./contexts/LanguageContext";
import Seo from "./components/Seo";
import HomePage from "./pages/Home";
import AdminRoute from "./pages/admin/AdminRoute";

// Route pages are code-split: each page loads only when its route is visited.
// HomePage (first paint) and AdminRoute (route guard) stay eager.
const ProductsPage = lazy(() => import("./pages/Products"));
const CollectionsPage = lazy(() => import("./pages/Collections"));
const UnifiedCollectionPage = lazy(() => import("./components/collections/UnifiedCollectionPage"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const RegisterPage = lazy(() => import("./pages/Register/Register"));
const AccountPage = lazy(() => import("./pages/Account/Account"));
const OrdersPage = lazy(() => import("./pages/Account/Orders"));
const ReviewsPage = lazy(() => import("./pages/Account/Reviews"));
const CreateReviewPage = lazy(() => import("./pages/Account/CreateReview"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminReviews = lazy(() => import("./pages/admin/AdminReviews"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminCollectionsHub = lazy(() => import("./pages/admin/AdminCollectionsHub"));
const AdminCollectionProducts = lazy(() => import("./pages/admin/AdminCollectionProducts"));
const AdminSubscribers = lazy(() => import("./pages/admin/AdminSubscribers"));
const AdminContent = lazy(() => import("./pages/admin/AdminContent"));
const AdminPortfolio = lazy(() => import("./pages/admin/AdminPortfolio"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminSales = lazy(() => import("./pages/admin/AdminSales"));
const AdminMarketing = lazy(() => import("./pages/admin/AdminMarketing"));
const AdminEmailTemplates = lazy(() => import("./pages/admin/AdminEmailTemplates"));
const AdminEmailLog = lazy(() => import("./pages/admin/AdminEmailLog"));
const CustomizePage = lazy(() => import("./pages/Customize"));
const ContactPage = lazy(() => import("./pages/Contact"));
const AboutPage = lazy(() => import("./pages/About"));
const HowItWorksPage = lazy(() => import("./components/home/HowItWorks/HowItWorksPage"));
const CartPage = lazy(() => import("./pages/Cart"));
const CheckoutPage = lazy(() => import("./pages/Checkout"));
const CheckoutSuccessPage = lazy(() => import("./pages/Checkout/CheckoutSuccessPage"));
const ShippingReturnsPage = lazy(() => import("./pages/ShippingReturns"));
const FAQPage = lazy(() => import("./pages/FAQ"));
const TrackOrderPage = lazy(() => import("./pages/TrackOrder"));
const PrivacyPage = lazy(() => import("./pages/Privacy"));
const TermsOfServicePage = lazy(() => import("./pages/TermsOfService"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPassword/ForgotPassword"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPassword/ResetPassword"));


declare global {
    interface Window {
        gtag?: (...args: unknown[]) => void;
    }
}

function AnalyticsRouteTracker() {
    const location = useLocation();

    useEffect(() => {
        if (typeof window.gtag !== "function") return;
        window.gtag("event", "page_view", {
            page_path: `${location.pathname}${location.search}${location.hash}`,
            page_location: window.location.href,
            page_title: document.title,
        });
    }, [location.pathname, location.search, location.hash]);

    return null;
}

// Loads /admin-reports-export.js only inside the admin area. The script used to
// be loaded globally from index.html for every visitor; it only acts on
// /admin/reports and installs its own MutationObserver once loaded.
let adminReportsExportRequested = false;
function AdminReportsExportLoader() {
    const location = useLocation();

    useEffect(() => {
        if (adminReportsExportRequested) return;
        if (!location.pathname.startsWith("/admin")) return;
        adminReportsExportRequested = true;
        const script = document.createElement("script");
        script.src = "/admin-reports-export.js";
        script.async = true;
        document.body.appendChild(script);
    }, [location.pathname]);

    return null;
}

interface LocalizedText{en:string;es:string}
interface SiteThemeSnapshot{palette?:{primary?:string;secondary?:string;accent?:string;surface?:string;surfaceAlt?:string;text?:string;textMuted?:string;border?:string;buttonText?:string;buttonHover?:string;buttonHoverText?:string;shadow?:string;radius?:number;depth?:number};effects?:{enabled?:boolean;depth?:number;glow?:number};id?:string;name?:string}
interface SiteConfigSnapshot{websiteName?:LocalizedText;browserTitle?:LocalizedText;designerName?:LocalizedText;designerTitle?:LocalizedText;theme?:SiteThemeSnapshot}
const DEFAULT_THEME={primary:"#C89B3C",secondary:"#111111",accent:"#E5B84B",surface:"#0B0B0C",surfaceAlt:"#171717",text:"#FFFFFF",textMuted:"#9A9A9A",border:"rgba(200,155,60,.28)",buttonText:"#111111",buttonHover:"#8F6924",buttonHoverText:"#FFFFFF",shadow:"rgba(0,0,0,.42)",radius:10,depth:.55,glow:.08};
const applySiteTheme=(theme:SiteThemeSnapshot|undefined)=>{const p={...DEFAULT_THEME,...(theme?.palette||{})};const e={enabled:theme?.effects?.enabled!==false,depth:Number(theme?.effects?.depth??.55),glow:Number(theme?.effects?.glow??.08)};const root=document.documentElement;root.dataset.jqyTheme=theme?.id||"default";const vars:Record<string,string>={"--skin-primary":p.primary,"--skin-secondary":p.secondary,"--skin-accent":p.accent,"--skin-surface":p.surface,"--skin-surface-alt":p.surfaceAlt,"--skin-text":p.text,"--skin-text-muted":p.textMuted,"--skin-border":p.border,"--skin-button-text":p.buttonText,"--skin-button-hover":p.buttonHover,"--skin-button-hover-text":p.buttonHoverText,"--skin-shadow":p.shadow,"--skin-radius":String(p.radius),"--skin-depth":String(e.depth),"--skin-glow":String(e.glow),"--skin-effects":e.enabled?"1":"0"};Object.entries(vars).forEach(([k,v])=>root.style.setProperty(k,v));};
const pickLocalized=(value:LocalizedText|undefined,language:"en"|"es",fallback:string)=>String((language==="es"?value?.es:value?.en)||value?.en||fallback);
function App(){const{language}=useLanguage();const[ready,setReady]=useState(false);useEffect(()=>{let cancelled=false;const hydrate=(config:SiteConfigSnapshot|undefined,websiteName="",browserTitle="")=>{if(cancelled||!config)return;localStorage.setItem("mtd_site_config",JSON.stringify(config));applySiteTheme(config.theme);document.title=pickLocalized(config.browserTitle,language,browserTitle);const dictionaries=translations as any;const year=new Date().getFullYear();for(const lang of ["en","es"] as const){if(dictionaries[lang]?.footer){dictionaries[lang].footer.copyright=`© ${year} ${pickLocalized(config.websiteName,lang,websiteName)}. All rights reserved.`;const cfg=config;dictionaries[lang].footer.designer=lang==="es"?`Diseñado por ${pickLocalized(cfg?.designerName,"es","J.Q")} - ${pickLocalized(cfg?.designerTitle,"es","Webmaster")}`:`Designed by ${pickLocalized(cfg?.designerName,"en","J.Q")} - ${pickLocalized(cfg?.designerTitle,"en","Webmaster")}`}}};
apiRequest<{status:string;settings:{websiteName:string;browserTitle:string;config:SiteConfigSnapshot}}>(`/api/settings?app_refresh=${Date.now()}`,{cache:"no-store"}).then(({settings})=>hydrate(settings.config,settings.websiteName,settings.browserTitle)).catch(()=>{const cached=localStorage.getItem("mtd_site_config");if(cached){try{hydrate(JSON.parse(cached));}catch{}}}).finally(()=>{if(!cancelled)setReady(true)});
const onThemeUpdate=()=>{try{const cached=localStorage.getItem("mtd_site_config");if(cached)hydrate(JSON.parse(cached));}catch{}};
window.addEventListener("mtd-site-config-updated",onThemeUpdate);
return()=>{cancelled=true;window.removeEventListener("mtd-site-config-updated",onThemeUpdate)}},[language]);if(!ready)return null;return <BrowserRouter><AnalyticsRouteTracker/><AdminReportsExportLoader/><Seo/><Suspense fallback={<div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh"}}>{language==="es"?"Cargando…":"Loading…"}</div>}><Routes>
<Route path="/" element={<HomePage/>}/><Route path="/admin-login" element={<AdminLogin/>}/><Route path="/register" element={<RegisterPage/>}/><Route path="/forgot-password" element={<ForgotPasswordPage/>}/><Route path="/reset-password" element={<ResetPasswordPage/>}/>
<Route path="/account" element={<AccountPage/>}/><Route path="/account/orders" element={<OrdersPage/>}/><Route path="/account/reviews" element={<ReviewsPage/>}/><Route path="/account/reviews/create" element={<CreateReviewPage/>}/>
<Route path="/admin" element={<AdminRoute><AdminDashboard/></AdminRoute>}/><Route path="/admin/marketing" element={<AdminRoute><AdminMarketing/></AdminRoute>}/><Route path="/admin/email-templates" element={<AdminRoute><AdminEmailTemplates/></AdminRoute>}/><Route path="/admin/email-log" element={<AdminRoute><AdminEmailLog/></AdminRoute>}/><Route path="/admin/sales" element={<AdminRoute><AdminSales/></AdminRoute>}/><Route path="/admin/reviews" element={<AdminRoute><AdminReviews/></AdminRoute>}/><Route path="/admin/users" element={<AdminRoute><AdminUsers/></AdminRoute>}/><Route path="/admin/products" element={<AdminRoute><AdminProducts/></AdminRoute>}/><Route path="/admin/collections" element={<AdminRoute><AdminCollectionsHub/></AdminRoute>}/><Route path="/admin/collections/:slug" element={<AdminRoute><AdminCollectionProducts/></AdminRoute>}/><Route path="/admin/subscribers" element={<AdminRoute><AdminSubscribers/></AdminRoute>}/><Route path="/admin/content" element={<AdminRoute><AdminContent/></AdminRoute>}/><Route path="/admin/portfolio" element={<AdminRoute><AdminPortfolio/></AdminRoute>}/><Route path="/admin/orders" element={<AdminRoute><AdminOrders/></AdminRoute>}/><Route path="/admin/reports" element={<AdminRoute><AdminReports/></AdminRoute>}/><Route path="/admin/settings" element={<AdminRoute><AdminSettings/></AdminRoute>}/>
<Route path="/products" element={<ProductsPage/>}/><Route path="/collections" element={<CollectionsPage/>}/><Route path="/collections/love-romance" element={<UnifiedCollectionPage slug="love-romance"/>}/><Route path="/collections/family-memories" element={<UnifiedCollectionPage slug="family-memories"/>}/><Route path="/collections/business-branding" element={<UnifiedCollectionPage slug="business-branding"/>}/><Route path="/collections/special-occasions" element={<UnifiedCollectionPage slug="special-occasions"/>}/><Route path="/customize" element={<CustomizePage/>}/><Route path="/how-it-works" element={<HowItWorksPage/>}/><Route path="/contact" element={<ContactPage/>}/><Route path="/about" element={<AboutPage/>}/><Route path="/cart" element={<CartPage/>}/><Route path="/checkout" element={<CheckoutPage/>}/><Route path="/checkout/success" element={<CheckoutSuccessPage/>}/><Route path="/shipping-returns" element={<ShippingReturnsPage/>}/><Route path="/faqs" element={<FAQPage/>}/><Route path="/track-order" element={<TrackOrderPage/>}/><Route path="/privacy" element={<PrivacyPage/>}/><Route path="/terms-of-service" element={<TermsOfServicePage/>}/>
</Routes></Suspense></BrowserRouter>}
export default App;
