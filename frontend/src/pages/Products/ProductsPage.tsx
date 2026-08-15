/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: ProductsPage.tsx
 * Module: Products
 * Language: TypeScript React
 * Description:
 * Products / All Models page.
 * Frontend structure prepared for dynamic products and categories.
 * ================================================================
 */

import {
    useEffect,
    useMemo,
    useState
} from "react";

import {
    useSearchParams
} from "react-router-dom";

import "./ProductsPage.css";

import Header from "../../components/layout/Header";
import Footer from "../../components/home/Footer";
import { addToCart } from "../../utils/cart";

import { useLanguage } from "../../contexts/LanguageContext";
import { translations } from "../../translations";


type Product = {
    id: number;
    name: string;
    category: string;
    style: string;
    color: string;
    size: string;
    price: number;
    rating: number;
    reviews: number;
    image: string;
};


const demoProducts: Product[] = [
    {
        id: 1,
        name: "Model One",
        category: "Mug",
        style: "Classic",
        color: "Black",
        size: "11 oz",
        price: 24.99,
        rating: 5,
        reviews: 128,
        image: "/images/products/model-one.jpg"
    },
    {
        id: 2,
        name: "Model Two",
        category: "Mug",
        style: "Marble",
        color: "White",
        size: "11 oz",
        price: 24.99,
        rating: 5,
        reviews: 96,
        image: "/images/products/model-two.jpg"
    },
    {
        id: 3,
        name: "Model Three",
        category: "Tumbler",
        style: "Classic",
        color: "Black",
        size: "20 oz",
        price: 24.99,
        rating: 5,
        reviews: 74,
        image: "/images/products/model-three.jpg"
    },
    {
        id: 4,
        name: "Model Four",
        category: "Tumbler",
        style: "Classic",
        color: "Pink",
        size: "20 oz",
        price: 29.99,
        rating: 5,
        reviews: 58,
        image: "/images/products/model-four.jpg"
    },
    {
        id: 5,
        name: "Model Five",
        category: "Mug",
        style: "Premium",
        color: "Gold",
        size: "15 oz",
        price: 27.99,
        rating: 5,
        reviews: 82,
        image: "/images/products/model-five.jpg"
    },
    {
        id: 6,
        name: "Model Six",
        category: "Mug",
        style: "Classic",
        color: "Black",
        size: "15 oz",
        price: 25.99,
        rating: 5,
        reviews: 64,
        image: "/images/products/model-six.jpg"
    },
    {
        id: 7,
        name: "Model Seven",
        category: "Tumbler",
        style: "Premium",
        color: "White",
        size: "20 oz",
        price: 31.99,
        rating: 5,
        reviews: 47,
        image: "/images/products/model-seven.jpg"
    },
    {
        id: 8,
        name: "Model Eight",
        category: "Mug",
        style: "Marble",
        color: "Pink",
        size: "11 oz",
        price: 26.99,
        rating: 5,
        reviews: 39,
        image: "/images/products/model-eight.jpg"
    }
];


function ProductsPage() {

    const { language } = useLanguage();

    const t = translations[language].products;

    const [searchParams] = useSearchParams();

    const [category, setCategory] = useState("All");
    const [style, setStyle] = useState("All");
    const [color, setColor] = useState("All");
    const [size, setSize] = useState("All");
    const [sort, setSort] = useState("Newest");
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {

        const search = searchParams.get("search") || "";

        setSearchTerm(search);
        setCurrentPage(1);

    }, [searchParams]);


    const productsPerPage =
        window.innerWidth <= 700 ? 4 : 8;


    const filteredProducts = useMemo(() => {

        const filtered = demoProducts.filter((product) => {

            const searchMatch =
                searchTerm.trim() === "" ||
                product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.style.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.color.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.size.toLowerCase().includes(searchTerm.toLowerCase());

            const categoryMatch =
                category === "All" || product.category === category;

            const styleMatch =
                style === "All" || product.style === style;

            const colorMatch =
                color === "All" || product.color === color;

            const sizeMatch =
                size === "All" || product.size === size;

            return (
                searchMatch &&
                categoryMatch &&
                styleMatch &&
                colorMatch &&
                sizeMatch
            );

        });


        if (sort === "Price Low") {
            return [...filtered].sort(
                (a, b) => a.price - b.price
            );
        }


        if (sort === "Price High") {
            return [...filtered].sort(
                (a, b) => b.price - a.price
            );
        }


        if (sort === "Rating") {
            return [...filtered].sort(
                (a, b) => b.rating - a.rating
            );
        }


        return filtered;

    }, [
        category,
        style,
        color,
        size,
        sort,
        searchTerm
    ]);


    const totalPages = Math.max(
        1,
        Math.ceil(
            filteredProducts.length / productsPerPage
        )
    );


    const visibleProducts =
        filteredProducts.slice(
            (currentPage - 1) * productsPerPage,
            currentPage * productsPerPage
        );


    return (

        <>

            <Header />

            <main className="products-page">

                <section className="products-hero">

                    <div className="products-hero__crown">
                        ✦
                    </div>

                    <p className="products-hero__eyebrow">
                        MAGIC TOUCH DESIGNS
                    </p>

                    <h1>
                        {t.hero.title}
                    </h1>

                    <p className="products-hero__description">
                        {t.hero.description}
                    </p>

                </section>


                <section className="products-catalog">

                    <div className="products-filters">

                        <button
                            className={
                                category === "All"
                                    ? "products-filter products-filter--active"
                                    : "products-filter"
                            }
                            onClick={() => {
                                setCategory("All");
                                setCurrentPage(1);
                            }}
                        >
                            {t.filters.all}
                        </button>


                        <select
                            value={category}
                            onChange={(event) => {
                                setCategory(event.target.value);
                                setCurrentPage(1);
                            }}
                        >
                            <option value="All">
                                {t.filters.category}
                            </option>

                            <option value="Mug">
                                {t.options.categories.mug}
                            </option>

                            <option value="Tumbler">
                                {t.options.categories.tumbler}
                            </option>

                        </select>


                        <select
                            value={style}
                            onChange={(event) => {
                                setStyle(event.target.value);
                                setCurrentPage(1);
                            }}
                        >
                            <option value="All">
                                {t.filters.style}
                            </option>

                            <option value="Classic">
                                {t.options.styles.classic}
                            </option>

                            <option value="Marble">
                                {t.options.styles.marble}
                            </option>

                            <option value="Premium">
                                {t.options.styles.premium}
                            </option>

                        </select>


                        <select
                            value={color}
                            onChange={(event) => {
                                setColor(event.target.value);
                                setCurrentPage(1);
                            }}
                        >
                            <option value="All">
                                {t.filters.color}
                            </option>

                            <option value="Black">
                                {t.options.colors.black}
                            </option>

                            <option value="White">
                                {t.options.colors.white}
                            </option>

                            <option value="Pink">
                                {t.options.colors.pink}
                            </option>

                            <option value="Gold">
                                {t.options.colors.gold}
                            </option>

                        </select>


                        <select
                            value={size}
                            onChange={(event) => {
                                setSize(event.target.value);
                                setCurrentPage(1);
                            }}
                        >
                            <option value="All">
                                {t.filters.size}
                            </option>

                            <option value="11 oz">
                                11 oz
                            </option>

                            <option value="15 oz">
                                15 oz
                            </option>

                            <option value="20 oz">
                                20 oz
                            </option>

                        </select>


                        <div className="products-sort">

                            <span>
                                {t.filters.sortBy}
                            </span>

                            <select
                                value={sort}
                                onChange={(event) => {
                                    setSort(event.target.value);
                                    setCurrentPage(1);
                                }}
                            >

                                <option value="Newest">
                                    {t.sort.newest}
                                </option>

                                <option value="Price Low">
                                    {t.sort.priceLow}
                                </option>

                                <option value="Price High">
                                    {t.sort.priceHigh}
                                </option>

                                <option value="Rating">
                                    {t.sort.rating}
                                </option>

                            </select>

                        </div>

                    </div>


                    <div className="products-grid">

                        {visibleProducts.map((product) => (

                            <article
                                className="product-card"
                                key={product.id}
                            >

                                <div className="product-card__image">

                                    <img
                                        src={product.image}
                                        alt={product.name}
                                    />

                                    <button
                                        className="product-card__favorite"
                                        aria-label={
                                            `${t.actions.addFavorite} ${product.name}`
                                        }
                                    >
                                        ♡
                                    </button>

                                </div>


                                <div className="product-card__content">

                                    <span className="product-card__category">

                                        {product.category === "Mug"
                                            ? t.options.categories.mug
                                            : t.options.categories.tumbler
                                        }

                                    </span>


                                    <h2>
                                        {product.name}
                                    </h2>


                                    <strong>
                                        ${product.price.toFixed(2)}
                                    </strong>


                                    <div className="product-card__rating">

                                        <span>
                                            ★★★★★
                                        </span>

                                        <small>
                                            ({product.reviews})
                                        </small>

                                    </div>


                                    <button
                                        className="product-card__button"
                                        type="button"
                                        onClick={() => {

                                            addToCart({
                                                id: product.id,
                                                name: product.name,
                                                model: product.style,
                                                size: product.size,
                                                color: product.color,
                                                price: product.price,
                                                image: product.image,
                                            });

                                        }}
                                    >

                                        {t.actions.addToCart}

                                        <span>
                                            →
                                        </span>

                                    </button>

                                </div>

                            </article>

                        ))}

                    </div>


                    <div className="products-pagination">

                        <button
                            disabled={currentPage === 1}
                            onClick={() =>
                                setCurrentPage(
                                    (page) =>
                                        Math.max(1, page - 1)
                                )
                            }
                        >
                            ‹
                        </button>


                        {Array.from(
                            {
                                length: totalPages
                            },
                            (_, index) =>
                                index + 1
                        ).map((page) => (

                            <button
                                key={page}
                                className={
                                    currentPage === page
                                        ? "products-pagination__active"
                                        : ""
                                }
                                onClick={() =>
                                    setCurrentPage(page)
                                }
                            >
                                {page}
                            </button>

                        ))}


                        <button
                            disabled={
                                currentPage === totalPages
                            }
                            onClick={() =>
                                setCurrentPage(
                                    (page) =>
                                        Math.min(
                                            totalPages,
                                            page + 1
                                        )
                                )
                            }
                        >
                            ›
                        </button>

                    </div>


                    <div className="products-benefits">

                        <div>

                            <strong>
                                {t.benefits.fastShipping.title}
                            </strong>

                            <span>
                                {t.benefits.fastShipping.description}
                            </span>

                        </div>


                        <div>

                            <strong>
                                {t.benefits.securePayment.title}
                            </strong>

                            <span>
                                {t.benefits.securePayment.description}
                            </span>

                        </div>


                        <div>

                            <strong>
                                {t.benefits.premiumQuality.title}
                            </strong>

                            <span>
                                {t.benefits.premiumQuality.description}
                            </span>

                        </div>


                        <div>

                            <strong>
                                {t.benefits.customerSupport.title}
                            </strong>

                            <span>
                                {t.benefits.customerSupport.description}
                            </span>

                        </div>

                    </div>

                </section>

            </main>

            <Footer />

        </>

    );

}


export default ProductsPage;