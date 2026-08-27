/**
 * ================================================================
 * Project: Magic Touch Designs
 * Author: ultramegared
 * File: Favorites.tsx
 * Module: Account Favorites Page
 * Language: TypeScript React
 * Description:
 * Displays and manages the authenticated user's favorite designs.
 * Languages: English (en) | Español (es)
 * ================================================================
 */

import {
    useEffect,
    useState,
} from "react";

import {
    Link,
    useNavigate,
} from "react-router-dom";

import {
    ArrowLeft,
    Heart,
    Trash2,
} from "lucide-react";

import Header from "../../components/layout/Header";
import Footer from "../../components/home/Footer";

import {
    apiRequest,
} from "../../services/api";

import {
    useLanguage,
} from "../../contexts/LanguageContext";

import "./Favorites.css";


interface Favorite {

    id: string;

    user_id: string;

    design_id: string;

    created_at: string;

}


interface FavoritesResponse {

    status: string;

    favorites: Favorite[];

}


function Favorites() {

    const navigate =
        useNavigate();


    const {
        language,
    } = useLanguage();


    const [
        favorites,
        setFavorites,
    ] = useState<Favorite[]>([]);


    const [
        isLoading,
        setIsLoading,
    ] = useState(true);


    const [
        errorMessage,
        setErrorMessage,
    ] = useState<string | null>(
        null
    );


    const [
        removingId,
        setRemovingId,
    ] = useState<string | null>(
        null
    );


    useEffect(() => {

        const loadFavorites = async () => {

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

                setIsLoading(
                    true
                );

                setErrorMessage(
                    null
                );


                const result =
                    await apiRequest<FavoritesResponse>(

                        "/api/favorites/my-favorites",

                        {
                            headers: {
                                Authorization:
                                    `Bearer ${token}`,
                            },
                        }

                    );


                setFavorites(
                    result.favorites
                );

            } catch (error) {

                console.error(
                    "Unable to load favorites:",
                    error
                );


                setErrorMessage(

                    error instanceof Error
                        ? error.message
                        : (
                            language === "es"
                                ? "No fue posible cargar tus favoritos."
                                : "Unable to load your favorites."
                        )

                );

            } finally {

                setIsLoading(
                    false
                );

            }

        };


        loadFavorites();

    }, [
        language,
        navigate,
    ]);


    const handleRemoveFavorite = async (
        favoriteId: string
    ) => {

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

            setRemovingId(
                favoriteId
            );

            setErrorMessage(
                null
            );


            await apiRequest(

                `/api/favorites/${favoriteId}`,

                {
                    method: "DELETE",

                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }

            );


            setFavorites(
                (currentFavorites) =>
                    currentFavorites.filter(
                        (favorite) =>
                            favorite.id !==
                            favoriteId
                    )
            );

        } catch (error) {

            console.error(
                "Unable to remove favorite:",
                error
            );


            setErrorMessage(

                error instanceof Error
                    ? error.message
                    : (
                        language === "es"
                            ? "No fue posible eliminar el favorito."
                            : "Unable to remove the favorite."
                    )

            );

        } finally {

            setRemovingId(
                null
            );

        }

    };


    return (

        <>

            <Header />


            <main className="favorites-page">

                <div className="favorites-container">


                    {/* ==================================================
                        BACK
                       ================================================== */}

                    <Link
                        to="/account"
                        className="favorites-back"
                    >

                        <ArrowLeft
                            size={20}
                        />

                        <span>

                            {language === "es"
                                ? "Volver a mi cuenta"
                                : "Back to my account"}

                        </span>

                    </Link>


                    {/* ==================================================
                        HEADER
                       ================================================== */}

                    <section className="favorites-header">

                        <div className="favorites-icon">

                            <Heart
                                size={30}
                            />

                        </div>


                        <p className="favorites-eyebrow">

                            {language === "es"
                                ? "MIS FAVORITOS"
                                : "MY FAVORITES"}

                        </p>


                        <h1>

                            {language === "es"
                                ? "Tus diseños favoritos"
                                : "Your favorite designs"}

                        </h1>


                        <p>

                            {language === "es"
                                ? (
                                    "Guarda los diseños que más te gustan y encuéntralos fácilmente aquí."
                                )
                                : (
                                    "Save the designs you love and find them easily here."
                                )}

                        </p>

                    </section>


                    {/* ==================================================
                        CONTENT
                       ================================================== */}

                    <section className="favorites-content">


                        {/* LOADING */}

                        {isLoading && (

                            <div className="favorites-loading">

                                <div
                                    className="favorites-loading-spinner"
                                    aria-hidden="true"
                                />

                                <p>

                                    {language === "es"
                                        ? "Cargando favoritos..."
                                        : "Loading favorites..."}

                                </p>

                            </div>

                        )}


                        {/* ERROR */}

                        {!isLoading &&
                            errorMessage && (

                                <div
                                    className="favorites-error"
                                >

                                    {errorMessage}

                                </div>

                            )}


                        {/* EMPTY */}

                        {!isLoading &&
                            !errorMessage &&
                            favorites.length === 0 && (

                                <div
                                    className="favorites-empty"
                                >

                                    <div
                                        className="favorites-empty-icon"
                                    >

                                        <Heart
                                            size={42}
                                        />

                                    </div>


                                    <h2>

                                        {language === "es"
                                            ? "Aún no tienes favoritos"
                                            : "You don't have favorites yet"}

                                    </h2>


                                    <p>

                                        {language === "es"
                                            ? (
                                                "Cuando encuentres un diseño que te guste, podrás guardarlo aquí."
                                            )
                                            : (
                                                "When you find a design you like, you can save it here."
                                            )}

                                    </p>


                                    <Link
                                        to="/"
                                        className="favorites-explore"
                                    >

                                        {language === "es"
                                            ? "Explorar diseños"
                                            : "Explore designs"}

                                    </Link>

                                </div>

                            )}


                        {/* LIST */}

                        {!isLoading &&
                            !errorMessage &&
                            favorites.length > 0 && (

                                <div
                                    className="favorites-list"
                                >

                                    {favorites.map(
                                        (favorite) => (

                                            <article
                                                key={
                                                    favorite.id
                                                }
                                                className="favorite-card"
                                            >


                                                <div
                                                    className="favorite-card-content"
                                                >

                                                    <div
                                                        className="favorite-card-icon"
                                                    >

                                                        <Heart
                                                            size={24}
                                                            fill="currentColor"
                                                        />

                                                    </div>


                                                    <div
                                                        className="favorite-card-info"
                                                    >

                                                        <h2>

                                                            {language === "es"
                                                                ? "Diseño guardado"
                                                                : "Saved design"}

                                                        </h2>


                                                        <p>

                                                            {language === "es"
                                                                ? "Guardado en tus favoritos."
                                                                : "Saved to your favorites."}

                                                        </p>

                                                    </div>

                                                </div>


                                                <button
                                                    type="button"
                                                    className="favorite-remove"
                                                    onClick={() =>
                                                        handleRemoveFavorite(
                                                            favorite.id
                                                        )
                                                    }
                                                    disabled={
                                                        removingId ===
                                                        favorite.id
                                                    }
                                                    aria-label={
                                                        language === "es"
                                                            ? "Eliminar favorito"
                                                            : "Remove favorite"
                                                    }
                                                >

                                                    <Trash2
                                                        size={19}
                                                    />

                                                    <span>

                                                        {removingId ===
                                                        favorite.id
                                                            ? (
                                                                language === "es"
                                                                    ? "Eliminando..."
                                                                    : "Removing..."
                                                            )
                                                            : (
                                                                language === "es"
                                                                    ? "Eliminar"
                                                                    : "Remove"
                                                            )}

                                                    </span>

                                                </button>


                                            </article>

                                        )
                                    )}

                                </div>

                            )}


                    </section>

                </div>

            </main>


            <Footer />

        </>

    );

}


export default Favorites;