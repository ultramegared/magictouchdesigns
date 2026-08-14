/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: HowItWorks.tsx
 * Module: Home
 * Language: TypeScript React
 * Description:
 * Premium How It Works section.
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

                    <h2 className="how-it-works__title">
                        {language === "es"
                            ? "Crear tu taza perfecta es fácil"
                            : "Creating your perfect mug is easy"}
                    </h2>

                    <p className="how-it-works__subtitle">
                        {language === "es"
                            ? "De tu idea a tu puerta en 5 simples pasos"
                            : "From your idea to your door in 5 simple steps"}
                    </p>

                </div>

                <div className="how-it-works__steps">

                    {howItWorksSteps.map((step, index) => (

                        <div
                            className="how-it-works__item"
                            key={step.id}
                        >

                            <article className="how-it-works__card">

                                <div className="how-it-works__number">

                                    <span>
                                        {String(step.id).padStart(2, "0")}
                                    </span>

                                </div>

                                <div className="how-it-works__icon">

                                    <div className="how-it-works__icon-ring">

                                        <span>
                                            {index === 0 && "✦"}
                                            {index === 1 && "↑"}
                                            {index === 2 && "✧"}
                                            {index === 3 && "◈"}
                                            {index === 4 && "➜"}
                                        </span>

                                    </div>

                                </div>

                                <div className="how-it-works__content">

                                    <h3>
                                        {translatedSteps[index].title}
                                    </h3>

                                    <p>
                                        {translatedSteps[index].description}
                                    </p>

                                </div>

                            </article>

                            {index < howItWorksSteps.length - 1 && (

                                <div className="how-it-works__connector">

                                    <span />

                                </div>

                            )}

                        </div>

                    ))}

                </div>

            </div>

        </section>

    );

}

export default HowItWorks;