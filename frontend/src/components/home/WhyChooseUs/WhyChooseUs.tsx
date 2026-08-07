/**
 * ===============================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: WhyChooseUs.tsx
 * Module: Home
 * ===============================================================
 */

import "./WhyChooseUs.css";

import {

    Truck,

    Palette,

    ShieldCheck,

    Headset

} from "lucide-react";

function WhyChooseUs() {

    return (

        <section className="why">

            <div className="why__header">

                <span>

                    WHY CHOOSE US

                </span>

                <h2>

                    Crafted With Passion,
                    Designed For You

                </h2>

                <p>

                    We create premium personalized mugs using
                    high-quality materials, vibrant printing,
                    and careful craftsmanship.

                </p>

            </div>

            <div className="why__grid">

                <article className="why__card">

                    <Truck size={40} />

                    <h3>

                        Fast Shipping

                    </h3>

                    <p>

                        Quick and secure delivery
                        directly to your door.

                    </p>

                </article>

                <article className="why__card">

                    <Palette size={40} />

                    <h3>

                        Custom Designs

                    </h3>

                    <p>

                        Create a unique mug
                        exactly the way you imagine it.

                    </p>

                </article>

                <article className="why__card">

                    <ShieldCheck size={40} />

                    <h3>

                        Premium Quality

                    </h3>

                    <p>

                        Durable ceramic and
                        long-lasting vibrant printing.

                    </p>

                </article>

                <article className="why__card">

                    <Headset size={40} />

                    <h3>

                        Friendly Support

                    </h3>

                    <p>

                        We're here whenever
                        you need help.

                    </p>

                </article>

            </div>

        </section>

    );

}

export default WhyChooseUs;