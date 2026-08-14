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

import { useLanguage } from "../../../contexts/LanguageContext";

import { translations } from "../../../translations";

function HowItWorks() {

    const { language } = useLanguage();

    const t = translations[language].home.howItWorks;

    const translatedSteps = [
        t.steps.chooseModel,
        t.steps.uploadPhoto,
        t.steps.customize,
        t.steps.wePrint,
        t.steps.delivered,
    ];

    return (
        <section className="how-it-works">

            <div className="how-it-works__container">

                <div className="how-it-works__header">

                    <span className="how-it-works__eyebrow">
                        {t.eyebrow}
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
                                    {String(step.id).padStart(2, "0")}
                                </div>

                                <h3>
                                    {translatedSteps[index].title}
                                </h3>

                                <p>
                                    {translatedSteps[index].description}
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