/**
 * ===============================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: FAQPage.tsx
 * Module: Frontend
 * Language: TypeScript React
 * Description:
 * Premium bilingual Frequently Asked Questions page.
 * ===============================================================
 */

import { useState } from "react";

import "./FAQPage.css";

import Header from "../../components/layout/Header";
import Footer from "../../components/home/Footer";

import { useLanguage } from "../../contexts/LanguageContext";
import { translations } from "../../translations";

function FAQPage() {
    const { language } = useLanguage();

    const t = translations[language].faq;

    const [openQuestion, setOpenQuestion] = useState<string | null>(null);

    const questions = [
        t.questions.products,
        t.questions.customization,
        t.questions.shipping,
        t.questions.tracking,
        t.questions.returns,
        t.questions.contact,
    ];

    const toggleQuestion = (id: string) => {
        setOpenQuestion((current) =>
            current === id ? null : id
        );
    };

    return (
        <>
            <Header />

            <main className="faq-page">

                {/* =================================================
                    HERO
                ================================================= */}

                <section className="faq-page__hero">

                    <div className="faq-page__hero-glow" />

                    <div className="faq-page__container">

                        <span className="faq-page__eyebrow">
                            <span />
                            {t.hero.eyebrow}
                            <span />
                        </span>

                        <h1>
                            {t.hero.title}
                            <span>{t.hero.titleAccent}</span>
                        </h1>

                        <div className="faq-page__divider">
                            <span />
                        </div>

                        <p className="faq-page__intro">
                            {t.hero.intro}
                        </p>

                    </div>

                </section>

                {/* =================================================
                    QUESTIONS
                ================================================= */}

                <section className="faq-page__content">

                    <div className="faq-page__container">

                        <div className="faq-page__list">

                            {questions.map((item, index) => {

                                const id = `faq-${index + 1}`;

                                const isOpen =
                                    openQuestion === id;

                                return (
                                    <article
                                        className={`faq-page__item ${
                                            isOpen
                                                ? "faq-page__item--open"
                                                : ""
                                        }`}
                                        key={id}
                                    >

                                        <button
                                            type="button"
                                            className="faq-page__question"
                                            onClick={() =>
                                                toggleQuestion(id)
                                            }
                                            aria-expanded={isOpen}
                                            aria-controls={`${id}-answer`}
                                        >

                                            <span className="faq-page__number">
                                                {String(index + 1).padStart(
                                                    2,
                                                    "0"
                                                )}
                                            </span>

                                            <span className="faq-page__question-text">
                                                {item.question}
                                            </span>

                                            <span className="faq-page__icon">
                                                {isOpen ? "−" : "+"}
                                            </span>

                                        </button>

                                        <div
                                            id={`${id}-answer`}
                                            className="faq-page__answer"
                                        >
                                            <div>
                                                <p>
                                                    {item.answer}
                                                </p>
                                            </div>
                                        </div>

                                    </article>
                                );
                            })}

                        </div>

                    </div>

                </section>

            </main>

            <Footer />
        </>
    );
}

export default FAQPage;