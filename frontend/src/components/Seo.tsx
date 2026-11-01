import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";

type SeoEntry = { en: string; es: string; description: { en: string; es: string } };

const SITE_URL = "https://www.jqydesigns.com";
const LOGO_URL =
  "https://res.cloudinary.com/ydcdwyui/image/upload/v1790738368/magic-touch-designs/logos/nneyxqq6xylcxciw3om7.png";

const SEO: Record<string, SeoEntry> = {
  "/": {
    en: "Personalized Mugs & Custom Gifts | JQYDesigns Magic Touch Designs",
    es: "Tazas Personalizadas y Regalos | JQYDesigns Magic Touch Designs",
    description: {
      en: "Shop personalized mugs with your photo, name or design, made in Katy, TX. Custom gifts for every occasion at JQYDesigns Magic Touch Designs.",
      es: "Compra tazas personalizadas con tu foto, nombre o diseño, hechas en Katy, TX. Regalos personalizados para cada ocasión en JQYDesigns Magic Touch Designs.",
    },
  },
  "/collections": {
    en: "Personalized Mug Collections | JQYDesigns Magic Touch Designs",
    es: "Colecciones de Tazas Personalizadas | JQYDesigns Magic Touch Designs",
    description: {
      en: "Browse personalized mug collections for love, family, business branding and special occasions.",
      es: "Explora colecciones de tazas personalizadas para amor, familia, negocios y ocasiones especiales.",
    },
  },
  "/collections/love-romance": {
    en: "Personalized Mugs for Couples & Romance | JQYDesigns",
    es: "Tazas Personalizadas para Parejas y Romance | JQYDesigns",
    description: {
      en: "Personalized romantic mugs made for couples, anniversaries and special moments.",
      es: "Tazas románticas personalizadas para parejas, aniversarios y momentos especiales.",
    },
  },
  "/collections/family-memories": {
    en: "Personalized Family Mugs & Gifts | JQYDesigns",
    es: "Tazas y Regalos Personalizados para Familia | JQYDesigns",
    description: {
      en: "Create personalized family mugs and keepsakes designed to preserve meaningful memories.",
      es: "Crea tazas y recuerdos personalizados para conservar los momentos importantes de tu familia.",
    },
  },
  "/collections/business-branding": {
    en: "Custom Business Mugs & Branding | JQYDesigns",
    es: "Tazas Personalizadas para Empresas | JQYDesigns",
    description: {
      en: "Custom mugs with your logo for businesses, teams, employees and events.",
      es: "Tazas personalizadas con tu logo para empresas, equipos, empleados y eventos.",
    },
  },
  "/collections/special-occasions": {
    en: "Personalized Mugs for Special Occasions | JQYDesigns",
    es: "Tazas Personalizadas para Ocasiones Especiales | JQYDesigns",
    description: {
      en: "Find personalized mugs for birthdays, holidays, Christmas and special occasions.",
      es: "Encuentra tazas personalizadas para cumpleaños, Navidad, celebraciones y ocasiones especiales.",
    },
  },
  "/reviews": {
    en: "Customer Reviews | Personalized Mugs | JQYDesigns",
    es: "Opiniones de Clientes | Tazas Personalizadas | JQYDesigns",
    description: {
      en: "Read real customer reviews and photos of personalized mugs from JQYDesigns.",
      es: "Lee opiniones reales y fotos de clientes de las tazas personalizadas de JQYDesigns.",
    },
  },
  "/customize": {
    en: "Design Your Own Custom Mug | JQYDesigns",
    es: "Diseña tu Propia Taza Personalizada | JQYDesigns",
    description: {
      en: "Design your own custom mug with your photo, name or text. Preview it in 3D and order online.",
      es: "Diseña tu propia taza con tu foto, nombre o texto. Mírala en 3D y pídela en línea.",
    },
  },
  "/how-it-works": {
    en: "How Custom Mugs Work | JQYDesigns Magic Touch Designs",
    es: "Cómo Funcionan las Tazas Personalizadas | JQYDesigns",
    description: {
      en: "Learn how to choose, customize and order your personalized mug from JQYDesigns.",
      es: "Aprende cómo elegir, personalizar y pedir tu taza personalizada en JQYDesigns.",
    },
  },
  "/about": {
    en: "About JQYDesigns | Magic Touch Designs",
    es: "Sobre JQYDesigns | Magic Touch Designs",
    description: {
      en: "Learn about JQYDesigns Magic Touch Designs — personalized mugs made in Katy, Texas.",
      es: "Conoce JQYDesigns Magic Touch Designs — tazas personalizadas hechas en Katy, Texas.",
    },
  },
  "/contact": {
    en: "Contact JQYDesigns | Magic Touch Designs",
    es: "Contacto | JQYDesigns Magic Touch Designs",
    description: {
      en: "Contact JQYDesigns about custom mug orders, personalization and support.",
      es: "Contacta a JQYDesigns sobre pedidos de tazas personalizadas y soporte.",
    },
  },
  "/track-order": {
    en: "Track Your Order | JQYDesigns",
    es: "Rastrea tu Pedido | JQYDesigns",
    description: {
      en: "Track your JQYDesigns personalized mug order with your order number and email.",
      es: "Rastrea tu pedido de taza personalizada con tu número de orden y correo.",
    },
  },
  "/faqs": {
    en: "FAQs | Personalized Mugs | JQYDesigns",
    es: "Preguntas Frecuentes | Tazas Personalizadas | JQYDesigns",
    description: {
      en: "Answers to common questions about personalized mugs, orders, customization, shipping and returns.",
      es: "Respuestas a preguntas frecuentes sobre tazas personalizadas, pedidos, personalización, envíos y devoluciones.",
    },
  },
  "/shipping-returns": {
    en: "Shipping & Returns | JQYDesigns Magic Touch Designs",
    es: "Envíos y Devoluciones | JQYDesigns Magic Touch Designs",
    description: {
      en: "Shipping, delivery and returns information for JQYDesigns orders.",
      es: "Información de envíos, entregas y devoluciones de pedidos de JQYDesigns.",
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
    const url = `${SITE_URL}${pathname === "/" ? "/" : pathname}`;

    document.title = title;
    upsertMeta("name", "description", description);
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:url", url);
    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:site_name", "JQYDesigns");
    upsertMeta("property", "og:image", LOGO_URL);
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", LOGO_URL);
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertLink("canonical", url);
  }, [language, pathname]);

  return null;
}
