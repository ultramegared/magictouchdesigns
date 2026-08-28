/**
 * ================================================================
 * Project: Magic Touch Designs
 * Author: ultramegared
 * File: AdminReviews.tsx
 * Module: Administrator Panel
 * Language: TypeScript React
 * Description:
 * Administrative review management page.
 * Allows administrators to review, approve,
 * and permanently delete customer reviews with images.
 * ================================================================
 */

import {
    useEffect,
    useState,
} from "react";

import {
    CheckCircle2,
    Clock,
    Image,
    RefreshCw,
    Star,
    Trash2,
} from "lucide-react";

import AdminSidebar from "./AdminSidebar";

import {
    apiRequest,
} from "../../services/api";

import "./AdminReviews.css";


/* ===============================================================
   TYPES
================================================================ */

interface AdminReview {

    id: string;

    user_id: string;

    review: string;

    image_url: string | null;

    social_platform: string | null;

    social_url: string | null;

    is_approved: boolean;

    created_at: string;

    updated_at: string;

    username: string;

    first_name: string | null;

    last_name: string | null;

    email: string;

}


type ReviewFilter =
    | "all"
    | "pending"
    | "approved";


interface AdminReviewsResponse {

    status: string;

    reviews: AdminReview[];

}


interface ApproveReviewResponse {

    status: string;

    message: string;

    review: AdminReview;

}


interface DeleteReviewResponse {

    status: string;

    message: string;

}


/* ===============================================================
   HELPERS
================================================================ */

const getCustomerName = (
    review: AdminReview
) => {

    const fullName = [

        review.first_name,

        review.last_name,

    ]
        .filter(Boolean)
        .join(" ")
        .trim();


    return (
        fullName ||
        review.username
    );

};


const formatDate = (
    date: string
) => {

    return new Intl.DateTimeFormat(
        "en-US",
        {

            year:
                "numeric",

            month:
                "short",

            day:
                "numeric",

        }
    ).format(
        new Date(date)
    );

};


/* ===============================================================
   COMPONENT
================================================================ */

function AdminReviews() {

    const [
        reviews,
        setReviews,
    ] = useState<AdminReview[]>(
        []
    );


    const [
        currentUser,
        setCurrentUser,
    ] = useState<{
        username: string;
    } | null>(
        null
    );


    const [
        filter,
        setFilter,
    ] = useState<ReviewFilter>(
        "all"
    );


    const [
        loading,
        setLoading,
    ] = useState(true);


    const [
        approvingId,
        setApprovingId,
    ] = useState<string | null>(
        null
    );


    const [
        deletingId,
        setDeletingId,
    ] = useState<string | null>(
        null
    );


    const [
        error,
        setError,
    ] = useState<string | null>(
        null
    );


    /* ============================================================
       LOAD REVIEWS
    ============================================================ */

    const loadReviews =
        async (
            selectedFilter:
                ReviewFilter = filter
        ) => {

            try {

                setLoading(true);

                setError(null);


                const [
                    reviewsResult,
                    userResult,
                ] = await Promise.all([

                    apiRequest<AdminReviewsResponse>(
                        `/api/admin/reviews?status=${selectedFilter}`
                    ),

                    apiRequest<{
                        status: string;

                        user: {
                            username: string;
                        };
                    }>(
                        "/api/user/me"
                    ),

                ]);


                setReviews(
                    reviewsResult.reviews
                );


                setCurrentUser(
                    userResult.user
                );

            } catch (error) {

                console.error(
                    "Unable to load administrator reviews:",
                    error
                );


                setError(
                    "Unable to load reviews."
                );

            } finally {

                setLoading(
                    false
                );

            }

        };


    useEffect(() => {

        loadReviews();

    }, []);


    /* ============================================================
       FILTER CHANGE
    ============================================================ */

    const handleFilterChange = (
        selectedFilter:
            ReviewFilter
    ) => {

        setFilter(
            selectedFilter
        );


        loadReviews(
            selectedFilter
        );

    };


    /* ============================================================
       APPROVE REVIEW
    ============================================================ */

    const handleApprove =
        async (
            reviewId: string
        ) => {

            try {

                setApprovingId(
                    reviewId
                );


                setError(
                    null
                );


                const result =
                    await apiRequest<ApproveReviewResponse>(
                        `/api/admin/reviews/${reviewId}/approve`,
                        {

                            method:
                                "PATCH",

                        }
                    );


                setReviews(
                    (
                        currentReviews
                    ) =>

                        currentReviews.map(
                            (
                                review
                            ) =>

                                review.id ===
                                reviewId

                                    ? result.review

                                    : review

                        )
                );

            } catch (error) {

                console.error(
                    "Unable to approve review:",
                    error
                );


                setError(
                    "Unable to approve review."
                );

            } finally {

                setApprovingId(
                    null
                );

            }

        };


    /* ============================================================
       DELETE REVIEW
    ============================================================ */

    const handleDelete =
        async (
            reviewId: string
        ) => {

            const confirmed =
                window.confirm(
                    "Are you sure you want to permanently delete this review?"
                );


            if (!confirmed) {

                return;

            }


            try {

                setDeletingId(
                    reviewId
                );


                setError(
                    null
                );


                await apiRequest<DeleteReviewResponse>(
                    `/api/admin/reviews/${reviewId}`,
                    {

                        method:
                            "DELETE",

                    }
                );


                setReviews(
                    (
                        currentReviews
                    ) =>

                        currentReviews.filter(
                            (
                                review
                            ) =>

                                review.id !==
                                reviewId
                        )
                );

            } catch (error) {

                console.error(
                    "Unable to delete review:",
                    error
                );


                setError(
                    "Unable to delete review."
                );

            } finally {

                setDeletingId(
                    null
                );

            }

        };


    return (

        <div
            className="admin-layout"
        >


            {/* ======================================================
                SIDEBAR
               ====================================================== */}

            <AdminSidebar
                username={
                    currentUser?.username
                        || "Administrator"
                }
            />


            {/* ======================================================
                MAIN
               ====================================================== */}

            <main
                className="admin-reviews"
            >


                {/* ==================================================
                    HERO
                   ================================================== */}

                <section
                    className="admin-reviews__hero"
                >

                    <div
                        className="admin-reviews__hero-content"
                    >

                        <div>

                            <span
                                className="admin-reviews__eyebrow"
                            >

                                ADMINISTRATION

                            </span>


                            <h1>

                                Customer Reviews

                            </h1>


                            <p>

                                Review and approve customer
                                feedback and photos before
                                displaying them publicly.

                            </p>

                        </div>


                        <div
                            className="admin-reviews__hero-icon"
                        >

                            <Star
                                size={42}
                            />

                        </div>

                    </div>

                </section>


                {/* ==================================================
                    CONTENT
                   ================================================== */}

                <section
                    className="admin-reviews__container"
                >


                    {/* FILTERS */}

                    <div
                        className="admin-reviews__toolbar"
                    >

                        <div
                            className="admin-reviews__filters"
                        >

                            <button
                                type="button"
                                className={
                                    filter === "all"
                                        ? "admin-reviews__filter admin-reviews__filter--active"
                                        : "admin-reviews__filter"
                                }
                                onClick={() =>
                                    handleFilterChange(
                                        "all"
                                    )
                                }
                            >

                                All

                            </button>


                            <button
                                type="button"
                                className={
                                    filter === "pending"
                                        ? "admin-reviews__filter admin-reviews__filter--active"
                                        : "admin-reviews__filter"
                                }
                                onClick={() =>
                                    handleFilterChange(
                                        "pending"
                                    )
                                }
                            >

                                Pending

                            </button>


                            <button
                                type="button"
                                className={
                                    filter === "approved"
                                        ? "admin-reviews__filter admin-reviews__filter--active"
                                        : "admin-reviews__filter"
                                }
                                onClick={() =>
                                    handleFilterChange(
                                        "approved"
                                    )
                                }
                            >

                                Approved

                            </button>

                        </div>


                        <button
                            type="button"
                            className="admin-reviews__refresh"
                            onClick={() =>
                                loadReviews()
                            }
                            disabled={
                                loading
                            }
                        >

                            <RefreshCw
                                size={18}
                            />

                            Refresh

                        </button>

                    </div>


                    {/* LOADING */}

                    {loading && (

                        <div
                            className="admin-reviews__message"
                        >

                            Loading reviews...

                        </div>

                    )}


                    {/* ERROR */}

                    {error && (

                        <div
                            className="admin-reviews__message admin-reviews__message--error"
                        >

                            {error}

                        </div>

                    )}


                    {/* EMPTY */}

                    {!loading &&
                        !error &&
                        reviews.length === 0 && (

                            <div
                                className="admin-reviews__message"
                            >

                                No reviews found.

                            </div>

                        )}


                    {/* REVIEW LIST */}

                    {!loading &&
                        reviews.length > 0 && (

                            <div
                                className="admin-reviews__list"
                            >

                                {reviews.map(
                                    (
                                        review
                                    ) => {

                                        const customerName =
                                            getCustomerName(
                                                review
                                            );


                                        return (

                                            <article
                                                key={
                                                    review.id
                                                }
                                                className="admin-reviews__card"
                                            >


                                                {/* IMAGE */}

                                                <div
                                                    className="admin-reviews__image"
                                                >

                                                    {review.image_url ? (

                                                        <img
                                                            src={
                                                                review.image_url
                                                            }
                                                            alt={`${customerName}'s review`}
                                                        />

                                                    ) : (

                                                        <div
                                                            className="admin-reviews__image-placeholder"
                                                        >

                                                            <Image
                                                                size={26}
                                                            />

                                                        </div>

                                                    )}

                                                </div>


                                                {/* CONTENT */}

                                                <div
                                                    className="admin-reviews__content"
                                                >


                                                    <div
                                                        className="admin-reviews__card-header"
                                                    >

                                                        <div>

                                                            <h2>

                                                                {
                                                                    customerName
                                                                }

                                                            </h2>


                                                            <span>

                                                                @
                                                                {
                                                                    review.username
                                                                }

                                                            </span>

                                                        </div>


                                                        <div
                                                            className={
                                                                review.is_approved
                                                                    ? "admin-reviews__status admin-reviews__status--approved"
                                                                    : "admin-reviews__status admin-reviews__status--pending"
                                                            }
                                                        >

                                                            {review.is_approved ? (

                                                                <CheckCircle2
                                                                    size={
                                                                        16
                                                                    }
                                                                />

                                                            ) : (

                                                                <Clock
                                                                    size={
                                                                        16
                                                                    }
                                                                />

                                                            )}


                                                            {
                                                                review.is_approved
                                                                    ? "Approved"
                                                                    : "Pending"
                                                            }

                                                        </div>

                                                    </div>


                                                    <p
                                                        className="admin-reviews__text"
                                                    >

                                                        {
                                                            review.review
                                                        }

                                                    </p>


                                                    <div
                                                        className="admin-reviews__meta"
                                                    >

                                                        Submitted:

                                                        {" "}

                                                        {
                                                            formatDate(
                                                                review.created_at
                                                            )
                                                        }

                                                    </div>


                                                    {/* ACTIONS */}

                                                    <div
                                                        className="admin-reviews__actions"
                                                    >

                                                        {!review.is_approved && (

                                                            <button
                                                                type="button"
                                                                className="admin-reviews__approve"
                                                                onClick={() =>
                                                                    handleApprove(
                                                                        review.id
                                                                    )
                                                                }
                                                                disabled={
                                                                    approvingId ===
                                                                        review.id ||
                                                                    deletingId ===
                                                                        review.id
                                                                }
                                                            >

                                                                <CheckCircle2
                                                                    size={
                                                                        18
                                                                    }
                                                                />


                                                                {
                                                                    approvingId ===
                                                                    review.id

                                                                        ? "Approving..."

                                                                        : "Approve Review"
                                                                }

                                                            </button>

                                                        )}


                                                        <button
                                                            type="button"
                                                            className="admin-reviews__delete"
                                                            onClick={() =>
                                                                handleDelete(
                                                                    review.id
                                                                )
                                                            }
                                                            disabled={
                                                                deletingId ===
                                                                    review.id ||
                                                                approvingId ===
                                                                    review.id
                                                            }
                                                        >

                                                            <Trash2
                                                                size={
                                                                    18
                                                                }
                                                            />


                                                            {
                                                                deletingId ===
                                                                review.id

                                                                    ? "Deleting..."

                                                                    : "Delete Review"
                                                            }

                                                        </button>

                                                    </div>

                                                </div>

                                            </article>

                                        );

                                    }
                                )}

                            </div>

                        )}

                </section>

            </main>

        </div>

    );

}


export default AdminReviews;