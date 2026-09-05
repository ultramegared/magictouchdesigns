/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: AdminSubscribers.tsx
 * Module: Administrator Subscribers
 * Language: TypeScript React
 * Description:
 * Administrative newsletter subscriber management and promotions.
 * ================================================================
 */

import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import type {
    ChangeEvent,
} from "react";

import {
    Mail,
    Search,
    RefreshCw,
    Users,
    UserCheck,
    UserX,
    Trash2,
    Check,
    X,
    Upload,
    Send,
    Eye,
} from "lucide-react";

import AdminSidebar from "./AdminSidebar";

import { apiRequest } from "../../services/api";

import "./AdminSubscribers.css";


/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

type SubscriberLanguage =
    | "en"
    | "es";


type SubscriberStatus =
    | "all"
    | "active"
    | "inactive";


interface Subscriber {
    id:
        string;

    email:
        string;

    is_active:
        boolean;

    language:
        SubscriberLanguage;

    created_at:
        string;

    updated_at:
        string;
}


interface SubscriberCounts {
    total:
        number;

    active:
        number;

    inactive:
        number;

    active_en:
        number;

    active_es:
        number;
}


interface UploadResponse {
    status:
        string;

    message:
        string;

    image_url:
        string;
}


interface PromotionResponse {
    status:
        string;

    message:
        string;

    data: {
        totalRecipients:
            number;

        englishRecipients:
            number;

        spanishRecipients:
            number;

        englishSent:
            boolean;

        spanishSent:
            boolean;
    };
}


/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

function AdminSubscribers() {

    const [
        subscribers,
        setSubscribers,
    ] = useState<Subscriber[]>([]);


    const [
        counts,
        setCounts,
    ] = useState<SubscriberCounts>({
        total:
            0,

        active:
            0,

        inactive:
            0,

        active_en:
            0,

        active_es:
            0,
    });


    const [
        search,
        setSearch,
    ] = useState("");


    const [
        status,
        setStatus,
    ] = useState<SubscriberStatus>(
        "all"
    );


    const [
        loading,
        setLoading,
    ] = useState(true);


    const [
        actionLoading,
        setActionLoading,
    ] = useState<string | null>(
        null
    );


    const [
        error,
        setError,
    ] = useState<string | null>(
        null
    );


    /*
    |--------------------------------------------------------------------------
    | Promotion State
    |--------------------------------------------------------------------------
    */

    const [
        promotionSubject,
        setPromotionSubject,
    ] = useState("");


    const [
        promotionMessage,
        setPromotionMessage,
    ] = useState("");


    const [
        promotionImage,
        setPromotionImage,
    ] = useState<File | null>(
        null
    );


    const [
        promotionImagePreview,
        setPromotionImagePreview,
    ] = useState<string | null>(
        null
    );


    const [
        promotionSending,
        setPromotionSending,
    ] = useState(false);


    const [
        promotionSuccess,
        setPromotionSuccess,
    ] = useState<string | null>(
        null
    );


    const [
        promotionError,
        setPromotionError,
    ] = useState<string | null>(
        null
    );


    const promotionImageInputRef =
        useRef<HTMLInputElement | null>(
            null
        );


    /*
    |--------------------------------------------------------------------------
    | Load Subscribers
    |--------------------------------------------------------------------------
    */

    const loadSubscribers =
        useCallback(
            async () => {

                try {

                    setLoading(
                        true
                    );

                    setError(
                        null
                    );


                    const params =
                        new URLSearchParams();


                    if (
                        search.trim()
                    ) {

                        params.set(
                            "search",
                            search.trim()
                        );

                    }


                    if (
                        status !== "all"
                    ) {

                        params.set(
                            "status",
                            status
                        );

                    }


                    const query =
                        params.toString();


                    const subscribersResult =
                        await apiRequest<{
                            subscribers:
                                Subscriber[];
                        }>(
                            query
                                ? `/api/subscribers/admin?${query}`
                                : "/api/subscribers/admin"
                        );


                    const countsResult =
                        await apiRequest<{
                            counts:
                                SubscriberCounts;
                        }>(
                            "/api/subscribers/admin/counts"
                        );


                    setSubscribers(
                        subscribersResult.subscribers
                    );


                    setCounts(
                        countsResult.counts
                    );

                } catch (
                    requestError
                ) {

                    setError(
                        requestError
                            instanceof Error
                            ? requestError.message
                            : "Unable to load subscribers."
                    );

                } finally {

                    setLoading(
                        false
                    );

                }

            },
            [
                search,
                status,
            ]
        );


    /*
    |--------------------------------------------------------------------------
    | Initial Load
    |--------------------------------------------------------------------------
    */

    useEffect(
        () => {

            loadSubscribers();

        },
        [
            loadSubscribers,
        ]
    );


    /*
    |--------------------------------------------------------------------------
    | Update Status
    |--------------------------------------------------------------------------
    */

    const handleStatusChange =
        async (
            subscriber:
                Subscriber
        ) => {

            try {

                setActionLoading(
                    subscriber.id
                );


                await apiRequest(
                    `/api/subscribers/admin/${subscriber.id}/status`,
                    {
                        method:
                            "PATCH",

                        body:
                            JSON.stringify({
                                is_active:
                                    !subscriber.is_active,
                            }),
                    }
                );


                await loadSubscribers();

            } catch (
                requestError
            ) {

                setError(
                    requestError
                        instanceof Error
                        ? requestError.message
                        : "Unable to update subscriber."
                );

            } finally {

                setActionLoading(
                    null
                );

            }

        };


    /*
    |--------------------------------------------------------------------------
    | Update Language
    |--------------------------------------------------------------------------
    */

    const handleLanguageChange =
        async (
            subscriber:
                Subscriber
        ) => {

            const nextLanguage:
                SubscriberLanguage =
                subscriber.language === "en"
                    ? "es"
                    : "en";


            try {

                setActionLoading(
                    subscriber.id
                );


                await apiRequest(
                    `/api/subscribers/admin/${subscriber.id}/language`,
                    {
                        method:
                            "PATCH",

                        body:
                            JSON.stringify({
                                language:
                                    nextLanguage,
                            }),
                    }
                );


                await loadSubscribers();

            } catch (
                requestError
            ) {

                setError(
                    requestError
                        instanceof Error
                        ? requestError.message
                        : "Unable to update language."
                );

            } finally {

                setActionLoading(
                    null
                );

            }

        };


    /*
    |--------------------------------------------------------------------------
    | Delete Subscriber
    |--------------------------------------------------------------------------
    */

    const handleDelete =
        async (
            subscriber:
                Subscriber
        ) => {

            const confirmed =
                window.confirm(
                    `Delete subscriber ${subscriber.email}?`
                );


            if (
                !confirmed
            ) {

                return;

            }


            try {

                setActionLoading(
                    subscriber.id
                );


                await apiRequest(
                    `/api/subscribers/admin/${subscriber.id}`,
                    {
                        method:
                            "DELETE",
                    }
                );


                await loadSubscribers();

            } catch (
                requestError
            ) {

                setError(
                    requestError
                        instanceof Error
                        ? requestError.message
                        : "Unable to delete subscriber."
                );

            } finally {

                setActionLoading(
                    null
                );

            }

        };


    /*
    |--------------------------------------------------------------------------
    | Promotion Image Selection
    |--------------------------------------------------------------------------
    */

    const handlePromotionImageChange =
        (
            event:
                ChangeEvent<HTMLInputElement>
        ) => {

            const file =
                event.target.files?.[0];


            if (
                !file
            ) {

                return;

            }


            setPromotionError(
                null
            );

            setPromotionSuccess(
                null
            );


            const allowedTypes =
                [
                    "image/jpeg",
                    "image/png",
                    "image/webp",
                ];


            if (
                !allowedTypes.includes(
                    file.type
                )
            ) {

                setPromotionError(
                    "Please select a JPG, PNG, or WEBP image."
                );

                event.target.value =
                    "";

                return;

            }


            const maxFileSize =
                5 * 1024 * 1024;


            if (
                file.size > maxFileSize
            ) {

                setPromotionError(
                    "The promotion image must be 5 MB or smaller."
                );

                event.target.value =
                    "";

                return;

            }


            if (
                promotionImagePreview
            ) {

                URL.revokeObjectURL(
                    promotionImagePreview
                );

            }


            const previewUrl =
                URL.createObjectURL(
                    file
                );


            setPromotionImage(
                file
            );


            setPromotionImagePreview(
                previewUrl
            );

        };


    /*
    |--------------------------------------------------------------------------
    | Remove Promotion Image
    |--------------------------------------------------------------------------
    */

    const handleRemovePromotionImage =
        () => {

            if (
                promotionImagePreview
            ) {

                URL.revokeObjectURL(
                    promotionImagePreview
                );

            }


            setPromotionImage(
                null
            );


            setPromotionImagePreview(
                null
            );


            if (
                promotionImageInputRef.current
            ) {

                promotionImageInputRef.current.value =
                    "";

            }

        };


    /*
    |--------------------------------------------------------------------------
    | Send Promotion
    |--------------------------------------------------------------------------
    */

    const handleSendPromotion =
        async () => {

            setPromotionError(
                null
            );

            setPromotionSuccess(
                null
            );


            const subject =
                promotionSubject.trim();

            const message =
                promotionMessage.trim();


            if (
                !subject
            ) {

                setPromotionError(
                    "Please enter a promotion subject."
                );

                return;

            }


            if (
                !message
            ) {

                setPromotionError(
                    "Please enter a promotion message."
                );

                return;

            }


            if (
                counts.active === 0
            ) {

                setPromotionError(
                    "There are no active subscribers to receive this promotion."
                );

                return;

            }


            const confirmed =
                window.confirm(
                    `Send this promotion to ${counts.active} active subscriber${counts.active === 1 ? "" : "s"}?\n\nEnglish: ${counts.active_en}\nSpanish: ${counts.active_es}`
                );


            if (
                !confirmed
            ) {

                return;

            }


            try {

                setPromotionSending(
                    true
                );


                let imageUrl:
                    string
                    | undefined;


                /*
                |--------------------------------------------------------------------------
                | Upload Image
                |--------------------------------------------------------------------------
                */

                if (
                    promotionImage
                ) {

                    const formData =
                        new FormData();


                    formData.append(
                        "image",
                        promotionImage
                    );


                    const uploadResult =
                        await apiRequest<UploadResponse>(
                            "/api/upload/promotion",
                            {
                                method:
                                    "POST",

                                body:
                                    formData,
                            }
                        );


                    imageUrl =
                        uploadResult.image_url;

                }


                /*
                |--------------------------------------------------------------------------
                | Send Promotion
                |--------------------------------------------------------------------------
                */

                const promotionResult =
                    await apiRequest<PromotionResponse>(
                        "/api/subscribers/admin/promotion",
                        {
                            method:
                                "POST",

                            body:
                                JSON.stringify({
                                    subject,

                                    message,

                                    imageUrl,
                                }),
                        }
                    );


                const result =
                    promotionResult.data;


                setPromotionSuccess(
                    `Promotion sent successfully to ${result.totalRecipients} subscriber${result.totalRecipients === 1 ? "" : "s"} -- EN ${result.englishRecipients} / ES ${result.spanishRecipients}.`
                );


                setPromotionSubject(
                    ""
                );


                setPromotionMessage(
                    ""
                );


                handleRemovePromotionImage();

            } catch (
                requestError
            ) {

                setPromotionError(
                    requestError
                        instanceof Error
                        ? requestError.message
                        : "Unable to send promotion."
                );

            } finally {

                setPromotionSending(
                    false
                );

            }

        };


    /*
    |--------------------------------------------------------------------------
    | Format Date
    |--------------------------------------------------------------------------
    */

    const formatDate =
        (
            date:
                string
        ) => {

            return new Date(
                date
            ).toLocaleDateString(
                undefined,
                {
                    year:
                        "numeric",

                    month:
                        "short",

                    day:
                        "numeric",
                }
            );

        };


    /*
    |--------------------------------------------------------------------------
    | Render
    |--------------------------------------------------------------------------
    */

    return (

        <div className="admin-page">

            <AdminSidebar />

            <main className="admin-subscribers">

                {/* ==================================================
                    HEADER
                   ================================================== */}

                <header className="admin-subscribers__header">

                    <div>

                        <div className="admin-subscribers__eyebrow">

                            <Mail
                                size={16}
                            />

                            <span>
                                Newsletter
                            </span>

                        </div>

                        <h1>
                            Subscribers
                        </h1>

                        <p>
                            Manage your newsletter subscribers.
                        </p>

                    </div>

                    <button
                        type="button"
                        className="admin-subscribers__refresh"
                        onClick={
                            loadSubscribers
                        }
                        disabled={
                            loading
                            || promotionSending
                        }
                    >

                        <RefreshCw
                            size={17}
                            className={
                                loading
                                    ? "admin-subscribers__refresh-icon--spinning"
                                    : ""
                            }
                        />

                        <span>
                            Refresh
                        </span>

                    </button>

                </header>


                {/* ==================================================
                    ERROR
                   ================================================== */}

                {
                    error && (

                        <div
                            className="admin-subscribers__error"
                            role="alert"
                        >

                            <X
                                size={18}
                            />

                            <span>
                                {error}
                            </span>

                        </div>

                    )
                }


                {/* ==================================================
                    STATISTICS
                   ================================================== */}

                <section className="admin-subscribers__stats">

                    <div className="admin-subscribers__stat-card">

                        <div className="admin-subscribers__stat-icon">

                            <Users
                                size={21}
                            />

                        </div>

                        <div>

                            <span>
                                Total
                            </span>

                            <strong>
                                {counts.total}
                            </strong>

                        </div>

                    </div>


                    <div className="admin-subscribers__stat-card">

                        <div className="admin-subscribers__stat-icon">

                            <UserCheck
                                size={21}
                            />

                        </div>

                        <div>

                            <span>
                                Active
                            </span>

                            <strong>
                                {counts.active}
                            </strong>

                        </div>

                    </div>


                    <div className="admin-subscribers__stat-card">

                        <div className="admin-subscribers__stat-icon">

                            <UserX
                                size={21}
                            />

                        </div>

                        <div>

                            <span>
                                Inactive
                            </span>

                            <strong>
                                {counts.inactive}
                            </strong>

                        </div>

                    </div>


                    <div className="admin-subscribers__stat-card">

                        <div className="admin-subscribers__stat-icon">

                            <Mail
                                size={21}
                            />

                        </div>

                        <div>

                            <span>
                                Languages
                            </span>

                            <strong>
                                EN {counts.active_en}
                                {" "}
                                /
                                {" "}
                                ES {counts.active_es}
                            </strong>

                        </div>

                    </div>

                </section>


                {/* ==================================================
                    PROMOTION COMPOSER
                   ================================================== */}

                <section className="admin-subscribers__promotion">

                    <div className="admin-subscribers__promotion-header">

                        <div>

                            <div className="admin-subscribers__promotion-eyebrow">

                                <Send
                                    size={15}
                                />

                                <span>
                                    Promotion
                                </span>

                            </div>

                            <h2>
                                Send a Promotion
                            </h2>

                            <p>
                                Create one promotion in English.
                                Spanish subscribers will receive an
                                automatic Spanish translation.
                            </p>

                        </div>


                        <div className="admin-subscribers__promotion-recipients">

                            <span>
                                Active recipients
                            </span>

                            <strong>
                                {counts.active}
                            </strong>

                            <div>

                                <span>
                                    EN {counts.active_en}
                                </span>

                                <span>
                                    ES {counts.active_es}
                                </span>

                            </div>

                        </div>

                    </div>


                    <div className="admin-subscribers__promotion-grid">

                        <div className="admin-subscribers__promotion-fields">

                            <label>

                                <span>
                                    Subject
                                </span>

                                <input
                                    type="text"
                                    value={
                                        promotionSubject
                                    }
                                    onChange={
                                        (
                                            event
                                        ) =>
                                            setPromotionSubject(
                                                event.target.value
                                            )
                                    }
                                    placeholder="Example: Summer Sale -- 20% Off"
                                    maxLength={
                                        180
                                    }
                                    disabled={
                                        promotionSending
                                    }
                                />

                            </label>


                            <label>

                                <span>
                                    Message in English
                                </span>

                                <textarea
                                    value={
                                        promotionMessage
                                    }
                                    onChange={
                                        (
                                            event
                                        ) =>
                                            setPromotionMessage(
                                                event.target.value
                                            )
                                    }
                                    placeholder="Write your promotion message here..."
                                    rows={
                                        10
                                    }
                                    disabled={
                                        promotionSending
                                    }
                                />

                            </label>


                            <div className="admin-subscribers__promotion-upload">

                                <div className="admin-subscribers__promotion-upload-label">

                                    <span>
                                        Promotion Image
                                    </span>

                                    <small>
                                        Optional · JPG, PNG, WEBP · Max 5 MB
                                    </small>

                                </div>


                                <input
                                    ref={
                                        promotionImageInputRef
                                    }
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={
                                        handlePromotionImageChange
                                    }
                                    hidden
                                    disabled={
                                        promotionSending
                                    }
                                />


                                {
                                    promotionImagePreview ? (

                                        <div className="admin-subscribers__promotion-image-preview">

                                            <img
                                                src={
                                                    promotionImagePreview
                                                }
                                                alt="Promotion preview"
                                            />

                                            <button
                                                type="button"
                                                onClick={
                                                    handleRemovePromotionImage
                                                }
                                                disabled={
                                                    promotionSending
                                                }
                                                title="Remove image"
                                            >

                                                <X
                                                    size={17}
                                                />

                                            </button>

                                        </div>

                                    ) : (

                                        <button
                                            type="button"
                                            className="admin-subscribers__promotion-upload-button"
                                            onClick={
                                                () =>
                                                    promotionImageInputRef.current?.click()
                                            }
                                            disabled={
                                                promotionSending
                                            }
                                        >

                                            <Upload
                                                size={20}
                                            />

                                            <span>
                                                Upload Promotion Image
                                            </span>

                                        </button>

                                    )
                                }

                            </div>

                        </div>


                        <div className="admin-subscribers__promotion-preview">

                            <div className="admin-subscribers__promotion-preview-header">

                                <div>

                                    <Eye
                                        size={16}
                                    />

                                    <span>
                                        Email Preview
                                    </span>

                                </div>

                            </div>


                            <div className="admin-subscribers__promotion-email">

                                <div className="admin-subscribers__promotion-email-brand">
                                    Magic Touch Designs
                                </div>


                                {
                                    promotionImagePreview && (

                                        <img
                                            src={
                                                promotionImagePreview
                                            }
                                            alt="Promotion preview"
                                        />

                                    )
                                }


                                <div className="admin-subscribers__promotion-email-content">

                                    <h3>
                                        {
                                            promotionSubject.trim()
                                            || "Your promotion subject"
                                        }
                                    </h3>


                                    <p>
                                        {
                                            promotionMessage.trim()
                                            || "Your promotion message will appear here."
                                        }
                                    </p>

                                </div>


                                <div className="admin-subscribers__promotion-email-footer">
                                    Magic Touch Designs
                                </div>

                            </div>

                        </div>

                    </div>


                    {
                        promotionError && (

                            <div
                                className="admin-subscribers__promotion-message admin-subscribers__promotion-message--error"
                                role="alert"
                            >

                                <X
                                    size={17}
                                />

                                <span>
                                    {promotionError}
                                </span>

                            </div>

                        )
                    }


                    {
                        promotionSuccess && (

                            <div
                                className="admin-subscribers__promotion-message admin-subscribers__promotion-message--success"
                                role="status"
                            >

                                <Check
                                    size={17}
                                />

                                <span>
                                    {promotionSuccess}
                                </span>

                            </div>

                        )
                    }


                    <div className="admin-subscribers__promotion-actions">

                        <span>
                            {
                                counts.active > 0
                                    ? `${counts.active} active subscriber${counts.active === 1 ? "" : "s"} will receive this promotion.`
                                    : "No active subscribers."
                            }
                        </span>


                        <button
                            type="button"
                            className="admin-subscribers__promotion-send"
                            onClick={
                                handleSendPromotion
                            }
                            disabled={
                                promotionSending
                                || counts.active === 0
                            }
                        >

                            {
                                promotionSending ? (

                                    <>
                                        <RefreshCw
                                            size={17}
                                            className="admin-subscribers__refresh-icon--spinning"
                                        />

                                        Sending...
                                    </>

                                ) : (

                                    <>
                                        <Send
                                            size={17}
                                        />

                                        Send Promotion
                                    </>

                                )
                            }

                        </button>

                    </div>

                </section>


                {/* ==================================================
                    FILTERS
                   ================================================== */}

                <section className="admin-subscribers__toolbar">

                    <div className="admin-subscribers__search">

                        <Search
                            size={18}
                        />

                        <input
                            type="search"
                            value={
                                search
                            }
                            onChange={
                                (
                                    event
                                ) =>
                                    setSearch(
                                        event.target.value
                                    )
                            }
                            placeholder="Search by email..."
                            aria-label="Search subscribers"
                        />

                    </div>


                    <div className="admin-subscribers__filters">

                        <button
                            type="button"
                            className={
                                status === "all"
                                    ? "is-active"
                                    : ""
                            }
                            onClick={
                                () =>
                                    setStatus(
                                        "all"
                                    )
                            }
                        >
                            All
                        </button>

                        <button
                            type="button"
                            className={
                                status === "active"
                                    ? "is-active"
                                    : ""
                            }
                            onClick={
                                () =>
                                    setStatus(
                                        "active"
                                    )
                            }
                        >
                            Active
                        </button>

                        <button
                            type="button"
                            className={
                                status === "inactive"
                                    ? "is-active"
                                    : ""
                            }
                            onClick={
                                () =>
                                    setStatus(
                                        "inactive"
                                    )
                            }
                        >
                            Inactive
                        </button>

                    </div>

                </section>


                {/* ==================================================
                    SUBSCRIBERS TABLE
                   ================================================== */}

                <section className="admin-subscribers__table-card">

                    <div className="admin-subscribers__table-header">

                        <div>

                            <h2>
                                Subscriber List
                            </h2>

                            <span>
                                {subscribers.length}
                                {" "}
                                subscriber
                                {
                                    subscribers.length === 1
                                        ? ""
                                        : "s"
                                }
                            </span>

                        </div>

                    </div>


                    {
                        loading ? (

                            <div className="admin-subscribers__empty">

                                <RefreshCw
                                    size={24}
                                    className="admin-subscribers__loading-icon"
                                />

                                <p>
                                    Loading subscribers...
                                </p>

                            </div>

                        ) : subscribers.length === 0 ? (

                            <div className="admin-subscribers__empty">

                                <Mail
                                    size={30}
                                />

                                <h3>
                                    No subscribers found
                                </h3>

                                <p>
                                    Subscribers will appear here when
                                    visitors join your newsletter.
                                </p>

                            </div>

                        ) : (

                            <div className="admin-subscribers__table-wrapper">

                                <table>

                                    <thead>

                                        <tr>

                                            <th>
                                                Email
                                            </th>

                                            <th>
                                                Subscription Date
                                            </th>

                                            <th>
                                                Status
                                            </th>

                                            <th>
                                                Language
                                            </th>

                                            <th>
                                                Actions
                                            </th>

                                        </tr>

                                    </thead>

                                    <tbody>

                                        {
                                            subscribers.map(
                                                (
                                                    subscriber
                                                ) => {

                                                    const isBusy =
                                                        actionLoading ===
                                                        subscriber.id;


                                                    return (

                                                        <tr
                                                            key={
                                                                subscriber.id
                                                            }
                                                        >

                                                            <td>

                                                                <div className="admin-subscribers__email">

                                                                    <span className="admin-subscribers__email-icon">

                                                                        <Mail
                                                                            size={16}
                                                                        />

                                                                    </span>

                                                                    <span>
                                                                        {
                                                                            subscriber.email
                                                                        }
                                                                    </span>

                                                                </div>

                                                            </td>


                                                            <td>

                                                                {
                                                                    formatDate(
                                                                        subscriber.created_at
                                                                    )
                                                                }

                                                            </td>


                                                            <td>

                                                                <span
                                                                    className={
                                                                        subscriber.is_active
                                                                            ? "admin-subscribers__status admin-subscribers__status--active"
                                                                            : "admin-subscribers__status admin-subscribers__status--inactive"
                                                                    }
                                                                >

                                                                    {
                                                                        subscriber.is_active
                                                                            ? (
                                                                                <>
                                                                                    <Check
                                                                                        size={13}
                                                                                    />

                                                                                    Active
                                                                                </>
                                                                            )
                                                                            : (
                                                                                <>
                                                                                    <X
                                                                                        size={13}
                                                                                    />

                                                                                    Inactive
                                                                                </>
                                                                            )
                                                                    }

                                                                </span>

                                                            </td>


                                                            <td>

                                                                <button
                                                                    type="button"
                                                                    className="admin-subscribers__language"
                                                                    onClick={
                                                                        () =>
                                                                            handleLanguageChange(
                                                                                subscriber
                                                                            )
                                                                    }
                                                                    disabled={
                                                                        isBusy
                                                                    }
                                                                    title="Change language"
                                                                >

                                                                    {
                                                                        subscriber.language ===
                                                                        "en"
                                                                            ? "EN"
                                                                            : "ES"
                                                                    }

                                                                </button>

                                                            </td>


                                                            <td>

                                                                <div className="admin-subscribers__actions">

                                                                    <button
                                                                        type="button"
                                                                        className="admin-subscribers__action"
                                                                        onClick={
                                                                            () =>
                                                                                handleStatusChange(
                                                                                    subscriber
                                                                                )
                                                                        }
                                                                        disabled={
                                                                            isBusy
                                                                        }
                                                                        title={
                                                                            subscriber.is_active
                                                                                ? "Deactivate subscriber"
                                                                                : "Activate subscriber"
                                                                        }
                                                                    >

                                                                        {
                                                                            subscriber.is_active
                                                                                ? (
                                                                                    <X
                                                                                        size={17}
                                                                                    />
                                                                                )
                                                                                : (
                                                                                    <Check
                                                                                        size={17}
                                                                                    />
                                                                                )
                                                                        }

                                                                    </button>


                                                                    <button
                                                                        type="button"
                                                                        className="admin-subscribers__action admin-subscribers__action--delete"
                                                                        onClick={
                                                                            () =>
                                                                                handleDelete(
                                                                                    subscriber
                                                                                )
                                                                        }
                                                                        disabled={
                                                                            isBusy
                                                                        }
                                                                        title="Delete subscriber"
                                                                    >

                                                                        <Trash2
                                                                            size={17}
                                                                        />

                                                                    </button>

                                                                </div>

                                                            </td>

                                                        </tr>

                                                    );

                                                }
                                            )
                                        }

                                    </tbody>

                                </table>

                            </div>

                        )
                    }

                </section>

            </main>

        </div>

    );

}


export default AdminSubscribers;