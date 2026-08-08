/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: CollectionsPage.tsx
 * Module: Frontend
 * Language: TypeScript React
 * Description:
 * Collections page.
 * ================================================================
 */

import "./CollectionsPage.css";

import Header from "../../components/layout/Header";
import Footer from "../../components/home/Footer";

function CollectionsPage() {

    const collections = [
        {
            id: 1,
            name: "Premium",
            image: "/images/collections/collection-1.jpg"
        },
        {
            id: 2,
            name: "Classic",
            image: "/images/collections/collection-2.jpg"
        },
        {
            id: 3,
            name: "Marble",
            image: "/images/collections/collection-3.jpg"
        },
        {
            id: 4,
            name: "Personalized",
            image: "/images/collections/collection-4.jpg"
        },
        {
            id: 5,
            name: "Seasonal",
            image: "/images/collections/collection-5.jpg"
        },
        {
            id: 6,
            name: "Best Sellers",
            image: "/images/collections/collection-6.jpg"
        },
        {
            id: 7,
            name: "Floral",
            image: "/images/collections/collection-7.jpg"
        },
        {
            id: 8,
            name: "Minimalist",
            image: "/images/collections/collection-8.jpg"
        }
    ];

    return (

        <>

            <Header />

            <main className="collections-page">

                {/* ==================================================
                    COLLECTIONS HERO
                   ================================================== */}

                <section className="collections-hero">

                    <div className="collections-hero__background">

                        <img
                            src="/images/collections/collections-hero.jpg"
                            alt="Magic Touch Designs collections"
                        />

                    </div>

                    <div className="collections-hero__overlay"></div>

                    <div className="collections-hero__content">

                        <span className="collections-hero__eyebrow">
                            COLLECTIONS
                        </span>

                        <h1>
                            Explore Our
                            <span>Collections</span>
                        </h1>

                        <p>
                            Discover unique styles for every occasion.
                            Each collection is carefully designed to
                            match your style and every special moment.
                        </p>

                        <button
                            className="collections-hero__button"
                            type="button"
                        >
                            VIEW ALL COLLECTIONS
                            <span aria-hidden="true">›</span>
                        </button>

                    </div>

                </section>

                {/* ==================================================
                    BROWSE BY COLLECTION
                   ================================================== */}

                <section className="collections-browse">

                    <div className="collections-section-heading">

                        <span>
                            BROWSE BY
                        </span>

                        <strong>
                            COLLECTION
                        </strong>

                        <p>
                            Each collection is carefully designed to
                            match your style and every special moment.
                        </p>

                    </div>

                    <div className="collections-grid">

                        {collections.map((collection) => (

                            <article
                                className="collection-card"
                                key={collection.id}
                            >

                                <div className="collection-card__image">

                                    <img
                                        src={collection.image}
                                        alt={`${collection.name} collection`}
                                    />

                                </div>

                                <div className="collection-card__content">

                                    <h2>
                                        {collection.name}
                                    </h2>

                                    <button
                                        className="collection-card__button"
                                        type="button"
                                    >
                                        VIEW COLLECTION
                                        <span aria-hidden="true">
                                            →
                                        </span>
                                    </button>

                                </div>

                            </article>

                        ))}

                    </div>

                </section>

            </main>

            <Footer />

        </>

    );

}

export default CollectionsPage;