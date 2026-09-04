/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: AdminSubscribers.tsx
 * Module: Administrator Subscribers
 * Language: TypeScript React
 * Description:
 * Administrative newsletter subscriber management.
 * ================================================================
 */

import {
    useCallback,
    useEffect,
    useState,
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