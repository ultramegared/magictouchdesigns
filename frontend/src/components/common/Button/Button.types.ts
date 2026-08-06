/**
 * ===============================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: Button.types.ts
 * Module: Common
 * Language: TypeScript
 * Description:
 * Reusable button component types.
 * ===============================================================
 */

import { ReactNode } from "react";

export interface ButtonProps {

    children: ReactNode;

    onClick?: () => void;

    type?: "button" | "submit" | "reset";

    disabled?: boolean;

}