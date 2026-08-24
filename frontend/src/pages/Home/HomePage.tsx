/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: HomePage.tsx
 * Module: Frontend
 * Language: TypeScript React
 * Description:
 * Home page.
 * ================================================================
 */

import Header from "../../components/layout/Header";
import Footer from "../../components/home/Footer";

import HeroSlider from "../../components/home/HeroSlider";
import Benefits from "../../components/home/Benefits";

import CollectionsPreview from "../Collections/CollectionsPreview";
import Portfolio from "../Portfolio/Portfolio";

import CustomerGallery from "../../components/home/CustomerGallery";
import Newsletter from "../../components/home/Newsletter";


function HomePage() {

    return (

        <>

            <Header />

            <main>

                {/* ==================================================
                    HERO
                   ================================================== */}

                <HeroSlider />


                {/* ==================================================
                    BENEFITS
                   ================================================== */}

                <Benefits />


                {/* ==================================================
                    COLLECTIONS PREVIEW
                    Four main collections displayed on Home.
                   ================================================== */}

                <CollectionsPreview />


                {/* ==================================================
                    PORTFOLIO
                    Previously completed and sold designs.
                   ================================================== */}

                <Portfolio />


                {/* ==================================================
                    CUSTOMER REVIEWS / GALLERY
                    Latest four customer purchases.
                   ================================================== */}

                <CustomerGallery />


                {/* ==================================================
                    NEWSLETTER / COMMUNITY
                   ================================================== */}

                <Newsletter />

            </main>

            <Footer />

        </>

    );

}


export default HomePage;