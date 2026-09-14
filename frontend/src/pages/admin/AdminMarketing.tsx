import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3, CheckCircle2, Clock3, Copy, Image, Mail, Megaphone, MessageCircle, MousePointer2, Play, Plus, RefreshCw, Search, Sparkles, TrendingUp, Users, Video, X, Link2, Send, Unplug, Loader2 } from "lucide-react";
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
interface SearchMetrics { clicks: number; impressions: number; ctr: number; position: number; count: number; }
type ChannelName = "Google" | "Facebook" | "Instagram" | "TikTok" | "YouTube" | "Pinterest" | "WhatsApp" | "Email";
type SocialChannel = "facebook" | "instagram" | "tiktok" | "youtube" | "pinterest" | "whatsapp";
type Draft = { id: string; title: string; channel: ChannelName; brief: string; content: string; createdAt: string };
type Channel = { name: ChannelName; detail: string; icon: LucideIcon; tone: string; social?: SocialChannel; provider?: "meta" | "tiktok" | "youtube" | "pinterest" };
interface SocialProfile { [key: string]: any; }
interface SocialConnection { connected: boolean; profile?: SocialProfile; expiresAt?: string | null; updatedAt?: string; }
interface SocialState { configured?: Record<string, boolean>; connected?: Record<string, SocialConnection>; channels?: Record<SocialChannel, boolean>; }
interface PublishResult { ok: boolean; id?: string; account?: string; error?: string; }

const channels: Channel[] = [
    { name: "Google", detail: "Search & Analytics", icon: Search, tone: "#4285F4" },
    { name: "Facebook", detail: "Pages & publishing", icon: MessageCircle, tone: "#1877F2", social: "facebook", provider: "meta" },
    { name: "Instagram", detail: "Posts & Reels", icon: Image, tone: "#E1306C", social: "instagram", provider: "meta" },
    { name: "TikTok", detail: "Short-form video", icon: Video, tone: "#e5e7eb", social: "tiktok", provider: "tiktok" },
    { name: "YouTube", detail: "Video publishing", icon: Play, tone: "#FF0000", social: "youtube", provider: "youtube" },
    { name: "Pinterest", detail: "Pins & products", icon: Image, tone: "#BD081C", social: "pinterest", provider: "pinterest" },
    { name: "WhatsApp", detail: "Business messaging", icon: MessageCircle, tone: "#25D366", social: "whatsapp", provider: "meta" },
    { name: "Email", detail: "Newsletters & offers", icon: Mail, tone: "#4F83CC" },
];
const socialChannels: Channel[] = channels.filter(c => c.social);
const DRAFTS_KEY = "jqyd-marketing-drafts-v1";

function readDrafts(): Draft[] { try { const raw = localStorage.getItem(DRAFTS_KEY); const value = raw ? JSON.parse(raw) : []; return Array.isArray(value) ? value : []; } catch { return []; } }
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
    const [social, setSocial] = useState<SocialState>({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [socialLoading, setSocialLoading] = useState(false);
    const [busyProvider, setBusyProvider] = useState<string | null>(null);
    const [modal, setModal] = useState<"builder" | "details" | "seo" | "composer" | "Google" | null>(null);
    const [selectedChannel, setSelectedChannel] = useState<ChannelName>("Instagram");
    const [title, setTitle] = useState("");
    const [brief, setBrief] = useState("");
    const [drafts, setDrafts] = useState<Draft[]>([]);
    const [copied, setCopied] = useState(false);
    const [selectedSocial, setSelectedSocial] = useState<SocialChannel[]>([]);
    const [publishText, setPublishText] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [link, setLink] = useState("https://jqydesigns.com");
    const [whatsappTo, setWhatsappTo] = useState("");
    const [publishing, setPublishing] = useState(false);
    const [publishResults, setPublishResults] = useState<Record<string, PublishResult>>({});
    const [notice, setNotice] = useState("");

    useEffect(() => setDrafts(readDrafts()), []);
    useEffect(() => localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts)), [drafts]);

    const loadSocial = useCallback(async () => {
        try {
            setSocialLoading(true);
            const value = await apiRequest<SocialState>("/api/admin/marketing/social/");
            setSocial(value);
            const available = socialChannels.map(c => c.social!).filter(name => Boolean(value.channels?.[name]));
            setSelectedSocial(available);
        } catch (error) { setNotice(error instanceof Error ? error.message : "Unable to load social connections."); }
        finally { setSocialLoading(false); }
    }, []);

    const load = useCallback(async () => {
        try {
            setRefreshing(true);
            const end = new Date(); const start = new Date(); start.setDate(end.getDate() - Number(range) + 1);
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

    useEffect(() => { void load(); void loadSocial(); }, [load, loadSocial]);
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const result = params.get("social");
        if (result === "connected") { setNotice(`Cuenta ${params.get("provider") || "social"} conectada correctamente.`); void loadSocial(); window.history.replaceState({}, "", window.location.pathname); }
        if (result === "error") { setNotice(params.get("message") || "La conexión social no pudo completarse."); window.history.replaceState({}, "", window.location.pathname); }
    }, [loadSocial]);

    const salesMetrics = useMemo(() => { const d = sales?.daily || []; return { orders: d.reduce((a, x) => a + Number(x.orders || 0), 0), revenue: d.reduce((a, x) => a + Number(x.revenue || 0), 0) }; }, [sales]);
    const searchMetrics = useMemo<SearchMetrics>(() => gscRows.reduce<SearchMetrics>((a, x) => ({ clicks: a.clicks + Number(x.clicks || 0), impressions: a.impressions + Number(x.impressions || 0), ctr: a.ctr + Number(x.ctr || 0), position: a.position + Number(x.position || 0), count: a.count + 1 }), { clicks: 0, impressions: 0, ctr: 0, position: 0, count: 0 }), [gscRows]);
    const gaMetrics = useMemo(() => gaRows.reduce((a, x) => { const m = x.metricValues || []; return { users: a.users + Number(m[0]?.value || 0), sessions: a.sessions + Number(m[1]?.value || 0), views: a.views + Number(m[2]?.value || 0), revenue: a.revenue + Number(m[3]?.value || 0) }; }, { users: 0, sessions: 0, views: 0, revenue: 0 }), [gaRows]);
    const chart = useMemo(() => { const d = sales?.daily || []; if (!d.length) return "0,100 100,100 200,100 300,100"; const max = Math.max(...d.map(x => Number(x.revenue || 0)), 1); return d.map((x, i) => `${(d.length === 1 ? 150 : (i / (d.length - 1)) * 300).toFixed(1)},${(100 - (Number(x.revenue || 0) / max) * 82).toFixed(1)}`).join(" "); }, [sales]);

    const openBuilder = (channel: ChannelName = selectedChannel, preset = "") => { setSelectedChannel(channel); setTitle(preset || `${channel} campaign · JQYD`); setBrief(""); setModal("builder"); };
    const saveDraft = () => { const draftTitle = title.trim() || `${selectedChannel} campaign · JQYD`; const draft: Draft = { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, title: draftTitle, channel: selectedChannel, brief: brief.trim(), content: buildDraft(selectedChannel, draftTitle, brief), createdAt: new Date().toISOString() }; setDrafts(current => [draft, ...current].slice(0, 50)); setModal("details"); };
    const copyDraft = async (content: string) => { try { await navigator.clipboard.writeText(content); setCopied(true); window.setTimeout(() => setCopied(false), 1500); } catch {} };

    const socialConnected = (channel: Channel) => channel.social ? Boolean(social.channels?.[channel.social]) : channel.name === "Google" ? Boolean(gsc?.connected || ga?.configured) : false;
    const socialAccountName = (channel: Channel) => {
        if (!channel.social) return channel.name === "Google" ? (ga?.propertyId ? `GA4 ${ga.propertyId}` : "Search & Analytics") : "Workspace";
        const provider = channel.provider ? social.connected?.[channel.provider] : undefined;
        const profile = provider?.profile || {};
        if (channel.social === "facebook") return profile.pages?.[0]?.name || profile.name || "Facebook Page";
        if (channel.social === "instagram") return profile.instagram?.[0]?.username || profile.instagram?.[0]?.name || "Instagram account";
        if (channel.social === "whatsapp") return profile.whatsapp?.[0]?.verified_name || profile.whatsapp?.[0]?.display_phone_number || "WhatsApp Business";
        if (channel.social === "tiktok") return profile.display_name || profile.username || "TikTok account";
        if (channel.social === "youtube") return profile.snippet?.title || "YouTube channel";
        return profile.username || profile.business_name || "Pinterest account";
    };

    const connectSocial = async (channel: Channel) => {
        if (!channel.provider) return;
        try {
            setBusyProvider(channel.provider);
            const result = await apiRequest<{ url: string }>(`/api/admin/marketing/social/${channel.provider}/authorize`);
            window.location.href = result.url;
        } catch (error) { setNotice(error instanceof Error ? error.message : "No se pudo iniciar la conexión."); setBusyProvider(null); }
    };
    const disconnectSocial = async (channel: Channel) => {
        if (!channel.provider) return;
        try { setBusyProvider(channel.provider); await apiRequest(`/api/admin/marketing/social/${channel.provider}`, { method: "DELETE" }); setNotice(`${channel.provider} desconectado.`); await loadSocial(); }
        catch (error) { setNotice(error instanceof Error ? error.message : "No se pudo desconectar."); }
        finally { setBusyProvider(null); }
    };
    const toggleSocial = (name: SocialChannel) => setSelectedSocial(current => current.includes(name) ? current.filter(x => x !== name) : [...current, name]);
    const openComposer = () => { const connectedChannels = socialChannels.map(c => c.social!).filter(Boolean).filter(name => Boolean(social.channels?.[name])); setSelectedSocial(connectedChannels); setPublishResults({}); setPublishText(brief || ""); setModal("composer"); };
    const publish = async () => {
        if (!selectedSocial.length || !publishText.trim()) { setNotice("Selecciona al menos un canal conectado y escribe el mensaje."); return; }
        try {
            setPublishing(true); setPublishResults({});
            const response = await apiRequest<{ results: Record<string, PublishResult> }>("/api/admin/marketing/social/publish", { method: "POST", body: JSON.stringify({ channels: selectedSocial, text: publishText.trim(), imageUrl: imageUrl.trim() || undefined, link: link.trim() || undefined, whatsappTo: whatsappTo.trim() || undefined }) });
            setPublishResults(response.results || {});
        } catch (error) { setNotice(error instanceof Error ? error.message : "No se pudo publicar la campaña."); }
        finally { setPublishing(false); }
    };

    return <div className="marketing-page"><style>{`
        .marketing-page{min-height:100vh;background:#07101d;color:#f8fafc;font-family:Inter,system-ui,sans-serif}.marketing-main{margin-left:270px;padding:24px 26px 42px;max-width:1600px}.hero,.card,.stat{background:#0d1929;border:1px solid #26364e;border-radius:14px}.hero{padding:28px 32px;background:linear-gradient(115deg,#25105d,#0b1729 58%,#10243b)}.eyebrow{font-size:11px;letter-spacing:.08em;color:#e3b8ff;font-weight:800}.hero h1{font-size:38px;margin:8px 0}.hero h1 span{color:#c46cff}.hero p{color:#cbd5e1;max-width:900px;line-height:1.5}.actions{display:flex;gap:9px;margin-top:16px;flex-wrap:wrap}.btn{border:1px solid #50617d;border-radius:9px;background:#111f33;color:#fff;padding:10px 14px;font-weight:700;display:inline-flex;align-items:center;gap:7px;cursor:pointer}.btn:disabled{opacity:.55;cursor:not-allowed}.primary{border-color:#8a42ff;background:linear-gradient(135deg,#7d24ff,#24a8ef)}.stats{display:grid;grid-template-columns:repeat(4,1fr) 180px;gap:9px;margin:12px 0}.stat{padding:14px}.stat-top{display:flex;justify-content:space-between;color:#9eacc0;font-size:11px}.stat strong{display:block;font-size:23px;margin:6px 0}.stat small{color:#54e889;font-weight:700}.range{display:flex;align-items:center;justify-content:center;gap:6px}.select,.input,.textarea{background:#0d1929;border:1px solid #41536d;color:#fff;border-radius:8px;padding:9px}.section{margin-top:14px}.section-title{padding:0 2px 9px}.section-title h2{font-size:18px;margin:0}.section-title p{font-size:12px;color:#9eacc0;margin:4px 0}.integration{display:grid;grid-template-columns:1fr 1fr;gap:10px}.integration-card{padding:14px}.integration-head{display:flex;align-items:center;justify-content:space-between}.integration-head h3{margin:0;font-size:15px}.integration p{font-size:11px;color:#9eacc0;line-height:1.45;min-height:31px}.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}.metric{background:#111f33;border:1px solid #24364f;border-radius:9px;padding:9px}.metric b{display:block;font-size:16px}.metric span{font-size:9px;color:#8492a5}.channels{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.channel{padding:15px 10px;text-align:left;cursor:pointer;color:#fff;position:relative}.channel-top{display:flex;align-items:center;justify-content:space-between}.channel-icon{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;background:#14243a}.channel strong{display:block;font-size:14px;margin-top:10px}.channel small{display:block;color:#8292a8;font-size:10px;margin-top:3px}.status{display:inline-flex;align-items:center;gap:5px;margin-top:9px;border-radius:999px;padding:5px 8px;background:#1b2a3e;color:#b9c6d6;font-size:9px}.status.connected{color:#54e889;background:#103326}.status button{border:0;background:transparent;color:inherit;cursor:pointer;padding:0;font-size:9px}.account{display:block;color:#d7e0eb;font-size:10px;margin-top:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.quick{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}.quick button{padding:13px;text-align:left;cursor:pointer;color:#fff}.quick strong{font-size:11px}.quick small{display:block;color:#8391a5;font-size:9px;margin-top:3px}.bottom{display:grid;grid-template-columns:1.2fr .9fr .9fr;gap:10px}.panel{padding:14px}.head{display:flex;justify-content:space-between;align-items:center;gap:10px}.head h3{margin:0;font-size:15px}.chart{height:180px;margin-top:10px;border:1px solid #1e2c40;border-radius:9px}.chart svg{width:100%;height:100%}.empty{padding:25px;text-align:center;color:#7f8da1;font-size:11px}.campaign{padding:10px;border:1px solid #1f2d42;border-radius:9px;margin:7px 0;font-size:11px;background:#0d1929;color:#fff;text-align:left;width:100%;cursor:pointer}.campaign strong{display:block;margin-bottom:3px}.campaign span{color:#8795a9}.assistant{background:#10172b}.assistant textarea{width:100%;min-height:90px;box-sizing:border-box;background:#171f3b;border:1px solid #5946bb;border-radius:9px;color:#fff;padding:9px;resize:vertical}.modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.72);z-index:100;display:grid;place-items:center;padding:16px}.modal{width:min(760px,100%);max-height:92vh;overflow:auto;box-sizing:border-box;background:#0d1929;border:1px solid #344967;border-radius:15px;padding:20px}.modal-head{display:flex;justify-content:space-between;align-items:center;gap:12px}.modal h2{margin:0;font-size:20px}.close{background:none;border:0;color:#aab8ca;cursor:pointer}.modal p{color:#aeb9c8;font-size:12px;line-height:1.55}.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.field{display:flex;flex-direction:column;gap:5px}.field.full{grid-column:1/-1}.field label{font-size:10px;color:#8e9caf;font-weight:700}.textarea{min-height:100px;resize:vertical}.draft-content{white-space:pre-wrap;background:#111f33;border:1px solid #24364f;border-radius:9px;padding:12px;font-size:12px;line-height:1.55}.notice{padding:10px;border:1px solid #3a4b64;border-radius:9px;background:#101d30;color:#aeb9c8;font-size:11px;line-height:1.45}.composer-grid{display:grid;grid-template-columns:1fr 1.4fr;gap:14px}.checks{display:grid;gap:7px}.check{display:flex;align-items:center;gap:9px;padding:10px;border:1px solid #26364e;border-radius:9px;background:#101d30;cursor:pointer}.check.selected{border-color:#6549b7;background:#171b35}.check input{accent-color:#8a42ff}.result{padding:9px;border-radius:8px;margin-top:7px;border:1px solid #26364e;font-size:10px}.result.ok{border-color:#1d7047;background:#0d2a1d;color:#8ff0b5}.result.fail{border-color:#6c3131;background:#2a1212;color:#ffaaaa}.provider-note{font-size:9px;color:#8e9caf;margin-top:8px}@media(max-width:1200px){.channels{grid-template-columns:repeat(2,1fr)}.quick{grid-template-columns:repeat(3,1fr)}.bottom,.integration{grid-template-columns:1fr}.stats{grid-template-columns:repeat(2,1fr)}.composer-grid{grid-template-columns:1fr}}@media(max-width:800px){.marketing-main{margin-left:0;padding:15px}.hero h1{font-size:29px}.channels{grid-template-columns:1fr 1fr}.quick{grid-template-columns:1fr 1fr}.stats{grid-template-columns:1fr 1fr}.metrics,.form-grid{grid-template-columns:1fr 1fr}.form-grid .full{grid-column:1/-1}.composer-grid{grid-template-columns:1fr}}
    `}</style>
        <AdminSidebar username="Administrator" />
        <main className="marketing-main">
            <section className="hero"><div className="eyebrow">MARKETING CENTER · JQYD</div><h1>Grow Your Brand <span>Everywhere</span></h1><p>Centro operativo real: conecta tus cuentas oficiales, selecciona los canales que quieras y publica desde un solo lugar. Las credenciales OAuth permanecen en el backend y nunca se muestran en esta pantalla.</p><div className="actions"><button className="btn primary" onClick={openComposer}><Send size={15}/>Create & Publish</button><button className="btn" onClick={() => { void load(); void loadSocial(); }} disabled={refreshing || socialLoading}><RefreshCw size={15}/>Refresh</button></div>{notice && <div className="notice" style={{ marginTop: 12 }}>{notice}</div>}</section>
            <section className="stats"><article className="stat"><div className="stat-top"><span>Visitors</span><MousePointer2 size={17}/></div><strong>{gaMetrics.users ? gaMetrics.users.toLocaleString() : "—"}</strong><small>{ga?.configured ? "Google Analytics 4" : "Connect GA4"}</small></article><article className="stat"><div className="stat-top"><span>Page Views</span><TrendingUp size={17}/></div><strong>{gaMetrics.views ? gaMetrics.views.toLocaleString() : "—"}</strong><small>{ga?.configured ? "Live GA4 data" : "Connect GA4"}</small></article><article className="stat"><div className="stat-top"><span>Orders</span><Users size={17}/></div><strong>{salesMetrics.orders.toLocaleString()}</strong><small>Live order data</small></article><article className="stat"><div className="stat-top"><span>Revenue</span><BarChart3 size={17}/></div><strong>${salesMetrics.revenue.toFixed(2)}</strong><small>Live sales data</small></article><div className="stat range"><Clock3 size={14}/><select className="select" value={range} onChange={e => setRange(e.target.value as "7"|"30"|"90")}><option value="7">7 days</option><option value="30">30 days</option><option value="90">90 days</option></select></div></section>
            <section className="section"><div className="section-title"><h2>Google Integrations</h2><p>Google se considera conectado únicamente cuando Search Console o GA4 están realmente disponibles.</p></div><div className="integration"><article className="card integration-card"><div className="integration-head"><h3>Google Search Console</h3>{gsc?.connected ? <CheckCircle2 className="connected" size={19}/> : <Search size={19}/>}</div><p>{gsc?.connected ? `Connected to ${gsc.siteUrl}` : gsc?.error || "Needs service-account property access"}</p><div className="metrics"><div className="metric"><b>{searchMetrics.clicks.toLocaleString()}</b><span>Clicks</span></div><div className="metric"><b>{searchMetrics.impressions.toLocaleString()}</b><span>Impressions</span></div><div className="metric"><b>{searchMetrics.count ? (searchMetrics.ctr / searchMetrics.count * 100).toFixed(2) : "0.00"}%</b><span>Avg. CTR</span></div><div className="metric"><b>{searchMetrics.count ? (searchMetrics.position / searchMetrics.count).toFixed(1) : "—"}</b><span>Avg. position</span></div></div></article><article className="card integration-card"><div className="integration-head"><h3>Google Analytics 4</h3>{ga?.configured ? <CheckCircle2 className="connected" size={19}/> : <TrendingUp size={19}/>}</div><p>{ga?.configured ? `Property ${ga.propertyId} is configured.` : ga?.error || "Needs property ID + service-account access"}</p><div className="metrics"><div className="metric"><b>{gaMetrics.users.toLocaleString()}</b><span>Active users</span></div><div className="metric"><b>{gaMetrics.sessions.toLocaleString()}</b><span>Sessions</span></div><div className="metric"><b>{gaMetrics.views.toLocaleString()}</b><span>Page views</span></div><div className="metric"><b>${gaMetrics.revenue.toFixed(2)}</b><span>GA revenue</span></div></div></article></div></section>
            <section className="section"><div className="section-title"><div className="head"><div><h2>Connect Your Channels</h2><p>Ahora sí: cada tarjeta consulta el estado real de la integración. Conectar abre el OAuth oficial; al volver, la cuenta aparece aquí.</p></div><button className="btn" onClick={() => void loadSocial()} disabled={socialLoading}><RefreshCw size={14}/></button></div></div><div className="channels">{channels.map(channel => { const Icon = channel.icon; const isConnected = socialConnected(channel); const configured = channel.provider ? Boolean(social.configured?.[channel.provider]) : channel.name === "Google" ? Boolean(gsc?.connected || ga?.configured) : true; return <article className="card channel" key={channel.name}><div className="channel-top"><span className="channel-icon" style={{ color: channel.tone }}><Icon size={21}/></span>{isConnected && <CheckCircle2 className="connected" size={18}/>}</div><strong>{channel.name}</strong><small>{channel.detail}</small>{isConnected ? <><span className="status connected"><CheckCircle2 size={11}/>Connected</span><span className="account">{socialAccountName(channel)}</span>{channel.provider && <button className="btn" style={{ marginTop: 8, padding: "6px 8px", fontSize: 9 }} onClick={() => void disconnectSocial(channel)} disabled={busyProvider === channel.provider}><Unplug size={11}/>{busyProvider === channel.provider ? "..." : "Disconnect"}</button>}</> : channel.name === "Google" ? <span className="status">{configured ? "Analytics ready" : "Needs configuration"}</span> : channel.name === "Email" ? <span className="status">Managed separately</span> : <button className="btn primary" style={{ marginTop: 9, padding: "7px 10px", fontSize: 10 }} onClick={() => void connectSocial(channel)} disabled={!configured || Boolean(busyProvider)}>{busyProvider === channel.provider ? <Loader2 size={12}/> : <Link2 size={12}/>} {configured ? "Connect official account" : "Configure integration"}</button>}</article>; })}</div></section>
            <section className="section"><div className="section-title"><h2>Central Publisher</h2><p>Selecciona todas las cuentas conectadas o solo las que necesites. Cada canal devuelve su propio resultado.</p></div><article className="card panel"><div className="head"><div><h3>One campaign · Multiple channels</h3><p style={{ margin: "5px 0 0" }}>No hay cuentas codificadas. Solo aparecen como publicables después de una autorización real.</p></div><button className="btn primary" onClick={openComposer}><Send size={15}/>Open publisher</button></div></article></section>
            <section className="section"><div className="section-title"><h2>Quick Actions</h2><p>Herramientas de trabajo que no publican nada sin tu confirmación.</p></div><div className="quick">{[["SEO Optimization","SEO"],["Promote a Product","Instagram"],["Generate Content","Facebook"],["Run Ads","Google"],["WhatsApp Campaign","WhatsApp"],["Email Campaign","Email"]].map(([label, channel]) => <button className="card" key={label} onClick={() => channel === "SEO" ? setModal("seo") : openBuilder(channel as ChannelName, `${label} · JQYD`)}><strong>{label}</strong><small>{channel === "SEO" ? "Run an actionable SEO check" : "Create campaign draft"}</small></button>)}</div></section>
            <section className="section bottom"><article className="card panel"><div className="head"><div><span>MARKETING PERFORMANCE</span><h3>Revenue performance</h3></div><BarChart3 size={17}/></div><div className="chart">{loading ? <div className="empty">Loading…</div> : <svg viewBox="0 0 300 120" preserveAspectRatio="none"><g stroke="#1e2c40" strokeWidth="1"><line x1="0" y1="18" x2="300" y2="18"/><line x1="0" y1="59" x2="300" y2="59"/><line x1="0" y1="100" x2="300" y2="100"/></g><polyline fill="none" stroke="#7d6cff" strokeWidth="2.5" points={chart}/></svg>}</div></article><article className="card panel"><div className="head"><h3>Saved Drafts</h3><span>{drafts.length}</span></div>{drafts.length ? drafts.slice(0, 6).map(d => <button className="campaign" key={d.id} onClick={() => { setTitle(d.title); setSelectedChannel(d.channel); setBrief(d.brief); setModal("details"); }}><strong>{d.title}</strong><span>{d.channel} · {new Date(d.createdAt).toLocaleDateString()}</span></button>) : <div className="empty">No campaign drafts yet.</div>}</article><article className="card panel assistant"><div className="head"><h3>AI Campaign Assistant</h3><Sparkles size={17}/></div><p>Describe what you want to promote. The assistant creates editable copy; it never publishes automatically.</p><textarea value={brief} onChange={e => setBrief(e.target.value)} placeholder="Ejemplo: promoción de tazas personalizadas para el Día de la Madre"/><div className="actions"><button className="btn primary" onClick={() => { setSelectedChannel("Instagram"); setTitle("AI campaign · JQYD"); setModal("builder"); }}><Plus size={15}/>Build draft</button></div></article></section>
        </main>
        {modal && <div className="modal-bg" onClick={() => setModal(null)}><div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head"><h2>{modal === "builder" ? "Campaign Builder" : modal === "details" ? "Campaign Draft" : modal === "seo" ? "SEO Workspace" : modal === "composer" ? "Publish to connected channels" : "Google Integrations"}</h2><button className="close" onClick={() => setModal(null)}><X size={18}/></button></div>
            {modal === "composer" && <><p>Elige los canales conectados. El sistema no inventa cuentas: solo publica en las autorizadas.</p><div className="composer-grid"><div><div className="checks">{socialChannels.map(channel => { const name = channel.social!; const checked = selectedSocial.includes(name); const available = Boolean(social.channels?.[name]); return <label className={`check ${checked ? "selected" : ""}`} key={name}><input type="checkbox" checked={checked} disabled={!available} onChange={() => toggleSocial(name)}/><span><b>{channel.name}</b><br/><small>{available ? socialAccountName(channel) : "Not connected"}</small></span></label>; })}</div><div className="provider-note">Facebook, Instagram y WhatsApp usan la autorización Meta. Los demás usan su propio OAuth.</div></div><div><div className="field"><label>MESSAGE / CAPTION</label><textarea className="textarea" value={publishText} onChange={e => setPublishText(e.target.value)} placeholder="Escribe una publicación para tus canales conectados…"/></div><div className="form-grid" style={{ marginTop: 10 }}><div className="field"><label>IMAGE URL · Instagram/Pinterest</label><input className="input" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://.../imagen.jpg"/></div><div className="field"><label>LINK</label><input className="input" value={link} onChange={e => setLink(e.target.value)} placeholder="https://jqydesigns.com"/></div><div className="field full"><label>WHATSAPP RECIPIENT · required for WhatsApp</label><input className="input" value={whatsappTo} onChange={e => setWhatsappTo(e.target.value)} placeholder="+1XXXXXXXXXX"/></div></div><div className="actions"><button className="btn" onClick={() => setModal(null)}>Cancel</button><button className="btn primary" onClick={() => void publish()} disabled={publishing || !selectedSocial.length}>{publishing ? <Loader2 size={15}/> : <Send size={15}/>} {publishing ? "Publishing…" : `Publish to ${selectedSocial.length} channel${selectedSocial.length === 1 ? "" : "s"}`}</button></div>{Object.entries(publishResults).map(([name, result]) => <div className={`result ${result.ok ? "ok" : "fail"}`} key={name}><b>{name}</b> · {result.ok ? `Published${result.account ? ` to ${result.account}` : ""}` : result.error || "Failed"}</div>)}</div></div></>}
            {modal === "builder" && <><p>Configura el borrador. Guardarlo no publica nada.</p><div className="form-grid"><div className="field"><label>CHANNEL</label><select className="select" value={selectedChannel} onChange={e => setSelectedChannel(e.target.value as ChannelName)}>{channels.map(c => <option key={c.name}>{c.name}</option>)}</select></div><div className="field"><label>CAMPAIGN NAME</label><input className="input" value={title} onChange={e => setTitle(e.target.value)} /></div><div className="field full"><label>BRIEF / OFFER</label><textarea className="textarea" value={brief} onChange={e => setBrief(e.target.value)} placeholder="Qué producto, público, oferta y objetivo quieres trabajar…" /></div></div><div className="actions"><button className="btn" onClick={() => setModal(null)}>Cancel</button><button className="btn primary" onClick={saveDraft}><Plus size={15}/>Save draft</button></div></>}
            {modal === "details" && <><p>Este contenido está generado como borrador editable.</p>{(() => { const latest = drafts[0]; if (!latest) return <div className="empty">No draft available.</div>; return <><div className="notice"><b>{latest.title}</b> · {latest.channel}</div><div className="draft-content">{latest.content}</div><div className="actions"><button className="btn" onClick={() => void copyDraft(latest.content)}><Copy size={15}/>{copied ? "Copied" : "Copy"}</button><button className="btn primary" onClick={() => setModal(null)}>Done</button></div></>; })()}</>}
            {modal === "seo" && <><p>Espacio operativo de SEO usando los datos disponibles en Search Console.</p><div className="notice"><b>Checklist JQYD</b><br/>1. Verificar Search Console y sitemap.<br/>2. Revisar consultas con impresiones pero pocos clics.<br/>3. Mejorar títulos y descripciones con oportunidad.<br/>4. Enlazar productos y colecciones desde contenido relevante.<br/>5. Medir cambios durante 7/30/90 días.</div><div className="actions"><button className="btn primary" onClick={() => openBuilder("Google", "SEO growth campaign · JQYD")}>Create SEO campaign</button></div></>}
            {modal === "Google" && <><p>Google se muestra conectado solo cuando el backend confirma datos reales de Search Console o GA4.</p><div className="notice"><b>Search Console:</b> {gsc?.connected ? "Connected" : "Needs property access"}<br/><b>GA4:</b> {ga?.configured ? `Configured · ${ga.propertyId}` : "Needs property ID + property access"}</div><div className="actions"><button className="btn" onClick={() => void load()}><RefreshCw size={15}/>Check again</button><button className="btn primary" onClick={() => setModal(null)}>Close</button></div></>}
        </div></div>}
    </div>;
}

export default AdminMarketing;