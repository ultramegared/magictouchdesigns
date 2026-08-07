/**
 * ===============================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: Hero.tsx
 * Module: Home
 * Language: TypeScript React
 * Description:
 * Home Hero section.
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

                <span className="hero__tag">

                    Personalized • Handmade • Premium

                </span>

                <h1>

                    {title}

                </h1>

                <p>

                    {subtitle}

                </p>

                <div className="hero__buttons">

                    <button className="hero__button hero__button--primary">

                        {primaryButton}

                    </button>

                    <button className="hero__button hero__button--secondary">

                        {secondaryButton}

                    </button>

                </div>

            </div>

            <div className="hero__image">

                <img
                    src="/images/hero/hero-mug2.png"
                    alt="Magic Touch Designs Mug"
                />

            </div>

        </section>

    );

}

export default Hero;