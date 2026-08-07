/**
 * ===============================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: Toolbar.tsx
 * Module: Products
 * ===============================================================
 */

import "./Toolbar.css";

function Toolbar() {

    return (

        <section className="toolbar">

            <div className="toolbar__container">

                <p>

                    Showing 1–25 of 48 products

                </p>

                <select>

                    <option>

                        Sort by: Best Selling

                    </option>

                    <option>

                        Price: Low to High

                    </option>

                    <option>

                        Price: High to Low

                    </option>

                    <option>

                        Newest

                    </option>

                </select>

            </div>

        </section>

    );

}

export default Toolbar;