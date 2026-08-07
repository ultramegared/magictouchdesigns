/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: CustomizePage.tsx
 * Module: Frontend
 * Language: TypeScript React
 * Description:
 * Customize page.
 * ================================================================
 */

import "./CustomizePage.css";

import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";

function CustomizePage() {

    const navigation = [

        {
            label: "Home",
            path: "/"
        },

        {
            label: "Products",
            path: "/products"
        },

        {
            label: "Collections",
            path: "/collections"
        },

        {
            label: "Customize",
            path: "/customize"
        },

        {
            label: "Contact",
            path: "/contact"
        }

    ];

    return (

        <>

            <Header
                logo="/images/logo/logo.png"
                navigation={navigation}
            />

            <main className="customize-page">

                <h1>

                    Customize

                </h1>

                <p>

                    Coming Soon...

                </p>

            </main>

            <Footer />

        </>

    );

}

export default CustomizePage;