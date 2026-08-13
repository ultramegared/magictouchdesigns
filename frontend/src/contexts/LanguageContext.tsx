/**
 * ===============================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: LanguageContext.tsx
 * Module: Frontend
 * Language: TypeScript React
 * Description:
 * Global language context for English and Spanish.
 * ===============================================================
 */

import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";

export type Language = "en" | "es";

interface LanguageContextValue {
    language: Language;
    setLanguage: (language: Language) => void;
    toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(
    undefined
);

interface LanguageProviderProps {
    children: ReactNode;
}

export function LanguageProvider({
    children,
}: LanguageProviderProps) {

    const [language, setLanguageState] = useState<Language>(() => {

        const savedLanguage = localStorage.getItem(
            "magic-touch-language"
        );

        return savedLanguage === "es" ? "es" : "en";
    });

    const setLanguage = (nextLanguage: Language) => {

        setLanguageState(nextLanguage);

        localStorage.setItem(
            "magic-touch-language",
            nextLanguage
        );

        document.documentElement.lang = nextLanguage;
    };

    const toggleLanguage = () => {

        setLanguage(
            language === "en"
                ? "es"
                : "en"
        );
    };

    useEffect(() => {

        document.documentElement.lang = language;

    }, [language]);

    const value = useMemo(
        () => ({
            language,
            setLanguage,
            toggleLanguage,
        }),
        [language]
    );

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage(): LanguageContextValue {

    const context = useContext(LanguageContext);

    if (!context) {

        throw new Error(
            "useLanguage must be used inside LanguageProvider."
        );

    }

    return context;
}