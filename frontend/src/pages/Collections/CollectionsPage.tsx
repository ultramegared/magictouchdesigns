/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: CollectionsPage.tsx
 * Module: Frontend
 * Language: TypeScript React
 * Description:
 * Premium collections landing page.
 * ================================================================
 */

import { useEffect, useMemo, useState } from "react";
import "./CollectionsPage.css";
import Header from "../../components/layout/Header";
import Footer from "../../components/home/Footer";
import { useLanguage } from "../../contexts/LanguageContext";
import { translations } from "../../translations";
import { Link, useNavigate, useSearchParams } from "react-router-dom";


/*
 * Search helpers (module level): accent folding, plural stemming,
 * Spanish-to-English keyword synonyms, and filler-word filtering
 * so customer queries match the English catalog.
 */

const SEARCH_SYNONYMS: Record<string, string> = {
  cup: "mug",
  cups: "mug",
  taza: "mug",
  tazas: "mug",
  amor: "love",
  navidad: "christmas",
  mama: "mom",
  madre: "mom",
  familia: "family",
  regalo: "gift",
  regalos: "gift",
  cumpleanos: "birthday",
  maestro: "teacher",
  maestra: "teacher",
  oro: "gold",
  dorado: "gold",
  personalizado: "personalized",
  personalizada: "personalized",
  reno: "reindeer",
  muneco: "snowman",
  nieve: "snow",
};

const SEARCH_STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "for",
  "of",
  "in",
  "on",
  "at",
  "to",
  "with",
  "de",
  "la",
  "el",
  "las",
  "los",
  "en",
  "un",
  "una",
  "con",
  "por",
  "para",
  "y",
  "o",
  "del",
  "al",
  "su",
  "mi",
  "que",
]);

const searchNormalize = (value: string): string =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const searchSingular = (word: string): string => {
  if (word.length > 3 && word.endsWith("s") && !word.endsWith("ss")) {
    return word.slice(0, -1);
  }
  return word;
};

const searchWordCandidates = (word: string): string[] => {
  const singular = searchSingular(word);
  return [
    SEARCH_SYNONYMS[word] ?? word,
    SEARCH_SYNONYMS[singular] ?? singular,
  ];
};


function CollectionsPage() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const t = translations[language].collections;

  /*
   * Search mode: when the page is opened with ?search=<query>
   * (for example from the header search box), fetch every
   * collection's products and filter them by name and
   * description instead of showing the collections landing view.
   * The landing view below is untouched when no ?search is present.
   */
  const [searchParams] = useSearchParams();
  const searchQuery = (searchParams.get("search") ?? "").trim();
  const searching = searchQuery.length > 0;

  type SearchProduct = {
    product_id: string;
    name: string;
    slug: string;
    description?: string | null;
    price: number | string;
    image_url?: string | null;
    image_urls?: string[];
    is_active: boolean;
    collectionSlug: string;
  };

  const SEARCH_COLLECTIONS = [
    { slug: "love-romance", name: language === "es" ? "Amor y Romance" : "Love & Romance" },
    { slug: "family-memories", name: language === "es" ? "Familia y Recuerdos" : "Family & Memories" },
    { slug: "business-branding", name: language === "es" ? "Negocios y Marca" : "Business & Branding" },
    { slug: "special-occasions", name: language === "es" ? "Ocasiones Especiales" : "Special Occasions" },
  ] as const;

  const [searchProducts, setSearchProducts] = useState<SearchProduct[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(false);

  useEffect(() => {
    if (!searching) {
      return;
    }
    let cancelled = false;
    const load = async () => {
      setSearchLoading(true);
      setSearchError(false);
      try {
        const responses = await Promise.all(
          SEARCH_COLLECTIONS.map((collection) =>
            fetch(`https://api.jqydesigns.com/api/collections/${collection.slug}/products`, {
              method: "GET",
              headers: { Accept: "application/json" },
              cache: "no-store",
              credentials: "omit",
            })
          )
        );
        const parsed = await Promise.all(
          responses.map(async (response) => {
            if (!response.ok) {
              throw new Error(`Collection products request failed (${response.status})`);
            }
            return (await response.json()) as { products?: Omit<SearchProduct, "collectionSlug">[] };
          })
        );
        if (cancelled) {
          return;
        }
        const seen = new Set<string>();
        const merged: SearchProduct[] = [];
        parsed.forEach((data, index) => {
          (data.products || []).forEach((product) => {
            if (!product.is_active || seen.has(product.product_id)) {
              return;
            }
            seen.add(product.product_id);
            merged.push({ ...product, collectionSlug: SEARCH_COLLECTIONS[index].slug });
          });
        });
        setSearchProducts(merged);
      } catch (err) {
        console.error(err);
        if (!cancelled) setSearchError(true);
      } finally {
        if (!cancelled) setSearchLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [searching, searchQuery]);

  /*
   * Smart product matching.
   * - Every query word must appear in the name, description or
   *   collection name, in any order ("for mom" finds "Mom & Son").
   * - Accents are ignored ("mama" matches "mamá").
   * - Plurals are understood ("mugs" matches "mug").
   * - Spanish queries are translated to the catalog's English
   *   keywords ("amor" finds the love collection, "navidad"
   *   finds Christmas). The catalog content itself stays English.
   * - Filler words in both languages are ignored.
   */

  const searchResults = useMemo(() => {
    if (!searching) {
      return [];
    }
    const words = searchNormalize(searchQuery)
      .split(/\s+/)
      .filter((word) => word.length > 0 && !SEARCH_STOP_WORDS.has(word));
    return searchProducts.filter((product) => {
      const haystack = searchNormalize(
        `${product.name} ${product.description ?? ""} ${product.collectionSlug.replace(/-/g, " ")}`
      );
      return words.every((word) =>
        searchWordCandidates(word).some((candidate) =>
          haystack.includes(candidate)
        )
      );
    });
  }, [searching, searchQuery, searchProducts]);

  const searchCollectionName = (slug: string) =>
    SEARCH_COLLECTIONS.find((collection) => collection.slug === slug)?.name ?? slug;

     const collections = [
    {
      id: 1,
      translationKey: "loveRomance",
      image: "/images/collections/love-romance.jpg",
      icon: "♡",
    },
    {
      id: 2,
      translationKey: "familyMemories",
      image: "/images/collections/family-memories.jpg",
      icon: "♧",
    },
    {
      id: 3,
      translationKey: "businessBranding",
      image: "/images/collections/business-branding.jpg",
      icon: "▱",
    },
    {
      id: 4,
      translationKey: "specialOccasions",
      image: "/images/collections/special-occasions.jpg",
      icon: "✦",
    },
  ] as const;

    const benefits = [
        {
            id: 1,
            translationKey: "premiumQuality",
            icon: (
                <svg viewBox="0 0 64 64" aria-hidden="true">
    <path
        d="M8 20L18 30L25 15L32 27L39 15L46 30L56 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
    />

    <path
        d="M14 34H50"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
    />

    <path
        d="M17 34L20 49H44L47 34"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinejoin="round"
    />

    <circle
        cx="32"
        cy="9"
        r="2.2"
        fill="currentColor"
    />
</svg>
            ),
        },
        
        {
    id: 2,
    translationKey: "fastShipping",
    icon: (
        <svg viewBox="0 0 64 64" aria-hidden="true">
            <path
                d="M7 17H39V43H7Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinejoin="round"
            />

            <path
                d="M39 25H48L57 34V43H39Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinejoin="round"
            />

            <path
                d="M15 43C15 46.3 17.7 49 21 49C24.3 49 27 46.3 27 43"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
            />

            <path
                d="M43 43C43 46.3 45.7 49 49 49C52.3 49 55 46.3 55 43"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
            />
        </svg>
    ),
},
{
    id: 3,
    translationKey: "customDesigns",
    icon: (
        <svg viewBox="0 0 64 64" aria-hidden="true">
            <path
                d="M11 53L17 38L43 12L52 21L26 47L11 53Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinejoin="round"
            />

            <path
                d="M38 17L47 26"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
            />

            <path
                d="M11 53L25 49"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
            />
        </svg>
    ),
},

        {
            id: 4,
            translationKey: "securePayment",
            icon: (
                <svg viewBox="0 0 64 64" aria-hidden="true">
                    <path
                        d="M32 7L52 14V29C52 42 44 52 32 57C20 52 12 42 12 29V14Z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinejoin="round"
                    />

                    <path
                        d="M21 32L29 40L44 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            ),
        },
    ];

    if (searching) {
        return (
            <>
                <Header />

                <main className="collections-page">

                    <section className="search-results">

                        <h1 className="search-results__title">
                            {language === "es" ? "Resultados para" : "Results for"} “{searchQuery}”
                        </h1>

                        {searchLoading && (
                            <p className="search-results__status">
                                {language === "es" ? "Buscando productos..." : "Searching products..."}
                            </p>
                        )}

                        {!searchLoading && searchError && (
                            <p className="search-results__status">
                                {language === "es" ? "No pudimos buscar en este momento. Inténtalo de nuevo." : "We could not search right now. Please try again."}
                            </p>
                        )}

                        {!searchLoading && !searchError && (
                            <>
                                <p className="search-results__count">
                                    {searchResults.length === 1
                                        ? (language === "es" ? "1 producto encontrado" : "1 product found")
                                        : (language === "es" ? `${searchResults.length} productos encontrados` : `${searchResults.length} products found`)}
                                </p>

                                {searchResults.length === 0 ? (
                                    <div className="search-results__empty">
                                        <p>
                                            {language === "es" ? "No encontramos productos para tu búsqueda." : "No products matched your search."}
                                        </p>
                                        <button type="button" className="search-results__clear" onClick={() => navigate("/collections")}>
                                            {language === "es" ? "Ver todas las colecciones" : "Browse all collections"}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="search-results__grid">
                                        {searchResults.map((product) => {
                                            const image = product.image_url || product.image_urls?.[0] || "";
                                            return (
                                                <article className="search-result-card" key={product.product_id}>
                                                    {image && (
                                                        <div className="search-result-card__visual">
                                                            <img src={image} alt={product.name} loading="lazy" />
                                                        </div>
                                                    )}
                                                    <div className="search-result-card__body">
                                                        <span className="search-result-card__collection">
                                                            {searchCollectionName(product.collectionSlug)}
                                                        </span>
                                                        <h3>{product.name}</h3>
                                                        {Number.isFinite(Number(product.price)) && (
                                                            <strong>${Number(product.price).toFixed(2)}</strong>
                                                        )}
                                                        <Link
                                                            className="search-result-card__button"
                                                            to={`/collections/${product.collectionSlug}?product=${product.slug}`}
                                                        >
                                                            {language === "es" ? "Ver producto" : "View product"}
                                                        </Link>
                                                    </div>
                                                </article>
                                            );
                                        })}
                                    </div>
                                )}
                            </>
                        )}

                    </section>

                </main>

                <Footer />
            </>
        );
    }

    return (
        <>
            <Header />

            <main className="collections-page">

                {/* ==================================================
                    HERO
                   ================================================== */}

                <section className="collections-hero">

                    <div className="collections-hero__image">
                        <img
                            src="/images/collections/collections-hero2.jpg"
                            alt="Magic Touch Designs premium collection"
                        />
                    </div>

                    <div className="collections-hero__overlay"></div>

                    <div className="collections-hero__content">

                        <span className="collections-hero__eyebrow">
                           {t.hero.eyebrow}
                            <span className="collections-hero__crown">
                                ♕
                            </span>
                        </span>

                        <h1>
                            {t.hero.title}
                        <span>{t.hero.titleAccent}</span>
                            
                        </h1>

                        <div className="collections-hero__ornament">
                            <span></span>
                            <b>◆</b>
                            <span></span>
                        </div>

                        <p>
                            {t.hero.description}
                        </p>

                    </div>

                    <div className="collections-hero__bottom-curve">
                        <span></span>
                    </div>

                </section>


                {/* ==================================================
                    BROWSE OUR COLLECTIONS
                   ================================================== */}

                <section className="collections-section">

                    <div className="collections-heading">

                        <div className="collections-heading__ornament">
                            <span></span>

                            <div>
                                <b>♕</b>
                                <h2>{t.browse.title}</h2>
                            </div>

                            <span></span>
                        </div>

                    </div>


                    <div className="collections-grid">

                        {collections.map((collection) => (

                            <article
                                className="collection-card"
                                key={collection.id}
                            >

                                <div className="collection-card__visual">

                                    <img
                                        src={collection.image}
                                        alt={t.cards[collection.translationKey].title}
                                        
                                    />

                                    <div className="collection-card__fade"></div>

                                </div>

                                <div className="collection-card__body">

                                    <div className="collection-card__icon">
                                        {collection.icon}
                                    </div>

                                    <h3>
                                        {t.cards[collection.translationKey].title}
                                    </h3>

                                    <p>
                                        {t.cards[collection.translationKey].description}
                                        
                                    </p>

                                    <button
    type="button"
    className="collection-card__button"
    onClick={() => {
    if (collection.translationKey === "loveRomance") {
        navigate("/collections/love-romance");
    }

    if (collection.translationKey === "familyMemories") {
        navigate("/collections/family-memories");
    }

    if (collection.translationKey === "businessBranding") {
        navigate("/collections/business-branding");
    }

    if (collection.translationKey === "specialOccasions") {
        navigate("/collections/special-occasions");
    }
}}
>
    {t.browse.viewCollection}
</button>

                                </div>

                            </article>

                        ))}

                    </div>

                </section>


                {/* ==================================================
                    LOVE EDITION
                   ================================================== */}

                <section className="love-edition">

                    <div className="love-edition__visual">
                        <img
                            src="/images/collections/love-edition.jpg"
                            alt="Love Edition"
                        />
                    </div>

                    <div className="love-edition__overlay"></div>

                    <div className="love-edition__content">

                        <span className="love-edition__eyebrow">
                            {t.featured.eyebrow}
                        </span>

                        <div className="love-edition__ornament">
                            <span></span>
                            <b>◆</b>
                        </div>

                        <h2>
                            {t.featured.title}
                        </h2>

                        <p>
                            {t.featured.description}
                        </p>

                        <button
                            type="button"
                            className="love-edition__button"
                        >
                            {t.featured.button}
                        </button>

                    </div>

                </section>


                {/* ==================================================
                    PREMIUM BENEFITS
                   ================================================== */}

                <section className="collections-benefits">

                    {benefits.map((benefit, index) => (

                        <article
                            className="collection-benefit"
                            key={benefit.id}
                        >

                            <div className="collection-benefit__icon">
                                {benefit.icon}
                            </div>

                            <div className="collection-benefit__text">

                                <h3>
{t.benefits[benefit.translationKey as keyof typeof t.benefits].title}
</h3>

<p>
  {t.benefits[benefit.translationKey as keyof typeof t.benefits].description}
</p>

                            </div>

                            {index < benefits.length - 1 && (
                                <span
                                    className="collection-benefit__divider"
                                    aria-hidden="true"
                                />
                            )}

                        </article>

                    ))}

                </section>

            </main>

            <Footer />
        </>
    );
}

export default CollectionsPage;