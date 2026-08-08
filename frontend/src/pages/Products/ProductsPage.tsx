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

import { useMemo, useState } from "react";

import "./ProductsPage.css";

import Header from "../../components/layout/Header";
import Footer from "../../components/home/Footer";

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

    const [category, setCategory] = useState("All");
    const [style, setStyle] = useState("All");
    const [color, setColor] = useState("All");
    const [size, setSize] = useState("All");
    const [sort, setSort] = useState("Newest");
    const [currentPage, setCurrentPage] = useState(1);

    const productsPerPage =
    window.innerWidth <= 700 ? 4 : 8;

    const filteredProducts = useMemo(() => {

        const filtered = demoProducts.filter((product) => {

            const categoryMatch =
                category === "All" || product.category === category;

            const styleMatch =
                style === "All" || product.style === style;

            const colorMatch =
                color === "All" || product.color === color;

            const sizeMatch =
                size === "All" || product.size === size;

            return (
                categoryMatch &&
                styleMatch &&
                colorMatch &&
                sizeMatch
            );

        });

        if (sort === "Price Low") {
            return [...filtered].sort((a, b) => a.price - b.price);
        }

        if (sort === "Price High") {
            return [...filtered].sort((a, b) => b.price - a.price);
        }

        if (sort === "Rating") {
            return [...filtered].sort((a, b) => b.rating - a.rating);
        }

        return filtered;

    }, [category, style, color, size, sort]);

    const totalPages = Math.max(
        1,
        Math.ceil(filteredProducts.length / productsPerPage)
    );

    const visibleProducts = filteredProducts.slice(
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
                        OUR PRODUCTS
                    </h1>

                    <p className="products-hero__description">
                        Premium designs. Timeless quality. Made for you.
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
                            ALL
                        </button>


                        <select
                            value={category}
                            onChange={(event) => {
                                setCategory(event.target.value);
                                setCurrentPage(1);
                            }}
                        >
                            <option value="All">
                                CATEGORY
                            </option>

                            <option value="Mug">
                                Mug
                            </option>

                            <option value="Tumbler">
                                Tumbler
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
                                STYLE
                            </option>

                            <option value="Classic">
                                Classic
                            </option>

                            <option value="Marble">
                                Marble
                            </option>

                            <option value="Premium">
                                Premium
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
                                COLOR
                            </option>

                            <option value="Black">
                                Black
                            </option>

                            <option value="White">
                                White
                            </option>

                            <option value="Pink">
                                Pink
                            </option>

                            <option value="Gold">
                                Gold
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
                                SIZE
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
                                SORT BY:
                            </span>

                            <select
                                value={sort}
                                onChange={(event) => {
                                    setSort(event.target.value);
                                    setCurrentPage(1);
                                }}
                            >
                                <option value="Newest">
                                    NEWEST
                                </option>

                                <option value="Price Low">
                                    PRICE LOW
                                </option>

                                <option value="Price High">
                                    PRICE HIGH
                                </option>

                                <option value="Rating">
                                    RATING
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
                                        aria-label={`Add ${product.name} to favorites`}
                                    >
                                        ♡
                                    </button>

                                </div>


                                <div className="product-card__content">

                                    <span className="product-card__category">
                                        {product.category}
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


                                    <button className="product-card__button">
                                        VIEW DETAILS
                                        <span>♧</span>
                                    </button>

                                </div>

                            </article>

                        ))}

                    </div>


                    <div className="products-pagination">

                        <button
                            disabled={currentPage === 1}
                            onClick={() =>
                                setCurrentPage((page) => Math.max(1, page - 1))
                            }
                        >
                            ‹
                        </button>

                        {Array.from(
                            { length: totalPages },
                            (_, index) => index + 1
                        ).map((page) => (

                            <button
                                key={page}
                                className={
                                    currentPage === page
                                        ? "products-pagination__active"
                                        : ""
                                }
                                onClick={() => setCurrentPage(page)}
                            >
                                {page}
                            </button>

                        ))}

                        <button
                            disabled={currentPage === totalPages}
                            onClick={() =>
                                setCurrentPage((page) =>
                                    Math.min(totalPages, page + 1)
                                )
                            }
                        >
                            ›
                        </button>

                    </div>


                    <div className="products-benefits">

                        <div>
                            <strong>
                                FAST SHIPPING
                            </strong>

                            <span>
                                Quick & safe delivery
                            </span>
                        </div>

                        <div>
                            <strong>
                                SECURE PAYMENT
                            </strong>

                            <span>
                                100% secure checkout
                            </span>
                        </div>

                        <div>
                            <strong>
                                PREMIUM QUALITY
                            </strong>

                            <span>
                                Top quality products
                            </span>
                        </div>

                        <div>
                            <strong>
                                CUSTOMER SUPPORT
                            </strong>

                            <span>
                                We're here to help
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