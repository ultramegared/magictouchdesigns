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
    Music2
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
            return (
                <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                >
                    <rect
                        x="3"
                        y="3"
                        width="18"
                        height="18"
                        rx="5"
                    />
                    <circle
                        cx="12"
                        cy="12"
                        r="4"
                    />
                    <circle
                        cx="17.5"
                        cy="6.5"
                        r="1"
                        fill="currentColor"
                        stroke="none"
                    />
                </svg>
            );

        case "facebook":
            return (
                <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                >
                    <path d="M14 8h3V4h-3c-3.3 0-5 2-5 5v3H6v4h3v8h4v-8h3.2l.8-4H13V9c0-.7.3-1 1-1z" />
                </svg>
            );

        case "youtube":
            return (
                <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                >
                    <path d="M23 12s0-4-1-5-2.2-1-3-1C16.5 5.8 12 5.8 12 5.8s-4.5 0-7 .2c-.8 0-2 .1-3 1s-1 5-1 5 0 4 1 5 2.2 1 3 1c2.5.2 7 .2 7 .2s4.5 0 7-.2c.8 0 2-.1 3-1s1-5 1-5z" />
                    <path
                        d="M10 9l5 3-5 3V9z"
                        fill="#0F0F10"
                    />
                </svg>
            );

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