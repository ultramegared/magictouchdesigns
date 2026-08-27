/**
 * ===============================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: useTranslation.ts
 * Module: Hooks
 * Language: TypeScript React
 * Description:
 * Provides access to the active translation dictionary.
 * ===============================================================
 */

import { useLanguage } from "../contexts/LanguageContext";
import { translations } from "../translations/main";

export function useTranslation() {
    const {
        language,
        setLanguage,
        toggleLanguage,
    } = useLanguage();

    const t = translations[language];

    return {
        t,
        language,
        setLanguage,
        toggleLanguage,
    };
}