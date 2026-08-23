/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: CollectionsPreview.tsx
 * Module: Home
 * Language: TypeScript React
 * Description:
 * Premium collections preview for the Home page.
 * Displays the four main collections without the full
 * Collections landing page.
 * ================================================================
 */

import "./CollectionsPreview.css";

import {
    useLanguage,
} from "../../contexts/LanguageContext";

import {
    translations,
} from "../../translations";

import {
    useNavigate,
} from "react-router-dom";


function CollectionsPreview() {

    const {
        language,
    } = useLanguage();

    const navigate = useNavigate();

    const t = translations[language].collections;

    const collections = [
        {
            id: 1,
            translationKey: "loveRomance",
            image: "/images/collections/love-romance.jpg",
            icon: "♡",
            path: "/collections/love-romance",
        },
        {
            id: 2,
            translationKey: "familyMemories",
            image: "/images/collections/family-memories.jpg",
            icon: "♧",
            path: "/collections/family-memories",
        },
        {
            id: 3,
            translationKey: "businessBranding",
            image: "/images/collections/business-branding.jpg",
            icon: "▱",
            path: "/collections/business-branding",
        },
        {
            id: 4,
            translationKey: "specialOccasions",
            image: "/images/collections/special-occasions.jpg",
            icon: "✦",
            path: "/collections/special-occasions",
        },
    ] as const;


    return (

        <section
            className="collections-preview"
            aria-labelledby="collections-preview-title"
        >

            <div className="collections-preview__container">

                {/* ==================================================
                    HEADER
                   ================================================== */}

                <div className="collections-preview__header">

                    <div className="collections-preview__eyebrow">

                        <span />

                        <span>
                            {t.browse.title}
                        </span>

                        <span />

                    </div>

                    <h2 id="collections-preview-title">
                        {t.browse.title}
                    </h2>

                    <div className="collections-preview__ornament">

                        <span />

                        <b>◆</b>

                        <span />

                    </div>

                </div>


                {/* ==================================================
                    COLLECTIONS
                   ================================================== */}

                <div className="collections-preview__grid">

                    {collections.map((collection) => {

                        const content =
                            t.cards[collection.translationKey];

                        return (

                            <article
                                className="collections-preview__card"
                                key={collection.id}
                            >

                                {/* IMAGE */}

                                <div className="collections-preview__visual">

                                    <img
                                        src={collection.image}
                                        alt={content.title}
                                        loading="lazy"
                                    />

                                    <div className="collections-preview__fade" />

                                    <div
                                        className="collections-preview__icon"
                                        aria-hidden="true"
                                    >
                                        {collection.icon}
                                    </div>

                                </div>


                                {/* CONTENT */}

                                <div className="collections-preview__body">

                                    <h3>
                                        {content.title}
                                    </h3>

                                    <p>
                                        {content.description}
                                    </p>

                                    <button
                                        type="button"
                                        className="collections-preview__button"
                                        onClick={() =>
                                            navigate(collection.path)
                                        }
                                    >

                                        <span>
                                            {t.browse.viewCollection}
                                        </span>

                                        <span
                                            className="collections-preview__arrow"
                                            aria-hidden="true"
                                        >
                                            →
                                        </span>

                                    </button>

                                </div>

                            </article>

                        );

                    })}

                </div>

            </div>

        </section>

    );

}

export default CollectionsPreview;