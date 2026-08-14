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

function StepVisual({ step }: { step: number }) {

    if (step === 1) {
        return (
            <div className="how-it-works__visual">
                <div className="visual-mug">
                    <div className="visual-mug__body">
                        <span>♥</span>
                    </div>
                    <div className="visual-mug__handle" />
                </div>
                <div className="visual-platform" />
            </div>
        );
    }

    if (step === 2) {
        return (
            <div className="how-it-works__visual">
                <div className="visual-cloud">
                    <span>↑</span>
                </div>
                <div className="visual-platform" />
            </div>
        );
    }

    if (step === 3) {
        return (
            <div className="how-it-works__visual">
                <div className="visual-design">
                    <span className="visual-design__corner">✦</span>
                    <strong>T</strong>
                    <span className="visual-design__pen">✎</span>
                </div>
                <div className="visual-platform" />
            </div>
        );
    }

    if (step === 4) {
        return (
            <div className="how-it-works__visual">
                <div className="visual-printer">
                    <div className="visual-printer__top" />
                    <div className="visual-printer__body">
                        <div className="visual-printer__slot" />
                        <div className="visual-printer__mug" />
                    </div>
                </div>
                <div className="visual-platform" />
            </div>
        );
    }

    return (
        <div className="how-it-works__visual">
            <div className="visual-truck">
                <div className="visual-truck__cargo">
                    <span>♥</span>
                </div>
                <div className="visual-truck__cab">
                    <span />
                </div>
                <div className="visual-truck__wheel visual-truck__wheel--one" />
                <div className="visual-truck__wheel visual-truck__wheel--two" />
            </div>
            <div className="visual-platform" />
        </div>
    );
}

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

                <header className="how-it-works__header">

                    <div className="how-it-works__eyebrow">
                        <span />
                        {t.eyebrow}
                        <span />
                    </div>

                    <h2>
                        Crear tu taza{" "}
                        <em>perfecta</em>{" "}
                        es fácil
                    </h2>

                    <p>
                        De tu idea a tu puerta en{" "}
                        <strong>5</strong>{" "}
                        simples pasos
                    </p>

                </header>

                <div className="how-it-works__steps">

                    {howItWorksSteps.map((step, index) => {

                        const content = translatedSteps[index];

                        return (
                            <div
                                className={`how-it-works__item ${
                                    index === 4
                                        ? "how-it-works__item--last"
                                        : ""
                                }`}
                                key={step.id}
                            >

                                <article className="how-it-works__card">

                                    <div className="how-it-works__number">
                                        {String(step.id).padStart(2, "0")}
                                    </div>

                                    <StepVisual step={step.id} />

                                    <div className="how-it-works__content">

                                        <h3>
                                            {content.title}
                                        </h3>

                                        <div className="how-it-works__divider">
                                            <span />
                                        </div>

                                        <p>
                                            {content.description}
                                        </p>

                                    </div>

                                </article>

                                {index < howItWorksSteps.length - 1 && (
                                    <div className="how-it-works__connector">
                                        <span>›</span>
                                    </div>
                                )}

                            </div>
                        );
                    })}

                </div>

            </div>

        </section>
    );
}

export default HowItWorks;