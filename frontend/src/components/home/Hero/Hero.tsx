/**
 * ===============================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: Hero.tsx
 * Module: Home
 * ===============================================================
 */

import "./Hero.css";

import type { HeroProps } from "./Hero.types";

function Hero({

    title,

    subtitle,

    primaryButton,

    secondaryButton

}: HeroProps) {

    return (

        <section className="hero">

            <div className="hero__content">

                <h1>

                    {title}

                </h1>

                <p>

                    {subtitle}

                </p>

                <div className="hero__buttons">

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