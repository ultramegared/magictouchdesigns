/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: main.tsx
 * Module: Frontend
 * Language: TypeScript React
 * Description:
 * Application entry point.
 * ================================================================
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";

import App from "./App";
import { LanguageProvider } from "./contexts/LanguageContext";

createRoot(

    document.getElementById("root")!

).render(

    <StrictMode>

        <LanguageProvider>

            <App />

        </LanguageProvider>

    </StrictMode>

);