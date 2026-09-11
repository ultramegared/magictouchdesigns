import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { ArrowLeft, ArrowDown, ArrowUp, CheckCircle2, Edit3, Eye, EyeOff, ImageOff, LoaderCircle, Package, Plus, RefreshCw, Save, Trash2, X, XCircle } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import { apiRequest } from "../../services/api";
import "./AdminCollectionDetail.css";

interface CurrentUser { username: string; }
interface Collection { slug: string; name: string; description?: string; image_url?: string; is_active?: boolean; sort_order?: number; }
interface Product { product_id: string; name: string; slug: string; description: string; price: number | string; image_url: string; is_active: boolean; features: string[]; collection_sort_order: number; }
interface ProductForm { name: string; slug: string; description: string; price: string; image_url: string; features: string; is_active: boolean; }

const definitions: Record<string, { name: string; image: string; description: string }> = {
    "love-romance": { name: "Love & Romance", image: "/images/collections/love-romance.jpg", description: "Personalized designs for love, romance and meaningful moments." },
    "family-memories": { name: "Family & Memories", image: "/images/collections/family-memories.jpg", description: "Personalized gifts for the people and memories that matter most." },
    "business-branding": { name: "Business & Branding", image: "/images/collections/business-branding.jpg", description: "Custom products created to showcase and grow your brand." },
    "special-occasions": { name: "Special Occasions", image: "/images/collections/special-occasions.jpg", description: "Unique personalized designs for life's special celebrations." },
};

const emptyForm: ProductForm = { name: "", slug: "", description: "", price: "", image_url: "", features: "", is_active: true };

function AdminCollectionDetail() {
    const { slug = "" } = useParams();
    const navigate = useNavigate();
    const definition = definitions[slug];
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const [collection, setCollection] = useState<Collection | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [editing, setEditing] = useState<Product | null>(null);
    const [form, setForm] = useState<ProductForm>(emptyForm);
    const [modalOpen, setModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const load = async (refresh = false) => {
        if (!slug || !definition) return;
        setRefreshing(refresh);
        setIsLoading(true);
        setError(null);
        try {
            const [collectionResult, productResult] = await Promise.all([
                apiRequest<{ status: string; collection: Collection }>(`/api/collections/admin/${slug}`),
                apiRequest<{ status: string; products: Product[] }>(`/api/collections/admin/${slug}/products`),
            ]);
            setCollection(collectionResult.collection);
            setProducts((productResult.products || []).slice().sort((a, b) => a.collection_sort_order - b.collection_sort_order));
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : "Unable to load this collection.");
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        apiRequest<{ status: string; user: CurrentUser }>("/api/user/me").then((result) => setCurrentUser(result.user)).catch(() => undefined);
    }, []);

    useEffect(() => { load(); }, [slug]);

    const visibleProducts = useMemo(() => products.filter((product) => `${product.name} ${product.slug} ${product.description}`.toLowerCase().includes(search.toLowerCase().trim())), [products, search]);
    const activeCount = products.filter((product) => product.is_active).length;
    const inactiveCount = products.length - activeCount;

    const openCreate = () => { setEditing(null); setForm(emptyForm); setError(null); setModalOpen(true); };
    const openEdit = (product: Product) => {
        setEditing(product);
        setForm({ name: product.name || "", slug: product.slug || "", description: product.description || "", price: String(product.price ?? ""), image_url: product.image_url || "", features: Array.isArray(product.features) ? product.features.join(", ") : "", is_active: product.is_active });
        setError(null);
        setModalOpen(true);
    };
    const closeModal = () => { if (saving || uploading) return; setModalOpen(false); setEditing(null); setForm(emptyForm); setError(null); };
    const updateForm = (field: keyof ProductForm, value: string | boolean) => setForm((previous) => ({ ...previous, [field]: value }));

    const uploadImage = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { setError("Only JPG, PNG and WEBP images are allowed."); return; }
        if (file.size > 5 * 1024 * 1024) { setError("Image size cannot exceed 5 MB."); return; }
        setUploading(true); setError(null);
        try {
            const data = new FormData(); data.append("image", file);
            const result = await apiRequest<{ image_url: string }>("/api/upload/product", { method: "POST", body: data });
            updateForm("image_url", result.image_url);
        } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to upload image."); }
        finally { setUploading(false); event.target.value = ""; }
    };

    const saveProduct = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const price = Number(form.price);
        if (!form.name.trim() || !form.slug.trim()) { setError("Product name and slug are required."); return; }
        if (!Number.isFinite(price) || price < 0) { setError("Please enter a valid product price."); return; }
        setSaving(true); setError(null);
        try {
            const payload = { name: form.name.trim(), slug: form.slug.trim(), description: form.description.trim(), price, image_url: form.image_url.trim(), features: form.features.split(",").map((item) => item.trim()).filter(Boolean), is_active: form.is_active };
            if (editing) {
                await apiRequest(`/api/collections/admin/${slug}/products/${editing.product_id}`, { method: "PUT", body: JSON.stringify(payload) });
            } else {
                await apiRequest(`/api/collections/admin/${slug}/products`, { method: "POST", body: JSON.stringify(payload) });
            }
            await load(); closeModal();
        } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to save product."); }
        finally { setSaving(false); }
    };

    const toggleStatus = async (product: Product) => {
        setBusyId(product.product_id); setError(null);
        try {
            await apiRequest(`/api/collections/admin/${slug}/products/${product.product_id}/status`, { method: "PUT", body: JSON.stringify({ is_active: !product.is_active }) });
            setProducts((previous) => previous.map((item) => item.product_id === product.product_id ? { ...item, is_active: !item.is_active } : item));
        } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to update product status."); }
        finally { setBusyId(null); }
    };

    const removeProduct = async (product: Product) => {
        if (!window.confirm(`Remove "${product.name}" from this collection?`)) return;
        setBusyId(product.product_id); setError(null);
        try {
            await apiRequest(`/api/collections/admin/${slug}/products/${product.product_id}`, { method: "DELETE" });
            await load();
        } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to remove product."); }
        finally { setBusyId(null); }
    };

    const moveProduct = async (index: number, direction: "up" | "down") => {
        const target = direction === "up" ? index - 1 : index + 1;
        if (target < 0 || target >= products.length) return;
        const current = products[index]; const other = products[target];
        setBusyId(current.product_id); setError(null);
        try {
            await apiRequest(`/api/collections/admin/${slug}/products/${current.product_id}/order`, { method: "PUT", body: JSON.stringify({ sort_order: other.collection_sort_order }) });
            await apiRequest(`/api/collections/admin/${slug}/products/${other.product_id}/order`, { method: "PUT", body: JSON.stringify({ sort_order: current.collection_sort_order }) });
            await load();
        } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to change product order."); }
        finally { setBusyId(null); }
    };

    if (!definition) return <div className="admin-layout"><AdminSidebar username={currentUser?.username || "Administrator"} /><main className="admin-collection-detail"><div className="collection-detail__not-found"><h1>Collection not found</h1><button onClick={() => navigate("/admin/collections")}>Back to Collections</button></div></main></div>;

    return (
        <div className="admin-layout">
            <AdminSidebar username={currentUser?.username || "Administrator"} />
            <main className="admin-collection-detail">
                <div className="collection-detail__topbar">
                    <button type="button" className="collection-detail__back" onClick={() => navigate("/admin/collections")}><ArrowLeft size={17} /> Collections</button>
                    <button type="button" className="collection-detail__refresh" onClick={() => load(true)} disabled={refreshing}><RefreshCw size={16} className={refreshing ? "is-spinning" : ""} /> {refreshing ? "Refreshing..." : "Refresh"}</button>
                </div>

                <section className="collection-detail__hero">
                    <div className="collection-detail__hero-image"><img src={collection?.image_url || definition.image} alt={collection?.name || definition.name} /></div>
                    <div className="collection-detail__hero-content">
                        <span>COLLECTION WORKSPACE</span>
                        <h1>{collection?.name || definition.name}</h1>
                        <p>{collection?.description || definition.description}</p>
                        <div className="collection-detail__hero-meta"><span className="is-active"><CheckCircle2 size={14} /> {collection?.is_active === false ? "Hidden" : "Active"}</span><span><Package size={14} /> {products.length} products</span><span><Eye size={14} /> {activeCount} visible</span></div>
                    </div>
                    <button type="button" className="collection-detail__add" onClick={openCreate}><Plus size={18} /> Add Product</button>
                </section>

                <section className="collection-detail__stats">
                    <article><Package size={18} /><div><strong>{products.length}</strong><span>Total products</span></div></article>
                    <article><Eye size={18} /><div><strong>{activeCount}</strong><span>Active</span></div></article>
                    <article><EyeOff size={18} /><div><strong>{inactiveCount}</strong><span>Inactive</span></div></article>
                    <article><Package size={18} /><div><strong>{collection?.sort_order ?? "—"}</strong><span>Collection order</span></div></article>
                </section>

                <section className="collection-detail__workspace">
                    <div className="collection-detail__toolbar">
                        <div><span>PRODUCTS IN COLLECTION</span><h2>Manage products</h2></div>
                        <label className="collection-detail__search"><SearchIcon /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products..." /></label>
                    </div>

                    {error && !modalOpen && <div className="collection-detail__error">{error}</div>}
                    {isLoading ? <div className="collection-detail__loading"><LoaderCircle className="is-spinning" size={28} /><span>Loading collection...</span></div> : visibleProducts.length === 0 ? <div className="collection-detail__empty"><Package size={34} /><h3>{search ? "No products match your search" : "This collection is empty"}</h3><p>{search ? "Try another search term." : "Add the first product to start building this collection."}</p>{!search && <button type="button" onClick={openCreate}><Plus size={17} /> Add Product</button>}</div> : <div className="collection-detail__grid">{visibleProducts.map((product) => {
                        const actualIndex = products.findIndex((item) => item.product_id === product.product_id);
                        return <article className="collection-product-card" key={product.product_id}>
                            <div className="collection-product-card__image">{product.image_url ? <img src={product.image_url} alt={product.name} /> : <div><ImageOff size={28} /></div>}<span>#{product.collection_sort_order}</span><b className={product.is_active ? "active" : "inactive"}>{product.is_active ? "Active" : "Inactive"}</b></div>
                            <div className="collection-product-card__body"><div className="collection-product-card__title"><h3>{product.name}</h3><strong>${Number(product.price).toFixed(2)}</strong></div><p>{product.description || "No description available."}</p><div className="collection-product-card__actions"><button type="button" onClick={() => openEdit(product)} disabled={busyId !== null}><Edit3 size={15} /> Edit</button><button type="button" className={product.is_active ? "deactivate" : "activate"} onClick={() => toggleStatus(product)} disabled={busyId !== null}>{busyId === product.product_id ? <LoaderCircle size={15} className="is-spinning" /> : product.is_active ? <XCircle size={15} /> : <CheckCircle2 size={15} />}{product.is_active ? "Hide" : "Activate"}</button><button type="button" className="delete" onClick={() => removeProduct(product)} disabled={busyId !== null}><Trash2 size={15} /> Remove</button></div><div className="collection-product-card__order"><button onClick={() => moveProduct(actualIndex, "up")} disabled={actualIndex === 0 || busyId !== null} aria-label="Move product up"><ArrowUp size={15} /></button><span>Display order {product.collection_sort_order}</span><button onClick={() => moveProduct(actualIndex, "down")} disabled={actualIndex === products.length - 1 || busyId !== null} aria-label="Move product down"><ArrowDown size={15} /></button></div></div>
                        </article>;
                    })}</div>}
                </section>
            </main>

            {modalOpen && <div className="collection-detail__modal-backdrop" onClick={closeModal}><div className="collection-detail__modal" onClick={(event) => event.stopPropagation()}>
                <header><div><span>{editing ? "EDIT PRODUCT" : "NEW PRODUCT"}</span><h2>{editing ? editing.name : `Add product to ${definition.name}`}</h2></div><button type="button" onClick={closeModal} disabled={saving || uploading}><X size={20} /></button></header>
                {error && <div className="collection-detail__error">{error}</div>}
                <form onSubmit={saveProduct}><div className="collection-detail__form-grid">
                    <label><span>Product name</span><input value={form.name} onChange={(event) => updateForm("name", event.target.value)} required /></label>
                    <label><span>Product slug</span><input value={form.slug} onChange={(event) => updateForm("slug", event.target.value)} required /></label>
                    <label className="full"><span>Description</span><textarea rows={4} value={form.description} onChange={(event) => updateForm("description", event.target.value)} /></label>
                    <label><span>Price</span><input type="number" min="0" step="0.01" value={form.price} onChange={(event) => updateForm("price", event.target.value)} required /></label>
                    <label><span>Status</span><select value={form.is_active ? "active" : "inactive"} onChange={(event) => updateForm("is_active", event.target.value === "active")}><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
                    <label><span>Upload image</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadImage} disabled={uploading || saving} /></label>
                    <label><span>Image URL</span><input value={form.image_url} onChange={(event) => updateForm("image_url", event.target.value)} placeholder="Image URL" /></label>
                    <label className="full"><span>Features</span><input value={form.features} onChange={(event) => updateForm("features", event.target.value)} placeholder="Feature one, Feature two, Feature three" /></label>
                    {form.image_url && <div className="collection-detail__preview full"><span>Image preview</span><img src={form.image_url} alt="Product preview" /></div>}
                </div><footer><button type="button" onClick={closeModal} disabled={saving || uploading}>Cancel</button><button type="submit" className="primary" disabled={saving || uploading}>{saving ? <LoaderCircle size={17} className="is-spinning" /> : editing ? <Save size={17} /> : <Plus size={17} />}{saving ? "Saving..." : editing ? "Save changes" : "Create product"}</button></footer></form>
            </div></div>}
        </div>
    );
}

function FolderIcon() { return <Package size={18} />; }
function SearchIcon() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>; }

export default AdminCollectionDetail;
