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
import ReviewsPage from "./pages/Account/Reviews";
import CreateReviewPage from "./pages/Account/CreateReview";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminRoute from "./pages/admin/AdminRoute";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminCollections from "./pages/admin/AdminCollections";
import AdminSubscribers from "./pages/admin/AdminSubscribers";
import AdminContent from "./pages/admin/AdminContent";
import AdminOrders from "./pages/admin/AdminOrders";
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

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/account" element={<AccountPage />} />
                <Route path="/account/reviews" element={<ReviewsPage />} />
                <Route path="/account/reviews/create" element={<CreateReviewPage />} />

                <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                <Route path="/admin/reviews" element={<AdminRoute><AdminReviews /></AdminRoute>} />
                <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
                <Route path="/admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />
                <Route path="/admin/collections" element={<AdminRoute><AdminCollections /></AdminRoute>} />
                <Route path="/admin/subscribers" element={<AdminRoute><AdminSubscribers /></AdminRoute>} />
                <Route path="/admin/content" element={<AdminRoute><AdminContent /></AdminRoute>} />
                <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
                <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />

                <Route path="/products" element={<ProductsPage />} />
                <Route path="/collections" element={<CollectionsPage />} />
                <Route path="/collections/love-romance" element={<LoveRomancePage />} />
                <Route path="/collections/family-memories" element={<FamilyMemoriesPage />} />
                <Route path="/collections/business-branding" element={<BusinessBrandingPage />} />
                <Route path="/collections/special-occasions" element={<SpecialOccasionsPage />} />
                <Route path="/customize" element={<CustomizePage />} />
                <Route path="/how-it-works" element={<HowItWorksPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
                <Route path="/shipping-returns" element={<ShippingReturnsPage />} />
                <Route path="/faqs" element={<FAQPage />} />
                <Route path="/track-order" element={<TrackOrderPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/terms-of-service" element={<TermsOfServicePage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
