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
import Footer from "../../components/layout/Footer";

import Hero from "../../components/home/Hero";
import FeaturedModels from "../../components/home/FeaturedModels";
import WhyChooseUs from "../../components/home/WhyChooseUs";
import Newsletter from "../../components/home/Newsletter";

function HomePage() {

    return (

        <>

            <Header />

            <main>

                <Hero
                    title="Personalized Mugs Made Just for You"
                    subtitle="Premium custom mugs crafted with high-quality materials, vibrant printing, and fast shipping."
                    primaryButton="Shop Now"
                    secondaryButton="Customize"
                />

                <FeaturedModels />

                <WhyChooseUs />

                <Newsletter />

            </main>

            <Footer />

        </>

    );

}

export default HomePage;