/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: Portfolio.tsx
 * Module: Frontend
 * Language: TypeScript React
 * Description:
 * Premium portfolio of previously completed and sold designs.
 * Displays a responsive selection of completed work.
 * ================================================================
 */

import { useState } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import { translations } from "../../translations";

import "./Portfolio.css";


/* ================================================================
   PORTFOLIO ITEM
================================================================ */

interface PortfolioItem {
    id: number;
    image: string;
}


/* ================================================================
   PORTFOLIO DATA
================================================================ */

const portfolioItems: PortfolioItem[] = [
    {
        id: 1,
        image: "/images/portfolio/portfolio-01.jpg",
    },
    {
        id: 2,
        image: "/images/portfolio/portfolio-02.jpg",
    },
    {
        id: 3,
        image: "/images/portfolio/portfolio-03.jpg",
    },
    {
        id: 4,
        image: "/images/portfolio/portfolio-04.jpg",
    },
    {
        id: 5,
        image: "/images/portfolio/portfolio-05.jpg",
    },
    {
        id: 6,
        image: "/images/portfolio/portfolio-06.jpg",
    },
    {
        id: 7,
        image: "/images/portfolio/portfolio-07.jpg",
    },
    {
        id: 8,
        image: "/images/portfolio/portfolio-08.jpg",
    },
];


/* ================================================================
   COMPONENT
================================================================ */

function Portfolio() {

    const { language } = useLanguage();

    const t = translations[language].collections;

    const [selectedImage, setSelectedImage] =
        useState<string | null>(null);


    /* ============================================================
       RESPONSIVE DISPLAY
       ------------------------------------------------------------
       CSS controls the visible amount:
       - Desktop: up to 8
       - Mobile: up to 6
       ============================================================ */

    return (

        <section
            className="portfolio"
            aria-labelledby="portfolio-title"
        >

            <div className="portfolio__container">


                {/* ==================================================
                    HEADER
                   ================================================== */}

                <header className="portfolio__header">

                    <span className="portfolio__eyebrow">
                        Our Work
                    </span>

                    <h2 id="portfolio-title">
                        Portfolio
                    </h2>

                    <div
                        className="portfolio__ornament"
                        aria-hidden="true"
                    >

                        <span />

                        <b>◆</b>

                        <span />

                    </div>

                </header>


                {/* ==================================================
                    WORK GRID
                   ================================================== */}

                <div className="portfolio__grid">

                    {portfolioItems.map((item) => (

                        <article
                            className="portfolio__item"
                            key={item.id}
                        >

                            <button
                                type="button"
                                className="portfolio__image-button"
                                onClick={() =>
                                    setSelectedImage(item.image)
                                }
                                aria-label="View design"
                            >

                                <img
                                    src={item.image}
                                    alt={`Magic Touch Designs -- completed work ${item.id}`}
                                    loading="lazy"
                                />

                                <span
                                    className="portfolio__zoom"
                                    aria-hidden="true"
                                >

                                    <svg
                                        viewBox="0 0 24 24"
                                        aria-hidden="true"
                                    >

                                        <circle
                                            cx="10.5"
                                            cy="10.5"
                                            r="6.5"
                                        />

                                        <path
                                            d="M16 16L21 21"
                                        />

                                        <path
                                            d="M10.5 7.5V13.5"
                                        />

                                        <path
                                            d="M7.5 10.5H13.5"
                                        />

                                    </svg>

                                </span>

                            </button>

                        </article>

                    ))}

                </div>


                {/* ==================================================
                    CALL TO ACTION
                   ================================================== */}

                <div className="portfolio__cta">

                    <p>
                        If you like one of our designs,
                        contact us and we can create
                        something personalized for you.
                    </p>

                    <a
                        href="/contact"
                        className="portfolio__cta-button"
                    >
                        Contact Us
                    </a>

                </div>

            </div>


            {/* ======================================================
                IMAGE LIGHTBOX
               ====================================================== */}

            {selectedImage && (

                <div
                    className="portfolio__lightbox"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Portfolio image preview"
                    onClick={() => setSelectedImage(null)}
                >

                    <button
                        type="button"
                        className="portfolio__lightbox-close"
                        onClick={() => setSelectedImage(null)}
                        aria-label="Close image"
                    >
                        ×
                    </button>

                    <img
                        src={selectedImage}
                        alt="Magic Touch Designs completed work"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    />

                </div>

            )}

        </section>

    );
}


export default Portfolio;