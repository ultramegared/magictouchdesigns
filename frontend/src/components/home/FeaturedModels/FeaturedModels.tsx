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

const featuredModels = [

    {

        id: 1,

        name: "Classic White Mug",

        price: 19.99,

        image: ""

    },

    {

        id: 2,

        name: "Magic Black Mug",

        price: 24.99,

        image: ""

    },

    {

        id: 3,

        name: "Golden Premium Mug",

        price: 29.99,

        image: ""

    }

];

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

                                    ${model.price.toFixed(2)}

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