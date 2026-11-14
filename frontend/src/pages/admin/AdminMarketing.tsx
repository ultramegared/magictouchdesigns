import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BarChart3, CheckCircle2, Image, Link2, Mail, MessageCircle, MousePointer2, Play, RefreshCw, Search, Send, Sparkles, TrendingUp, Unplug, Users, Video, X, Loader2, Trash2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { apiRequest } from "../../services/api";
import AdminSidebar from "./AdminSidebar";
import WhatsAppInbox from "./WhatsAppInbox";

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
type Channel = { name: ChannelName; detail: string; icon: LucideIcon; tone: string; social?: SocialChannel; provider?: "meta" | "whatsapp" | "instagram" | "tiktok" | "youtube" | "pinterest" };
interface SocialProfile { [key: string]: any; }
interface SocialConnection { connected: boolean; profile?: SocialProfile; }
interface SocialSetup { configured?: boolean; envKeys?: string[]; callback?: string; }
interface SocialState { configured?: Record<string, boolean>; setup?: Record<string, SocialSetup>; connected?: Record<string, SocialConnection>; selections?: Record<string,string>; channels?: Partial<Record<SocialChannel, boolean>>; }
interface EmailStatus { configured: boolean; senderConfigured: boolean; fromEmail?: string; fromName?: string; connected: boolean; verified: boolean; verificationNote?: string; error?: string; }
interface PublishResult { ok: boolean; status?: "PUBLISHED"|"PROCESSING"|"SENT"|"FAILED"|"QUEUED"; id?: string; account?: string; url?: string; message?: string; error?: string; }
interface CampaignRecord { id:string; name:string; objective:string; target_area:string; subject?:string; message?:string; channels:SocialChannel[]; results?: { social?: Record<string, PublishResult>; email?: { totalRecipients:number }; google?: { focus?:string[] }; assets?: { imageUrl?:string; videoUrl?:string; landingLink?:string }; sendEmail?:boolean }; created_at:string; autopilot_enabled?:boolean; next_run_at?:string | null; run_count?:number; campaign_type?: "manual"|"catalog"|"event"|"generated"|"paid"; starts_at?:string|null; ends_at?:string|null; recurrence_hours?:number; }
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
interface InstagramInsightsResponse { verified:boolean; provider:string; account:{id:string;username?:string|null}; periodDays:number; generatedAt:string; accountInsights:Array<{name:string;title?:string;period?:string;values?:Array<{value:number;end_time?:string}>;total_value?:{value:number; breakdowns?:unknown[]}}> ; recentMedia:Array<{id:string;caption:string;mediaType:string;timestamp?:string|null;permalink?:string|null;likeCount:number;commentsCount:number;insights:Array<{name:string;values?:Array<{value:number}>}>;insightsError?:string}>; error?:string; }
interface CatalogStatus { enabled:boolean; initializedAt?:string|null; lastScanAt?:string|null; lastProductId?:string|null; lastProductName?:string|null; lastCampaignId?:string|null; lastRunAt?:string|null; pendingProducts:number; pendingPortfolio:number; lastGenerated?: { variantKey?:string; productName?:string|null; status?:string; consumedAt?:string|null; createdAt?:string|null } | null; lastAutopilotRun?: { source:string; ran:boolean; processed:number; reason?:string; detail?: { queueReasons?: string[] }; createdAt?:string|null } | null; }

const channels: Channel[] = [
    { name: "Google", detail: "Search & Analytics", icon: Search, tone: "#4285F4" },
    { name: "Facebook", detail: "Pages & publishing", icon: MessageCircle, tone: "#1877F2", social: "facebook", provider: "meta" },
    { name: "Instagram", detail: "Posts & Reels", icon: Image, tone: "#E1306C", social: "instagram", provider: "instagram" },
    { name: "TikTok", detail: "Short-form video", icon: Video, tone: "#111111", social: "tiktok", provider: "tiktok" },
    { name: "YouTube", detail: "Video publishing", icon: Play, tone: "#FF0000", social: "youtube", provider: "youtube" },
    { name: "Pinterest", detail: "Pins & products", icon: Image, tone: "#BD081C", social: "pinterest", provider: "pinterest" },
    { name: "WhatsApp", detail: "Business messaging", icon: MessageCircle, tone: "#25D366", social: "whatsapp", provider: "whatsapp" },
    { name: "Email", detail: "Newsletters & offers", icon: Mail, tone: "#4F83CC" },
];
const socialChannels = channels.filter(channel => channel.social);

function AdminMarketing() {
    const [range, setRange] = useState<"7" | "30" | "90">("30");
    type MarketingTab = "resumen" | "campanas" | "robot" | "cuentas" | "actividad";
    const [activeTab, setActiveTab] = useState<MarketingTab>(() => { const h = window.location.hash.replace("#", ""); return (["resumen", "campanas", "robot", "cuentas", "actividad"] as MarketingTab[]).includes(h as MarketingTab) ? (h as MarketingTab) : "resumen"; });
    const goTab = (tab: MarketingTab) => { setActiveTab(tab); window.history.replaceState(null, "", "#" + tab); };
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
    const [connectDiag, setConnectDiag] = useState<{ events: any[]; whatsappDiagnosis: any; metaDiagnosis?: any; youtubeDiagnosis?: any } | null>(null);
    const [emailStatus, setEmailStatus] = useState<EmailStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [socialLoading, setSocialLoading] = useState(false);
    const [googleChecking, setGoogleChecking] = useState(false);
    const [busyProvider, setBusyProvider] = useState<string | null>(null);
    const [verificationResults, setVerificationResults] = useState<Record<string, string>>({});
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
    const [channelNotice] = useState("");
    const [setupProvider, setSetupProvider] = useState<"meta" | "whatsapp" | "instagram" | "tiktok" | "youtube" | "pinterest" | null>(null);
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
    const [campaignRecurrenceHours, setCampaignRecurrenceHours] = useState("12");
    const [campaignImagePreview, setCampaignImagePreview] = useState("");
    const [campaignVideoPreview, setCampaignVideoPreview] = useState("");
    const [campaignMediaName, setCampaignMediaName] = useState("");
    const [campaignMediaUploading, setCampaignMediaUploading] = useState(false);
    const [creativeTab, setCreativeTab] = useState<"image"|"video">("image");
    const [campaignPreviewOpen, setCampaignPreviewOpen] = useState(false);
    const [campaignLaunching, setCampaignLaunching] = useState(false);
    const campaignLaunchLock = useRef(false);
    const campaignIdempotencyKey = useRef<string | null>(null);
    const [campaignResults, setCampaignResults] = useState<any>(null);
    const [campaignPreviewCampaign, setCampaignPreviewCampaign] = useState<CampaignRecord | null>(null);
    const [campaignHistory, setCampaignHistory] = useState<CampaignRecord[]>([]);
    const [deletingCampaignId, setDeletingCampaignId] = useState<string | null>(null);
    const [learningInsights, setLearningInsights] = useState<LearningInsight[]>([]);
    const [learningLoading, setLearningLoading] = useState(false);
    const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
    const [dailyLoading, setDailyLoading] = useState(false);
    const [catalog, setCatalog] = useState<CatalogStatus | null>(null);
    const [catalogLoading, setCatalogLoading] = useState(false);
    const [autopilotRunning, setAutopilotRunning] = useState(false);
    const [publicationActivity, setPublicationActivity] = useState<PublicationActivity[]>([]);
    const [publicationLoading, setPublicationLoading] = useState(false);
    const [instagramInsights, setInstagramInsights] = useState<InstagramInsightsResponse | null>(null);
    const [instagramInsightsError, setInstagramInsightsError] = useState<string | null>(null);
    const [instagramInsightsLoading, setInstagramInsightsLoading] = useState(false);

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
    const loadInstagramInsights = useCallback(async () => {
        try {
            setInstagramInsightsLoading(true);
            setInstagramInsightsError(null);
            const result = await apiRequest<InstagramInsightsResponse>(`/api/admin/marketing/social/instagram/insights?days=${range}&_=${Date.now()}`);
            setInstagramInsights(result);
        } catch (error) {
            setInstagramInsights(null);
            setInstagramInsightsError(error instanceof Error ? error.message : "Instagram Insights could not be loaded.");
        } finally {
            setInstagramInsightsLoading(false);
        }
    }, [range]);

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
            apiRequest<{ events: any[]; whatsappDiagnosis: any; metaDiagnosis?: any; youtubeDiagnosis?: any }>("/api/admin/marketing/social/connect-events?_=" + Date.now()).then(setConnectDiag).catch(() => {});
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
                setGsc({ ...googleStatus.value.searchConsole, connected: Boolean(googleStatus.value.searchConsole?.connected), siteUrl: googleStatus.value.searchConsole?.resolvedSiteUrl || googleStatus.value.searchConsole?.siteUrl });
                setGa({ ...googleStatus.value.analytics, connected: Boolean(googleStatus.value.analytics?.connected), dataVerified: Boolean(googleStatus.value.analytics?.dataVerified), configured: Boolean(googleStatus.value.analytics?.configured), propertyId: googleStatus.value.analytics?.propertyId });
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
            setCatalogLoading(true);
            const response = await apiRequest<{ catalog: CatalogStatus }>("/api/admin/marketing/social/campaign/catalog");
            setCatalog(response.catalog);
            setNotice(`✓ Content Autopilot actualizado · ${new Date().toLocaleTimeString()}`);
        } catch (error) {
            setNotice(error instanceof Error ? error.message : "No se pudo actualizar Content Autopilot.");
        } finally {
            setCatalogLoading(false);
        }
    }, []);

    const [proposalData, setProposalData] = useState<any>(null);
    const [proposalBusy, setProposalBusy] = useState(false);
    const [showReject, setShowReject] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [rejectText, setRejectText] = useState("");
    const [ultraReport, setUltraReport] = useState<any>(null);
    const [ultraLoading, setUltraLoading] = useState(false);

    const loadProposals = useCallback(async () => {
        try {
            const response = await apiRequest<any>("/api/admin/marketing/social/campaign/proposals");
            setProposalData(response);
        } catch { /* La propuesta es suplementaria y nunca bloquea Marketing. */ }
    }, []);

    const loadUltraReport = useCallback(async () => {
        try {
            setUltraLoading(true);
            const response = await apiRequest<any>("/api/admin/marketing/social/campaign/intelligence-report");
            setUltraReport(response.report || null);
        } catch { /* El informe ULTRA es suplementario. */ }
        finally { setUltraLoading(false); }
    }, []);

    const currentProposal = useMemo(() => {
        const list: any[] = proposalData?.proposals || [];
        return list.find((p: any) => p.status === "pending") || (proposalData?.today?.status === "pending" ? proposalData.today : null);
    }, [proposalData]);

    const approveCurrentProposal = useCallback(async (scope: "once" | "week") => {
        if (!currentProposal) return;
        try {
            setProposalBusy(true);
            await apiRequest(`/api/admin/marketing/social/campaign/proposals/${encodeURIComponent(currentProposal.id)}/approve`, { method: "POST", body: JSON.stringify({ scope }) });
            setNotice(scope === "week" ? "✅ Propuesta aprobada y semana autorizada: el robot publica esta y las de la ventana, siempre a su hora recomendada." : "✅ Propuesta aprobada: se publica a la hora recomendada. Tu «sí» quedó registrado como aprendizaje de tu gusto.");
            await loadProposals(); await loadUltraReport();
        } catch (error) { setNotice(error instanceof Error ? error.message : "No se pudo aprobar la propuesta."); }
        finally { setProposalBusy(false); }
    }, [currentProposal, loadProposals, loadUltraReport]);

    const rejectCurrentProposal = useCallback(async () => {
        if (!currentProposal) return;
        try {
            setProposalBusy(true);
            await apiRequest(`/api/admin/marketing/social/campaign/proposals/${encodeURIComponent(currentProposal.id)}/reject`, { method: "POST", body: JSON.stringify({ reasonCode: rejectReason || null, reasonText: rejectText || null }) });
            setNotice("❌ Propuesta rechazada. Tu «no» y su motivo quedaron registrados: el robot aprende de eso para la próxima.");
            setShowReject(false); setRejectReason(""); setRejectText("");
            await loadProposals(); await loadUltraReport();
        } catch (error) { setNotice(error instanceof Error ? error.message : "No se pudo rechazar la propuesta."); }
        finally { setProposalBusy(false); }
    }, [currentProposal, rejectReason, rejectText, loadProposals, loadUltraReport]);

    const runAutopilotNow = useCallback(async () => {
        try {
            setAutopilotRunning(true);
            const response = await apiRequest<{ status: string; data: any }>("/api/admin/marketing/social/campaign/autopilot-run-now", { method: "POST" });
            const data = response.data || {};
            setNotice(data.ran ? `\u{1F916} Robot ejecutado: publicó ${data.processed} campaña(s).` : `\u{1F916} Robot ejecutado sin publicar: ${data.reason || "sin motivo reportado."}`);
            await loadCatalog(); await loadPublicationActivity(); await loadCampaignHistory();
        } catch (error) { setNotice(error instanceof Error ? error.message : "No se pudo ejecutar el robot."); }
        finally { setAutopilotRunning(false); }
    }, [loadCatalog]);

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

    const [retryingCampaignId, setRetryingCampaignId] = useState<string | null>(null);
    const retryCampaign = useCallback(async (campaign: CampaignRecord) => {
        try {
            setRetryingCampaignId(campaign.id);
            setNotice("⏳ Publishing to Instagram…");
            await apiRequest(`/api/admin/marketing/social/campaign/${encodeURIComponent(campaign.id)}/retry`, { method: "POST", timeoutMs: 90000 });
            setCampaignPreviewCampaign(null);
            setNotice(`✓ Campaign "${campaign.name}" published. Check Marketing Activity for the live publication link.`);
            await Promise.all([loadCampaignHistory(), loadPublicationActivity(), loadLearning(), loadDailySummary(), load()]);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Could not publish the campaign.";
            setNotice(`❌ Instagram publication failed: ${message}`);
        } finally {
            setRetryingCampaignId(null);
        }
    }, [load, loadCampaignHistory, loadPublicationActivity, loadLearning, loadDailySummary]);

    const deleteCampaign = useCallback(async (campaign: CampaignRecord) => {
        const confirmed = window.confirm(
            `Delete campaign "${campaign.name}" from Marketing History? This removes its internal campaign record, publication history and learning observations. It does not delete posts already published on external networks.`
        );
        if (!confirmed) return;

        try {
            setDeletingCampaignId(campaign.id);
            setNotice("");
            await apiRequest(`/api/admin/marketing/social/campaign/${encodeURIComponent(campaign.id)}`, { method: "DELETE" });
            setCampaignPreviewCampaign(current => current?.id === campaign.id ? null : current);
            setNotice(`✓ Campaign "${campaign.name}" deleted from Marketing.`);
            await Promise.all([
                loadCampaignHistory(),
                loadPublicationActivity(),
                loadLearning(),
                loadDailySummary(),
                load(),
            ]);
        } catch (error) {
            setNotice(error instanceof Error ? error.message : "Could not delete the marketing campaign.");
        } finally {
            setDeletingCampaignId(null);
        }
    }, [load, loadCampaignHistory, loadPublicationActivity, loadLearning, loadDailySummary]);

    useEffect(() => { void load(); void loadSocial(); void loadInstagramInsights(); void loadEmailStatus(); void loadCampaignHistory(); void loadPublicationActivity(); void loadLearning(); void loadDailySummary(); void loadCatalog(); void loadProposals(); void loadUltraReport(); }, [load, loadSocial, loadInstagramInsights, loadCampaignHistory, loadPublicationActivity, loadLearning, loadDailySummary, loadCatalog, loadProposals, loadUltraReport]);
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get("social") === "connected") setNotice(`Cuenta ${params.get("provider") || "social"} conectada correctamente.`);
        if (params.get("social") === "error") setNotice(params.get("message") || "La conexión social no pudo completarse.");
        if (params.has("social")) { void loadSocial(); window.history.replaceState({}, "", window.location.pathname); }
    }, [loadSocial]);

    useEffect(() => { const previous = document.body.style.backgroundColor; document.body.style.backgroundColor = "#F7F8FA"; return () => { document.body.style.backgroundColor = previous; }; }, []);
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

    const isConnected = (channel: Channel) => channel.social ? Boolean(social.channels?.[channel.social]) : channel.name === "Google" ? Boolean(gsc?.connected && ga?.connected) : false;
    const accountName = (channel: Channel) => {
        if (!channel.social) return channel.name === "Google" ? (ga?.propertyId ? `GA4 ${ga.propertyId}` : "Search & Analytics") : "Managed separately";
        const profile = channel.provider ? social.connected?.[channel.provider]?.profile || {} : {};
        if (channel.social === "facebook") return profile.pages?.[0]?.name || profile.name || "Facebook Page";
        if (channel.social === "instagram") return profile.username || profile.name || "Instagram account";
        if (channel.social === "whatsapp") return profile.whatsapp?.[0]?.verified_name || profile.whatsapp?.[0]?.display_phone_number || "WhatsApp Business";
        if (channel.social === "tiktok") return profile.display_name || profile.username || "TikTok account";
        if (channel.social === "youtube") return profile.snippet?.title || "YouTube channel";
        return profile.username || profile.business_name || "Pinterest account";
    };

    const connect = async (channel: Channel) => {
        if (!channel.provider) return;
        try {
            setBusyProvider(channel.provider);
            if (channel.social === "whatsapp") {
                // Connect through the full-page OAuth redirect, the same flow the
                // other channels use. The FB JS-SDK popup flow cannot complete on
                // mobile Safari: the dialog ends on a separate "close this tab"
                // screen, so neither the signup event nor the authorization code
                // ever reaches this tab and the connection is never saved.
                const result = await apiRequest<{ url: string }>("/api/admin/marketing/social/meta/authorize?channel=whatsapp");
                window.location.href = result.url;
                return;
            }
            const result = await apiRequest<{ url: string }>(`/api/admin/marketing/social/${channel.provider}/authorize`);
            window.location.href = result.url;
        } catch (error) { setNotice(error instanceof Error ? error.message : "Could not start social connection."); setBusyProvider(null); }
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
                connected: Boolean(health.searchConsole?.connected),
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

            setNotice((gscAnalytics.status === "fulfilled" && (gscAnalytics.value.rows?.length || 0) > 0 && gaReport.status === "fulfilled" && (gaReport.value.rows?.length || 0) > 0) ? "✅ Google conectado y ambos informes devolvieron datos." : "Google está conectado, pero GA4 todavía no devuelve filas históricas para el período consultado. Los ceros no se presentan como datos confirmados.");
        } catch (error) {
            setNotice(error instanceof Error ? error.message : "Google verification failed.");
        } finally {
            setGoogleChecking(false);
        }
    };
    const openSeo = () => { setModal("Google"); void refreshGoogle(); };
    const setupTitle = (provider: string) => provider === "meta" ? "Facebook · WhatsApp" : provider === "instagram" ? "Instagram" : provider === "youtube" ? "YouTube / Google" : provider === "tiktok" ? "TikTok" : "Pinterest";

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

    return <div className="marketing-page"><style>{`.marketing-page{--mk-red:#C8102E;--mk-red2:#E0445A;--mk-blue:#1D4ED8;--mk-blue2:#2563EB;--mk-bg:#F7F8FA;--mk-card:#FFFFFF;--mk-card2:#F1F4F8;--mk-text:#111827;--mk-muted:#5A6472;--mk-border:#DFE4EC;--mk-ok:#1E7B45;min-height:100vh;min-height:100dvh;overflow-x:hidden;background:var(--mk-bg);color:var(--mk-text);font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
.marketing-page *{box-sizing:border-box}
.marketing-main{margin-left:270px;width:calc(100% - 270px);max-width:1600px;padding:22px 26px 40px}
.marketing-page a{color:var(--mk-blue)}
.mk-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;flex-wrap:wrap}
.mk-head h1{font-size:26px;margin:0}
.mk-head h1 span{color:var(--mk-red)}
.mk-head p{color:var(--mk-muted);font-size:12.5px;margin-top:4px;max-width:560px;line-height:1.45}
.mk-head .acts{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.btn{border:1px solid var(--mk-border);background:var(--mk-card);color:var(--mk-text);border-radius:9px;padding:10px 14px;font-weight:700;font-size:13px;display:inline-flex;align-items:center;gap:7px;cursor:pointer;font-family:inherit}
.btn:disabled{opacity:.55;cursor:not-allowed}
.btn.primary{background:linear-gradient(135deg,var(--mk-red2),var(--mk-red));color:#fff;border-color:var(--mk-red)}
.btn.sm{padding:7px 10px;font-size:11.5px}
.btn.danger{color:#B42318}
select.btn{appearance:none;-webkit-appearance:none}
.marketing-page select option{background:var(--mk-card);color:var(--mk-text)}
.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:16px 0 6px}
.kpi{background:var(--mk-card);border:1px solid var(--mk-border);border-radius:14px;padding:14px 16px;box-shadow:0 1px 3px rgba(16,24,40,.06)}
.kpi .t{color:var(--mk-muted);font-size:11px;display:flex;justify-content:space-between;align-items:center}
.kpi b{display:block;font-size:24px;margin:5px 0 2px;color:var(--mk-red)}
.kpi small{color:var(--mk-ok);font-weight:700;font-size:11px}
.kpi small.mut{color:var(--mk-muted);font-weight:600}
.tabs{position:sticky;top:0;z-index:20;display:flex;gap:6px;flex-wrap:wrap;background:var(--mk-bg);padding:12px 0 10px;border-bottom:1px solid var(--mk-border);margin-bottom:16px}
.tabs button{border:1px solid var(--mk-border);background:var(--mk-card);color:var(--mk-muted);border-radius:999px;padding:9px 16px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit}
.tabs button.on{background:linear-gradient(135deg,var(--mk-blue2),var(--mk-blue));color:#fff;border-color:var(--mk-blue)}
.block,.card{background:var(--mk-card);border:1px solid var(--mk-border);border-radius:14px;padding:16px;margin-bottom:14px;box-shadow:0 1px 3px rgba(16,24,40,.05)}
.block>h2{font-size:16px;display:flex;align-items:center;gap:8px;margin:0;flex-wrap:wrap}
.block>h2 .sub{margin-left:auto;display:inline-flex;gap:8px;align-items:center}
.block .desc{color:var(--mk-muted);font-size:12px;margin:4px 0 12px;line-height:1.45}
.integration{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px}
.integration-card{margin-bottom:0}
.integration-head{display:flex;align-items:center;justify-content:space-between;gap:8px}
.integration-head h3{margin:0;font-size:15px}
.integration-card p{font-size:11.5px;color:var(--mk-muted);line-height:1.45}
.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.metrics.c5{grid-template-columns:repeat(5,1fr)}
.metric{background:var(--mk-card2);border:1px solid #E4E9F0;border-radius:10px;padding:10px}
.metric b{display:block;font-size:16px}
.metric span{font-size:9.5px;color:var(--mk-muted)}
.pill{display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:5px 10px;font-size:11px;font-weight:700;border:1px solid var(--mk-border)}
.pill.ok{color:#1E7B45;background:#E7F4EC;border-color:#BFE3CC}.pill.off{color:#66707D;background:#F1F4F8}
.dot{width:8px;height:8px;border-radius:50%;background:currentColor;display:inline-block}
.status{display:inline-flex;align-items:center;gap:5px;border-radius:999px;padding:5px 9px;background:var(--mk-card2);border:1px solid #E4E9F0;color:var(--mk-muted);font-size:10px;font-weight:700}
.status.connected{color:#1E7B45}
.sales-chart{height:160px;display:flex;align-items:flex-end;gap:6px;padding:14px 4px 0;border-top:1px solid #E4E9F0}
.chart-column{height:100%;flex:1;min-width:12px;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:5px}
.chart-bar{width:100%;max-width:32px;min-height:4px;border-radius:5px 5px 2px 2px;background:linear-gradient(180deg,var(--mk-red2),var(--mk-red))}
.chart-column span{font-size:8px;color:var(--mk-muted);white-space:nowrap}
.channels{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px}
.channel{background:var(--mk-card);border:1px solid var(--mk-border);border-radius:14px;padding:15px;box-shadow:0 1px 3px rgba(16,24,40,.05);display:flex;flex-direction:column;min-width:0}
.channel-top{display:flex;align-items:center;justify-content:space-between}
.channel-icon{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;background:var(--mk-card2)}
.channel strong{display:block;font-size:14.5px;margin-top:10px}
.channel small{display:block;color:var(--mk-muted);font-size:10.5px;margin-top:3px}
.channel .status{margin-top:9px;width:fit-content}
.account{display:block;color:var(--mk-text);font-size:11px;margin-top:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.cards.c3{grid-template-columns:repeat(3,1fr)}
.ucard{background:var(--mk-card);border:1px solid var(--mk-border);border-radius:14px;padding:15px;box-shadow:0 1px 3px rgba(16,24,40,.05);display:flex;flex-direction:column;gap:6px;min-height:172px}
.ucard .ic{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;background:var(--mk-card2);font-size:20px}
.ucard strong{font-size:14.5px}
.ucard small{color:var(--mk-muted);font-size:10.5px;line-height:1.4}
.ucard .foot{margin-top:auto;display:flex;gap:6px;flex-wrap:wrap;align-items:center}
.stats4{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:12px}
.row{display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid #E4E9F0;background:var(--mk-card2);border-radius:10px;margin-bottom:7px;font-size:12.5px;flex-wrap:wrap;color:var(--mk-text)}
.row .when{color:var(--mk-muted);font-size:11px;margin-left:auto}
.row a{color:var(--mk-blue);text-decoration:none;font-weight:700}
.rowdetail{font-size:11px;color:var(--mk-muted);padding:0 12px 8px;overflow-wrap:anywhere}
.robot-head{display:flex;align-items:center;gap:14px;flex-wrap:wrap}
.robot-ic{width:56px;height:56px;border-radius:16px;background:var(--mk-card2);display:grid;place-items:center;font-size:28px;border:1px solid var(--mk-border)}
.lvl{height:9px;border-radius:99px;background:#E5E9EF;overflow:hidden;margin-top:8px}
.lvl i{display:block;height:100%;background:linear-gradient(90deg,var(--mk-blue2),var(--mk-blue))}
.marketing-page table{width:100%;font-size:12px;border-collapse:collapse}
.marketing-page th,.marketing-page td{padding:7px 6px;border-bottom:1px solid #E7EBF0;text-align:left}
.marketing-page th{color:var(--mk-muted);font-size:11px}
.quick{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.quick .card{margin-bottom:0;text-align:left;color:var(--mk-text)}
.quick strong{display:block;font-size:12.5px;margin-top:7px}
.quick small{display:block;color:var(--mk-muted);font-size:10.5px;margin-top:3px;line-height:1.4}
.notice{border:1px dashed #B9C8E8;border-radius:10px;padding:11px 12px;color:var(--mk-muted);font-size:12px;line-height:1.5;background:rgba(29,78,216,.05);margin-top:12px}
.notice b{color:var(--mk-text)}
.actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.checks{display:grid;gap:7px}
.check{display:flex;align-items:center;gap:9px;padding:10px;border:1px solid #D9DEE7;border-radius:9px;background:var(--mk-card2);cursor:pointer;font-size:12.5px}
.check.selected{border-color:var(--mk-blue);background:rgba(29,78,216,.07)}
.check input{accent-color:var(--mk-blue)}
.cf-h{font-size:10.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--mk-text);margin:2px 0 9px;display:flex;align-items:center;gap:8px}.cf-h::after{content:"";flex:1;height:1px;background:var(--mk-border)}
.cf-sec{margin-bottom:15px}
.cf-2col{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px}
.cf-2col>.field{min-width:0}
.cf-2col .input,.cf-2col .select{min-width:0;width:100%}
.cf-3col{display:grid;grid-template-columns:1.3fr 1fr 1fr;gap:10px;margin-top:10px;align-items:end}
.cf-seg{grid-template-columns:1fr 1fr}.cf-seg .check{justify-content:center;text-align:center}
.cf-chips{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}
.cf-chip{padding:8px 10px;gap:8px}
.cf-chip-tx{display:flex;flex-direction:column;line-height:1.25;min-width:0}
.cf-chip-tx b{font-size:12.5px}.cf-chip-tx small{color:var(--mk-muted);font-size:10.5px}
.check.selected .cf-chip-tx small{color:var(--mk-blue)}
.cf-off{opacity:.55}
.cf-ck{margin-left:auto;color:var(--mk-blue);font-weight:900;flex:none}
.cf-auto{display:flex;gap:10px;align-items:center;border:1px solid var(--mk-border);background:var(--mk-card2);border-radius:10px;padding:10px 12px;cursor:pointer;font-size:13px}
.cf-auto.on{border-color:var(--mk-blue);background:rgba(29,78,216,.06)}
.cf-auto input{width:18px;height:18px;accent-color:var(--mk-blue);flex:none}
.cf-auto small{display:block;color:var(--mk-muted);font-size:11px;margin-top:1px}
.cf-tabs{display:flex;gap:6px;margin-bottom:8px}
.cf-tabs button{border:1px solid var(--mk-border);background:var(--mk-card);border-radius:999px;padding:6px 15px;font-size:12.5px;font-weight:700;color:var(--mk-muted);cursor:pointer;font-family:inherit}
.cf-tabs button.on{background:var(--mk-text);color:#fff;border-color:var(--mk-text)}
.cf-drop{border:1.5px dashed #B9C1CF;border-radius:10px;padding:10px 12px;background:#FBFCFE}
.cf-drop-row{display:flex;gap:11px;align-items:center;margin-bottom:9px}
.cf-drop-tx small{color:var(--mk-muted);font-size:11.5px;line-height:1.45;display:block}
.cf-thumb{width:46px;height:46px;border-radius:8px;object-fit:cover;border:1px solid var(--mk-border);flex:none}
.cf-thumb-ph{display:flex;align-items:center;justify-content:center;background:var(--mk-card2);font-size:20px}
.cf-file{padding:8px;font-size:12.5px}
.cf-msg{min-height:74px}
.cf-actions{position:sticky;bottom:0;margin:14px -20px -20px;padding:12px 20px;background:var(--mk-card);border-top:1px solid var(--mk-border);z-index:6}
@media(max-width:800px){.cf-chips{grid-template-columns:1fr 1fr}.cf-3col{grid-template-columns:1fr 1fr}.cf-3col .cf-wide{grid-column:1/-1}.cf-2col.cf-stack{grid-template-columns:1fr}}
.composer-grid,.campaign-grid{display:grid;grid-template-columns:1fr 1.4fr;gap:14px}
.modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.72);z-index:100;display:grid;place-items:center;padding:16px}
.modal{width:min(760px,100%);max-height:92vh;overflow:auto;background:var(--mk-card);border:1px solid var(--mk-border);border-radius:15px;padding:20px;color:var(--mk-text)}
.modal-head{display:flex;justify-content:space-between;align-items:center}
.modal h2{margin:0;font-size:18px}
.modal p{color:var(--mk-muted);font-size:12.5px;line-height:1.5}
.close{background:none;border:0;color:#5A6472;cursor:pointer}
.field{display:flex;flex-direction:column;gap:5px;margin-bottom:10px}
.field label{font-size:10px;color:var(--mk-muted);font-weight:700}
.input,.select,.textarea{background:var(--mk-card2);border:1px solid #D4DAE2;color:var(--mk-text);border-radius:8px;padding:10px;font-family:inherit;font-size:13px}
.input::placeholder,.textarea::placeholder{color:var(--mk-muted);opacity:.85}
.textarea{min-height:130px;resize:vertical}
.result{padding:9px;border-radius:8px;margin-top:7px;border:1px solid #D9DEE7;font-size:11px}
.result.ok{border-color:#A9DDBB;background:#EAF7EE;color:#14532D}
.result.fail{border-color:#F0B4B4;background:#FDECEC;color:#7A1F1F}
@media(max-width:1200px){.channels{grid-template-columns:repeat(2,1fr)}.cards{grid-template-columns:repeat(2,1fr)}.cards.c3{grid-template-columns:repeat(2,1fr)}.quick{grid-template-columns:repeat(2,1fr)}}
@media(max-width:1100px){.marketing-main{margin-left:0;width:100%;max-width:none;padding:18px}}
@media(max-width:800px){.marketing-main{padding:14px}.mk-head h1{font-size:22px}.kpis{grid-template-columns:1fr 1fr}.integration{grid-template-columns:1fr}.metrics{grid-template-columns:1fr 1fr}.metrics.c5{grid-template-columns:1fr 1fr}.cards,.cards.c3{grid-template-columns:1fr 1fr}.stats4{grid-template-columns:1fr 1fr}.composer-grid,.campaign-grid{grid-template-columns:1fr}.tabs button{padding:8px 12px;font-size:12px}.ucard{min-height:158px}}`}</style>
      <AdminSidebar />
      <main className="marketing-main">
        <div className="mk-head">
          <div>
            <h1>Marketing <span>· JQYD</span></h1>
            <p>Todo el marketing en un solo lugar: campañas, el robot, las cuentas conectadas y los resultados. Cada cosa en su sección, sin mezclar.</p>
          </div>
          <div className="acts">
            <select className="btn" value={range} onChange={event => setRange(event.target.value as "7" | "30" | "90")} aria-label="Período">
              <option value="7">Últimos 7 días</option>
              <option value="30">Últimos 30 días</option>
              <option value="90">Últimos 90 días</option>
            </select>
            <button className="btn" onClick={() => { void load(); void loadSocial(); void loadPublicationActivity(); }} disabled={loading || refreshing || socialLoading}><RefreshCw size={15}/> Actualizar</button>
            <button className="btn" onClick={() => openComposer()}><Send size={15}/> Publicar ahora</button>
            <button className="btn primary" onClick={openCampaign}><Sparkles size={15}/> Crear campaña</button>
          </div>
        </div>
        {notice && <div className="notice" role="status" style={{margin:"12px 0 0"}}>{notice}</div>}
        <div className="kpis">
          <div className="kpi"><div className="t"><span>Visitantes</span><MousePointer2 size={16}/></div><b>{gaMetrics.users.toLocaleString()}</b><small className="mut">{ga?.configured ? "Google Analytics · " + range + " días" : "Conectar GA4"}</small></div>
          <div className="kpi"><div className="t"><span>Vistas de página</span><TrendingUp size={16}/></div><b>{gaMetrics.views.toLocaleString()}</b><small className="mut">{ga?.configured ? "Google Analytics · " + range + " días" : "Conectar GA4"}</small></div>
          <div className="kpi"><div className="t"><span>Órdenes</span><Users size={16}/></div><b>{salesMetrics.orders.toLocaleString()}</b><small>Datos de la tienda en vivo</small></div>
          <div className="kpi"><div className="t"><span>Ingresos</span><BarChart3 size={16}/></div><b>${salesMetrics.revenue.toFixed(2)}</b><small>Ventas en vivo</small></div>
        </div>
        <nav className="tabs">
          <button className={activeTab === "resumen" ? "on" : ""} onClick={() => goTab("resumen")}>📊 Resumen</button>
          <button className={activeTab === "campanas" ? "on" : ""} onClick={() => goTab("campanas")}>✨ Campañas</button>
          <button className={activeTab === "robot" ? "on" : ""} onClick={() => goTab("robot")}>🤖 Robot</button>
          <button className={activeTab === "cuentas" ? "on" : ""} onClick={() => goTab("cuentas")}>🔌 Cuentas conectadas</button>
          <button className={activeTab === "actividad" ? "on" : ""} onClick={() => goTab("actividad")}>🌐 Actividad</button>
        </nav>

        {activeTab === "resumen" && <section id="marketing-analytics">
          <div className="block">
            <h2>📅 Reporte de hoy <span className="sub">{dailySummary && <span className="pill off"><span className="dot"></span> Robot en Nivel {dailySummary.learning.level}</span>}<button className="btn sm" onClick={() => void loadDailySummary()} disabled={dailyLoading}><RefreshCw size={13}/> {dailyLoading ? "Updating..." : "Refresh"}</button></span></h2>
            <p className="desc">Resumen real de las últimas 24 horas: dónde se publicó, tráfico, conversiones e ingresos. El reporte diario también se envía al correo de Marketing después de existir la primera campaña.</p>
            {dailySummary ? <>
              <div className="metrics c5">
                <div className="metric"><b>{dailySummary.last24.publications}</b><span>Publicaciones 24h</span></div>
                <div className="metric"><b>{dailySummary.last24.sessions}</b><span>Sesiones</span></div>
                <div className="metric"><b>{dailySummary.last24.conversions}</b><span>Conversiones</span></div>
                <div className="metric"><b>${dailySummary.last24.revenue.toFixed(2)}</b><span>Ingresos atribuidos</span></div>
                <div className="metric"><b>{dailySummary.learning.level}</b><span>Nivel · {dailySummary.learning.levelName}</span></div>
              </div>
              <div style={{marginTop:12}}>
                {dailySummary.channels.length ? dailySummary.channels.map(row => <div className="row" key={row.channel}><b style={{textTransform:"capitalize"}}>{row.channel}</b><span>{row.successful}/{row.publications} publicaciones OK · {row.sessions} sesiones · {row.conversions} conversiones</span><span className="when">${row.revenue.toFixed(2)}</span></div>) : <div className="notice">Sin publicaciones en las últimas 24 horas.</div>}
              </div>
              <div className="notice"><b>Meta — siguiente paso:</b> {dailySummary.channels.find(c => c.channel.toLowerCase().includes("meta") || c.channel.toLowerCase().includes("facebook") || c.channel.toLowerCase().includes("instagram")) ? "Ya hay publicaciones Meta en las últimas 24 horas; revisar conversiones antes de escalar." : "Publicar primero en Meta (Facebook/Instagram) y medir sesiones/conversiones hoy."}<br/><b>Aprendizaje acumulado:</b> {dailySummary.learning.observations} observaciones · {dailySummary.learning.conversions} conversiones · ${dailySummary.learning.revenue.toFixed(2)} atribuidos</div>
            </> : <div className="notice">{dailyLoading ? "Actualizando reporte..." : "Todavía no hay datos del reporte de hoy. Pulsa Refresh."}</div>}
          </div>
          <div className="block">
            <h2>⚡ Tiempo real</h2>
            <p className="desc">Measurement and publication are separated. Realtime data is never merged into historical totals.</p>
            <div className="metrics"><div className="metric"><b>{realtimeLabel}</b><span>Active users realtime</span></div><div className="metric"><b>{realtimeEventsLabel}</b><span>Realtime events</span></div><div className="metric"><b>{gaRealtime?.generatedAt ? new Date(gaRealtime.generatedAt).toLocaleString() : "N/A"}</b><span>Last realtime query</span></div><div className="metric"><b>{gaRows.length || "N/A"}</b><span>Historical GA4 rows</span></div></div>{!gaRealtime && <div className="notice">Realtime unavailable — no value is presented as zero.</div>}
          </div>
          <div className="integration"><article className="card integration-card"><div className="integration-head"><h3>Google Analytics 4</h3>{ga?.connected && <span className="status connected">● Connected</span>}</div><p>{ga?.connected && ga?.dataVerified ? "Property " + ga.propertyId + " verified with historical GA4 data." : ga?.connected ? "Property " + ga.propertyId + " is connected; historical reports have not returned data yet." : ga?.configured ? "Property " + ga.propertyId + " is configured but connection is not verified." : ga?.error || "Needs property ID + service-account access"}</p><div className="metrics"><div className="metric"><b>{gaMetrics.users.toLocaleString()}</b><span>Active users</span></div><div className="metric"><b>{gaMetrics.sessions.toLocaleString()}</b><span>Sessions</span></div><div className="metric"><b>{gaMetrics.views.toLocaleString()}</b><span>Page views</span></div><div className="metric"><b>${gaMetrics.revenue.toFixed(2)}</b><span>GA revenue</span></div></div></article><article className="card integration-card"><div className="integration-head"><h3>Google Search Console</h3>{gsc?.connected && <span className="status connected">● Connected</span>}</div><p>{gsc?.connected && gsc?.dataVerified ? "Connected to " + gsc.siteUrl + " with Search Console data available." : gsc?.connected ? "Search Console is connected; data for the selected period is not available yet." : gsc?.configured ? "Search Console is configured but connection is not verified." : gsc?.error || "Needs service-account property access"}</p><div className="metrics"><div className="metric"><b>{searchMetrics.clicks.toLocaleString()}</b><span>Clicks</span></div><div className="metric"><b>{searchMetrics.impressions.toLocaleString()}</b><span>Impressions</span></div><div className="metric"><b>{searchMetrics.impressions ? (searchMetrics.clicks / searchMetrics.impressions * 100).toFixed(2) : "0.00"}%</b><span>CTR</span></div><div className="metric"><b>{searchMetrics.impressions ? (searchMetrics.position / searchMetrics.impressions).toFixed(1) : "—"}</b><span>Avg. position</span></div></div></article></div>
          <article className="card chart-card"><div className="integration-head"><div><h3>Sales trend · last {salesChart.length || 0} days</h3><p>Revenue diario registrado por JQYDesigns. Sin datos inventados.</p></div><b>{salesMetrics.orders} orders · ${salesMetrics.revenue.toFixed(2)}</b></div><div className="sales-chart">{salesChart.length ? salesChart.map(row => <div className="chart-column" key={row.date} title={row.date + ": $" + row.revenueNumber.toFixed(2) + " · " + row.orders + " orders"}><div className="chart-bar" style={{height:row.height + "%"}}></div><span>{row.date.slice(5)}</span></div>) : <div className="notice">No hay ventas registradas para el período seleccionado.</div>}</div></article>
          <div className="block">
            <h2>📸 Instagram Insights · datos de Meta <span className="sub"><button className="btn sm" onClick={() => void loadInstagramInsights()} disabled={instagramInsightsLoading}><RefreshCw size={13}/> {instagramInsightsLoading ? "Consultando..." : "Actualizar Insights"}</button></span></h2>
            <p className="desc">Métricas consultadas desde la API oficial de Instagram para la cuenta profesional conectada. No se mezclan con GA4.</p>
            {instagramInsights ? <><div className="metrics"><div className="metric"><b>{instagramInsights.account.username ? "@"+instagramInsights.account.username : instagramInsights.account.id}</b><span>Cuenta verificada</span></div><div className="metric"><b>{instagramInsights.periodDays} días</b><span>Período consultado</span></div><div className="metric"><b>{instagramInsights.accountInsights.length}</b><span>Métricas de cuenta</span></div><div className="metric"><b>{instagramInsights.recentMedia.length}</b><span>Publicaciones recientes revisadas</span></div></div><div className="quick" style={{marginTop:12}}>{instagramInsights.accountInsights.map((metric,index)=>{const value=metric.total_value?.value ?? metric.values?.reduce((sum,item)=>sum+Number(item.value||0),0);return <div className="notice" key={metric.name+"-"+index}><b>{metric.title || metric.name}</b> · {value === undefined ? "Valor no disponible" : Number(value).toLocaleString()}</div>})}</div><div className="quick" style={{marginTop:12}}>{instagramInsights.recentMedia.map(media=><div className="notice" key={media.id}><b>{media.mediaType}</b> · {media.timestamp ? new Date(media.timestamp).toLocaleDateString() : "Fecha no disponible"} · {media.likeCount} likes · {media.commentsCount} comentarios{media.permalink ? <> · <a href={media.permalink} target="_blank" rel="noreferrer">Ver publicación ↗</a></> : ""}<div>{media.caption || "Sin caption"}</div>{media.insightsError ? <small>Insights de esta publicación no disponibles: {media.insightsError}</small> : media.insights.map(metric=><span key={metric.name} style={{marginRight:10}}>{metric.name}: {metric.values?.reduce((sum,item)=>sum+Number(item.value||0),0) ?? "—"}</span>)}</div>)}</div><div className="notice">Última consulta: {new Date(instagramInsights.generatedAt).toLocaleString()}</div></> : <div className="notice">{instagramInsightsLoading ? "Consultando la API oficial de Instagram..." : instagramInsightsError || "Aún no hay datos de Instagram Insights."}{instagramInsightsError ? <div style={{marginTop:8}}>Si Meta rechaza el permiso de Insights, habrá que volver a autorizar la conexión con ese permiso habilitado.</div> : null}</div>}
          </div>
          {latestPublications.length > 0 && <div className="block">
            <h2>📰 Últimas publicaciones reales</h2>
            <p className="desc">Las tres más recientes del robot y del publicador. El registro completo está en la pestaña Actividad.</p>
            {latestPublications.map(item => { const result = item.result || {}; return <div className="row" key={String(item.run_id)}><span>{item.status === "PROCESSING" ? "⏳" : item.published ? "✅" : "❌"}</span><b>{item.channel}</b><span>{result.account || "Cuenta no indicada"} · {item.campaign_name}</span><span className="when">{new Date(item.created_at).toLocaleString()}{result.url ? <> · <a href={result.url} target="_blank" rel="noreferrer">Ver publicación ↗</a></> : ""}</span></div>; })}
          </div>}
          <div className="quick">
          <button className="card" onClick={openQuickCampaign}><Sparkles size={18}/><strong>Campaign Assistant</strong><small>Start a ready-to-edit campaign in the publisher.</small></button>
          <button className="card" onClick={openSeo}><Search size={18}/><strong>SEO</strong><small>Open live Search Console and Analytics data.</small></button>
          <button className="card" onClick={openCreative}><Image size={18}/><strong>Creative Publisher</strong><small>Prepare an image campaign for social channels.</small></button>
          <button className="card" onClick={openWhatsApp}><MessageCircle size={18}/><strong>WhatsApp</strong><small>Send a real Business message to a recipient.</small></button>
        </div>
        </section>}

        {activeTab === "campanas" && <section>
          <div className="block">
            <h2>✨ Campañas</h2>
            <p className="desc">Se crea una sola vez y sale por todas las cuentas conectadas que elijas. El publicador central y el asistente viven aquí.</p>
            <div className="actions">
              <button className="btn primary" onClick={openCampaign}><Sparkles size={15}/> Crear campaña</button>
              <button className="btn" onClick={() => openComposer()}><Send size={15}/> Abrir publicador central</button>
              <span className="pill ok"><span className="dot"></span> {socialChannels.filter(channel => Boolean(social.channels?.[channel.social!])).length} canales conectados listos</span>
            </div>
          </div>
          {campaignHistory.length > 0 && <div className="cards c3" style={{marginBottom:14}}>{campaignHistory.map(campaign => { const socialResults = Object.values(campaign.results?.social || {}); const requestedChannels = campaign.channels.length; const publishedChannels = socialResults.filter(result => result.ok).length; const failedChannels = socialResults.filter(result => !result.ok).length; return <article className="ucard" key={campaign.id}>
            <div className="ic">{campaign.campaign_type === "catalog" ? "🛍️" : campaign.campaign_type === "event" ? "🎉" : campaign.campaign_type === "generated" ? "✨" : campaign.campaign_type === "paid" ? "💰" : "📝"}</div>
            <strong>{campaign.name}</strong>
            <small>{campaign.target_area} · {new Date(campaign.created_at).toLocaleString()}</small>
            <small>{requestedChannels} canales configurados · {publishedChannels} publicadas{failedChannels ? " · " + failedChannels + " fallidas" : ""}{campaign.results?.email ? " · Email a " + campaign.results.email.totalRecipients + " destinatarios" : ""}{campaign.autopilot_enabled ? " · 🤖 Autopilot ON" : ""}{campaign.campaign_type ? " · Tipo " + campaign.campaign_type : ""}{campaign.recurrence_hours ? " · Cada " + campaign.recurrence_hours + "h" : ""}</small>
            <div className="foot"><button className="btn sm" type="button" onClick={() => { setCampaignPreviewCampaign(campaign); setModal(null); }} aria-label="View campaign"><Image size={13}/> Ver</button><button className="btn sm danger" type="button" onClick={() => void deleteCampaign(campaign)} disabled={deletingCampaignId === campaign.id} aria-label="Delete campaign" title="Delete campaign">{deletingCampaignId === campaign.id ? <Loader2 size={13}/> : <Trash2 size={13}/>} Borrar</button></div>
          </article>; })}</div>}
          <div className="block"><div className="integration-head"><h3>Campaign Result Center</h3><span className="status">{campaignResultsCenter.length} campaigns</span></div>{campaignResultsCenter.length ? <div style={{overflowX:"auto",marginTop:10}}><table style={{width:"100%",fontSize:10,borderCollapse:"collapse"}}><thead><tr><th align="left">Campaign</th><th>Status</th><th>Published</th><th>Processing</th><th>Failed</th><th>Sessions</th><th>Revenue</th></tr></thead><tbody>{campaignResultsCenter.slice(0,20).map(row=><tr key={row.campaignId}><td>{row.campaignName}</td><td>{row.publicationStatus}</td><td>{row.published}</td><td>{row.processing}</td><td>{row.failed}</td><td>{row.metrics.sessions == null ? "N/A" : row.metrics.sessions.toLocaleString()}</td><td>{row.metrics.revenue == null ? "N/A" : "$"+row.metrics.revenue.toFixed(2)}</td></tr>)}</tbody></table></div> : <div className="notice">No campaign result data available yet.</div>}</div>
          <div className="block"><div className="integration-head"><h3>Campaign Attribution</h3><span className="status">{campaignAttribution.length} rows</span></div>{campaignAttribution.length ? <div style={{overflowX:"auto",marginTop:10}}><table style={{width:"100%",fontSize:10,borderCollapse:"collapse"}}><thead><tr><th align="left">Campaign</th><th>Source</th><th>Medium</th><th>Sessions</th><th>Conversions</th><th>Revenue</th><th>Status</th></tr></thead><tbody>{campaignAttribution.slice(0,20).map(row=><tr key={row.campaignId+"-"+row.source+"-"+row.medium}><td>{row.campaignId || "N/A"}</td><td>{row.source || "N/A"}</td><td>{row.medium || "N/A"}</td><td>{row.sessions.toLocaleString()}</td><td>{row.conversions.toLocaleString()}</td><td>${row.revenue.toFixed(2)}</td><td>{row.attributionStatus}</td></tr>)}</tbody></table></div> : <div className="notice">No campaign attribution data available for the selected period.</div>}</div>
          <div className="block"><div className="integration-head"><h3>Google Ads</h3><span className={googleAds?.connected && googleAds.liveVerified ? "status connected" : "status"}>{googleAds?.state || "N/A"}</span></div><p>{googleAds?.message || googleAds?.error || "Google Ads verification has not returned data."}</p>{googleAds?.missing?.length ? <div className="notice">Missing real credentials: {googleAds.missing.join(", ")}</div> : null}</div>
        </section>}

        {activeTab === "robot" && <section id="marketing-autopilot">
          <div className="block">
            <div className="robot-head">
              <div className="robot-ic">🤖</div>
              <div style={{flex:1,minWidth:220}}><h2 style={{fontSize:18}}>Robot de contenido (Autopilot)</h2><p className="desc" style={{margin:"3px 0 0"}}>El mismo Marketing Brain trabaja dos fuentes: productos nuevos del catálogo y trabajos del Portfolio. Toma sus imágenes y datos reales y los incorpora al mismo aprendizaje.</p></div>
              <span className={catalog?.enabled ? "pill ok" : "pill off"}><span className="dot"></span> {catalog?.enabled ? "ACTIVADO · MODO PROPUESTA" : "APAGADO"}</span>
              <button className="btn primary" onClick={() => void toggleCatalog(!catalog?.enabled)} disabled={catalogLoading}>{catalog?.enabled ? "⏸ Pausar robot" : "▶ Activar robot"}</button>
              <button className="btn" onClick={() => void runAutopilotNow()} disabled={autopilotRunning}>{autopilotRunning ? "Ejecutando..." : "▶ Ejecutar robot ahora"}</button>
              <button className="btn" onClick={() => void loadCatalog()} disabled={catalogLoading}><RefreshCw size={14}/> {catalogLoading ? "Updating..." : "Refresh"}</button>
            </div>
            {catalog?.enabled && <div className="notice">🟢 <b>El robot está prendido en modo propuesta:</b> prepara la publicación del día y <b>no publica nada solo</b> — cada propuesta espera el «sí» del dueño (o una autorización por toda la semana) antes de salir.</div>}
            {currentProposal ? (() => { const p: any = currentProposal; const intel: any = p.reasoning?.intelligence || null; const sched: any = p.schedule || p.reasoning?.schedule || null; return <div className="notice" style={{borderColor:"#1D4ED8",background:"#EFF6FF"}}>
              📌 <b>Propuesta pendiente de tu aprobación:</b> «{p.title}»<br/>
              {p.image_url ? <img src={p.image_url} alt="" style={{display:"block",maxWidth:220,borderRadius:10,margin:"8px 0"}}/> : null}
              <span style={{whiteSpace:"pre-wrap"}}>{p.caption}</span><br/>
              <span>🛒 <a href={p.product_link} target="_blank" rel="noreferrer">Ver en la tienda</a> · 💬 <a href={p.whatsapp_link} target="_blank" rel="noreferrer">Link de WhatsApp</a></span><br/>
              {Array.isArray(p.channel_plan) && p.channel_plan.length ? <span>{p.channel_plan.map((c: any) => <span key={c.channel} className={c.status === "ready" ? "pill ok" : "pill off"} style={{marginRight:6}} title={c.note}>{c.status === "ready" ? "✓" : "✕"} {c.channel}</span>)}</span> : null}
              {sched ? <div style={{marginTop:6}}>🕐 <b>{sched.label}</b> (hora de Houston)<br/><i>{sched.evidenceText}</i></div> : null}
              {intel ? <div style={{marginTop:8,borderTop:"1px solid #BFDBFE",paddingTop:8}}>
                <b>🧠 Inteligencia ULTRA — Puntaje {intel.score}/100 · {intel.scoreLabel}</b>
                <ul style={{margin:"6px 0 6px 16px",padding:0}}>{(intel.components || []).map((c: any) => <li key={c.key}><b>{c.label}:</b> {c.points}/{c.max} — {c.evidence}</li>)}</ul>
                <div>📈 <b>Pronóstico:</b> {intel.forecast?.note}{intel.forecast?.reach ? ` Alcance típico ${intel.forecast.reach.low}–${intel.forecast.reach.high} (mediana ${intel.forecast.reach.mid}), interacciones ${intel.forecast.interactions?.low}–${intel.forecast.interactions?.high}.` : ""}</div>
                {intel.experiment ? <div style={{marginTop:6}}>🧪 <b>Experimento A/B:</b> {intel.experiment.hypothesis}<br/><b>Variante A{intel.experiment.designatedVariant === "A" ? " (se publica esta)" : ""}:</b> <span style={{whiteSpace:"pre-wrap"}}>{intel.experiment.variantA}</span><br/><b>Variante B{intel.experiment.designatedVariant === "B" ? " (se publica esta)" : ""}:</b> <span style={{whiteSpace:"pre-wrap"}}>{intel.experiment.variantB}</span></div> : null}
                {Array.isArray(intel.channelVariants) && intel.channelVariants.length ? <details style={{marginTop:6}}><summary><b>Variantes por canal</b> (Instagram ≠ Facebook ≠ Marketplace ≠ YouTube)</summary>{intel.channelVariants.map((v: any) => <div key={v.channel} style={{marginTop:6}}><b style={{textTransform:"capitalize"}}>{v.channel}:</b> <span style={{whiteSpace:"pre-wrap"}}>{v.text}</span><br/><i>Hipótesis: {v.hypothesis}</i></div>)}</details> : null}
              </div> : null}
              {!showReject ? <div className="actions" style={{marginTop:10}}>
                <button className="btn primary" onClick={() => void approveCurrentProposal("once")} disabled={proposalBusy}>✅ Aprobar esta propuesta</button>
                <button className="btn" onClick={() => void approveCurrentProposal("week")} disabled={proposalBusy}>📅 Aprobar y autorizar la semana</button>
                <button className="btn" onClick={() => setShowReject(true)} disabled={proposalBusy}>❌ Rechazar</button>
                <button className="btn" onClick={() => { void loadProposals(); void loadUltraReport(); }} disabled={proposalBusy}><RefreshCw size={13}/> Actualizar</button>
              </div> : <div style={{marginTop:10}}>
                <b>¿Por qué no? Tu motivo le enseña tu gusto al robot:</b>
                <div className="checks" style={{marginTop:6,flexWrap:"wrap"}}>{[{code:"product",label:"No me gusta el producto elegido"},{code:"text",label:"El texto no me convence"},{code:"timing",label:"El día/hora no me cierra"},{code:"too_soon",label:"Muy seguido / todavía no"},{code:"price_offer",label:"Precio u oferta a ajustar"},{code:"other",label:"Otro motivo"}].map((r: any) => <label key={r.code} className={`check ${rejectReason === r.code ? "selected" : ""}`}><input type="radio" name="reject-reason" checked={rejectReason === r.code} onChange={() => setRejectReason(r.code)}/><span>{r.label}</span></label>)}</div>
                <input className="input" style={{marginTop:6}} placeholder="Detalle opcional (lo que sea, con tus palabras)" value={rejectText} onChange={e => setRejectText(e.target.value)}/>
                <div className="actions" style={{marginTop:8}}><button className="btn primary" onClick={() => void rejectCurrentProposal()} disabled={proposalBusy}>Confirmar rechazo</button><button className="btn" onClick={() => setShowReject(false)} disabled={proposalBusy}>Volver</button></div>
              </div>}
            </div>; })() : <div className="notice">📌 <b>Sin propuesta pendiente ahora:</b> {proposalData?.today ? `la de hoy quedó «${proposalData.today.status}».` : "hoy no toca proponer (cadencia de publicar poco y bien) o el robot está juntando evidencia."} Cuando haya una, aparece acá completa — con su puntaje, su pronóstico y sus variantes — y <b>solo se publica con tu sí</b>.</div>}
            <div className="metrics c5" style={{marginTop:14}}>
              <div className="metric"><b>{catalog?.pendingProducts ?? 0}</b><span>Productos en espera</span></div>
              <div className="metric"><b>{catalog?.pendingPortfolio ?? 0}</b><span>Trabajos Portfolio en espera</span></div>
              <div className="metric"><b>{catalog?.lastProductName || "—"}</b><span>Último producto</span></div>
              <div className="metric"><b>{catalog?.lastScanAt ? new Date(catalog.lastScanAt).toLocaleString() : "—"}</b><span>Último escaneo</span></div>
              <div className="metric"><b>{catalog?.lastCampaignId ? "Registrada" : "Sin campañas"}</b><span>Última campaña automática</span></div>
            </div>
            {catalog && catalog.pendingProducts === 0 && catalog.pendingPortfolio === 0 && <div className="notice">✅ <b>La cola autónoma está en cero:</b> el robot no tiene publicaciones viejas guardadas para soltar. Trabaja solo con la propuesta del día, cuando el dueño la aprueba.</div>}
            {catalog?.lastGenerated && <div className="notice"><b>Último cartel generado:</b> {catalog.lastGenerated.productName || "—"}{catalog.lastGenerated.status ? " · " + catalog.lastGenerated.status : ""}{catalog.lastGenerated.createdAt ? " · " + new Date(catalog.lastGenerated.createdAt).toLocaleString() : ""}</div>}
            {catalog?.lastAutopilotRun ? <div className="notice"><b>Última corrida automática:</b> {catalog.lastAutopilotRun.ran ? "procesó " + catalog.lastAutopilotRun.processed + " elemento(s)" : "sin publicación"}{catalog.lastAutopilotRun.reason ? " · " + catalog.lastAutopilotRun.reason : ""}{catalog.lastAutopilotRun.detail?.queueReasons?.length ? " · " + catalog.lastAutopilotRun.detail.queueReasons.join(" · ") : ""}{catalog.lastAutopilotRun.createdAt ? " · " + new Date(catalog.lastAutopilotRun.createdAt).toLocaleString() : ""}</div> : <div className="notice">El robot aún no registra corridas desde esta actualización.</div>}
            {catalog?.lastCampaignId && <div className="notice"><b>Última campaña automática:</b> {catalog.lastCampaignId}<br/>Los productos se registran como <b>catalog</b> y los trabajos como <b>portfolio</b>; ambos entran al mismo historial por canal.</div>}
            <p style={{color:"var(--mk-muted)",fontSize:11,marginTop:10}}>Productos + Portfolio · mismo aprendizaje · sin sistema paralelo</p>
          </div>
          <div className="block">
            <h2>🎓 Aprendizaje del robot</h2>
            <p className="desc">El robot solo «aprende» de resultados reales atribuidos (sesiones, conversiones e ingresos que llegan de Google Analytics). Publicar solo no cuenta como aprender.</p>
            {dailySummary && <><div style={{display:"flex",justifyContent:"space-between",fontSize:12.5,flexWrap:"wrap",gap:6}}><span><b>Nivel {dailySummary.learning.level} · {dailySummary.learning.levelName}</b></span><span style={{color:"var(--mk-muted)"}}>Meta siguiente: {dailySummary.learning.nextTarget}</span></div><div className="lvl"><i style={{width: Math.min(100, dailySummary.learning.level * 20) + "%"}}></i></div></>}
            <div className="metrics" style={{marginTop:14}}>{learningInsights.map(item => <div className="metric" key={item.channel}><b>{(item.score * 100).toFixed(1)}</b><span>{item.channel} · {item.observations} obs.{item.recommended ? " · recomendado" : ""}</span></div>)}</div>
            <div className="notice">{learningLoading ? "Actualizando aprendizaje..." : learningInsights.some(item => item.sessions > 0 || item.conversions > 0 || item.revenue > 0) ? "Learning activo con evidencia de GA4: sesiones, conversiones y/o revenue atribuidos." : "Sin evidencia de resultado atribuido todavía. Las publicaciones se registran, pero el sistema no las presenta como aprendizaje hasta recibir datos reales."}</div>
          </div>
          <div className="block">
            <h2>🧠 Informe ULTRA del robot <span className="sub"><button className="btn sm" onClick={() => void loadUltraReport()} disabled={ultraLoading}><RefreshCw size={13}/> {ultraLoading ? "Updating..." : "Refresh"}</button></span></h2>
            <p className="desc">Aprendizaje abierto y continuo: el robot aprende de todo — redes, Google, WhatsApp, ventas reales y de tus «sí» y «no» — y se ajusta solo. <b>La publicación no se abre: sigue solo con tu sí.</b></p>
            {ultraReport ? <>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                <span className="pill ok"><span className="dot"></span> Motor {ultraReport.capabilityTier} · {ultraReport.capabilitiesActive}/{ultraReport.capabilitiesTotal} capacidades activas</span>
                {dailySummary && <span className="pill off"><span className="dot"></span> Nivel de aprendizaje por datos: {dailySummary.learning.level} · {dailySummary.learning.levelName} (sube con datos reales, no con el rótulo)</span>}
                <span style={{color:"var(--mk-muted)",fontSize:12}}>{ultraReport.learning.observations} observaciones · actualizado {new Date(ultraReport.generatedAt).toLocaleString()}</span>
              </div>
              {ultraReport.alerts?.length ? <div style={{marginTop:10}}>{ultraReport.alerts.map((a: any, i: number) => <div key={i} className="notice" style={{marginTop:6,borderColor: a.level === "critical" ? "#B42318" : a.level === "warning" ? "#B45309" : "#1D4ED8", color: a.level === "critical" ? "#B42318" : undefined}}>{a.level === "critical" ? "🔴" : a.level === "warning" ? "🟠" : "🔵"} <b>{a.title}:</b> {a.detail}</div>)}</div> : <div className="notice" style={{marginTop:10}}>✅ Sin alertas: ningún canal caído ni publicación fallida detectada.</div>}
              <div className="metrics" style={{marginTop:12}}>{(ultraReport.capabilities || []).map((c: any) => <div className="metric" key={c.key}><b>{c.active ? "✓" : "…"}</b><span>{c.label} — {c.detail}</span></div>)}</div>
              {ultraReport.lessons?.length ? <div style={{marginTop:10}}><b>Lo que aprendió (con evidencia):</b><ul style={{margin:"6px 0 0 16px",padding:0}}>{ultraReport.lessons.map((l: string, i: number) => <li key={i}>{l}</li>)}</ul></div> : null}
              {ultraReport.attribution?.length ? <div style={{marginTop:10}}><b>Atribución de las últimas publicaciones:</b>{ultraReport.attribution.map((a: any, i: number) => <div className="row" key={i}><b style={{textTransform:"capitalize"}}>{a.channel}</b><span>{a.title} · {a.impressions} alcance · {a.interactions} interacciones · {a.sessions} sesiones · {a.conversions} conversiones · ${Number(a.revenue).toFixed(2)}</span><span className="when">{a.note}</span></div>)}</div> : null}
              {ultraReport.whatsapp?.topics?.length ? <div style={{marginTop:10}}><b>Lo que preguntan por WhatsApp ({ultraReport.whatsapp.inboundMessages} consultas en {ultraReport.whatsapp.windowDays} días):</b> {ultraReport.whatsapp.topics.map((t: any) => <span key={t.code} className="pill off" style={{marginRight:6}}>{t.label}: {t.count}</span>)}</div> : null}
              <div className="notice" style={{marginTop:10}}>💼 <b>Comprador de anuncios:</b> {ultraReport.mediaBuyer?.status === "active" ? "activo con datos pagos reales." : ultraReport.mediaBuyer?.reason} {ultraReport.mediaBuyer?.campaigns?.length ? ultraReport.mediaBuyer.campaigns.map((c: any) => <span key={c.campaignId} style={{display:"block"}}>{c.campaignId}: {c.impressions} impresiones · CTR {(c.ctr * 100).toFixed(2)}% · gasto ${Number(c.spend).toFixed(2)} → <b>{c.recommendation}</b></span>) : null}</div>
              <div className="notice" style={{marginTop:8,borderColor:"#C8102E"}}>🎯 <b>{ultraReport.nextMove}</b></div>
            </> : <div className="notice">{ultraLoading ? "Cargando el informe ULTRA..." : "El informe ULTRA todavía no cargó. Tocá Refresh."}</div>}
          </div>
        </section>}

        {activeTab === "cuentas" && <section id="marketing-channels">
          <div className="block">
            <h2>🔌 Cuentas conectadas <span className="sub"><button className="btn sm" onClick={() => void loadSocial()} disabled={socialLoading}><RefreshCw size={13}/> Actualizar estados</button></span></h2>
            <p className="desc">Conecta la cuenta oficial que realmente administra cada canal. Nada está hardcodeado. Todas las tarjetas del mismo tamaño: se ve de una mirada qué está conectado y qué falta.</p>
          </div>
          {channelNotice && <div className="notice" role="status" aria-live="polite" style={{marginBottom:10}}>{channelNotice}</div>}{connectDiag?.whatsappDiagnosis && <div className="notice" role="status" style={{marginBottom:10}}><strong>Diagnóstico WhatsApp (servidor):</strong> {connectDiag.whatsappDiagnosis.rowExists ? `conexión guardada: sí · números en el perfil: ${connectDiag.whatsappDiagnosis.entries} · cuenta en la primera entrada: ${connectDiag.whatsappDiagnosis.firstEntryHasWabaId ? "sí" : "no"} · número en la primera entrada: ${connectDiag.whatsappDiagnosis.firstEntryHasPhoneId ? "sí" : "no"} · listo para publicar: ${connectDiag.whatsappDiagnosis.ready ? "sí" : "no"} · método: ${connectDiag.whatsappDiagnosis.signupMethod || "—"} · actualizado: ${connectDiag.whatsappDiagnosis.updatedAt || "—"}` : "no hay ninguna conexión de WhatsApp guardada en el servidor."}{connectDiag.events?.length ? ` · Último intento registrado: ${connectDiag.events[0].outcome}${connectDiag.events[0].detail?.message ? ` — ${connectDiag.events[0].detail.message}` : ""} (${connectDiag.events[0].createdAt || ""})` : ""}</div>}{connectDiag?.metaDiagnosis && <div className="notice" role="status" style={{marginBottom:10}}><strong>Diagnóstico Meta (servidor):</strong> {connectDiag.metaDiagnosis.rowExists ? `páginas en el perfil guardado: ${connectDiag.metaDiagnosis.pages} · cuentas de Instagram vinculadas: ${connectDiag.metaDiagnosis.instagramAccounts} · actualizado: ${connectDiag.metaDiagnosis.updatedAt || "—"}` : "no hay ninguna conexión de Meta guardada en el servidor."}</div>}{connectDiag?.youtubeDiagnosis && <div className="notice" role="status" style={{marginBottom:10}}><strong>Diagnóstico YouTube (servidor):</strong> {connectDiag.youtubeDiagnosis.rowExists ? `canal: ${connectDiag.youtubeDiagnosis.channelTitle || "—"} (${connectDiag.youtubeDiagnosis.channelId || "—"}) · token renovable: ${connectDiag.youtubeDiagnosis.hasRefreshToken ? "sí" : "no"} · actualizado: ${connectDiag.youtubeDiagnosis.updatedAt || "—"}` : "no hay ninguna conexión de YouTube guardada en el servidor."}{connectDiag.youtubeDiagnosis.lastRefreshFailedAt ? ` · ⚠️ última renovación fallida: ${connectDiag.youtubeDiagnosis.lastRefreshError || "error desconocido"} (${connectDiag.youtubeDiagnosis.lastRefreshFailedAt})` : ""}</div>}
          <div className="channels channel-grid-2">{channels.map(channel => { const Icon = channel.icon; const rawProfile = channel.provider ? social.connected?.[channel.provider]?.profile || {} : {}; const accountOptions = channel.social === "facebook" ? (rawProfile.pages || []) : channel.social === "instagram" ? (rawProfile.instagram || []) : channel.social === "whatsapp" ? (rawProfile.whatsapp || []) : channel.social === "pinterest" ? (rawProfile.boards || []) : []; const requiresSelection = accountOptions.length > 1; const selectedAccount = channel.social ? social.selections?.[channel.social] : undefined; const connected = isConnected(channel) && (!requiresSelection || Boolean(selectedAccount)); const configured = channel.provider ? Boolean(social.configured?.[channel.provider]) : channel.name === "Google" ? Boolean(gsc?.configured || ga?.configured) : channel.name === "Email" ? Boolean(emailStatus?.configured) : false; return <article className="card channel" key={channel.name}><div className="channel-top"><span className="channel-icon" style={{ color: channel.tone }}><Icon size={21}/></span>{connected && <CheckCircle2 className="connected" size={18}/>}</div><strong>{channel.name}</strong><small>{channel.detail}</small>{requiresSelection && channel.social ? <select className="select" style={{marginTop:8,width:"100%",fontSize:10}} value={selectedAccount || ""} onChange={event => void selectSocialAccount(channel,event.target.value)} disabled={busyProvider === channel.provider}><option value="">Select official account...</option>{accountOptions.map((account:any) => <option key={String(account.id)} value={String(account.id)}>{account.name || account.username || account.display_phone_number || account.business_name || String(account.id)}</option>)}</select> : null}{connected ? <><span className="status connected"><CheckCircle2 size={11}/>Connected</span><span className="account">{accountName(channel)}</span>{channel.social === "pinterest" && <div className="notice" style={{marginTop:8,overflowWrap:"anywhere"}}><strong>Pinterest board audit</strong>{Array.isArray((rawProfile as any).boards) && (rawProfile as any).boards.length ? (rawProfile as any).boards.map((board:any) => <div key={String(board.id)} style={{padding:"8px 0",borderTop:"1px solid #d8dee8",marginTop:6}}><div><strong>{board.name || "Untitled board"}</strong> · {board.privacy || "Privacy not returned"}</div><small>board_id: {String(board.id || "Missing ID")}</small><div><small>{social.selections?.pinterest === String(board.id) ? "Selected for publishing" : (rawProfile as any).boards.length === 1 ? "Only available board; publisher can use it automatically" : "Not selected"}</small></div></div>) : <p style={{margin:"6px 0 0"}}>No boards were returned by the latest profile verification. Use Verify live, then refresh this panel to inspect the provider response.</p>}</div>}{channel.provider && <div className="actions" style={{ marginTop: 8 }}><button className="btn" style={{ padding: "6px 8px", fontSize: 9 }} onClick={async () => { const provider = channel.provider!; setBusyProvider(provider); setVerificationResults(current => ({ ...current, [provider]: "Verifying with the live provider API…" })); try { const result = await Promise.race([apiRequest<{verified?:boolean;error?:string}>(`/api/admin/marketing/social/${provider}/verify?_=${Date.now()}`), new Promise<{verified?:boolean;error?:string}>((_, reject) => window.setTimeout(() => reject(new Error("Verification timed out after 15 seconds. Please retry; the provider response did not arrive.")), 15000))]) as {verified?:boolean;error?:string}; const message = result.verified ? `✓ ${channel.name} verified against the live provider API.` : result.error || `${channel.name} verification failed.`; setVerificationResults(current => ({ ...current, [provider]: message })); setNotice(message); await loadSocial(); } catch (error) { const message = error instanceof Error ? error.message : `${channel.name} verification failed.`; setVerificationResults(current => ({ ...current, [provider]: message })); setNotice(message); } finally { setBusyProvider(null); } }} disabled={busyProvider === channel.provider}><CheckCircle2 size={11}/>{busyProvider === channel.provider ? "Verifying…" : "Verify live"}</button>{channel.provider !== "instagram" && <button className="btn" style={{ padding: "6px 8px", fontSize: 9 }} onClick={() => void disconnect(channel)} disabled={busyProvider === channel.provider}><Unplug size={11}/>Disconnect</button>}</div>}{channel.provider && verificationResults[channel.provider] && <p role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 12, overflowWrap: "anywhere" }}>{verificationResults[channel.provider]}</p>}</> : channel.name === "Google" ? <><span className="status">{configured ? "Analytics ready" : "Needs configuration"}</span><button className="btn primary" style={{ marginTop: 9, padding: "7px 10px", fontSize: 10 }} onClick={openSeo}><Search size={12}/>Configure Google</button></> : channel.name === "Email" ? <><span className={configured ? "status connected" : "status"}>{configured ? "Configured" : "Needs configuration"}</span><span className="account">{emailStatus?.fromEmail || "Resend sender not configured"}</span><div className="actions" style={{ marginTop: 8 }}><button className="btn primary" style={{ padding: "6px 8px", fontSize: 9 }} onClick={() => void openEmailCampaign()}><Mail size={11}/>Open Email Campaign</button><button className="btn" style={{ padding: "6px 8px", fontSize: 9 }} onClick={() => void loadEmailStatus()}><RefreshCw size={11}/>Refresh</button></div></> : configured && channel.provider !== "instagram" ? <button className="btn primary" style={{ marginTop: 9, padding: "7px 10px", fontSize: 10 }} onClick={() => void connect(channel)} disabled={Boolean(busyProvider)}>{busyProvider === channel.provider ? <Loader2 size={12}/> : <Link2 size={12}/>} Connect official account</button> : <button className="btn" style={{ marginTop: 9, padding: "7px 10px", fontSize: 10 }} onClick={() => setSetupProvider(channel.provider!)}><Link2 size={12}/>Setup connection</button>}</article>; })}</div>
          <WhatsAppInbox />
        </section>}

        {activeTab === "actividad" && <section id="marketing-activity">
          <div className="block">
            <h2>🌐 Actividad de publicaciones <span className="sub"><button className="btn sm" onClick={() => void loadPublicationActivity()} disabled={publicationLoading}><RefreshCw size={13}/> {publicationLoading ? "Updating..." : "Refresh"}</button></span></h2>
            <p className="desc">Registro real de dónde está trabajando el Marketing Brain: campaña, canal, estado, identificador y enlace externo cuando la plataforma lo proporciona. Cada publicación en una sola línea.</p>
            <div className="stats4">
              <div className="metric"><b>{publicationStats.total}</b><span>Publicaciones registradas</span></div>
              <div className="metric"><b>{publicationStats.published}</b><span>Publicadas OK</span></div>
              <div className="metric"><b>{publicationStats.failed}</b><span>Fallidas</span></div>
              <div className="metric"><b>{publicationStats.links}</b><span>Links disponibles</span></div>
            </div>
            {publicationActivity.length ? publicationActivity.map(item => { const result = item.result || {}; const link = result.url; return <div key={String(item.run_id)}>
              <div className="row"><span>{item.status === "PROCESSING" ? "⏳" : item.published ? "✅" : "❌"}</span><b>{item.channel}</b><span><b>{item.campaign_name}</b>{item.campaign_type ? " · " + item.campaign_type : ""}{item.run_type === "autopilot" ? " · 🤖 Autopilot" : ""}{result.account ? " · " + result.account : ""}{result.id ? " · ID: " + result.id : ""}</span><span className="when">{new Date(item.created_at).toLocaleString()}</span>{link ? <a href={link} target="_blank" rel="noreferrer">Ver ↗</a> : null}</div>
              {item.status === "PROCESSING" ? <div className="rowdetail" style={{color:"#B45309"}}><b>Status:</b> Processing / confirmation pending</div> : null}
              {result.error ? <div className="rowdetail" style={{color:"#B42318"}}><b>Error:</b> {result.error}</div> : null}
              {item.landing_link ? <div className="rowdetail">Landing rastreada: {item.landing_link}</div> : null}
            </div>; }) : <div className="notice">Todavía no hay ejecuciones registradas. Cuando el robot o una campaña publiquen algo, aparecerá aquí con el canal, estado, ID y enlace disponible.</div>}
          </div>
        </section>}
      </main>
      {setupProvider && <div className="modal-bg" onClick={() => setSetupProvider(null)}><div className="modal" onClick={event => event.stopPropagation()}><div className="modal-head"><h2>Connect {setupTitle(setupProvider)}</h2><button className="close" onClick={() => setSetupProvider(null)}><X size={18}/></button></div><p>Esta conexión es real: primero se configura la aplicación OAuth del proveedor en el servidor y después el botón de conexión te llevará a la cuenta oficial para autorizarla.</p><div className="notice"><b>Variables del backend</b><br/>{(social.setup?.[setupProvider]?.envKeys || []).map(key => <code key={key} style={{ display: "block", marginTop: 4 }}>{key}</code>)}<br/><b>Callback exacto</b><br/><code style={{ wordBreak: "break-all" }}>{social.setup?.[setupProvider]?.callback || ""}</code></div><div className="notice">Después de guardar las credenciales en el entorno Production del backend, pulsa Refresh en esta página. El botón cambiará a <b>Connect official account</b> y podrás autorizar tu cuenta real.</div><div className="actions"><button className="btn primary" onClick={() => { setSetupProvider(null); void loadSocial(); }}><RefreshCw size={14}/>Refresh connection status</button><button className="btn" onClick={() => setSetupProvider(null)}>Close</button></div></div></div>}
      {modal && <div className="modal-bg" onClick={() => setModal(null)}><div className="modal" onClick={event => event.stopPropagation()}><div className="modal-head"><h2>{modal === "composer" ? "Central Publisher" : modal === "email" ? "Email Campaign" : modal === "campaign" ? "Create Campaign" : "Google Integrations"}</h2><button className="close" onClick={() => setModal(null)}><X size={18}/></button></div>{modal === "Google" && <><p>Google se conecta al Marketing Brain para leer Search Console y GA4 y alimentar decisiones con datos reales. No publica anuncios ni garantiza posiciones orgánicas.</p><div className="notice">
<b>Search Console</b><br/>
{gsc?.dataVerified ? "✅ DATA_AVAILABLE" : gsc?.status ? `⚠️ ${gsc.status}` : "⚠️ NOT VERIFIED"} · {gsc?.resolvedSiteUrl || gsc?.siteUrl || "jqydesigns.com"}{gsc?.permissionLevel ? ` · ${gsc.permissionLevel}` : ""}<br/>
{gsc?.error && <span>{gsc?.connected ? "⚠️ " : "❌ "}{gsc.error}<br/></span>}
<b>GA4</b><br/>
{ga?.dataVerified ? "✅ DATA_AVAILABLE" : ga?.status ? `⚠️ ${ga.status}` : "⚠️ NOT VERIFIED"} · Property {ga?.propertyId || "553929161"}<br/>
{ga?.connected && !ga?.dataVerified ? <span>⚠️ GA4 está conectado, pero aún no devuelve datos históricos para el período consultado.<br/></span> : ga?.error ? <span>❌ {ga.error}<br/></span> : null}
<span>Filas de datos: Search Console {gsc?.rows || 0} · GA4 {ga?.rows || 0}</span>
</div><div className="actions"><button className="btn primary" onClick={() => void refreshGoogle()} disabled={googleChecking}>{googleChecking ? <Loader2 size={14}/> : <RefreshCw size={14}/>} {googleChecking ? "Verifying Google..." : "Verify & refresh Google"}</button></div></>}
      {modal === "campaign" && <>
      <div className="cf-sec"><h3 className="cf-h">Campaign</h3>
        <div className="field"><label>CAMPAIGN TYPE</label><div className="checks cf-seg"><label className={`check ${campaignType === "event" ? "selected" : ""}`}><input type="radio" checked={campaignType === "event"} onChange={() => setCampaignType("event")}/><span>📣 Special / Event Promotion</span></label><label className={`check ${campaignType === "manual" ? "selected" : ""}`}><input type="radio" checked={campaignType === "manual"} onChange={() => setCampaignType("manual")}/><span>📝 General Manual Campaign</span></label></div></div>
        <div className="field"><label>CAMPAIGN NAME</label><input className="input" value={campaignName} onChange={e => setCampaignName(e.target.value)} placeholder="Halloween 2×3"/></div>
        <div className="cf-2col"><div className="field"><label>OBJECTIVE</label><select className="select" value={campaignObjective} onChange={e => setCampaignObjective(e.target.value)}><option>Brand awareness and sales</option><option>Local Houston sales</option><option>New product launch</option><option>Seasonal promotion</option><option>Website traffic</option></select></div><div className="field"><label>TARGET AREA</label><input className="input" value={campaignTargetArea} onChange={e => setCampaignTargetArea(e.target.value)} placeholder="Houston, Texas + United States"/></div></div>
      </div>
      <div className="cf-sec"><h3 className="cf-h">Channels</h3><div className="cf-chips">{socialChannels.map(channel => { const name=channel.social!; const connected=Boolean(social.channels?.[name]); const selected=selectedSocial.includes(name); return <label className={`check cf-chip ${selected ? "selected" : ""} ${connected ? "" : "cf-off"}`} key={name}><input type="checkbox" checked={selected} disabled={!connected} onChange={() => toggleChannel(name)}/><span className="cf-chip-tx"><b>{channel.name}</b><small>{connected ? "Connected" : "Not connected"}</small></span>{selected && <span className="cf-ck">✓</span>}</label>; })}<label className={`check cf-chip ${campaignSendEmail ? "selected" : ""}`}><input type="checkbox" checked={campaignSendEmail} onChange={e => setCampaignSendEmail(e.target.checked)}/><span className="cf-chip-tx"><b>Email</b><small>Subscribers</small></span>{campaignSendEmail && <span className="cf-ck">✓</span>}</label></div></div>
      <div className="cf-sec"><h3 className="cf-h">Autopilot</h3>
        <label className={`cf-auto ${campaignAutopilot ? "on" : ""}`}><input type="checkbox" checked={campaignAutopilot} onChange={e => setCampaignAutopilot(e.target.checked)}/><span><b>🤖 Autopilot robot</b><small>Analyzes and publishes every 12 hours across the connected channels.</small></span></label>
        {campaignAutopilot && <div className="cf-3col"><div className="field cf-wide"><label>AUTOPILOT SCHEDULE</label><select className="select" value={campaignRecurrenceHours} onChange={e => setCampaignRecurrenceHours(e.target.value)}><option value="12">Every 12 hours (twice daily)</option></select></div><div className="field"><label>START (OPTIONAL)</label><input className="input" type="datetime-local" value={campaignStartsAt} onChange={e => setCampaignStartsAt(e.target.value)}/></div><div className="field"><label>END (OPTIONAL)</label><input className="input" type="datetime-local" value={campaignEndsAt} onChange={e => setCampaignEndsAt(e.target.value)}/></div></div>}
      </div>
      <div className="cf-sec"><h3 className="cf-h">Content</h3>
        <div className="field"><label>CAMPAIGN MESSAGE</label><textarea className="textarea cf-msg" value={campaignMessage} onChange={e => setCampaignMessage(e.target.value)} placeholder="Mensaje central de la campaña..."/></div>
        {campaignSendEmail && <div className="field"><label>EMAIL SUBJECT</label><input className="input" value={campaignSubject} onChange={e => setCampaignSubject(e.target.value)} placeholder="JQYDesigns — New collection"/></div>}
        <div className="field"><label>CREATIVE</label><div className="cf-tabs"><button type="button" className={creativeTab === "image" ? "on" : ""} onClick={() => setCreativeTab("image")}>Image</button><button type="button" className={creativeTab === "video" ? "on" : ""} onClick={() => setCreativeTab("video")}>Video</button></div>
        {creativeTab === "image" && <div className="cf-drop"><div className="cf-drop-row">{campaignImagePreview ? <img className="cf-thumb" src={campaignImagePreview} alt="Campaign creative"/> : <div className="cf-thumb cf-thumb-ph">🖼️</div>}<div className="cf-drop-tx"><small style={{color:"#5A6472"}}>{campaignMediaUploading ? "Uploading the selected creative to secure public media storage..." : campaignImageUrl ? "✓ Creative is hosted and ready for connected platforms to fetch." : "Select the image you want to publish. Marketing will upload it automatically and generate the public URL."}</small></div></div><input className="input cf-file" type="file" accept="image/*" disabled={campaignMediaUploading} onChange={async e => { const file=e.target.files?.[0]; if(!file) return; setCampaignMediaName(file.name); setCampaignImagePreview(URL.createObjectURL(file)); setCampaignVideoPreview(""); setCampaignMediaUploading(true); setNotice(""); try { const signed=await apiRequest<{cloudName:string;apiKey:string;timestamp:number;folder:string;signature:string}>("/api/admin/marketing/social/campaign/media/signature",{method:"POST",body:JSON.stringify({}),timeoutMs:30000}); if(!signed.cloudName || !signed.apiKey || !signed.timestamp || !signed.folder || !signed.signature) throw new Error("The image storage service did not return a valid upload signature."); const formData=new FormData(); formData.append("file",file); formData.append("api_key",signed.apiKey); formData.append("timestamp",String(signed.timestamp)); formData.append("folder",signed.folder); formData.append("signature",signed.signature); const response=await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(signed.cloudName)}/image/upload`,{method:"POST",body:formData}); const uploaded=await response.json().catch(()=>({})); if(!response.ok) throw new Error(typeof uploaded?.error?.message==="string" ? `Image upload failed: ${uploaded.error.message}` : `Image upload failed (HTTP ${response.status}).`); const publicUrl=typeof uploaded?.secure_url==="string" ? uploaded.secure_url.trim() : ""; if(!publicUrl || !/^https:\/\//i.test(publicUrl)) throw new Error("Cloudinary finished without returning a valid public image URL."); setCampaignImageUrl(publicUrl); setNotice("Image uploaded successfully. Public URL is ready for Pinterest."); } catch(error) { setCampaignImageUrl(""); setNotice(error instanceof Error ? error.message : "Could not upload the Marketing creative."); } finally { setCampaignMediaUploading(false); } }} /></div>}
        {creativeTab === "video" && <><div className="cf-drop"><div className="cf-drop-row">{campaignVideoPreview ? <video className="cf-thumb" src={campaignVideoPreview} muted playsInline/> : <div className="cf-thumb cf-thumb-ph">🎬</div>}<div className="cf-drop-tx"><small style={{color:"#5A6472"}}>{campaignMediaUploading ? "Uploading video directly to secure media storage..." : campaignVideoUrl ? "✓ Video is hosted and ready for YouTube." : "Select a video and Marketing will upload it automatically and generate the public URL."}</small></div></div><input className="input cf-file" type="file" accept="video/*" disabled={campaignMediaUploading} onChange={async e => { const file=e.target.files?.[0]; if(!file) return; if(file.size > 100 * 1024 * 1024) { setNotice("Marketing video cannot exceed 100 MB."); return; } setCampaignMediaName(file.name); const localPreview=URL.createObjectURL(file); setCampaignVideoPreview(localPreview); setCampaignImagePreview(""); setCampaignMediaUploading(true); setNotice(""); try { const signed=await apiRequest<{cloudName:string;apiKey:string;timestamp:number;folder:string;signature:string}>("/api/admin/marketing/social/campaign/media/signature"); const formData=new FormData(); formData.append("file", file); formData.append("api_key", signed.apiKey); formData.append("timestamp", String(signed.timestamp)); formData.append("folder", signed.folder); formData.append("signature", signed.signature); const upload=await fetch("https://api.cloudinary.com/v1_1/"+encodeURIComponent(signed.cloudName)+"/video/upload",{method:"POST",body:formData}); const data=await upload.json().catch(() => ({})); if(!upload.ok || !data.secure_url) throw new Error(data?.error?.message || "Cloudinary video upload failed."); setCampaignVideoUrl(String(data.secure_url)); setCampaignVideoPreview(String(data.secure_url)); setNotice("✓ Video uploaded to Cloudinary. Public URL generated automatically and ready for YouTube."); } catch(error) { setCampaignVideoUrl(""); setNotice(error instanceof Error ? error.message : "Could not upload the Marketing video."); } finally { URL.revokeObjectURL(localPreview); setCampaignMediaUploading(false); } }} /></div><div className="field" style={{marginTop:10}}><label>YOUTUBE PRIVACY</label><select className="select" value={youtubePrivacy} onChange={e => setYoutubePrivacy(e.target.value as "public"|"unlisted"|"private")}><option value="public">Public</option><option value="unlisted">Unlisted</option><option value="private">Private</option></select></div></>}
        {campaignMediaName && <div style={{marginTop:7}}><span className="status connected">{campaignMediaName}</span></div>}
        </div>
      </div>
      <div className="cf-sec"><h3 className="cf-h">Destination</h3><div className="cf-2col cf-stack"><div className="field"><label>LANDING LINK</label><input className="input" value={campaignLink} onChange={e => setCampaignLink(e.target.value)}/></div><div className="field"><label>WHATSAPP RECIPIENT (OPTIONAL)</label><input className="input" value={campaignWhatsappTo} onChange={e => setCampaignWhatsappTo(e.target.value)} placeholder="+1..."/></div></div></div>
      {campaignPreviewOpen && <div className="modal-bg" onClick={() => setCampaignPreviewOpen(false)}><div className="modal" style={{maxWidth:760}} onClick={event => event.stopPropagation()}><div className="modal-head"><h2>👀 Campaign Preview</h2><button className="close" onClick={() => setCampaignPreviewOpen(false)}><X size={18}/></button></div><p>This is the visual check before sending. The real platform may adjust its final crop/layout.</p><div className="card" style={{padding:16, background:"#FFFFFF"}}><div style={{fontWeight:800,fontSize:18,marginBottom:8}}>{campaignName || "JQYDesigns Campaign"}</div><div style={{color:"#5A6472",whiteSpace:"pre-wrap",marginBottom:12}}>{campaignMessage || "Campaign message preview..."}</div>{campaignImagePreview ? <img src={campaignImagePreview} alt="Campaign preview" style={{display:"block",width:"100%",maxHeight:420,objectFit:"contain",borderRadius:12,background:"#EDF0F4"}}/> : campaignVideoPreview ? <video src={campaignVideoPreview} controls playsInline style={{display:"block",width:"100%",maxHeight:420,borderRadius:12,background:"#EDF0F4"}}/> : <div className="notice">No local creative selected. Add an image/video or a public media URL to preview the creative.</div>}<div style={{marginTop:12,wordBreak:"break-word"}}><b>Landing:</b> {campaignLink || "—"}</div><div style={{marginTop:6}}><b>Channels:</b> {selectedSocial.length ? selectedSocial.join(" · ") : "None selected"}</div></div><div className="actions"><button className="btn" onClick={() => setCampaignPreviewOpen(false)}>Back to campaign</button><button className="btn primary" onClick={() => setCampaignPreviewOpen(false)}><CheckCircle2 size={14}/> Looks good</button></div></div></div>}
      
{campaignResults && <div className="notice"><b>Campaign ID:</b> {campaignResults.campaignId}<br/><b>Social results:</b> {Object.entries(campaignResults.social || {}).map(([channel,result]:any) => <span key={channel} style={{display:"block"}}>{channel}: {result?.ok ? "Published" : result?.error || "Failed"}</span>)}{campaignResults.email && <span style={{display:"block"}}>Email: {campaignResults.email.totalRecipients} recipients</span>}<span style={{display:"block"}}>Google: tracking/SEO focus prepared</span></div>}
      <div className="actions cf-actions"><button className="btn" type="button" onClick={() => setCampaignPreviewOpen(true)}><Image size={14}/>Preview campaign</button><button className="btn" onClick={() => setModal(null)}>Close</button><button className="btn primary" onClick={() => void launchCampaign()} disabled={campaignLaunching || campaignMediaUploading}>{campaignLaunching ? <Loader2 size={15}/> : <Sparkles size={15}/>} {campaignLaunching ? "Launching..." : campaignAutopilot ? "Queue for Autopilot" : "Launch Campaign Everywhere"}</button></div></>}
      {modal === "email" && <><p>Envía una promoción real a los suscriptores activos desde JQYDesigns.</p><div className="notice">Active subscribers: {subscriberCounts?.active ?? "—"} · EN: {subscriberCounts?.active_en ?? "—"} · ES: {subscriberCounts?.active_es ?? "—"}</div><div className="field"><label>SUBJECT</label><input className="input" value={emailSubject} onChange={e => setEmailSubject(e.target.value)} placeholder="Summer promotion — 20% off"/></div><div className="field"><label>MESSAGE</label><textarea className="textarea" value={emailMessage} onChange={e => setEmailMessage(e.target.value)} placeholder="Write your promotion message..."/></div><div className="field"><label>IMAGE URL (OPTIONAL)</label><input className="input" value={emailImageUrl} onChange={e => setEmailImageUrl(e.target.value)} placeholder="https://..."/></div><div className="actions"><button className="btn" onClick={() => setModal(null)}>Close</button><button className="btn primary" onClick={() => void sendEmailCampaign()} disabled={emailSending}>{emailSending ? <Loader2 size={15}/> : <Send size={15}/>} {emailSending ? "Sending..." : "Send Promotion"}</button></div></>}
      {modal === "composer" && <><p>Una campaña puede enviarse a todos los canales conectados. Cada plataforma devuelve su propio resultado.</p><div className="composer-grid"><div><div className="field"><label>CHANNELS</label></div><div className="checks">{socialChannels.map(channel => { const name = channel.social!; const selected = selectedSocial.includes(name); const connected = Boolean(social.channels?.[name]); return <label className={`check ${selected ? "selected" : ""}`} key={name}><input type="checkbox" checked={selected} disabled={!connected} onChange={() => toggleChannel(name)}/><span>{channel.name}{connected ? " · Connected" : " · Not connected"}</span></label>; })}</div></div><div><div className="field"><label>MESSAGE</label><textarea className="textarea" value={publishText} onChange={event => setPublishText(event.target.value)} placeholder="Escribe el mensaje de la campaña..."/></div><div className="field"><label>IMAGE URL · Instagram/Pinterest</label><input className="input" value={imageUrl} onChange={event => setImageUrl(event.target.value)} placeholder="https://..."/></div><div className="field"><label>YOUTUBE PRIVACY</label><select className="select" value={youtubePrivacy} onChange={event => setYoutubePrivacy(event.target.value as "public"|"unlisted"|"private")}><option value="public">Public</option><option value="unlisted">Unlisted</option><option value="private">Private</option></select></div><div className="field"><label>VIDEO URL · YouTube</label><input className="input" value={videoUrl} onChange={event => setVideoUrl(event.target.value)} placeholder="https://.../video.mp4" /></div><div className="field"><label>LINK</label><input className="input" value={link} onChange={event => setLink(event.target.value)} /></div><div className="field"><label>WHATSAPP RECIPIENT</label><input className="input" value={whatsappTo} onChange={event => setWhatsappTo(event.target.value)} placeholder="+1..."/></div></div></div>{Object.entries(publishResults).map(([channel, result]) => <div className={`result ${result.ok ? "ok" : "fail"}`} key={channel}><b>{channel}</b>: {result.status === "PROCESSING" ? "Processing — provider confirmation pending" : result.ok ? `Published${result.account ? ` · ${result.account}` : ""}` : result.error || "Failed"}{result.message ? <div>{result.message}</div> : null}{result.url ? <a href={result.url} target="_blank" rel="noreferrer" style={{display:"block",marginTop:5,color:"#1D4ED8"}}>Open publication ↗</a> : null}</div>)}<div className="actions"><button className="btn" onClick={() => setModal(null)}>Close</button><button className="btn primary" onClick={() => void publish()} disabled={publishing || !selectedSocial.length}>{publishing ? <Loader2 size={15}/> : <Send size={15}/>} {publishing ? "Publishing..." : "Publish to selected"}</button></div></>}</div></div>}
      {campaignPreviewCampaign && <div className="modal-bg" onClick={() => setCampaignPreviewCampaign(null)}><div className="modal" style={{maxWidth:760}} onClick={event => event.stopPropagation()}><div className="modal-head"><h2>👀 Campaign Preview</h2><button className="close" onClick={() => setCampaignPreviewCampaign(null)}><X size={18}/></button></div><p>Stored campaign creative and content. This is the record saved by Marketing Brain; the provider may apply its own crop or layout.</p><div className="card" style={{padding:16, background:"#FFFFFF"}}><div style={{fontWeight:800,fontSize:18,marginBottom:8}}>{campaignPreviewCampaign.name}</div>{campaignPreviewCampaign.subject && <div style={{color:"#111827",fontWeight:700,marginBottom:8}}>{campaignPreviewCampaign.subject}</div>}<div style={{color:"#5A6472",whiteSpace:"pre-wrap",marginBottom:12}}>{campaignPreviewCampaign.message || "No message stored for this campaign."}</div>{campaignPreviewCampaign.results?.assets?.imageUrl ? <img src={campaignPreviewCampaign.results.assets.imageUrl} alt="Campaign creative" style={{display:"block",width:"100%",maxHeight:420,objectFit:"contain",borderRadius:12,background:"#EDF0F4"}}/> : campaignPreviewCampaign.results?.assets?.videoUrl ? <video src={campaignPreviewCampaign.results.assets.videoUrl} controls playsInline style={{display:"block",width:"100%",maxHeight:420,borderRadius:12,background:"#EDF0F4"}}/> : <div className="notice">No stored creative URL is available.</div>}<div style={{marginTop:12,wordBreak:"break-word"}}><b>Landing:</b> {campaignPreviewCampaign.results?.assets?.landingLink || "—"}</div><div style={{marginTop:6}}><b>Channels:</b> {campaignPreviewCampaign.channels?.length ? campaignPreviewCampaign.channels.join(" · ") : "None configured"}</div><div style={{marginTop:6}}><b>Status:</b> {publicationActivity.filter(item => item.campaign_id === campaignPreviewCampaign.id).map(item => `${item.channel}: ${item.status || (item.published ? "PUBLISHED" : "FAILED")}`).join(" · ") || "Not published yet"}</div></div><div className="actions">{!publicationActivity.some(item => item.campaign_id === campaignPreviewCampaign.id && (item.published || item.status === "PROCESSING")) && <button className="btn primary" type="button" onClick={() => void retryCampaign(campaignPreviewCampaign)} disabled={retryingCampaignId === campaignPreviewCampaign.id}>{retryingCampaignId === campaignPreviewCampaign.id ? <Loader2 size={14}/> : <Send size={14}/>} {retryingCampaignId === campaignPreviewCampaign.id ? "Publishing…" : "Publish Now"}</button>}<button className="btn" onClick={() => setCampaignPreviewCampaign(null)}><CheckCircle2 size={14}/> Close Preview</button></div></div></div>}
    </div>;
}

export default AdminMarketing;
