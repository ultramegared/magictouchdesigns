/**
 * ================================================================
 * Project: Magic Touch Designs
 * Author: ultramegared
 * File: App.tsx
 * Module: Frontend
 * Language: TypeScript React
 * Description:
 * Main application component.
 * ================================================================
 */

import { BrowserRouter, Routes, Route } from "react-router-dom";

import HomePage from "./pages/Home";
import ProductsPage from "./pages/Products";
import CollectionsPage from "./pages/Collections";

import LoveRomancePage from "./pages/Collections/pages/LoveRomance/LoveRomancePage";
import FamilyMemoriesPage from "./pages/Collections/pages/FamilyMemories/FamilyMemoriesPage";
import BusinessBrandingPage from "./pages/Collections/pages/BusinessBranding/BusinessBrandingPage";
import SpecialOccasionsPage from "./pages/Collections/pages/SpecialOccasions/SpecialOccasionsPage";

import LoginPage from "./pages/Login/Login";
import RegisterPage from "./pages/Register/Register";
import AccountPage from "./pages/Account/Account";

import CustomizePage from "./pages/Customize";
import ContactPage from "./pages/Contact";
import AboutPage from "./pages/About";

import HowItWorksPage from "./components/home/HowItWorks/HowItWorksPage";

import CartPage from "./pages/Cart";
import CheckoutPage from "./pages/Checkout";

import ShippingReturnsPage from "./pages/ShippingReturns";
import FAQPage from "./pages/FAQ";
import TrackOrderPage from "./pages/TrackOrder";

import PrivacyPage from "./pages/Privacy";
import TermsOfServicePage from "./pages/TermsOfService";

import ForgotPasswordPage from "./pages/ForgotPassword/ForgotPassword";

function App() {

    return (

        <BrowserRouter>

            <Routes>

                {/* ==================================================
                    HOME
                   ================================================== */}

                <Route
                    path="/"
                    element={<HomePage />}
                />

                {/* ==================================================
                    AUTHENTICATION
                   ================================================== */}

                <Route
                    path="/login"
                    element={<LoginPage />}
                />

                <Route
                    path="/register"
                    element={<RegisterPage />}
                />

                <Route
                    path="/forgot-password"
                    element={<ForgotPasswordPage />}
                />

                {/* ==================================================
                    ACCOUNT
                   ================================================== */}

                <Route
                    path="/account"
                    element={<AccountPage />}
                />

                {/* ==================================================
                    PRODUCTS
                   ================================================== */}

                <Route
                    path="/products"
                    element={<ProductsPage />}
                />

                {/* ==================================================
                    COLLECTIONS
                   ================================================== */}

                <Route
                    path="/collections"
                    element={<CollectionsPage />}
                />

                <Route
                    path="/collections/love-romance"
                    element={<LoveRomancePage />}
                />

                <Route
                    path="/collections/family-memories"
                    element={<FamilyMemoriesPage />}
                />

                <Route
                    path="/collections/business-branding"
                    element={<BusinessBrandingPage />}
                />

                <Route
                    path="/collections/special-occasions"
                    element={<SpecialOccasionsPage />}
                />

                {/* ==================================================
                    CUSTOMIZE
                   ================================================== */}

                <Route
                    path="/customize"
                    element={<CustomizePage />}
                />

                {/* ==================================================
                    INFORMATION
                   ================================================== */}

                <Route
                    path="/how-it-works"
                    element={<HowItWorksPage />}
                />

                <Route
                    path="/contact"
                    element={<ContactPage />}
                />

                <Route
                    path="/about"
                    element={<AboutPage />}
                />

                {/* ==================================================
                    SHOPPING
                   ================================================== */}

                <Route
                    path="/cart"
                    element={<CartPage />}
                />

                <Route
                    path="/checkout"
                    element={<CheckoutPage />}
                />

                {/* ==================================================
                    SUPPORT
                   ================================================== */}

                <Route
                    path="/shipping-returns"
                    element={<ShippingReturnsPage />}
                />

                <Route
                    path="/faqs"
                    element={<FAQPage />}
                />

                <Route
                    path="/track-order"
                    element={<TrackOrderPage />}
                />

                {/* ==================================================
                    LEGAL
                   ================================================== */}

                <Route
                    path="/privacy"
                    element={<PrivacyPage />}
                />

                <Route
                    path="/terms-of-service"
                    element={<TermsOfServicePage />}
                />

            </Routes>

        </BrowserRouter>
    );
}

export default App;