import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3, CheckCircle2, Clock3, Image, Link2, Mail, MessageCircle, MousePointer2, Play, RefreshCw, Search, Send, Sparkles, TrendingUp, Unplug, Users, Video, X, Loader2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { apiRequest } from "../../services/api";
import AdminSidebar from "./AdminSidebar";

interface SalesDay { date: string; orders: number; revenue: string | number; }
interface SalesResponse { daily?: SalesDay[]; }
interface GscRow { clicks?: number; impressions?: number; ctr?: number; position?: number; }
interface GscResponse { connected: boolean; siteUrl?: string; error?: string; }
interface GaStatus { configured: boolean; propertyId?: string | null; error?: string; }
interface GaRow { metricValues?: Array<{ value?: string }> }
interface GaResponse { rows?: GaRow[]; error?: string; }
type SocialChannel = "facebook" | "instagram" | "tiktok" | "youtube" | "pinterest" | "whatsapp";
type ChannelName = "Google" | "Facebook" | "Instagram" | "TikTok" | "YouTube" | "Pinterest" | "WhatsApp" | "Email";
type Channel = { name: ChannelName; detail: string; icon: LucideIcon; tone: string; social?: SocialChannel; provider?: "meta" | "tiktok" | "youtube" | "pinterest" };
interface SocialProfile { [key: string]: any; }
interface SocialConnection { connected: boolean; profile?: SocialProfile; }
interface SocialState { configured?: Record<string, boolean>; connected?: Record<string, SocialConnection>; channels?: Partial<Record<SocialChannel, boolean>>; }
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
const socialChannels = channels.filter(channel => channel.social);

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
    const [modal, setModal] = useState<"composer" | "Google" | null>(null);
    const [selectedSocial, setSelectedSocial] = useState<SocialChannel[]>([]);
    const [publishText, setPublishText] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [link, setLink] = useState("https://jqydesigns.com");
    const [whatsappTo, setWhatsappTo] = useState("");
    const [publishing, setPublishing] = useState(false);
    const [publishResults, setPublishResults] = useState<Record<string, PublishResult>>({});
    const [notice, setNotice] = useState("");

    const loadSocial = useCallback(async () => {
        try {
            setSocialLoading(true);
            const value = await apiRequest<SocialState>("/api/admin/marketing/social/");
            setSocial(value);
            setSelectedSocial(socialChannels.map(channel => channel.social!).filter(name => Boolean(value.channels?.[name])));
        } catch (error) { setNotice(error instanceof Error ? error.message : "No se pudieron cargar las conexiones."); }
        finally { setSocialLoading(false); }
    }, []);

    const load = useCallback(async () => {
        try {
            setRefreshing(true);
            const end = new Date();
            const start = new Date();
            start.setDate(end.getDate() - Number(range) + 1);
            const iso = (date: Date) => date.toISOString().slice(0, 10);
            const [salesResult, gscStatus, gscAnalytics, gaStatus, gaReport] = await Promise.allSettled([
                apiRequest<SalesResponse>(`/api/admin/sales?start=${iso(start)}&end=${iso(end)}`),
                apiRequest<GscResponse>("/api/admin/marketing/search-console/verify"),
                apiRequest<{ rows?: GscRow[] }>(`/api/admin/marketing/search-console/analytics?days=${range}`),
                apiRequest<GaStatus>("/api/admin/marketing/search-console/google-analytics/status"),
                apiRequest<GaResponse>(`/api/admin/marketing/search-console/google-analytics/report?days=${range}`),
            ]);
            if (salesResult.status === "fulfilled") setSales(salesResult.value);
            if (gscStatus.status === "fulfilled") setGsc(gscStatus.value);
            if (gscAnalytics.status === "fulfilled") setGscRows(gscAnalytics.value.rows || []);
            if (gaStatus.status === "fulfilled") setGa(gaStatus.value);
            if (gaReport.status === "fulfilled") setGaRows(gaReport.value.rows || []);
        } finally { setLoading(false); setRefreshing(false); }
    }, [range]);

    useEffect(() => { void load(); void loadSocial(); }, [load, loadSocial]);
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get("social") === "connected") setNotice(`Cuenta ${params.get("provider") || "social"} conectada correctamente.`);
        if (params.get("social") === "error") setNotice(params.get("message") || "La conexión social no pudo completarse.");
        if (params.has("social")) { void loadSocial(); window.history.replaceState({}, "", window.location.pathname); }
    }, [loadSocial]);

    const salesMetrics = useMemo(() => {
        const daily = sales?.daily || [];
        return { orders: daily.reduce((sum, row) => sum + Number(row.orders || 0), 0), revenue: daily.reduce((sum, row) => sum + Number(row.revenue || 0), 0) };
    }, [sales]);
    const searchMetrics = useMemo(() => gscRows.reduce((sum, row) => ({ clicks: sum.clicks + Number(row.clicks || 0), impressions: sum.impressions + Number(row.impressions || 0), ctr: sum.ctr + Number(row.ctr || 0), position: sum.position + Number(row.position || 0), count: sum.count + 1 }), { clicks: 0, impressions: 0, ctr: 0, position: 0, count: 0 }), [gscRows]);
    const gaMetrics = useMemo(() => gaRows.reduce((sum, row) => { const metrics = row.metricValues || []; return { users: sum.users + Number(metrics[0]?.value || 0), sessions: sum.sessions + Number(metrics[1]?.value || 0), views: sum.views + Number(metrics[2]?.value || 0), revenue: sum.revenue + Number(metrics[3]?.value || 0) }; }, { users: 0, sessions: 0, views: 0, revenue: 0 }), [gaRows]);

    const isConnected = (channel: Channel) => channel.social ? Boolean(social.channels?.[channel.social]) : channel.name === "Google" ? Boolean(gsc?.connected || ga?.configured) : false;
    const accountName = (channel: Channel) => {
        if (!channel.social) return channel.name === "Google" ? (ga?.propertyId ? `GA4 ${ga.propertyId}` : "Search & Analytics") : "Managed separately";
        const profile = channel.provider ? social.connected?.[channel.provider]?.profile || {} : {};
        if (channel.social === "facebook") return profile.pages?.[0]?.name || profile.name || "Facebook Page";
        if (channel.social === "instagram") return profile.instagram?.[0]?.username || profile.instagram?.[0]?.name || "Instagram account";
        if (channel.social === "whatsapp") return profile.whatsapp?.[0]?.verified_name || profile.whatsapp?.[0]?.display_phone_number || "WhatsApp Business";
        if (channel.social === "tiktok") return profile.display_name || profile.username || "TikTok account";
        if (channel.social === "youtube") return profile.snippet?.title || "YouTube channel";
        return profile.username || profile.business_name || "Pinterest account";
    };

    const connect = async (channel: Channel) => {
        if (!channel.provider) return;
        try {
            setBusyProvider(channel.provider);
            const result = await apiRequest<{ url: string }>(`/api/admin/marketing/social/${channel.provider}/authorize`);
            window.location.href = result.url;
        } catch (error) { setNotice(error instanceof Error ? error.message : "No se pudo iniciar OAuth."); setBusyProvider(null); }
    };
    const disconnect = async (channel: Channel) => {
        if (!channel.provider) return;
        try { setBusyProvider(channel.provider); await apiRequest(`/api/admin/marketing/social/${channel.provider}`, { method: "DELETE" }); setNotice(`${channel.provider} desconectado.`); await loadSocial(); }
        catch (error) { setNotice(error instanceof Error ? error.message : "No se pudo desconectar."); }
        finally { setBusyProvider(null); }
    };
    const openComposer = () => { setSelectedSocial(socialChannels.map(channel => channel.social!).filter(name => Boolean(social.channels?.[name]))); setPublishResults({}); setModal("composer"); };
    const toggleChannel = (channel: SocialChannel) => setSelectedSocial(current => current.includes(channel) ? current.filter(item => item !== channel) : [...current, channel]);
    const publish = async () => {
        if (!selectedSocial.length || !publishText.trim()) { setNotice("Selecciona al menos un canal conectado y escribe el mensaje."); return; }
        try {
            setPublishing(true); setPublishResults({});
            const response = await apiRequest<{ results: Record<string, PublishResult> }>("/api/admin/marketing/social/publish", { method: "POST", body: JSON.stringify({ channels: selectedSocial, text: publishText.trim(), imageUrl: imageUrl.trim() || undefined, link: link.trim() || undefined, whatsappTo: whatsappTo.trim() || undefined }) });
            setPublishResults(response.results || {});
        } catch (error) { setNotice(error instanceof Error ? error.message : "No se pudo publicar."); }
        finally { setPublishing(false); }
    };

    return <div className="marketing-page"><style>{`
      .marketing-page{min-height:100vh;background:#07101d;color:#f8fafc;font-family:Inter,system-ui,sans-serif}.marketing-main{margin-left:270px;padding:24px 26px 42px;max-width:1600px}.hero,.card,.stat{background:#0d1929;border:1px solid #26364e;border-radius:14px}.hero{padding:28px 32px;background:linear-gradient(115deg,#25105d,#0b1729 58%,#10243b)}.eyebrow{font-size:11px;letter-spacing:.08em;color:#e3b8ff;font-weight:800}.hero h1{font-size:38px;margin:8px 0}.hero h1 span{color:#c46cff}.hero p{color:#cbd5e1;max-width:900px;line-height:1.5}.actions{display:flex;gap:9px;margin-top:16px;flex-wrap:wrap}.btn{border:1px solid #50617d;border-radius:9px;background:#111f33;color:#fff;padding:10px 14px;font-weight:700;display:inline-flex;align-items:center;gap:7px;cursor:pointer}.btn:disabled{opacity:.55;cursor:not-allowed}.primary{border-color:#8a42ff;background:linear-gradient(135deg,#7d24ff,#24a8ef)}.stats{display:grid;grid-template-columns:repeat(4,1fr) 180px;gap:9px;margin:12px 0}.stat{padding:14px}.stat-top{display:flex;justify-content:space-between;color:#9eacc0;font-size:11px}.stat strong{display:block;font-size:23px;margin:6px 0}.stat small{color:#54e889;font-weight:700}.range{display:flex;align-items:center;justify-content:center;gap:6px}.select,.input,.textarea{background:#0d1929;border:1px solid #41536d;color:#fff;border-radius:8px;padding:10px}.section{margin-top:18px}.section-title{padding:0 2px 9px}.section-title h2{font-size:19px;margin:0}.section-title p{font-size:12px;color:#9eacc0;margin:5px 0}.integration{display:grid;grid-template-columns:1fr 1fr;gap:10px}.integration-card{padding:15px}.integration-head{display:flex;align-items:center;justify-content:space-between}.integration-head h3{margin:0;font-size:15px}.integration p{font-size:11px;color:#9eacc0;line-height:1.45}.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}.metric{background:#111f33;border:1px solid #24364f;border-radius:9px;padding:9px}.metric b{display:block;font-size:16px}.metric span{font-size:9px;color:#8492a5}.channels{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.channel{padding:15px;position:relative}.channel-top{display:flex;align-items:center;justify-content:space-between}.channel-icon{width:44px;height:44px;border-radius:12px;display:grid;place-items:center;background:#14243a}.channel strong{display:block;font-size:15px;margin-top:10px}.channel small{display:block;color:#8292a8;font-size:10px;margin-top:3px}.status{display:inline-flex;align-items:center;gap:5px;margin-top:9px;border-radius:999px;padding:5px 8px;background:#1b2a3e;color:#b9c6d6;font-size:9px}.status.connected{color:#54e889;background:#103326}.account{display:block;color:#d7e0eb;font-size:10px;margin-top:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.notice{padding:10px;border:1px solid #3a4b64;border-radius:9px;background:#101d30;color:#aeb9c8;font-size:11px;line-height:1.45;margin-top:12px}.composer-grid{display:grid;grid-template-columns:1fr 1.4fr;gap:14px}.checks{display:grid;gap:7px}.check{display:flex;align-items:center;gap:9px;padding:10px;border:1px solid #26364e;border-radius:9px;background:#101d30;cursor:pointer}.check.selected{border-color:#6549b7;background:#171b35}.check input{accent-color:#8a42ff}.result{padding:9px;border-radius:8px;margin-top:7px;border:1px solid #26364e;font-size:10px}.result.ok{border-color:#1d7047;background:#0d2a1d;color:#8ff0b5}.result.fail{border-color:#6c3131;background:#2a1212;color:#ffaaaa}.modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.72);z-index:100;display:grid;place-items:center;padding:16px}.modal{width:min(760px,100%);max-height:92vh;overflow:auto;background:#0d1929;border:1px solid #344967;border-radius:15px;padding:20px}.modal-head{display:flex;justify-content:space-between;align-items:center}.close{background:none;border:0;color:#aab8ca;cursor:pointer}.modal h2{margin:0}.field{display:flex;flex-direction:column;gap:5px;margin-bottom:10px}.field label{font-size:10px;color:#8e9caf;font-weight:700}.textarea{min-height:130px;resize:vertical}.quick{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.quick .card{padding:15px}.quick strong{display:block;font-size:12px;margin-top:7px}.quick small{display:block;color:#8391a5;font-size:10px;margin-top:4px}@media(max-width:1200px){.channels{grid-template-columns:repeat(2,1fr)}.quick{grid-template-columns:repeat(2,1fr)}.stats{grid-template-columns:repeat(2,1fr)}.composer-grid{grid-template-columns:1fr}}@media(max-width:800px){.marketing-main{margin-left:0;padding:15px}.hero h1{font-size:29px}.channels{grid-template-columns:1fr 1fr}.stats{grid-template-columns:1fr 1fr}.metrics{grid-template-columns:1fr 1fr}}
    `}</style>
      <AdminSidebar username="Administrator" />
      <main className="marketing-main">
        <section className="hero"><div className="eyebrow">MARKETING CENTER · JQYD</div><h1>Grow Your Brand <span>Everywhere</span></h1><p>Centro operativo real para conectar las cuentas oficiales de JQYD y publicar campañas desde un solo lugar. Las credenciales OAuth permanecen protegidas en el backend.</p><div className="actions"><button className="btn primary" onClick={openComposer}><Send size={15}/>Create & Publish</button><button className="btn" onClick={() => { void load(); void loadSocial(); }} disabled={loading || refreshing || socialLoading}><RefreshCw size={15}/>Refresh</button></div>{notice && <div className="notice">{notice}</div>}</section>
        <section className="stats"><article className="stat"><div className="stat-top"><span>Visitors</span><MousePointer2 size={17}/></div><strong>{gaMetrics.users.toLocaleString()}</strong><small>{ga?.configured ? "Google Analytics 4" : "Connect GA4"}</small></article><article className="stat"><div className="stat-top"><span>Page Views</span><TrendingUp size={17}/></div><strong>{gaMetrics.views.toLocaleString()}</strong><small>{ga?.configured ? "Live GA4 data" : "Connect GA4"}</small></article><article className="stat"><div className="stat-top"><span>Orders</span><Users size={17}/></div><strong>{salesMetrics.orders.toLocaleString()}</strong><small>Live order data</small></article><article className="stat"><div className="stat-top"><span>Revenue</span><BarChart3 size={17}/></div><strong>${salesMetrics.revenue.toFixed(2)}</strong><small>Live sales data</small></article><div className="stat range"><Clock3 size={14}/><select className="select" value={range} onChange={event => setRange(event.target.value as "7"|"30"|"90")}><option value="7">7 days</option><option value="30">30 days</option><option value="90">90 days</option></select></div></section>
        <section className="section"><div className="section-title"><h2>Google Integrations</h2><p>Google solo aparece como conectado cuando los servicios reales responden.</p></div><div className="integration"><article className="card integration-card"><div className="integration-head"><h3>Google Search Console</h3>{gsc?.connected && <CheckCircle2 className="status connected" size={18}/>}</div><p>{gsc?.connected ? `Connected to ${gsc.siteUrl}` : gsc?.error || "Needs service-account property access"}</p><div className="metrics"><div className="metric"><b>{searchMetrics.clicks.toLocaleString()}</b><span>Clicks</span></div><div className="metric"><b>{searchMetrics.impressions.toLocaleString()}</b><span>Impressions</span></div><div className="metric"><b>{searchMetrics.count ? (searchMetrics.ctr / searchMetrics.count * 100).toFixed(2) : "0.00"}%</b><span>Avg. CTR</span></div><div className="metric"><b>{searchMetrics.count ? (searchMetrics.position / searchMetrics.count).toFixed(1) : "—"}</b><span>Avg. position</span></div></div></article><article className="card integration-card"><div className="integration-head"><h3>Google Analytics 4</h3>{ga?.configured && <CheckCircle2 className="status connected" size={18}/>}</div><p>{ga?.configured ? `Property ${ga.propertyId} is configured.` : ga?.error || "Needs property ID + service-account access"}</p><div className="metrics"><div className="metric"><b>{gaMetrics.users.toLocaleString()}</b><span>Active users</span></div><div className="metric"><b>{gaMetrics.sessions.toLocaleString()}</b><span>Sessions</span></div><div className="metric"><b>{gaMetrics.views.toLocaleString()}</b><span>Page views</span></div><div className="metric"><b>${gaMetrics.revenue.toFixed(2)}</b><span>GA revenue</span></div></div></article></div></section>
        <section className="section"><div className="section-title"><div className="integration-head"><div><h2>Connect Your Channels</h2><p>Conecta la cuenta oficial que realmente administra cada canal. Nada está hardcodeado.</p></div><button className="btn" onClick={() => void loadSocial()} disabled={socialLoading}><RefreshCw size={14}/></button></div></div><div className="channels">{channels.map(channel => { const Icon = channel.icon; const connected = isConnected(channel); const configured = channel.provider ? Boolean(social.configured?.[channel.provider]) : channel.name === "Google" ? Boolean(gsc?.connected || ga?.configured) : true; return <article className="card channel" key={channel.name}><div className="channel-top"><span className="channel-icon" style={{ color: channel.tone }}><Icon size={21}/></span>{connected && <CheckCircle2 className="connected" size={18}/>}</div><strong>{channel.name}</strong><small>{channel.detail}</small>{connected ? <><span className="status connected"><CheckCircle2 size={11}/>Connected</span><span className="account">{accountName(channel)}</span>{channel.provider && <button className="btn" style={{ marginTop: 8, padding: "6px 8px", fontSize: 9 }} onClick={() => void disconnect(channel)} disabled={busyProvider === channel.provider}><Unplug size={11}/>Disconnect</button>}</> : channel.name === "Google" ? <span className="status">{configured ? "Analytics ready" : "Needs configuration"}</span> : channel.name === "Email" ? <span className="status">Managed separately</span> : <button className="btn primary" style={{ marginTop: 9, padding: "7px 10px", fontSize: 10 }} onClick={() => void connect(channel)} disabled={!configured || Boolean(busyProvider)}>{busyProvider === channel.provider ? <Loader2 size={12}/> : <Link2 size={12}/>} {configured ? "Connect official account" : "Not configured"}</button>}</article>; })}</div></section>
        <section className="section"><div className="section-title"><h2>Central Publisher</h2><p>Selecciona todos los canales conectados o solamente los que quieras usar.</p></div><article className="card" style={{ padding: 16 }}><div className="actions" style={{ marginTop: 0 }}><button className="btn primary" onClick={openComposer}><Send size={15}/>Open Publisher</button><span className="status connected">{selectedSocial.length} connected channel{selectedSocial.length === 1 ? "" : "s"} selected</span></div></article></section>
        <section className="section"><div className="quick"><article className="card"><Sparkles size={18}/><strong>AI Campaign Assistant</strong><small>Use the central publisher to prepare campaign copy.</small></article><article className="card"><Search size={18}/><strong>SEO</strong><small>Search Console metrics remain in the Google integration.</small></article><article className="card"><Image size={18}/><strong>Creative</strong><small>Instagram and Pinterest can use an image URL.</small></article><article className="card"><MessageCircle size={18}/><strong>WhatsApp</strong><small>Messaging requires a recipient number.</small></article></div></section>
      </main>
      {modal && <div className="modal-bg" onClick={() => setModal(null)}><div className="modal" onClick={event => event.stopPropagation()}><div className="modal-head"><h2>{modal === "composer" ? "Central Publisher" : "Google Integrations"}</h2><button className="close" onClick={() => setModal(null)}><X size={18}/></button></div>{modal === "Google" && <><p>Google se marca conectado solamente cuando Search Console o GA4 están disponibles.</p><div className="notice">Search Console: {gsc?.connected ? "Connected" : "Needs access"}<br/>GA4: {ga?.configured ? `Configured · ${ga.propertyId}` : "Needs configuration"}</div></>}{modal === "composer" && <><p>Una campaña puede enviarse a todos los canales conectados. Cada plataforma devuelve su propio resultado.</p><div className="composer-grid"><div><div className="field"><label>CHANNELS</label></div><div className="checks">{socialChannels.map(channel => { const name = channel.social!; const selected = selectedSocial.includes(name); const connected = Boolean(social.channels?.[name]); return <label className={`check ${selected ? "selected" : ""}`} key={name}><input type="checkbox" checked={selected} disabled={!connected} onChange={() => toggleChannel(name)}/><span>{channel.name}{connected ? " · Connected" : " · Not connected"}</span></label>; })}</div></div><div><div className="field"><label>MESSAGE</label><textarea className="textarea" value={publishText} onChange={event => setPublishText(event.target.value)} placeholder="Escribe el mensaje de la campaña..."/></div><div className="field"><label>IMAGE URL · Instagram/Pinterest</label><input className="input" value={imageUrl} onChange={event => setImageUrl(event.target.value)} placeholder="https://..."/></div><div className="field"><label>LINK</label><input className="input" value={link} onChange={event => setLink(event.target.value)} /></div><div className="field"><label>WHATSAPP RECIPIENT</label><input className="input" value={whatsappTo} onChange={event => setWhatsappTo(event.target.value)} placeholder="+1..."/></div></div></div>{Object.entries(publishResults).map(([channel, result]) => <div className={`result ${result.ok ? "ok" : "fail"}`} key={channel}><b>{channel}</b>: {result.ok ? `Published${result.account ? ` · ${result.account}` : ""}` : result.error || "Failed"}</div>)}<div className="actions"><button className="btn" onClick={() => setModal(null)}>Close</button><button className="btn primary" onClick={() => void publish()} disabled={publishing || !selectedSocial.length}>{publishing ? <Loader2 size={15}/> : <Send size={15}/>} {publishing ? "Publishing..." : "Publish to selected"}</button></div></>}</div></div>}
    </div>;
}

export default AdminMarketing;
