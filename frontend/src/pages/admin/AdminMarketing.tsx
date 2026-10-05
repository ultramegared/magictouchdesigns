import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BarChart3, CheckCircle2, Clock3, Image, Link2, Mail, MessageCircle, MousePointer2, Play, RefreshCw, Search, Send, Sparkles, TrendingUp, Unplug, Users, Video, X, Loader2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { apiRequest } from "../../services/api";
import AdminSidebar from "./AdminSidebar";

interface SalesDay { date: string; orders: number; revenue: string | number; }
interface SalesResponse { daily?: SalesDay[]; }
interface GscRow { clicks?: number; impressions?: number; ctr?: number; position?: number; }
type GoogleStage = "CONFIGURED" | "AUTHENTICATED" | "CONNECTED" | "DATA_AVAILABLE" | "ERROR";
interface GoogleServiceState {
    status: GoogleStage;
    configured: boolean;
    authenticated: boolean;
    connected: boolean;
    dataVerified: boolean;
    rows: number;
    error?: string;
    siteUrl?: string;
    resolvedSiteUrl?: string | null;
    permissionLevel?: string | null;
    availableProperties?: string[];
    propertyId?: string | null;
}
interface GscResponse extends GoogleServiceState { siteUrl?: string; }
interface GaStatus extends GoogleServiceState { propertyId?: string | null; summary?: { activeUsers?:number; sessions?:number; screenPageViews?:number; totalRevenue?:number }; }
interface GoogleVerification {
    connected: boolean;
    searchConsole: GoogleServiceState;
    analytics: GoogleServiceState & { propertyId?: string | null };
    error?: string;
}
interface GaRow { metricValues?: Array<{ value?: string }> }
interface GaResponse { rows?: GaRow[]; summary?: { activeUsers?:number; sessions?:number; screenPageViews?:number; totalRevenue?:number }; error?: string; }
interface GaRealtimeResponse { propertyId?:string; generatedAt?:string; activeUsers?:number; eventCount?:number; error?:string; }
interface CampaignAttribution { campaignId:string; source:string; medium:string; sessions:number; activeUsers:number; conversions:number; revenue:number; transactions:number; attributionStatus:"MATCHED"|"UNMATCHED"; dateRange?:{startDate:string;endDate:string}; campaignName?:string|null; }
interface CampaignResult { campaignId:string; campaignName:string; channels:SocialChannel[]; publicationStatus:string; publications:number; published:number; processing:number; failed:number; autopilot:boolean; lastRunAt?:string|null; nextRunAt?:string|null; firstPublicationAt?:string|null; lastPublicationAt?:string|null; metrics:{sessions:number|null;activeUsers:number|null;conversions:number|null;revenue:number|null;transactions:number|null;clicks:number|null;impressions:number|null}; publicationLedger:Array<{runId:number;channel:string;status:string;providerStatus?:string|null;providerId?:string|null;externalUrl?:string|null;publishedAt?:string|null;createdAt:string}>; }
interface GoogleAdsState { state:string; configured:boolean; connected:boolean; liveVerified:boolean; dataAvailable:boolean; missing?:string[]; message?:string; customerId?:string|null; error?:string; }

interface SearchMetrics { clicks: number; impressions: number; ctr: number; position: number; count: number; }
type SocialChannel = "facebook" | "instagram" | "tiktok" | "youtube" | "pinterest" | "whatsapp";
type ChannelName = "Google" | "Facebook" | "Instagram" | "TikTok" | "YouTube" | "Pinterest" | "WhatsApp" | "Email";
interface SubscriberCounts { total:number; active:number; inactive:number; active_en:number; active_es:number; }
type Channel = { name: ChannelName; detail: string; icon: LucideIcon; tone: string; social?: SocialChannel; provider?: "meta" | "tiktok" | "youtube" | "pinterest" };
interface SocialProfile { [key: string]: any; }
interface SocialConnection { connected: boolean; profile?: SocialProfile; }
interface SocialSetup { configured?: boolean; envKeys?: string[]; callback?: string; }
interface SocialState { configured?: Record<string, boolean>; setup?: Record<string, SocialSetup>; connected?: Record<string, SocialConnection>; selections?: Record<string,string>; channels?: Partial<Record<SocialChannel, boolean>>; }
interface EmailStatus { configured: boolean; senderConfigured: boolean; fromEmail?: string; fromName?: string; connected: boolean; verified: boolean; verificationNote?: string; error?: string; }
interface PublishResult { ok: boolean; status?: "PUBLISHED"|"PROCESSING"|"SENT"|"FAILED"|"QUEUED"; id?: string; account?: string; url?: string; message?: string; error?: string; }
interface CampaignRecord { id:string; name:string; objective:string; target_area:string; subject?:string; message?:string; channels:SocialChannel[]; results?: { social?: Record<string, PublishResult>; email?: { totalRecipients:number }; google?: { focus?:string[] }; assets?: { imageUrl?:string; videoUrl?:string; landingLink?:string }; sendEmail?:boolean }; created_at:string; autopilot_enabled?:boolean; next_run_at?:string | null; run_count?:number; campaign_type?: "manual"|"catalog"|"event"; starts_at?:string|null; ends_at?:string|null; recurrence_hours?:number; }
interface LearningInsight { channel: SocialChannel; score:number; observations:number; successRate:number; clicks:number; sessions:number; conversions:number; revenue:number; impressions:number; recommended:boolean; avgHour?:number; avgWeekday?:number; }
interface DailySummary { generatedAt:string; campaigns:{total:number;last24:number}; last24:{publications:number;successful:number;sessions:number;conversions:number;revenue:number}; channels:Array<{channel:string;publications:number;successful:number;sessions:number;conversions:number;revenue:number}>; learning:{observations:number;conversions:number;revenue:number;level:number;levelName:string;nextTarget:string}; }
interface PublicationActivity {
    run_id: number;
    campaign_id: string;
    campaign_name: string;
    campaign_type?: string;
    target_area?: string;
    landing_link?: string | null;
    channel: string;
    run_type: string;
    published: boolean;
    status?: string;
    external_id?: string | null;
    external_url?: string | null;
    result?: { ok?: boolean; status?: string; id?: string; account?: string; url?: string; message?: string; error?: string; totalRecipients?: number };
    created_at: string;
}
interface CatalogStatus { enabled:boolean; initializedAt?:string|null; lastScanAt?:string|null; lastProductId?:string|null; lastProductName?:string|null; lastCampaignId?:string|null; lastRunAt?:string|null; pendingProducts:number; pendingPortfolio:number; }

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
    const [gaRealtime, setGaRealtime] = useState<GaRealtimeResponse | null>(null);
    const [campaignAttribution, setCampaignAttribution] = useState<CampaignAttribution[]>([]);
    const [campaignResultsCenter, setCampaignResultsCenter] = useState<CampaignResult[]>([]);
    const [googleAds, setGoogleAds] = useState<GoogleAdsState | null>(null);
    const [social, setSocial] = useState<SocialState>({});
    const [emailStatus, setEmailStatus] = useState<EmailStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [socialLoading, setSocialLoading] = useState(false);
    const [googleChecking, setGoogleChecking] = useState(false);
    const [busyProvider, setBusyProvider] = useState<string | null>(null);
    const [modal, setModal] = useState<"composer" | "Google" | "email" | "campaign" | null>(null);
    const [selectedSocial, setSelectedSocial] = useState<SocialChannel[]>([]);
    const [publishText, setPublishText] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [link, setLink] = useState("https://jqydesigns.com");
    const [whatsappTo, setWhatsappTo] = useState("");
    const [videoUrl, setVideoUrl] = useState("");
    const [emailSubject, setEmailSubject] = useState("");
    const [youtubePrivacy, setYoutubePrivacy] = useState<"public"|"unlisted"|"private">("public");
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
    const [campaignSendEmail, setCampaignSendEmail] = useState(false);
    const [campaignAutopilot, setCampaignAutopilot] = useState(false);
    const [campaignType, setCampaignType] = useState<"manual"|"event">("event");
    const [campaignStartsAt, setCampaignStartsAt] = useState("");
    const [campaignEndsAt, setCampaignEndsAt] = useState("");
    const [campaignRecurrenceHours, setCampaignRecurrenceHours] = useState("6");
    const [campaignImagePreview, setCampaignImagePreview] = useState("");
    const [campaignVideoPreview, setCampaignVideoPreview] = useState("");
    const [campaignMediaName, setCampaignMediaName] = useState("");
    const [campaignMediaUploading, setCampaignMediaUploading] = useState(false);
    const [campaignPreviewOpen, setCampaignPreviewOpen] = useState(false);
    const [campaignLaunching, setCampaignLaunching] = useState(false);
    const campaignLaunchLock = useRef(false);
    const campaignIdempotencyKey = useRef<string | null>(null);
    const [campaignResults, setCampaignResults] = useState<any>(null);
    const [campaignPreviewCampaign, setCampaignPreviewCampaign] = useState<CampaignRecord | null>(null);
    const [campaignHistory, setCampaignHistory] = useState<CampaignRecord[]>([]);
    const [learningInsights, setLearningInsights] = useState<LearningInsight[]>([]);
    const [learningLoading, setLearningLoading] = useState(false);
    const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
    const [dailyLoading, setDailyLoading] = useState(false);
    const [catalog, setCatalog] = useState<CatalogStatus | null>(null);
    const [catalogLoading, setCatalogLoading] = useState(false);
    const [publicationActivity, setPublicationActivity] = useState<PublicationActivity[]>([]);
    const [publicationLoading, setPublicationLoading] = useState(false);

    const selectSocialAccount = async (channel: Channel, externalId: string) => {
        if (!channel.provider || !channel.social) return;
        try {
            setBusyProvider(channel.provider);
            await apiRequest("/api/admin/marketing/social/" + channel.provider + "/select", { method: "POST", body: JSON.stringify({ channel: channel.social, externalId }) });
            setNotice("✓ " + channel.name + " account selected for publishing.");
            await loadSocial();
        } catch (error) {
            setNotice(error instanceof Error ? error.message : "Could not select the social account.");
        } finally { setBusyProvider(null); }
    };
    const loadEmailStatus = useCallback(async () => {
        try {
            const value = await apiRequest<EmailStatus>("/api/admin/marketing/social/email/status");
            setEmailStatus(value);
        } catch {
            setEmailStatus(null);
        }
    }, []);

    const loadSocial = useCallback(async () => {
        try {
            setSocialLoading(true);
            const value = await apiRequest<SocialState>("/api/admin/marketing/social/?_=" + Date.now());
            setSocial(value);
            setSelectedSocial(socialChannels.map(channel => channel.social!).filter(name => {
                if (!value.channels?.[name]) return false;
                const provider = channels.find(item => item.social === name)?.provider;
                const profile: any = provider ? value.connected?.[provider]?.profile || {} : {};
                const options = name === "facebook" ? profile.pages || [] : name === "instagram" ? profile.instagram || [] : name === "whatsapp" ? profile.whatsapp || [] : name === "pinterest" ? profile.boards || [] : [];
                return options.length <= 1 || Boolean(value.selections?.[name]);
            }));
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
            const [salesResult, googleStatus, gscAnalytics, gaReport, gaRealtimeResult, gaCampaignResult, campaignCenterResult, googleAdsResult] = await Promise.allSettled([
                apiRequest<SalesResponse>(`/api/admin/sales?start=${iso(start)}&end=${iso(end)}`),
                apiRequest<GoogleVerification>(`/api/admin/marketing/search-console/verify-all?_=${Date.now()}`),
                apiRequest<{ rows?: GscRow[] }>(`/api/admin/marketing/search-console/analytics?days=${range}&_=${Date.now()}`),
                apiRequest<GaResponse>(`/api/admin/marketing/search-console/google-analytics/report?days=${range}&_=${Date.now()}`),
                apiRequest<GaRealtimeResponse>(`/api/admin/marketing/search-console/google-analytics/realtime?_=${Date.now()}`),
                apiRequest<{ rows?: Array<{ dimensionValues?: Array<{ value?: string }>; metricValues?: Array<{ value?: string }> }>; startDate?:string; endDate?:string }>(`/api/admin/marketing/search-console/google-analytics/campaigns?days=${range}&_=${Date.now()}`),
                apiRequest<{ results: CampaignResult[] }>(`/api/admin/marketing/social/campaign/results?days=${range}&_=${Date.now()}`),
                apiRequest<GoogleAdsState>(`/api/admin/marketing/social/google-ads/verify?_=${Date.now()}`),
            ]);
            if (salesResult.status === "fulfilled") setSales(salesResult.value);
            if (googleStatus.status === "fulfilled") {
                setGsc({ ...googleStatus.value.searchConsole, connected: Boolean(googleStatus.value.searchConsole?.connected && googleStatus.value.searchConsole?.dataVerified), siteUrl: googleStatus.value.searchConsole?.resolvedSiteUrl || googleStatus.value.searchConsole?.siteUrl });
                setGa({ ...googleStatus.value.analytics, connected: Boolean(googleStatus.value.analytics?.connected && googleStatus.value.analytics?.dataVerified), dataVerified: Boolean(googleStatus.value.analytics?.dataVerified), configured: Boolean(googleStatus.value.analytics?.configured), propertyId: googleStatus.value.analytics?.propertyId });
            } else {
                setGscRows([]);
                setGaRows([]);
                setNotice("Google verification could not be refreshed.");
            }
            if (gscAnalytics.status === "fulfilled") setGscRows(gscAnalytics.value.rows || []);
            else setGscRows([]);
            if (gaReport.status === "fulfilled") {
                setGaRows(gaReport.value.rows || []);
                setGa(current => current ? { ...current, summary: gaReport.value.summary } : current);
            } else setGaRows([]);
            setGaRealtime(gaRealtimeResult.status === "fulfilled" ? gaRealtimeResult.value : null);
            if (gaCampaignResult.status === "fulfilled") {
                const rows = gaCampaignResult.value.rows || [];
                setCampaignAttribution(rows.map((row:any): CampaignAttribution => ({
                    campaignId: String(row.dimensionValues?.[0]?.value || ""),
                    source: String(row.dimensionValues?.[1]?.value || ""),
                    medium: String(row.dimensionValues?.[2]?.value || ""),
                    sessions: Number(row.metricValues?.[0]?.value || 0),
                    activeUsers: Number(row.metricValues?.[1]?.value || 0),
                    conversions: Number(row.metricValues?.[2]?.value || 0),
                    revenue: Number(row.metricValues?.[3]?.value || 0),
                    transactions: Number(row.metricValues?.[4]?.value || 0),
                    attributionStatus: "UNMATCHED"
                })).map((row: CampaignAttribution) => {
                    const match = campaignHistory.some(campaign => campaign.id === row.campaignId);
                    return { ...row, attributionStatus: match ? "MATCHED" : "UNMATCHED" };
                }));
            } else setCampaignAttribution([]);
            if (campaignCenterResult.status === "fulfilled") setCampaignResultsCenter(campaignCenterResult.value.results || []);
            else setCampaignResultsCenter([]);
            if (googleAdsResult.status === "fulfilled") setGoogleAds(googleAdsResult.value);
            else setGoogleAds(null);
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

    const loadCatalog = useCallback(async () => {
        try {
            const response = await apiRequest<{ catalog: CatalogStatus }>("/api/admin/marketing/social/campaign/catalog");
            setCatalog(response.catalog);
        } catch { /* Catalog Autopilot is supplemental. */ }
    }, []);

    const toggleCatalog = useCallback(async (enabled: boolean) => {
        try {
            setCatalogLoading(true);
            const response = await apiRequest<{ catalog: CatalogStatus }>("/api/admin/marketing/social/campaign/catalog", { method: "POST", body: JSON.stringify({ enabled }) });
            setCatalog(response.catalog);
            setNotice(enabled ? "Content Autopilot activado. Productos y Portfolio quedarán disponibles para promoción automática." : "Content Autopilot pausado.");
        } catch (error) { setNotice(error instanceof Error ? error.message : "No se pudo cambiar Catalog Autopilot."); }
        finally { setCatalogLoading(false); }
    }, []);

    const loadPublicationActivity = useCallback(async () => {
        try {
            setPublicationLoading(true);
            const response = await apiRequest<{ publications: PublicationActivity[] }>("/api/admin/marketing/social/campaign/publications?limit=50");
            setPublicationActivity(response.publications || []);
        } catch { /* Publication activity is supplemental; do not block the Marketing Center. */ }
        finally { setPublicationLoading(false); }
    }, []);

    const loadCampaignHistory = useCallback(async () => {
        try {
            const response = await apiRequest<{ campaigns: CampaignRecord[] }>("/api/admin/marketing/social/campaign/history?limit=6");
            setCampaignHistory(response.campaigns || []);
        } catch { /* Marketing history is supplemental; do not block the page. */ }
    }, []);

    useEffect(() => { void load(); void loadSocial(); void loadEmailStatus(); void loadCampaignHistory(); void loadPublicationActivity(); void loadLearning(); void loadDailySummary(); void loadCatalog(); }, [load, loadSocial, loadCampaignHistory, loadPublicationActivity, loadLearning, loadDailySummary, loadCatalog]);
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get("social") === "connected") setNotice(`Cuenta ${params.get("provider") || "social"} conectada correctamente.`);
        if (params.get("social") === "error") setNotice(params.get("message") || "La conexión social no pudo completarse.");
        if (params.has("social")) { void loadSocial(); window.history.replaceState({}, "", window.location.pathname); }
    }, [loadSocial]);

    useEffect(() => { const previous = document.body.style.backgroundColor; document.body.style.backgroundColor = "#07101d"; return () => { document.body.style.backgroundColor = previous; }; }, []);
    const salesChart = useMemo(() => { const daily = (sales?.daily || []).slice(-14); const max = Math.max(...daily.map(row => Number(row.revenue || 0)), 1); return daily.map(row => ({ ...row, revenueNumber: Number(row.revenue || 0), height: Math.max(4, (Number(row.revenue || 0) / max) * 100) })); }, [sales]);
    const latestPublications = useMemo(() => publicationActivity.slice(0, 3), [publicationActivity]);
    const publicationStats = useMemo(() => ({
        total: publicationActivity.length,
        published: publicationActivity.filter(item => item.published).length,
        failed: publicationActivity.filter(item => !item.published && item.status !== "PROCESSING").length,
        links: publicationActivity.filter(item => Boolean(item.result?.url)).length,
    }), [publicationActivity]);
    const salesMetrics = useMemo(() => {
        const daily = sales?.daily || [];
        return { orders: daily.reduce((sum, row) => sum + Number(row.orders || 0), 0), revenue: daily.reduce((sum, row) => sum + Number(row.revenue || 0), 0) };
    }, [sales]);
    const searchMetrics = useMemo<SearchMetrics>(() => {
        const totals = gscRows.reduce<SearchMetrics>((sum, row) => ({
            clicks: sum.clicks + Number(row.clicks || 0),
            impressions: sum.impressions + Number(row.impressions || 0),
            ctr: sum.ctr + Number(row.ctr || 0) * Number(row.impressions || 0),
            position: sum.position + Number(row.position || 0) * Number(row.impressions || 0),
            count: sum.count + 1,
        }), { clicks: 0, impressions: 0, ctr: 0, position: 0, count: 0 });
        return totals;
    }, [gscRows]);
    const gaMetrics = useMemo(() => ({
        users: Number((ga as any)?.summary?.activeUsers ?? NaN),
        sessions: Number((ga as any)?.summary?.sessions ?? NaN),
        views: Number((ga as any)?.summary?.screenPageViews ?? NaN),
        revenue: Number((ga as any)?.summary?.totalRevenue ?? NaN),
    }), [ga]);
    const realtimeLabel = gaRealtime?.activeUsers == null ? "N/A" : gaRealtime.activeUsers.toLocaleString();
    const realtimeEventsLabel = gaRealtime?.eventCount == null ? "N/A" : gaRealtime.eventCount.toLocaleString();

    const isConnected = (channel: Channel) => channel.social ? Boolean(social.channels?.[channel.social]) : channel.name === "Google" ? Boolean(gsc?.connected && gsc?.dataVerified && ga?.connected && ga?.dataVerified) : false;
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
        // A newly opened campaign always starts as manual. Autopilot must be an explicit user choice.
        // Generate one idempotency key for this campaign draft so repeated taps/retries
        // cannot create a second campaign on the backend.
        campaignLaunchLock.current = false;
        campaignIdempotencyKey.current = crypto.randomUUID();
        setCampaignAutopilot(false);
        setCampaignSendEmail(false);
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
    const refreshGoogle = async () => {
        setGoogleChecking(true);
        setNotice("");
        try {
            const health = await apiRequest<GoogleVerification>(`/api/admin/marketing/search-console/verify-all?_=${Date.now()}`);

            setGsc({
                ...health.searchConsole,
                connected: Boolean(health.searchConsole?.connected && health.searchConsole?.dataVerified),
                siteUrl: health.searchConsole?.resolvedSiteUrl || health.searchConsole?.siteUrl,
            });
            setGa({
                ...health.analytics,
                configured: Boolean(health.analytics?.configured),
                propertyId: health.analytics?.propertyId,
            });

            if (!health.connected) {
                setGscRows([]);
                setGaRows([]);
                const gscError = health.searchConsole?.error ? `Search Console: ${health.searchConsole.error}` : "";
                const gaError = health.analytics?.error ? `GA4: ${health.analytics.error}` : "";
                setNotice([gscError, gaError].filter(Boolean).join(" · ") || "Google verification did not reach DATA_AVAILABLE for both services.");
                return;
            }

            const [gscAnalytics, gaReport] = await Promise.allSettled([
                apiRequest<{ rows?: GscRow[] }>("/api/admin/marketing/search-console/analytics?days=30"),
                apiRequest<GaResponse>("/api/admin/marketing/search-console/google-analytics/report?days=30"),
            ]);
            if (gscAnalytics.status === "fulfilled") setGscRows(gscAnalytics.value.rows || []);
            if (gaReport.status === "fulfilled") {
                setGaRows(gaReport.value.rows || []);
                setGa(current => current ? { ...current, summary: gaReport.value.summary } : current);
            }

            const dataErrors = [
                gscAnalytics.status === "rejected" && `Search Console data: ${gscAnalytics.reason instanceof Error ? gscAnalytics.reason.message : "request failed"}`,
                gaReport.status === "rejected" && `GA4 data: ${gaReport.reason instanceof Error ? gaReport.reason.message : "request failed"}`,
            ].filter(Boolean);
            if (dataErrors.length) {
                setNotice(dataErrors.join(" · "));
                return;
            }

            setNotice("✅ Google conectado y verificado: Search Console + GA4 están respondiendo con datos reales.");
        } catch (error) {
            setNotice(error instanceof Error ? error.message : "Google verification failed.");
        } finally {
            setGoogleChecking(false);
        }
    };
    const openSeo = () => { setModal("Google"); void refreshGoogle(); };
    const setupTitle = (provider: string) => provider === "meta" ? "Facebook · Instagram · WhatsApp" : provider === "youtube" ? "YouTube / Google" : provider === "tiktok" ? "TikTok" : "Pinterest";

    const toggleChannel = (channel: SocialChannel) => setSelectedSocial(current => current.includes(channel) ? current.filter(item => item !== channel) : [...current, channel]);
    const publish = async () => {
        if (!selectedSocial.length || !publishText.trim()) { setNotice("Selecciona al menos un canal conectado y escribe el mensaje."); return; }
        try {
            setPublishing(true); setPublishResults({});
            const idempotencyKey = crypto.randomUUID();
            const response = await apiRequest<{ results: Record<string, PublishResult>; campaignId?: string }>("/api/admin/marketing/social/publish", { method: "POST", body: JSON.stringify({ idempotencyKey, campaignName: "Central Publisher", channels: selectedSocial, text: publishText.trim(), imageUrl: imageUrl.trim() || undefined, videoUrl: videoUrl.trim() || undefined, link: link.trim() || undefined, whatsappTo: whatsappTo.trim() || undefined, youtubePrivacy }) });
            setPublishResults(response.results || {});
            setNotice(response.campaignId ? `Publication recorded in Marketing Ledger · ${response.campaignId}` : "Publication recorded in Marketing Ledger.");
            await Promise.all([loadPublicationActivity(), loadCampaignHistory(), loadLearning(), loadDailySummary()]);
        } catch (error) { setNotice(error instanceof Error ? error.message : "No se pudo publicar."); }
        finally { setPublishing(false); }
    };

    const launchCampaign = async () => {
        // The mobile UI can receive multiple taps before React has rendered the
        // disabled state. The ref closes that race immediately.
        if (campaignLaunchLock.current) {
            setNotice("Esta campaña ya se está creando. Espera a que termine.");
            return;
        }
        if (!campaignName.trim() || !campaignMessage.trim()) {
            setNotice("La campaña necesita nombre y mensaje.");
            return;
        }
        if (!selectedSocial.length && !campaignSendEmail) {
            setNotice("Selecciona al menos una red conectada o activa Email.");
            return;
        }
        if (selectedSocial.includes("youtube") && !campaignVideoUrl.trim()) {
            setNotice("YouTube necesita un video subido y una URL pública antes de crear la campaña.");
            return;
        }
        try {
            campaignLaunchLock.current = true;
            setCampaignLaunching(true);
            setCampaignResults(null);
            const idempotencyKey = campaignIdempotencyKey.current || (campaignIdempotencyKey.current = crypto.randomUUID());
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
                    campaignType,
                    startsAt: campaignStartsAt ? new Date(campaignStartsAt).toISOString() : undefined,
                    endsAt: campaignEndsAt ? new Date(campaignEndsAt).toISOString() : undefined,
                    recurrenceHours: Number(campaignRecurrenceHours || 6),
                    youtubePrivacy,
                    idempotencyKey,
                }),
            });
            setCampaignResults(response.data);
            const campaignId = response.data?.campaignId || "OK";
            const successMessage = campaignAutopilot
                ? `✅ Campaña creada y agregada al Autopilot. ID: ${campaignId}`
                : `✅ Campaña creada. ID: ${campaignId}`;
            setNotice(successMessage);
            setModal(null);
            await Promise.all([loadCampaignHistory(), loadPublicationActivity(), loadLearning(), loadDailySummary()]);
        } catch (error) {
            campaignLaunchLock.current = false;
            setNotice(error instanceof Error ? error.message : "No se pudo lanzar la campaña.");
        } finally {
            setCampaignLaunching(false);
        }
    };

    const sendEmailCampaign = async () => {
        if (!emailSubject.trim() || !emailMessage.trim()) { setNotice("Escribe el asunto y el mensaje de la promoción."); return; }
        try {
            setEmailSending(true);
            const idempotencyKey = crypto.randomUUID();
            const response = await apiRequest<{ data: { campaignId:string; email?: { totalRecipients:number } } }>("/api/admin/marketing/social/campaign/launch", {
                method: "POST",
                body: JSON.stringify({
                    name: emailSubject.trim(),
                    objective: "Email promotion",
                    targetArea: "Email subscribers",
                    message: emailMessage.trim(),
                    subject: emailSubject.trim(),
                    imageUrl: emailImageUrl.trim() || undefined,
                    channels: [],
                    sendEmail: true,
                    autopilot: false,
                    campaignType: "manual",
                    idempotencyKey,
                })
            });
            const result = response.data;
            setNotice(`Promoción registrada en Marketing Ledger · ${result.campaignId} · ${result.email?.totalRecipients || 0} destinatarios.`);
            setEmailSubject(""); setEmailMessage(""); setEmailImageUrl("");
            setModal(null);
            await Promise.all([loadCampaignHistory(), loadPublicationActivity(), loadLearning(), loadDailySummary()]);
        } catch (error) { setNotice(error instanceof Error ? error.message : "No se pudo enviar la promoción."); }
        finally { setEmailSending(false); }
    };

    return <div className="marketing-page"><style>{`
      .marketing-page{min-height:100dvh;min-height:100vh;overflow-x:hidden;background:var(--skin-surface);color:var(--skin-text);font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.marketing-main{margin-left:270px;padding:24px 26px 42px;max-width:1600px}.hero,.card,.stat{background:var(--skin-surface-alt);border:1px solid var(--skin-border);border-radius:14px}.hero{padding:28px 32px;background:linear-gradient(115deg,color-mix(in srgb,var(--skin-primary) 18%,var(--skin-surface)),var(--skin-surface-alt) 58%,color-mix(in srgb,var(--skin-primary) 10%,var(--skin-surface)))}.eyebrow{display:flex;align-items:center;gap:5px;font-size:11px;letter-spacing:.08em;color:var(--skin-text-muted);font-weight:800}.marketing-identity-mark{display:inline-flex;align-items:center;gap:5px;color:var(--skin-text);font-weight:900}.marketing-identity-mark::before{content:"";width:7px;height:7px;border-radius:50%;background:linear-gradient(135deg,var(--skin-primary),var(--skin-accent));box-shadow:0 0 0 3px color-mix(in srgb,var(--skin-primary) 12%,transparent)}.hero h1{font-size:38px;margin:8px 0;color:#172238;background:linear-gradient(180deg,#172238 0%,#172238 38%,#64748b 50%,#172238 64%,#172238 100%);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;text-shadow:0 2px 5px rgba(23,34,56,.16);-webkit-text-stroke:.25px rgba(23,34,56,.28)}.hero h1 span{color:#245b9b;position:relative;background:linear-gradient(180deg,#245b9b 0%,#7faee0 48%,#245b9b 62%,#245b9b 100%);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;text-shadow:0 2px 5px rgba(36,91,155,.14)}.hero h1 span::after{content:"";display:block;width:54px;height:4px;margin-top:7px;border-radius:99px;background:linear-gradient(90deg,#1f5fa8,#b52835)}.hero p{color:#526176!important;opacity:1;max-width:900px;line-height:1.5;text-shadow:none}.actions{display:flex;gap:9px;margin-top:16px;flex-wrap:wrap}.btn{border:1px solid #50617d;border-radius:9px;background:var(--skin-surface-alt);color:var(--skin-text);padding:10px 14px;font-weight:700;display:inline-flex;align-items:center;gap:7px;cursor:pointer}.btn:disabled{opacity:.55;cursor:not-allowed}.primary{border-color:var(--skin-primary);background:linear-gradient(135deg,var(--skin-primary),var(--skin-accent))}.stats{display:grid;grid-template-columns:repeat(4,1fr) 180px;gap:9px;margin:12px 0}.stat{padding:14px}.stat-top{display:flex;justify-content:space-between;color:var(--skin-text-muted);font-size:11px}.stat strong{display:block;font-size:23px;margin:6px 0}.stat small{color:#16834a;font-weight:700}.range{display:flex;align-items:center;justify-content:center;gap:6px}.select,.input,.textarea{background:var(--skin-surface-alt);border:1px solid #41536d;color:var(--skin-text);border-radius:8px;padding:10px}.section{margin-top:18px}.section-title{padding:0 2px 9px}.section-title h2{font-size:19px;margin:0}.section-title p{font-size:12px;color:var(--skin-text-muted);margin:5px 0}.integration{display:grid;grid-template-columns:1fr 1fr;gap:10px}.integration-card{padding:15px}.integration-head{display:flex;align-items:center;justify-content:space-between}.integration-head h3{margin:0;font-size:15px}.integration p{font-size:11px;color:var(--skin-text-muted);line-height:1.45}.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}.metric{background:var(--skin-surface-alt);border:1px solid var(--skin-border);border-radius:9px;padding:9px}.metric b{display:block;font-size:16px}.metric span{font-size:9px;color:var(--skin-text-muted)}.channels{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.channel{padding:15px;position:relative}.channel-top{display:flex;align-items:center;justify-content:space-between}.channel-icon{width:44px;height:44px;border-radius:12px;display:grid;place-items:center;background:var(--skin-surface-alt)}.channel strong{display:block;font-size:15px;margin-top:10px}.channel small{display:block;color:var(--skin-text-muted);font-size:10px;margin-top:3px}.status{display:inline-flex;align-items:center;gap:5px;margin-top:9px;border-radius:999px;padding:5px 8px;background:color-mix(in srgb,var(--skin-primary) 10%,var(--skin-surface-alt));color:var(--skin-text-muted);font-size:9px}.status.connected{color:#16834a;background:color-mix(in srgb,var(--skin-primary) 14%,var(--skin-surface-alt))}.account{display:block;color:#d7e0eb;font-size:10px;margin-top:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.notice{padding:10px;border:1px solid var(--skin-border);border-radius:9px;background:var(--skin-surface-alt);color:var(--skin-text-muted);font-size:11px;line-height:1.45;margin-top:12px}.composer-grid,.campaign-grid{display:grid;grid-template-columns:1fr 1.4fr;gap:14px}.checks{display:grid;gap:7px}.check{display:flex;align-items:center;gap:9px;padding:10px;border:1px solid var(--skin-border);border-radius:9px;background:var(--skin-surface-alt);cursor:pointer}.check.selected{border-color:#6549b7;background:#171b35}.check input{accent-color:#8a42ff}.result{padding:9px;border-radius:8px;margin-top:7px;border:1px solid var(--skin-border);font-size:10px}.result.ok{border-color:#1d7047;background:#0d2a1d;color:#8ff0b5}.result.fail{border-color:#6c3131;background:#2a1212;color:#ffaaaa}.modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.72);z-index:100;display:grid;place-items:center;padding:16px}.modal{width:min(760px,100%);max-height:92vh;overflow:auto;background:var(--skin-surface-alt);border:1px solid #344967;border-radius:15px;padding:20px}.modal-head{display:flex;justify-content:space-between;align-items:center}.close{background:none;border:0;color:#aab8ca;cursor:pointer}.modal h2{margin:0}.field{display:flex;flex-direction:column;gap:5px;margin-bottom:10px}.field label{font-size:10px;color:#8e9caf;font-weight:700}.textarea{min-height:130px;resize:vertical}.quick{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.marketing-nav{position:sticky;top:10px;z-index:20;display:flex;gap:7px;flex-wrap:wrap;margin:14px 0;padding:8px;background:rgba(7,16,29,.94);border:1px solid var(--skin-border);border-radius:12px;backdrop-filter:blur(10px)}.marketing-nav button{border:1px solid var(--skin-border);background:var(--skin-surface-alt);color:var(--skin-text);border-radius:8px;padding:8px 11px;font-size:11px;font-weight:700;cursor:pointer}.chart-card{margin-top:10px;padding:15px}.sales-chart{height:190px;display:flex;align-items:flex-end;gap:6px;padding:16px 4px 0;border-top:1px solid #26364e}.chart-column{height:100%;flex:1;min-width:12px;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:5px}.chart-bar{width:100%;max-width:32px;min-height:4px;border-radius:5px 5px 2px 2px;background:linear-gradient(180deg,#8a42ff,#24a8ef)}.chart-column span{font-size:8px;color:#75859a;white-space:nowrap}.quick .card{padding:15px;text-align:left;color:var(--skin-text);cursor:pointer}.quick strong{display:block;font-size:12px;margin-top:7px}.quick small{display:block;color:var(--skin-text-muted);font-size:10px;margin-top:4px}@media(max-width:1200px){.channels{grid-template-columns:repeat(2,1fr)}.quick{grid-template-columns:repeat(2,1fr)}.stats{grid-template-columns:repeat(2,1fr)}.composer-grid,.campaign-grid{grid-template-columns:1fr}}@media(max-width:800px){.marketing-main{margin-left:0;padding:15px}.hero h1{font-size:29px}.channels{grid-template-columns:1fr 1fr}.stats{grid-template-columns:1fr 1fr}.metrics{grid-template-columns:1fr 1fr}}

      .marketing-page .input,.marketing-page .select,.marketing-page .textarea{color:var(--skin-text)!important;background:var(--skin-surface)!important;border-color:var(--skin-border)!important;caret-color:var(--skin-primary)}
      .marketing-page .input::placeholder,.marketing-page .textarea::placeholder{color:var(--skin-text-muted)!important;opacity:.85}
      .marketing-page select option{background:var(--skin-surface);color:var(--skin-text)}
      .marketing-page .field>label{color:var(--skin-text)!important}
      .marketing-page .marketing-main{width:min(100%,1600px);margin-inline:auto}
      .marketing-page .integration,.marketing-page .channels,.marketing-page .stats,.marketing-page .metrics{align-items:stretch}
      @media(max-width:1100px){.marketing-main{margin-left:0!important;padding:18px}.channels{grid-template-columns:repeat(2,1fr)!important}.stats{grid-template-columns:repeat(2,1fr)!important}.metrics{grid-template-columns:repeat(2,1fr)!important}.composer-grid,.campaign-grid{grid-template-columns:1fr!important}}
      @media(max-width:720px){.marketing-main{padding:14px}.integration{grid-template-columns:1fr!important}.channels{grid-template-columns:1fr!important}.stats{grid-template-columns:1fr!important}.metrics{grid-template-columns:1fr!important}.hero{padding:20px}.hero h1{font-size:30px}.marketing-page .actions{align-items:stretch}.marketing-page .btn{justify-content:center}}
      html[data-jqy-theme="corporate"] .marketing-page{background:var(--skin-surface)!important;color:var(--skin-text)!important}
      html[data-jqy-theme="corporate"] .marketing-page .hero,html[data-jqy-theme="corporate"] .marketing-page .card,html[data-jqy-theme="corporate"] .marketing-page .stat,html[data-jqy-theme="corporate"] .marketing-page .integration-card,html[data-jqy-theme="corporate"] .marketing-page .channel{background:var(--skin-surface-alt)!important;border-color:var(--skin-border)!important;color:var(--skin-text)!important}
      html[data-jqy-theme="corporate"] .marketing-page .btn.primary{background:linear-gradient(135deg,var(--skin-primary),var(--skin-accent))!important;border-color:var(--skin-primary)!important;color:var(--skin-button-text)!important}
      html[data-jqy-theme="corporate"] .marketing-page .btn{background:var(--skin-surface-alt)!important;color:var(--skin-text)!important;border-color:var(--skin-border)!important}
      .marketing-page .marketing-nav button,.marketing-page .quick .card,.marketing-page .field label{color:var(--skin-text)!important;border-color:var(--skin-border)}
      .marketing-page .marketing-nav button:hover,.marketing-page .quick .card:hover{border-color:var(--skin-primary);box-shadow:0 6px 18px color-mix(in srgb,var(--skin-primary) 10%,transparent)}
      .marketing-page .notice{color:var(--skin-text)!important;background:var(--skin-surface-alt)!important;border-color:var(--skin-border)!important}
      .marketing-page .status{color:var(--skin-text)!important}
      .marketing-page .result{color:var(--skin-text)!important}
      .marketing-page .modal{color:var(--skin-text)!important;background:var(--skin-surface-alt)!important;border-color:var(--skin-border)!important}
      .marketing-page .modal p,.marketing-page .modal small{color:var(--skin-text-muted)!important}
      .marketing-page a{color:var(--skin-primary)}
      .marketing-page .marketing-identity-mark{color:var(--skin-text)!important}
    `}</style>
      <AdminSidebar username="Administrator" />
      <main className="marketing-main">
        <section className="hero"><div className="eyebrow"><span className="marketing-identity-mark">JQYD</span><span>· MARKETING BRAIN</span></div><h1>Grow Your Brand <span>Everywhere</span></h1><p>Centro operativo para lanzar una campaña desde un solo lugar: redes conectadas, email y estrategia de descubrimiento en Google. El sistema conserva el resultado de cada lanzamiento.</p><div className="actions"><button className="btn primary" onClick={openCampaign}><Sparkles size={15}/>Create Campaign + Autopilot</button><button className="btn" onClick={() => openComposer()}><Send size={15}/>Publish Now</button><button className="btn" onClick={() => { void load(); void loadSocial(); void loadPublicationActivity(); }} disabled={loading || refreshing || socialLoading}><RefreshCw size={15}/>Refresh</button></div>{latestPublications.length > 0 && <div className="notice"><b>Últimas publicaciones reales:</b>{latestPublications.map(item => { const result=item.result || {}; return <div key={String(item.run_id)} style={{marginTop:6}}>{item.status === "PROCESSING" ? "⏳" : item.published ? "✅" : "❌"} <b>{item.channel}</b> · {result.account || "Cuenta no indicada"} · {item.campaign_name} · {new Date(item.created_at).toLocaleString()}{result.url ? <> · <a href={result.url} target="_blank" rel="noreferrer" style={{color:"#9ed8ff"}}>Ver publicación ↗</a></> : ""}</div>; })}</div>}{notice && <div className="notice">{notice}</div>}</section>
        <section className="stats"><article className="stat"><div className="stat-top"><span>Visitors</span><MousePointer2 size={17}/></div><strong>{gaMetrics.users.toLocaleString()}</strong><small>{ga?.configured ? "Google Analytics 4" : "Connect GA4"}</small></article><article className="stat"><div className="stat-top"><span>Page Views</span><TrendingUp size={17}/></div><strong>{gaMetrics.views.toLocaleString()}</strong><small>{ga?.configured ? "Live GA4 data" : "Connect GA4"}</small></article><article className="stat"><div className="stat-top"><span>Orders</span><Users size={17}/></div><strong>{salesMetrics.orders.toLocaleString()}</strong><small>Live order data</small></article><article className="stat"><div className="stat-top"><span>Revenue</span><BarChart3 size={17}/></div><strong>${salesMetrics.revenue.toFixed(2)}</strong><small>Live sales data</small></article><div className="stat range"><Clock3 size={14}/><select className="select" value={range} onChange={event => setRange(event.target.value as "7"|"30"|"90")}><option value="7">7 days</option><option value="30">30 days</option><option value="90">90 days</option></select></div></section>
        <div className="marketing-nav"><button onClick={() => document.getElementById("marketing-analytics")?.scrollIntoView({behavior:"smooth"})}>📊 Analytics</button><button onClick={() => document.getElementById("marketing-channels")?.scrollIntoView({behavior:"smooth"})}>🔌 Conectores</button><button onClick={() => document.getElementById("marketing-autopilot")?.scrollIntoView({behavior:"smooth"})}>🤖 Autopilot</button><button onClick={() => document.getElementById("marketing-activity")?.scrollIntoView({behavior:"smooth"})}>🌐 Publicaciones</button><button onClick={openCampaign}>✨ Crear campaña</button></div>
        <section id="marketing-analytics" className="section"><div className="section-title"><h2>Google Integrations + Real Analytics</h2><p>Measurement and publication are separated. Realtime data is never merged into historical totals.</p></div><div className="integration"><article className="card integration-card"><div className="integration-head"><h3>Google Analytics 4</h3>{ga?.connected && ga?.dataVerified && <span className="status connected">● Connected</span>}</div><p>{ga?.connected && ga?.dataVerified ? "Property " + ga.propertyId + " verified with a live GA4 report." : ga?.configured ? "Property " + ga.propertyId + " is configured but not currently verified." : ga?.error || "Needs property ID + service-account access"}</p><div className="metrics"><div className="metric"><b>{gaMetrics.users.toLocaleString()}</b><span>Active users</span></div><div className="metric"><b>{gaMetrics.sessions.toLocaleString()}</b><span>Sessions</span></div><div className="metric"><b>{gaMetrics.views.toLocaleString()}</b><span>Page views</span></div><div className="metric"><b>${gaMetrics.revenue.toFixed(2)}</b><span>GA revenue</span></div></div></article><article className="card integration-card"><div className="integration-head"><h3>Google Search Console</h3>{gsc?.connected && gsc?.dataVerified && <span className="status connected">● Connected</span>}</div><p>{gsc?.connected && gsc?.dataVerified ? "Connected to " + gsc.siteUrl + " and verified with live Search Console data." : gsc?.configured ? "Search Console is configured but not currently verified." : gsc?.error || "Needs service-account property access"}</p><div className="metrics"><div className="metric"><b>{searchMetrics.clicks.toLocaleString()}</b><span>Clicks</span></div><div className="metric"><b>{searchMetrics.impressions.toLocaleString()}</b><span>Impressions</span></div><div className="metric"><b>{searchMetrics.impressions ? (searchMetrics.clicks / searchMetrics.impressions * 100).toFixed(2) : "0.00"}%</b><span>CTR</span></div><div className="metric"><b>{searchMetrics.impressions ? (searchMetrics.position / searchMetrics.impressions).toFixed(1) : "—"}</b><span>Avg. position</span></div></div></article></div><article className="card chart-card"><div className="integration-head"><div><h3>Sales trend · last {salesChart.length || 0} days</h3><p>Revenue diario registrado por JQYDesigns. Sin datos inventados.</p></div><b>{salesMetrics.orders} orders · ${salesMetrics.revenue.toFixed(2)}</b></div><div className="sales-chart">{salesChart.length ? salesChart.map(row => <div className="chart-column" key={row.date} title={row.date + ": $" + row.revenueNumber.toFixed(2) + " · " + row.orders + " orders"}><div className="chart-bar" style={{height:row.height + "%"}}></div><span>{row.date.slice(5)}</span></div>) : <div className="notice">No hay ventas registradas para el período seleccionado.</div>}</div></article></section>
        <section className="section"><div className="section-title"><h2>Realtime + Attribution Command Center</h2><p>Realtime, historical measurement, campaign attribution and publication results remain separate.</p></div><article className="card" style={{padding:16}}><div className="metrics"><div className="metric"><b>{realtimeLabel}</b><span>Active users realtime</span></div><div className="metric"><b>{realtimeEventsLabel}</b><span>Realtime events</span></div><div className="metric"><b>{gaRealtime?.generatedAt ? new Date(gaRealtime.generatedAt).toLocaleString() : "N/A"}</b><span>Last realtime query</span></div><div className="metric"><b>{gaRows.length || "N/A"}</b><span>Historical GA4 rows</span></div></div>{!gaRealtime && <div className="notice">Realtime unavailable — no value is presented as zero.</div>}</article><article className="card" style={{padding:16,marginTop:10}}><div className="integration-head"><h3>Campaign Attribution</h3><span className="status">{campaignAttribution.length} rows</span></div>{campaignAttribution.length ? <div style={{overflowX:"auto",marginTop:10}}><table style={{width:"100%",fontSize:10,borderCollapse:"collapse"}}><thead><tr><th align="left">Campaign</th><th>Source</th><th>Medium</th><th>Sessions</th><th>Conversions</th><th>Revenue</th><th>Status</th></tr></thead><tbody>{campaignAttribution.slice(0,20).map(row=><tr key={row.campaignId+"-"+row.source+"-"+row.medium}><td>{row.campaignId || "N/A"}</td><td>{row.source || "N/A"}</td><td>{row.medium || "N/A"}</td><td>{row.sessions.toLocaleString()}</td><td>{row.conversions.toLocaleString()}</td><td>${row.revenue.toFixed(2)}</td><td>{row.attributionStatus}</td></tr>)}</tbody></table></div> : <div className="notice">No campaign attribution data available for the selected period.</div>}</article><article className="card" style={{padding:16,marginTop:10}}><div className="integration-head"><h3>Google Ads</h3><span className={googleAds?.connected && googleAds.liveVerified ? "status connected" : "status"}>{googleAds?.state || "N/A"}</span></div><p>{googleAds?.message || googleAds?.error || "Google Ads verification has not returned data."}</p>{googleAds?.missing?.length ? <div className="notice">Missing real credentials: {googleAds.missing.join(", ")}</div> : null}</article><article className="card" style={{padding:16,marginTop:10}}><div className="integration-head"><h3>Campaign Result Center</h3><span className="status">{campaignResultsCenter.length} campaigns</span></div>{campaignResultsCenter.length ? <div style={{overflowX:"auto",marginTop:10}}><table style={{width:"100%",fontSize:10,borderCollapse:"collapse"}}><thead><tr><th align="left">Campaign</th><th>Status</th><th>Published</th><th>Processing</th><th>Failed</th><th>Sessions</th><th>Revenue</th></tr></thead><tbody>{campaignResultsCenter.slice(0,20).map(row=><tr key={row.campaignId}><td>{row.campaignName}</td><td>{row.publicationStatus}</td><td>{row.published}</td><td>{row.processing}</td><td>{row.failed}</td><td>{row.metrics.sessions == null ? "N/A" : row.metrics.sessions.toLocaleString()}</td><td>{row.metrics.revenue == null ? "N/A" : "$"+row.metrics.revenue.toFixed(2)}</td></tr>)}</tbody></table></div> : <div className="notice">No campaign result data available yet.</div>}</article></section><section id="marketing-channels" className="section"><div className="section-title"><div className="integration-head"><div><h2>Connect Your Channels</h2><p>Conecta la cuenta oficial que realmente administra cada canal. Nada está hardcodeado.</p></div><button className="btn" onClick={() => void loadSocial()} disabled={socialLoading}><RefreshCw size={14}/></button></div></div><div className="channels">{channels.map(channel => { const Icon = channel.icon; const rawProfile = channel.provider ? social.connected?.[channel.provider]?.profile || {} : {}; const accountOptions = channel.social === "facebook" ? (rawProfile.pages || []) : channel.social === "instagram" ? (rawProfile.instagram || []) : channel.social === "whatsapp" ? (rawProfile.whatsapp || []) : channel.social === "pinterest" ? (rawProfile.boards || []) : []; const requiresSelection = accountOptions.length > 1; const selectedAccount = channel.social ? social.selections?.[channel.social] : undefined; const connected = isConnected(channel) && (!requiresSelection || Boolean(selectedAccount)); const configured = channel.provider ? Boolean(social.configured?.[channel.provider]) : channel.name === "Google" ? Boolean(gsc?.configured || ga?.configured) : channel.name === "Email" ? Boolean(emailStatus?.configured) : false; return <article className="card channel" key={channel.name}><div className="channel-top"><span className="channel-icon" style={{ color: channel.tone }}><Icon size={21}/></span>{connected && <CheckCircle2 className="connected" size={18}/>}</div><strong>{channel.name}</strong><small>{channel.detail}</small>{requiresSelection && channel.social ? <select className="select" style={{marginTop:8,width:"100%",fontSize:10}} value={selectedAccount || ""} onChange={event => void selectSocialAccount(channel,event.target.value)} disabled={busyProvider === channel.provider}><option value="">Select official account...</option>{accountOptions.map((account:any) => <option key={String(account.id)} value={String(account.id)}>{account.name || account.username || account.display_phone_number || account.business_name || String(account.id)}</option>)}</select> : null}{connected ? <><span className="status connected"><CheckCircle2 size={11}/>Connected</span><span className="account">{accountName(channel)}</span>{channel.provider && <div className="actions" style={{ marginTop: 8 }}><button className="btn" style={{ padding: "6px 8px", fontSize: 9 }} onClick={async () => { try { setBusyProvider(channel.provider!); const result = await apiRequest<{verified?:boolean;error?:string}>(`/api/admin/marketing/social/${channel.provider}/verify`); setNotice(result.verified ? `✓ ${channel.name} verified against the live provider API.` : result.error || `${channel.name} verification failed.`); await loadSocial(); } catch (error) { setNotice(error instanceof Error ? error.message : `${channel.name} verification failed.`); } finally { setBusyProvider(null); } }} disabled={busyProvider === channel.provider}><CheckCircle2 size={11}/>Verify live</button><button className="btn" style={{ padding: "6px 8px", fontSize: 9 }} onClick={() => void disconnect(channel)} disabled={busyProvider === channel.provider}><Unplug size={11}/>Disconnect</button></div>}</> : channel.name === "Google" ? <><span className="status">{configured ? "Analytics ready" : "Needs configuration"}</span><button className="btn primary" style={{ marginTop: 9, padding: "7px 10px", fontSize: 10 }} onClick={openSeo}><Search size={12}/>Configure Google</button></> : channel.name === "Email" ? <><span className={configured ? "status connected" : "status"}>{configured ? "Configured" : "Needs configuration"}</span><span className="account">{emailStatus?.fromEmail || "Resend sender not configured"}</span><div className="actions" style={{ marginTop: 8 }}><button className="btn primary" style={{ padding: "6px 8px", fontSize: 9 }} onClick={() => void openEmailCampaign()}><Mail size={11}/>Open Email Campaign</button><button className="btn" style={{ padding: "6px 8px", fontSize: 9 }} onClick={() => void loadEmailStatus()}><RefreshCw size={11}/>Refresh</button></div></> : configured ? <button className="btn primary" style={{ marginTop: 9, padding: "7px 10px", fontSize: 10 }} onClick={() => void connect(channel)} disabled={Boolean(busyProvider)}>{busyProvider === channel.provider ? <Loader2 size={12}/> : <Link2 size={12}/>} Connect official account</button> : <button className="btn" style={{ marginTop: 9, padding: "7px 10px", fontSize: 10 }} onClick={() => setSetupProvider(channel.provider!)}><Link2 size={12}/>Setup connection</button>}</article>; })}</div></section>
        <section className="section"><div className="section-title"><h2>JQ&YD Marketing Learning</h2><p>Learning solo se considera respaldado cuando existen resultados reales atribuidos; una fila de publicación por sí sola no cuenta como aprendizaje.</p></div><article className="card" style={{ padding: 16 }}><div className="metrics">{learningInsights.map(item => <div className="metric" key={item.channel}><b>{(item.score * 100).toFixed(1)}</b><span>{item.channel} · {item.observations} obs{item.recommended ? " · recomendado" : ""}</span></div>)}</div><div className="notice">{learningLoading ? "Actualizando aprendizaje..." : learningInsights.some(item => item.sessions > 0 || item.conversions > 0 || item.revenue > 0) ? "Learning activo con evidencia de GA4: sesiones, conversiones y/o revenue atribuidos." : "Sin evidencia de resultado atribuido todavía. Las publicaciones se registran, pero el sistema no las presenta como aprendizaje hasta recibir datos reales."}</div></article></section><section className="section"><div className="section-title"><div className="integration-head"><div><h2>Daily Growth Report</h2><p>Resumen real de las últimas 24 horas: dónde se publicó, tráfico, conversiones e ingresos. El reporte diario también se envía al correo de Marketing después de existir la primera campaña.</p></div><button className="btn" onClick={() => void loadDailySummary()} disabled={dailyLoading}><RefreshCw size={14}/>{dailyLoading ? "Updating..." : "Refresh"}</button></div></div>{dailySummary && <article className="card" style={{ padding: 16 }}><div className="metrics"><div className="metric"><b>{dailySummary.last24.publications}</b><span>Publicaciones 24h</span></div><div className="metric"><b>{dailySummary.last24.sessions.toLocaleString()}</b><span>Sesiones</span></div><div className="metric"><b>{dailySummary.last24.conversions}</b><span>Conversiones</span></div><div className="metric"><b>${dailySummary.last24.revenue.toFixed(2)}</b><span>Ingresos atribuidos</span></div><div className="metric"><b>Nivel {dailySummary.learning.level}</b><span>{dailySummary.learning.levelName}</span></div></div><div className="quick" style={{ marginTop: 12 }}>{dailySummary.channels.map(channel => <div className="notice" key={channel.channel}><b>{channel.channel}</b> · {channel.successful}/{channel.publications} publicaciones OK · {channel.sessions} sesiones · {channel.conversions} conversiones · ${channel.revenue.toFixed(2)}</div>)}</div><div className="notice" style={{ marginTop: 12 }}><b>Meta siguiente:</b> {dailySummary.learning.nextTarget}<br/><b>Aprendizaje acumulado:</b> {dailySummary.learning.observations} observaciones · {dailySummary.learning.conversions} conversiones · ${dailySummary.learning.revenue.toFixed(2)}</div></article>}</section><section className="section"><div className="section-title"><div className="integration-head"><div><h2>🤖 Content Autopilot</h2><p>El mismo Marketing Brain trabaja dos fuentes: productos nuevos del catálogo y trabajos del Portfolio. Toma sus imágenes y datos reales y los incorpora al mismo aprendizaje.</p></div><button className="btn" onClick={() => void loadCatalog()} disabled={catalogLoading}><RefreshCw size={14}/>{catalogLoading ? "Updating..." : "Refresh"}</button></div></div><article className="card" style={{ padding: 16 }}><div className="metrics"><div className="metric"><b>{catalog?.enabled ? "ON" : "OFF"}</b><span>Catalog Autopilot</span></div><div className="metric"><b>{catalog?.pendingProducts ?? 0}</b><span>Productos pendientes</span></div><div className="metric"><b>{catalog?.pendingPortfolio ?? 0}</b><span>Trabajos Portfolio pendientes</span></div><div className="metric"><b>{catalog?.lastProductName || "—"}</b><span>Último producto</span></div><div className="metric"><b>{catalog?.lastScanAt ? new Date(catalog.lastScanAt).toLocaleString() : "—"}</b><span>Último escaneo</span></div></div><div className="actions"><button className="btn primary" onClick={() => void toggleCatalog(!catalog?.enabled)} disabled={catalogLoading}>{catalog?.enabled ? "Pause Content Autopilot" : "Activate Content Autopilot"}</button><span className="status connected">Productos + Portfolio · mismo aprendizaje · sin sistema paralelo</span></div>{catalog?.lastCampaignId && <div className="notice"><b>Última campaña automática:</b> {catalog.lastCampaignId}<br/>Los productos se registran como <b>catalog</b> y los trabajos como <b>portfolio</b>; ambos entran al mismo historial por canal.</div>}</article></section><section className="section"><div className="section-title"><h2>Campaign History</h2><p>Últimos lanzamientos realizados desde este Marketing Center.</p></div><div className="quick">{campaignHistory.map(campaign => { const requestedChannels = campaign.channels?.length || 0; const campaignPublications = publicationActivity.filter(item => item.campaign_id === campaign.id); const publishedChannels = campaignPublications.filter(item => item.published).length; const failedChannels = campaignPublications.filter(item => !item.published).length; return <article className="card" key={campaign.id}><strong>{campaign.name}</strong><small>{campaign.target_area} · {new Date(campaign.created_at).toLocaleString()}</small><small>{requestedChannels} configured channels · {publishedChannels} published{failedChannels ? " · " + failedChannels + " failed" : ""}{campaign.results?.email ? ` · Email ${campaign.results.email.totalRecipients}` : ""}{campaign.autopilot_enabled ? " · 🤖 Autopilot ON" : ""}{campaign.campaign_type === "catalog" ? " · Catalog" : campaign.campaign_type === "event" ? " · Event" : " · Manual"}{campaign.autopilot_enabled && campaign.recurrence_hours ? ` · every ${campaign.recurrence_hours}h` : ""}</small><div className="actions" style={{ marginTop: 10 }}><button className="btn" type="button" onClick={() => { setCampaignPreviewCampaign(campaign); setModal(null); }}><Image size={14}/> View Preview</button></div></article>; })}</div></section>
        <section id="marketing-activity" className="section"><div className="section-title"><div className="integration-head"><div><h2>🌐 Marketing Activity</h2><p>Registro real de dónde está trabajando el Marketing Brain: campaña, canal, estado, identificador y enlace externo cuando la plataforma lo proporciona.</p></div><button className="btn" onClick={() => void loadPublicationActivity()} disabled={publicationLoading}><RefreshCw size={14}/>{publicationLoading ? "Updating..." : "Refresh"}</button></div></div><article className="card" style={{ padding: 16 }}><div className="metrics"><div className="metric"><b>{publicationStats.total}</b><span>Publicaciones registradas</span></div><div className="metric"><b>{publicationStats.published}</b><span>Publicadas OK</span></div><div className="metric"><b>{publicationStats.failed}</b><span>Fallidas</span></div><div className="metric"><b>{publicationStats.links}</b><span>Links disponibles</span></div></div><div className="quick" style={{ marginTop: 12 }}>{publicationActivity.length ? publicationActivity.map(item => { const result = item.result || {}; const link = result.url; return <div className="notice" key={String(item.run_id)} style={{ display: "flex", flexDirection: "column", gap: 6 }}><div><b>{item.status === "PROCESSING" ? "⏳" : item.published ? "✅" : "❌"} {item.channel}</b> · {item.run_type === "autopilot" ? "🤖 Autopilot" : "Campaign"} · {new Date(item.created_at).toLocaleString()}</div><div><b>{item.campaign_name}</b>{item.campaign_type ? ` · ${item.campaign_type}` : ""}{item.target_area ? ` · ${item.target_area}` : ""}</div><div>{result.account ? `Cuenta: ${result.account} · ` : ""}{result.id ? `ID: ${result.id}` : "Sin ID externo"}</div>{item.status === "PROCESSING" ? <div style={{ color: "#e0b35c" }}><b>Status:</b> Processing / confirmation pending</div> : null}{result.error ? <div style={{ color: "#b42318" }}><b>Error:</b> {result.error}</div> : null}{link ? <a href={link} target="_blank" rel="noreferrer" className="btn" style={{ width: "fit-content", textDecoration: "none" }}><Link2 size={14}/> Ver publicación ↗</a> : <span style={{ color: "#8391a5" }}>Enlace público no disponible desde la respuesta de la plataforma.</span>}{item.landing_link ? <div style={{ wordBreak: "break-all" }}>Landing rastreada: {item.landing_link}</div> : null}</div> }) : <div className="notice">Todavía no hay ejecuciones registradas. Cuando el robot publique algo, aparecerá aquí con el canal, estado, ID y enlace disponible.</div>}</div></article></section>
        <section className="section"><div className="section-title"><h2>Central Publisher</h2><p>Selecciona todos los canales conectados o solamente los que quieras usar.</p></div><article className="card" style={{ padding: 16 }}><div className="actions" style={{ marginTop: 0 }}><button className="btn primary" onClick={() => openComposer()}><Send size={15}/>Open Publisher</button><span className="status connected">{selectedSocial.length} connected channel{selectedSocial.length === 1 ? "" : "s"} selected</span></div></article></section>
        <section className="section"><div className="quick">
          <button className="card" onClick={openQuickCampaign}><Sparkles size={18}/><strong>Campaign Assistant</strong><small>Start a ready-to-edit campaign in the publisher.</small></button>
          <button className="card" onClick={openSeo}><Search size={18}/><strong>SEO</strong><small>Open live Search Console and Analytics data.</small></button>
          <button className="card" onClick={openCreative}><Image size={18}/><strong>Creative Publisher</strong><small>Prepare an image campaign for social channels.</small></button>
          <button className="card" onClick={openWhatsApp}><MessageCircle size={18}/><strong>WhatsApp</strong><small>Send a real Business message to a recipient.</small></button>
        </div></section>
      </main>
      {setupProvider && <div className="modal-bg" onClick={() => setSetupProvider(null)}><div className="modal" onClick={event => event.stopPropagation()}><div className="modal-head"><h2>Connect {setupTitle(setupProvider)}</h2><button className="close" onClick={() => setSetupProvider(null)}><X size={18}/></button></div><p>Esta conexión es real: primero se configura la aplicación OAuth del proveedor en el servidor y después el botón de conexión te llevará a la cuenta oficial para autorizarla.</p><div className="notice"><b>Variables del backend</b><br/>{(social.setup?.[setupProvider]?.envKeys || []).map(key => <code key={key} style={{ display: "block", marginTop: 4 }}>{key}</code>)}<br/><b>Callback exacto</b><br/><code style={{ wordBreak: "break-all" }}>{social.setup?.[setupProvider]?.callback || ""}</code></div><div className="notice">Después de guardar las credenciales en el entorno Production del backend, pulsa Refresh en esta página. El botón cambiará a <b>Connect official account</b> y podrás autorizar tu cuenta real.</div><div className="actions"><button className="btn primary" onClick={() => { setSetupProvider(null); void loadSocial(); }}><RefreshCw size={14}/>Refresh connection status</button><button className="btn" onClick={() => setSetupProvider(null)}>Close</button></div></div></div>}
      {modal && <div className="modal-bg" onClick={() => setModal(null)}><div className="modal" onClick={event => event.stopPropagation()}><div className="modal-head"><h2>{modal === "composer" ? "Central Publisher" : modal === "email" ? "Email Campaign" : modal === "campaign" ? "Launch Campaign Everywhere" : "Google Integrations"}</h2><button className="close" onClick={() => setModal(null)}><X size={18}/></button></div>{modal === "Google" && <><p>Google se conecta al Marketing Brain para leer Search Console y GA4 y alimentar decisiones con datos reales. No publica anuncios ni garantiza posiciones orgánicas.</p><div className="notice">
<b>Search Console</b><br/>
{gsc?.dataVerified ? "✅ DATA_AVAILABLE" : gsc?.status ? `⚠️ ${gsc.status}` : "⚠️ NOT VERIFIED"} · {gsc?.resolvedSiteUrl || gsc?.siteUrl || "jqydesigns.com"}{gsc?.permissionLevel ? ` · ${gsc.permissionLevel}` : ""}<br/>
{gsc?.error && <span>❌ {gsc.error}<br/></span>}
<b>GA4</b><br/>
{ga?.dataVerified ? "✅ DATA_AVAILABLE" : ga?.status ? `⚠️ ${ga.status}` : "⚠️ NOT VERIFIED"} · Property {ga?.propertyId || "553929161"}<br/>
{ga?.error && <span>❌ {ga.error}<br/></span>}
{(gsc?.rows || ga?.rows) ? <span>Data rows: Search Console {gsc?.rows || 0} · GA4 {ga?.rows || 0}</span> : null}
</div><div className="actions"><button className="btn primary" onClick={() => void refreshGoogle()} disabled={googleChecking}>{googleChecking ? <Loader2 size={14}/> : <RefreshCw size={14}/>} {googleChecking ? "Verifying Google..." : "Verify & refresh Google"}</button></div></>}
      {modal === "campaign" && <><p>Créala una sola vez. Si activas Autopilot, el mismo Marketing Brain la distribuye por los canales conectados, mide resultados y decide las siguientes oportunidades usando el aprendizaje acumulado.</p><div className="campaign-grid"><div>
        <div className="field"><label>CAMPAIGN TYPE</label><div className="checks"><label className={`check ${campaignType === "event" ? "selected" : ""}`}><input type="radio" checked={campaignType === "event"} onChange={() => setCampaignType("event")}/><span>📣 Special / Event Promotion</span></label><label className={`check ${campaignType === "manual" ? "selected" : ""}`}><input type="radio" checked={campaignType === "manual"} onChange={() => setCampaignType("manual")}/><span>📝 General Manual Campaign</span></label></div></div><div className="field"><label>CAMPAIGN NAME</label><input className="input" value={campaignName} onChange={e => setCampaignName(e.target.value)} placeholder="Halloween 2×3"/></div>
        <div className="field"><label>OBJECTIVE</label><select className="select" value={campaignObjective} onChange={e => setCampaignObjective(e.target.value)}><option>Brand awareness and sales</option><option>Local Houston sales</option><option>New product launch</option><option>Seasonal promotion</option><option>Website traffic</option></select></div>
        <div className="field"><label>TARGET AREA</label><input className="input" value={campaignTargetArea} onChange={e => setCampaignTargetArea(e.target.value)} placeholder="Houston, Texas + United States"/></div><div className="field"><label>AUTOPILOT SCHEDULE</label><select className="select" value={campaignRecurrenceHours} onChange={e => setCampaignRecurrenceHours(e.target.value)}><option value="5">Every 5 hours</option><option value="6">Every 6 hours</option><option value="7">Every 7 hours</option></select><small style={{color:"#8391a5"}}>Marketing Brain checks hourly, but an Autopilot campaign publishes again every 5–7 hours. Default: 6 hours.</small></div><div className="field"><label>START / END (OPTIONAL)</label><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}><input className="input" type="datetime-local" value={campaignStartsAt} onChange={e => setCampaignStartsAt(e.target.value)}/><input className="input" type="datetime-local" value={campaignEndsAt} onChange={e => setCampaignEndsAt(e.target.value)}/></div></div>
        <div className="field"><label>CHANNELS</label><div className="checks">{socialChannels.map(channel => { const name=channel.social!; const connected=Boolean(social.channels?.[name]); const selected=selectedSocial.includes(name); return <label className={`check ${selected ? "selected" : ""}`} key={name}><input type="checkbox" checked={selected} disabled={!connected} onChange={() => toggleChannel(name)}/><span>{channel.name}{connected ? " · Connected" : " · Not connected"}</span></label>; })}<label className={`check ${campaignSendEmail ? "selected" : ""}`}><input type="checkbox" checked={campaignSendEmail} onChange={e => setCampaignSendEmail(e.target.checked)}/><span>Email subscribers</span></label><label className={`check ${campaignAutopilot ? "selected" : ""}`}><input type="checkbox" checked={campaignAutopilot} onChange={e => setCampaignAutopilot(e.target.checked)}/><span>🤖 Autopilot · analyze + publish every 6 hours across connected channels</span></label></div></div>
      </div><div>
        <div className="field"><label>CAMPAIGN MESSAGE</label><textarea className="textarea" value={campaignMessage} onChange={e => setCampaignMessage(e.target.value)} placeholder="Mensaje central de la campaña..."/></div>
        <div className="field"><label>EMAIL SUBJECT</label><input className="input" value={campaignSubject} onChange={e => setCampaignSubject(e.target.value)} placeholder="JQYDesigns — New collection"/></div>
        <div className="field"><label>CREATIVE · IMAGE</label><input className="input" type="file" accept="image/*" disabled={campaignMediaUploading} onChange={async e => { const file=e.target.files?.[0]; if(!file) return; setCampaignMediaName(file.name); setCampaignImagePreview(URL.createObjectURL(file)); setCampaignVideoPreview(""); setCampaignMediaUploading(true); setNotice(""); try { const formData=new FormData(); formData.append("media", file); const uploaded=await apiRequest<{image_url?:string;url?:string}>("/api/admin/marketing/social/campaign/media",{method:"POST",body:formData}); const publicUrl=uploaded.image_url?.trim() || uploaded.url?.trim() || ""; if(!publicUrl) throw new Error("Marketing upload completed, but the API did not return a public image URL."); setCampaignImageUrl(publicUrl); setNotice("Creative uploaded and ready for real publishing."); } catch(error) { setCampaignImageUrl(""); setNotice(error instanceof Error ? error.message : "Could not upload the Marketing creative."); } finally { setCampaignMediaUploading(false); } }} /><input className="input" value={campaignImageUrl} onChange={e => setCampaignImageUrl(e.target.value)} placeholder={campaignMediaUploading ? "Uploading creative..." : "Public image URL (generated automatically after upload)"} /><small style={{color:"#8391a5"}}>{campaignMediaUploading ? "Uploading the selected creative to secure public media storage..." : campaignImageUrl ? "✓ Creative is hosted and ready for connected platforms to fetch." : "Select the image you want to publish. Marketing will upload it automatically and generate the public URL."}</small></div>
        <div className="field"><label>YOUTUBE PRIVACY</label><select className="select" value={youtubePrivacy} onChange={e => setYoutubePrivacy(e.target.value as "public"|"unlisted"|"private")}><option value="public">Public</option><option value="unlisted">Unlisted</option><option value="private">Private</option></select><small style={{color:"#8391a5"}}>YouTube requires an explicit privacy choice for API uploads.</small></div><div className="field"><label>CREATIVE · VIDEO</label><input className="input" type="file" accept="video/*" disabled={campaignMediaUploading} onChange={async e => { const file=e.target.files?.[0]; if(!file) return; if(file.size > 100 * 1024 * 1024) { setNotice("Marketing video cannot exceed 100 MB."); return; } setCampaignMediaName(file.name); const localPreview=URL.createObjectURL(file); setCampaignVideoPreview(localPreview); setCampaignImagePreview(""); setCampaignMediaUploading(true); setNotice(""); try { const signed=await apiRequest<{cloudName:string;apiKey:string;timestamp:number;folder:string;signature:string}>("/api/admin/marketing/social/campaign/media/signature"); const formData=new FormData(); formData.append("file", file); formData.append("api_key", signed.apiKey); formData.append("timestamp", String(signed.timestamp)); formData.append("folder", signed.folder); formData.append("signature", signed.signature); const upload=await fetch("https://api.cloudinary.com/v1_1/"+encodeURIComponent(signed.cloudName)+"/video/upload",{method:"POST",body:formData}); const data=await upload.json().catch(() => ({})); if(!upload.ok || !data.secure_url) throw new Error(data?.error?.message || "Cloudinary video upload failed."); setCampaignVideoUrl(String(data.secure_url)); setCampaignVideoPreview(String(data.secure_url)); setNotice("✓ Video uploaded to Cloudinary. Public URL generated automatically and ready for YouTube."); } catch(error) { setCampaignVideoUrl(""); setNotice(error instanceof Error ? error.message : "Could not upload the Marketing video."); } finally { URL.revokeObjectURL(localPreview); setCampaignMediaUploading(false); } }} /><input className="input" value={campaignVideoUrl} onChange={e => setCampaignVideoUrl(e.target.value)} placeholder={campaignMediaUploading ? "Uploading video..." : "Public video URL (generated automatically after upload)"} /><small style={{color:"#8391a5"}}>{campaignMediaUploading ? "Uploading video directly to secure media storage..." : campaignVideoUrl ? "✓ Video is hosted and ready for YouTube." : "Select a video and Marketing will upload it automatically and generate the public URL."}</small></div>
        <div className="field"><label>PREVIEW BEFORE PUBLISHING</label><div className="actions"><button className="btn" type="button" onClick={() => setCampaignPreviewOpen(true)}><Image size={14}/>Preview campaign</button>{campaignMediaName && <span className="status connected">{campaignMediaName}</span>}</div></div>
        <div className="field"><label>LANDING LINK</label><input className="input" value={campaignLink} onChange={e => setCampaignLink(e.target.value)}/></div>
        <div className="field"><label>WHATSAPP RECIPIENT (OPTIONAL)</label><input className="input" value={campaignWhatsappTo} onChange={e => setCampaignWhatsappTo(e.target.value)} placeholder="+1..."/></div>
      </div></div>
      <div className="notice"><b>Google growth layer:</b> {campaignTargetArea || "Houston"} is stored as the campaign market and Google Search Console/Analytics remain the measurement layer. The campaign engine does not claim to force organic rankings.</div>
      {campaignPreviewOpen && <div className="modal-bg" onClick={() => setCampaignPreviewOpen(false)}><div className="modal" style={{maxWidth:760}} onClick={event => event.stopPropagation()}><div className="modal-head"><h2>👀 Campaign Preview</h2><button className="close" onClick={() => setCampaignPreviewOpen(false)}><X size={18}/></button></div><p>This is the visual check before sending. The real platform may adjust its final crop/layout.</p><div className="card" style={{padding:16, background:"#101827"}}><div style={{fontWeight:800,fontSize:18,marginBottom:8}}>{campaignName || "JQYDesigns Campaign"}</div><div style={{color:"#aeb9ca",whiteSpace:"pre-wrap",marginBottom:12}}>{campaignMessage || "Campaign message preview..."}</div>{campaignImagePreview ? <img src={campaignImagePreview} alt="Campaign preview" style={{display:"block",width:"100%",maxHeight:420,objectFit:"contain",borderRadius:12,background:"#060b12"}}/> : campaignVideoPreview ? <video src={campaignVideoPreview} controls playsInline style={{display:"block",width:"100%",maxHeight:420,borderRadius:12,background:"#060b12"}}/> : <div className="notice">No local creative selected. Add an image/video or a public media URL to preview the creative.</div>}<div style={{marginTop:12,wordBreak:"break-word"}}><b>Landing:</b> {campaignLink || "—"}</div><div style={{marginTop:6}}><b>Channels:</b> {selectedSocial.length ? selectedSocial.join(" · ") : "None selected"}</div></div><div className="actions"><button className="btn" onClick={() => setCampaignPreviewOpen(false)}>Back to campaign</button><button className="btn primary" onClick={() => setCampaignPreviewOpen(false)}><CheckCircle2 size={14}/> Looks good</button></div></div></div>}
      
{campaignResults && <div className="notice"><b>Campaign ID:</b> {campaignResults.campaignId}<br/><b>Social results:</b> {Object.entries(campaignResults.social || {}).map(([channel,result]:any) => <span key={channel} style={{display:"block"}}>{channel}: {result?.ok ? "Published" : result?.error || "Failed"}</span>)}{campaignResults.email && <span style={{display:"block"}}>Email: {campaignResults.email.totalRecipients} recipients</span>}<span style={{display:"block"}}>Google: tracking/SEO focus prepared</span></div>}
      <div className="actions"><button className="btn" onClick={() => setModal(null)}>Close</button><button className="btn primary" onClick={() => void launchCampaign()} disabled={campaignLaunching || campaignMediaUploading}>{campaignLaunching ? <Loader2 size={15}/> : <Sparkles size={15}/>} {campaignLaunching ? "Launching..." : campaignAutopilot ? "Queue for Autopilot" : "Launch Campaign Everywhere"}</button></div></>}
      {modal === "email" && <><p>Envía una promoción real a los suscriptores activos desde JQYDesigns.</p><div className="notice">Active subscribers: {subscriberCounts?.active ?? "—"} · EN: {subscriberCounts?.active_en ?? "—"} · ES: {subscriberCounts?.active_es ?? "—"}</div><div className="field"><label>SUBJECT</label><input className="input" value={emailSubject} onChange={e => setEmailSubject(e.target.value)} placeholder="Summer promotion — 20% off"/></div><div className="field"><label>MESSAGE</label><textarea className="textarea" value={emailMessage} onChange={e => setEmailMessage(e.target.value)} placeholder="Write your promotion message..."/></div><div className="field"><label>IMAGE URL (OPTIONAL)</label><input className="input" value={emailImageUrl} onChange={e => setEmailImageUrl(e.target.value)} placeholder="https://..."/></div><div className="actions"><button className="btn" onClick={() => setModal(null)}>Close</button><button className="btn primary" onClick={() => void sendEmailCampaign()} disabled={emailSending}>{emailSending ? <Loader2 size={15}/> : <Send size={15}/>} {emailSending ? "Sending..." : "Send Promotion"}</button></div></>}
      {modal === "composer" && <><p>Una campaña puede enviarse a todos los canales conectados. Cada plataforma devuelve su propio resultado.</p><div className="composer-grid"><div><div className="field"><label>CHANNELS</label></div><div className="checks">{socialChannels.map(channel => { const name = channel.social!; const selected = selectedSocial.includes(name); const connected = Boolean(social.channels?.[name]); return <label className={`check ${selected ? "selected" : ""}`} key={name}><input type="checkbox" checked={selected} disabled={!connected} onChange={() => toggleChannel(name)}/><span>{channel.name}{connected ? " · Connected" : " · Not connected"}</span></label>; })}</div></div><div><div className="field"><label>MESSAGE</label><textarea className="textarea" value={publishText} onChange={event => setPublishText(event.target.value)} placeholder="Escribe el mensaje de la campaña..."/></div><div className="field"><label>IMAGE URL · Instagram/Pinterest</label><input className="input" value={imageUrl} onChange={event => setImageUrl(event.target.value)} placeholder="https://..."/></div><div className="field"><label>YOUTUBE PRIVACY</label><select className="select" value={youtubePrivacy} onChange={event => setYoutubePrivacy(event.target.value as "public"|"unlisted"|"private")}><option value="public">Public</option><option value="unlisted">Unlisted</option><option value="private">Private</option></select></div><div className="field"><label>VIDEO URL · YouTube</label><input className="input" value={videoUrl} onChange={event => setVideoUrl(event.target.value)} placeholder="https://.../video.mp4" /></div><div className="field"><label>LINK</label><input className="input" value={link} onChange={event => setLink(event.target.value)} /></div><div className="field"><label>WHATSAPP RECIPIENT</label><input className="input" value={whatsappTo} onChange={event => setWhatsappTo(event.target.value)} placeholder="+1..."/></div></div></div>{Object.entries(publishResults).map(([channel, result]) => <div className={`result ${result.ok ? "ok" : "fail"}`} key={channel}><b>{channel}</b>: {result.status === "PROCESSING" ? "Processing — provider confirmation pending" : result.ok ? `Published${result.account ? ` · ${result.account}` : ""}` : result.error || "Failed"}{result.message ? <div>{result.message}</div> : null}{result.url ? <a href={result.url} target="_blank" rel="noreferrer" style={{display:"block",marginTop:5,color:"#9ed8ff"}}>Open publication ↗</a> : null}</div>)}<div className="actions"><button className="btn" onClick={() => setModal(null)}>Close</button><button className="btn primary" onClick={() => void publish()} disabled={publishing || !selectedSocial.length}>{publishing ? <Loader2 size={15}/> : <Send size={15}/>} {publishing ? "Publishing..." : "Publish to selected"}</button></div></>}</div></div>}
      {campaignPreviewCampaign && <div className="modal-bg" onClick={() => setCampaignPreviewCampaign(null)}><div className="modal" style={{maxWidth:760}} onClick={event => event.stopPropagation()}><div className="modal-head"><h2>👀 Campaign Preview</h2><button className="close" onClick={() => setCampaignPreviewCampaign(null)}><X size={18}/></button></div><p>Stored campaign creative and content. This is the record saved by Marketing Brain; the provider may apply its own crop or layout.</p><div className="card" style={{padding:16, background:"#101827"}}><div style={{fontWeight:800,fontSize:18,marginBottom:8}}>{campaignPreviewCampaign.name}</div>{campaignPreviewCampaign.subject && <div style={{color:"#d7dfeb",fontWeight:700,marginBottom:8}}>{campaignPreviewCampaign.subject}</div>}<div style={{color:"#aeb9ca",whiteSpace:"pre-wrap",marginBottom:12}}>{campaignPreviewCampaign.message || "No message stored for this campaign."}</div>{campaignPreviewCampaign.results?.assets?.imageUrl ? <img src={campaignPreviewCampaign.results.assets.imageUrl} alt="Campaign creative" style={{display:"block",width:"100%",maxHeight:420,objectFit:"contain",borderRadius:12,background:"#060b12"}}/> : campaignPreviewCampaign.results?.assets?.videoUrl ? <video src={campaignPreviewCampaign.results.assets.videoUrl} controls playsInline style={{display:"block",width:"100%",maxHeight:420,borderRadius:12,background:"#060b12"}}/> : <div className="notice">No stored creative URL is available.</div>}<div style={{marginTop:12,wordBreak:"break-word"}}><b>Landing:</b> {campaignPreviewCampaign.results?.assets?.landingLink || "—"}</div><div style={{marginTop:6}}><b>Channels:</b> {campaignPreviewCampaign.channels?.length ? campaignPreviewCampaign.channels.join(" · ") : "None configured"}</div><div style={{marginTop:6}}><b>Status:</b> {publicationActivity.filter(item => item.campaign_id === campaignPreviewCampaign.id).map(item => `${item.channel}: ${item.status || (item.published ? "PUBLISHED" : "FAILED")}`).join(" · ") || "Not published yet"}</div></div><div className="actions"><button className="btn primary" onClick={() => setCampaignPreviewCampaign(null)}><CheckCircle2 size={14}/> Close Preview</button></div></div></div>}
    </div>;
}

export default AdminMarketing;
