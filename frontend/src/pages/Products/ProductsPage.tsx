/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: ProductsPage.tsx
 * Module: Products
 * Language: TypeScript React
 * Description:
 * Products page.
 * ================================================================
 */

import "./ProductsPage.css";

import Header from "../../components/layout/Header";
import Footer from "../../components/home/Footer";

function ProductsPage() {

    return (

        <>

            <Header />

            <main className="products-page">

                <section
                    style={{
                        minHeight: "80vh",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        background: "#111111"
                    }}
                >

                    <h1
                        style={{
                            color: "#C89B3C",
                            fontSize: "4rem",
                            marginBottom: "20px"
                        }}
                    >
                        Products
                    </h1>

                    <p
                        style={{
                            color: "#FFFFFF",
                            fontSize: "1.2rem"
                        }}
                    >
                        Products page under construction...
                    </p>

                </section>

            </main>

            <Footer />

        </>

    );

}

export default ProductsPage;