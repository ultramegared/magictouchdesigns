/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: HeroSlider.tsx
 * Module: Home
 * ================================================================
 */

import "./HeroSlider.css";

import {

    useEffect,
    useState

} from "react";

import {

    ChevronLeft,
    ChevronRight

} from "lucide-react";

import {

    heroSlides

} from "./HeroSlider.data";

function HeroSlider() {

    const [

        currentSlide,

        setCurrentSlide

    ] = useState(0);

    const nextSlide = () => {

        setCurrentSlide(

            previous =>

                (previous + 1) % heroSlides.length

        );

    };

    const previousSlide = () => {

        setCurrentSlide(

            previous =>

                previous === 0

                    ? heroSlides.length - 1

                    : previous - 1

        );

    };

    useEffect(() => {

        const interval = setInterval(

            nextSlide,

            6000

        );

        return () => clearInterval(interval);

    }, []);

    const slide = heroSlides[currentSlide];

    return (

        <section

            className="hero-slider"

            style={{

                backgroundImage: `linear-gradient(rgba(0,0,0,.45),rgba(0,0,0,.45)), url(${slide.background})`

            }}

        >

            <button

                className="hero-slider__arrow hero-slider__arrow--left"

                onClick={previousSlide}

            >

                <ChevronLeft size={26} />

            </button>

            <div className="hero-slider__overlay"></div>

            <div className="hero-slider__content">

                <div className="hero-slider__text">

                    <span>

                        CUSTOM MUGS MADE WITH LOVE

                    </span>

                    <h1>

                        {slide.title}

                    </h1>

                    <p>

                        {slide.subtitle}

                    </p>

                    <div className="hero-slider__buttons">

                        <button className="hero-slider__primary">

                            {slide.primaryButton}

                        </button>

                        <button className="hero-slider__secondary">

                            {slide.secondaryButton}

                        </button>

                    </div>

                </div>

            </div>

            <button

                className="hero-slider__arrow hero-slider__arrow--right"

                onClick={nextSlide}

            >

                <ChevronRight size={26} />

            </button>

            <div className="hero-slider__dots">

                {

                    heroSlides.map((_, index) => (

                        <button

                            key={index}

                            className={

                                index === currentSlide

                                    ? "hero-slider__dot hero-slider__dot--active"

                                    : "hero-slider__dot"

                            }

                            onClick={() =>

                                setCurrentSlide(index)

                            }

                        />

                    ))

                }

            </div>

        </section>

    );

}

export default HeroSlider;