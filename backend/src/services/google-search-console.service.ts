import crypto from "node:crypto";

const DEFAULT_SITE_URL = "https://jqydesigns.com/";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const SEARCH_CONSOLE_API = "https://www.googleapis.com/webmasters/v3";

interface ServiceAccountCredentials {
    client_email: string;
    private_key: string;
}

interface SearchAnalyticsRow {
    keys?: string[];
    clicks?: number;
    impressions?: number;
    ctr?: number;
    position?: number;
}

function getCredentials(): ServiceAccountCredentials | null {
    const raw = process.env.GOOGLE_SEARCH_CONSOLE_SERVICE_ACCOUNT_JSON?.trim();
    if (!raw) return null;

    try {
        const parsed = JSON.parse(raw) as Partial<ServiceAccountCredentials>;
        if (!parsed.client_email || !parsed.private_key) return null;
        return { client_email: parsed.client_email, private_key: parsed.private_key.replace(/\\n/g, "\n") };
    } catch {
        return null;
    }
}

function getSiteUrl(): string {
    return (process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL || DEFAULT_SITE_URL).trim().replace(/\/$/, "/");
}

function base64Url(value: string | Buffer): string {
    return Buffer.from(value).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function getAccessToken(credentials: ServiceAccountCredentials): Promise<string> {
    const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
    const now = Math.floor(Date.now() / 1000);
    const payload = base64Url(JSON.stringify({
        iss: credentials.client_email,
        scope: "https://www.googleapis.com/auth/webmasters.readonly",
        aud: GOOGLE_TOKEN_URL,
        iat: now,
        exp: now + 3600,
    }));
    const unsigned = `${header}.${payload}`;
    const signature = crypto.createSign("RSA-SHA256").update(unsigned).sign(credentials.private_key);
    const assertion = `${unsigned}.${base64Url(signature)}`;

    const response = await fetch(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
    });

    if (!response.ok) {
        throw new Error(`Google token request failed (${response.status})`);
    }

    const data = await response.json() as { access_token?: string };
    if (!data.access_token) throw new Error("Google did not return an access token");
    return data.access_token;
}

async function googleRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
    const credentials = getCredentials();
    if (!credentials) throw new Error("Google Search Console is not configured");

    const token = await getAccessToken(credentials);
    const response = await fetch(`${SEARCH_CONSOLE_API}${path}`, {
        ...options,
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json", ...(options.headers || {}) },
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Search Console API failed (${response.status}): ${text.slice(0, 300)}`);
    }

    return await response.json() as T;
}

export function getSearchConsoleStatus() {
    const configured = Boolean(getCredentials());
    return {
        configured,
        siteUrl: getSiteUrl(),
        provider: "Google Search Console",
        message: configured
            ? "Credentials are configured."
            : "Add GOOGLE_SEARCH_CONSOLE_SERVICE_ACCOUNT_JSON to connect Search Console.",
    };
}

export async function verifySearchConsoleAccess() {
    const siteUrl = getSiteUrl();
    const data = await googleRequest<{ siteEntry?: Array<{ siteUrl?: string; permissionLevel?: string }> }>("/sites");
    const site = (data.siteEntry || []).find(item => item.siteUrl === siteUrl);

    return {
        connected: Boolean(site),
        siteUrl,
        permissionLevel: site?.permissionLevel || null,
        availableProperties: (data.siteEntry || []).map(item => item.siteUrl).filter(Boolean),
    };
}

export async function getSearchAnalytics(days = 28) {
    const safeDays = Math.min(Math.max(Math.floor(days), 1), 90);
    const end = new Date();
    end.setUTCDate(end.getUTCDate() - 2);
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - safeDays + 1);
    const iso = (date: Date) => date.toISOString().slice(0, 10);

    const data = await googleRequest<{ rows?: SearchAnalyticsRow[] }>(`/sites/${encodeURIComponent(getSiteUrl())}/searchAnalytics/query`, {
        method: "POST",
        body: JSON.stringify({
            startDate: iso(start),
            endDate: iso(end),
            dimensions: ["date"],
            rowLimit: safeDays,
            dataState: "final",
        }),
    });

    return {
        siteUrl: getSiteUrl(),
        startDate: iso(start),
        endDate: iso(end),
        rows: data.rows || [],
    };
}
