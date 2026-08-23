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

import WhyChooseUs from "../../components/home/WhyChooseUs";
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
                    WHY CHOOSE US
                   ================================================== */}

                <WhyChooseUs />


                {/* ==================================================
                    CUSTOMER REVIEWS / GALLERY
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