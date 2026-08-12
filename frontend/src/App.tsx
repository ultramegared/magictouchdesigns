/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
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
import CustomizePage from "./pages/Customize";
import ContactPage from "./pages/Contact";
import AboutPage from "./pages/About";
import CartPage from "./pages/Cart";
import CheckoutPage from "./pages/Checkout";
import ShippingReturnsPage from "./pages/ShippingReturns";

function App() {

    return (

        <BrowserRouter>

            <Routes>

                <Route
                    path="/"
                    element={<HomePage />}
                />

                <Route
                    path="/products"
                    element={<ProductsPage />}
                />

                <Route
                    path="/collections"
                    element={<CollectionsPage />}
                />

                <Route
                    path="/customize"
                    element={<CustomizePage />}
                />

                <Route
                    path="/contact"
                    element={<ContactPage />}
                />

                <Route
                    path="/about"
                    element={<AboutPage />}
                />

                <Route
                    path="/cart"
                    element={<CartPage />}
                />

                <Route
                    path="/checkout"
                    element={<CheckoutPage />}
                />

                <Route
                    path="/shipping-returns"
                    element={<ShippingReturnsPage />}
                />

            </Routes>

        </BrowserRouter>

    );

}

export default App;