/**
 * ===============================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: HomePage.tsx
 * Module: Frontend
 * Language: TypeScript React
 * Description:
 * Home page.
 * ===============================================================
 */

import Hero from "../../components/home/Hero";
import FeaturedModels from "../../components/home/FeaturedModels";

function HomePage() {

    return (

        <>

            <Hero
                title="Personalized Mugs Made Just for You"
                subtitle="Premium custom mugs crafted with high-quality materials, vibrant printing, and fast shipping."
                primaryButton="Shop Now"
                secondaryButton="Customize"
            />

            <FeaturedModels />

        </>

    );

}

export default HomePage;