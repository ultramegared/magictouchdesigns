/**
 * ===============================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: Hero.tsx
 * Module: Home
 * Language: TypeScript React
 * Description:
 * Home hero section.
 * ===============================================================
 */

import "./Hero.css";

import { HeroProps } from "./Hero.types";

function Hero({

    title,

    subtitle,

    primaryButton,

    secondaryButton

}: HeroProps) {

    return (

        <section>

            <div>

                <h1>

                    {title}

                </h1>

                <p>

                    {subtitle}

                </p>

                <div>

                    <button>

                        {primaryButton}

                    </button>

                    <button>

                        {secondaryButton}

                    </button>

                </div>

            </div>

        </section>

    );

}

export default Hero;