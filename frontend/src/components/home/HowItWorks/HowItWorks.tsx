/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: HowItWorks.tsx
 * Module: Home
 * Language: TypeScript React
 * Description:
 * How It Works section.
 * ================================================================
 */

import "./HowItWorks.css";
import { howItWorksSteps } from "./HowItWorks.data";

function HowItWorks() {

    return (

        <section className="how-it-works">

            <div className="how-it-works__container">

                <div className="how-it-works__header">

                    <span className="how-it-works__eyebrow">
                        HOW IT WORKS
                    </span>

                </div>

                <div className="how-it-works__steps">

                    {howItWorksSteps.map((step, index) => (

                        <div
                            className="how-it-works__item"
                            key={step.id}
                        >

                            <div className="how-it-works__step">

                                <div className="how-it-works__number">
                                    {step.id}
                                </div>

                                <h3>
                                    {step.title}
                                </h3>

                                <p>
                                    {step.description}
                                </p>

                            </div>

                            {index < howItWorksSteps.length - 1 && (

                                <span className="how-it-works__arrow">
                                    →
                                </span>

                            )}

                        </div>

                    ))}

                </div>

            </div>

        </section>

    );

}

export default HowItWorks;