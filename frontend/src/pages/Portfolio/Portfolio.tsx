/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: Portfolio.tsx
 * Module: Frontend
 * Language: TypeScript React
 * Description:
 * Premium portfolio of previously completed and sold designs.
 * Displays completed work dynamically from the portfolio folder.
 * ================================================================
 */

import { useState } from "react";

import "./Portfolio.css";


/* ================================================================
   PORTFOLIO IMAGES
================================================================ */

const portfolioImages = Object.entries(
    import.meta.glob(
        "/public/images/portfolio/portfolio-*.{jpg,jpeg,png,webp}",
        {
            eager: true,
            query: "?url",
            import: "default",
        }
    )
)
    .sort(([pathA], [pathB]) =>
        pathA.localeCompare(pathB, undefined, {
            numeric: true,
            sensitivity: "base",
        })
    )
    .map(([, image]) => image as string);


/* ================================================================
   COMPONENT
================================================================ */

function Portfolio() {

    const [selectedImage, setSelectedImage] =
        useState<string | null>(null);


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

                    {portfolioImages.map((image, index) => (

                        <article
                            className="portfolio__item"
                            key={image}
                        >

                            <button
                                type="button"
                                className="portfolio__image-button"
                                onClick={() =>
                                    setSelectedImage(image)
                                }
                                aria-label={`View completed design ${index + 1}`}
                            >

                                <img
                                    src={image}
                                    alt={`Magic Touch Designs completed work ${index + 1}`}
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

                {portfolioImages.length > 0 && (

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

                )}

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