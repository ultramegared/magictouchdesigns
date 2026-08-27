/**
 * ================================================================
 * Project: Magic Touch Designs
 * Author: ultramegared
 * File: AdminDashboard.tsx
 * Module: Administrator Panel
 * Language: TypeScript React
 * Description:
 * Main administrative dashboard for Magic Touch Designs.
 * ================================================================
 */

import {
    useEffect,
    useState,
} from "react";

import "./AdminDashboard.css";

import AdminSidebar from "../../components/admin/AdminSidebar";

import {
    Users,
    ShieldCheck,
    Star,
    Clock,
    ShoppingBag,
    DollarSign,
    LayoutDashboard,
} from "lucide-react";

import {
    apiRequest,
} from "../../services/api";


interface AuthenticatedUser {

    id: string;

    username: string;

    first_name: string;

    last_name: string;

    email: string;

    is_active: boolean;

    role: "USER" | "ADMIN";

    created_at: string;

    updated_at: string;

}


interface AdminDashboardData {

    users: {

        total_accounts: number;

        total_users: number;

        total_admins: number;

    };


    reviews: {

        total_reviews: number;

        pending_reviews: number;

        approved_reviews: number;

    };


    sales: {

        total_sales: number;

        total_orders: number;

    };

}


function AdminDashboard() {

    const [
        dashboard,
        setDashboard,
    ] = useState<AdminDashboardData | null>(
        null
    );


    const [
        currentUser,
        setCurrentUser,
    ] = useState<AuthenticatedUser | null>(
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


    /**
     * ============================================================
     * LOAD ADMIN DASHBOARD
     * ============================================================
     */

    useEffect(() => {

        const loadDashboard =
            async () => {

                try {

                    setLoading(true);

                    setError(null);


                    const [
                        dashboardResult,
                        userResult,
                    ] = await Promise.all([

                        apiRequest<{
                            status: string;

                            data:
                                AdminDashboardData;
                        }>(
                            "/api/admin/dashboard"
                        ),


                        apiRequest<{
                            status: string;

                            user:
                                AuthenticatedUser;
                        }>(
                            "/api/user/me"
                        ),

                    ]);


                    setDashboard(
                        dashboardResult.data
                    );


                    setCurrentUser(
                        userResult.user
                    );


                } catch (error) {

                    console.error(
                        "Unable to load administrator dashboard:",
                        error
                    );


                    setError(
                        "Unable to load administrator dashboard."
                    );

                } finally {

                    setLoading(false);

                }

            };


        loadDashboard();

    }, []);


    return (

        <div className="admin-layout">


            {/* ======================================================
                ADMINISTRATOR NAVIGATION
               ====================================================== */}

            <AdminSidebar
                username={
                    currentUser?.username
                        || "Administrator"
                }
            />


            {/* ======================================================
                MAIN CONTENT
               ====================================================== */}

            <main className="admin-dashboard">


                {/* ==================================================
                    HERO
                   ================================================== */}

                <section className="admin-dashboard__hero">

                    <div className="admin-dashboard__hero-content">

                        <div>

                            <span className="admin-dashboard__eyebrow">

                                ADMINISTRATION

                            </span>


                            <h1>

                                Admin Dashboard

                            </h1>


                            <p>

                                Manage Magic Touch Designs
                                from one central place.

                            </p>

                        </div>


                        <div className="admin-dashboard__hero-icon">

                            <LayoutDashboard
                                size={42}
                            />

                        </div>

                    </div>

                </section>


                {/* ==================================================
                    CONTENT
                   ================================================== */}

                <section className="admin-dashboard__container">


                    {loading && (

                        <div className="admin-dashboard__message">

                            Loading dashboard...

                        </div>

                    )}


                    {error && (

                        <div className="admin-dashboard__message admin-dashboard__message--error">

                            {error}

                        </div>

                    )}


                    {dashboard && (

                        <>


                            {/* ==========================================
                                USERS
                               ========================================== */}

                            <section className="admin-dashboard__section">


                                <div className="admin-dashboard__section-header">

                                    <div>

                                        <span>

                                            USERS

                                        </span>


                                        <h2>

                                            User Overview

                                        </h2>

                                    </div>

                                </div>


                                <div className="admin-dashboard__grid">


                                    <article className="admin-dashboard__card">

                                        <div className="admin-dashboard__card-icon">

                                            <Users
                                                size={24}
                                            />

                                        </div>


                                        <div>

                                            <span>

                                                Total Accounts

                                            </span>


                                            <strong>

                                                {
                                                    dashboard.users
                                                        .total_accounts
                                                }

                                            </strong>

                                        </div>

                                    </article>


                                    <article className="admin-dashboard__card">

                                        <div className="admin-dashboard__card-icon">

                                            <Users
                                                size={24}
                                            />

                                        </div>


                                        <div>

                                            <span>

                                                Normal Users

                                            </span>


                                            <strong>

                                                {
                                                    dashboard.users
                                                        .total_users
                                                }

                                            </strong>

                                        </div>

                                    </article>


                                    <article className="admin-dashboard__card">

                                        <div className="admin-dashboard__card-icon">

                                            <ShieldCheck
                                                size={24}
                                            />

                                        </div>


                                        <div>

                                            <span>

                                                Administrators

                                            </span>


                                            <strong>

                                                {
                                                    dashboard.users
                                                        .total_admins
                                                }

                                            </strong>

                                        </div>

                                    </article>

                                </div>

                            </section>


                            {/* ==========================================
                                REVIEWS
                               ========================================== */}

                            <section className="admin-dashboard__section">


                                <div className="admin-dashboard__section-header">

                                    <div>

                                        <span>

                                            REVIEWS

                                        </span>


                                        <h2>

                                            Review Management

                                        </h2>

                                    </div>

                                </div>


                                <div className="admin-dashboard__grid">


                                    <article className="admin-dashboard__card">

                                        <div className="admin-dashboard__card-icon">

                                            <Star
                                                size={24}
                                            />

                                        </div>


                                        <div>

                                            <span>

                                                Total Reviews

                                            </span>


                                            <strong>

                                                {
                                                    dashboard.reviews
                                                        .total_reviews
                                                }

                                            </strong>

                                        </div>

                                    </article>


                                    <article className="admin-dashboard__card">

                                        <div className="admin-dashboard__card-icon">

                                            <Clock
                                                size={24}
                                            />

                                        </div>


                                        <div>

                                            <span>

                                                Pending Reviews

                                            </span>


                                            <strong>

                                                {
                                                    dashboard.reviews
                                                        .pending_reviews
                                                }

                                            </strong>

                                        </div>

                                    </article>


                                    <article className="admin-dashboard__card">

                                        <div className="admin-dashboard__card-icon">

                                            <ShieldCheck
                                                size={24}
                                            />

                                        </div>


                                        <div>

                                            <span>

                                                Approved Reviews

                                            </span>


                                            <strong>

                                                {
                                                    dashboard.reviews
                                                        .approved_reviews
                                                }

                                            </strong>

                                        </div>

                                    </article>

                                </div>

                            </section>


                            {/* ==========================================
                                SALES
                               ========================================== */}

                            <section className="admin-dashboard__section">


                                <div className="admin-dashboard__section-header">

                                    <div>

                                        <span>

                                            SALES

                                        </span>


                                        <h2>

                                            Sales Overview

                                        </h2>

                                    </div>

                                </div>


                                <div className="admin-dashboard__grid">


                                    <article className="admin-dashboard__card">

                                        <div className="admin-dashboard__card-icon">

                                            <DollarSign
                                                size={24}
                                            />

                                        </div>


                                        <div>

                                            <span>

                                                Total Sales

                                            </span>


                                            <strong>

                                                $
                                                {
                                                    dashboard.sales
                                                        .total_sales
                                                        .toFixed(2)
                                                }

                                            </strong>

                                        </div>

                                    </article>


                                    <article className="admin-dashboard__card">

                                        <div className="admin-dashboard__card-icon">

                                            <ShoppingBag
                                                size={24}
                                            />

                                        </div>


                                        <div>

                                            <span>

                                                Total Orders

                                            </span>


                                            <strong>

                                                {
                                                    dashboard.sales
                                                        .total_orders
                                                }

                                            </strong>

                                        </div>

                                    </article>

                                </div>

                            </section>


                        </>

                    )}


                </section>


            </main>


        </div>

    );

}


export default AdminDashboard;