/**
 * ================================================================
 * Project: Magic Touch Designs
 * Author: ultramegared
 * File: AdminUsers.tsx
 * Module: Administrator Panel
 * Language: TypeScript React
 * Description:
 * Administrative user management page.
 * Displays registered users and their account information.
 * ================================================================
 */

import {
    useEffect,
    useState,
} from "react";

import {
    Calendar,
    Mail,
    RefreshCw,
    Shield,
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

    username: string;

    first_name: string | null;

    last_name: string | null;

    email: string;

    role: string;

    created_at: string;

    updated_at: string;

}


interface AdminUsersResponse {

    status: string;

    users: AdminUser[];

}


/* ===============================================================
   HELPERS
================================================================ */

const getUserName = (
    user: AdminUser
) => {

    const fullName = [
        user.first_name,
        user.last_name,
    ]
        .filter(Boolean)
        .join(" ")
        .trim();


    return (
        fullName ||
        user.username
    );

};


const formatDate = (
    date: string
) => {

    return new Intl.DateTimeFormat(
        "en-US",
        {
            year: "numeric",
            month: "short",
            day: "numeric",
        }
    ).format(
        new Date(date)
    );

};


/* ===============================================================
   COMPONENT
================================================================ */

function AdminUsers() {

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
        username: string;
    } | null>(
        null
    );


    const [
        loading,
        setLoading,
    ] = useState(true);


    const [
        error,
        setError,
    ] = useState<string | null>(
        null
    );


    /* ============================================================
       LOAD USERS
    ============================================================ */

    const loadUsers =
        async () => {

            try {

                setLoading(
                    true
                );


                setError(
                    null
                );


                const [
                    usersResult,
                    userResult,
                ] = await Promise.all([

                    apiRequest<AdminUsersResponse>(
                        "/api/admin/users"
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


                setUsers(
                    usersResult.users
                );


                setCurrentUser(
                    userResult.user
                );

            } catch (error) {

                console.error(
                    "Unable to load administrator users:",
                    error
                );


                setError(
                    "Unable to load users."
                );

            } finally {

                setLoading(
                    false
                );

            }

        };


    useEffect(() => {

        loadUsers();

    }, []);


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

                    {/* ==================================================
                        TOOLBAR
                       ================================================== */}

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
                                loadUsers
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


                    {/* ==================================================
                        LOADING
                       ================================================== */}

                    {loading && (

                        <div
                            className="admin-users__message"
                        >

                            Loading users...

                        </div>

                    )}


                    {/* ==================================================
                        ERROR
                       ================================================== */}

                    {error && (

                        <div
                            className="admin-users__message admin-users__message--error"
                        >

                            {error}

                        </div>

                    )}


                    {/* ==================================================
                        EMPTY
                       ================================================== */}

                    {!loading &&
                        !error &&
                        users.length === 0 && (

                            <div
                                className="admin-users__message"
                            >

                                No users found.

                            </div>

                        )}


                    {/* ==================================================
                        USER LIST
                       ================================================== */}

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


                                        return (

                                            <article
                                                key={
                                                    user.id
                                                }
                                                className="admin-users__card"
                                            >

                                                {/* USER ICON */}

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
                                                                }

                                                            </span>

                                                        </div>


                                                        <div
                                                            className={
                                                                user.role ===
                                                                "ADMIN"

                                                                    ? "admin-users__role admin-users__role--admin"

                                                                    : "admin-users__role admin-users__role--user"
                                                            }
                                                        >

                                                            <Shield
                                                                size={16}
                                                            />


                                                            {
                                                                user.role ===
                                                                "ADMIN"

                                                                    ? "Administrator"

                                                                    : "User"
                                                            }

                                                        </div>

                                                    </div>


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