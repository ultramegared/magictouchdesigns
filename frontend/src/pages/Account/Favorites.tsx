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


/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

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


interface Product {

    id: number;

    name: string;

    category: string;

    style: string;

    color: string;

    size: string;

    price: number;

    image: string;

}


/*
|--------------------------------------------------------------------------
| Demo Products
|--------------------------------------------------------------------------
*/

const demoProducts: Product[] = [

    {
        id: 1,
        name: "Model One",
        category: "Mug",
        style: "Classic",
        color: "Black",
        size: "11 oz",
        price: 24.99,
        image: "/images/products/model-one.jpg",
    },

    {
        id: 2,
        name: "Model Two",
        category: "Mug",
        style: "Marble",
        color: "White",
        size: "11 oz",
        price: 24.99,
        image: "/images/products/model-two.jpg",
    },

    {
        id: 3,
        name: "Model Three",
        category: "Tumbler",
        style: "Classic",
        color: "Black",
        size: "20 oz",
        price: 24.99,
        image: "/images/products/model-three.jpg",
    },

    {
        id: 4,
        name: "Model Four",
        category: "Tumbler",
        style: "Classic",
        color: "Pink",
        size: "20 oz",
        price: 29.99,
        image: "/images/products/model-four.jpg",
    },

    {
        id: 5,
        name: "Model Five",
        category: "Mug",
        style: "Premium",
        color: "Gold",
        size: "15 oz",
        price: 27.99,
        image: "/images/products/model-five.jpg",
    },

    {
        id: 6,
        name: "Model Six",
        category: "Mug",
        style: "Classic",
        color: "Black",
        size: "15 oz",
        price: 25.99,
        image: "/images/products/model-six.jpg",
    },

    {
        id: 7,
        name: "Model Seven",
        category: "Tumbler",
        style: "Premium",
        color: "White",
        size: "20 oz",
        price: 31.99,
        image: "/images/products/model-seven.jpg",
    },

    {
        id: 8,
        name: "Model Eight",
        category: "Mug",
        style: "Marble",
        color: "Pink",
        size: "11 oz",
        price: 26.99,
        image: "/images/products/model-eight.jpg",
    },

];


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


    /*
    |--------------------------------------------------------------------------
    | Load Favorites
    |--------------------------------------------------------------------------
    */

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
                            method:
                                "GET",
                        }

                    );


                setFavorites(
                    result.favorites || []
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


    /*
    |--------------------------------------------------------------------------
    | Remove Favorite
    |--------------------------------------------------------------------------
    */

    const handleRemoveFavorite = async (
        favoriteId: string
    ) => {

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
                    method:
                        "DELETE",
                }

            );


            setFavorites(
                (
                    currentFavorites
                ) =>

                    currentFavorites.filter(
                        (
                            favorite
                        ) =>

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


            <main
                className="favorites-page"
            >

                <div
                    className="favorites-container"
                >


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


                    <section
                        className="favorites-header"
                    >

                        <div
                            className="favorites-icon"
                        >

                            <Heart
                                size={30}
                            />

                        </div>


                        <p
                            className="favorites-eyebrow"
                        >

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
                                ? "Guarda los diseños que más te gustan y encuéntralos fácilmente aquí."
                                : "Save the designs you love and find them easily here."}

                        </p>

                    </section>


                    <section
                        className="favorites-content"
                    >


                        {isLoading && (

                            <div
                                className="favorites-loading"
                            >

                                <div
                                    className="favorites-loading-spinner"
                                />


                                <p>

                                    {language === "es"
                                        ? "Cargando favoritos..."
                                        : "Loading favorites..."}

                                </p>

                            </div>

                        )}


                        {!isLoading &&
                            errorMessage && (

                                <div
                                    className="favorites-error"
                                >

                                    {errorMessage}

                                </div>

                            )}


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
                                            ? "Cuando encuentres un diseño que te guste, podrás guardarlo aquí."
                                            : "When you find a design you like, you can save it here."}

                                    </p>


                                    <Link
                                        to="/products"
                                        className="favorites-explore"
                                    >

                                        {language === "es"
                                            ? "Explorar diseños"
                                            : "Explore designs"}

                                    </Link>

                                </div>

                            )}


                        {!isLoading &&
                            !errorMessage &&
                            favorites.length > 0 && (

                                <div
                                    className="favorites-list"
                                >

                                    {favorites.map(
                                        (
                                            favorite
                                        ) => {

                                            const product =
                                                demoProducts.find(
                                                    (
                                                        item
                                                    ) =>

                                                        String(
                                                            item.id
                                                        ) ===
                                                        String(
                                                            favorite.design_id
                                                        )
                                                );


                                            if (!product) {

                                                return null;

                                            }


                                            return (

                                                <article
                                                    key={
                                                        favorite.id
                                                    }
                                                    className="favorite-card"
                                                >

                                                    <img
                                                        src={
                                                            product.image
                                                        }
                                                        alt={
                                                            product.name
                                                        }
                                                        className="favorite-card-image"
                                                    />


                                                    <div
                                                        className="favorite-card-content"
                                                    >

                                                        <div
                                                            className="favorite-card-info"
                                                        >

                                                            <span
                                                                className="favorite-card-category"
                                                            >

                                                                {
                                                                    product.category
                                                                }

                                                            </span>


                                                            <h2>

                                                                {
                                                                    product.name
                                                                }

                                                            </h2>


                                                            <p>

                                                                {
                                                                    product.style
                                                                }

                                                            </p>


                                                            <strong>

                                                                $
                                                                {
                                                                    product.price.toFixed(
                                                                        2
                                                                    )
                                                                }

                                                            </strong>

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
                                                        >

                                                            <Trash2
                                                                size={19}
                                                            />

                                                            <span>

                                                                {removingId ===
                                                                favorite.id
                                                                    ? (
                                                                        language ===
                                                                        "es"
                                                                            ? "Eliminando..."
                                                                            : "Removing..."
                                                                    )
                                                                    : (
                                                                        language ===
                                                                        "es"
                                                                            ? "Eliminar"
                                                                            : "Remove"
                                                                    )}

                                                            </span>

                                                        </button>

                                                    </div>

                                                </article>

                                            );

                                        }

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