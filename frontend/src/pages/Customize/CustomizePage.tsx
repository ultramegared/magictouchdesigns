/**
 * ===============================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: CustomizePage.tsx
 * Module: Frontend
 * Language: TypeScript React
 * Description:
 * Interactive mug customization editor.
 * ===============================================================
 */

import {
    useRef,
    useState,
    type CSSProperties,
    type PointerEvent as ReactPointerEvent,
} from "react";

import "./CustomizePage.css";

import Header from "../../components/layout/Header";
import Footer from "../../components/home/Footer";

type MugView = "front" | "back";
type DesignType = "image" | "text";

interface DesignImage {
    src: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

interface DesignText {
    value: string;
    x: number;
    y: number;
    fontSize: number;
    color: string;
    fontFamily: string;
}

interface ViewDesign {
    image: DesignImage | null;
    text: DesignText | null;
}

interface DragState {
    type: DesignType;
    startX: number;
    startY: number;
    originalX: number;
    originalY: number;
}

interface ResizeState {
    type: DesignType;
    startX: number;
    startY: number;
    originalWidth?: number;
     originalHeight?: number;
    originalSize?: number;
}

function CustomizePage() {
    const [activeView, setActiveView] = useState<MugView>("front");

    const [quantity, setQuantity] = useState(1);

    const [mugRotation, setMugRotation] = useState(0);

    const [selectedDesign, setSelectedDesign] =
        useState<DesignType | null>(null);

    const [designs, setDesigns] = useState<
        Record<MugView, ViewDesign>
    >({
        front: {
            image: null,
            text: null,
        },
        back: {
            image: null,
            text: null,
        },
    });

    const imageInputRef = useRef<HTMLInputElement>(null);

    const isMugDragging = useRef(false);
    const lastMugPointerX = useRef(0);

    const dragState = useRef<DragState | null>(null);
    const resizeState = useRef<ResizeState | null>(null);

    const getContentElement = () => {
        return document.querySelector(
            ".customize-mug__content"
        ) as HTMLElement | null;
    };

    const handleMugPointerDown = (
        event: ReactPointerEvent<HTMLDivElement>
    ) => {
        if (selectedDesign) return;

        isMugDragging.current = true;
        lastMugPointerX.current = event.clientX;

        event.currentTarget.setPointerCapture(event.pointerId);
    };

    const handleMugPointerMove = (
        event: ReactPointerEvent<HTMLDivElement>
    ) => {
        if (!isMugDragging.current) return;

        const deltaX =
            event.clientX - lastMugPointerX.current;

        lastMugPointerX.current = event.clientX;

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
        event: ReactPointerEvent<HTMLDivElement>
    ) => {
        isMugDragging.current = false;

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
        setSelectedDesign(null);

        if (view === "front") {
            setMugRotation(0);
        }

        if (view === "back") {
            setMugRotation(180);
        }
    };

    const updateCurrentDesign = (
        type: DesignType,
        updater: (
            current: DesignImage | DesignText | null
        ) => DesignImage | DesignText | null
    ) => {
        setDesigns((current) => {
            const view = current[activeView];

            if (type === "image") {
                return {
                    ...current,
                    [activeView]: {
                        ...view,
                        image: updater(view.image) as DesignImage | null,
                    },
                };
            }

            return {
                ...current,
                [activeView]: {
                    ...view,
                    text: updater(view.text) as DesignText | null,
                },
            };
        });
    };

    const handleImageChange = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];

        if (!file) return;

        const imageUrl = URL.createObjectURL(file);

        const newImage: DesignImage = {
    src: imageUrl,
    x: 50,
    y: 45,
    width: 42,
    height: 42,
};

        setDesigns((current) => ({
            ...current,
            [activeView]: {
                ...current[activeView],
                image: newImage,
            },
        }));

        setSelectedDesign("image");

        event.target.value = "";
    };

    const handleAddText = () => {
        const currentText =
            designs[activeView].text?.value ?? "";

        const text = window.prompt(
            "Enter your text:",
            currentText
        );

        if (text === null) return;

        const newText: DesignText = {
            value: text,
            x: 50,
            y: 72,
            fontSize: 28,
            color: "#111111",
            fontFamily: "Arial, sans-serif",
        };

        setDesigns((current) => ({
            ...current,
            [activeView]: {
                ...current[activeView],
                text: newText,
            },
        }));

        setSelectedDesign("text");
    };

    const handleEditText = () => {
        const currentText =
            designs[activeView].text;

        if (!currentText) return;

        const value = window.prompt(
            "Edit your text:",
            currentText.value
        );

        if (value === null) return;

        updateCurrentDesign("text", (current) => {
            if (!current || !("value" in current)) {
                return current;
            }

            return {
                ...current,
                value,
            };
        });
    };

    const handleDesignPointerDown = (
        event: ReactPointerEvent<HTMLDivElement>,
        type: DesignType
    ) => {
        event.stopPropagation();

        const content = getContentElement();

        if (!content) return;

        const design =
            type === "image"
                ? designs[activeView].image
                : designs[activeView].text;

        if (!design) return;

        setSelectedDesign(type);

        dragState.current = {
            type,
            startX: event.clientX,
            startY: event.clientY,
            originalX: design.x,
            originalY: design.y,
        };

        event.currentTarget.setPointerCapture(
            event.pointerId
        );
    };

    const handleDesignPointerMove = (
        event: ReactPointerEvent<HTMLDivElement>
    ) => {
        event.stopPropagation();

        const state = dragState.current;

        if (!state) return;

        const content = getContentElement();

        if (!content) return;

        const rect = content.getBoundingClientRect();

        const deltaX =
            ((event.clientX - state.startX) /
                rect.width) *
            100;

        const deltaY =
            ((event.clientY - state.startY) /
                rect.height) *
            100;

        const newX = Math.max(
            5,
            Math.min(
                95,
                state.originalX + deltaX
            )
        );

        const newY = Math.max(
            5,
            Math.min(
                95,
                state.originalY + deltaY
            )
        );

        updateCurrentDesign(
            state.type,
            (current) => {
                if (!current) return current;

                return {
                    ...current,
                    x: newX,
                    y: newY,
                };
            }
        );
    };

    const handleDesignPointerUp = (
        event: ReactPointerEvent<HTMLDivElement>
    ) => {
        event.stopPropagation();

        dragState.current = null;

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

   const handleResizePointerDown = (
    event: ReactPointerEvent<HTMLButtonElement>,
    type: DesignType
) => {
    event.stopPropagation();

    const design =
        type === "image"
            ? designs[activeView].image
            : designs[activeView].text;

    if (!design) return;

    if (type === "image") {
        const image = design as DesignImage;

        resizeState.current = {
            type: "image",
            startX: event.clientX,
            startY: event.clientY,
            originalWidth: image.width,
            originalHeight: image.height,
        };
    } else {
        const text = design as DesignText;

        resizeState.current = {
            type: "text",
            startX: event.clientX,
            startY: event.clientY,
            originalSize: text.fontSize,
        };
    }

    setSelectedDesign(type);

    event.currentTarget.setPointerCapture(
        event.pointerId
    );
};

    const handleResizePointerMove = (
    event: ReactPointerEvent<HTMLButtonElement>
) => {
    event.stopPropagation();

    const state = resizeState.current;

    if (!state) return;

    const deltaX =
        event.clientX - state.startX;

    const deltaY =
        event.clientY - state.startY;

    if (state.type === "image") {
        const newWidth = Math.max(
            10,
            Math.min(
                90,
                state.originalWidth +
                    deltaX * 0.12
            )
        );

        const newHeight = Math.max(
            10,
            Math.min(
                90,
                state.originalHeight +
                    deltaY * 0.12
            )
        );

        updateCurrentDesign(
            "image",
            (current) => {
                if (!current) return current;

                return {
                    ...current,
                    width: newWidth,
                    height: newHeight,
                };
            }
        );
    } else {
        const delta =
            (deltaX + deltaY) / 2;

        const newFontSize = Math.max(
            12,
            Math.min(
                100,
                state.originalSize! +
                 delta * 0.15
            )
        );

        updateCurrentDesign(
            "text",
            (current) => {
                if (!current) return current;

                return {
                    ...current,
                    fontSize: newFontSize,
                };
            }
        );
    }
};

    const handleResizePointerUp = (
        event: ReactPointerEvent<HTMLButtonElement>
    ) => {
        event.stopPropagation();

        resizeState.current = null;

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

    const handleDeleteSelected = () => {
        if (!selectedDesign) return;

        setDesigns((current) => ({
            ...current,
            [activeView]: {
                ...current[activeView],
                [selectedDesign]: null,
            },
        }));

        setSelectedDesign(null);
    };

    const handleReset = () => {
        setDesigns((current) => ({
            ...current,
            [activeView]: {
                image: null,
                text: null,
            },
        }));

        setSelectedDesign(null);
    };

    const handleColorChange = (color: string) => {
        updateCurrentDesign(
            "text",
            (current) => {
                if (!current) return current;

                return {
                    ...current,
                    color,
                };
            }
        );
    };

    const handleFontChange = (
        fontFamily: string
    ) => {
        updateCurrentDesign(
            "text",
            (current) => {
                if (!current) return current;

                return {
                    ...current,
                    fontFamily,
                };
            }
        );
    };

    const currentImage =
        designs[activeView].image;

    const currentText =
        designs[activeView].text;

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
                        Create something uniquely yours.
                        Add your photo, text and personal
                        details to make your mug special.
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
                                    <strong>
                                        Upload Image
                                    </strong>

                                    <small>
                                        JPG, PNG or WEBP
                                    </small>
                                </div>

                            </div>

                            <input
                                ref={imageInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                style={{
                                    display: "none",
                                }}
                                onChange={
                                    handleImageChange
                                }
                            />

                            <button
                                type="button"
                                onClick={() =>
                                    imageInputRef.current?.click()
                                }
                            >
                                Choose Image
                            </button>

                        </div>

                        <div className="customize-tool">

                            <div className="customize-tool__title">

                                <span className="customize-tool__icon">
                                    T
                                </span>

                                <div>
                                    <strong>
                                        Add Text
                                    </strong>

                                    <small>
                                        Create your message
                                    </small>
                                </div>

                            </div>

                            <button
                                type="button"
                                onClick={
                                    handleAddText
                                }
                            >
                                Add Text
                            </button>

                        </div>

                        <div className="customize-tool">

                            <div className="customize-tool__title">

                                <span className="customize-tool__icon">
                                    A
                                </span>

                                <div>
                                    <strong>
                                        Font
                                    </strong>

                                    <small>
                                        Choose your style
                                    </small>
                                </div>

                            </div>

                            <select
                                value={
                                    currentText?.fontFamily ??
                                    "Arial, sans-serif"
                                }
                                onChange={(event) =>
                                    handleFontChange(
                                        event.target.value
                                    )
                                }
                            >
                                <option value="Arial, sans-serif">
                                    Classic
                                </option>

                                <option value="Georgia, serif">
                                    Elegant
                                </option>

                                <option value="Verdana, sans-serif">
                                    Modern
                                </option>
                            </select>

                        </div>

                        <div className="customize-tool">

                            <div className="customize-tool__title">

                                <span className="customize-tool__icon">
                                    ●
                                </span>

                                <div>
                                    <strong>
                                        Color
                                    </strong>

                                    <small>
                                        Choose a color
                                    </small>
                                </div>

                            </div>

                            <div className="customize-color-options">

                                <button
                                    type="button"
                                    className="customize-color customize-color--black"
                                    aria-label="Black"
                                    onClick={() =>
                                        handleColorChange(
                                            "#111111"
                                        )
                                    }
                                />

                                <button
                                    type="button"
                                    className="customize-color customize-color--white"
                                    aria-label="White"
                                    onClick={() =>
                                        handleColorChange(
                                            "#ffffff"
                                        )
                                    }
                                />

                                <button
                                    type="button"
                                    className="customize-color customize-color--gold"
                                    aria-label="Gold"
                                    onClick={() =>
                                        handleColorChange(
                                            "#c89b3c"
                                        )
                                    }
                                />

                            </div>

                        </div>

                        {selectedDesign && (
                            <div
                                style={{
                                    display: "flex",
                                    gap: "8px",
                                    padding: "12px 0",
                                }}
                            >
                                {selectedDesign === "text" && (
                                    <button
                                        type="button"
                                        onClick={
                                            handleEditText
                                        }
                                    >
                                        Edit Text
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={
                                        handleDeleteSelected
                                    }
                                >
                                    Delete
                                </button>
                            </div>
                        )}

                        <div className="customize-panel__actions">

                            <button
                                type="button"
                                onClick={handleReset}
                            >
                                Reset
                            </button>

                        </div>

                    </aside>

                    <section className="customize-preview">

                        <div className="customize-preview__top">

                            <div>
                                <span>
                                    PREVIEW
                                </span>

                                <strong>
                                    Your Mug
                                </strong>
                            </div>

                            <span className="customize-preview__status">
                                LIVE PREVIEW
                            </span>

                        </div>

                        <div className="customize-product">

                            <div
                                className="customize-mug-stage"
                                onPointerDown={
                                    handleMugPointerDown
                                }
                                onPointerMove={
                                    handleMugPointerMove
                                }
                                onPointerUp={
                                    handleMugPointerUp
                                }
                                onPointerCancel={
                                    handleMugPointerUp
                                }
                                style={mugStyle}
                                role="application"
                                aria-label="Drag to rotate your mug"
                            >

                                <div className="customize-mug">

                                    <div className="customize-mug__handle" />

                                    <div className="customize-mug__body">

                                        <div
                                            className={`customize-mug__content ${
                                                activeView === "back"
                                                    ? "is-back"
                                                    : ""
                                            }`}
                                            style={{
                                                position:
                                                    "relative",
                                                overflow:
                                                    "hidden",
                                                touchAction:
                                                    "none",
                                            }}
                                            onPointerDown={(event) =>
                                                event.stopPropagation()
                                            }
                                        >

                                            {!currentImage &&
                                                !currentText && (
                                                    <>
                                                        <span className="customize-mug__logo">
                                                            MAGIC TOUCH
                                                        </span>

                                                        <span className="customize-mug__placeholder">
                                                            YOUR DESIGN
                                                        </span>
                                                    </>
                                                )}

                                            {currentImage && (
                                                <div
                                                    style={{
                                                        position:
                                                            "absolute",
                                                        left: `${currentImage.x}%`,
                                                        top: `${currentImage.y}%`,
                                                        width: `${currentImage.width}%`,
height: `${currentImage.height}%`,
                                                        transform:
                                                            "translate(-50%, -50%)",
                                                        zIndex: 2,
                                                        touchAction:
                                                            "none",
                                                        cursor:
                                                            "move",
                                                        border:
                                                            selectedDesign ===
                                                            "image"
                                                                ? "2px solid #d4af37"
                                                                : "2px solid transparent",
                                                        boxSizing:
                                                            "border-box",
                                                    }}
                                                    onPointerDown={(
                                                        event
                                                    ) =>
                                                        handleDesignPointerDown(
                                                            event,
                                                            "image"
                                                        )
                                                    }
                                                    onPointerMove={
                                                        handleDesignPointerMove
                                                    }
                                                    onPointerUp={
                                                        handleDesignPointerUp
                                                    }
                                                    onPointerCancel={
                                                        handleDesignPointerUp
                                                    }
                                                >
                                                    <img
                                                        src={
                                                            currentImage.src
                                                        }
                                                        alt="Your uploaded design"
                                                        style={{
    display: "block",
    width: "100%",
    height: "100%",
    objectFit: "fill",
    pointerEvents: "none",
    userSelect: "none",
}}
                                                        draggable={false}
                                                    />

                                                    {selectedDesign ===
                                                        "image" && (
                                                        <button
                                                            type="button"
                                                            aria-label="Resize image"
                                                            style={{
                                                                position:
                                                                    "absolute",
                                                                right:
                                                                    "-10px",
                                                                bottom:
                                                                    "-10px",
                                                                width:
                                                                    "22px",
                                                                height:
                                                                    "22px",
                                                                borderRadius:
                                                                    "50%",
                                                                border:
                                                                    "2px solid white",
                                                                background:
                                                                    "#c89b3c",
                                                                padding:
                                                                    0,
                                                                touchAction:
                                                                    "none",
                                                                cursor:
                                                                    "nwse-resize",
                                                            }}
                                                            onPointerDown={(
                                                                event
                                                            ) =>
                                                                handleResizePointerDown(
                                                                    event,
                                                                    "image"
                                                                )
                                                            }
                                                            onPointerMove={
                                                                handleResizePointerMove
                                                            }
                                                            onPointerUp={
                                                                handleResizePointerUp
                                                            }
                                                            onPointerCancel={
                                                                handleResizePointerUp
                                                            }
                                                        />
                                                    )}
                                                </div>
                                            )}

                                            {currentText && (
                                                <div
                                                    style={{
                                                        position:
                                                            "absolute",
                                                        left: `${currentText.x}%`,
                                                        top: `${currentText.y}%`,
                                                        transform:
                                                            "translate(-50%, -50%)",
                                                        zIndex: 3,
                                                        color:
                                                            currentText.color,
                                                        fontFamily:
                                                            currentText.fontFamily,
                                                        fontSize:
                                                            `${currentText.fontSize}px`,
                                                        fontWeight:
                                                            700,
                                                        whiteSpace:
                                                            "nowrap",
                                                        cursor:
                                                            "move",
                                                        userSelect:
                                                            "none",
                                                        touchAction:
                                                            "none",
                                                        border:
                                                            selectedDesign ===
                                                            "text"
                                                                ? "2px solid #d4af37"
                                                                : "2px solid transparent",
                                                        padding:
                                                            "6px",
                                                    }}
                                                    onPointerDown={(
                                                        event
                                                    ) =>
                                                        handleDesignPointerDown(
                                                            event,
                                                            "text"
                                                        )
                                                    }
                                                    onPointerMove={
                                                        handleDesignPointerMove
                                                    }
                                                    onPointerUp={
                                                        handleDesignPointerUp
                                                    }
                                                    onPointerCancel={
                                                        handleDesignPointerUp
                                                    }
                                                    onDoubleClick={
                                                        handleEditText
                                                    }
                                                >
                                                    {currentText.value}

                                                    {selectedDesign ===
                                                        "text" && (
                                                        <button
                                                            type="button"
                                                            aria-label="Resize text"
                                                            style={{
                                                                position:
                                                                    "absolute",
                                                                right:
                                                                    "-12px",
                                                                bottom:
                                                                    "-12px",
                                                                width:
                                                                    "22px",
                                                                height:
                                                                    "22px",
                                                                borderRadius:
                                                                    "50%",
                                                                border:
                                                                    "2px solid white",
                                                                background:
                                                                    "#c89b3c",
                                                                padding:
                                                                    0,
                                                                touchAction:
                                                                    "none",
                                                                cursor:
                                                                    "nwse-resize",
                                                            }}
                                                            onPointerDown={(
                                                                event
                                                            ) =>
                                                                handleResizePointerDown(
                                                                    event,
                                                                    "text"
                                                                )
                                                            }
                                                            onPointerMove={
                                                                handleResizePointerMove
                                                            }
                                                            onPointerUp={
                                                                handleResizePointerUp
                                                            }
                                                            onPointerCancel={
                                                                handleResizePointerUp
                                                            }
                                                        />
                                                    )}
                                                </div>
                                            )}

                                        </div>

                                    </div>

                                </div>

                            </div>

                        </div>

                        <div className="customize-view-controls">

                            {(
                                ["front", "back"] as MugView[]
                            ).map((view) => (

                                <button
                                    key={view}
                                    type="button"
                                    className={
                                        activeView === view
                                            ? "is-active"
                                            : ""
                                    }
                                    onClick={() =>
                                        handleViewChange(
                                            view
                                        )
                                    }
                                >
                                    {view}
                                </button>

                            ))}

                        </div>

                        <div className="customize-preview__bottom">

                            <div className="customize-price">

                                <span>
                                    PRICE
                                </span>

                                <strong>
                                    $24.99
                                </strong>

                            </div>

                            <div className="customize-quantity">

                                <span>
                                    QTY
                                </span>

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