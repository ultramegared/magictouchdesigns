/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: BestSellers.tsx
 * Module: Home
 * Language: TypeScript
 * Description:
 * Best Sellers Section.
 * ================================================================
 */

import "./BestSellers.css";
import { bestSellers } from "./BestSellers.data";

const BestSellers = () => {

    return (

        <section className="best-sellers">

            <div className="best-sellers__container">

                <div className="best-sellers__header">

                    <div>

                        <span className="best-sellers__badge">
                            OUR FAVORITES
                        </span>

                        <h2 className="best-sellers__title">
                            BEST SELLERS
                        </h2>

                    </div>

                                        <button
    className="best-sellers__view-all"
    type="button"
    aria-label="View all products"
    onClick={() => window.location.href = "/products"}
>
    VIEW ALL →
</button>

                </div>

                <div className="best-sellers__grid">

                    {bestSellers.map((product) => (

                        <article
                            className="best-sellers__card"
                            key={product.id}
                        >

                            <div className="best-sellers__image">

                                <img
                                    src={product.image}
                                    alt={product.title}
                                />

                            </div>

                            <div className="best-sellers__content">

                                <h3>
                                    {product.title}
                                </h3>

                                <div className="best-sellers__rating">

                                    ★★★★★

                                    <span>
                                        ({product.reviews})
                                    </span>

                                </div>

                                <div className="best-sellers__price">

                                    ${product.price.toFixed(2)}

                                </div>

                            </div>

                        </article>

                    ))}

                </div>

            </div>

        </section>

    );

};

export default BestSellers;