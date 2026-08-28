/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: CreateReview.tsx
 * Module: Account Reviews Page
 * Language: TypeScript React
 * Description:
 * Allows an authenticated user to create a new review
 * with an optional photo.
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
        socialPlatform,
        setSocialPlatform,
    ] = useState("");


    const [
        socialUrl,
        setSocialUrl,
    ] = useState("");


    const [
        selectedImage,
        setSelectedImage,
    ] = useState<File | null>(
        null
    );


    const [
        imagePreview,
        setImagePreview,
    ] = useState<string | null>(
        null
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
       CLEANUP IMAGE PREVIEW
    ============================================================ */

    useEffect(() => {

        return () => {

            if (imagePreview) {

                URL.revokeObjectURL(
                    imagePreview
                );

            }

        };

    }, [
        imagePreview,
    ]);


    /* ============================================================
       HANDLE IMAGE
    ============================================================ */

    const handleImageChange = (
        event: ChangeEvent<HTMLInputElement>
    ) => {

        const file =
            event.target.files?.[0];


        if (!file) {

            return;

        }


        /*
        ------------------------------------------------------------
        Validate image type
        ------------------------------------------------------------
        */

        if (
            !file.type.startsWith(
                "image/"
            )
        ) {

            setErrorMessage(
                "Please select a valid image file."
            );

            return;

        }


        /*
        ------------------------------------------------------------
        Validate image size
        Maximum: 5 MB
        ------------------------------------------------------------
        */

        const maxFileSize =
            5 * 1024 * 1024;


        if (
            file.size >
            maxFileSize
        ) {

            setErrorMessage(
                "The image must be smaller than 5 MB."
            );

            return;

        }


        /*
        ------------------------------------------------------------
        Remove previous preview
        ------------------------------------------------------------
        */

        if (imagePreview) {

            URL.revokeObjectURL(
                imagePreview
            );

        }


        /*
        ------------------------------------------------------------
        Create new preview
        ------------------------------------------------------------
        */

        const previewUrl =
            URL.createObjectURL(
                file
            );


        setSelectedImage(
            file
        );


        setImagePreview(
            previewUrl
        );


        setErrorMessage(
            null
        );

    };


    /* ============================================================
       REMOVE IMAGE
    ============================================================ */

    const handleRemoveImage =
        () => {

            if (imagePreview) {

                URL.revokeObjectURL(
                    imagePreview
                );

            }


            setSelectedImage(
                null
            );


            setImagePreview(
                null
            );

        };


    /* ============================================================
       UPLOAD IMAGE
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

                    "/api/upload",

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
                UPLOAD IMAGE
                ====================================================
                */

                let imageUrl:
                    string | null =
                    null;


                if (
                    selectedImage
                ) {

                    imageUrl =
                        await uploadReviewImage(
                            selectedImage
                        );

                }


                /*
                ====================================================
                CREATE REVIEW
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

                                image_url:
                                    imageUrl,

                                social_platform:
                                    socialPlatform ||
                                    null,

                                social_url:
                                    socialUrl.trim() ||
                                    null,

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
                        FORM
                       ================================================== */}

                    <form
                        className="create-review-form"
                        onSubmit={
                            handleSubmit
                        }
                    >


                        {/* ==================================================
                            PHOTO
                           ================================================== */}

                        <div
                            className="create-review-field"
                        >

                            <label
                                htmlFor="review-image"
                            >

                                Your photo

                            </label>


                            <div
                                className="create-review-image-wrapper"
                            >

                                <label
                                    htmlFor="review-image"
                                    className="create-review-upload"
                                >

                                    {imagePreview ? (

                                        <img
                                            src={
                                                imagePreview
                                            }
                                            alt="Review preview"
                                            className="create-review-preview"
                                        />

                                    ) : (

                                        <div
                                            className="create-review-upload-content"
                                        >

                                            <Camera
                                                size={32}
                                            />

                                            <span>

                                                Upload a photo

                                            </span>

                                            <small>

                                                Maximum size:
                                                {" "}
                                                5 MB

                                            </small>

                                        </div>

                                    )}

                                </label>


                                {imagePreview && (

                                    <button
                                        type="button"
                                        className="create-review-remove-image"
                                        onClick={
                                            handleRemoveImage
                                        }
                                        aria-label={
                                            "Remove image"
                                        }
                                    >

                                        <X
                                            size={18}
                                        />

                                    </button>

                                )}

                            </div>


                            <input
                                id="review-image"
                                type="file"
                                accept="image/*"
                                onChange={
                                    handleImageChange
                                }
                                className="create-review-file"
                            />

                        </div>


                        {/* ==================================================
                            REVIEW
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
                            SOCIAL PLATFORM
                           ================================================== */}

                        <div
                            className="create-review-field"
                        >

                            <label
                                htmlFor="social-platform"
                            >

                                Social platform

                            </label>


                            <select
                                id="social-platform"
                                value={
                                    socialPlatform
                                }
                                onChange={
                                    (
                                        event
                                    ) =>

                                        setSocialPlatform(
                                            event.target.value
                                        )

                                }
                                disabled={
                                    isSubmitting
                                }
                            >

                                <option value="">

                                    Select a platform

                                </option>


                                <option
                                    value="instagram"
                                >

                                    Instagram

                                </option>


                                <option
                                    value="facebook"
                                >

                                    Facebook

                                </option>


                                <option
                                    value="tiktok"
                                >

                                    TikTok

                                </option>


                                <option
                                    value="youtube"
                                >

                                    YouTube

                                </option>


                                <option
                                    value="x"
                                >

                                    X

                                </option>


                                <option
                                    value="other"
                                >

                                    Other

                                </option>

                            </select>

                        </div>


                        {/* ==================================================
                            SOCIAL URL
                           ================================================== */}

                        <div
                            className="create-review-field"
                        >

                            <label
                                htmlFor="social-url"
                            >

                                Social profile link

                            </label>


                            <input
                                id="social-url"
                                type="url"
                                value={
                                    socialUrl
                                }
                                onChange={
                                    (
                                        event
                                    ) =>

                                        setSocialUrl(
                                            event.target.value
                                        )

                                }
                                placeholder="https://..."
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