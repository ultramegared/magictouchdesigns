/**
 * ===============================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: HowItWorks.css
 * Module: Home
 * Description:
 * Premium 3D How It Works Section.
 * ===============================================================
 */

.how-it-works {
    position: relative;

    background:
        radial-gradient(
            circle at 50% 45%,
            rgba(200, 155, 60, 0.09),
            transparent 38%
        ),
        linear-gradient(
            180deg,
            #111112 0%,
            #151516 50%,
            #101011 100%
        );

    padding: 100px 0 110px;

    overflow: hidden;
}

/* ===============================================================
   PREMIUM BACKGROUND DETAIL
   =============================================================== */

.how-it-works::before {
    content: "";

    position: absolute;

    width: 520px;
    height: 520px;

    top: 35%;
    left: 50%;

    transform: translate(-50%, -50%);

    background: radial-gradient(
        circle,
        rgba(200, 155, 60, 0.07),
        transparent 68%
    );

    pointer-events: none;
}

/* ===============================================================
   CONTAINER
   =============================================================== */

.how-it-works__container {
    position: relative;

    max-width: 1500px;

    margin: 0 auto;

    padding: 0 50px;
}

/* ===============================================================
   HEADER
   =============================================================== */

.how-it-works__header {
    text-align: center;

    margin-bottom: 72px;
}

.how-it-works__eyebrow {
    display: block;

    margin-bottom: 18px;

    color: #C89B3C;

    font-size: 0.95rem;
    font-weight: 700;

    letter-spacing: 0.28em;

    text-transform: uppercase;
}

.how-it-works__title {
    margin: 0;

    color: #FFFFFF;

    font-size: clamp(2rem, 4vw, 3.4rem);

    font-weight: 700;

    line-height: 1.1;

    letter-spacing: -0.03em;
}

.how-it-works__subtitle {
    margin: 18px auto 0;

    max-width: 650px;

    color: #B8B8B8;

    font-size: 1.05rem;

    line-height: 1.6;
}

/* ===============================================================
   STEPS
   =============================================================== */

.how-it-works__steps {
    display: flex;

    align-items: stretch;

    width: 100%;
}

/* ===============================================================
   ITEM
   =============================================================== */

.how-it-works__item {
    position: relative;

    flex: 1;

    min-width: 0;

    display: flex;

    align-items: center;
}

/* ===============================================================
   CARD
   =============================================================== */

.how-it-works__card {
    position: relative;

    width: 100%;

    min-height: 300px;

    padding: 32px 24px 30px;

    display: flex;

    flex-direction: column;

    align-items: center;

    text-align: center;

    background:
        linear-gradient(
            145deg,
            rgba(255, 255, 255, 0.055),
            rgba(255, 255, 255, 0.012) 45%,
            rgba(0, 0, 0, 0.28)
        );

    border: 1px solid rgba(200, 155, 60, 0.48);

    border-radius: 28px;

    box-shadow:
        0 22px 45px rgba(0, 0, 0, 0.32),
        inset 0 1px 0 rgba(255, 255, 255, 0.06),
        inset 0 -20px 35px rgba(0, 0, 0, 0.12);

    overflow: hidden;

    transition:
        transform 0.35s ease,
        border-color 0.35s ease,
        box-shadow 0.35s ease;
}

.how-it-works__card::before {
    content: "";

    position: absolute;

    top: 0;
    left: 12%;

    width: 76%;
    height: 1px;

    background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 218, 120, 0.8),
        transparent
    );
}

.how-it-works__card:hover {
    transform: translateY(-8px);

    border-color: #C89B3C;

    box-shadow:
        0 30px 60px rgba(0, 0, 0, 0.42),
        0 0 28px rgba(200, 155, 60, 0.10),
        inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

/* ===============================================================
   NUMBER
   =============================================================== */

.how-it-works__number {
    position: relative;

    width: 76px;
    height: 76px;

    margin-bottom: 22px;

    display: flex;

    align-items: center;
    justify-content: center;

    border-radius: 50%;

    background:
        radial-gradient(
            circle at 35% 25%,
            #292929,
            #111111 62%,
            #080808 100%
        );

    border: 1px solid #C89B3C;

    box-shadow:
        0 12px 25px rgba(0, 0, 0, 0.45),
        0 0 0 5px rgba(200, 155, 60, 0.055),
        inset 0 2px 4px rgba(255, 255, 255, 0.08),
        inset 0 -8px 15px rgba(0, 0, 0, 0.45);

    z-index: 2;
}

.how-it-works__number::after {
    content: "";

    position: absolute;

    inset: 6px;

    border-radius: 50%;

    border: 1px solid rgba(200, 155, 60, 0.28);
}

.how-it-works__number span {
    position: relative;

    z-index: 2;

    color: #D5A93F;

    font-size: 1.45rem;

    font-weight: 700;

    letter-spacing: 0.04em;
}

/* ===============================================================
   ICON
   =============================================================== */

.how-it-works__icon {
    margin-bottom: 20px;
}

.how-it-works__icon-ring {
    width: 70px;
    height: 70px;

    display: flex;

    align-items: center;
    justify-content: center;

    border-radius: 20px;

    background:
        linear-gradient(
            145deg,
            #262626,
            #111111
        );

    border: 1px solid rgba(200, 155, 60, 0.42);

    box-shadow:
        8px 10px 18px rgba(0, 0, 0, 0.35),
        inset 1px 1px 0 rgba(255, 255, 255, 0.08),
        inset -4px -5px 10px rgba(0, 0, 0, 0.45);

    transform: perspective(400px) rotateX(3deg);

    transition:
        transform 0.35s ease,
        border-color 0.35s ease;
}

.how-it-works__card:hover .how-it-works__icon-ring {
    transform:
        perspective(400px)
        rotateX(0deg)
        translateY(-3px);

    border-color: #C89B3C;
}

.how-it-works__icon-ring span {
    color: #D5A93F;

    font-size: 1.9rem;

    line-height: 1;

    text-shadow:
        0 2px 8px rgba(200, 155, 60, 0.28);
}

/* ===============================================================
   CONTENT
   =============================================================== */

.how-it-works__content {
    position: relative;

    z-index: 2;
}

.how-it-works__content h3 {
    margin: 0 0 12px;

    color: #FFFFFF;

    font-size: 1rem;

    font-weight: 700;

    line-height: 1.35;

    letter-spacing: 0.06em;

    text-transform: uppercase;
}

.how-it-works__content p {
    max-width: 210px;

    margin: 0 auto;

    color: #B8B8B8;

    font-size: 0.88rem;

    line-height: 1.55;
}

/* ===============================================================
   CONNECTOR
   =============================================================== */

.how-it-works__connector {
    position: relative;

    flex: 0 0 42px;

    display: flex;

    align-items: center;
    justify-content: center;
}

.how-it-works__connector::after {
    content: "→";

    position: absolute;

    color: #C89B3C;

    font-size: 1.65rem;

    font-weight: 400;

    text-shadow:
        0 0 12px rgba(200, 155, 60, 0.20);
}

.how-it-works__connector span {
    display: none;
}

/* ===============================================================
   TABLET
   =============================================================== */

@media (max-width: 1100px) {

    .how-it-works {
        padding: 85px 0 95px;
    }

    .how-it-works__container {
        padding: 0 30px;
    }

    .how-it-works__header {
        margin-bottom: 55px;
    }

    .how-it-works__card {
        min-height: 285px;

        padding: 28px 16px;
    }

    .how-it-works__number {
        width: 66px;
        height: 66px;
    }

    .how-it-works__icon-ring {
        width: 62px;
        height: 62px;
    }

    .how-it-works__content h3 {
        font-size: 0.88rem;
    }

    .how-it-works__content p {
        font-size: 0.8rem;
    }

    .how-it-works__connector {
        flex-basis: 28px;
    }
}

/* ===============================================================
   MOBILE
   =============================================================== */

@media (max-width: 768px) {

    .how-it-works {
        padding: 72px 0 82px;

        overflow: hidden;
    }

    .how-it-works__container {
        width: 100%;

        padding: 0;

        overflow: hidden;
    }

    .how-it-works__header {
        padding: 0 24px;

        margin-bottom: 45px;
    }

    .how-it-works__eyebrow {
        font-size: 0.82rem;

        letter-spacing: 0.22em;
    }

    .how-it-works__title {
        font-size: 2rem;

        line-height: 1.15;
    }

    .how-it-works__subtitle {
        font-size: 0.95rem;
    }

    .how-it-works__steps {
        width: max-content;

        min-width: max-content;

        padding: 0 24px 24px;

        overflow-x: auto;
        overflow-y: hidden;

        -webkit-overflow-scrolling: touch;

        scrollbar-width: none;
    }

    .how-it-works__steps::-webkit-scrollbar {
        display: none;
    }

    .how-it-works__item {
        width: 245px;

        flex: 0 0 245px;
    }

    .how-it-works__card {
        min-height: 330px;

        padding: 28px 20px;
    }

    .how-it-works__number {
        width: 68px;
        height: 68px;

        margin-bottom: 20px;
    }

    .how-it-works__icon-ring {
        width: 64px;
        height: 64px;
    }

    .how-it-works__content h3 {
        font-size: 0.9rem;
    }

    .how-it-works__content p {
        max-width: 195px;

        font-size: 0.8rem;
    }

    .how-it-works__connector {
        flex: 0 0 32px;
    }

    .how-it-works__connector::after {
        font-size: 1.35rem;
    }
}

/* ===============================================================
   SMALL MOBILE
   =============================================================== */

@media (max-width: 430px) {

    .how-it-works {
        padding: 62px 0 72px;
    }

    .how-it-works__header {
        margin-bottom: 38px;
    }

    .how-it-works__title {
        font-size: 1.75rem;
    }

    .how-it-works__subtitle {
        font-size: 0.88rem;
    }

    .how-it-works__steps {
        padding-left: 18px;
        padding-right: 18px;
    }

    .how-it-works__item {
        width: 225px;

        flex-basis: 225px;
    }

    .how-it-works__card {
        min-height: 315px;

        padding: 25px 16px;
    }
}