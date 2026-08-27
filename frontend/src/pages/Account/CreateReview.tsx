/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: CreateReview.tsx
 * Module: Account Reviews Page
 * Language: TypeScript
 * Description:
 * Allows an authenticated user to create a new review.
 * ================================================================
 */

import {
    useState,
} from "react";

import type {
    ChangeEvent,
    FormEvent,
} from "react";

import {
    Link,
    useNavigate,
} from "react-router-dom";

import {
    ArrowLeft,
    Camera,
    Star,
} from "lucide-react";

import {
    apiRequest,
} from "../../services/api";

import "./CreateReview.css";


const CreateReview = () => {

    const navigate =
        useNavigate();


    const [review, setReview] =
        useState("");


    const [imagePreview, setImagePreview] =
        useState<string | null>(null);


    const [isSubmitting, setIsSubmitting] =
        useState(false);


    const [errorMessage, setErrorMessage] =
        useState<string | null>(null);


    const handleImageChange = (
        event: ChangeEvent<HTMLInputElement>
    ) => {

        const file =
            event.target.files?.[0];


        if (!file) {
            return;
        }


        const previewUrl =
            URL.createObjectURL(file);


        setImagePreview(
            previewUrl
        );

    };


    const handleSubmit = async (
        event: FormEvent<HTMLFormElement>
    ) => {

        event.preventDefault();


        if (
            !review.trim()
        ) {

            setErrorMessage(
                "Please write your review."
            );

            return;

        }


        try {

            setIsSubmitting(true);

            setErrorMessage(null);


            await apiRequest(
                "/api/reviews",
                {

                    method: "POST",

                    body: JSON.stringify({

                        review:
                            review.trim(),

                    }),

                }
            );


            navigate(
                "/account/reviews"
            );

        } catch (error) {

            console.error(
                "Error creating review:",
                error
            );


            setErrorMessage(

                error instanceof Error
                    ? error.message
                    : "Unable to submit your review."

            );

        } finally {

            setIsSubmitting(false);

        }

    };


    return (

        <main className="create-review-page">

            <div className="create-review-container">


                <Link
                    to="/account/reviews"
                    className="create-review-back"
                >

                    <ArrowLeft size={22} />

                    <span>
                        Back to reviews
                    </span>

                </Link>


                <section className="create-review-header">

                    <div className="create-review-icon">

                        <Star size={30} />

                    </div>


                    <p className="create-review-eyebrow">

                        WRITE A REVIEW

                    </p>


                    <h1>

                        Share your experience

                    </h1>


                    <p>

                        Tell us about your experience
                        with Magic Touch Designs.

                    </p>

                </section>


                <form
                    className="create-review-form"
                    onSubmit={handleSubmit}
                >


                    <div className="create-review-field">

                        <label htmlFor="review-image">

                            Your photo

                        </label>


                        <label
                            htmlFor="review-image"
                            className="create-review-upload"
                        >

                            {imagePreview ? (

                                <img
                                    src={imagePreview}
                                    alt="Review preview"
                                    className="create-review-preview"
                                />

                            ) : (

                                <div className="create-review-upload-content">

                                    <Camera size={32} />

                                    <span>
                                        Upload a photo
                                    </span>

                                    <small>
                                        Photo upload coming soon
                                    </small>

                                </div>

                            )}

                        </label>


                        <input
                            id="review-image"
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="create-review-file"
                        />

                    </div>


                    <div className="create-review-field">

                        <label htmlFor="review">

                            Your review

                        </label>


                        <textarea
                            id="review"
                            value={review}
                            onChange={(event) =>
                                setReview(
                                    event.target.value
                                )
                            }
                            placeholder={
                                "Tell us about your experience..."
                            }
                            rows={6}
                            required
                        />

                    </div>


                    {errorMessage && (

                        <p
                            className="create-review-error"
                        >

                            {errorMessage}

                        </p>

                    )}


                    <button
                        type="submit"
                        className="create-review-submit"
                        disabled={isSubmitting}
                    >

                        {isSubmitting
                            ? "Submitting..."
                            : "Submit review"}

                    </button>


                </form>

            </div>

        </main>

    );

};


export default CreateReview;