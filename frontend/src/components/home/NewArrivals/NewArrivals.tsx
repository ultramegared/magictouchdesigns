/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: NewArrivals.tsx
 * Module: Home
 * Language: TypeScript React
 * Description:
 * New Arrivals Section.
 * Displays the newest active products on the Home page,
 * automatically ordered by creation date (newest first).
 * Each card shows the product's cover image (its main photo).
 * Section copy is intentionally English-only, per the store
 * owner's standing rule for customer-facing content.
 * ================================================================
 */

import {
    useEffect,
    useState,
} from "react";

import {
    Link,
} from "react-router-dom";

import "./NewArrivals.css";

import {
    apiRequest,
} from "../../../services/api";


/* ================================================================
   TYPES
================================================================ */

interface PublicProduct {

    product_id: string;

    name: string;

    slug?: string;

    image_url?: string;

    image_urls?: string[];

    is_active?: boolean;

    created_at?: string;

}


interface PublicProductsResponse {

    products: PublicProduct[];

}


/* ================================================================
   CONSTANTS
================================================================ */

const MAX_PRODUCTS = 8;

const NEW_BADGE_DAYS = 30;


/* ================================================================
   HELPERS
================================================================ */

const getCoverImage = (
    product: PublicProduct
): string => {

    if (product.image_url) return product.image_url;

    if (product.image_urls && product.image_urls.length > 0) {
        return product.image_urls[0];
    }

    return "";

};


const getCreatedTime = (
    product: PublicProduct
): number => {

    if (!product.created_at) return 0;

    const time = Date.parse(product.created_at);

    return Number.isNaN(time) ? 0 : time;

};


const isNewProduct = (
    product: PublicProduct
): boolean => {

    const createdTime = getCreatedTime(product);

    if (createdTime === 0) return false;

    const ageMs = Date.now() - createdTime;

    return ageMs >= 0 && ageMs <= NEW_BADGE_DAYS * 24 * 60 * 60 * 1000;

};


/* ================================================================
   COMPONENT
================================================================ */

function NewArrivals() {

    const [products, setProducts] = useState<PublicProduct[]>([]);

    const [hasLoaded, setHasLoaded] = useState(false);


    useEffect(() => {

        let cancelled = false;

        const loadProducts = async () => {

            try {

                const result =
                    await apiRequest<PublicProductsResponse>(
                        "/api/products/public"
                    );

                const activeProducts = (result.products || [])
                    .filter((product) => product.is_active !== false)
                    .filter((product) => getCoverImage(product) !== "")
                    .sort((a, b) => getCreatedTime(b) - getCreatedTime(a))
                    .slice(0, MAX_PRODUCTS);

                if (!cancelled) {
                    setProducts(activeProducts);
                }

            } catch (error) {

                console.error(
                    "Unable to load new arrivals:",
                    error
                );

            } finally {

                if (!cancelled) {
                    setHasLoaded(true);
                }

            }

        };

        void loadProducts();

        return () => {
            cancelled = true;
        };

    }, []);


    if (!hasLoaded || products.length === 0) {
        return null;
    }


    return (

        <section className="new-arrivals">

            <div className="new-arrivals__header">

                <h2 className="new-arrivals__title">
                    New Arrivals
                </h2>

            </div>

            <div className="new-arrivals__grid">

                {products.map((product) => (

                    <Link
                        key={product.product_id}
                        to={
                            product.slug
                                ? `/products?product=${product.slug}`
                                : "/products"
                        }
                        className="new-arrivals__card"
                    >

                        <div className="new-arrivals__image">

                            {isNewProduct(product) && (
                                <span className="new-arrivals__badge">
                                    New
                                </span>
                            )}

                            <img
                                src={getCoverImage(product)}
                                alt={product.name}
                                loading="lazy"
                            />

                        </div>

                        <p className="new-arrivals__name">
                            {product.name}
                        </p>

                    </Link>

                ))}

            </div>

            <div className="new-arrivals__footer">

                <Link
                    to="/products"
                    className="new-arrivals__view-all"
                >
                    View all
                </Link>

            </div>

        </section>

    );

}


export default NewArrivals;
