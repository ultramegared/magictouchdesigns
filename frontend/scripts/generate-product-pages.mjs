/**
 * Post-build generator: paginas estaticas por producto + sitemap con productos.
 *
 * Corre despues de `vite build` (ver "build" en package.json). Para cada
 * producto activo del catalogo genera dist/products/<slug>/index.html usando
 * dist/index.html como plantilla: titulo, descripcion, canonical y Open Graph
 * propios del producto, JSON-LD de tipo Product y un bloque de contenido
 * estatico dentro de #root (la app React lo reemplaza al montar). Asi los
 * robots (Google, OAI-SearchBot de ChatGPT) leen la ficha completa del
 * producto sin ejecutar JavaScript.
 *
 * Tambien reescribe dist/sitemap.xml con las URLs base + /products/<slug>.
 *
 * Fuente de datos: la API publica de colecciones. Si la API no responde,
 * usa scripts/products-snapshot.json (que este mismo script refresca cuando
 * la API responde). Si no hay datos de ninguna fuente, avisa y sale con 0:
 * NUNCA rompe el build.
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SITE_URL = "https://www.jqydesigns.com";
const API_BASE = process.env.PRODUCTS_API_BASE || "https://api.jqydesigns.com";
const COLLECTION_SLUGS = ["love-romance", "family-memories", "business-branding", "special-occasions"];

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.resolve(scriptDir, "..");
const distDir = path.join(frontendDir, "dist");
const snapshotPath = path.join(scriptDir, "products-snapshot.json");

const BASE_PATHS = [
    "/",
    "/collections",
    "/collections/love-romance",
    "/collections/family-memories",
    "/collections/business-branding",
    "/collections/special-occasions",
    "/reviews",
    "/customize",
    "/how-it-works",
    "/about",
    "/contact",
    "/shipping-returns",
    "/faqs",
    "/privacy",
    "/terms-of-service",
];

const escapeHtml = (value) =>
    String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
const escapeAttr = (value) => escapeHtml(value).replace(/"/g, "&quot;");
const escapeXml = escapeHtml;

async function fetchCatalog() {
    const bySlug = new Map();
    for (const collection of COLLECTION_SLUGS) {
        const response = await fetch(`${API_BASE}/api/collections/${collection}/products`, {
            headers: { Accept: "application/json" },
        });
        if (!response.ok) throw new Error(`API ${collection}: HTTP ${response.status}`);
        const data = await response.json();
        for (const product of data.products || []) {
            if (!product || !product.slug || product.is_active === false) continue;
            if (!bySlug.has(product.slug)) {
                bySlug.set(product.slug, {
                    product_id: product.product_id,
                    name: product.name,
                    slug: product.slug,
                    description: product.description ?? null,
                    price: product.price,
                    image_url: product.image_url ?? null,
                    image_urls: Array.isArray(product.image_urls) ? product.image_urls : [],
                    collection,
                });
            }
        }
    }
    return [...bySlug.values()];
}

async function loadCatalog() {
    try {
        const catalog = await fetchCatalog();
        if (catalog.length) {
            await writeFile(snapshotPath, JSON.stringify(catalog, null, 2) + "\n", "utf8");
            console.log(`[product-pages] Catalogo desde la API: ${catalog.length} productos (snapshot actualizado).`);
            return catalog;
        }
        console.warn("[product-pages] La API devolvio 0 productos; se intenta el snapshot.");
    } catch (error) {
        console.warn(`[product-pages] API no disponible (${error.message}); se intenta el snapshot.`);
    }
    if (existsSync(snapshotPath)) {
        const catalog = JSON.parse(await readFile(snapshotPath, "utf8"));
        console.log(`[product-pages] Catalogo desde el snapshot: ${catalog.length} productos.`);
        return catalog;
    }
    return [];
}

function productJsonLd(product, url) {
    const images = (product.image_urls?.length ? product.image_urls : [product.image_url]).filter(Boolean);
    return {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        ...(images.length ? { image: images } : {}),
        description: product.description || "",
        sku: String(product.product_id ?? product.slug),
        brand: { "@type": "Brand", name: "JQYDesigns" },
        offers: {
            "@type": "Offer",
            url,
            priceCurrency: "USD",
            price: Number(product.price).toFixed(2),
            availability: "https://schema.org/InStock",
            itemCondition: "https://schema.org/NewCondition",
        },
    };
}

function buildShell(template, product) {
    const url = `${SITE_URL}/products/${product.slug}`;
    const title = `${product.name} | JQYDesigns`;
    const rawDescription = String(product.description || "").replace(/\s+/g, " ").trim();
    const description = (rawDescription || `${product.name} — personalized gift by JQYDesigns, made to order in Katy, TX.`).slice(0, 300);
    const image = product.image_url || product.image_urls?.[0] || "";
    const price = Number(product.price).toFixed(2);
    const jsonLd = JSON.stringify(productJsonLd(product, url)).replace(/</g, "\\u003c");

    let html = template;
    html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)}</title>`);
    html = html.replace(
        /<meta name="description" content="[^"]*" \/>/,
        `<meta name="description" content="${escapeAttr(description)}" />`,
    );
    html = html.replace(
        '<link rel="canonical" href="https://www.jqydesigns.com/" />',
        `<link rel="canonical" href="${url}" />`,
    );
    html = html.replace('<meta property="og:type" content="website" />', '<meta property="og:type" content="product" />');
    html = html.replace(
        /<meta property="og:title" content="[^"]*" \/>/,
        `<meta property="og:title" content="${escapeAttr(title)}" />`,
    );
    html = html.replace(
        /<meta property="og:description" content="[^"]*" \/>/,
        `<meta property="og:description" content="${escapeAttr(description)}" />`,
    );
    html = html.replace(
        /<meta property="og:url" content="[^"]*" \/>/,
        `<meta property="og:url" content="${url}" />`,
    );
    if (image) {
        html = html.replace(
            /<meta property="og:image" content="[^"]*" \/>/,
            `<meta property="og:image" content="${escapeAttr(image)}" />`,
        );
        html = html.replace(
            /<meta name="twitter:image" content="[^"]*" \/>/,
            `<meta name="twitter:image" content="${escapeAttr(image)}" />`,
        );
    }
    html = html.replace(
        /<meta name="twitter:title" content="[^"]*" \/>/,
        `<meta name="twitter:title" content="${escapeAttr(title)}" />`,
    );
    html = html.replace(
        /<meta name="twitter:description" content="[^"]*" \/>/,
        `<meta name="twitter:description" content="${escapeAttr(description)}" />`,
    );
    html = html.replace(
        "</head>",
        `    <script type="application/ld+json">\n${jsonLd}\n    </script>\n  </head>`,
    );

    const fallback = [
        `<main>`,
        `<h1>${escapeHtml(product.name)}</h1>`,
        image ? `<img src="${escapeAttr(image)}" alt="${escapeAttr(product.name)}" />` : "",
        rawDescription ? `<p>${escapeHtml(rawDescription)}</p>` : "",
        `<p><strong>$${price}</strong> USD — In stock. Personalized and made to order by JQYDesigns in Katy, TX.</p>`,
        `<p><a href="${SITE_URL}/collections/${product.collection}">View this product in its collection</a></p>`,
        `</main>`,
    ].join("\n        ");
    html = html.replace('<div id="root"></div>', `<div id="root">\n        ${fallback}\n      </div>`);
    return html;
}

function buildSitemap(products) {
    const urls = [
        ...BASE_PATHS.map((p) => `${SITE_URL}${p}`),
        ...products.map((p) => `${SITE_URL}/products/${p.slug}`),
    ];
    const body = urls.map((loc) => `  <url><loc>${escapeXml(loc)}</loc></url>`).join("\n");
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

async function main() {
    const catalog = await loadCatalog();
    if (!catalog.length) {
        console.warn("[product-pages] Sin datos de catalogo: no se generaron paginas de producto ni sitemap nuevo.");
        return;
    }
    const templatePath = path.join(distDir, "index.html");
    if (!existsSync(templatePath)) {
        console.warn("[product-pages] No existe dist/index.html (¿corrio vite build?); no se genero nada.");
        return;
    }
    const template = await readFile(templatePath, "utf8");
    for (const product of catalog) {
        const dir = path.join(distDir, "products", product.slug);
        await mkdir(dir, { recursive: true });
        await writeFile(path.join(dir, "index.html"), buildShell(template, product), "utf8");
    }
    await writeFile(path.join(distDir, "sitemap.xml"), buildSitemap(catalog), "utf8");
    console.log(`[product-pages] Generadas ${catalog.length} paginas de producto y sitemap con ${BASE_PATHS.length + catalog.length} URLs.`);
}

main().catch((error) => {
    console.warn(`[product-pages] Error no fatal: ${error.message}`);
});
