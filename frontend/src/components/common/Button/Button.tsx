/**
 * ===============================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: Button.tsx
 * Module: Common
 * Language: TypeScript React
 * Description:
 * Reusable button component.
 * ===============================================================
 */

import "./Button.css";

import { ButtonProps } from "./Button.types";

function Button({

    children,

    onClick,

    type = "button",

    disabled = false

}: ButtonProps) {

    return (

        <button

            type={type}

            onClick={onClick}

            disabled={disabled}

        >

            {children}

        </button>

    );

}

export default Button;