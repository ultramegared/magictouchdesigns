/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: HeroSlider.tsx
 * Module: Home
 * Language: TypeScript React
 * Description:
 * Premium Hero Slider.
 * ================================================================
 */

import "./HeroSlider.css";

import {
    useEffect,
    useState,
} from "react";

import {
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

import {
    heroSlides,
} from "./HeroSlider.data";

import {
    useLanguage,
} from "../../../contexts/LanguageContext";

import {
    translations,
} from "../../../translations";

function HeroSlider() {

    const [
        currentSlide,
        setCurrentSlide,
    ] = useState(0);

    const [
        isPaused,
        setIsPaused,
    ] = useState(false);

    const {
        language,
    } = useLanguage();

    const t = translations[language].home.hero;

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

        if (isPaused) {
            return;
        }

        const interval = window.setInterval(() => {

            setCurrentSlide(
                previous =>
                    (previous + 1) % heroSlides.length
            );

        }, 8000);

        return () => {

            window.clearInterval(interval);

        };

    }, [currentSlide, isPaused]);

    const slide = heroSlides[currentSlide];

    const content = t.slides[slide.translationKey];

    return (

        <section
            className="hero-slider"
            style={{
                backgroundImage:
                    `linear-gradient(
                        rgba(0,0,0,.45),
                        rgba(0,0,0,.45)
                    ),
                    url(${slide.background})`,
            }}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onFocus={() => setIsPaused(true)}
            onBlur={() => setIsPaused(false)}
        >

            <button
                type="button"
                className="hero-slider__arrow hero-slider__arrow--left"
                onClick={previousSlide}
                aria-label={t.previousSlide}
            >

                <ChevronLeft size={26} />

            </button>

            <div className="hero-slider__overlay"></div>

            <div className="hero-slider__content">

                <div
                    key={`text-${slide.id}`}
                    className="hero-slider__text"
                >

                    <h1>
                        {content.title}
                    </h1>

                    <p>
                        {content.subtitle}
                    </p>

                    <div className="hero-slider__content">

    <div
        key={`text-${slide.id}`}
        className="hero-slider__text"
    >

        <h1>
            {content.title}
        </h1>

        <p>
            {content.subtitle}
        </p>

    </div>

    <div
        key={`image-${slide.id}`}
        className="hero-slider__image"
    >

        <img
            src={slide.image}
            alt={content.title.replace("\n", " ")}
        />

    </div>

    <div className="hero-slider__buttons">

        <button
            type="button"
            className="hero-slider__primary"
            onClick={() =>
                window.location.href = "/customize"
            }
        >
            {content.primaryButton}
        </button>

        <button
            type="button"
            className="hero-slider__secondary"
            onClick={() =>
                window.location.href = "/products"
            }
        >
            {content.secondaryButton}
        </button>

    </div>

</div>

                <div
                    key={`image-${slide.id}`}
                    className="hero-slider__image"
                >

                    <img
                        src={slide.image}
                        alt={content.title.replace("\n", " ")}
                    />

                </div>

            </div>

            <button
                type="button"
                className="hero-slider__arrow hero-slider__arrow--right"
                onClick={nextSlide}
                aria-label={t.nextSlide}
            >

                <ChevronRight size={26} />

            </button>

            <div className="hero-slider__dots">

                {heroSlides.map((heroSlide, index) => (

                    <button
                        type="button"
                        key={heroSlide.id}
                        className={
                            index === currentSlide
                                ? "hero-slider__dot hero-slider__dot--active"
                                : "hero-slider__dot"
                        }
                        onClick={() =>
                            setCurrentSlide(index)
                        }
                        aria-label={
                            `${t.goToSlide} ${index + 1}`
                        }
                    />

                ))}

            </div>

        </section>

    );

}

export default HeroSlider;