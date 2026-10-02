import crypto from "node:crypto";

const DEFAULT_SITE_URL = "https://jqydesigns.com/";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const SEARCH_CONSOLE_API = "https://www.googleapis.com/webmasters/v3";
const ANALYTICS_API = "https://analyticsdata.googleapis.com/v1beta";

interface ServiceAccountCredentials { client_email: string; private_key: string; }
interface SearchAnalyticsRow { keys?: string[]; clicks?: number; impressions?: number; ctr?: number; position?: number; }

function parseServiceAccountJson(raw: string): Partial<ServiceAccountCredentials> {
    const normalized = raw.replace(/^\\uFEFF/, "").trim();

    const parseObject = (value: string): unknown => {
        const parsed = JSON.parse(value);
        if (typeof parsed === "string") return JSON.parse(parsed);
        return parsed;
    };

    try {
        return (parseObject(normalized) || {}) as Partial<ServiceAccountCredentials>;
    } catch {
        if (normalized.startsWith("{\\\"") && normalized.includes("\\\":")) {
            return (parseObject(normalized.replace(/\\\\"/g, '"')) || {}) as Partial<ServiceAccountCredentials>;
        }
        if (normalized.length >= 2 && normalized.startsWith("'") && normalized.endsWith("'")) {
            return (parseObject(normalized.slice(1, -1)) || {}) as Partial<ServiceAccountCredentials>;
        }
        throw new Error("invalid-json");
    }
}

function getCredentialsResult(): { credentials: ServiceAccountCredentials | null; error?: string } {
    const raw = process.env.GOOGLE_SEARCH_CONSOLE_SERVICE_ACCOUNT_JSON?.trim();
    if (!raw) return { credentials: null, error: "GOOGLE_SEARCH_CONSOLE_SERVICE_ACCOUNT_JSON is missing from the running API environment." };
    try {
        const parsed = parseServiceAccountJson(raw);
        if (!parsed.client_email || !parsed.private_key) {
            return { credentials: null, error: "GOOGLE_SEARCH_CONSOLE_SERVICE_ACCOUNT_JSON is valid JSON but missing client_email or private_key." };
        }
        if (!parsed.client_email.endsWith(".iam.gserviceaccount.com")) {
            return { credentials: null, error: "GOOGLE_SEARCH_CONSOLE_SERVICE_ACCOUNT_JSON has an invalid Google service-account client_email." };
        }
        if (!parsed.private_key.includes("BEGIN PRIVATE KEY") || !parsed.private_key.includes("END PRIVATE KEY")) {
            return { credentials: null, error: "GOOGLE_SEARCH_CONSOLE_SERVICE_ACCOUNT_JSON has an invalid private_key PEM block." };
        }
        return { credentials: { client_email: parsed.client_email, private_key: parsed.private_key.replace(/\\n/g, "\n") } };
    } catch {
        const preview = raw.slice(0, 16).replace(/[^a-zA-Z0-9_{}"'.:-]/g, "?");
        let shape = "unknown";
        if (raw.startsWith("sk_live_") || raw.startsWith("sk_test_")) shape = "Stripe secret key";
        else if (raw.startsWith("{")) shape = "object-like value";
        else if (raw.startsWith('"')) shape = "quoted string";
        else if (raw.startsWith("type=")) shape = "dotenv-style assignment";
        else if (raw.includes("\\n") && raw.includes("private_key")) shape = "escaped JSON-like value";
        return {
            credentials: null,
            error: `GOOGLE_SEARCH_CONSOLE_SERVICE_ACCOUNT_JSON is not valid JSON (received ${shape}; starts with "${preview}"). Paste the complete downloaded Google service-account JSON as the secret value.`,
        };
    }
}

function getCredentials(): ServiceAccountCredentials | null {
    return getCredentialsResult().credentials;
}

function getSiteUrl() { return (process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL || DEFAULT_SITE_URL).trim().replace(/\/$/, "/"); }
function getAnalyticsPropertyId() { return process.env.GOOGLE_ANALYTICS_PROPERTY_ID?.trim() || null; }
function base64Url(value: string | Buffer) { return Buffer.from(value).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, ""); }

async function getAccessToken(credentials: ServiceAccountCredentials, scope: string): Promise<string> {
    const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
    const now = Math.floor(Date.now() / 1000);
    const payload = base64Url(JSON.stringify({ iss: credentials.client_email, scope, aud: GOOGLE_TOKEN_URL, iat: now, exp: now + 3600 }));
    const unsigned = `${header}.${payload}`;
    const signature = crypto.createSign("RSA-SHA256").update(unsigned).sign(credentials.private_key);
    const response = await fetch(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${unsigned}.${base64Url(signature)}` }),
    });
    if (!response.ok) throw new Error(`Google token request failed (${response.status})`);
    const data = await response.json() as { access_token?: string };
    if (!data.access_token) throw new Error("Google did not return an access token");
    return data.access_token;
}

async function googleRequest<T>(base: string, path: string, scope: string, options: RequestInit = {}): Promise<T> {
    const credentials = getCredentials();
    if (!credentials) {
        const diagnostic = getCredentialsResult().error || "Google credentials are unavailable.";
        throw new Error(`Google integration is not configured: ${diagnostic}`);
    }
    const token = await getAccessToken(credentials, scope);
    const response = await fetch(`${base}${path}`, { ...options, headers: { authorization: `Bearer ${token}`, "content-type": "application/json", ...(options.headers || {}) } });
    if (!response.ok) { const text = await response.text(); throw new Error(`Google API failed (${response.status}): ${text.slice(0, 300)}`); }
    return await response.json() as T;
}

export function getSearchConsoleStatus() {
    const configured = Boolean(getCredentials());
    return { configured, siteUrl: getSiteUrl(), provider: "Google Search Console", message: configured ? "Credentials are configured." : (getCredentialsResult().error || "Google credentials are unavailable.") };
}

export async function verifySearchConsoleAccess() {
    const siteUrl = getSiteUrl();
    const data = await googleRequest<{ siteEntry?: Array<{ siteUrl?: string; permissionLevel?: string }> }>(SEARCH_CONSOLE_API, "/sites", "https://www.googleapis.com/auth/webmasters.readonly");
    const site = (data.siteEntry || []).find(item => item.siteUrl === siteUrl);
    return { connected: Boolean(site), siteUrl, permissionLevel: site?.permissionLevel || null, availableProperties: (data.siteEntry || []).map(item => item.siteUrl).filter(Boolean) };
}

export async function getSearchAnalytics(days = 28) {
    const safeDays = Math.min(Math.max(Math.floor(days), 1), 90);
    const end = new Date(); end.setUTCDate(end.getUTCDate() - 2);
    const start = new Date(end); start.setUTCDate(start.getUTCDate() - safeDays + 1);
    const iso = (date: Date) => date.toISOString().slice(0, 10);
    const data = await googleRequest<{ rows?: SearchAnalyticsRow[] }>(SEARCH_CONSOLE_API, `/sites/${encodeURIComponent(getSiteUrl())}/searchAnalytics/query`, "https://www.googleapis.com/auth/webmasters.readonly", { method: "POST", body: JSON.stringify({ startDate: iso(start), endDate: iso(end), dimensions: ["date"], rowLimit: safeDays, dataState: "final" }) });
    return { siteUrl: getSiteUrl(), startDate: iso(start), endDate: iso(end), rows: data.rows || [] };
}

export function getAnalyticsStatus() {
    const configured = Boolean(getCredentials() && getAnalyticsPropertyId());
    return { configured, propertyId: getAnalyticsPropertyId(), provider: "Google Analytics 4", message: configured ? "Credentials and property ID are configured." : (getCredentialsResult().error || (!getAnalyticsPropertyId() ? "GOOGLE_ANALYTICS_PROPERTY_ID is missing from the running API environment." : "Google credentials are unavailable.")) };
}

export async function getAnalyticsReport(days = 28) {
    const propertyId = getAnalyticsPropertyId();
    if (!propertyId) throw new Error("GOOGLE_ANALYTICS_PROPERTY_ID is not configured");
    const safeDays = Math.min(Math.max(Math.floor(days), 1), 90);
    const data = await googleRequest<{ rows?: Array<{ dimensionValues?: Array<{ value?: string }>; metricValues?: Array<{ value?: string }> }>; metricHeaders?: Array<{ name?: string }> }>(ANALYTICS_API, `/properties/${encodeURIComponent(propertyId)}:runReport`, "https://www.googleapis.com/auth/analytics.readonly", { method: "POST", body: JSON.stringify({ dateRanges: [{ startDate: `${safeDays}daysAgo`, endDate: "yesterday" }], dimensions: [{ name: "date" }], metrics: [{ name: "activeUsers" }, { name: "sessions" }, { name: "screenPageViews" }, { name: "totalRevenue" }], limit: String(safeDays) }) });
    return { propertyId, days: safeDays, rows: data.rows || [] };
}

export async function getAnalyticsCampaignReport(days = 30) {
    const propertyId = getAnalyticsPropertyId();
    if (!propertyId || !getCredentials()) return { propertyId, days: Math.min(Math.max(Math.floor(days), 1), 90), rows: [] };
    const safeDays = Math.min(Math.max(Math.floor(days), 1), 90);
    const data = await googleRequest<{
        rows?: Array<{
            dimensionValues?: Array<{ value?: string }>;
            metricValues?: Array<{ value?: string }>;
        }>;
    }>(
        ANALYTICS_API,
        `/properties/${encodeURIComponent(propertyId)}:runReport`,
        "https://www.googleapis.com/auth/analytics.readonly",
        {
            method: "POST",
            body: JSON.stringify({
                dateRanges: [{ startDate: `${safeDays}daysAgo`, endDate: "yesterday" }],
                dimensions: [
                    { name: "sessionManualCampaignId" },
                    { name: "sessionManualSource" },
                    { name: "sessionManualMedium" },
                ],
                metrics: [
                    { name: "sessions" },
                    { name: "activeUsers" },
                    { name: "conversions" },
                    { name: "totalRevenue" },
                    { name: "transactions" },
                ],
                limit: "1000",
            }),
        },
    );
    return { propertyId, days: safeDays, rows: data.rows || [] };
}
