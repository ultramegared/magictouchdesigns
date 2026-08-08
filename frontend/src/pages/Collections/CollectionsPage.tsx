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

                </section>

            </main>

            <Footer />

        </>

    );

}

export default CollectionsPage;