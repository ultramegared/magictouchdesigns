/**
 * ===============================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: FeaturedModels.tsx
 * Module: Home
 * Language: TypeScript React
 * Description:
 * Featured models section.
 * ===============================================================
 */

import "./FeaturedModels.css";

import {

    featuredModels

} from "../../../constants/featuredModels";

function FeaturedModels() {

    return (

        <section>

            <h2>

                Featured Models

            </h2>

            <div>

                {

                    featuredModels.map(

                        (

                            model

                        ) => (

                            <article

                                key={model.id}

                            >

                                <div>

                                    Image

                                </div>

                                <h3>

                                    {model.name}

                                </h3>

                                <p>

                                    ${model.price.toFixed(

                                        2

                                    )}

                                </p>

                                <button>

                                    View Details

                                </button>

                            </article>

                        )

                    )

                }

            </div>

        </section>

    );

}

export default FeaturedModels;