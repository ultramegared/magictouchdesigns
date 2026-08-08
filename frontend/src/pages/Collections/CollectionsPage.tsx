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

                <section className="collections-hero">

                    <div className="collections-hero__content">

                        <span className="collections-hero__eyebrow">
                            MAGIC TOUCH DESIGNS
                        </span>

                        <h1>
                            Explore Our
                            <span> Collections</span>
                        </h1>

                        <p>
                            Discover designs created to make every moment
                            personal, memorable, and uniquely yours.
                        </p>

                        <button
                            className="collections-hero__button"
                            type="button"
                        >
                            Explore Collections
                        </button>

                    </div>

                    <div className="collections-hero__visual">

                        <img
                            src="/images/collections/collections-hero.jpg"
                            alt="Magic Touch Designs collection"
                        />

                    </div>

                </section>

            </main>

            <Footer />

        </>

    );

}

export default CollectionsPage;