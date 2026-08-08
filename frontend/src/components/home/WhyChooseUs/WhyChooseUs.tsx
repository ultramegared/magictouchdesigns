/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: WhyChooseUs.tsx
 * Module: Home
 * Language: TypeScript React
 * Description:
 * Why Choose Us Section.
 * ================================================================
 */

import "./WhyChooseUs.css";

import {
    whyChooseUsBenefits,
    whyChooseUsSteps
} from "./WhyChooseUs.data";


function WhyChooseUs() {

    return (

        <section className="why-choose-us">

            <div className="why-choose-us__container">

                <div className="why-choose-us__content">

                    <span className="why-choose-us__eyebrow">
                        WHY CHOOSE US?
                    </span>

                    <h2>

                        MAGIC TOUCH

                        <span>
                            DESIGNS
                        </span>

                    </h2>

                    <div className="why-choose-us__divider">
                        <span />
                    </div>

                    <p className="why-choose-us__intro">

                        We don’t just print mugs,

                        <em>
                            we create memories
                        </em>

                        that last forever.

                    </p>


                    <div className="why-choose-us__benefits">

                        {
                            whyChooseUsBenefits.map(

                                (benefit) => {

                                    const Icon = benefit.icon;

                                    return (

                                        <article
                                            key={benefit.id}
                                            className="why-choose-us__benefit"
                                        >

                                            <div className="why-choose-us__benefit-icon">

                                                <Icon size={30} />

                                            </div>

                                            <div>

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


                    <button
                        type="button"
                        className="why-choose-us__button"
                    >

                        <span>
                            LEARN MORE ABOUT US
                        </span>

                        <span>
                            →
                        </span>

                    </button>

                </div>


                <div className="why-choose-us__visual">

                    <div className="why-choose-us__step why-choose-us__step--1">

                        <article className="why-choose-us__card">

                            <span className="why-choose-us__number">
                                1
                            </span>

                            <img
                                src={whyChooseUsSteps[0].image}
                                alt={whyChooseUsSteps[0].title}
                            />

                            <div className="why-choose-us__card-content">

                                <h3>
                                    {whyChooseUsSteps[0].title}
                                </h3>

                                <p>
                                    {whyChooseUsSteps[0].description}
                                </p>

                            </div>

                        </article>

                        <span className="why-choose-us__arrow why-choose-us__arrow--right">
                            →
                        </span>

                    </div>


                    <div className="why-choose-us__step why-choose-us__step--2">

                        <article className="why-choose-us__card">

                            <span className="why-choose-us__number">
                                2
                            </span>

                            <img
                                src={whyChooseUsSteps[1].image}
                                alt={whyChooseUsSteps[1].title}
                            />

                            <div className="why-choose-us__card-content">

                                <h3>
                                    {whyChooseUsSteps[1].title}
                                </h3>

                                <p>
                                    {whyChooseUsSteps[1].description}
                                </p>

                            </div>

                        </article>

                        <span className="why-choose-us__arrow why-choose-us__arrow--down">
                            ↓
                        </span>

                    </div>


                    <div className="why-choose-us__step why-choose-us__step--3">

                        <article className="why-choose-us__card">

                            <span className="why-choose-us__number">
                                3
                            </span>

                            <img
                                src={whyChooseUsSteps[2].image}
                                alt={whyChooseUsSteps[2].title}
                            />

                            <div className="why-choose-us__card-content">

                                <h3>
                                    {whyChooseUsSteps[2].title}
                                </h3>

                                <p>
                                    {whyChooseUsSteps[2].description}
                                </p>

                            </div>

                        </article>

                        <span className="why-choose-us__arrow why-choose-us__arrow--left">
                            ←
                        </span>

                    </div>


                    <div className="why-choose-us__step why-choose-us__step--4">

                        <article className="why-choose-us__card">

                            <span className="why-choose-us__number">
                                4
                            </span>

                            <img
                                src={whyChooseUsSteps[3].image}
                                alt={whyChooseUsSteps[3].title}
                            />

                            <div className="why-choose-us__card-content">

                                <h3>
                                    {whyChooseUsSteps[3].title}
                                </h3>

                                <p>
                                    {whyChooseUsSteps[3].description}
                                </p>

                            </div>

                        </article>

                    </div>

                </div>

            </div>

        </section>

    );

}

export default WhyChooseUs;