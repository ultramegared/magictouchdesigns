/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: Portfolio.tsx
 * Module: Frontend
 * Language: TypeScript React
 * Description:
 * Premium interactive circular gallery for completed creations.
 * Automatically rotates and responds to touch / mouse dragging.
 * ================================================================
 */

import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

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
        pathA.localeCompare(
            pathB,
            undefined,
            {
                numeric: true,
                sensitivity: "base",
            }
        )
    )
    .map(([, image]) => image as string);


/* ================================================================
   COMPONENT
================================================================ */

function Portfolio() {

    const [selectedImage, setSelectedImage] =
        useState<string | null>(null);

    const [direction, setDirection] =
        useState<number>(1);

    const [rotation, setRotation] =
        useState<number>(0);

    const [isDragging, setIsDragging] =
        useState<boolean>(false);


    const animationFrame =
        useRef<number | null>(null);

    const lastTime =
        useRef<number | null>(null);

    const pointerStartX =
        useRef<number>(0);

    const pointerLastX =
        useRef<number>(0);

    const pointerActive =
        useRef<boolean>(false);


    /* ============================================================
       RESPONSIVE LIMIT
    ============================================================ */

    const visibleImages =
        useMemo(() => {

            const maximum =
                typeof window !== "undefined" &&
                window.innerWidth <= 700
                    ? 6
                    : 8;

            return portfolioImages.slice(
                0,
                maximum
            );

        }, []);


    /* ============================================================
       ROTATION
    ============================================================ */

    useEffect(() => {

        if (
            visibleImages.length < 2 ||
            selectedImage
        ) {

            return;

        }


        const speed =
            0.012;


        const animate = (
            timestamp: number
        ) => {

            if (
                lastTime.current === null
            ) {

                lastTime.current =
                    timestamp;

            }


            const elapsed =
                timestamp -
                lastTime.current;


            lastTime.current =
                timestamp;


            if (!isDragging) {

                setRotation(
                    previous =>
                        previous +
                        direction *
                        speed *
                        elapsed
                );

            }


            animationFrame.current =
                requestAnimationFrame(
                    animate
                );

        };


        animationFrame.current =
            requestAnimationFrame(
                animate
            );


        return () => {

            if (
                animationFrame.current !== null
            ) {

                cancelAnimationFrame(
                    animationFrame.current
                );

            }

            lastTime.current =
                null;

        };

    }, [
        direction,
        isDragging,
        selectedImage,
        visibleImages.length,
    ]);


    /* ============================================================
       POINTER DOWN
    ============================================================ */

    const handlePointerDown = (
        event: React.PointerEvent
    ) => {

        pointerActive.current =
            true;

        pointerStartX.current =
            event.clientX;

        pointerLastX.current =
            event.clientX;

        setIsDragging(true);

        event.currentTarget.setPointerCapture(
            event.pointerId
        );

    };


    /* ============================================================
       POINTER MOVE
    ============================================================ */

    const handlePointerMove = (
        event: React.PointerEvent
    ) => {

        if (
            !pointerActive.current
        ) {

            return;

        }


        const currentX =
            event.clientX;

        const movement =
            currentX -
            pointerLastX.current;


        if (
            Math.abs(movement) < 0.5
        ) {

            return;

        }


        /*
         * Dragging right rotates right.
         * Dragging left rotates left.
         */

        setRotation(
            previous =>
                previous +
                movement *
                0.45
        );


        /*
         * Change autoplay direction
         * according to the customer's gesture.
         */

        if (
            movement > 0
        ) {

            setDirection(1);

        } else {

            setDirection(-1);

        }


        pointerLastX.current =
            currentX;

    };


    /* ============================================================
       POINTER UP
    ============================================================ */

    const handlePointerUp = (
        event: React.PointerEvent
    ) => {

        pointerActive.current =
            false;

        setIsDragging(false);

        if (
            event.currentTarget.hasPointerCapture(
                event.pointerId
            )
        ) {

            event.currentTarget.releasePointerCapture(
                event.pointerId
            );

        }

    };


    /* ============================================================
       POINTER CANCEL
    ============================================================ */

    const handlePointerCancel = () => {

        pointerActive.current =
            false;

        setIsDragging(false);

    };


    /* ============================================================
       CALCULATE ITEM POSITION
    ============================================================ */

    const getItemStyle = (
        index: number
    ): React.CSSProperties => {

        const total =
            visibleImages.length;

        const angleStep =
            360 / total;

        const angle =
            rotation +
            index *
            angleStep;

        return {

            transform:
                `rotateY(${angle}deg) translateZ(var(--portfolio-radius)) rotateY(${-angle}deg)`,

        };

    };


    /* ============================================================
       EMPTY STATE
    ============================================================ */

    if (
        visibleImages.length === 0
    ) {

        return null;

    }


    return (

        <section
            className="portfolio"
            aria-labelledby="portfolio-title"
        >

            <div className="portfolio__container">


                {/* ==================================================
                    HEADER
                ================================================== */}

                <header
                    className="portfolio__header"
                >

                    <span
                        className="portfolio__eyebrow"
                    >
                        Our Latest Work
                    </span>


                    <h2
                        id="portfolio-title"
                    >
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
                    CIRCULAR GALLERY
                ================================================== */}

                <div
                    className={`portfolio__stage ${
                        isDragging
                            ? "is-dragging"
                            : ""
                    }`}
                >

                    <div
                        className="portfolio__scene"
                        onPointerDown={
                            handlePointerDown
                        }
                        onPointerMove={
                            handlePointerMove
                        }
                        onPointerUp={
                            handlePointerUp
                        }
                        onPointerCancel={
                            handlePointerCancel
                        }
                    >

                        <div
                            className="portfolio__carousel"
                        >

                            {visibleImages.map(
                                (
                                    image,
                                    index
                                ) => (

                                    <article
                                        className="portfolio__card"
                                        key={image}
                                        style={
                                            getItemStyle(
                                                index
                                            )
                                        }
                                    >

                                        <button
                                            type="button"
                                            className="portfolio__image-button"
                                            onClick={() =>
                                                setSelectedImage(
                                                    image
                                                )
                                            }
                                            aria-label={
                                                `View completed design ${index + 1}`
                                            }
                                        >

                                            <span
                                                className="portfolio__frame"
                                            >

                                                <img
                                                    src={image}
                                                    alt={
                                                        `Magic Touch Designs completed work ${index + 1}`
                                                    }
                                                    loading="lazy"
                                                    draggable="false"
                                                />

                                                <span
                                                    className="portfolio__shine"
                                                    aria-hidden="true"
                                                />

                                                <span
                                                    className="portfolio__zoom"
                                                    aria-hidden="true"
                                                >

                                                    <svg
                                                        viewBox="0 0 24 24"
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

                                            </span>

                                        </button>

                                    </article>

                                )
                            )}

                        </div>

                    </div>


                    {/* ==================================================
                        FLOOR GLOW
                    ================================================== */}

                    <div
                        className="portfolio__floor"
                        aria-hidden="true"
                    />

                </div>


                {/* ==================================================
                    INTERACTION HINT
                ================================================== */}

                {visibleImages.length > 1 && (

                    <div
                        className="portfolio__hint"
                        aria-hidden="true"
                    >

                        <span>←</span>

                        <span>
                            Drag to explore
                        </span>

                        <span>→</span>

                    </div>

                )}


                {/* ==================================================
                    CTA
                ================================================== */}

                <div
                    className="portfolio__cta"
                >

                    <p>
                        If you love one of our
                        designs, let us create
                        something uniquely yours.
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
                PREMIUM LIGHTBOX
            ====================================================== */}

            {selectedImage && (

                <div
                    className="portfolio__lightbox"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Design preview"
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


                    <div
                        className="portfolio__lightbox-frame"
                        onClick={event =>
                            event.stopPropagation()
                        }
                    >

                        <span
                            className="portfolio__lightbox-gold"
                            aria-hidden="true"
                        />

                        <img
                            src={selectedImage}
                            alt="Magic Touch Designs completed work"
                        />

                    </div>

                </div>

            )}

        </section>

    );

}


export default Portfolio;