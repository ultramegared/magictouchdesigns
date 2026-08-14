/**
 * ===============================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: WhyChooseUs.tsx
 * Module: Home
 * Language: TypeScript React
 * Description:
 * Why Choose Us Section.
 * ===============================================================
 */

import "./WhyChooseUs.css";

import {
    whyChooseUsBenefits,
    whyChooseUsSteps,
} from "./WhyChooseUs.data";

import { useLanguage } from "../../../contexts/LanguageContext";

import { translations } from "../../../translations";

function WhyChooseUs() {

    const { language } = useLanguage();

    const t = translations[language].whyChooseUs;

    const benefits = [
        {
            ...whyChooseUsBenefits[0],
            title: t.benefits.premiumMaterials.title,
            description: t.benefits.premiumMaterials.description,
        },
        {
            ...whyChooseUsBenefits[1],
            title: t.benefits.expertPrinting.title,
            description: t.benefits.expertPrinting.description,
        },
        {
            ...whyChooseUsBenefits[2],
            title: t.benefits.qualityChecked.title,
            description: t.benefits.qualityChecked.description,
        },
        {
            ...whyChooseUsBenefits[3],
            title: t.benefits.carefulPackaging.title,
            description: t.benefits.carefulPackaging.description,
        },
    ];

    const steps = [
        {
            ...whyChooseUsSteps[0],
            title: t.steps.yourIdea.title,
            description: t.steps.yourIdea.description,
        },
        {
            ...whyChooseUsSteps[1],
            title: t.steps.wePrintIt.title,
            description: t.steps.wePrintIt.description,
        },
        {
            ...whyChooseUsSteps[2],
            title: t.steps.qualityCheck.title,
            description: t.steps.qualityCheck.description,
        },
        {
            ...whyChooseUsSteps[3],
            title: t.steps.packedWithCare.title,
            description: t.steps.packedWithCare.description,
        },
    ];

    return (

        <section className="why-choose-us">

            <div className="why-choose-us__container">

                <div className="why-choose-us__content">

                    <span className="why-choose-us__eyebrow">
                        {t.eyebrow}
                    </span>

                    <h2>

                        {t.title}

                        <span>
                            {t.titleAccent}
                        </span>

                    </h2>

                    <div className="why-choose-us__divider">
                        <span />
                    </div>

                    <p className="why-choose-us__intro">

                        {t.introBefore}

                        <em>
                            {t.introAccent}
                        </em>

                        {t.introAfter}

                    </p>

                    <div className="why-choose-us__benefits">

                        {benefits.map((benefit) => {

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

                        })}

                    </div>

                    <button
                        type="button"
                        className="why-choose-us__button"
                        onClick={() => window.location.href = "/about"}
                    >

                        <span>
                            {t.learnMore}
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
                                src={steps[0].image}
                                alt={steps[0].title}
                            />

                            <div className="why-choose-us__card-content">

                                <h3>
                                    {steps[0].title}
                                </h3>

                                <p>
                                    {steps[0].description}
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
                                src={steps[1].image}
                                alt={steps[1].title}
                            />

                            <div className="why-choose-us__card-content">

                                <h3>
                                    {steps[1].title}
                                </h3>

                                <p>
                                    {steps[1].description}
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
                                src={steps[2].image}
                                alt={steps[2].title}
                            />

                            <div className="why-choose-us__card-content">

                                <h3>
                                    {steps[2].title}
                                </h3>

                                <p>
                                    {steps[2].description}
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
                                src={steps[3].image}
                                alt={steps[3].title}
                            />

                            <div className="why-choose-us__card-content">

                                <h3>
                                    {steps[3].title}
                                </h3>

                                <p>
                                    {steps[3].description}
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