/**
 * ================================================================
 * Project: Magic Touch Designs
 * Author: ultramegared
 * File: AdminUsers.tsx
 * Module: Administrator Panel
 * Language: TypeScript React
 * Description:
 * Administrative user management page.
 * Displays and manages registered user accounts.
 * ================================================================
 */

import {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    Calendar,
    Mail,
    RefreshCw,
    Shield,
    Trash2,
    User,
    Users,
} from "lucide-react";

import AdminSidebar from "./AdminSidebar";

import {
    apiRequest,
} from "../../services/api";

import "./AdminUsers.css";


/* ===============================================================
   TYPES
================================================================ */

interface AdminUser {

    id: string;

    username?: string | null;

    first_name?: string | null;

    last_name?: string | null;

    email?: string | null;

    role?: string | null;

    created_at?: string | null;

    updated_at?: string | null;

}


interface AdminUsersResponse {

    status?: string;

    users?: AdminUser[];

}


interface CurrentUserResponse {

    status?: string;

    user?: {

        id?: string;

        username?: string | null;

    };

}


/* ===============================================================
   HELPERS
================================================================ */

const getUserName = (
    user: AdminUser
): string => {

    const fullName = [
        user.first_name,
        user.last_name,
    ]
        .filter(
            Boolean
        )
        .join(
            " "
        )
        .trim();


    if (
        fullName
    ) {

        return fullName;

    }


    if (
        user.username
    ) {

        return user.username;

    }


    return "Unknown User";

};


const formatDate = (
    date?: string | null
): string => {

    if (
        !date
    ) {

        return "Unknown";

    }


    const parsedDate =
        new Date(
            date
        );


    if (
        Number.isNaN(
            parsedDate.getTime()
        )
    ) {

        return "Unknown";

    }


    try {

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
            parsedDate
        );

    } catch {

        return "Unknown";

    }

};


const getErrorMessage = (
    error: unknown,
    fallback = "Unable to load users."
): string => {

    if (
        error instanceof Error &&
        error.message
    ) {

        return error.message;

    }


    return fallback;

};


/* ===============================================================
   COMPONENT
================================================================ */

function AdminUsers() {


    /* ===========================================================
       STATE
    ============================================================ */

    const [
        users,
        setUsers,
    ] = useState<AdminUser[]>(
        []
    );


    const [
        currentUser,
        setCurrentUser,
    ] = useState<{
        id: string;
        username: string;
    } | null>(
        null
    );


    const [
        loading,
        setLoading,
    ] = useState(
        true
    );


    const [
        deletingUserId,
        setDeletingUserId,
    ] = useState<string | null>(
        null
    );


    const [
        error,
        setError,
    ] = useState<string | null>(
        null
    );


    /* ===========================================================
       LOAD USERS
    ============================================================ */

    const loadUsers =
        useCallback(
            async () => {

                try {

                    setLoading(
                        true
                    );


                    setError(
                        null
                    );


                    const usersResult =
                        await apiRequest<AdminUsersResponse>(
                            "/api/admin/users"
                        );


                    const receivedUsers =
                        Array.isArray(
                            usersResult?.users
                        )

                            ? usersResult.users

                            : [];


                    setUsers(
                        receivedUsers
                    );


                    /*
                    ==================================================
                    LOAD CURRENT USER
                    ==================================================
                    */

                    try {

                        const userResult =
                            await apiRequest<CurrentUserResponse>(
                                "/api/user/me"
                            );


                        const id =
                            userResult?.user?.id;


                        const username =
                            userResult?.user?.username;


                        if (
                            id &&
                            username
                        ) {

                            setCurrentUser(
                                {
                                    id,
                                    username,
                                }
                            );

                        } else {

                            setCurrentUser(
                                null
                            );

                        }

                    } catch (
                        currentUserError
                    ) {

                        console.error(
                            "Unable to load current user:",
                            currentUserError
                        );


                        setCurrentUser(
                            null
                        );

                    }

                } catch (
                    loadError
                ) {

                    console.error(
                        "Unable to load administrator users:",
                        loadError
                    );


                    setUsers(
                        []
                    );


                    setError(
                        getErrorMessage(
                            loadError
                        )
                    );

                } finally {

                    setLoading(
                        false
                    );

                }

            },
            []
        );


    /* ===========================================================
       DELETE USER
    ============================================================ */

    const handleDeleteUser =
        async (
            user: AdminUser
        ) => {

            /*
            =======================================================
            PREVENT SELF DELETION
            =======================================================
            */

            if (
                currentUser?.id ===
                user.id
            ) {

                window.alert(
                    "You cannot delete your own administrator account."
                );

                return;

            }


            const userName =
                getUserName(
                    user
                );


            /*
            =======================================================
            CONFIRMATION
            =======================================================
            */

            const confirmed =
                window.confirm(
                    `Are you sure you want to permanently delete ${userName}? This action cannot be undone.`
                );


            if (
                !confirmed
            ) {

                return;

            }


            try {

                setDeletingUserId(
                    user.id
                );


                setError(
                    null
                );


                await apiRequest(
                    `/api/admin/users/${user.id}`,
                    {

                        method:
                            "DELETE",

                    }
                );


                /*
                ===================================================
                UPDATE LIST
                ===================================================
                */

                setUsers(
                    (
                        previousUsers
                    ) =>
                        previousUsers.filter(
                            (
                                existingUser
                            ) =>
                                existingUser.id
                                !==
                                user.id
                        )
                );


            } catch (
                deleteError
            ) {

                console.error(
                    "Unable to delete user:",
                    deleteError
                );


                window.alert(
                    getErrorMessage(
                        deleteError,
                        "Unable to delete user."
                    )
                );

            } finally {

                setDeletingUserId(
                    null
                );

            }

        };


    /* ===========================================================
       INITIAL LOAD
    ============================================================ */

    useEffect(
        () => {

            void loadUsers();

        },
        [
            loadUsers,
        ]
    );


    /* ===========================================================
       RENDER
    ============================================================ */

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
                className="admin-users"
            >


                {/* ==================================================
                    HERO
                   ================================================== */}

                <section
                    className="admin-users__hero"
                >

                    <div
                        className="admin-users__hero-content"
                    >

                        <div>

                            <span
                                className="admin-users__eyebrow"
                            >

                                ADMINISTRATION

                            </span>


                            <h1>

                                Users

                            </h1>


                            <p>

                                View and manage registered
                                customer accounts.

                            </p>

                        </div>


                        <div
                            className="admin-users__hero-icon"
                        >

                            <Users
                                size={42}
                            />

                        </div>

                    </div>

                </section>


                {/* ==================================================
                    CONTENT
                   ================================================== */}

                <section
                    className="admin-users__container"
                >


                    {/* ==============================================
                        TOOLBAR
                       ============================================== */}

                    <div
                        className="admin-users__toolbar"
                    >

                        <div
                            className="admin-users__summary"
                        >

                            <Users
                                size={20}
                            />


                            <span>

                                {users.length}

                                {" "}

                                Registered Users

                            </span>

                        </div>


                        <button
                            type="button"
                            className="admin-users__refresh"
                            onClick={
                                () => {
                                    void loadUsers();
                                }
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


                    {/* ==============================================
                        LOADING
                       ============================================== */}

                    {loading && (

                        <div
                            className="admin-users__message"
                        >

                            Loading users...

                        </div>

                    )}


                    {/* ==============================================
                        ERROR
                       ============================================== */}

                    {!loading &&
                        error && (

                            <div
                                className="admin-users__message admin-users__message--error"
                            >

                                {error}

                            </div>

                        )}


                    {/* ==============================================
                        EMPTY
                       ============================================== */}

                    {!loading &&
                        !error &&
                        users.length === 0 && (

                            <div
                                className="admin-users__message"
                            >

                                No users found.

                            </div>

                        )}


                    {/* ==============================================
                        USER LIST
                       ============================================== */}

                    {!loading &&
                        !error &&
                        users.length > 0 && (

                            <div
                                className="admin-users__list"
                            >

                                {users.map(
                                    (
                                        user
                                    ) => {

                                        const userName =
                                            getUserName(
                                                user
                                            );


                                        const isAdmin =
                                            user.role?.toUpperCase()
                                            ===
                                            "ADMIN";


                                        const isCurrentUser =
                                            currentUser?.id
                                            ===
                                            user.id;


                                        const isDeleting =
                                            deletingUserId
                                            ===
                                            user.id;


                                        return (

                                            <article
                                                key={
                                                    user.id
                                                }
                                                className="admin-users__card"
                                            >


                                                {/* USER AVATAR */}

                                                <div
                                                    className="admin-users__avatar"
                                                >

                                                    <User
                                                        size={28}
                                                    />

                                                </div>


                                                {/* USER INFORMATION */}

                                                <div
                                                    className="admin-users__content"
                                                >

                                                    <div
                                                        className="admin-users__header"
                                                    >

                                                        <div>

                                                            <h2>

                                                                {
                                                                    userName
                                                                }

                                                            </h2>


                                                            <span>

                                                                @
                                                                {
                                                                    user.username
                                                                    ||
                                                                    "unknown"
                                                                }

                                                            </span>

                                                        </div>


                                                        {/* ROLE */}

                                                        <div
                                                            className={
                                                                isAdmin

                                                                    ? "admin-users__role admin-users__role--admin"

                                                                    : "admin-users__role admin-users__role--user"
                                                            }
                                                        >

                                                            <Shield
                                                                size={16}
                                                            />


                                                            {
                                                                isAdmin

                                                                    ? "Administrator"

                                                                    : "User"
                                                            }

                                                        </div>

                                                    </div>


                                                    {/* DETAILS */}

                                                    <div
                                                        className="admin-users__details"
                                                    >

                                                        <div
                                                            className="admin-users__detail"
                                                        >

                                                            <Mail
                                                                size={17}
                                                            />


                                                            <span>

                                                                {
                                                                    user.email
                                                                    ||
                                                                    "No email available"
                                                                }

                                                            </span>

                                                        </div>


                                                        <div
                                                            className="admin-users__detail"
                                                        >

                                                            <Calendar
                                                                size={17}
                                                            />


                                                            <span>

                                                                Registered:

                                                                {" "}

                                                                {
                                                                    formatDate(
                                                                        user.created_at
                                                                    )
                                                                }

                                                            </span>

                                                        </div>

                                                    </div>


                                                    {/* DELETE ACTION */}

                                                    <div
                                                        className="admin-users__actions"
                                                    >

                                                        <button
                                                            type="button"
                                                            className="admin-users__delete"
                                                            onClick={
                                                                () => {
                                                                    void handleDeleteUser(
                                                                        user
                                                                    );
                                                                }
                                                            }
                                                            disabled={
                                                                isDeleting ||
                                                                isCurrentUser
                                                            }
                                                            title={
                                                                isCurrentUser

                                                                    ? "You cannot delete your own account."

                                                                    : "Delete user"
                                                            }
                                                        >

                                                            <Trash2
                                                                size={17}
                                                            />


                                                            {
                                                                isDeleting

                                                                    ? "Deleting..."

                                                                    : "Delete"
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


export default AdminUsers;