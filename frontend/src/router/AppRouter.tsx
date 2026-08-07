/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: AppRoutes.tsx
 * Module: Frontend
 * Language: TypeScript React
 * Description:
 * Application routes.
 * ================================================================
 */

import {

    BrowserRouter,
    Routes,
    Route

} from "react-router-dom";

import HomePage from "../pages/Home";
import ProductsPage from "../pages/Products";
import CollectionsPage from "../pages/Collections";
import CustomizePage from "../pages/Customize";
import ContactPage from "../pages/Contact";

function AppRoutes() {

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

            </Routes>

        </BrowserRouter>

    );

}

export default AppRoutes;