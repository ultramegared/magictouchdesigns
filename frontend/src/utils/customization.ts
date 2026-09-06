/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: customization.ts
 * Module: Frontend
 * Language: TypeScript
 * Description:
 * Temporary browser-session storage for custom mug designs.
 * Original artwork is never written to localStorage or sent to the
 * backend by this utility. The session data is cleared when removed.
 * ================================================================
 */

export type MugCustomization = {
    id: string;
    productId: string;
    productName: string;
    size: "11 oz" | "15 oz";
    color: string;
    designDataUrl: string | null;
    designFileName: string | null;
    designScale: number;
    designX: number;
    designY: number;
    designRotation: number;
    mugRotation: number;
    createdAt: string;
};

const STORAGE_PREFIX = "mtd-customization-session:";

export function createCustomizationId(): string {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return crypto.randomUUID();
    }

    return `mtd-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function saveCustomizationSession(
    customization: MugCustomization
): void {
    sessionStorage.setItem(
        `${STORAGE_PREFIX}${customization.id}`,
        JSON.stringify(customization)
    );
}

export function getCustomizationSession(
    id: string
): MugCustomization | null {
    try {
        const value = sessionStorage.getItem(`${STORAGE_PREFIX}${id}`);
        if (!value) return null;
        return JSON.parse(value) as MugCustomization;
    } catch {
        return null;
    }
}

export function removeCustomizationSession(id: string): void {
    sessionStorage.removeItem(`${STORAGE_PREFIX}${id}`);
}

export function getCustomizationPreview(id: string): string | null {
    return getCustomizationSession(id)?.designDataUrl ?? null;
}
