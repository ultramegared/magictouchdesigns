import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { apiRequest } from "./services/api";
import { translations } from "./translations";
import { useLanguage } from "./contexts/LanguageContext";
import Seo from "./components/Seo";
import HomePage from "./pages/Home";
import ProductsPage from "./pages/Products";
import CollectionsPage from "./pages/Collections";
import UnifiedCollectionPage from "./components/collections/UnifiedCollectionPage";
import AdminLogin from "./pages/admin/AdminLogin";
import RegisterPage from "./pages/Register/Register";
import AccountPage from "./pages/Account/Account";
import OrdersPage from "./pages/Account/Orders";
import ReviewsPage from "./pages/Account/Reviews";
import CreateReviewPage from "./pages/Account/CreateReview";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminReports from "./pages/admin/AdminReports";
import AdminRoute from "./pages/admin/AdminRoute";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminCollectionsHub from "./pages/admin/AdminCollectionsHub";
import AdminCollectionProducts from "./pages/admin/AdminCollectionProducts";
import AdminSubscribers from "./pages/admin/AdminSubscribers";
import AdminContent from "./pages/admin/AdminContent";
import AdminPortfolio from "./pages/admin/AdminPortfolio";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminSales from "./pages/admin/AdminSales";
import AdminMarketing from "./pages/admin/AdminMarketing";
import AdminEmailTemplates from "./pages/admin/AdminEmailTemplates";
import AdminEmailLog from "./pages/admin/AdminEmailLog";
import CustomizePage from "./pages/Customize";
import ContactPage from "./pages/Contact";
import AboutPage from "./pages/About";
import HowItWorksPage from "./components/home/HowItWorks/HowItWorksPage";
import CartPage from "./pages/Cart";
import CheckoutPage from "./pages/Checkout";
import CheckoutSuccessPage from "./pages/Checkout/CheckoutSuccessPage";
import ShippingReturnsPage from "./pages/ShippingReturns";
import FAQPage from "./pages/FAQ";
import TrackOrderPage from "./pages/TrackOrder";
import PrivacyPage from "./pages/Privacy";
import TermsOfServicePage from "./pages/TermsOfService";
import ForgotPasswordPage from "./pages/ForgotPassword/ForgotPassword";
import ResetPasswordPage from "./pages/ResetPassword/ResetPassword";
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
return()=>{cancelled=true;window.removeEventListener("mtd-site-config-updated",onThemeUpdate)}},[language]);if(!ready)return null;return <BrowserRouter><Seo/><Routes>
<Route path="/" element={<HomePage/>}/><Route path="/admin-login" element={<AdminLogin/>}/><Route path="/register" element={<RegisterPage/>}/><Route path="/forgot-password" element={<ForgotPasswordPage/>}/><Route path="/reset-password" element={<ResetPasswordPage/>}/>
<Route path="/account" element={<AccountPage/>}/><Route path="/account/orders" element={<OrdersPage/>}/><Route path="/account/reviews" element={<ReviewsPage/>}/><Route path="/account/reviews/create" element={<CreateReviewPage/>}/>
<Route path="/admin" element={<AdminRoute><AdminDashboard/></AdminRoute>}/><Route path="/admin/marketing" element={<AdminRoute><AdminMarketing/></AdminRoute>}/><Route path="/admin/email-templates" element={<AdminRoute><AdminEmailTemplates/></AdminRoute>}/><Route path="/admin/email-log" element={<AdminRoute><AdminEmailLog/></AdminRoute>}/><Route path="/admin/sales" element={<AdminRoute><AdminSales/></AdminRoute>}/><Route path="/admin/reviews" element={<AdminRoute><AdminReviews/></AdminRoute>}/><Route path="/admin/users" element={<AdminRoute><AdminUsers/></AdminRoute>}/><Route path="/admin/products" element={<AdminRoute><AdminProducts/></AdminRoute>}/><Route path="/admin/collections" element={<AdminRoute><AdminCollectionsHub/></AdminRoute>}/><Route path="/admin/collections/:slug" element={<AdminRoute><AdminCollectionProducts/></AdminRoute>}/><Route path="/admin/subscribers" element={<AdminRoute><AdminSubscribers/></AdminRoute>}/><Route path="/admin/content" element={<AdminRoute><AdminContent/></AdminRoute>}/><Route path="/admin/portfolio" element={<AdminRoute><AdminPortfolio/></AdminRoute>}/><Route path="/admin/orders" element={<AdminRoute><AdminOrders/></AdminRoute>}/><Route path="/admin/reports" element={<AdminRoute><AdminReports/></AdminRoute>}/><Route path="/admin/settings" element={<AdminRoute><AdminSettings/></AdminRoute>}/>
<Route path="/products" element={<ProductsPage/>}/><Route path="/collections" element={<CollectionsPage/>}/><Route path="/collections/love-romance" element={<UnifiedCollectionPage slug="love-romance"/>}/><Route path="/collections/family-memories" element={<UnifiedCollectionPage slug="family-memories"/>}/><Route path="/collections/business-branding" element={<UnifiedCollectionPage slug="business-branding"/>}/><Route path="/collections/special-occasions" element={<UnifiedCollectionPage slug="special-occasions"/>}/><Route path="/customize" element={<CustomizePage/>}/><Route path="/how-it-works" element={<HowItWorksPage/>}/><Route path="/contact" element={<ContactPage/>}/><Route path="/about" element={<AboutPage/>}/><Route path="/cart" element={<CartPage/>}/><Route path="/checkout" element={<CheckoutPage/>}/><Route path="/checkout/success" element={<CheckoutSuccessPage/>}/><Route path="/shipping-returns" element={<ShippingReturnsPage/>}/><Route path="/faqs" element={<FAQPage/>}/><Route path="/track-order" element={<TrackOrderPage/>}/><Route path="/privacy" element={<PrivacyPage/>}/><Route path="/terms-of-service" element={<TermsOfServicePage/>}/>
</Routes></BrowserRouter>}
export default App;
