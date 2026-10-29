/**
 * ===============================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: AllReviews.tsx
 * Module: Frontend
 * Language: TypeScript React
 * Description:
 * Full customer reviews page. Shows every approved review
 * with photos, using the same card design as the home gallery,
 * with a fullscreen lightbox (caption + photo navigation).
 * ===============================================================
 */

import {
    useEffect,
    useState,
} from "react";

import "./AllReviews.css";

import "../../components/home/CustomerGallery/CustomerGallery.css";

import Header from "../../components/layout/Header";
import Footer from "../../components/home/Footer";

import {
    useLanguage,
} from "../../contexts/LanguageContext";

import {
    translations,
} from "../../translations";

import {
    apiRequest,
} from "../../services/api";


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

function AllReviews() {

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
       LOAD ALL PUBLIC REVIEWS
    ============================================================ */

    useEffect(() => {

        let cancelled = false;

        const loadReviews =
            async () => {

                try {

                    const result =
                        await apiRequest<PublicReviewsResponse>(
                            "/api/reviews/public?limit=100"
                        );

                    if (
                        !cancelled
                    ) {

                        setReviews(
                            result.reviews
                        );

                    }

                } catch {

                    if (
                        !cancelled
                    ) {

                        setReviews(
                            []
                        );

                    }

                }

            };

        loadReviews();

        return () => {

            cancelled = true;

        };

    }, []);


    /* ============================================================
       LIGHTBOX KEYBOARD + SCROLL LOCK
    ============================================================ */

    useEffect(() => {

        if (
            !selectedImage
        ) {

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


    const openReview = (
        item: PublicReview,
        index: number
    ) => {

        setSelectedImage({
            photos: photosOf(item),
            index,
            customerName: item.username,
            rating: item.rating ?? null,
            verified: !!item.verified_purchase,
            review: item.review,
        });

    };


    return (
        <>
            <Header />

            <main className="all-reviews-page">

                <section className="customer-gallery">

                    <div className="customer-gallery__container">

                        <div className="customer-gallery__header">

                            <span className="customer-gallery__eyebrow">
                                {t.customerGallery.eyebrow}
                            </span>

                            <h2>
                                {t.customerGallery.title}
                            </h2>

                            <p>
                                {t.customerGallery.description}
                            </p>

                        </div>

                        {reviews.length > 0 ? (

                            <div className="customer-gallery__grid">

                                {reviews.map(
                                    (item) => {

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

                                                <div
                                                    className="customer-gallery__image-wrapper"
                                                >

                                                    <img
                                                        src={firstPhoto}
                                                        alt={`${customerName}'s personalized mug`}
                                                        loading="lazy"
                                                    />

                                                    <button
                                                        type="button"
                                                        className="customer-gallery__zoom"
                                                        aria-label={`View ${customerName}'s photo`}
                                                        onClick={() =>
                                                            openReview(item, 0)
                                                        }
                                                    >

                                                        <span
                                                            aria-hidden="true"
                                                        >
                                                            ⌕
                                                        </span>

                                                    </button>

                                                </div>

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
                                                                        openReview(
                                                                            item,
                                                                            thumbIndex + 1
                                                                        )
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

                                                <div
                                                    className="customer-gallery__content"
                                                >

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

                        ) : (

                            <p className="all-reviews-page__empty">
                                {t.customerGallery.empty}
                            </p>

                        )}

                    </div>

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

            </main>

            <Footer />
        </>
    );

}


export default AllReviews;
