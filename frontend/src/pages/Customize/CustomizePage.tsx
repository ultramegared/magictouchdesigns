/**
 * ===============================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: CustomizePage.tsx
 * Module: Frontend
 * Language: TypeScript React
 * Description:
 * Temporary construction page for the mug customization editor.
 * ===============================================================
 */

import Header from "../../components/layout/Header";
import Footer from "../../components/home/Footer";
import "./CustomizePageUnderConstruction.css";

function CustomizePage() {
    return (
        <>
            <Header />

            <main className="customize-page customize-page--construction">

                <section className="customize-construction">

                    <div className="customize-construction__badge">
                        CUSTOMIZE
                    </div>

                    <div className="customize-construction__icon">
                        ☕
                    </div>

                    <span className="customize-construction__eyebrow">
                        SOMETHING SPECIAL IS COMING
                    </span>

                    <h1>
                        Customize Your Mug
                    </h1>

                    <p>
                        We are building a new and more powerful
                        customization experience for your mugs.
                    </p>

                    <p>
                        Soon you will be able to upload your complete
                        design, add text, choose your mug color and size,
                        and preview your design in 3D.
                    </p>

                    <div className="customize-construction__features">

                        <div>
                            <span>01</span>
                            <strong>3D Preview</strong>
                            <small>See your design around the mug.</small>
                        </div>

                        <div>
                            <span>02</span>
                            <strong>Personal Design</strong>
                            <small>Add photos and custom text.</small>
                        </div>

                        <div>
                            <span>03</span>
                            <strong>Your Mug</strong>
                            <small>Choose size and available color.</small>
                        </div>

                    </div>

                    <div className="customize-construction__sizes">
                        <span>COMING SOON</span>

                        <strong>
                            11 oz&nbsp;&nbsp;•&nbsp;&nbsp;15 oz
                        </strong>
                    </div>

                    <div className="customize-construction__colors">

                        <span className="customize-construction__color customize-construction__color--white" />
                        <span className="customize-construction__color customize-construction__color--black" />
                        <span className="customize-construction__color customize-construction__color--magic" />
                        <span className="customize-construction__color customize-construction__color--red" />

                    </div>

                    <div className="customize-construction__status">
                        <span />
                        UNDER CONSTRUCTION
                    </div>

                </section>

            </main>

            <Footer />
        </>
    );
}

export default CustomizePage;