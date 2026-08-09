/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: CustomizePage.tsx
 * Module: Frontend
 * Language: TypeScript React
 * Description:
 * Customize page.
 * ================================================================
 */

import { useRef, useState, type CSSProperties } from "react";
import "./CustomizePage.css";

import Header from "../../components/layout/Header";
import Footer from "../../components/home/Footer";

type MugView = "front" | "back";

function CustomizePage() {

    const [activeView, setActiveView] = useState<MugView>("front");
    const [quantity, setQuantity] = useState(1);
    const [mugRotation, setMugRotation] = useState(0);

    const isDragging = useRef(false);
    const lastPointerX = useRef(0);

    const handleMugPointerDown = (
        event: React.PointerEvent<HTMLDivElement>
    ) => {
        isDragging.current = true;
        lastPointerX.current = event.clientX;

        event.currentTarget.setPointerCapture(event.pointerId);
    };

    const handleMugPointerMove = (
        event: React.PointerEvent<HTMLDivElement>
    ) => {
        if (!isDragging.current) return;

        const deltaX =
            event.clientX - lastPointerX.current;

        lastPointerX.current = event.clientX;

        setMugRotation((current) =>
            Math.max(
                0,
                Math.min(
                    390,
                    current + deltaX * 0.8
                )
            )
        );
    };

    const handleMugPointerUp = (
        event: React.PointerEvent<HTMLDivElement>
    ) => {
        isDragging.current = false;

        if (
            event.currentTarget.hasPointerCapture(
                event.pointerId
            )
        ) {
            event.currentTarget.releasePointerCapture(
                event.pointerId
            );
        }
    };

    const handleViewChange = (view: MugView) => {

        setActiveView(view);

        if (view === "front") {
            setMugRotation(0);
        }

        if (view === "back") {
            setMugRotation(180);
        }
    };

    const mugStyle = {
        "--mug-rotation": `${mugRotation}deg`,
    } as CSSProperties;

    return (

        <>

            <Header />

            <main className="customize-page">

                <section className="customize-intro">

                    <span className="customize-eyebrow">
                        PERSONALIZE YOUR DESIGN
                    </span>

                    <h1>
                        Customize Your Mug
                    </h1>

                    <p>
                        Create something uniquely yours. Add your photo,
                        text and personal details to make your mug special.
                    </p>

                </section>


                <nav
                    className="customize-steps"
                    aria-label="Customization steps"
                >

                    <div className="customize-step customize-step--active">
                        <span>01</span>
                        <strong>Design</strong>
                    </div>

                    <div className="customize-step">
                        <span>02</span>
                        <strong>Review</strong>
                    </div>

                    <div className="customize-step">
                        <span>03</span>
                        <strong>Add to Cart</strong>
                    </div>

                </nav>


                <section className="customize-workspace">

                    <aside className="customize-panel">

                        <div className="customize-panel__header">

                            <span>YOUR DESIGN</span>

                            <strong>Customize</strong>

                        </div>


                        <div className="customize-tool">

                            <div className="customize-tool__title">

                                <span className="customize-tool__icon">
                                    ↑
                                </span>

                                <div>
                                    <strong>Upload Image</strong>
                                    <small>JPG, PNG or WEBP</small>
                                </div>

                            </div>

                            <button type="button">
                                Choose Image
                            </button>

                        </div>


                        <div className="customize-tool">

                            <div className="customize-tool__title">

                                <span className="customize-tool__icon">
                                    T
                                </span>

                                <div>
                                    <strong>Add Text</strong>
                                    <small>Create your message</small>
                                </div>

                            </div>

                            <button type="button">
                                Add Text
                            </button>

                        </div>


                        <div className="customize-tool">

                            <div className="customize-tool__title">

                                <span className="customize-tool__icon">
                                    A
                                </span>

                                <div>
                                    <strong>Font</strong>
                                    <small>Choose your style</small>
                                </div>

                            </div>

                            <select defaultValue="classic">

                                <option value="classic">
                                    Classic
                                </option>

                                <option value="modern">
                                    Modern
                                </option>

                                <option value="elegant">
                                    Elegant
                                </option>

                            </select>

                        </div>


                        <div className="customize-tool">

                            <div className="customize-tool__title">

                                <span className="customize-tool__icon">
                                    ●
                                </span>

                                <div>
                                    <strong>Color</strong>
                                    <small>Choose a color</small>
                                </div>

                            </div>

                            <div className="customize-color-options">

                                <button
                                    type="button"
                                    className="customize-color customize-color--black"
                                    aria-label="Black"
                                />

                                <button
                                    type="button"
                                    className="customize-color customize-color--white"
                                    aria-label="White"
                                />

                                <button
                                    type="button"
                                    className="customize-color customize-color--gold"
                                    aria-label="Gold"
                                />

                            </div>

                        </div>


                        <div className="customize-panel__actions">

                            <button type="button">
                                Undo
                            </button>

                            <button type="button">
                                Redo
                            </button>

                            <button type="button">
                                Reset
                            </button>

                        </div>

                    </aside>


                    <section className="customize-preview">

                        <div className="customize-preview__top">

                            <div>
                                <span>PREVIEW</span>
                                <strong>Your Mug</strong>
                            </div>

                            <span className="customize-preview__status">
                                LIVE PREVIEW
                            </span>

                        </div>


                        <div className="customize-product">

                            <div
                                className="customize-mug-stage"
                                onPointerDown={handleMugPointerDown}
                                onPointerMove={handleMugPointerMove}
                                onPointerUp={handleMugPointerUp}
                                onPointerCancel={handleMugPointerUp}
                                style={mugStyle}
                                role="application"
                                aria-label="Drag to rotate your mug"
                            >

                                <div className="customize-mug">

                                    <div className="customize-mug__handle" />

                                    <div className="customize-mug__body">

                                        <span className="customize-mug__logo">
                                            MAGIC TOUCH
                                        </span>

                                        <span className="customize-mug__placeholder">
                                            YOUR DESIGN
                                        </span>

                                    </div>

                                </div>

                            </div>

                        </div>


                        <div className="customize-view-controls">

                            {(["front", "back"] as MugView[]).map(
                                (view) => (

                                    <button
                                        key={view}
                                        type="button"
                                        className={
                                            activeView === view
                                                ? "is-active"
                                                : ""
                                        }
                                        onClick={() =>
                                            handleViewChange(view)
                                        }
                                    >
                                        {view}
                                    </button>

                                )
                            )}

                        </div>


                        <div className="customize-preview__bottom">

                            <div className="customize-price">

                                <span>PRICE</span>

                                <strong>$24.99</strong>

                            </div>


                            <div className="customize-quantity">

                                <span>QTY</span>

                                <div>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setQuantity(
                                                Math.max(
                                                    1,
                                                    quantity - 1
                                                )
                                            )
                                        }
                                    >
                                        −
                                    </button>

                                    <strong>
                                        {quantity}
                                    </strong>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setQuantity(
                                                quantity + 1
                                            )
                                        }
                                    >
                                        +
                                    </button>

                                </div>

                            </div>


                            <button
                                type="button"
                                className="customize-add-cart"
                            >
                                Add to Cart
                                <span>→</span>
                            </button>

                        </div>

                    </section>

                </section>

            </main>

            <Footer />

        </>

    );

}

export default CustomizePage;