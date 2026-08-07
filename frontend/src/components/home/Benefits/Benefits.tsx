/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: Benefits.tsx
 * Module: Home
 * Language: TypeScript React
 * Description:
 * Benefits Section.
 * ================================================================
 */

import "./Benefits.css";

import {

    benefits

} from "./Benefits.data";

function Benefits() {

    return (

        <section className="benefits">

            <div className="benefits__container">

                {

                    benefits.map(

                        (

                            benefit

                        ) => {

                            const Icon = benefit.icon;

                            return (

                                <article

                                    key={benefit.id}

                                    className="benefit"

                                >

                                    <div className="benefit__icon">

                                        <Icon size={38} />

                                    </div>

                                    <div className="benefit__content">

                                        <h3>

                                            {benefit.title}

                                        </h3>

                                        <p>

                                            {benefit.description}

                                        </p>

                                    </div>

                                </article>

                            );

                        }

                    )

                }

            </div>

        </section>

    );

}

export default Benefits;