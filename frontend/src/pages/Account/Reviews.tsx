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

import { Link } from "react-router-dom";
import { ArrowLeft, Star } from "lucide-react";

import "./Reviews.css";

const Reviews = () => {
    return (
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

                </section>

                <section className="reviews-content">

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

                </section>

            </div>

        </main>
    );
};

export default Reviews;