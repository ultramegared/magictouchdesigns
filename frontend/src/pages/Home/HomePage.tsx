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
import Benefits from "../../components/home/Benefits";
import BestSellers from "../../components/home/BestSellers";

// import FeaturedModels from "../../components/home/FeaturedModels";

import WhyChooseUs from "../../components/home/WhyChooseUs";
import Newsletter from "../../components/home/Newsletter";

function HomePage() {

    return (

        <>

            <Header />

            <main>

                <HeroSlider />

                <BestSellers />

                <Benefits />

                {/*
                    FeaturedModels se deshabilita temporalmente
                    hasta terminar su diseño e imágenes.
                */}

                {/* <FeaturedModels /> */}

                <WhyChooseUs />

                <Newsletter />

            </main>

            <Footer />

        </>

    );

}

export default HomePage;