/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: CreateReview.tsx
 * Module: Account Reviews Page
 * Language: TypeScript React
 * Description:
 * Allows an authenticated user to create a new review.
 * A review is only three things: a 1-5 star rating, up to
 * 3 photos of the purchased mug, and a comment.
 * ================================================================
 */

import {
    useEffect,
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
    X,
} from "lucide-react";

import Header from "../../components/layout/Header";
import Footer from "../../components/home/Footer";

import {
    apiRequest,
} from "../../services/api";

import "./CreateReview.css";


/* ===============================================================
   CONSTANTS
================================================================ */

const MAX_PHOTOS = 3;

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
];


/* ===============================================================
   TYPES
================================================================ */

interface UploadResponse {

    message: string;

    image_url: string;

}


interface CreateReviewResponse {

    message: string;

}


/* ===============================================================
   COMPONENT
================================================================ */

function CreateReview() {

    const navigate =
        useNavigate();


    const [
        review,
        setReview,
    ] = useState("");


    const [
        rating,
        setRating,
    ] = useState<number | null>(
        null
    );


    const [
        selectedImages,
        setSelectedImages,
    ] = useState<File[]>(
        []
    );


    const [
        imagePreviews,
        setImagePreviews,
    ] = useState<string[]>(
        []
    );


    const [
        isSubmitting,
        setIsSubmitting,
    ] = useState(false);


    const [
        errorMessage,
        setErrorMessage,
    ] = useState<string | null>(
        null
    );


    /* ============================================================
       CLEANUP IMAGE PREVIEWS
    ============================================================ */

    useEffect(() => {

        return () => {

            imagePreviews.forEach(
                (preview) =>
                    URL.revokeObjectURL(
                        preview
                    )
            );

        };

        // Previews are revoked on unmount only; the list is
        // managed explicitly by add/remove below.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    /* ============================================================
       HANDLE IMAGES (UP TO 3)
    ============================================================ */

    const handleImagesChange = (
        event: ChangeEvent<HTMLInputElement>
    ) => {

        const files =
            Array.from(
                event.target.files ?? []
            );


        // Reset the input so the same file can be picked again.
        event.target.value = "";


        if (
            files.length === 0
        ) {

            return;

        }


        const remainingSlots =
            MAX_PHOTOS - selectedImages.length;


        if (
            remainingSlots <= 0
        ) {

            setErrorMessage(
                `You can upload up to ${MAX_PHOTOS} photos.`
            );

            return;

        }


        const acceptedFiles: File[] = [];
        const acceptedPreviews: string[] = [];
        let skippedForLimit = false;
        let skippedForInvalid = false;


        for (
            const file of files
        ) {

            if (
                acceptedFiles.length >=
                remainingSlots
            ) {

                skippedForLimit = true;
                continue;

            }

            if (
                !ALLOWED_TYPES.includes(
                    file.type
                ) ||
                file.size > MAX_FILE_SIZE
            ) {

                skippedForInvalid = true;
                continue;

            }

            acceptedFiles.push(file);
            acceptedPreviews.push(
                URL.createObjectURL(file)
            );

        }


        if (
            acceptedFiles.length > 0
        ) {

            setSelectedImages(
                (previous) => [
                    ...previous,
                    ...acceptedFiles,
                ]
            );

            setImagePreviews(
                (previous) => [
                    ...previous,
                    ...acceptedPreviews,
                ]
            );

        }


        if (
            skippedForLimit
        ) {

            setErrorMessage(
                `You can upload up to ${MAX_PHOTOS} photos.`
            );

        } else if (
            skippedForInvalid
        ) {

            setErrorMessage(
                "Photos must be JPG, PNG or WEBP and smaller than 5 MB."
            );

        } else {

            setErrorMessage(
                null
            );

        }

    };


    /* ============================================================
       REMOVE IMAGE
    ============================================================ */

    const handleRemoveImage = (
        index: number
    ) => {

        const preview =
            imagePreviews[index];

        if (preview) {

            URL.revokeObjectURL(
                preview
            );

        }

        setSelectedImages(
            (previous) =>
                previous.filter(
                    (_, itemIndex) =>
                        itemIndex !== index
                )
        );

        setImagePreviews(
            (previous) =>
                previous.filter(
                    (_, itemIndex) =>
                        itemIndex !== index
                )
        );

    };


    /* ============================================================
       UPLOAD ONE IMAGE
    ============================================================ */

    const uploadReviewImage =
        async (
            file: File
        ): Promise<string> => {

            const formData =
                new FormData();


            formData.append(
                "image",
                file
            );


            const result =
                await apiRequest<UploadResponse>(

                    "/api/upload/review",

                    {

                        method:
                            "POST",

                        body:
                            formData,

                    }

                );


            return result.image_url;

        };


    /* ============================================================
       SUBMIT REVIEW
    ============================================================ */

    const handleSubmit =
        async (
            event:
                FormEvent<HTMLFormElement>
        ) => {

            event.preventDefault();


            /*
            --------------------------------------------------------
            Validate rating
            A star rating from 1 to 5 is required.
            --------------------------------------------------------
            */

            if (
                rating === null
            ) {

                setErrorMessage(
                    "Please select a star rating."
                );

                return;

            }


            /*
            --------------------------------------------------------
            Validate review
            --------------------------------------------------------
            */

            if (
                !review.trim()
            ) {

                setErrorMessage(
                    "Please write your review."
                );

                return;

            }


            try {

                setIsSubmitting(
                    true
                );


                setErrorMessage(
                    null
                );


                /*
                ====================================================
                UPLOAD PHOTOS (UP TO 3)
                ====================================================
                */

                const imageUrls: string[] = [];


                for (
                    const file of selectedImages
                ) {

                    imageUrls.push(
                        await uploadReviewImage(
                            file
                        )
                    );

                }


                /*
                ====================================================
                CREATE REVIEW
                A review is only: stars, photos, comment.
                ====================================================
                */

                await apiRequest<CreateReviewResponse>(

                    "/api/reviews",

                    {

                        method:
                            "POST",

                        body:
                            JSON.stringify({

                                review:
                                    review.trim(),

                                rating,

                                image_urls:
                                    imageUrls,

                            }),

                    }

                );


                /*
                ====================================================
                SUCCESS
                ====================================================
                */

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

                setIsSubmitting(
                    false
                );

            }

        };


    /* ============================================================
       RENDER
    ============================================================ */

    return (

        <>

            <Header />


            <main
                className="create-review-page"
            >

                <div
                    className="create-review-container"
                >


                    {/* ==================================================
                        BACK
                       ================================================== */}

                    <Link
                        to="/account/reviews"
                        className="create-review-back"
                    >

                        <ArrowLeft
                            size={22}
                        />

                        <span>

                            Back to reviews

                        </span>

                    </Link>


                    {/* ==================================================
                        HEADER
                       ================================================== */}

                    <section
                        className="create-review-header"
                    >

                        <div
                            className="create-review-icon"
                        >

                            <Star
                                size={30}
                            />

                        </div>


                        <p
                            className="create-review-eyebrow"
                        >

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


                    {/* ==================================================
                        FORM: STARS, PHOTOS, COMMENT — NOTHING ELSE
                       ================================================== */}

                    <form
                        className="create-review-form"
                        onSubmit={
                            handleSubmit
                        }
                    >


                        {/* ==================================================
                            STAR RATING
                           ================================================== */}

                        <div
                            className="create-review-field"
                        >

                            <span
                                id="rating-label"
                                className="create-review-rating-label"
                            >

                                Your rating

                            </span>


                            <div
                                className="create-review-stars"
                                role="radiogroup"
                                aria-labelledby="rating-label"
                            >

                                {[1, 2, 3, 4, 5].map(
                                    (value) => (

                                        <button
                                            key={value}
                                            type="button"
                                            role="radio"
                                            aria-checked={
                                                rating === value
                                            }
                                            aria-label={
                                                `Rate ${value} star${value > 1 ? "s" : ""}`
                                            }
                                            className={
                                                rating !== null &&
                                                value <= rating
                                                    ? "create-review-star create-review-star--active"
                                                    : "create-review-star"
                                            }
                                            onClick={() =>
                                                setRating(value)
                                            }
                                            disabled={
                                                isSubmitting
                                            }
                                        >

                                            <Star
                                                size={30}
                                                fill={
                                                    rating !== null &&
                                                    value <= rating
                                                        ? "currentColor"
                                                        : "none"
                                                }
                                            />

                                        </button>

                                    )
                                )}

                            </div>

                        </div>


                        {/* ==================================================
                            PHOTOS (UP TO 3)
                           ================================================== */}

                        <div
                            className="create-review-field"
                        >

                            <label
                                htmlFor="review-images"
                            >

                                Photos of your purchase

                            </label>


                            <div
                                className="create-review-photos"
                            >

                                {imagePreviews.map(
                                    (
                                        preview,
                                        index
                                    ) => (

                                        <div
                                            key={preview}
                                            className="create-review-photo-tile"
                                        >

                                            <img
                                                src={preview}
                                                alt={`Purchase photo ${index + 1}`}
                                                className="create-review-photo-preview"
                                            />

                                            <button
                                                type="button"
                                                className="create-review-photo-remove"
                                                onClick={() =>
                                                    handleRemoveImage(
                                                        index
                                                    )
                                                }
                                                aria-label={
                                                    `Remove photo ${index + 1}`
                                                }
                                                disabled={
                                                    isSubmitting
                                                }
                                            >

                                                <X
                                                    size={18}
                                                />

                                            </button>

                                        </div>

                                    )
                                )}


                                {selectedImages.length <
                                    MAX_PHOTOS && (

                                    <label
                                        htmlFor="review-images"
                                        className="create-review-add-tile"
                                    >

                                        <Camera
                                            size={32}
                                        />

                                        <span>

                                            Add a photo

                                        </span>

                                        <small>

                                            {selectedImages.length}
                                            {" "}of{" "}
                                            {MAX_PHOTOS}
                                            {" "}· 5 MB max

                                        </small>

                                    </label>

                                )}

                            </div>


                            <input
                                id="review-images"
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                multiple
                                onChange={
                                    handleImagesChange
                                }
                                className="create-review-file"
                                disabled={
                                    isSubmitting
                                }
                            />

                        </div>


                        {/* ==================================================
                            COMMENT
                           ================================================== */}

                        <div
                            className="create-review-field"
                        >

                            <label
                                htmlFor="review"
                            >

                                Your review

                            </label>


                            <textarea
                                id="review"
                                value={
                                    review
                                }
                                onChange={
                                    (
                                        event
                                    ) =>

                                        setReview(
                                            event.target.value
                                        )

                                }
                                placeholder={
                                    "Tell us about your experience..."
                                }
                                rows={6}
                                required
                                disabled={
                                    isSubmitting
                                }
                            />

                        </div>


                        {/* ==================================================
                            ERROR
                           ================================================== */}

                        {errorMessage && (

                            <p
                                className="create-review-error"
                            >

                                {
                                    errorMessage
                                }

                            </p>

                        )}


                        {/* ==================================================
                            SUBMIT
                           ================================================== */}

                        <button
                            type="submit"
                            className="create-review-submit"
                            disabled={
                                isSubmitting
                            }
                        >

                            {
                                isSubmitting

                                    ? "Submitting..."

                                    : "Submit review"

                            }

                        </button>


                    </form>

                </div>

            </main>


            <Footer />

        </>

    );

}


export default CreateReview;
