import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { ArrowDown, ArrowLeft, ArrowUp, CheckCircle2, Edit3, Eye, EyeOff, ImageOff, LoaderCircle, Package, Plus, Save, Search, Trash2, X, XCircle } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import { apiRequest } from "../../services/api";
import "./AdminCollectionProducts.css";

type FeatureOption = { id: string; label: string };
type ProductFeature = { id: string; name: string; options: FeatureOption[] };
type Product = { product_id: string; name: string; slug: string; description: string; price: number | string; image_url: string; is_active: boolean; features: unknown[] | Record<string, unknown>; collection_sort_order: number };
type Collection = { slug: string; name: string; description?: string; image_url?: string; is_active?: boolean };
type ProductForm = { name: string; slug: string; description: string; price: string; image_url: string; features: ProductFeature[]; is_active: boolean };
type CurrentUser = { username: string };

const DEFAULT_COLORS = ["White", "Black", "Red"];
const COLOR_CATALOG = ["White", "Black", "Red", "Green", "Blue", "Purple", "Yellow", "Pink", "Orange", "Gray", "Brown", "Navy", "Teal", "Gold", "Silver", "Beige", "Maroon", "Turquoise"];
const DEFAULT_SIZES = ["11 oz", "15 oz"];
const COLOR_HEX: Record<string, string> = { white:"#fff",black:"#111",red:"#d71920",green:"#168a45",blue:"#2464c4",purple:"#7a3fb0",yellow:"#f0c419",pink:"#e98ca8",orange:"#ef7d24",gray:"#777",brown:"#7a4b2a",navy:"#162b55",teal:"#159b9b",gold:"#d8a82d",silver:"#bfc3c7",beige:"#d8c5a2",maroon:"#6f1d2b",turquoise:"#20b8b8" };

const newId = () => crypto.randomUUID();
const makeFeature = (name: string, options: string[]): ProductFeature => ({ id: newId(), name, options: options.map((label) => ({ id: newId(), label })) });
const defaultFeatures = (): ProductFeature[] => [makeFeature("Color", DEFAULT_COLORS), makeFeature("Size", DEFAULT_SIZES)];

function normalizeFeatures(value: Product["features"]): ProductFeature[] {
    if (Array.isArray(value)) {
        const result = value.flatMap((item) => {
            if (!item || typeof item !== "object" || !("name" in item)) return [];
            const raw = item as { id?: string; name?: string; options?: unknown };
            const options = Array.isArray(raw.options) ? raw.options.map((option) => typeof option === "object" && option !== null && "label" in option ? String((option as { label?: unknown }).label ?? "") : String(option ?? "")).filter(Boolean) : [];
            return [{ id: raw.id || newId(), name: String(raw.name || "Option"), options: options.length ? options.map((label) => ({ id: newId(), label })) : [{ id: newId(), label: "" }] }];
        });
        const hasColor = result.some((feature) => feature.name.trim().toLowerCase() === "color");
        const hasSize = result.some((feature) => feature.name.trim().toLowerCase() === "size");
        return [...(!hasColor ? [makeFeature("Color", DEFAULT_COLORS)] : []), ...(!hasSize ? [makeFeature("Size", DEFAULT_SIZES)] : []), ...result];
    }
    return Object.entries(value || {}).map(([name, raw]) => ({ id: newId(), name, options: (Array.isArray(raw) ? raw : [raw]).map((option) => ({ id: newId(), label: String(option ?? "") })) }));
}

function AdminCollectionProducts() {
    const { slug = "" } = useParams();
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const [collection, setCollection] = useState<Collection | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editing, setEditing] = useState<Product | null>(null);
    const [form, setForm] = useState<ProductForm>({ name:"", slug:"", description:"", price:"", image_url:"", features:defaultFeatures(), is_active:true });
    const [modalOpen, setModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [busy, setBusy] = useState<string | null>(null);

    const load = async () => {
        setLoading(true); setError(null);
        try {
            const [collectionResponse, productsResponse, userResponse] = await Promise.all([
                apiRequest<{ collection: Collection }>(`/api/collections/admin/${slug}`),
                apiRequest<{ products: Product[] }>(`/api/collections/admin/${slug}/products`),
                apiRequest<CurrentUser>("/api/user/me"),
            ]);
            setCollection(collectionResponse.collection); setProducts(productsResponse.products || []); setCurrentUser(userResponse);
        } catch (err) { setError(err instanceof Error ? err.message : "Unable to load collection."); }
        finally { setLoading(false); }
    };
    useEffect(() => { void load(); }, [slug]);

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return products;
        return products.filter((product) => `${product.name} ${product.slug} ${product.description}`.toLowerCase().includes(term));
    }, [products, search]);
    const activeCount = products.filter((product) => product.is_active).length;
    const openCreate = () => { setEditing(null); setForm({ name:"", slug:"", description:"", price:"", image_url:"", features:defaultFeatures(), is_active:true }); setModalOpen(true); };
    const openEdit = (product: Product) => { setEditing(product); setForm({ name:product.name, slug:product.slug, description:product.description || "", price:String(product.price), image_url:product.image_url || "", features:normalizeFeatures(product.features), is_active:product.is_active }); setModalOpen(true); };
    const updateFeature = (id: string, patch: Partial<ProductFeature>) => setForm((current) => ({ ...current, features: current.features.map((feature) => feature.id === id ? { ...feature, ...patch } : feature) }));
    const updateOption = (featureId: string, optionId: string, label: string) => setForm((current) => ({ ...current, features: current.features.map((feature) => feature.id === featureId ? { ...feature, options: feature.options.map((option) => option.id === optionId ? { ...option, label } : option) } : feature) }));
    const addFeature = () => setForm((current) => ({ ...current, features: [...current.features, makeFeature("", [""]) ] }));
    const removeFeature = (id: string) => setForm((current) => ({ ...current, features: current.features.filter((feature) => feature.id !== id) }));
    const addOption = (featureId: string, label = "") => setForm((current) => ({ ...current, features: current.features.map((feature) => feature.id === featureId ? { ...feature, options:[...feature.options,{id:newId(),label}] } : feature) }));
    const removeOption = (featureId: string, optionId: string) => setForm((current) => ({ ...current, features: current.features.map((feature) => feature.id === featureId ? { ...feature, options:feature.options.filter((option) => option.id !== optionId) } : feature) }));
    const colorFeature = form.features.find((feature) => feature.name.trim().toLowerCase() === "color");
    const addCatalogColor = (color: string) => { if (!colorFeature || colorFeature.options.some((option) => option.label.toLowerCase() === color.toLowerCase())) return; addOption(colorFeature.id, color); };

    const uploadImage = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]; if (!file) return; setUploading(true);
        try { const body = new FormData(); body.append("image", file); const response = await apiRequest<{ image_url?: string }>("/api/upload/product", { method:"POST", body }); setForm((current) => ({ ...current, image_url:response.image_url || "" })); }
        catch (err) { window.alert(err instanceof Error ? err.message : "Unable to upload image."); }
        finally { setUploading(false); event.target.value = ""; }
    };

    const saveProduct = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!form.name.trim() || !form.price || form.features.some((feature) => !feature.name.trim() || feature.options.some((option) => !option.label.trim()))) { window.alert("Complete the product name, price and every option before saving."); return; }
        setSaving(true);
        try {
            const payload = { ...form, name:form.name.trim(), slug:form.slug.trim(), price:Number(form.price), features:form.features.map((feature) => ({ ...feature, name:feature.name.trim(), options:feature.options.map((option) => ({ ...option, label:option.label.trim() })) })) };
            const path = editing ? `/api/collections/admin/${slug}/products/${editing.product_id}` : `/api/collections/admin/${slug}/products`;
            const response = await apiRequest<{ product:Product }>(path, { method:editing ? "PUT" : "POST", body:JSON.stringify(payload) });
            setProducts((current) => editing ? current.map((item) => item.product_id === editing.product_id ? response.product : item) : [...current, response.product]); setModalOpen(false);
        } catch (err) { window.alert(err instanceof Error ? err.message : "Unable to save product."); }
        finally { setSaving(false); }
    };

    const toggleStatus = async (product: Product) => {
        setBusy(product.product_id);
        try { const response = await apiRequest<{ product:Product }>(`/api/collections/admin/${slug}/products/${product.product_id}/status`, { method:"PUT", body:JSON.stringify({is_active:!product.is_active}) }); setProducts((current) => current.map((item) => item.product_id === product.product_id ? response.product : item)); }
        catch (err) { window.alert(err instanceof Error ? err.message : "Unable to update status."); }
        finally { setBusy(null); }
    };
    const removeProduct = async (product: Product) => {
        if (!window.confirm(`Remove ${product.name} from this collection?`)) return; setBusy(product.product_id);
        try { await apiRequest(`/api/collections/admin/${slug}/products/${product.product_id}`, { method:"DELETE" }); setProducts((current) => current.filter((item) => item.product_id !== product.product_id)); }
        catch (err) { window.alert(err instanceof Error ? err.message : "Unable to remove product."); }
        finally { setBusy(null); }
    };
    const moveProduct = async (product: Product, direction: "up" | "down") => {
        const index = products.findIndex((item) => item.product_id === product.product_id); const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (index < 0 || targetIndex < 0 || targetIndex >= products.length) return; const target = products[targetIndex]; setBusy(product.product_id);
        try {
            await apiRequest(`/api/collections/admin/${slug}/products/${product.product_id}/order`, { method:"PUT", body:JSON.stringify({sort_order:target.collection_sort_order}) });
            await apiRequest(`/api/collections/admin/${slug}/products/${target.product_id}/order`, { method:"PUT", body:JSON.stringify({sort_order:product.collection_sort_order}) });
            setProducts((current) => { const next=[...current]; [next[index],next[targetIndex]]=[next[targetIndex],next[index]]; return next.map((item,position)=>({...item,collection_sort_order:position+1})); });
        } catch (err) { window.alert(err instanceof Error ? err.message : "Unable to reorder products."); }
        finally { setBusy(null); }
    };

    return <div className="admin-products-shell"><AdminSidebar username={currentUser?.username} /><main className="admin-products-main">
        <header className="admin-products-header"><button type="button" className="admin-back" onClick={() => navigate("/admin/collections")}><ArrowLeft size={17}/> Collections</button><div><span>COLLECTION MANAGEMENT</span><h1>{collection?.name || "Collection"}</h1><p>{collection?.description || "Manage products, images and customer selections for this collection."}</p></div><button type="button" className="admin-primary" onClick={openCreate}><Plus size={18}/> Add Product</button></header>
        <section className="admin-stat-grid"><div><Package/><strong>{products.length}</strong><span>Total Products</span></div><div><CheckCircle2/><strong>{activeCount}</strong><span>Visible</span></div><div><XCircle/><strong>{products.length-activeCount}</strong><span>Hidden</span></div></section>
        <section className="admin-toolbar"><div className="admin-search"><Search size={18}/><input value={search} onChange={(event)=>setSearch(event.target.value)} placeholder="Search products..."/></div><button type="button" className="admin-secondary" onClick={()=>void load()}>Refresh</button></section>
        {loading && <div className="admin-state"><LoaderCircle className="spin"/> Loading products...</div>}
        {!loading && error && <div className="admin-state admin-state--error"><XCircle/> {error}</div>}
        {!loading && !error && <section className="admin-product-grid">{filtered.map((product,index)=><article className={`admin-product-card${product.is_active ? "" : " is-hidden"}`} key={product.product_id}>
            <div className="admin-product-media">{product.image_url ? <img src={product.image_url} alt={product.name}/> : <div className="admin-no-image"><ImageOff/><span>No image</span></div>}<span className="admin-order">{String(index+1).padStart(2,"0")}</span><span className={`admin-status ${product.is_active ? "is-active":""}`}>{product.is_active ? "VISIBLE":"HIDDEN"}</span></div>
            <div className="admin-product-body"><div className="admin-product-title"><div><h2>{product.name}</h2><span>{product.slug}</span></div><strong>${Number(product.price).toFixed(2)}</strong></div>{product.description && <p>{product.description}</p>}<div className="admin-feature-summary">{normalizeFeatures(product.features).map((feature)=><span key={feature.id}><b>{feature.name}</b> {feature.options.length} options</span>)}</div><div className="admin-card-actions"><button type="button" onClick={()=>moveProduct(product,"up")} disabled={index===0||!!busy}><ArrowUp size={16}/></button><button type="button" onClick={()=>moveProduct(product,"down")} disabled={index===filtered.length-1||!!busy}><ArrowDown size={16}/></button><button type="button" onClick={()=>toggleStatus(product)} disabled={busy===product.product_id}>{product.is_active?<EyeOff size={16}/>:<Eye size={16}/>} {product.is_active?"Hide":"Show"}</button><button type="button" onClick={()=>openEdit(product)}><Edit3 size={16}/> Edit</button><button type="button" className="danger" onClick={()=>void removeProduct(product)} disabled={busy===product.product_id}><Trash2 size={16}/> Delete</button></div></div>
        </article>)}{!filtered.length && <div className="admin-state">No products found.</div>}</section>}
    </main>

    {modalOpen && <div className="admin-product-modal" role="dialog" aria-modal="true"><div className="admin-product-modal__panel"><button type="button" className="admin-modal-close" onClick={()=>!saving&&!uploading&&setModalOpen(false)}><X/></button><div className="admin-modal-heading"><span>{editing?"EDIT PRODUCT":"NEW PRODUCT"}</span><h2>{editing?"Update product":"Add product to collection"}</h2><p>Every product controls its own image, colors, sizes and future options.</p></div><form onSubmit={saveProduct}>
        <div className="admin-form-grid"><label>Product name<input value={form.name} onChange={(event)=>setForm({...form,name:event.target.value})} required/></label><label>Slug<input value={form.slug} onChange={(event)=>setForm({...form,slug:event.target.value})} placeholder="product-slug"/></label><label>Price<input type="number" min="0" step="0.01" value={form.price} onChange={(event)=>setForm({...form,price:event.target.value})} required/></label><label className="admin-upload-label">Product image<input type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadImage}/>{uploading&&<small>Uploading...</small>}</label></div>
        <label className="admin-description">Description<textarea value={form.description} onChange={(event)=>setForm({...form,description:event.target.value})} rows={4} placeholder="Product description / sample product text"/></label>
        {form.image_url && <div className="admin-image-preview"><img src={form.image_url} alt="Product preview"/></div>}
        <section className="admin-options-builder"><div className="admin-options-heading"><div><span>PRODUCT OPTIONS</span><h3>Customer selections</h3><p>White, Black and Red are included by default. Add or remove anything for this product.</p></div><button type="button" className="admin-secondary" onClick={addFeature}><Plus size={16}/> Add option group</button></div>
            {form.features.map((feature)=><div className="admin-feature-card" key={feature.id}><div className="admin-feature-head"><input value={feature.name} onChange={(event)=>updateFeature(feature.id,{name:event.target.value})} placeholder="Option name (Color, Size, Material...)"/><button type="button" onClick={()=>removeFeature(feature.id)} aria-label="Remove option group"><Trash2 size={17}/></button></div>
                {feature.name.trim().toLowerCase()==="color" && <div className="admin-color-catalog"><span>Quick add color</span><div>{COLOR_CATALOG.map((color)=><button type="button" key={color} onClick={()=>addCatalogColor(color)} className={feature.options.some((option)=>option.label.toLowerCase()===color.toLowerCase())?"is-added":""}><i style={{backgroundColor:COLOR_HEX[color.toLowerCase()]||color}}/>{color}</button>)}</div></div>}
                <div className="admin-option-list">{feature.options.map((option)=><div className="admin-option-row" key={option.id}>{feature.name.trim().toLowerCase()==="color"&&<i style={{backgroundColor:COLOR_HEX[option.label.toLowerCase()]||option.label}}/>}<input value={option.label} onChange={(event)=>updateOption(feature.id,option.id,event.target.value)} placeholder="Option value"/><button type="button" onClick={()=>removeOption(feature.id,option.id)} aria-label="Remove option"><X size={16}/></button></div>)}</div><button type="button" className="admin-add-option" onClick={()=>addOption(feature.id)}><Plus size={15}/> Add option</button>
            </div>)}
        </section>
        <div className="admin-modal-footer"><label className="admin-active-toggle"><input type="checkbox" checked={form.is_active} onChange={(event)=>setForm({...form,is_active:event.target.checked})}/><span>{form.is_active?"Visible to customers":"Hidden from customers"}</span></label><button type="submit" className="admin-primary" disabled={saving||uploading}><Save size={17}/>{saving?"Saving...":editing?"Save Changes":"Create Product"}</button></div>
    </form></div></div>}
    </div>;
}

export default AdminCollectionProducts;
