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
import BestSellers from "../../components/home/BestSellers";
import WhyChooseUs from "../../components/home/WhyChooseUs";
import HowItWorks from "../../components/home/HowItWorks/HowItWorks";
import CustomerGallery from "../../components/home/CustomerGallery";
import Newsletter from "../../components/home/Newsletter";

// import FeaturedModels from "../../components/home/FeaturedModels";

function HomePage() {

    return (

        <>

            <Header />

            <main>

                <HeroSlider />

                <Benefits />

                <BestSellers />

                {/*
                    FeaturedModels se deshabilita temporalmente
                    hasta terminar su diseño e imágenes.
                */}

                {/* <FeaturedModels /> */}

                <WhyChooseUs />

                <HowItWorks />

                <CustomerGallery />

                <Newsletter />

            </main>

            <Footer />

        </>

    );

}

export default HomePage;