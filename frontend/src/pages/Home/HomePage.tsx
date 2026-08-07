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

import HeroSlider from "../../components/home/HeroSlider";
import FeaturedModels from "../../components/home/FeaturedModels";
import WhyChooseUs from "../../components/home/WhyChooseUs";
import Newsletter from "../../components/home/Newsletter";

function HomePage() {

    return (

        <>

            <Header />

            <main>

                <HeroSlider />

                <FeaturedModels />

                <WhyChooseUs />

                <Newsletter />

            </main>

            <Footer />

        </>

    );

}

export default HomePage;