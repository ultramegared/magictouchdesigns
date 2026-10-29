/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: Reviews.tsx
 * Module: Account Reviews Page
 * Language: TypeScript
 * Description:
 * Displays the authenticated user's reviews.
 * A review is only: stars, purchase photos, comment.
 * ================================================================
 */

import {
    useEffect,
    useState,
} from "react";

import { Link } from "react-router-dom";

import {
    ArrowLeft,
    Star,
    Plus,
} from "lucide-react";

import Header from "../../components/layout/Header";
import Footer from "../../components/home/Footer";

import {
    apiRequest,
} from "../../services/api";

import "./Reviews.css";


interface Review {
    id: string;
    review: string;
    rating?: number | null;
    verified_purchase?: boolean;
    image_url?: string | null;
    image_urls?: string[] | null;
    is_approved: boolean;
    created_at: string;
}


/**
 * All photos of a review, newest model first.
 * Reviews written before multi-photo existed only carry
 * the legacy single image_url, which counts as photo one.
 */
const photosOf = (review: Review): string[] => {

    if (
        review.image_urls &&
        review.image_urls.length > 0
    ) {

        return review.image_urls;

    }

    if (
        review.image_url &&
        review.image_url.trim() !== ""
    ) {

        return [review.image_url];

    }

    return [];

};


const Reviews = () => {

    const [reviews, setReviews] =
        useState<Review[]>([]);

    const [isLoading, setIsLoading] =
        useState(true);

    const [errorMessage, setErrorMessage] =
        useState<string | null>(null);


    useEffect(() => {

        const loadReviews = async () => {

            try {

                setIsLoading(true);

                setErrorMessage(null);


                const data = await apiRequest<{
                    reviews: Review[];
                }>(
                    "/api/reviews/my-reviews"
                );


                setReviews(
                    data.reviews
                );

            } catch (error) {

                console.error(
                    "Error loading reviews:",
                    error
                );


                setErrorMessage(

                    error instanceof Error
                        ? error.message
                        : "Unable to load your reviews."

                );

            } finally {

                setIsLoading(false);

            }

        };


        loadReviews();

    }, []);


    return (

        <>

            <Header />

            <main className="reviews-page">

                <div className="reviews-container">

                    <Link
                        to="/account"
                        className="reviews-back"
                    >
                        <ArrowLeft size={22} />

                        <span>
                            Back to account
                        </span>
                    </Link>


                    <section className="reviews-header">

                        <div>

                            <p className="reviews-eyebrow">
                                MY REVIEWS
                            </p>

                            <h1>
                                Your reviews
                            </h1>

                            <p>
                                Share and manage your experiences
                                with Magic Touch Designs.
                            </p>

                        </div>

                        <Link
                            to="/account/reviews/create"
                            className="reviews-create-button"
                        >
                            <Plus size={20} />

                            <span>
                                Write a review
                            </span>
                        </Link>

                    </section>


                    <section className="reviews-content">

                        {isLoading && (

                            <div className="reviews-empty">

                                <Star
                                    size={42}
                                    className="reviews-empty-icon"
                                />

                                <h2>
                                    Loading reviews...
                                </h2>

                            </div>

                        )}


                        {!isLoading &&
                            errorMessage && (

                                <div className="reviews-empty">

                                    <Star
                                        size={42}
                                        className="reviews-empty-icon"
                                    />

                                    <h2>
                                        Unable to load reviews
                                    </h2>

                                    <p>
                                        {errorMessage}
                                    </p>

                                </div>

                            )}


                        {!isLoading &&
                            !errorMessage &&
                            reviews.length === 0 && (

                                <div className="reviews-empty">

                                    <Star
                                        size={42}
                                        className="reviews-empty-icon"
                                    />

                                    <h2>
                                        No reviews yet
                                    </h2>

                                    <p>
                                        You have not submitted any
                                        reviews yet.
                                    </p>

                                    <Link
                                        to="/account/reviews/create"
                                        className="reviews-create-button"
                                    >
                                        <Plus size={20} />

                                        <span>
                                            Write a review
                                        </span>
                                    </Link>

                                </div>

                            )}


                        {!isLoading &&
                            !errorMessage &&
                            reviews.length > 0 && (

                                <div className="reviews-list">

                                    {reviews.map(
                                        (review) => {

                                            const photos =
                                                photosOf(review);

                                            return (

                                                <article
                                                    key={review.id}
                                                    className="review-card"
                                                >

                                                    {photos.length > 0 && (

                                                        <div className="review-card-photos">

                                                            <img
                                                                src={photos[0]}
                                                                alt=""
                                                                className="review-card-photo"
                                                            />

                                                            {photos.length > 1 && (

                                                                <div className="review-card-thumbs">

                                                                    {photos.slice(1).map(
                                                                        (photo) => (

                                                                            <img
                                                                                key={photo}
                                                                                src={photo}
                                                                                alt=""
                                                                                className="review-card-thumb"
                                                                            />

                                                                        )
                                                                    )}

                                                                </div>

                                                            )}

                                                        </div>

                                                    )}


                                                    <div className="review-card-body">

                                                        {(review.rating != null ||
                                                            review.verified_purchase) && (

                                                            <div className="review-card-meta">

                                                                {review.rating != null && (

                                                                    <span
                                                                        className="review-card-stars"
                                                                        role="img"
                                                                        aria-label={`${review.rating} out of 5 stars`}
                                                                    >
                                                                        {"★".repeat(review.rating)}
                                                                        {"☆".repeat(5 - review.rating)}
                                                                    </span>

                                                                )}

                                                                {review.verified_purchase && (

                                                                    <span className="review-card-verified">
                                                                        ✓ Verified Purchase
                                                                    </span>

                                                                )}

                                                            </div>

                                                        )}


                                                        <p className="review-card-text">

                                                            {review.review}

                                                        </p>


                                                        <div
                                                            className={
                                                                review.is_approved
                                                                    ? "review-card-status review-card-status--approved"
                                                                    : "review-card-status review-card-status--pending"
                                                            }
                                                        >

                                                            {review.is_approved
                                                                ? "Approved"
                                                                : "Pending approval"}

                                                        </div>

                                                    </div>

                                                </article>

                                            );

                                        }
                                    )}

                                </div>

                            )}

                    </section>

                </div>

            </main>

            <Footer />

        </>

    );
};


export default Reviews;
