import { useEffect, useState, type ChangeEvent } from "react";
import {
    Plus,
    Pencil,
    Trash2,
    Power,
    Image as ImageIcon,
    LoaderCircle,
    X,
    Save,
    Upload,
} from "lucide-react";
import AdminSidebar from "./AdminSidebar";
import { apiRequest } from "../../services/api";
import "./AdminContent.css";

interface PortfolioItem {
    portfolio_id: string;
    image_url: string;
    cloudinary_public_id: string | null;
    title_en: string;
    title_es: string | null;
    description_en: string | null;
    description_es: string | null;
    characteristics_en: string | null;
    characteristics_es: string | null;
    is_active: boolean;
    sort_order: number;
}

interface FormState {
    title: string;
    description: string;
    characteristics: string;
    is_active: boolean;
    sort_order: string;
}

const emptyForm: FormState = {
    title: "",
    description: "",
    characteristics: "",
    is_active: true,
    sort_order: "0",
};

const AdminContent = () => {
    const [items, setItems] = useState<PortfolioItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<PortfolioItem | null>(null);
    const [imageUrl, setImageUrl] = useState("");
    const [publicId, setPublicId] = useState("");
    const [form, setForm] = useState<FormState>(emptyForm);

    const load = async () => {
        setLoading(true);
        try {
            const response = await apiRequest<{ portfolio: PortfolioItem[] }>(
                "/api/portfolio/admin"
            );
            setItems(response.portfolio || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void load();
    }, []);

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm);
        setImageUrl("");
        setPublicId("");
        setModalOpen(true);
    };

    const openEdit = (item: PortfolioItem) => {
        setEditing(item);
        setForm({
            title: item.title_en,
            description: item.description_en || "",
            characteristics: item.characteristics_en || "",
            is_active: item.is_active,
            sort_order: String(item.sort_order),
        });
        setImageUrl(item.image_url);
        setPublicId(item.cloudinary_public_id || "");
        setModalOpen(true);
    };

    const closeModal = () => {
        if (!saving && !uploading) setModalOpen(false);
    };

    const uploadImage = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const body = new FormData();
            body.append("image", file);
            const response = await apiRequest<{
                image_url: string;
                public_id: string;
            }>("/api/upload/portfolio", {
                method: "POST",
                body,
            });
            setImageUrl(response.image_url);
            setPublicId(response.public_id);
        } catch (error) {
            console.error(error);
            alert(error instanceof Error ? error.message : "Unable to upload image.");
        } finally {
            setUploading(false);
            event.target.value = "";
        }
    };

    const save = async () => {
        if (!imageUrl || (!editing && !publicId) || !form.title.trim()) {
            alert("Please provide an image and title.");
            return;
        }

        setSaving(true);
        try {
            const payload = {
                image_url: imageUrl,
                ...(publicId ? { public_id: publicId } : {}),
                title: form.title.trim(),
                description: form.description.trim() || null,
                characteristics: form.characteristics.trim() || null,
                is_active: form.is_active,
                sort_order: Number(form.sort_order) || 0,
            };

            if (editing) {
                await apiRequest(`/api/portfolio/${editing.portfolio_id}`, {
                    method: "PUT",
                    body: JSON.stringify(payload),
                });
            } else {
                await apiRequest("/api/portfolio", {
                    method: "POST",
                    body: JSON.stringify(payload),
                });
            }

            setModalOpen(false);
            await load();
        } catch (error) {
            console.error(error);
            alert(error instanceof Error ? error.message : "Unable to save portfolio item.");
        } finally {
            setSaving(false);
        }
    };

    const toggle = async (item: PortfolioItem) => {
        try {
            await apiRequest(`/api/portfolio/${item.portfolio_id}`, {
                method: "PUT",
                body: JSON.stringify({ is_active: !item.is_active }),
            });
            await load();
        } catch (error) {
            console.error(error);
        }
    };

    const remove = async (item: PortfolioItem) => {
        const confirmed = window.confirm(
            item.cloudinary_public_id
                ? `Permanently delete “${item.title_en}”? This will also remove the image from Cloudinary.`
                : `Remove “${item.title_en}” from the portfolio? This legacy image is stored with the website, so its source file will remain in the repository.`
        );
        if (!confirmed) return;

        try {
            await apiRequest(`/api/portfolio/${item.portfolio_id}`, {
                method: "DELETE",
            });
            await load();
        } catch (error) {
            console.error(error);
            alert(error instanceof Error ? error.message : "Unable to delete portfolio item.");
        }
    };

    return (
        <div className="admin-content-layout">
            <AdminSidebar username="Administrator" />

            <main className="admin-content-page">
                <header className="admin-content-header">
                    <div>
                        <span className="admin-content-eyebrow">Website Content</span>
                        <h1>Portfolio</h1>
                        <p>Manage completed creations shown in Latest Creations.</p>
                    </div>
                    <button className="admin-content-primary" onClick={openCreate}>
                        <Plus size={18} />
                        Add creation
                    </button>
                </header>

                <section className="admin-content-panel">
                    <div className="admin-content-panel-head">
                        <div>
                            <strong>Latest Creations</strong>
                            <span>{items.length} saved {items.length === 1 ? "work" : "works"}</span>
                        </div>
                    </div>

                    {loading ? (
                        <div className="admin-content-loading"><LoaderCircle className="spin" /> Loading portfolio…</div>
                    ) : items.length === 0 ? (
                        <div className="admin-content-empty">
                            <ImageIcon size={42} />
                            <strong>No creations yet</strong>
                            <span>Upload your first completed work to populate the gallery.</span>
                            <button onClick={openCreate}>Add first creation</button>
                        </div>
                    ) : (
                        <div className="admin-content-grid">
                            {items.map(item => (
                                <article className={`admin-content-card ${item.is_active ? "" : "is-hidden"}`} key={item.portfolio_id}>
                                    <div className="admin-content-card-image">
                                        <img src={item.image_url} alt={item.title_en} />
                                        <span>{item.is_active ? "Visible" : "Hidden"}</span>
                                    </div>
                                    <div className="admin-content-card-body">
                                        <div>
                                            <h2>{item.title_en}</h2>
                                            <p>{item.characteristics_en || item.description_en || "No details added."}</p>
                                        </div>
                                        <div className="admin-content-actions">
                                            <button title={item.is_active ? "Hide" : "Show"} onClick={() => void toggle(item)}><Power size={17} /></button>
                                            <button title="Edit" onClick={() => openEdit(item)}><Pencil size={17} /></button>
                                            <button className="danger" title="Delete permanently" onClick={() => void remove(item)}><Trash2 size={17} /></button>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </main>

            {modalOpen && (
                <div className="admin-content-modal-backdrop" onMouseDown={closeModal}>
                    <div className="admin-content-modal" onMouseDown={event => event.stopPropagation()}>
                        <header>
                            <div>
                                <span>{editing ? "Edit creation" : "New creation"}</span>
                                <h2>{editing ? "Update portfolio work" : "Add completed work"}</h2>
                            </div>
                            <button onClick={closeModal} aria-label="Close"><X /></button>
                        </header>

                        <div className="admin-content-form">
                            <label className="admin-content-upload">
                                {imageUrl ? <img src={imageUrl} alt="Preview" /> : <><Upload size={28} /><span>Choose JPG, PNG or WEBP</span><small>Maximum 5 MB</small></>}
                                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadImage} disabled={uploading || saving} />
                                {uploading && <div className="admin-content-uploading"><LoaderCircle className="spin" /> Uploading…</div>}
                            </label>

                            <label>
                                <span>Title (English)</span>
                                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Example: Custom Family Mug" />
                            </label>

                            <label>
                                <span>Description (English)</span>
                                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Brief description of the completed work." />
                            </label>

                            <label>
                                <span>Characteristics (English)</span>
                                <textarea value={form.characteristics} onChange={e => setForm({ ...form, characteristics: e.target.value })} rows={4} placeholder="11 oz ceramic mug · Full-wrap sublimation · Custom artwork" />
                                <small>Spanish is generated automatically and cached. If you change this text, the translation is regenerated.</small>
                            </label>

                            <div className="admin-content-form-row">
                                <label>
                                    <span>Order</span>
                                    <input type="number" min="0" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: e.target.value })} />
                                </label>
                                <label className="admin-content-switch-row">
                                    <span>Visible on website</span>
                                    <button type="button" className={`admin-content-switch ${form.is_active ? "active" : ""}`} onClick={() => setForm({ ...form, is_active: !form.is_active })}><i /></button>
                                </label>
                            </div>
                        </div>

                        <footer>
                            <button className="admin-content-secondary" onClick={closeModal} disabled={saving || uploading}>Cancel</button>
                            <button className="admin-content-primary" onClick={() => void save()} disabled={saving || uploading}>
                                {saving ? <LoaderCircle className="spin" size={18} /> : <Save size={18} />}
                                {saving ? "Saving…" : "Save creation"}
                            </button>
                        </footer>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminContent;
