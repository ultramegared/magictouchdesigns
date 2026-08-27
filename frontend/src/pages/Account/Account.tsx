/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: Account.tsx
 * Module: Pages / Account
 * Language: TypeScript React
 * Description:
 * Premium authenticated user account page.
 * ================================================================
 */

import {
    useEffect,
    useState,
} from "react";

import {
    useNavigate,
} from "react-router-dom";

import {
    Package,
    Star,
    User,
} from "lucide-react";

import Header from "../../components/layout/Header";
import Footer from "../../components/home/Footer";

import "./Account.css";

import {
    apiRequest,
} from "../../services/api";

import {
    useLanguage,
} from "../../contexts/LanguageContext";


interface AuthenticatedUser {

    id: string;

    username: string;

    first_name: string;

    last_name: string;

    email: string;
    
    role: string;

    is_active: boolean;

    created_at: string;

    updated_at: string;

}


function Account() {

    const navigate =
        useNavigate();


    const {
        language,
    } = useLanguage();


    const [user, setUser] =
        useState<AuthenticatedUser | null>(
            null
        );


    const [isLoading, setIsLoading] =
        useState(true);


    useEffect(() => {

        const loadUser = async () => {

            const token =
                localStorage.getItem(
                    "auth_token"
                );


            if (!token) {

                navigate(
                    "/login"
                );

                return;

            }


            try {

                const result =
                    await apiRequest<{
                        status: string;
                        user: AuthenticatedUser;
                    }>(
                        "/api/user/me",
                        {
                            headers: {
                                Authorization:
                                    `Bearer ${token}`,
                            },
                        }
                    );


                setUser(
                    result.user
                );


                localStorage.setItem(
                    "auth_user",
                    JSON.stringify(
                        result.user
                    )
                );

            } catch (error) {

                console.error(
                    "Unable to load account:",
                    error
                );


                localStorage.removeItem(
                    "auth_token"
                );


                localStorage.removeItem(
                    "auth_user"
                );


                navigate(
                    "/login"
                );

            } finally {

                setIsLoading(
                    false
                );

            }

        };


        loadUser();

    }, [
        navigate,
    ]);


    const handleLogout = () => {

        localStorage.removeItem(
            "auth_token"
        );


        localStorage.removeItem(
            "auth_user"
        );


        navigate(
            "/login"
        );

    };


    const handlePurchases = () => {

        navigate(
            "/account/orders"
        );

    };


    const handleReviews = () => {

        navigate(
            "/account/reviews"
        );

    };


    if (isLoading) {

        return (

            <>

                <Header />

                <main className="account">

                    <div
                        className="account__glow account__glow--one"
                        aria-hidden="true"
                    />

                    <div
                        className="account__glow account__glow--two"
                        aria-hidden="true"
                    />


                    <section className="account__loading">

                        <p className="account__loading-title">

                            {language === "es"
                                ? "Cargando cuenta..."
                                : "Loading account..."}

                        </p>


                        <p className="account__loading-text">

                            {language === "es"
                                ? "Estamos preparando tu espacio."
                                : "Preparing your personal space."}

                        </p>

                    </section>

                </main>

                <Footer />

            </>

        );

    }


    if (!user) {

        return null;

    }


    const registrationDate =
        new Date(
            user.created_at
        ).toLocaleDateString(
            language === "es"
                ? "es-US"
                : "en-US",
            {
                year: "numeric",
                month: "long",
                day: "numeric",
            }
        );


    return (

        <>

            <Header />


            <main className="account">


                {/* ==================================================
                    BACKGROUND
                   ================================================== */}

                <div
                    className="account__glow account__glow--one"
                    aria-hidden="true"
                />

                <div
                    className="account__glow account__glow--two"
                    aria-hidden="true"
                />

                <div
                    className="account__spark account__spark--one"
                    aria-hidden="true"
                >
                    ✦
                </div>

                <div
                    className="account__spark account__spark--two"
                    aria-hidden="true"
                >
                    ✧
                </div>


                {/* ==================================================
                    MAIN CARD
                   ================================================== */}

                <section className="account__container">

                    <div className="account__card">

                        <div className="account__content">


                            {/* ==================================================
                                BRAND
                               ================================================== */}

                            <div className="account__brand">

                                <div className="account__brand-mark">

                                    MTD

                                </div>


                                <div className="account__brand-name">

                                    MAGIC TOUCH

                                    <span>
                                        DESIGNS
                                    </span>

                                </div>

                            </div>


                            {/* ==================================================
                                HEADER
                               ================================================== */}

                            <header className="account__header">

                                <span className="account__eyebrow">

                                    {language === "es"
                                        ? "MI CUENTA"
                                        : "MY ACCOUNT"}

                                </span>


                                <h1>

                                    {language === "es"
                                        ? `Hola, ${user.first_name}`
                                        : `Hello, ${user.first_name}`}

                                </h1>


                                <p>

                                    {language === "es"
                                        ? "Tu espacio personal en Magic Touch Designs."
                                        : "Your personal space at Magic Touch Designs."}

                                </p>

                            </header>


                            {/* ==================================================
                                PROFILE
                               ================================================== */}

                            <section className="account__profile">

                                <div className="account__avatar">

                                    <User
                                        size={28}
                                        strokeWidth={2}
                                        aria-hidden="true"
                                    />

                                </div>


                                <div className="account__profile-info">

                                    <h2 className="account__profile-username">

                                        @{user.username}

                                    </h2>


                                    <p className="account__profile-email">

                                        {user.email}

                                    </p>

                                </div>

                            </section>


                            {/* ==================================================
                                QUICK ACTIONS
                               ================================================== */}

                            <section className="account__actions">


                                {/* PURCHASES */}

                                <button
                                    type="button"
                                    className="account__action"
                                    onClick={handlePurchases}
                                >

                                    <span className="account__action-icon">

                                        <Package
                                            size={20}
                                            aria-hidden="true"
                                        />

                                    </span>


                                    <span className="account__action-title">

                                        {language === "es"
                                            ? "Últimas compras"
                                            : "Recent purchases"}

                                    </span>


                                    <span className="account__action-description">

                                        {language === "es"
                                            ? "Revisa tus pedidos."
                                            : "Review your orders."}

                                    </span>

                                </button>


                                {/* REVIEWS */}

                                <button
                                    type="button"
                                    className="account__action"
                                    onClick={handleReviews}
                                >

                                    <span className="account__action-icon">

                                        <Star
                                            size={20}
                                            aria-hidden="true"
                                        />

                                    </span>


                                    <span className="account__action-title">

                                        {language === "es"
                                            ? "Mis reviews"
                                            : "My reviews"}

                                    </span>


                                    <span className="account__action-description">

                                        {language === "es"
                                            ? "Comparte tu experiencia."
                                            : "Share your experience."}

                                    </span>

                                </button>

                            </section>


                            {/* ==================================================
                                USER INFORMATION
                               ================================================== */}

                            <section className="account__info">


                                {/* USERNAME */}

                                <div className="account__info-item">

                                    <span className="account__info-label">

                                        {language === "es"
                                            ? "Usuario"
                                            : "Username"}

                                    </span>


                                    <span className="account__info-value">

                                        @{user.username}

                                    </span>

                                </div>


                                {/* EMAIL */}

                                <div className="account__info-item">

                                    <span className="account__info-label">

                                        {language === "es"
                                            ? "Correo"
                                            : "Email"}

                                    </span>


                                    <span className="account__info-value">

                                        {user.email}

                                    </span>

                                </div>


                                {/* NAME */}

                                <div className="account__info-item">

                                    <span className="account__info-label">

                                        {language === "es"
                                            ? "Nombre completo"
                                            : "Full name"}

                                    </span>


                                    <span className="account__info-value">

                                        {user.first_name}{" "}
                                        {user.last_name}

                                    </span>

                                </div>


                                {/* REGISTRATION */}

                                <div className="account__info-item">

                                    <span className="account__info-label">

                                        {language === "es"
                                            ? "Miembro desde"
                                            : "Member since"}

                                    </span>


                                    <span className="account__info-value">

                                        {registrationDate}

                                    </span>

                                </div>


                                {/* STATUS */}

                                <div className="account__info-item">

                                    <span className="account__info-label">

                                        {language === "es"
                                            ? "Estado"
                                            : "Status"}

                                    </span>


                                    <span className="account__info-value">

                                        {user.is_active
                                            ? (
                                                language === "es"
                                                    ? "Cuenta activa"
                                                    : "Active account"
                                            )
                                            : (
                                                language === "es"
                                                    ? "Cuenta inactiva"
                                                    : "Inactive account"
                                            )}

                                    </span>

                                </div>


                                {/* ACCOUNT TYPE */}

                                <div className="account__info-item">

                                    <span className="account__info-label">

                                        {language === "es"
                                            ? "Cuenta"
                                            : "Account"}

                                    </span>


                                    <span className="account__info-value">

                                        {language === "es"
                                            ? "Cliente"
                                            : "Customer"}

                                    </span>

                                </div>

                            </section>


                            {/* ==================================================
                                LOGOUT
                               ================================================== */}

                            <button
                                type="button"
                                className="account__logout"
                                onClick={handleLogout}
                            >

                                {language === "es"
                                    ? "CERRAR SESIÓN"
                                    : "SIGN OUT"}

                            </button>


                        </div>

                    </div>

                </section>

            </main>


            <Footer />

        </>

    );

}


export default Account;