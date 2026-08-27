/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: Reviews.tsx
 * Module: Account Reviews Page
 * Language: TypeScript
 * Description:
 * Displays the authenticated user's reviews.
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
    image_url?: string | null;
    is_approved: boolean;
    created_at: string;
}


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

                        <div className="reviews-icon">
                            <Star size={30} />
                        </div>

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

                                </div>

                            )}


                        {!isLoading &&
                            !errorMessage &&
                            reviews.length > 0 && (

                                <div className="reviews-list">

                                    {reviews.map(
                                        (review) => (

                                            <article
                                                key={review.id}
                                                className="review-card"
                                            >

                                                <div className="review-card-header">

                                                    <Star
                                                        size={20}
                                                    />

                                                    <span>
                                                        Your review
                                                    </span>

                                                </div>


                                                <p className="review-card-text">

                                                    {review.review}

                                                </p>


                                                <div className="review-card-status">

                                                    {review.is_approved
                                                        ? "Approved"
                                                        : "Pending approval"}

                                                </div>


                                            </article>

                                        )
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