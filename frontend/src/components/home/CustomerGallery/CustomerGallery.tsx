/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: CustomerGallery.tsx
 * Module: Home
 * Language: TypeScript React
 * Description:
 * Customer Gallery Section.
 * ================================================================
 */

import "./CustomerGallery.css";

import { customerGalleryItems } from "./CustomerGallery.data";

function CustomerGallery() {

    return (

        <section className="customer-gallery">

            <div className="customer-gallery__container">

                <div className="customer-gallery__header">

                    <span className="customer-gallery__eyebrow">

                        CUSTOMER GALLERY

                    </span>

                    <h2>

                        Real mugs. Real people.

                    </h2>

                    <p>

                        See how our customers are enjoying
                        their personalized mugs.

                    </p>

                </div>


                <div className="customer-gallery__grid">

                    {

                        customerGalleryItems
                            .slice(0, 4)
                            .map((item) => (

                                <article

                                    key={item.id}

                                    className="customer-gallery__card"

                                >

                                    <div className="customer-gallery__image-wrapper">

                                        <img

                                            src={item.image}

                                            alt={`${item.customerName}'s personalized mug`}

                                            loading="lazy"

                                        />

                                    </div>


                                    <div className="customer-gallery__content">

                                        <span className="customer-gallery__name">

                                            {item.customerName}

                                        </span>

                                        <p>

                                            {item.comment}

                                        </p>

                                    </div>

                                </article>

                            ))

                    }

                </div>


                <div className="customer-gallery__action">

                    <button type="button">

                        VIEW GALLERY →

                    </button>

                </div>

            </div>

        </section>

    );

}

export default CustomerGallery;