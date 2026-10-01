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
interface SearchMetrics { clicks: number; impressions: number; ctr: number; position: number; count: number; }
type SocialChannel = "facebook" | "instagram" | "tiktok" | "youtube" | "pinterest" | "whatsapp";
type ChannelName = "Google" | "Facebook" | "Instagram" | "TikTok" | "YouTube" | "Pinterest" | "WhatsApp" | "Email";
interface SubscriberCounts { total:number; active:number; inactive:number; active_en:number; active_es:number; }
type Channel = { name: ChannelName; detail: string; icon: LucideIcon; tone: string; social?: SocialChannel; provider?: "meta" | "tiktok" | "youtube" | "pinterest" };
interface SocialProfile { [key: string]: any; }
interface SocialConnection { connected: boolean; profile?: SocialProfile; }
interface SocialSetup { configured?: boolean; envKeys?: string[]; callback?: string; }
interface SocialState { configured?: Record<string, boolean>; setup?: Record<string, SocialSetup>; connected?: Record<string, SocialConnection>; channels?: Partial<Record<SocialChannel, boolean>>; }
interface PublishResult { ok: boolean; id?: string; account?: string; error?: string; }
interface CampaignRecord { id:string; name:string; objective:string; target_area:string; subject?:string; channels:SocialChannel[]; results?: { social?: Record<string, PublishResult>; email?: { totalRecipients:number }; google?: { focus?:string[] } }; created_at:string; autopilot_enabled?:boolean; next_run_at?:string | null; run_count?:number; }
interface LearningInsight { channel: SocialChannel; score:number; observations:number; successRate:number; clicks:number; sessions:number; conversions:number; revenue:number; impressions:number; recommended:boolean; avgHour?:number; avgWeekday?:number; }
interface DailySummary { generatedAt:string; campaigns:{total:number;last24:number}; last24:{publications:number;successful:number;sessions:number;conversions:number;revenue:number}; channels:Array<{channel:string;publications:number;successful:number;sessions:number;conversions:number;revenue:number}>; learning:{observations:number;conversions:number;revenue:number;level:number;levelName:string;nextTarget:string}; }\ninterface CatalogStatus { enabled:boolean; initializedAt?:string|null; lastScanAt?:string|null; lastProductId?:string|null; lastProductName?:string|null; lastCampaignId?:string|null; lastRunAt?:string|null; pendingProducts:number; }

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
    const [modal, setModal] = useState<"composer" | "Google" | "email" | "campaign" | null>(null);
    const [selectedSocial, setSelectedSocial] = useState<SocialChannel[]>([]);
    const [publishText, setPublishText] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [link, setLink] = useState("https://jqydesigns.com");
    const [whatsappTo, setWhatsappTo] = useState("");
    const [videoUrl, setVideoUrl] = useState("");
    const [emailSubject, setEmailSubject] = useState("");
    const [emailMessage, setEmailMessage] = useState("");
    const [emailImageUrl, setEmailImageUrl] = useState("");
    const [subscriberCounts, setSubscriberCounts] = useState<SubscriberCounts | null>(null);
    const [emailSending, setEmailSending] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [publishResults, setPublishResults] = useState<Record<string, PublishResult>>({});
    const [notice, setNotice] = useState("");
    const [setupProvider, setSetupProvider] = useState<"meta" | "tiktok" | "youtube" | "pinterest" | null>(null);
    const [campaignName, setCampaignName] = useState("");
    const [campaignObjective, setCampaignObjective] = useState("Brand awareness and sales");
    const [campaignTargetArea, setCampaignTargetArea] = useState("Houston, Texas + United States");
    const [campaignSubject, setCampaignSubject] = useState("");
    const [campaignMessage, setCampaignMessage] = useState("");
    const [campaignImageUrl, setCampaignImageUrl] = useState("");
    const [campaignVideoUrl, setCampaignVideoUrl] = useState("");
    const [campaignLink, setCampaignLink] = useState("https://www.jqydesigns.com");
    const [campaignWhatsappTo, setCampaignWhatsappTo] = useState("");
    const [campaignSendEmail, setCampaignSendEmail] = useState(true);
    const [campaignAutopilot, setCampaignAutopilot] = useState(false);
    const [campaignLaunching, setCampaignLaunching] = useState(false);
    const [campaignResults, setCampaignResults] = useState<any>(null);
    const [campaignHistory, setCampaignHistory] = useState<CampaignRecord[]>([]);
    const [learningInsights, setLearningInsights] = useState<LearningInsight[]>([]);
    const [learningLoading, setLearningLoading] = useState(false);
    const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
    const [dailyLoading, setDailyLoading] = useState(false);\n    const [catalog, setCatalog] = useState<CatalogStatus | null>(null);\n    const [catalogLoading, setCatalogLoading] = useState(false);

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

    const loadLearning = useCallback(async () => {
        try {
            setLearningLoading(true);
            const response = await apiRequest<{ insights: LearningInsight[] }>("/api/admin/marketing/social/campaign/learning");
            setLearningInsights(response.insights || []);
        } catch { /* Learning is supplemental and must never block campaign publishing. */ }
        finally { setLearningLoading(false); }
    }, []);

    const loadDailySummary = useCallback(async () => {
        try {
            setDailyLoading(true);
            const response = await apiRequest<{ summary: DailySummary }>("/api/admin/marketing/social/campaign/daily-summary");
            setDailySummary(response.summary);
        } catch { /* Daily report is supplemental and never blocks Marketing. */ }
        finally { setDailyLoading(false); }
    }, []);

    const loadCatalog = useCallback(async () => {\n        try {\n            const response = await apiRequest<{ catalog: CatalogStatus }>("/api/admin/marketing/social/campaign/catalog");\n            setCatalog(response.catalog);\n        } catch { /* Catalog Autopilot is supplemental. */ }\n    }, []);\n\n    const toggleCatalog = useCallback(async (enabled: boolean) => {\n        try {\n            setCatalogLoading(true);\n            const response = await apiRequest<{ catalog: CatalogStatus }>("/api/admin/marketing/social/campaign/catalog", { method: "POST", body: JSON.stringify({ enabled }) });\n            setCatalog(response.catalog);\n            setNotice(enabled ? "Catalog Autopilot activado. Los productos nuevos quedarán disponibles para promoción automática." : "Catalog Autopilot pausado.");\n        } catch (error) { setNotice(error instanceof Error ? error.message : "No se pudo cambiar Catalog Autopilot."); }\n        finally { setCatalogLoading(false); }\n    }, []);\n\n    const loadCampaignHistory = useCallback(async () => {
        try {
            const response = await apiRequest<{ campaigns: CampaignRecord[] }>("/api/admin/marketing/social/campaign/history?limit=6");
            setCampaignHistory(response.campaigns || []);
        } catch { /* Marketing history is supplemental; do not block the page. */ }
    }, []);

    useEffect(() => { void load(); void loadSocial(); void loadCampaignHistory(); void loadLearning(); void loadDailySummary(); void loadCatalog(); }, [load, loadSocial, loadCampaignHistory, loadLearning, loadDailySummary, loadCatalog]);
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
    const searchMetrics = useMemo<SearchMetrics>(() => gscRows.reduce<SearchMetrics>((sum, row) => ({ clicks: sum.clicks + Number(row.clicks || 0), impressions: sum.impressions + Number(row.impressions || 0), ctr: sum.ctr + Number(row.ctr || 0), position: sum.position + Number(row.position || 0), count: sum.count + 1 }), { clicks: 0, impressions: 0, ctr: 0, position: 0, count: 0 }), [gscRows]);
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
    const openCampaign = () => {
        const connected = socialChannels.map(channel => channel.social!).filter(name => Boolean(social.channels?.[name]));
        setSelectedSocial(connected);
        setCampaignResults(null);
        if (!campaignName) setCampaignName("JQYDesigns — New Campaign");
        if (!campaignMessage) setCampaignMessage("Discover our latest personalized designs from JQYDesigns. Custom mugs, gifts and more, made in Houston and shipped across the United States.");
        setModal("campaign");
    };

    const openComposer = (preset?: SocialChannel) => {
        const connected = socialChannels.map(channel => channel.social!).filter(name => Boolean(social.channels?.[name]));
        setSelectedSocial(preset && connected.includes(preset) ? [preset] : connected);
        setPublishResults({});
        setModal("composer");
    };
    const openEmailCampaign = async () => {
        try {
            const response = await apiRequest<{ counts: SubscriberCounts }>("/api/subscribers/admin/counts");
            setSubscriberCounts(response.counts);
        } catch (error) { setNotice(error instanceof Error ? error.message : "No se pudieron cargar los suscriptores."); }
        setModal("email");
    };
    const openQuickCampaign = () => {
        setPublishText("New personalized designs are here. Discover our latest Magic Touch Designs collection and create something made just for you.");
        setImageUrl("");
        openComposer();
    };
    const openCreative = () => openComposer("instagram");
    const openWhatsApp = () => openComposer("whatsapp");
    const openSeo = () => setModal("Google");
    const setupTitle = (provider: string) => provider === "meta" ? "Facebook · Instagram · WhatsApp" : provider === "youtube" ? "YouTube / Google" : provider === "tiktok" ? "TikTok" : "Pinterest";

    const toggleChannel = (channel: SocialChannel) => setSelectedSocial(current => current.includes(channel) ? current.filter(item => item !== channel) : [...current, channel]);
    const publish = async () => {
        if (!selectedSocial.length || !publishText.trim()) { setNotice("Selecciona al menos un canal conectado y escribe el mensaje."); return; }
        try {
            setPublishing(true); setPublishResults({});
            const response = await apiRequest<{ results: Record<string, PublishResult> }>("/api/admin/marketing/social/publish", { method: "POST", body: JSON.stringify({ channels: selectedSocial, text: publishText.trim(), imageUrl: imageUrl.trim() || undefined, videoUrl: videoUrl.trim() || undefined, link: link.trim() || undefined, whatsappTo: whatsappTo.trim() || undefined }) });
            setPublishResults(response.results || {});
        } catch (error) { setNotice(error instanceof Error ? error.message : "No se pudo publicar."); }
        finally { setPublishing(false); }
    };

    const launchCampaign = async () => {
        if (!campaignName.trim() || !campaignMessage.trim()) {
            setNotice("La campaña necesita nombre y mensaje.");
            return;
        }
        if (!selectedSocial.length && !campaignSendEmail) {
            setNotice("Selecciona al menos una red conectada o activa Email.");
            return;
        }
        try {
            setCampaignLaunching(true);
            setCampaignResults(null);
            const idempotencyKey = crypto.randomUUID();
            const response = await apiRequest<{ data: any }>("/api/admin/marketing/social/campaign/launch", {
                method: "POST",
                body: JSON.stringify({
                    name: campaignName.trim(),
                    objective: campaignObjective.trim(),
                    targetArea: campaignTargetArea.trim(),
                    message: campaignMessage.trim(),
                    subject: campaignSubject.trim() || campaignName.trim(),
                    imageUrl: campaignImageUrl.trim() || undefined,
                    videoUrl: campaignVideoUrl.trim() || undefined,
                    link: campaignLink.trim() || undefined,
                    whatsappTo: campaignWhatsappTo.trim() || undefined,
                    channels: selectedSocial,
                    sendEmail: campaignSendEmail,
                    autopilot: campaignAutopilot,
                    idempotencyKey,
                }),
            });
            setCampaignResults(response.data);
            setNotice(`Campaña lanzada: ${response.data?.campaignId || "OK"}`);
            await Promise.all([loadCampaignHistory(), loadLearning(), loadDailySummary()]);
        } catch (error) {
            setNotice(error instanceof Error ? error.message : "No se pudo lanzar la campaña.");
        } finally {
            setCampaignLaunching(false);
        }
    };

    const sendEmailCampaign = async () => {
        if (!emailSubject.trim() || !emailMessage.trim()) { setNotice("Escribe el asunto y el mensaje de la promoción."); return; }
        try {
            setEmailSending(true);
            const response = await apiRequest<{ data: { totalRecipients:number; englishRecipients:number; spanishRecipients:number } }>("/api/subscribers/admin/promotion", {
                method: "POST",
                body: JSON.stringify({ subject: emailSubject.trim(), message: emailMessage.trim(), imageUrl: emailImageUrl.trim() || undefined })
            });
            const result = response.data;
            setNotice(`Promoción enviada a ${result.totalRecipients} suscriptores activos — EN ${result.englishRecipients} / ES ${result.spanishRecipients}.`);
            setEmailSubject(""); setEmailMessage(""); setEmailImageUrl("");
            setModal(null);
        } catch (error) { setNotice(error instanceof Error ? error.message : "No se pudo enviar la promoción."); }
        finally { setEmailSending(false); }
    };

    return <div className="marketing-page"><style>{`
      .marketing-page{min-height:100vh;background:#07101d;color:#f8fafc;font-family:Inter,system-ui,sans-serif}.marketing-main{margin-left:270px;padding:24px 26px 42px;max-width:1600px}.hero,.card,.stat{background:#0d1929;border:1px solid #26364e;border-radius:14px}.hero{padding:28px 32px;background:linear-gradient(115deg,#25105d,#0b1729 58%,#10243b)}.eyebrow{font-size:11px;letter-spacing:.08em;color:#e3b8ff;font-weight:800}.hero h1{font-size:38px;margin:8px 0}.hero h1 span{color:#c46cff}.hero p{color:#cbd5e1;max-width:900px;line-height:1.5}.actions{display:flex;gap:9px;margin-top:16px;flex-wrap:wrap}.btn{border:1px solid #50617d;border-radius:9px;background:#111f33;color:#fff;padding:10px 14px;font-weight:700;display:inline-flex;align-items:center;gap:7px;cursor:pointer}.btn:disabled{opacity:.55;cursor:not-allowed}.primary{border-color:#8a42ff;background:linear-gradient(135deg,#7d24ff,#24a8ef)}.stats{display:grid;grid-template-columns:repeat(4,1fr) 180px;gap:9px;margin:12px 0}.stat{padding:14px}.stat-top{display:flex;justify-content:space-between;color:#9eacc0;font-size:11px}.stat strong{display:block;font-size:23px;margin:6px 0}.stat small{color:#54e889;font-weight:700}.range{display:flex;align-items:center;justify-content:center;gap:6px}.select,.input,.textarea{background:#0d1929;border:1px solid #41536d;color:#fff;border-radius:8px;padding:10px}.section{margin-top:18px}.section-title{padding:0 2px 9px}.section-title h2{font-size:19px;margin:0}.section-title p{font-size:12px;color:#9eacc0;margin:5px 0}.integration{display:grid;grid-template-columns:1fr 1fr;gap:10px}.integration-card{padding:15px}.integration-head{display:flex;align-items:center;justify-content:space-between}.integration-head h3{margin:0;font-size:15px}.integration p{font-size:11px;color:#9eacc0;line-height:1.45}.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}.metric{background:#111f33;border:1px solid #24364f;border-radius:9px;padding:9px}.metric b{display:block;font-size:16px}.metric span{font-size:9px;color:#8492a5}.channels{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.channel{padding:15px;position:relative}.channel-top{display:flex;align-items:center;justify-content:space-between}.channel-icon{width:44px;height:44px;border-radius:12px;display:grid;place-items:center;background:#14243a}.channel strong{display:block;font-size:15px;margin-top:10px}.channel small{display:block;color:#8292a8;font-size:10px;margin-top:3px}.status{display:inline-flex;align-items:center;gap:5px;margin-top:9px;border-radius:999px;padding:5px 8px;background:#1b2a3e;color:#b9c6d6;font-size:9px}.status.connected{color:#54e889;background:#103326}.account{display:block;color:#d7e0eb;font-size:10px;margin-top:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.notice{padding:10px;border:1px solid #3a4b64;border-radius:9px;background:#101d30;color:#aeb9c8;font-size:11px;line-height:1.45;margin-top:12px}.composer-grid,.campaign-grid{display:grid;grid-template-columns:1fr 1.4fr;gap:14px}.checks{display:grid;gap:7px}.check{display:flex;align-items:center;gap:9px;padding:10px;border:1px solid #26364e;border-radius:9px;background:#101d30;cursor:pointer}.check.selected{border-color:#6549b7;background:#171b35}.check input{accent-color:#8a42ff}.result{padding:9px;border-radius:8px;margin-top:7px;border:1px solid #26364e;font-size:10px}.result.ok{border-color:#1d7047;background:#0d2a1d;color:#8ff0b5}.result.fail{border-color:#6c3131;background:#2a1212;color:#ffaaaa}.modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.72);z-index:100;display:grid;place-items:center;padding:16px}.modal{width:min(760px,100%);max-height:92vh;overflow:auto;background:#0d1929;border:1px solid #344967;border-radius:15px;padding:20px}.modal-head{display:flex;justify-content:space-between;align-items:center}.close{background:none;border:0;color:#aab8ca;cursor:pointer}.modal h2{margin:0}.field{display:flex;flex-direction:column;gap:5px;margin-bottom:10px}.field label{font-size:10px;color:#8e9caf;font-weight:700}.textarea{min-height:130px;resize:vertical}.quick{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.quick .card{padding:15px;text-align:left;color:#f8fafc;cursor:pointer}.quick strong{display:block;font-size:12px;margin-top:7px}.quick small{display:block;color:#8391a5;font-size:10px;margin-top:4px}@media(max-width:1200px){.channels{grid-template-columns:repeat(2,1fr)}.quick{grid-template-columns:repeat(2,1fr)}.stats{grid-template-columns:repeat(2,1fr)}.composer-grid,.campaign-grid{grid-template-columns:1fr}}@media(max-width:800px){.marketing-main{margin-left:0;padding:15px}.hero h1{font-size:29px}.channels{grid-template-columns:1fr 1fr}.stats{grid-template-columns:1fr 1fr}.metrics{grid-template-columns:1fr 1fr}}
    `}</style>
      <AdminSidebar username="Administrator" />
      <main className="marketing-main">
        <section className="hero"><div className="eyebrow">MARKETING CENTER · JQYD</div><h1>Grow Your Brand <span>Everywhere</span></h1><p>Centro operativo para lanzar una campaña desde un solo lugar: redes conectadas, email y estrategia de descubrimiento en Google. El sistema conserva el resultado de cada lanzamiento.</p><div className="actions"><button className="btn primary" onClick={openCampaign}><Sparkles size={15}/>Launch Campaign Everywhere</button><button className="btn" onClick={() => { void load(); void loadSocial(); }} disabled={loading || refreshing || socialLoading}><RefreshCw size={15}/>Refresh</button></div>{notice && <div className="notice">{notice}</div>}</section>
        <section className="stats"><article className="stat"><div className="stat-top"><span>Visitors</span><MousePointer2 size={17}/></div><strong>{gaMetrics.users.toLocaleString()}</strong><small>{ga?.configured ? "Google Analytics 4" : "Connect GA4"}</small></article><article className="stat"><div className="stat-top"><span>Page Views</span><TrendingUp size={17}/></div><strong>{gaMetrics.views.toLocaleString()}</strong><small>{ga?.configured ? "Live GA4 data" : "Connect GA4"}</small></article><article className="stat"><div className="stat-top"><span>Orders</span><Users size={17}/></div><strong>{salesMetrics.orders.toLocaleString()}</strong><small>Live order data</small></article><article className="stat"><div className="stat-top"><span>Revenue</span><BarChart3 size={17}/></div><strong>${salesMetrics.revenue.toFixed(2)}</strong><small>Live sales data</small></article><div className="stat range"><Clock3 size={14}/><select className="select" value={range} onChange={event => setRange(event.target.value as "7"|"30"|"90")}><option value="7">7 days</option><option value="30">30 days</option><option value="90">90 days</option></select></div></section>
        <section className="section"><div className="section-title"><h2>Google Integrations</h2><p>Google solo aparece como conectado cuando los servicios reales responden.</p></div><div className="integration"><article className="card integration-card"><div className="integration-head"><h3>Google Search Console</h3>{gsc?.connected && <CheckCircle2 className="status connected" size={18}/>}</div><p>{gsc?.connected ? `Connected to ${gsc.siteUrl}` : gsc?.error || "Needs service-account property access"}</p><div className="metrics"><div className="metric"><b>{searchMetrics.clicks.toLocaleString()}</b><span>Clicks</span></div><div className="metric"><b>{searchMetrics.impressions.toLocaleString()}</b><span>Impressions</span></div><div className="metric"><b>{searchMetrics.count ? (searchMetrics.ctr / searchMetrics.count * 100).toFixed(2) : "0.00"}%</b><span>Avg. CTR</span></div><div className="metric"><b>{searchMetrics.count ? (searchMetrics.position / searchMetrics.count).toFixed(1) : "—"}</b><span>Avg. position</span></div></div></article><article className="card integration-card"><div className="integration-head"><h3>Google Analytics 4</h3>{ga?.configured && <CheckCircle2 className="status connected" size={18}/>}</div><p>{ga?.configured ? `Property ${ga.propertyId} is configured.` : ga?.error || "Needs property ID + service-account access"}</p><div className="metrics"><div className="metric"><b>{gaMetrics.users.toLocaleString()}</b><span>Active users</span></div><div className="metric"><b>{gaMetrics.sessions.toLocaleString()}</b><span>Sessions</span></div><div className="metric"><b>{gaMetrics.views.toLocaleString()}</b><span>Page views</span></div><div className="metric"><b>${gaMetrics.revenue.toFixed(2)}</b><span>GA revenue</span></div></div></article></div></section>
        <section className="section"><div className="section-title"><div className="integration-head"><div><h2>Connect Your Channels</h2><p>Conecta la cuenta oficial que realmente administra cada canal. Nada está hardcodeado.</p></div><button className="btn" onClick={() => void loadSocial()} disabled={socialLoading}><RefreshCw size={14}/></button></div></div><div className="channels">{channels.map(channel => { const Icon = channel.icon; const connected = isConnected(channel); const configured = channel.provider ? Boolean(social.configured?.[channel.provider]) : channel.name === "Google" ? Boolean(gsc?.connected || ga?.configured) : true; return <article className="card channel" key={channel.name}><div className="channel-top"><span className="channel-icon" style={{ color: channel.tone }}><Icon size={21}/></span>{connected && <CheckCircle2 className="connected" size={18}/>}</div><strong>{channel.name}</strong><small>{channel.detail}</small>{connected ? <><span className="status connected"><CheckCircle2 size={11}/>Connected</span><span className="account">{accountName(channel)}</span>{channel.provider && <button className="btn" style={{ marginTop: 8, padding: "6px 8px", fontSize: 9 }} onClick={() => void disconnect(channel)} disabled={busyProvider === channel.provider}><Unplug size={11}/>Disconnect</button>}</> : channel.name === "Google" ? <span className="status">{configured ? "Analytics ready" : "Needs configuration"}</span> : channel.name === "Email" ? <button className="btn primary" style={{ marginTop: 9, padding: "7px 10px", fontSize: 10 }} onClick={() => void openEmailCampaign()}><Mail size={12}/>Open Email Campaign</button> : configured ? <button className="btn primary" style={{ marginTop: 9, padding: "7px 10px", fontSize: 10 }} onClick={() => void connect(channel)} disabled={Boolean(busyProvider)}>{busyProvider === channel.provider ? <Loader2 size={12}/> : <Link2 size={12}/>} Connect official account</button> : <button className="btn" style={{ marginTop: 9, padding: "7px 10px", fontSize: 10 }} onClick={() => setSetupProvider(channel.provider!)}><Link2 size={12}/>Setup connection</button>}</article>; })}</div></section>
        <section className="section"><div className="section-title"><h2>JQY Marketing Learning Engine</h2><p>El algoritmo propio aprende de cada lanzamiento y acumula experiencia por canal, horario, mercado y resultado. No compra publicidad ni depende de un servicio externo.</p></div><article className="card" style={{ padding: 16 }}><div className="metrics">{learningInsights.map(item => <div className="metric" key={item.channel}><b>{(item.score * 100).toFixed(1)}</b><span>{item.channel} · {item.observations} obs{item.recommended ? " · recomendado" : ""}</span></div>)}</div><div className="notice">{learningLoading ? "Actualizando aprendizaje..." : learningInsights.some(item => item.observations > 0) ? `El motor ya tiene ${learningInsights.reduce((sum,item) => sum + item.observations, 0)} observaciones y seguirá explorando mientras aprende.` : "Primera etapa: cada publicación real alimentará el aprendizaje. Cuando existan suficientes resultados, el motor empezará a priorizar automáticamente los patrones que mejor funcionen."}</div></article></section>
        <section className="section"><div className="section-title"><div className="integration-head"><div><h2>Daily Growth Report</h2><p>Resumen real de las últimas 24 horas: dónde se publicó, tráfico, conversiones e ingresos. El reporte diario también se envía al correo de Marketing después de existir la primera campaña.</p></div><button className="btn" onClick={() => void loadDailySummary()} disabled={dailyLoading}><RefreshCw size={14}/>{dailyLoading ? "Updating..." : "Refresh"}</button></div></div>{dailySummary && <article className="card" style={{ padding: 16 }}><div className="metrics"><div className="metric"><b>{dailySummary.last24.publications}</b><span>Publicaciones 24h</span></div><div className="metric"><b>{dailySummary.last24.sessions.toLocaleString()}</b><span>Sesiones</span></div><div className="metric"><b>{dailySummary.last24.conversions}</b><span>Conversiones</span></div><div className="metric"><b>${dailySummary.last24.revenue.toFixed(2)}</b><span>Ingresos atribuidos</span></div><div className="metric"><b>Nivel {dailySummary.learning.level}</b><span>{dailySummary.learning.levelName}</span></div></div><div className="quick" style={{ marginTop: 12 }}>{dailySummary.channels.map(channel => <div className="notice" key={channel.channel}><b>{channel.channel}</b> · {channel.successful}/{channel.publications} publicaciones OK · {channel.sessions} sesiones · {channel.conversions} conversiones · ${channel.revenue.toFixed(2)}</div>)}</div><div className="notice" style={{ marginTop: 12 }}><b>Meta siguiente:</b> {dailySummary.learning.nextTarget}<br/><b>Aprendizaje acumulado:</b> {dailySummary.learning.observations} observaciones · {dailySummary.learning.conversions} conversiones · ${dailySummary.learning.revenue.toFixed(2)}</div></article>}</section><section className="section"><div className="section-title"><div className="integration-head"><div><h2>🤖 Catalog Autopilot</h2><p>El mismo Marketing Brain detecta productos nuevos activos, toma su foto, nombre, precio y enlace, y los incorpora al aprendizaje junto con tus campañas manuales.</p></div><button className="btn" onClick={() => void loadCatalog()} disabled={catalogLoading}><RefreshCw size={14}/>{catalogLoading ? "Updating..." : "Refresh"}</button></div></div><article className="card" style={{ padding: 16 }}><div className="metrics"><div className="metric"><b>{catalog?.enabled ? "ON" : "OFF"}</b><span>Catalog Autopilot</span></div><div className="metric"><b>{catalog?.pendingProducts ?? 0}</b><span>Productos pendientes</span></div><div className="metric"><b>{catalog?.lastProductName || "—"}</b><span>Último producto</span></div><div className="metric"><b>{catalog?.lastScanAt ? new Date(catalog.lastScanAt).toLocaleString() : "—"}</b><span>Último escaneo</span></div></div><div className="actions"><button className="btn primary" onClick={() => void toggleCatalog(!catalog?.enabled)} disabled={catalogLoading}>{catalog?.enabled ? "Pause Catalog Autopilot" : "Activate Catalog Autopilot"}</button><span className="status connected">Mismo aprendizaje · sin sistema paralelo</span></div>{catalog?.lastCampaignId && <div className="notice"><b>Última campaña automática:</b> {catalog.lastCampaignId}<br/>El producto se registra como fuente <b>catalog</b> y sus resultados entran al mismo historial por canal.</div>}</article></section><section className="section"><div className="section-title"><h2>Campaign History</h2><p>Últimos lanzamientos realizados desde este Marketing Center.</p></div><div className="quick">{campaignHistory.map(campaign => <article className="card" key={campaign.id}><strong>{campaign.name}</strong><small>{campaign.target_area} · {new Date(campaign.created_at).toLocaleString()}</small><small>{campaign.channels?.length || 0} social channels{campaign.results?.email ? ` · Email ${campaign.results.email.totalRecipients}` : ""}{campaign.autopilot_enabled ? " · 🤖 Autopilot ON" : ""}</small></article>)}</div></section>
        <section className="section"><div className="section-title"><h2>Central Publisher</h2><p>Selecciona todos los canales conectados o solamente los que quieras usar.</p></div><article className="card" style={{ padding: 16 }}><div className="actions" style={{ marginTop: 0 }}><button className="btn primary" onClick={() => openComposer()}><Send size={15}/>Open Publisher</button><span className="status connected">{selectedSocial.length} connected channel{selectedSocial.length === 1 ? "" : "s"} selected</span></div></article></section>
        <section className="section"><div className="quick">
          <button className="card" onClick={openQuickCampaign}><Sparkles size={18}/><strong>Campaign Assistant</strong><small>Start a ready-to-edit campaign in the publisher.</small></button>
          <button className="card" onClick={openSeo}><Search size={18}/><strong>SEO</strong><small>Open live Search Console and Analytics data.</small></button>
          <button className="card" onClick={openCreative}><Image size={18}/><strong>Creative Publisher</strong><small>Prepare an image campaign for social channels.</small></button>
          <button className="card" onClick={openWhatsApp}><MessageCircle size={18}/><strong>WhatsApp</strong><small>Send a real Business message to a recipient.</small></button>
        </div></section>
      </main>
      {setupProvider && <div className="modal-bg" onClick={() => setSetupProvider(null)}><div className="modal" onClick={event => event.stopPropagation()}><div className="modal-head"><h2>Connect {setupTitle(setupProvider)}</h2><button className="close" onClick={() => setSetupProvider(null)}><X size={18}/></button></div><p>Esta conexión es real: primero se configura la aplicación OAuth del proveedor en el servidor y después el botón de conexión te llevará a la cuenta oficial para autorizarla.</p><div className="notice"><b>Variables del backend</b><br/>{(social.setup?.[setupProvider]?.envKeys || []).map(key => <code key={key} style={{ display: "block", marginTop: 4 }}>{key}</code>)}<br/><b>Callback exacto</b><br/><code style={{ wordBreak: "break-all" }}>{social.setup?.[setupProvider]?.callback || ""}</code></div><div className="notice">Después de guardar las credenciales en el entorno Production del backend, pulsa Refresh en esta página. El botón cambiará a <b>Connect official account</b> y podrás autorizar tu cuenta real.</div><div className="actions"><button className="btn primary" onClick={() => { setSetupProvider(null); void loadSocial(); }}><RefreshCw size={14}/>Refresh connection status</button><button className="btn" onClick={() => setSetupProvider(null)}>Close</button></div></div></div>}
      {modal && <div className="modal-bg" onClick={() => setModal(null)}><div className="modal" onClick={event => event.stopPropagation()}><div className="modal-head"><h2>{modal === "composer" ? "Central Publisher" : modal === "email" ? "Email Campaign" : modal === "campaign" ? "Launch Campaign Everywhere" : "Google Integrations"}</h2><button className="close" onClick={() => setModal(null)}><X size={18}/></button></div>{modal === "Google" && <><p>Google se usa aquí para medir descubrimiento y orientar la estrategia SEO. Search Console no puede garantizar ni forzar una posición orgánica.</p><div className="notice">Search Console: {gsc?.connected ? "Connected" : "Needs access"}<br/>GA4: {ga?.configured ? `Configured · ${ga.propertyId}` : "Needs configuration"}</div><div className="actions"><button className="btn primary" onClick={() => { void load(); setModal(null); }}><RefreshCw size={14}/>Refresh Google data</button></div></>}
      {modal === "campaign" && <><p>Prepara la promoción una sola vez. Si activas Autopilot, queda en cola y el sistema decidirá cada hora si corresponde publicar, usando las conexiones y el aprendizaje acumulado.</p><div className="campaign-grid"><div>
        <div className="field"><label>CAMPAIGN NAME</label><input className="input" value={campaignName} onChange={e => setCampaignName(e.target.value)} placeholder="Houston Holiday Collection"/></div>
        <div className="field"><label>OBJECTIVE</label><select className="select" value={campaignObjective} onChange={e => setCampaignObjective(e.target.value)}><option>Brand awareness and sales</option><option>Local Houston sales</option><option>New product launch</option><option>Seasonal promotion</option><option>Website traffic</option></select></div>
        <div className="field"><label>TARGET AREA</label><input className="input" value={campaignTargetArea} onChange={e => setCampaignTargetArea(e.target.value)} placeholder="Houston, Texas + United States"/></div>
        <div className="field"><label>CHANNELS</label><div className="checks">{socialChannels.map(channel => { const name=channel.social!; const connected=Boolean(social.channels?.[name]); const selected=selectedSocial.includes(name); return <label className={`check ${selected ? "selected" : ""}`} key={name}><input type="checkbox" checked={selected} disabled={!connected} onChange={() => toggleChannel(name)}/><span>{channel.name}{connected ? " · Connected" : " · Not connected"}</span></label>; })}<label className={`check ${campaignSendEmail ? "selected" : ""}`}><input type="checkbox" checked={campaignSendEmail} onChange={e => setCampaignSendEmail(e.target.checked)}/><span>Email subscribers</span></label><label className={`check ${campaignAutopilot ? "selected" : ""}`}><input type="checkbox" checked={campaignAutopilot} onChange={e => setCampaignAutopilot(e.target.checked)}/><span>🤖 Autopilot · publish automatically each hour when due</span></label></div></div>
      </div><div>
        <div className="field"><label>CAMPAIGN MESSAGE</label><textarea className="textarea" value={campaignMessage} onChange={e => setCampaignMessage(e.target.value)} placeholder="Mensaje central de la campaña..."/></div>
        <div className="field"><label>EMAIL SUBJECT</label><input className="input" value={campaignSubject} onChange={e => setCampaignSubject(e.target.value)} placeholder="JQYDesigns — New collection"/></div>
        <div className="field"><label>IMAGE URL</label><input className="input" value={campaignImageUrl} onChange={e => setCampaignImageUrl(e.target.value)} placeholder="https://..."/></div>
        <div className="field"><label>VIDEO URL</label><input className="input" value={campaignVideoUrl} onChange={e => setCampaignVideoUrl(e.target.value)} placeholder="https://.../campaign.mp4"/></div>
        <div className="field"><label>LANDING LINK</label><input className="input" value={campaignLink} onChange={e => setCampaignLink(e.target.value)}/></div>
        <div className="field"><label>WHATSAPP RECIPIENT (OPTIONAL)</label><input className="input" value={campaignWhatsappTo} onChange={e => setCampaignWhatsappTo(e.target.value)} placeholder="+1..."/></div>
      </div></div>
      <div className="notice"><b>Google growth layer:</b> {campaignTargetArea || "Houston"} is stored as the campaign market and Google Search Console/Analytics remain the measurement layer. The campaign engine does not claim to force organic rankings.</div>
      {campaignResults && <div className="notice"><b>Campaign ID:</b> {campaignResults.campaignId}<br/><b>Social results:</b> {Object.entries(campaignResults.social || {}).map(([channel,result]:any) => <span key={channel} style={{display:"block"}}>{channel}: {result?.ok ? "Published" : result?.error || "Failed"}</span>)}{campaignResults.email && <span style={{display:"block"}}>Email: {campaignResults.email.totalRecipients} recipients</span>}<span style={{display:"block"}}>Google: tracking/SEO focus prepared</span></div>}
      <div className="actions"><button className="btn" onClick={() => setModal(null)}>Close</button><button className="btn primary" onClick={() => void launchCampaign()} disabled={campaignLaunching}>{campaignLaunching ? <Loader2 size={15}/> : <Sparkles size={15}/>} {campaignLaunching ? "Launching..." : campaignAutopilot ? "Queue for Autopilot" : "Launch Campaign Everywhere"}</button></div></>}
      {modal === "email" && <><p>Envía una promoción real a los suscriptores activos desde JQYDesigns.</p><div className="notice">Active subscribers: {subscriberCounts?.active ?? "—"} · EN: {subscriberCounts?.active_en ?? "—"} · ES: {subscriberCounts?.active_es ?? "—"}</div><div className="field"><label>SUBJECT</label><input className="input" value={emailSubject} onChange={e => setEmailSubject(e.target.value)} placeholder="Summer promotion — 20% off"/></div><div className="field"><label>MESSAGE</label><textarea className="textarea" value={emailMessage} onChange={e => setEmailMessage(e.target.value)} placeholder="Write your promotion message..."/></div><div className="field"><label>IMAGE URL (OPTIONAL)</label><input className="input" value={emailImageUrl} onChange={e => setEmailImageUrl(e.target.value)} placeholder="https://..."/></div><div className="actions"><button className="btn" onClick={() => setModal(null)}>Close</button><button className="btn primary" onClick={() => void sendEmailCampaign()} disabled={emailSending}>{emailSending ? <Loader2 size={15}/> : <Send size={15}/>} {emailSending ? "Sending..." : "Send Promotion"}</button></div></>}
      {modal === "composer" && <><p>Una campaña puede enviarse a todos los canales conectados. Cada plataforma devuelve su propio resultado.</p><div className="composer-grid"><div><div className="field"><label>CHANNELS</label></div><div className="checks">{socialChannels.map(channel => { const name = channel.social!; const selected = selectedSocial.includes(name); const connected = Boolean(social.channels?.[name]); return <label className={`check ${selected ? "selected" : ""}`} key={name}><input type="checkbox" checked={selected} disabled={!connected} onChange={() => toggleChannel(name)}/><span>{channel.name}{connected ? " · Connected" : " · Not connected"}</span></label>; })}</div></div><div><div className="field"><label>MESSAGE</label><textarea className="textarea" value={publishText} onChange={event => setPublishText(event.target.value)} placeholder="Escribe el mensaje de la campaña..."/></div><div className="field"><label>IMAGE URL · Instagram/Pinterest</label><input className="input" value={imageUrl} onChange={event => setImageUrl(event.target.value)} placeholder="https://..."/></div><div className="field"><label>VIDEO URL · YouTube</label><input className="input" value={videoUrl} onChange={event => setVideoUrl(event.target.value)} placeholder="https://.../video.mp4" /></div><div className="field"><label>LINK</label><input className="input" value={link} onChange={event => setLink(event.target.value)} /></div><div className="field"><label>WHATSAPP RECIPIENT</label><input className="input" value={whatsappTo} onChange={event => setWhatsappTo(event.target.value)} placeholder="+1..."/></div></div></div>{Object.entries(publishResults).map(([channel, result]) => <div className={`result ${result.ok ? "ok" : "fail"}`} key={channel}><b>{channel}</b>: {result.ok ? `Published${result.account ? ` · ${result.account}` : ""}` : result.error || "Failed"}</div>)}<div className="actions"><button className="btn" onClick={() => setModal(null)}>Close</button><button className="btn primary" onClick={() => void publish()} disabled={publishing || !selectedSocial.length}>{publishing ? <Loader2 size={15}/> : <Send size={15}/>} {publishing ? "Publishing..." : "Publish to selected"}</button></div></>}</div></div>}
    </div>;
}

export default AdminMarketing;
