/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: ContactPage.tsx
 * Module: Frontend
 * Language: TypeScript React
 * Description:
 * Contact page.
 * ================================================================
 */

import "./ContactPage.css";

import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";

function ContactPage() {

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

            <main className="contact-page">

                <h1>

                    Contact

                </h1>

                <p>

                    Coming Soon...

                </p>

            </main>

            <Footer />

        </>

    );

}

export default ContactPage;