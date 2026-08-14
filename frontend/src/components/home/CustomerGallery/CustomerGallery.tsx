/**
 *
 * ===============================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: CustomerGallery.tsx
 * Module: Home
 * Language: TypeScript React
 * Description:
 * Customer Gallery Section.
 *
 * ===============================================================
 */

import { useState } from "react";

import {
    Facebook,
    Instagram,
    Music2,
    Youtube
} from "lucide-react";

import "./CustomerGallery.css";
import { customerGalleryItems } from "./CustomerGallery.data";

import { useLanguage } from "../../../contexts/LanguageContext";

import { translations } from "../../../translations";
const getSocialIcon = (
    platform:
        | "instagram"
        | "facebook"
        | "youtube"
        | "tiktok"
) => {

    switch (platform) {

        case "instagram":
            return <Instagram size={18} />;

        case "facebook":
            return <Facebook size={18} />;

        case "youtube":
            return <Youtube size={18} />;

        case "tiktok":
            return <Music2 size={18} />;

        default:
            return null;

    }

};
  function CustomerGallery() {

    const { language } = useLanguage();

    const t = translations[language];

const [selectedImage, setSelectedImage] = useState<{
    image: string;
    customerName: string;
} | null>(null);

  return (
    <section className="customer-gallery">
      <div className="customer-gallery__container">

        {/* HEADER */}
        <div className="customer-gallery__header">
          <span className="customer-gallery__eyebrow">
    {t.customerGallery.eyebrow}
</span>

<h2>
    {t.customerGallery.title}
</h2>

<p>
    {t.customerGallery.description}
</p>
        </div>

        {/* GALLERY */}
        <div className="customer-gallery__grid">
          {customerGalleryItems
            .slice(0, 8)
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

                  {/* IMAGE PREVIEW */}
                  <button
                    type="button"
                    className="customer-gallery__zoom"
                    aria-label={`View ${item.customerName}'s photo`}
                    onClick={() =>
                      setSelectedImage({
                        image: item.image,
                        customerName: item.customerName,
                      })
                    }
                  >
                    <span aria-hidden="true">⌕</span>
                  </button>
                </div>

                <div className="customer-gallery__content">

    <span className="customer-gallery__name">
        {item.customerName}
    </span>

    <p>
        {item.comment}
    </p>

    {item.social && (
        <a
            href={item.social.url}
            target="_blank"
            rel="noopener noreferrer"
            className="customer-gallery__social"
            aria-label={`View ${item.customerName}'s ${item.social.platform}`}
        >
            {getSocialIcon(item.social.platform)}
        </a>
    )}

</div>
              </article>
            ))}
        </div>

      </div>

      {/* LIGHTBOX */}
      {selectedImage && (
        <div
          className="customer-gallery__lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`${selectedImage.customerName}'s customer gallery photo`}
          onClick={() => setSelectedImage(null)}
        >
          <button
            type="button"
            className="customer-gallery__lightbox-close"
            aria-label="Close image"
            onClick={() => setSelectedImage(null)}
          >
            ×
          </button>

          <div
            className="customer-gallery__lightbox-content"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={selectedImage.image}
              alt={`${selectedImage.customerName}'s personalized mug`}
            />

            <span className="customer-gallery__lightbox-name">
              {selectedImage.customerName}
            </span>
          </div>
        </div>
      )}
    </section>
  );
}

export default CustomerGallery;