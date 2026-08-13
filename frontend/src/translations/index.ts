/**
 * ===============================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: index.ts
 * Module: Translations
 * Language: TypeScript
 * Description:
 * Translation exports for English and Spanish.
 * ===============================================================
 */

import { en } from "./en";
import { es } from "./es";

export const translations = {
    en,
    es,
};

export type SupportedLanguage = keyof typeof translations;