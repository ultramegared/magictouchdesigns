import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3, CheckCircle2, Clock3, Copy, Image, Mail, Megaphone, MessageCircle, MousePointer2, Play, Plus, RefreshCw, Search, Sparkles, TrendingUp, Users, Video, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { apiRequest } from "../../services/api";
import AdminSidebar from "./AdminSidebar";

interface SalesDay { date: string; orders: number; revenue: string | number; }
interface SalesResponse { daily?: SalesDay[]; }
interface GscRow { keys?: string[]; clicks?: number; impressions?: number; ctr?: number; position?: number; }
interface GscResponse { connected: boolean; siteUrl?: string; permissionLevel?: string | null; error?: string; }
interface GaStatus { configured: boolean; propertyId?: string | null; error?: string; }
interface GaRow { dimensionValues?: Array<{ value?: string }>; metricValues?: Array<{ value?: string }> }
interface GaResponse { rows?: GaRow[]; error?: string; }
type ChannelName = "Google" | "Facebook" | "Instagram" | "TikTok" | "YouTube" | "Pinterest" | "WhatsApp" | "Email";
type Draft = { id: string; title: string; channel: ChannelName; brief: string; content: string; createdAt: string };
type Channel = { name: ChannelName; detail: string; icon: LucideIcon; tone: string };

const channels: Channel[] = [
    { name: "Google", detail: "Search & Analytics", icon: Search, tone: "#4285F4" },
    { name: "Facebook", detail: "Pages & Ads", icon: MessageCircle, tone: "#1877F2" },
    { name: "Instagram", detail: "Posts & Reels", icon: Image, tone: "#E1306C" },
    { name: "TikTok", detail: "Short-form video", icon: Video, tone: "#e5e7eb" },
    { name: "YouTube", detail: "Video campaigns", icon: Play, tone: "#FF0000" },
    { name: "Pinterest", detail: "Pins & products", icon: Image, tone: "#BD081C" },
    { name: "WhatsApp", detail: "Customer campaigns", icon: MessageCircle, tone: "#25D366" },
    { name: "Email", detail: "Newsletters & offers", icon: Mail, tone: "#4F83CC" },
];

const DRAFTS_KEY = "jqyd-marketing-drafts-v1";

function readDrafts(): Draft[] {
    try {
        const raw = localStorage.getItem(DRAFTS_KEY);
        const value = raw ? JSON.parse(raw) : [];
        return Array.isArray(value) ? value : [];
    } catch { return []; }
}

function buildDraft(channel: ChannelName, title: string, brief: string): string {
    const clean = brief.trim() || "Promoción de productos personalizados de JQYD.";
    const lines: Record<ChannelName, string> = {
        Google: `Objetivo: atraer búsquedas con intención de compra.\n\nTitular: ${title}\nDescripción: ${clean} Descubre diseños personalizados de JQYD en jqydesigns.com.\nCTA: Comprar ahora\nLanding: https://jqydesigns.com`,
        Facebook: `Texto principal:\n${clean}\n\nJQYD · productos personalizados hechos para regalar, celebrar y representar tu marca.\nCTA: Más información / Comprar ahora`,
        Instagram: `${clean}\n\n✨ Personaliza con JQYD.\n🛍️ Descubre la colección en jqydesigns.com\n\n#JQYD #PersonalizedGifts #CustomDesigns`,
        TikTok: `Hook (0–3s): ¿Quieres convertir una idea en un producto único?\n\nGuion: ${clean}\n\nCierre: Personaliza con JQYD. Visita jqydesigns.com.`,
        YouTube: `Título: ${title} | JQYD\n\nDescripción:\n${clean}\n\nConoce JQYD y explora productos personalizados en jqydesigns.com.`,
        Pinterest: `Título del Pin: ${title}\nDescripción: ${clean} Explora JQYD y guarda tus diseños favoritos.\nDestino: https://jqydesigns.com`,
        WhatsApp: `Mensaje de campaña:\nHola 👋 Somos JQYD. ${clean}\n\n¿Quieres ver opciones y personalizar tu pedido? Visita jqydesigns.com.`,
        Email: `Asunto: ${title}\n\nHola,\n\n${clean}\n\nDescubre JQYD y encuentra tu próximo diseño personalizado.\n\nCTA: Ver productos → https://jqydesigns.com`,
    };
    return lines[channel];
}

function AdminMarketing() {
    const [range, setRange] = useState<"7" | "30" | "90">("30");
    const [sales, setSales] = useState<SalesResponse | null>(null);
    const [gsc, setGsc] = useState<GscResponse | null>(null);
    const [gscRows, setGscRows] = useState<GscRow[]>([]);
    const [ga, setGa] = useState<GaStatus | null>(null);
    const [gaRows, setGaRows] = useState<GaRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [modal, setModal] = useState<"builder" | "details" | "seo" | ChannelName | null>(null);
    const [selectedChannel, setSelectedChannel] = useState<ChannelName>("Instagram");
    const [title, setTitle] = useState("");
    const [brief, setBrief] = useState("");
    const [drafts, setDrafts] = useState<Draft[]>([]);
    const [copied, setCopied] = useState(false);

    useEffect(() => setDrafts(readDrafts()), []);
    useEffect(() => localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts)), [drafts]);

    const load = useCallback(async () => {
        try {
            setRefreshing(true);
            const end = new Date();
            const start = new Date();
            start.setDate(end.getDate() - Number(range) + 1);
            const iso = (d: Date) => d.toISOString().slice(0, 10);
            const [s, gc, gcA, gas, gaR] = await Promise.allSettled([
                apiRequest<SalesResponse>(`/api/admin/sales?start=${iso(start)}&end=${iso(end)}`),
                apiRequest<GscResponse>("/api/admin/marketing/search-console/verify"),
                apiRequest<{ rows?: GscRow[] }>(`/api/admin/marketing/search-console/analytics?days=${range}`),
                apiRequest<GaStatus>("/api/admin/marketing/search-console/google-analytics/status"),
                apiRequest<GaResponse>(`/api/admin/marketing/search-console/google-analytics/report?days=${range}`),
            ]);
            if (s.status === "fulfilled") setSales(s.value);
            if (gc.status === "fulfilled") setGsc(gc.value);
            if (gcA.status === "fulfilled") setGscRows(gcA.value.rows || []);
            if (gas.status === "fulfilled") setGa(gas.value);
            if (gaR.status === "fulfilled") setGaRows(gaR.value.rows || []);
        } finally { setLoading(false); setRefreshing(false); }
    }, [range]);

    useEffect(() => { void load(); }, [load]);

    const salesMetrics = useMemo(() => {
        const d = sales?.daily || [];
        return { orders: d.reduce((a, x) => a + Number(x.orders || 0), 0), revenue: d.reduce((a, x) => a + Number(x.revenue || 0), 0) };
    }, [sales]);
    const searchMetrics = useMemo(() => gscRows.reduce((a, x) => ({ clicks: a.clicks + Number(x.clicks || 0), impressions: a.impressions + Number(x.impressions || 0), ctr: a.ctr + Number(x.ctr || 0), position: a.position + Number(x.position || 0), count: a.count + 1 }), { clicks: 0, impressions: 0, ctr: 0, position: 0, count: 0 }), [gscRows]);
    const gaMetrics = useMemo(() => gaRows.reduce((a, x) => { const m = x.metricValues || []; return { users: a.users + Number(m[0]?.value || 0), sessions: a.sessions + Number(m[1]?.value || 0), views: a.views + Number(m[2]?.value || 0), revenue: a.revenue + Number(m[3]?.value || 0) }; }, { users: 0, sessions: 0, views: 0, revenue: 0 }), [gaRows]);
    const chart = useMemo(() => { const d = sales?.daily || []; if (!d.length) return "0,100 100,100 200,100 300,100"; const max = Math.max(...d.map(x => Number(x.revenue || 0)), 1); return d.map((x, i) => `${(d.length === 1 ? 150 : (i / (d.length - 1)) * 300).toFixed(1)},${(100 - (Number(x.revenue || 0) / max) * 82).toFixed(1)}`).join(" "); }, [sales]);

    const openBuilder = (channel: ChannelName = selectedChannel, preset = "") => {
        setSelectedChannel(channel);
        setTitle(preset || `${channel} campaign · JQYD`);
        setBrief("");
        setModal("builder");
    };
    const saveDraft = () => {
        const draftTitle = title.trim() || `${selectedChannel} campaign · JQYD`;
        const draft: Draft = { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, title: draftTitle, channel: selectedChannel, brief: brief.trim(), content: buildDraft(selectedChannel, draftTitle, brief), createdAt: new Date().toISOString() };
        setDrafts(current => [draft, ...current].slice(0, 50));
        setModal("details");
    };
    const copyDraft = async (content: string) => {
        try { await navigator.clipboard.writeText(content); setCopied(true); window.setTimeout(() => setCopied(false), 1500); } catch { /* Clipboard can be unavailable on some browsers. */ }
    };
    const connected = (name: ChannelName) => name === "Google" ? Boolean(gsc?.connected || ga?.configured) : false;

    return <div className="marketing-page"><style>{`
        .marketing-page{min-height:100vh;background:#07101d;color:#f8fafc;font-family:Inter,system-ui,sans-serif}.marketing-main{margin-left:270px;padding:24px 26px 42px;max-width:1600px}.hero,.card,.stat{background:#0d1929;border:1px solid #26364e;border-radius:14px}.hero{padding:28px 32px;background:linear-gradient(115deg,#25105d,#0b1729 58%,#10243b)}.eyebrow{font-size:11px;letter-spacing:.08em;color:#e3b8ff;font-weight:800}.hero h1{font-size:38px;margin:8px 0}.hero h1 span{color:#c46cff}.hero p{color:#cbd5e1;max-width:820px;line-height:1.5}.actions{display:flex;gap:9px;margin-top:16px;flex-wrap:wrap}.btn{border:1px solid #50617d;border-radius:9px;background:#111f33;color:#fff;padding:10px 14px;font-weight:700;display:inline-flex;align-items:center;gap:7px;cursor:pointer}.btn:disabled{opacity:.55;cursor:not-allowed}.primary{border-color:#8a42ff;background:linear-gradient(135deg,#7d24ff,#24a8ef)}.stats{display:grid;grid-template-columns:repeat(4,1fr) 180px;gap:9px;margin:12px 0}.stat{padding:14px}.stat-top{display:flex;justify-content:space-between;color:#9eacc0;font-size:11px}.stat strong{display:block;font-size:23px;margin:6px 0}.stat small{color:#54e889;font-weight:700}.range{display:flex;align-items:center;justify-content:center;gap:6px}.select,.input,.textarea{background:#0d1929;border:1px solid #41536d;color:#fff;border-radius:8px;padding:9px}.section{margin-top:14px}.section-title{padding:0 2px 9px}.section-title h2{font-size:18px;margin:0}.section-title p{font-size:12px;color:#9eacc0;margin:4px 0}.integration{display:grid;grid-template-columns:1fr 1fr;gap:10px}.integration-card{padding:14px}.integration-head{display:flex;align-items:center;justify-content:space-between}.integration-head h3{margin:0;font-size:15px}.integration p{font-size:11px;color:#9eacc0;line-height:1.45;min-height:31px}.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}.metric{background:#111f33;border:1px solid #24364f;border-radius:9px;padding:9px}.metric b{display:block;font-size:16px}.metric span{font-size:9px;color:#8492a5}.channels{display:grid;grid-template-columns:repeat(8,1fr);gap:8px}.channel{padding:12px 7px;text-align:center;cursor:pointer;color:#fff}.channel-icon{width:38px;height:38px;border-radius:11px;margin:auto;display:grid;place-items:center;background:#14243a}.channel strong{display:block;font-size:12px;margin-top:7px}.channel small{color:#8292a8;font-size:10px}.status{display:inline-flex;align-items:center;gap:4px;margin-top:6px;border-radius:999px;padding:4px 7px;background:#1b2a3e;color:#b9c6d6;font-size:9px}.connected{color:#54e889}.quick{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}.quick button{padding:13px;text-align:left;cursor:pointer;color:#fff}.quick strong{font-size:11px}.quick small{display:block;color:#8391a5;font-size:9px;margin-top:3px}.bottom{display:grid;grid-template-columns:1.2fr .9fr .9fr;gap:10px}.panel{padding:14px}.head{display:flex;justify-content:space-between;align-items:center;gap:10px}.head h3{margin:0;font-size:15px}.chart{height:180px;margin-top:10px;border:1px solid #1e2c40;border-radius:9px}.chart svg{width:100%;height:100%}.empty{padding:25px;text-align:center;color:#7f8da1;font-size:11px}.campaign{padding:10px;border:1px solid #1f2d42;border-radius:9px;margin:7px 0;font-size:11px}.campaign strong{display:block;margin-bottom:3px}.campaign span{color:#8795a9}.assistant{background:#10172b}.assistant textarea{width:100%;min-height:90px;box-sizing:border-box;background:#171f3b;border:1px solid #5946bb;border-radius:9px;color:#fff;padding:9px;resize:vertical}.modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.68);z-index:100;display:grid;place-items:center;padding:20px}.modal{width:min(650px,100%);max-height:90vh;overflow:auto;box-sizing:border-box;background:#0d1929;border:1px solid #344967;border-radius:15px;padding:20px}.modal-head{display:flex;justify-content:space-between;align-items:center;gap:12px}.modal h2{margin:0;font-size:20px}.close{background:none;border:0;color:#aab8ca;cursor:pointer}.modal p{color:#aeb9c8;font-size:12px;line-height:1.55}.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.field{display:flex;flex-direction:column;gap:5px}.field.full{grid-column:1/-1}.field label{font-size:10px;color:#8e9caf;font-weight:700}.textarea{min-height:100px;resize:vertical}.draft-content{white-space:pre-wrap;background:#111f33;border:1px solid #24364f;border-radius:9px;padding:12px;font-size:12px;line-height:1.55}.notice{padding:10px;border:1px solid #3a4b64;border-radius:9px;background:#101d30;color:#aeb9c8;font-size:11px;line-height:1.45}
        @media(max-width:1200px){.channels{grid-template-columns:repeat(4,1fr)}.quick{grid-template-columns:repeat(3,1fr)}.bottom,.integration{grid-template-columns:1fr}.stats{grid-template-columns:repeat(2,1fr)}}@media(max-width:800px){.marketing-main{margin-left:0;padding:15px}.hero h1{font-size:29px}.channels{grid-template-columns:repeat(2,1fr)}.quick{grid-template-columns:1fr 1fr}.stats{grid-template-columns:1fr 1fr}.metrics,.form-grid{grid-template-columns:1fr 1fr}.form-grid .full{grid-column:1/-1}}
    `}</style>
        <AdminSidebar username="Administrator" />
        <main className="marketing-main">
            <section className="hero"><div className="eyebrow">MARKETING CENTER · JQYD</div><h1>Grow Your Brand <span>Everywhere</span></h1><p>Centro operativo de marketing para JQYD. Las métricas de ventas, Google Search Console y Google Analytics se consultan desde el backend protegido. Las campañas ahora se pueden crear, guardar y reutilizar desde el administrador sin publicar ni gastar presupuesto accidentalmente.</p><div className="actions"><button className="btn primary" onClick={() => openBuilder("Instagram", "Nueva campaña JQYD")}><Megaphone size={15}/>Create Campaign</button><button className="btn" onClick={() => void load()} disabled={refreshing}><RefreshCw size={15}/>Refresh data</button></div></section>
            <section className="stats"><article className="stat"><div className="stat-top"><span>Visitors</span><MousePointer2 size={17}/></div><strong>{gaMetrics.users ? gaMetrics.users.toLocaleString() : "—"}</strong><small>{ga?.configured ? "Google Analytics 4" : "Connect GA4"}</small></article><article className="stat"><div className="stat-top"><span>Page Views</span><TrendingUp size={17}/></div><strong>{gaMetrics.views ? gaMetrics.views.toLocaleString() : "—"}</strong><small>{ga?.configured ? "Live GA4 data" : "Connect GA4"}</small></article><article className="stat"><div className="stat-top"><span>Orders</span><Users size={17}/></div><strong>{salesMetrics.orders.toLocaleString()}</strong><small>Live order data</small></article><article className="stat"><div className="stat-top"><span>Revenue</span><BarChart3 size={17}/></div><strong>${salesMetrics.revenue.toFixed(2)}</strong><small>Live sales data</small></article><div className="stat range"><Clock3 size={14}/><select className="select" value={range} onChange={e => setRange(e.target.value as "7"|"30"|"90")}><option value="7">7 days</option><option value="30">30 days</option><option value="90">90 days</option></select></div></section>
            <section className="section"><div className="section-title"><h2>Google Integrations</h2><p>Datos reales cuando las credenciales y permisos de Google estén configurados en Vercel.</p></div><div className="integration"><article className="card integration-card"><div className="integration-head"><h3>Google Search Console</h3>{gsc?.connected ? <CheckCircle2 className="connected" size={19}/> : <Search size={19}/>}</div><p>{gsc?.connected ? `Connected to ${gsc.siteUrl}` : gsc?.error || "Needs service-account property access"}</p><div className="metrics"><div className="metric"><b>{searchMetrics.clicks.toLocaleString()}</b><span>Clicks</span></div><div className="metric"><b>{searchMetrics.impressions.toLocaleString()}</b><span>Impressions</span></div><div className="metric"><b>{searchMetrics.count ? (searchMetrics.ctr / searchMetrics.count * 100).toFixed(2) : "0.00"}%</b><span>Avg. CTR</span></div><div className="metric"><b>{searchMetrics.count ? (searchMetrics.position / searchMetrics.count).toFixed(1) : "—"}</b><span>Avg. position</span></div></div></article><article className="card integration-card"><div className="integration-head"><h3>Google Analytics 4</h3>{ga?.configured ? <CheckCircle2 className="connected" size={19}/> : <TrendingUp size={19}/>}</div><p>{ga?.configured ? `Property ${ga.propertyId} is configured.` : ga?.error || "Needs property ID + service-account access"}</p><div className="metrics"><div className="metric"><b>{gaMetrics.users.toLocaleString()}</b><span>Active users</span></div><div className="metric"><b>{gaMetrics.sessions.toLocaleString()}</b><span>Sessions</span></div><div className="metric"><b>{gaMetrics.views.toLocaleString()}</b><span>Page views</span></div><div className="metric"><b>${gaMetrics.revenue.toFixed(2)}</b><span>GA revenue</span></div></div></article></div></section>
            <section className="section"><div className="section-title"><h2>Connect Your Channels</h2><p>El espacio está listo para trabajar. Los canales externos se marcan conectados únicamente cuando existe una integración real.</p></div><div className="channels">{channels.map(({ name, detail, icon: Icon, tone }) => <button className="card channel" key={name} onClick={() => name === "Google" ? setModal("Google") : openBuilder(name, `${name} campaign · JQYD`)}><span className="channel-icon" style={{ color: tone }}><Icon size={20}/></span><strong>{name}</strong><small>{detail}</small><span className={`status ${connected(name) ? "connected" : ""}`}>{connected(name) ? "Connected" : "Workspace ready"}</span></button>)}</div></section>
            <section className="section"><div className="section-title"><h2>Quick Actions</h2><p>Estas acciones ya son utilizables: abren el creador y guardan campañas en el navegador del administrador para revisión.</p></div><div className="quick">{[["SEO Optimization","SEO"],["Promote a Product","Instagram"],["Generate Content","Facebook"],["Run Ads","Google"],["WhatsApp Campaign","WhatsApp"],["Email Campaign","Email"]].map(([label, channel]) => <button className="card" key={label} onClick={() => channel === "SEO" ? setModal("seo") : openBuilder(channel as ChannelName, `${label} · JQYD`)}><strong>{label}</strong><small>{channel === "SEO" ? "Run an actionable SEO check" : "Create campaign draft"}</small></button>)}</div></section>
            <section className="section bottom"><article className="card panel"><div className="head"><div><span>MARKETING PERFORMANCE</span><h3>Revenue performance</h3></div><BarChart3 size={17}/></div><div className="chart">{loading ? <div className="empty">Loading…</div> : <svg viewBox="0 0 300 120" preserveAspectRatio="none"><g stroke="#1e2c40" strokeWidth="1"><line x1="0" y1="18" x2="300" y2="18"/><line x1="0" y1="59" x2="300" y2="59"/><line x1="0" y1="100" x2="300" y2="100"/></g><polyline fill="none" stroke="#7d6cff" strokeWidth="2.5" points={chart}/></svg>}</div></article><article className="card panel"><div className="head"><h3>Saved Drafts</h3><span>{drafts.length}</span></div>{drafts.length ? drafts.slice(0, 6).map(d => <button className="campaign" key={d.id} onClick={() => { setTitle(d.title); setSelectedChannel(d.channel); setBrief(d.brief); setModal("details"); }}><strong>{d.title}</strong><span>{d.channel} · {new Date(d.createdAt).toLocaleDateString()}</span></button>) : <div className="empty">No campaign drafts yet.</div>}</article><article className="card panel assistant"><div className="head"><h3>AI Campaign Assistant</h3><Sparkles size={17}/></div><p>Describe what you want to promote. The assistant creates editable campaign copy for review; it never publishes or spends ad budget.</p><textarea value={brief} onChange={e => setBrief(e.target.value)} placeholder="Ejemplo: promoción de tazas personalizadas para el Día de la Madre"/><div className="actions"><button className="btn primary" onClick={() => { setSelectedChannel("Instagram"); setTitle("AI campaign · JQYD"); setModal("builder"); }}><Plus size={15}/>Build draft</button></div></article></section>
        </main>
        {modal && <div className="modal-bg" onClick={() => setModal(null)}><div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head"><h2>{modal === "builder" ? "Campaign Builder" : modal === "details" ? "Campaign Draft" : modal === "seo" ? "SEO Workspace" : modal === "Google" ? "Google Integrations" : `${modal} Workspace`}</h2><button className="close" onClick={() => setModal(null)}><X size={18}/></button></div>
            {modal === "builder" && <><p>Configura el borrador. Guardarlo no publica nada y no consume presupuesto.</p><div className="form-grid"><div className="field"><label>CHANNEL</label><select className="select" value={selectedChannel} onChange={e => setSelectedChannel(e.target.value as ChannelName)}>{channels.map(c => <option key={c.name}>{c.name}</option>)}</select></div><div className="field"><label>CAMPAIGN NAME</label><input className="input" value={title} onChange={e => setTitle(e.target.value)} /></div><div className="field full"><label>BRIEF / OFFER</label><textarea className="textarea" value={brief} onChange={e => setBrief(e.target.value)} placeholder="Qué producto, público, oferta y objetivo quieres trabajar…" /></div></div><div className="actions"><button className="btn" onClick={() => setModal(null)}>Cancel</button><button className="btn primary" onClick={saveDraft}><Plus size={15}/>Save draft</button></div></>}
            {modal === "details" && <><p>Este contenido está generado como borrador editable.</p>{(() => { const latest = drafts[0]; if (!latest) return <div className="empty">No draft available.</div>; return <><div className="notice"><b>{latest.title}</b> · {latest.channel}</div><div className="draft-content">{latest.content}</div><div className="actions"><button className="btn" onClick={() => void copyDraft(latest.content)}><Copy size={15}/>{copied ? "Copied" : "Copy"}</button><button className="btn primary" onClick={() => setModal(null)}>Done</button></div></>; })()}</>}
            {modal === "seo" && <><p>El módulo de SEO ya funciona como espacio operativo y usa los datos reales disponibles en Search Console cuando estén conectados.</p><div className="notice"><b>Checklist JQYD</b><br/>1. Verificar Search Console y sitemap.<br/>2. Revisar consultas con impresiones pero pocos clics.<br/>3. Mejorar títulos/descripciones de páginas con oportunidad.<br/>4. Enlazar productos y colecciones desde contenido relevante.<br/>5. Medir cambios durante 7/30/90 días.</div><div className="actions"><button className="btn primary" onClick={() => openBuilder("Google", "SEO growth campaign · JQYD")}>Create SEO campaign</button></div></>}
            {modal === "Google" && <><p>Google ya está conectado a nivel de código. Search Console y GA4 leerán datos reales automáticamente cuando la cuenta de servicio tenga permisos y las variables de Vercel estén configuradas.</p><div className="notice"><b>Search Console:</b> {gsc?.connected ? "Connected" : "Needs property access"}<br/><b>GA4:</b> {ga?.configured ? `Configured · ${ga.propertyId}` : "Needs property ID + property access"}</div><div className="actions"><button className="btn" onClick={() => void load()}><RefreshCw size={15}/>Check again</button><button className="btn primary" onClick={() => setModal(null)}>Close</button></div></>}
            {modal !== "builder" && modal !== "details" && modal !== "seo" && modal !== "Google" && <><p>{modal} está preparado como workspace de campañas. La publicación automática queda bloqueada hasta que configuremos las credenciales OAuth/API correspondientes.</p><div className="notice"><b>Current state:</b> Workspace ready. Puedes crear y guardar borradores ahora mismo.</div><div className="actions"><button className="btn primary" onClick={() => openBuilder(modal, `${modal} campaign · JQYD`)}>Create draft</button></div></>}
        </div></div>}
    </div>;
}

export default AdminMarketing;
