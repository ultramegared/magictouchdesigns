/**
 * ===============================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: FeaturedModels.tsx
 * Module: Home
 * Language: TypeScript React
 * Description:
 * Featured products section.
 * ===============================================================
 */

import "./FeaturedModels.css";

import { Eye } from "lucide-react";

import {

    featuredModels

} from "../../../constants/featuredModels";

function FeaturedModels() {

    return (

        <section className="featured-models">

            <div className="featured-models__container">

                <div className="featured-models__header">

                    <span>

                        BEST SELLERS

                    </span>

                    <h2>

                        Featured Models

                    </h2>

                    <p>

                        Discover our handcrafted personalized mugs designed
                        for every special moment.

                    </p>

                </div>

                <div className="featured-models__grid">

                    {

                        featuredModels.map(

                            (

                                model

                            ) => (

                                <article

                                    key={model.id}

                                    className="featured-model"

                                >

                                    <div className="featured-model__image">

                                        <img

                                            src={model.image}

                                            alt={model.name}

                                        />

                                    </div>

                                    <div className="featured-model__body">

                                        <h3>

                                            {model.name}

                                        </h3>

                                        <span className="featured-model__price">

                                            ${model.price.toFixed(2)}

                                        </span>

                                        <button
                                            className="featured-model__button"
                                        >

                                            <Eye size={18} />

                                            View Details

                                        </button>

                                    </div>

                                </article>

                            )

                        )

                    }

                </div>

            </div>

        </section>

    );

}

export default FeaturedModels;