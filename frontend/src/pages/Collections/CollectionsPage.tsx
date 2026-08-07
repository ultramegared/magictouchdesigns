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
import Footer from "../../components/layout/Footer";

function CollectionsPage() {

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

            <main className="collections-page">

                <h1>

                    Collections

                </h1>

                <p>

                    Coming Soon...

                </p>

            </main>

            <Footer />

        </>

    );

}

export default CollectionsPage;