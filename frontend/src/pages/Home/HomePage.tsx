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

import "./HomePage.css";

import Hero from "../../components/home/Hero";

function HomePage() {

    return (

        <>

            <Hero

                title="Personalized Mugs Made Just for You"

                subtitle="Premium custom mugs crafted with high-quality materials, vibrant printing, and fast shipping."

                primaryButton="Shop Now"

                secondaryButton="Customize"

            />

        </>

    );

}

export default HomePage;