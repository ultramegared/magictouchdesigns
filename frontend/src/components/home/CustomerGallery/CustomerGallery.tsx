/**
 * ===============================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: CustomerGallery.tsx
 * Module: Home
 * Language: TypeScript React
 * Description:
 * Customer Gallery Section.
 * Displays the four latest approved customer reviews with images.
 * Includes a premium fullscreen image preview.
 * ===============================================================
 */

import {
    useEffect,
    useState,
} from "react";

import "./CustomerGallery.css";

import {
    useLanguage,
} from "../../../contexts/LanguageContext";

import {
    translations,
} from "../../../translations";

import {
    apiRequest,
} from "../../../services/api";


/* ===============================================================
   TYPES
================================================================ */

interface PublicReview {

    id: string;

    user_id: string;

    review: string;

    rating?: number | null;

    verified_purchase?: boolean;

    image_url: string;

    image_urls?: string[] | null;

    created_at: string;

    username: string;

}


/*
 * All photos of a review, newest model first.
 * Reviews written before multi-photo existed only carry
 * the legacy single image_url, which counts as photo one.
 */

const photosOf = (
    item: PublicReview
): string[] => {

    if (
        item.image_urls &&
        item.image_urls.length > 0
    ) {

        return item.image_urls;

    }

    if (
        item.image_url &&
        item.image_url.trim() !== ""
    ) {

        return [item.image_url];

    }

    return [];

};


/*
 * Star row for a 1-5 rating.
 * NULL (reviews written before ratings existed)
 * renders nothing: no default rating is ever invented.
 */

const renderStars = (
    rating: number
) => {

    return (
        <span
            className="customer-gallery__stars"
            role="img"
            aria-label={`${rating} out of 5 stars`}
        >
            {"★".repeat(rating)}
            {"☆".repeat(5 - rating)}
        </span>
    );

};


interface PublicReviewsResponse {

    reviews: PublicReview[];

}


/* ===============================================================
   COMPONENT
================================================================ */

function CustomerGallery() {

    const {
        language,
    } = useLanguage();


    const t =
        translations[language];


    const [
        reviews,
        setReviews,
    ] = useState<PublicReview[]>(
        []
    );


    const [
        selectedImage,
        setSelectedImage,
    ] = useState<{
        photos: string[];
        index: number;
        customerName: string;
        rating: number | null;
        verified: boolean;
        review: string;
    } | null>(null);


    /* ============================================================
       LOAD PUBLIC REVIEWS
    ============================================================ */

    useEffect(() => {

        const loadReviews =
            async () => {

                try {

                    const result =
                        await apiRequest<PublicReviewsResponse>(
                            "/api/reviews/public?limit=4"
                        );


                    setReviews(
                        result.reviews
                    );

                } catch (error) {

                    console.error(
                        "Unable to load customer gallery:",
                        error
                    );


                    setReviews(
                        []
                    );

                }

            };


        loadReviews();

    }, []);


    /* ============================================================
       CLOSE LIGHTBOX WITH ESC
    ============================================================ */

    useEffect(() => {

        if (!selectedImage) {

            return;

        }


        const handleKeyDown = (
            event: KeyboardEvent
        ) => {

            if (
                event.key === "Escape"
            ) {

                setSelectedImage(
                    null
                );

                return;

            }

            if (
                selectedImage &&
                selectedImage.photos.length > 1
            ) {

                if (
                    event.key === "ArrowLeft"
                ) {

                    setSelectedImage({
                        ...selectedImage,
                        index:
                            (selectedImage.index -
                                1 +
                                selectedImage.photos.length) %
                            selectedImage.photos.length,
                    });

                }

                if (
                    event.key === "ArrowRight"
                ) {

                    setSelectedImage({
                        ...selectedImage,
                        index:
                            (selectedImage.index + 1) %
                            selectedImage.photos.length,
                    });

                }

            }

        };


        document.addEventListener(
            "keydown",
            handleKeyDown
        );


        /*
         * Prevent the page underneath
         * from scrolling while the image
         * viewer is open.
         */

        const previousOverflow =
            document.body.style.overflow;


        document.body.style.overflow =
            "hidden";


        return () => {

            document.removeEventListener(
                "keydown",
                handleKeyDown
            );


            document.body.style.overflow =
                previousOverflow;

        };

    }, [
        selectedImage,
    ]);


    return (

        <section
            className="customer-gallery"
        >

            <div
                className="customer-gallery__container"
            >


                {/* ==================================================
                    HEADER
                ================================================== */}

                <div
                    className="customer-gallery__header"
                >

                    <span
                        className="customer-gallery__eyebrow"
                    >
                        {t.customerGallery.eyebrow}
                    </span>


                    <h2>

                        {t.customerGallery.title}

                    </h2>


                    <p>

                        {t.customerGallery.description}

                    </p>

                </div>


                {/* ==================================================
                    GALLERY
                    Four latest approved customer reviews
                    with images.
                ================================================== */}

                {reviews.length > 0 && (

                    <div
                        className="customer-gallery__grid"
                    >

                        {reviews.map(
                            (item) => {

                                /*
                                 * Display only
                                 * the user's username.
                                 */

                                const customerName =
                                    item.username;


                                const photos =
                                    photosOf(item);

                                const firstPhoto =
                                    photos[0] ??
                                    item.image_url;


                                return (

                                    <article
                                        key={item.id}
                                        className="customer-gallery__card"
                                    >


                                        {/* IMAGE */}

                                        <div
                                            className="customer-gallery__image-wrapper"
                                        >

                                            <img
                                                src={
                                                    firstPhoto
                                                }
                                                alt={`${customerName}'s personalized mug`}
                                                loading="lazy"
                                            />


                                            {/* ZOOM */}

                                            <button
                                                type="button"
                                                className="customer-gallery__zoom"
                                                aria-label={`View ${customerName}'s photo`}
                                                onClick={() =>
                                                    setSelectedImage({
                                                        photos,

                                                        index:
                                                            0,

                                                        customerName,

                                                        rating:
                                                            item.rating ??
                                                            null,

                                                        verified:
                                                            !!item.verified_purchase,

                                                        review:
                                                            item.review,
                                                    })
                                                }
                                            >

                                                <span
                                                    aria-hidden="true"
                                                >
                                                    ⌕
                                                </span>

                                            </button>

                                        </div>


                                        {/* EXTRA PHOTOS */}

                                        {photos.length > 1 && (

                                            <div
                                                className="customer-gallery__thumbs"
                                            >

                                                {photos.slice(1).map(
                                                    (photo, thumbIndex) => (

                                                        <button
                                                            key={photo}
                                                            type="button"
                                                            className="customer-gallery__thumb"
                                                            aria-label={`View ${customerName}'s photo`}
                                                            onClick={() =>
                                                                setSelectedImage({
                                                                    photos,

                                                                    index:
                                                                        thumbIndex + 1,

                                                                    customerName,

                                                                    rating:
                                                                        item.rating ??
                                                                        null,

                                                                    verified:
                                                                        !!item.verified_purchase,

                                                                    review:
                                                                        item.review,
                                                                })
                                                            }
                                                        >

                                                            <img
                                                                src={photo}
                                                                alt=""
                                                                loading="lazy"
                                                            />

                                                        </button>

                                                    )
                                                )}

                                            </div>

                                        )}


                                        {/* CUSTOMER CONTENT */}

                                        <div
                                            className="customer-gallery__content"
                                        >

                                            {/* USERNAME ONLY */}

                                            <span
                                                className="customer-gallery__name"
                                            >
                                                {customerName}
                                            </span>


                                            {(item.rating != null ||
                                                item.verified_purchase) && (

                                                <div
                                                    className="customer-gallery__meta"
                                                >

                                                    {item.rating != null &&
                                                        renderStars(
                                                            item.rating
                                                        )}

                                                    {item.verified_purchase && (

                                                        <span
                                                            className="customer-gallery__verified"
                                                        >
                                                            ✓ Verified Purchase
                                                        </span>

                                                    )}

                                                </div>

                                            )}


                                            <p>

                                                {item.review}

                                            </p>


                                        </div>

                                    </article>

                                );

                            }
                        )}

                    </div>

                )}

            </div>


            {/* ======================================================
                PREMIUM FULLSCREEN LIGHTBOX
               ====================================================== */}

            {selectedImage && (

                <div
                    className="customer-gallery__lightbox"
                    role="dialog"
                    aria-modal="true"
                    aria-label={`${selectedImage.customerName}'s customer gallery photo`}
                    onClick={() =>
                        setSelectedImage(
                            null
                        )
                    }
                >


                    {/* CLOSE */}

                    <button
                        type="button"
                        className="customer-gallery__lightbox-close"
                        aria-label="Close image"
                        onClick={() =>
                            setSelectedImage(
                                null
                            )
                        }
                    >
                        ×
                    </button>


                    {/* IMAGE CONTAINER */}

                    <div
                        className="customer-gallery__lightbox-content"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >

                        <div
                            className="customer-gallery__lightbox-frame"
                        >

                            <img
                                src={
                                    selectedImage.photos[
                                        selectedImage.index
                                    ]
                                }
                                alt={`${selectedImage.customerName}'s personalized mug`}
                            />

                            {selectedImage.photos.length > 1 && (
                                <>
                                    <button
                                        type="button"
                                        className="customer-gallery__lightbox-nav customer-gallery__lightbox-nav--prev"
                                        aria-label="Previous photo"
                                        onClick={() =>
                                            setSelectedImage({
                                                ...selectedImage,
                                                index:
                                                    (selectedImage.index -
                                                        1 +
                                                        selectedImage.photos.length) %
                                                    selectedImage.photos.length,
                                            })
                                        }
                                    >
                                        ‹
                                    </button>

                                    <button
                                        type="button"
                                        className="customer-gallery__lightbox-nav customer-gallery__lightbox-nav--next"
                                        aria-label="Next photo"
                                        onClick={() =>
                                            setSelectedImage({
                                                ...selectedImage,
                                                index:
                                                    (selectedImage.index + 1) %
                                                    selectedImage.photos.length,
                                            })
                                        }
                                    >
                                        ›
                                    </button>
                                </>
                            )}

                        </div>

                        <div
                            className="customer-gallery__lightbox-caption"
                        >

                            <div
                                className="customer-gallery__lightbox-caption-top"
                            >

                                <span
                                    className="customer-gallery__lightbox-name"
                                >
                                    {selectedImage.customerName}
                                </span>

                                {selectedImage.rating != null &&
                                    renderStars(
                                        selectedImage.rating
                                    )}

                                {selectedImage.verified && (

                                    <span
                                        className="customer-gallery__lightbox-verified"
                                    >
                                        ✓ Verified Purchase
                                    </span>

                                )}

                                {selectedImage.photos.length > 1 && (

                                    <span
                                        className="customer-gallery__lightbox-counter"
                                    >
                                        {selectedImage.index + 1} / {selectedImage.photos.length}
                                    </span>

                                )}

                            </div>

                            <p
                                className="customer-gallery__lightbox-review"
                            >
                                {selectedImage.review}
                            </p>

                        </div>

                    </div>

                </div>

            )}

        </section>

    );

}


export default CustomerGallery;