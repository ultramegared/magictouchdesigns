/**
 * ================================================================
 * Project: Magic Touch Designs
 * Author: ultramegared
 * File: AdminUsers.css
 * Module: Administrator Panel
 * Description:
 * Styles for administrative user management.
 * ================================================================
 */


/* ================================================================
   MAIN LAYOUT
   ================================================================ */

.admin-users {

    min-height:
        100vh;

    margin-left:
        280px;

    background:
        #f7f7f7;

}


/* ================================================================
   HERO
   ================================================================ */

.admin-users__hero {

    padding:
        48px 24px;

    background:
        linear-gradient(
            135deg,
            #171717,
            #303030
        );

    color:
        #ffffff;

}


.admin-users__hero-content {

    width:
        min(1200px, 100%);

    margin:
        0 auto;

    display:
        flex;

    align-items:
        center;

    justify-content:
        space-between;

    gap:
        24px;

}


.admin-users__eyebrow {

    display:
        block;

    margin-bottom:
        10px;

    font-size:
        0.72rem;

    font-weight:
        700;

    letter-spacing:
        0.16em;

    color:
        #c7a76c;

}


.admin-users__hero h1 {

    margin:
        0;

    font-size:
        clamp(
            2rem,
            5vw,
            3.4rem
        );

    font-weight:
        700;

    letter-spacing:
        -0.03em;

}


.admin-users__hero p {

    max-width:
        560px;

    margin:
        12px 0 0;

    font-size:
        1rem;

    line-height:
        1.6;

    color:
        rgba(
            255,
            255,
            255,
            0.72
        );

}


.admin-users__hero-icon {

    width:
        82px;

    height:
        82px;

    display:
        flex;

    align-items:
        center;

    justify-content:
        center;

    flex-shrink:
        0;

    border:
        1px solid
        rgba(
            255,
            255,
            255,
            0.15
        );

    border-radius:
        20px;

    background:
        rgba(
            255,
            255,
            255,
            0.06
        );

    color:
        #c7a76c;

}


/* ================================================================
   MAIN CONTAINER
   ================================================================ */

.admin-users__container {

    width:
        min(1200px, 100%);

    margin:
        0 auto;

    padding:
        42px 24px 80px;

}


/* ================================================================
   TOOLBAR
   ================================================================ */

.admin-users__toolbar {

    display:
        flex;

    align-items:
        center;

    justify-content:
        space-between;

    gap:
        20px;

    margin-bottom:
        28px;

}


/* ================================================================
   SUMMARY
   ================================================================ */

.admin-users__summary {

    display:
        inline-flex;

    align-items:
        center;

    gap:
        10px;

    padding:
        11px 16px;

    border:
        1px solid
        #e2e2e2;

    border-radius:
        12px;

    background:
        #ffffff;

    color:
        #444444;

    font-size:
        0.9rem;

    font-weight:
        600;

}


.admin-users__summary svg {

    color:
        #a07d3f;

}


/* ================================================================
   REFRESH BUTTON
   ================================================================ */

.admin-users__refresh {

    display:
        inline-flex;

    align-items:
        center;

    justify-content:
        center;

    gap:
        9px;

    padding:
        11px 18px;

    border:
        1px solid
        #dedede;

    border-radius:
        10px;

    background:
        #ffffff;

    color:
        #303030;

    font-size:
        0.88rem;

    font-weight:
        600;

    cursor:
        pointer;

    transition:
        border-color
        0.2s ease,
        background
        0.2s ease,
        transform
        0.2s ease;

}


.admin-users__refresh:hover:not(:disabled) {

    border-color:
        #c7a76c;

    background:
        #faf8f3;

    transform:
        translateY(
            -1px
        );

}


.admin-users__refresh:disabled {

    opacity:
        0.6;

    cursor:
        not-allowed;

}


.admin-users__refresh:disabled svg {

    animation:
        admin-users-spin
        1s linear infinite;

}


@keyframes admin-users-spin {

    from {

        transform:
            rotate(
                0deg
            );

    }


    to {

        transform:
            rotate(
                360deg
            );

    }

}


/* ================================================================
   MESSAGES
   ================================================================ */

.admin-users__message {

    padding:
        32px;

    text-align:
        center;

    border:
        1px solid
        #e9e9e9;

    border-radius:
        16px;

    background:
        #ffffff;

    color:
        #666666;

    font-size:
        0.95rem;

}


.admin-users__message--error {

    border-color:
        #f0caca;

    background:
        #fff7f7;

    color:
        #a33a3a;

}


/* ================================================================
   USER LIST
   ================================================================ */

.admin-users__list {

    display:
        flex;

    flex-direction:
        column;

    gap:
        18px;

}


/* ================================================================
   USER CARD
   ================================================================ */

.admin-users__card {

    display:
        flex;

    align-items:
        center;

    gap:
        22px;

    padding:
        24px;

    border:
        1px solid
        #e8e8e8;

    border-radius:
        18px;

    background:
        #ffffff;

    box-shadow:
        0 8px 25px
        rgba(
            0,
            0,
            0,
            0.04
        );

    transition:
        transform
        0.2s ease,
        box-shadow
        0.2s ease,
        border-color
        0.2s ease;

}


.admin-users__card:hover {

    transform:
        translateY(
            -2px
        );

    border-color:
        #ddd3bd;

    box-shadow:
        0 14px 35px
        rgba(
            0,
            0,
            0,
            0.07
        );

}


/* ================================================================
   AVATAR
   ================================================================ */

.admin-users__avatar {

    width:
        62px;

    height:
        62px;

    display:
        flex;

    align-items:
        center;

    justify-content:
        center;

    flex-shrink:
        0;

    border:
        1px solid
        #eadfc8;

    border-radius:
        18px;

    background:
        #f7f2e8;

    color:
        #9b7538;

}


/* ================================================================
   USER CONTENT
   ================================================================ */

.admin-users__content {

    width:
        100%;

    min-width:
        0;

}


/* ================================================================
   USER HEADER
   ================================================================ */

.admin-users__header {

    display:
        flex;

    align-items:
        flex-start;

    justify-content:
        space-between;

    gap:
        18px;

}


.admin-users__header h2 {

    margin:
        0;

    color:
        #1b1b1b;

    font-size:
        1.2rem;

    font-weight:
        700;

}


.admin-users__header span {

    display:
        block;

    margin-top:
        5px;

    color:
        #888888;

    font-size:
        0.82rem;

}


/* ================================================================
   USER ROLE
   ================================================================ */

.admin-users__role {

    display:
        inline-flex;

    align-items:
        center;

    gap:
        7px;

    flex-shrink:
        0;

    padding:
        8px 12px;

    border-radius:
        999px;

    font-size:
        0.78rem;

    font-weight:
        700;

}


.admin-users__role--admin {

    background:
        #ede7f8;

    color:
        #6841a5;

}


.admin-users__role--user {

    background:
        #eaf7ef;

    color:
        #277847;

}


/* ================================================================
   USER DETAILS
   ================================================================ */

.admin-users__details {

    display:
        flex;

    align-items:
        center;

    flex-wrap:
        wrap;

    gap:
        16px;

    margin-top:
        20px;

    padding-top:
        18px;

    border-top:
        1px solid
        #eeeeee;

}


.admin-users__detail {

    display:
        inline-flex;

    align-items:
        center;

    gap:
        8px;

    min-width:
        0;

    color:
        #666666;

    font-size:
        0.88rem;

}


.admin-users__detail svg {

    flex-shrink:
        0;

    color:
        #a07d3f;

}


.admin-users__detail span {

    overflow:
        hidden;

    text-overflow:
        ellipsis;

    white-space:
        nowrap;

}


/* ================================================================
   TABLET
   ================================================================ */

@media (
    max-width:
    1100px
) {

    .admin-users {

        margin-left:
            240px;

    }

}


/* ================================================================
   MOBILE
   ================================================================ */

@media (
    max-width:
    768px
) {

    .admin-users {

        margin-left:
            0;

        padding-top:
            64px;

    }


    .admin-users__hero {

        padding:
            36px 18px;

    }


    .admin-users__hero-content {

        align-items:
            flex-start;

    }


    .admin-users__hero-icon {

        width:
            58px;

        height:
            58px;

        border-radius:
            15px;

    }


    .admin-users__hero-icon svg {

        width:
            30px;

        height:
            30px;

    }


    .admin-users__container {

        padding:
            28px 18px 60px;

    }


    .admin-users__toolbar {

        flex-direction:
            column;

        align-items:
            stretch;

    }


    .admin-users__summary {

        justify-content:
            center;

    }


    .admin-users__refresh {

        width:
            100%;

    }


    .admin-users__card {

        align-items:
            flex-start;

        padding:
            20px;

    }


    .admin-users__details {

        flex-direction:
            column;

        align-items:
            flex-start;

    }

}


/* ================================================================
   SMALL MOBILE
   ================================================================ */

@media (
    max-width:
    540px
) {

    .admin-users__hero h1 {

        font-size:
            2rem;

    }


    .admin-users__hero p {

        font-size:
            0.92rem;

    }


    .admin-users__card {

        flex-direction:
            column;

        gap:
            18px;

    }


    .admin-users__header {

        flex-direction:
            column;

        gap:
            12px;

    }


    .admin-users__role {

        align-self:
            flex-start;

    }


    .admin-users__details {

        margin-top:
            18px;

        padding-top:
            16px;

    }


    .admin-users__detail {

        max-width:
            100%;

    }

}


/* ================================================================
   EXTRA SMALL MOBILE
   ================================================================ */

@media (
    max-width:
    380px
) {

    .admin-users__hero-content {

        gap:
            14px;

    }


    .admin-users__hero h1 {

        font-size:
            1.75rem;

    }


    .admin-users__hero-icon {

        width:
            50px;

        height:
            50px;

    }


    .admin-users__card {

        padding:
            18px;

    }


    .admin-users__avatar {

        width:
            56px;

        height:
            56px;

    }

}