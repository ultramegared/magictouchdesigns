/**
 * ===============================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: Footer.tsx
 * Module: Layout
 * ===============================================================
 */

import "./Footer.css";

function Footer() {

    return (

        <footer className="footer">

            <div className="footer__container">

                <div className="footer__brand">

                    <img

                        src="/images/logo/logo.png"

                        alt="Magic Touch Designs"

                    />

                    <p>

                        Premium personalized mugs crafted
                        with creativity, passion and quality.

                    </p>

                </div>

                <div className="footer__links">

                    <h3>

                        Quick Links

                    </h3>

                    <a href="/">Home</a>

                    <a href="/products">Products</a>

                    <a href="/collections">Collections</a>

                    <a href="/customize">Customize</a>

                    <a href="/contact">Contact</a>

                </div>

                <div className="footer__contact">

                    <h3>

                        Contact

                    </h3>

                    <p>

                        support@magictouchdesigns.com

                    </p>

                    <p>

                        United States

                    </p>

                </div>

            </div>

            <div className="footer__bottom">

                © 2025 Magic Touch Designs.
                All rights reserved.

            </div>

        </footer>

    );

}

export default Footer;