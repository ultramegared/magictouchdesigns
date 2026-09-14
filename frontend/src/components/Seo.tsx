import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";

type SeoEntry = { en: string; es: string; description: { en: string; es: string } };

const SEO: Record<string, SeoEntry> = {
  "/": {
    en: "Custom Products & Personalized Gifts | JQYD Magic Touch Designs",
    es: "Productos Personalizados y Regalos | JQYD Magic Touch Designs",
    description: {
      en: "Shop custom mugs, T-shirts, hats, personalized gifts and custom products made for every occasion at JQYD Magic Touch Designs.",
      es: "Compra tazas, camisetas, gorras, regalos personalizados y productos hechos para cada ocasión en JQYD Magic Touch Designs.",
    },
  },
  "/products": {
    en: "Custom Products | Personalized Mugs, Shirts & Gifts | JQYD",
    es: "Productos Personalizados | Tazas, Camisetas y Regalos | JQYD",
    description: {
      en: "Explore personalized mugs, apparel, hats, gifts and custom products from JQYD Magic Touch Designs.",
      es: "Explora tazas, ropa, gorras, regalos y productos personalizados de JQYD Magic Touch Designs.",
    },
  },
  "/collections": {
    en: "Personalized Gift Collections | JQYD Magic Touch Designs",
    es: "Colecciones de Regalos Personalizados | JQYD Magic Touch Designs",
    description: {
      en: "Browse curated personalized gift collections for love, family, business branding and special occasions.",
      es: "Explora colecciones de regalos personalizados para amor, familia, negocios y ocasiones especiales.",
    },
  },
  "/collections/love-romance": {
    en: "Personalized Gifts for Couples & Romance | JQYD",
    es: "Regalos Personalizados para Parejas y Romance | JQYD",
    description: {
      en: "Personalized romantic gifts and custom products made for couples, anniversaries and special moments.",
      es: "Regalos románticos y productos personalizados para parejas, aniversarios y momentos especiales.",
    },
  },
  "/collections/family-memories": {
    en: "Personalized Family Gifts & Memories | JQYD",
    es: "Regalos Personalizados para Familia y Recuerdos | JQYD",
    description: {
      en: "Create personalized family gifts and keepsakes designed to preserve meaningful memories.",
      es: "Crea regalos y recuerdos personalizados para conservar momentos importantes de tu familia.",
    },
  },
  "/collections/business-branding": {
    en: "Custom Business Branding Products | JQYD",
    es: "Productos Personalizados para Empresas | JQYD",
    description: {
      en: "Custom mugs, apparel and branded products for businesses, teams, employees and events.",
      es: "Tazas, ropa y productos con marca personalizados para empresas, equipos, empleados y eventos.",
    },
  },
  "/collections/special-occasions": {
    en: "Personalized Gifts for Special Occasions | JQYD",
    es: "Regalos Personalizados para Ocasiones Especiales | JQYD",
    description: {
      en: "Find personalized gifts for birthdays, holidays, celebrations and special occasions.",
      es: "Encuentra regalos personalizados para cumpleaños, celebraciones, fiestas y ocasiones especiales.",
    },
  },
  "/customize": {
    en: "Customize Your Product | JQYD Magic Touch Designs",
    es: "Personaliza tu Producto | JQYD Magic Touch Designs",
    description: {
      en: "Customize your product with your own design and create a personalized item with JQYD Magic Touch Designs.",
      es: "Personaliza tu producto con tu propio diseño y crea un artículo único con JQYD Magic Touch Designs.",
    },
  },
  "/how-it-works": {
    en: "How Custom Products Work | JQYD Magic Touch Designs",
    es: "Cómo Funcionan los Productos Personalizados | JQYD",
    description: {
      en: "Learn how to choose, customize and order personalized products from JQYD Magic Touch Designs.",
      es: "Aprende cómo elegir, personalizar y pedir productos personalizados de JQYD Magic Touch Designs.",
    },
  },
  "/about": {
    en: "About JQYD | Magic Touch Designs",
    es: "Sobre JQYD | Magic Touch Designs",
    description: {
      en: "Learn about JQYD Magic Touch Designs and our approach to personalized products and gifts.",
      es: "Conoce JQYD Magic Touch Designs y nuestra forma de crear productos y regalos personalizados.",
    },
  },
  "/contact": {
    en: "Contact JQYD | Magic Touch Designs",
    es: "Contacto | JQYD Magic Touch Designs",
    description: {
      en: "Contact JQYD Magic Touch Designs about custom products, orders, personalization and support.",
      es: "Contacta a JQYD Magic Touch Designs sobre productos personalizados, pedidos y soporte.",
    },
  },
  "/faqs": {
    en: "FAQs | Custom Products & Personalized Gifts | JQYD",
    es: "Preguntas Frecuentes | Productos Personalizados | JQYD",
    description: {
      en: "Answers to common questions about personalized products, orders, customization, shipping and returns.",
      es: "Respuestas a preguntas frecuentes sobre productos personalizados, pedidos, personalización, envíos y devoluciones.",
    },
  },
  "/shipping-returns": {
    en: "Shipping & Returns | JQYD Magic Touch Designs",
    es: "Envíos y Devoluciones | JQYD Magic Touch Designs",
    description: {
      en: "Review shipping, delivery and returns information for JQYD Magic Touch Designs orders.",
      es: "Consulta información de envíos, entregas y devoluciones de pedidos de JQYD Magic Touch Designs.",
    },
  },
};

const upsertMeta = (attribute: "name" | "property", key: string, content: string) => {
  let element = document.head.querySelector(`meta[${attribute}="${key}"]`) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.content = content;
};

const upsertLink = (rel: string, href: string) => {
  let element = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!element) {
    element = document.createElement("link");
    element.rel = rel;
    document.head.appendChild(element);
  }
  element.href = href;
};

export default function Seo() {
  const { pathname } = useLocation();
  const { language } = useLanguage();

  useEffect(() => {
    const entry = SEO[pathname] || SEO["/"];
    const title = language === "es" ? entry.es : entry.en;
    const description = language === "es" ? entry.description.es : entry.description.en;
    const url = `https://jqydesigns.com${pathname === "/" ? "/" : pathname}`;

    document.title = title;
    upsertMeta("name", "description", description);
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:url", url);
    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:site_name", "JQYD | Magic Touch Designs");
    upsertMeta("property", "og:image", "https://jqydesigns.com/images/logo/jqyd-logo-256.png");
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", "https://jqydesigns.com/images/logo/jqyd-logo-256.png");
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertLink("canonical", url);
  }, [language, pathname]);

  return null;
}
