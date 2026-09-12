import { useEffect, useState } from "react";
import { FolderKanban, Package, RefreshCw, Search, Users, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import { apiRequest } from "../../services/api";
import "./AdminCollectionsHub.css";

interface CurrentUser { username: string; }
interface CollectionProduct { product_id: string; is_active: boolean; }
interface CollectionSummary {
    slug: string;
    name: string;
    image: string;
    description: string;
    products: number;
    active: number;
    inactive: number;
    loading: boolean;
    error: boolean;
}

const collectionDefinitions = [
    { slug: "love-romance", name: "Love & Romance", image: "/images/collections/love-romance.jpg", description: "Personalized designs for love, romance and meaningful moments." },
    { slug: "family-memories", name: "Family & Memories", image: "/images/collections/family-memories.jpg", description: "Personalized gifts for the people and memories that matter most." },
    { slug: "business-branding", name: "Business & Branding", image: "/images/collections/business-branding.jpg", description: "Custom products created to showcase and grow your brand." },
    { slug: "special-occasions", name: "Special Occasions", image: "/images/collections/special-occasions.jpg", description: "Unique personalized designs for life's special celebrations." },
] as const;

function AdminCollectionsHub() {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [summaries, setSummaries] = useState<CollectionSummary[]>(() =>
        collectionDefinitions.map((collection) => ({ ...collection, products: 0, active: 0, inactive: 0, loading: true, error: false }))
    );

    const loadCollections = async (refresh = false) => {
        if (refresh) setIsRefreshing(true);
        setIsLoading(true);
        try {
            const results = await Promise.all(collectionDefinitions.map(async (collection) => {
                try {
                    const result = await apiRequest<{ status: string; products: CollectionProduct[] }>(
                        `/api/collections/admin/${collection.slug}/products`
                    );
                    const products = result.products || [];
                    return { ...collection, products: products.length, active: products.filter((product) => product.is_active).length, inactive: products.filter((product) => !product.is_active).length, loading: false, error: false };
                } catch {
                    return { ...collection, products: 0, active: 0, inactive: 0, loading: false, error: true };
                }
            }));
            setSummaries(results);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        apiRequest<{ status: string; user: CurrentUser }>("/api/user/me")
            .then((result) => setCurrentUser(result.user))
            .catch(() => undefined);
        loadCollections();
    }, []);

    const filteredCollections = summaries.filter((collection) =>
        `${collection.name} ${collection.description}`.toLowerCase().includes(search.toLowerCase().trim())
    );

    const totalProducts = summaries.reduce((sum, collection) => sum + collection.products, 0);
    const totalActive = summaries.reduce((sum, collection) => sum + collection.active, 0);
    const totalInactive = summaries.reduce((sum, collection) => sum + collection.inactive, 0);

    return (
        <div className="admin-layout">
            <AdminSidebar username={currentUser?.username || "Administrator"} />
            <main className="admin-collections-hub">
                <header className="collections-hub__hero">
                    <div>
                        <span className="collections-hub__eyebrow">ADMINISTRATION · STORE ORGANIZATION</span>
                        <h1>Collections</h1>
                        <p>Manage each customer-facing collection from its own dedicated workspace.</p>
                    </div>
                    <button type="button" className="collections-hub__refresh" onClick={() => loadCollections(true)} disabled={isRefreshing}>
                        <RefreshCw size={17} className={isRefreshing ? "is-spinning" : ""} />
                        {isRefreshing ? "Refreshing..." : "Refresh"}
                    </button>
                </header>

                <section className="collections-hub__stats" aria-label="Collection overview">
                    <article><span className="stat-icon stat-icon--gold"><FolderKanban size={19} /></span><div><strong>{collectionDefinitions.length}</strong><span>Collections</span></div></article>
                    <article><span className="stat-icon stat-icon--green"><Eye size={19} /></span><div><strong>{totalActive}</strong><span>Active products</span></div></article>
                    <article><span className="stat-icon stat-icon--red"><EyeOff size={19} /></span><div><strong>{totalInactive}</strong><span>Inactive products</span></div></article>
                    <article><span className="stat-icon stat-icon--purple"><Package size={19} /></span><div><strong>{totalProducts}</strong><span>Total products</span></div></article>
                </section>

                <section className="collections-hub__toolbar">
                    <div className="collections-hub__search">
                        <Search size={18} />
                        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search collections..." aria-label="Search collections" />
                    </div>
                    <div className="collections-hub__hint"><Users size={16} /> 4 dedicated collection workspaces</div>
                </section>

                <section className="collections-hub__grid">
                    {filteredCollections.map((collection) => (
                        <article className="collection-admin-card" key={collection.slug}>
                            <div className="collection-admin-card__image">
                                <img src={collection.image} alt={collection.name} />
                                <span className="collection-admin-card__order">{collectionDefinitions.findIndex((item) => item.slug === collection.slug) + 1}</span>
                            </div>
                            <div className="collection-admin-card__body">
                                <div className="collection-admin-card__heading">
                                    <div><span>COLLECTION</span><h2>{collection.name}</h2></div>
                                    <span className="collection-admin-card__status">Active</span>
                                </div>
                                <p>{collection.description}</p>
                                <div className="collection-admin-card__metrics">
                                    <span><Package size={15} /> {collection.loading ? "—" : collection.products} products</span>
                                    <span><Eye size={15} /> {collection.loading ? "—" : collection.active} active</span>
                                    {collection.inactive > 0 && <span className="is-inactive"><EyeOff size={15} /> {collection.inactive} inactive</span>}
                                </div>
                                {collection.error && <div className="collection-admin-card__error">Unable to load product data.</div>}
                                <button type="button" className="collection-admin-card__button" onClick={() => navigate(`/admin/collections/${collection.slug}`)}>
                                    Manage collection <span>→</span>
                                </button>
                            </div>
                        </article>
                    ))}
                </section>

                {!isLoading && filteredCollections.length === 0 && (
                    <div className="collections-hub__empty"><Search size={24} /><h2>No collections found</h2><p>Try a different search.</p></div>
                )}

                <footer className="collections-hub__footer">
                    <span>Magic Touch Designs · Collections Administration</span>
                    <span>Each workspace controls its own products, status and display order.</span>
                </footer>
            </main>
        </div>
    );
}

export default AdminCollectionsHub;
