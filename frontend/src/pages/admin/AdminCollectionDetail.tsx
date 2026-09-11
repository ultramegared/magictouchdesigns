import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import {
    ArrowDown,
    ArrowLeft,
    ArrowUp,
    CheckCircle2,
    Edit3,
    Eye,
    EyeOff,
    ImageOff,
    LoaderCircle,
    Package,
    Plus,
    RefreshCw,
    Save,
    Search,
    Trash2,
    X,
    XCircle,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import { apiRequest } from "../../services/api";
import "./AdminCollectionDetail.css";

interface CurrentUser { username: string; }
interface Collection { slug: string; name: string; description?: string; image_url?: string; is_active?: boolean; sort_order?: number; }
interface FeatureOption { id: string; label: string; }
interface ProductFeature { id: string; name: string; options: FeatureOption[]; }
interface Product {
    product_id: string;
    name: string;
    slug: string;
    description: string;
    price: number | string;
    image_url: string;
    is_active: boolean;
    features: unknown[] | Record<string, unknown>;
    collection_sort_order: number;
}
interface ProductForm {
    name: string;
    slug: string;
    description: string;
    price: string;
    image_url: string;
    features: ProductFeature[];
    is_active: boolean;
}

const definitions: Record<string, { name: string; image: string; description: string }> = {
    "love-romance": { name: "Love & Romance", image: "/images/collections/love-romance.jpg", description: "Personalized designs for love, romance and meaningful moments." },
    "family-memories": { name: "Family & Memories", image: "/images/collections/family-memories.jpg", description: "Personalized gifts for the people and memories that matter most." },
    "business-branding": { name: "Business & Branding", image: "/images/collections/business-branding.jpg", description: "Custom products created to showcase and grow your brand." },
    "special-occasions": { name: "Special Occasions", image: "/images/collections/special-occasions.jpg", description: "Unique personalized designs for life's special celebrations." },
};

const emptyForm: ProductForm = { name: "", slug: "", description: "", price: "", image_url: "", features: [], is_active: true };

function createFeature(): ProductFeature {
    return { id: crypto.randomUUID(), name: "", options: [{ id: crypto.randomUUID(), label: "" }] };
}

function normalizeFeatures(value: Product["features"]): ProductFeature[] {
    if (Array.isArray(value)) {
        return value.map((item) => {
            if (item && typeof item === "object" && "name" in item) {
                const raw = item as { id?: string; name?: string; options?: unknown };
                const options = Array.isArray(raw.options)
                    ? raw.options.map((option) => {
                        if (option && typeof option === "object" && "label" in option) {
                            const rawOption = option as { id?: string; label?: string };
                            return { id: rawOption.id || crypto.randomUUID(), label: String(rawOption.label || "") };
                        }
                        return { id: crypto.randomUUID(), label: String(option ?? "") };
                    })
                    : [];
                return { id: raw.id || crypto.randomUUID(), name: String(raw.name || ""), options: options.length ? options : [{ id: crypto.randomUUID(), label: "" }] };
            }
            return { id: crypto.randomUUID(), name: "Option", options: [{ id: crypto.randomUUID(), label: String(item ?? "") }] };
        });
    }
    return Object.entries(value || {}).map(([name, rawOptions]) => ({
        id: crypto.randomUUID(),
        name,
        options: (Array.isArray(rawOptions) ? rawOptions : [rawOptions]).map((option) => ({ id: crypto.randomUUID(), label: String(option ?? "") })),
    }));
}

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
    const [busyProduct, setBusyProduct] = useState<string | null>(null);

    const load = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [collectionResponse, productsResponse, userResponse] = await Promise.all([
                apiRequest<{ collection: Collection }>(`/api/collections/admin/${slug}`),
                apiRequest<{ products: Product[] }>(`/api/collections/admin/${slug}/products`),
                apiRequest<CurrentUser>("/api/user/me"),
            ]);
            setCollection(collectionResponse.collection);
            setProducts(productsResponse.products || []);
            setCurrentUser(userResponse);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to load collection.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { void load(); }, [slug]);

    const filteredProducts = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return products;
        return products.filter((product) => `${product.name} ${product.slug} ${product.description}`.toLowerCase().includes(term));
    }, [products, search]);

    const activeCount = products.filter((product) => product.is_active).length;
    const inactiveCount = products.length - activeCount;
    const isSearching = search.trim().length > 0;

    const openCreate = () => {
        setEditing(null);
        setForm({ ...emptyForm, features: [] });
        setModalOpen(true);
    };

    const openEdit = (product: Product) => {
        setEditing(product);
        setForm({
            name: product.name,
            slug: product.slug,
            description: product.description || "",
            price: String(product.price),
            image_url: product.image_url || "",
            features: normalizeFeatures(product.features),
            is_active: product.is_active,
        });
        setModalOpen(true);
    };

    const closeModal = () => {
        if (!saving && !uploading) setModalOpen(false);
    };

    const updateFeature = (featureId: string, patch: Partial<ProductFeature>) => {
        setForm((current) => ({ ...current, features: current.features.map((feature) => feature.id === featureId ? { ...feature, ...patch } : feature) }));
    };

    const updateOption = (featureId: string, optionId: string, label: string) => {
        setForm((current) => ({
            ...current,
            features: current.features.map((feature) => feature.id === featureId
                ? { ...feature, options: feature.options.map((option) => option.id === optionId ? { ...option, label } : option) }
                : feature),
        }));
    };

    const addFeature = () => setForm((current) => ({ ...current, features: [...current.features, createFeature()] }));
    const removeFeature = (featureId: string) => setForm((current) => ({ ...current, features: current.features.filter((feature) => feature.id !== featureId) }));
    const addOption = (featureId: string) => setForm((current) => ({ ...current, features: current.features.map((feature) => feature.id === featureId ? { ...feature, options: [...feature.options, { id: crypto.randomUUID(), label: "" }] } : feature) }));
    const removeOption = (featureId: string, optionId: string) => setForm((current) => ({ ...current, features: current.features.map((feature) => feature.id === featureId ? { ...feature, options: feature.options.filter((option) => option.id !== optionId) } : feature) }));

    const uploadImage = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const body = new FormData();
            body.append("image", file);
            const response = await apiRequest<{ image_url?: string }>("/api/upload/product", { method: "POST", body });
            setForm((current) => ({ ...current, image_url: response.image_url || "" }));
        } catch (err) {
            window.alert(err instanceof Error ? err.message : "Unable to upload image.");
        } finally {
            setUploading(false);
            event.target.value = "";
        }
    };

    const saveProduct = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (form.features.some((feature) => !feature.name.trim() || feature.options.some((option) => !option.label.trim()))) {
            window.alert("Complete every option name and value before saving.");
            return;
        }
        setSaving(true);
        try {
            const payload = {
                ...form,
                price: Number(form.price),
                features: form.features.map((feature) => ({ ...feature, name: feature.name.trim(), options: feature.options.map((option) => ({ ...option, label: option.label.trim() })) })),
            };
            const path = editing ? `/api/collections/admin/${slug}/products/${editing.product_id}` : `/api/collections/admin/${slug}/products`;
            const response = await apiRequest<{ product: Product }>(path, { method: editing ? "PUT" : "POST", body: JSON.stringify(payload) });
            setProducts((current) => editing ? current.map((item) => item.product_id === editing.product_id ? response.product : item) : [...current, response.product]);
            setModalOpen(false);
        } catch (err) {
            window.alert(err instanceof Error ? err.message : "Unable to save product.");
        } finally {
            setSaving(false);
        }
    };

    const toggleStatus = async (product: Product) => {
        setBusyProduct(product.product_id);
        try {
            const response = await apiRequest<{ product: Product }>(`/api/collections/admin/${slug}/products/${product.product_id}/status`, { method: "PUT", body: JSON.stringify({ is_active: !product.is_active }) });
            setProducts((current) => current.map((item) => item.product_id === product.product_id ? response.product : item));
        } catch (err) {
            window.alert(err instanceof Error ? err.message : "Unable to update status.");
        } finally {
            setBusyProduct(null);
        }
    };

    const removeProduct = async (product: Product) => {
        if (!window.confirm(`Remove ${product.name} from this collection?`)) return;
        setBusyProduct(product.product_id);
        try {
            await apiRequest(`/api/collections/admin/${slug}/products/${product.product_id}`, { method: "DELETE" });
            setProducts((current) => current.filter((item) => item.product_id !== product.product_id));
        } catch (err) {
            window.alert(err instanceof Error ? err.message : "Unable to remove product.");
        } finally {
            setBusyProduct(null);
        }
    };

    const moveProduct = async (product: Product, direction: "up" | "down") => {
        if (isSearching) return;
        const index = products.findIndex((item) => item.product_id === product.product_id);
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (index < 0 || targetIndex < 0 || targetIndex >= products.length) return;
        const target = products[targetIndex];
        setBusyProduct(product.product_id);
        try {
            await apiRequest(`/api/collections/admin/${slug}/products/${product.product_id}/order`, { method: "PUT", body: JSON.stringify({ sort_order: target.collection_sort_order }) });
            await apiRequest(`/api/collections/admin/${slug}/products/${target.product_id}/order`, { method: "PUT", body: JSON.stringify({ sort_order: product.collection_sort_order }) });
            setProducts((current) => {
                const next = [...current];
                [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
                return next.map((item, position) => ({ ...item, collection_sort_order: position }));
            });
        } catch (err) {
            window.alert(err instanceof Error ? err.message : "Unable to reorder products.");
        } finally {
            setBusyProduct(null);
        }
    };

    if (!definition) {
        return <div className="admin-layout"><AdminSidebar username={currentUser?.username} /><main className="admin-collection-detail"><div className="collection-detail__empty"><XCircle size={42} /><h1>Collection not found</h1><button onClick={() => navigate("/admin/collections")}>Back to Collections</button></div></main></div>;
    }

    return (
        <div className="admin-layout">
            <AdminSidebar username={currentUser?.username} />
            <main className="admin-collection-detail">
                <header className="collection-detail__header">
                    <div className="collection-detail__heading">
                        <button className="collection-detail__back" onClick={() => navigate("/admin/collections")} aria-label="Back to collections"><ArrowLeft size={18} /></button>
                        <div><span className="collection-detail__eyebrow">Collection Management</span><h1>{collection?.name || definition.name}</h1><p>{collection?.description || definition.description}</p></div>
                    </div>
                    <div className="collection-detail__actions"><button className="secondary" onClick={() => void load()} disabled={isLoading}><RefreshCw size={17} className={isLoading ? "is-spinning" : ""} />Refresh</button><button className="primary" onClick={openCreate}><Plus size={17} />Add Product</button></div>
                </header>

                <section className="collection-detail__stats">
                    <article><Package /><div><strong>{products.length}</strong><span>Total products</span></div></article>
                    <article><CheckCircle2 /><div><strong>{activeCount}</strong><span>Active</span></div></article>
                    <article><EyeOff /><div><strong>{inactiveCount}</strong><span>Inactive</span></div></article>
                </section>

                <section className="collection-detail__toolbar"><div className="collection-detail__search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products..." /></div><span>{filteredProducts.length} shown</span></section>

                {error && <div className="collection-detail__error"><XCircle size={19} /><div><strong>Unable to load this collection</strong><span>{error}</span></div><button onClick={() => void load()}>Retry</button></div>}
                {isLoading ? <div className="collection-detail__loading"><LoaderCircle className="is-spinning" />Loading collection...</div> : filteredProducts.length === 0 ? <div className="collection-detail__empty"><ImageOff size={42} /><h2>{search ? "No products found" : "No products in this collection"}</h2><p>{search ? "Try a different search." : "Add the first product to this collection."}</p>{!search && <button className="primary" onClick={openCreate}><Plus size={17} />Add Product</button>}</div> : (
                    <section className="collection-detail__products">
                        {filteredProducts.map((product, index) => {
                            const features = normalizeFeatures(product.features);
                            return <article className="collection-product" key={product.product_id}>
                                <div className="collection-product__image">{product.image_url ? <img src={product.image_url} alt={product.name} /> : <ImageOff size={28} />}</div>
                                <div className="collection-product__info"><div className="collection-product__top"><span className={product.is_active ? "status active" : "status inactive"}>{product.is_active ? "Active" : "Inactive"}</span><span className="product-order">#{index + 1}</span></div><h2>{product.name}</h2><p>{product.description || "No description provided."}</p><strong>${Number(product.price).toFixed(2)}</strong>{features.length > 0 && <div className="product-features">{features.map((feature) => <span key={feature.id}>{feature.name}: {feature.options.map((option) => option.label).join(" / ")}</span>)}</div>}</div>
                                <div className="collection-product__actions"><button title={isSearching ? "Clear search to reorder" : "Move up"} onClick={() => void moveProduct(product, "up")} disabled={isSearching || index === 0 || !!busyProduct}><ArrowUp size={17} /></button><button title={isSearching ? "Clear search to reorder" : "Move down"} onClick={() => void moveProduct(product, "down")} disabled={isSearching || index === filteredProducts.length - 1 || !!busyProduct}><ArrowDown size={17} /></button><button title={product.is_active ? "Deactivate" : "Activate"} onClick={() => void toggleStatus(product)} disabled={busyProduct === product.product_id}>{product.is_active ? <EyeOff size={17} /> : <Eye size={17} />}</button><button title="Edit" onClick={() => openEdit(product)} disabled={!!busyProduct}><Edit3 size={17} /></button><button title="Remove" className="danger" onClick={() => void removeProduct(product)} disabled={busyProduct === product.product_id}>{busyProduct === product.product_id ? <LoaderCircle size={17} className="is-spinning" /> : <Trash2 size={17} />}</button></div>
                            </article>;
                        })}
                    </section>
                )}

                <footer className="collection-detail__footer"><span>Signed in as <strong>{currentUser?.username || "Admin"}</strong></span><button onClick={() => navigate("/admin/collections")}><ArrowLeft size={16} />Back to Collections</button></footer>

                {modalOpen && <div className="collection-detail__modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeModal(); }}><div className="collection-detail__modal"><header><div><span>{editing ? "Edit product" : "New product"}</span><h2>{editing ? "Update collection product" : "Add product to collection"}</h2><p>Build the product now with flexible options. You can add more option groups later without changing the product layout.</p></div><button onClick={closeModal} disabled={saving || uploading} aria-label="Close"><X size={20} /></button></header><form onSubmit={saveProduct}><div className="collection-detail__form-grid">
                    <label><span>Product name</span><input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required /></label>
                    <label><span>Product slug</span><input value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))} required /></label>
                    <label className="full"><span>Description</span><textarea rows={4} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} /></label>
                    <label><span>Price</span><input type="number" min="0" step="0.01" value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))} required /></label>
                    <label><span>Status</span><select value={form.is_active ? "active" : "inactive"} onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.value === "active" }))}><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
                    <label className="full"><span>Product image</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadImage} disabled={uploading || saving} /><small>{uploading ? "Uploading image..." : "Choose an image from your phone or computer. No file path is required."}</small></label>
                    {form.image_url && <div className="collection-detail__preview full"><span>Image preview</span><img src={form.image_url} alt="Product preview" /></div>}

                    <div className="collection-detail__features full">
                        <div className="collection-detail__features-head"><div><span>Product options</span><h3>Characteristics customers can choose</h3><p>Add as many groups as the product needs: Size, Color, Material, Finish, Style, or anything else.</p></div><button type="button" onClick={addFeature}><Plus size={16} />Add option group</button></div>
                        {form.features.length === 0 && <div className="collection-detail__features-empty"><Package size={22} /><span>No options yet. Add a group such as Size or Color.</span></div>}
                        {form.features.map((feature, featureIndex) => <div className="feature-editor" key={feature.id}><div className="feature-editor__header"><strong>Option {featureIndex + 1}</strong><button type="button" onClick={() => removeFeature(feature.id)} aria-label={`Remove option ${featureIndex + 1}`}><Trash2 size={16} /></button></div><label><span>Option name</span><input value={feature.name} onChange={(event) => updateFeature(feature.id, { name: event.target.value })} placeholder="Size, Color, Material..." /></label><div className="feature-editor__values"><span>Choices</span>{feature.options.map((option, optionIndex) => <div className="feature-value" key={option.id}><input value={option.label} onChange={(event) => updateOption(feature.id, option.id, event.target.value)} placeholder={optionIndex === 0 ? "11 oz" : "Another choice"} /><button type="button" onClick={() => removeOption(feature.id, option.id)} disabled={feature.options.length === 1} aria-label="Remove choice"><X size={15} /></button></div>)}<button type="button" className="add-choice" onClick={() => addOption(feature.id)}><Plus size={14} />Add choice</button></div></div>)}
                    </div>
                </div><footer><button type="button" onClick={closeModal} disabled={saving || uploading}>Cancel</button><button type="submit" className="primary" disabled={saving || uploading}>{saving ? <LoaderCircle size={17} className="is-spinning" /> : editing ? <Save size={17} /> : <Plus size={17} />}{saving ? "Saving..." : editing ? "Save changes" : "Create product"}</button></footer></form></div></div>}
            </main>
        </div>
    );
}

export default AdminCollectionDetail;
