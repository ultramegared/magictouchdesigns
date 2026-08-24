/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: Portfolio.tsx
 * Module: Frontend
 * Language: TypeScript React
 * Description:
 * Premium latest creations editorial gallery.
 * Displays previously completed and sold designs.
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


    /*
     * First image becomes the editorial hero.
     * Remaining images become supporting creations.
     */

    const heroImage =
        portfolioImages[0];

    const supportingImages =
        portfolioImages.slice(1, 8);


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
                        Our Latest Work
                    </span>

                    <h2 id="portfolio-title">
                        Latest Creations
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
                    EDITORIAL GALLERY
                   ================================================== */}

                {heroImage && (

                    <div className="portfolio__gallery">


                        {/* ==================================================
                            HERO IMAGE
                           ================================================== */}

                        <article
                            className="portfolio__hero"
                        >

                            <button
                                type="button"
                                className="portfolio__image-button"
                                onClick={() =>
                                    setSelectedImage(heroImage)
                                }
                                aria-label="View latest creation"
                            >

                                <img
                                    src={heroImage}
                                    alt="Magic Touch Designs latest creation"
                                    loading="lazy"
                                />

                                <span
                                    className="portfolio__image-overlay"
                                    aria-hidden="true"
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

                                        <path d="M16 16L21 21" />

                                        <path d="M10.5 7.5V13.5" />

                                        <path d="M7.5 10.5H13.5" />

                                    </svg>

                                </span>

                                <span
                                    className="portfolio__hero-label"
                                >
                                    Latest Creation
                                </span>

                            </button>

                        </article>


                        {/* ==================================================
                            SUPPORTING CREATIONS
                           ================================================== */}

                        {supportingImages.map(
                            (image, index) => (

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
                                        aria-label={`View completed design ${index + 2}`}
                                    >

                                        <img
                                            src={image}
                                            alt={`Magic Touch Designs completed work ${index + 2}`}
                                            loading="lazy"
                                        />

                                        <span
                                            className="portfolio__image-overlay"
                                            aria-hidden="true"
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

                                                <path d="M16 16L21 21" />

                                                <path d="M10.5 7.5V13.5" />

                                                <path d="M7.5 10.5H13.5" />

                                            </svg>

                                        </span>

                                    </button>

                                </article>

                            )
                        )}

                    </div>

                )}


                {/* ==================================================
                    CALL TO ACTION
                   ================================================== */}

                {portfolioImages.length > 0 && (

                    <div className="portfolio__cta">

                        <p>
                            If you love one of our designs,
                            let us create something uniquely
                            yours.
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
                LIGHTBOX
               ====================================================== */}

            {selectedImage && (

                <div
                    className="portfolio__lightbox"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Image preview"
                    onClick={() =>
                        setSelectedImage(null)
                    }
                >

                    <button
                        type="button"
                        className="portfolio__lightbox-close"
                        onClick={() =>
                            setSelectedImage(null)
                        }
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