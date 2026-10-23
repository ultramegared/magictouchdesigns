import crypto from "crypto";
import jwt from "jsonwebtoken";
import { pool } from "../config/database";

export type SocialProvider = "meta" | "whatsapp" | "instagram" | "tiktok" | "youtube" | "pinterest";
export type SocialChannel = "facebook" | "instagram" | "whatsapp" | "tiktok" | "youtube" | "pinterest";
interface ConnectionRow { provider: SocialProvider; profile: Record<string, unknown>; expires_at: string | null; created_at: string; updated_at: string; }
const META_VERSION = process.env.META_GRAPH_API_VERSION || "v26.0";
const FRONTEND_URL = process.env.FRONTEND_PUBLIC_URL || "https://jqydesigns.com";
const BACKEND_URL = process.env.BACKEND_PUBLIC_URL || "https://api.jqydesigns.com";
const providerConfig = (provider: SocialProvider) => {
    if (provider === "meta" || provider === "whatsapp") return { configured: Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET && (provider !== "whatsapp" || process.env.META_WHATSAPP_LOGIN_CONFIG_ID)), clientId: process.env.META_APP_ID, clientSecret: process.env.META_APP_SECRET, authorize: `https://www.facebook.com/${META_VERSION}/dialog/oauth`, token: `https://graph.facebook.com/${META_VERSION}/oauth/access_token`, scopes: ["pages_show_list", "pages_read_engagement", "pages_manage_posts", "instagram_basic", "instagram_content_publish", "instagram_manage_insights", "whatsapp_business_management", "whatsapp_business_messaging"], envKeys: provider === "whatsapp" ? ["META_APP_ID", "META_APP_SECRET", "META_WHATSAPP_LOGIN_CONFIG_ID"] : ["META_APP_ID", "META_APP_SECRET"] };
    if (provider === "instagram") return { configured: Boolean(process.env.INSTAGRAM_ACCESS_TOKEN?.trim()), clientId: undefined, clientSecret: undefined, authorize: "https://www.instagram.com/oauth/authorize", token: "https://graph.instagram.com", scopes: ["instagram_business_basic", "instagram_business_content_publish", "instagram_business_manage_insights"], envKeys: ["INSTAGRAM_ACCESS_TOKEN"] };
    if (provider === "tiktok") return { configured: Boolean(process.env.TIKTOK_CLIENT_KEY && process.env.TIKTOK_CLIENT_SECRET), clientId: process.env.TIKTOK_CLIENT_KEY, clientSecret: process.env.TIKTOK_CLIENT_SECRET, authorize: "https://www.tiktok.com/v2/auth/authorize/", token: "https://open.tiktokapis.com/v2/oauth/token/", scopes: ["user.info.basic", "video.publish", "video.upload"], envKeys: ["TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET"] };
    if (provider === "youtube") return { configured: Boolean(process.env.GOOGLE_OAUTH_CLIENT_ID && process.env.GOOGLE_OAUTH_CLIENT_SECRET), clientId: process.env.GOOGLE_OAUTH_CLIENT_ID, clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET, authorize: "https://accounts.google.com/o/oauth2/v2/auth", token: "https://oauth2.googleapis.com/token", scopes: ["openid", "profile", "https://www.googleapis.com/auth/youtube.upload", "https://www.googleapis.com/auth/youtube.readonly"], envKeys: ["GOOGLE_OAUTH_CLIENT_ID", "GOOGLE_OAUTH_CLIENT_SECRET"] };
    return { configured: Boolean(process.env.PINTEREST_APP_ID && process.env.PINTEREST_APP_SECRET), clientId: process.env.PINTEREST_APP_ID, clientSecret: process.env.PINTEREST_APP_SECRET, authorize: "https://www.pinterest.com/oauth/", token: "https://api.pinterest.com/v5/oauth/token", scopes: ["user_accounts:read", "boards:read", "boards:write", "pins:read", "pins:write"], envKeys: ["PINTEREST_APP_ID", "PINTEREST_APP_SECRET"] };
};
const redirectUri = (provider: SocialProvider) => `${BACKEND_URL}/api/admin/marketing/social/${provider === "whatsapp" ? "meta" : provider}/callback`;
const stateSecret = () => {
    const secret = process.env.JWT_SECRET?.trim();
    if (!secret) throw new Error("JWT_SECRET is required for Marketing social OAuth.");
    return secret;
};
const tokenKey = () => crypto.createHash("sha256").update(process.env.SOCIAL_TOKEN_ENCRYPTION_KEY || stateSecret()).digest();
function encrypt(value: unknown) { const iv = crypto.randomBytes(12); const cipher = crypto.createCipheriv("aes-256-gcm", tokenKey(), iv); const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]); return `${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${encrypted.toString("base64url")}`; }
function decrypt(value: string): any { const [ivRaw, tagRaw, dataRaw] = value.split("."); const decipher = crypto.createDecipheriv("aes-256-gcm", tokenKey(), Buffer.from(ivRaw, "base64url")); decipher.setAuthTag(Buffer.from(tagRaw, "base64url")); return JSON.parse(Buffer.concat([decipher.update(Buffer.from(dataRaw, "base64url")), decipher.final()]).toString("utf8")); }
export async function ensureSocialConnectionsTable() {
    await pool.query(`CREATE TABLE IF NOT EXISTS marketing_social_selections (
        id BIGSERIAL PRIMARY KEY, user_id TEXT NOT NULL, provider TEXT NOT NULL, channel TEXT NOT NULL, external_id TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(user_id, provider, channel)
    )`);
    await pool.query(`CREATE TABLE IF NOT EXISTS marketing_social_connections (id BIGSERIAL PRIMARY KEY, user_id TEXT NOT NULL, provider TEXT NOT NULL, access_token TEXT NOT NULL, refresh_token TEXT, expires_at TIMESTAMPTZ, profile JSONB NOT NULL DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(user_id, provider));`); }
async function saveConnection(userId: string, provider: SocialProvider, tokens: Record<string, unknown>, profile: Record<string, unknown>) {
    await ensureSocialConnectionsTable(); const accessToken = String(tokens.access_token || ""); if (!accessToken) throw new Error("The provider did not return an access token."); const expiresIn = Number(tokens.expires_in || 0); const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null;
    const safeProfile = JSON.parse(JSON.stringify(profile, (key, value) => key === "accessToken" ? undefined : value));
    await pool.query(`INSERT INTO marketing_social_connections (user_id,provider,access_token,refresh_token,expires_at,profile) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (user_id,provider) DO UPDATE SET access_token=EXCLUDED.access_token, refresh_token=EXCLUDED.refresh_token, expires_at=EXCLUDED.expires_at, profile=EXCLUDED.profile, updated_at=NOW()`, [userId, provider, encrypt(accessToken), tokens.refresh_token ? encrypt(tokens.refresh_token) : null, expiresAt, JSON.stringify(safeProfile)]);
}
export async function getConnections(userId: string) {
    await ensureSocialConnectionsTable();
    const result = await pool.query<ConnectionRow>(`SELECT provider, profile, expires_at, created_at, updated_at FROM marketing_social_connections WHERE user_id=$1 ORDER BY provider`, [userId]);
    const selectionRows = await pool.query<{ channel:string; external_id:string }>(`SELECT channel, external_id FROM marketing_social_selections WHERE user_id=$1`, [userId]);
    const selections = selectionRows.rows.reduce<Record<string,string>>((out,row) => { out[row.channel] = row.external_id; return out; }, {});
    const providers = ["meta", "whatsapp", "instagram", "tiktok", "youtube", "pinterest"] as SocialProvider[];
    const configured = providers.reduce<Record<string, boolean>>((out, provider) => { out[provider] = providerConfig(provider).configured; return out; }, {});
    const setup = providers.reduce<Record<string, unknown>>((out, provider) => { const config = providerConfig(provider); out[provider] = { configured: config.configured, envKeys: config.envKeys, callback: redirectUri(provider) }; return out; }, {});
    // A stored OAuth row is not proof that the provider is still configured/usable.
    // Only expose a connection when the provider has current production configuration.
    const metaProfile = result.rows.find(row => row.provider === "meta")?.profile || {};
    const whatsappProfile = result.rows.find(row => row.provider === "whatsapp")?.profile || {};
    const whatsappPhones = Array.isArray((whatsappProfile as any).whatsapp) ? (whatsappProfile as any).whatsapp : [];
    // Rows saved from the raw Meta OAuth profile carry the WABA and phone IDs
    // on the phone entries instead of at the top level. Derive them the same
    // way the WhatsApp publisher and verifier already do, so a saved, working
    // connection is not reported as disconnected.
    const whatsappWabaId = String((whatsappProfile as any).wabaId || whatsappPhones[0]?.wabaId || "");
    const whatsappPhoneId = String((whatsappProfile as any).phoneNumberId || whatsappPhones[0]?.phoneNumberId || whatsappPhones[0]?.id || "");
    const whatsappReady = Boolean(whatsappWabaId && /^\d+$/.test(whatsappWabaId) && whatsappPhoneId && /^\d+$/.test(whatsappPhoneId) && whatsappPhones.some((phone: any) => String(phone.phoneNumberId || phone.id || "") === whatsappPhoneId));
    const connected = result.rows.reduce<Record<string, unknown>>((out, row) => {
        if (!providerConfig(row.provider).configured) return out;
        // Legacy Meta OAuth rows sometimes live under "whatsapp" but contain no
        // WhatsApp Business Account or phone-number IDs. Do not report those as connected.
        if (row.provider === "whatsapp" && !whatsappReady) return out;
        out[row.provider] = { connected: true, profile: row.profile, expiresAt: row.expires_at, updatedAt: row.updated_at };
        return out;
    }, {});
    const instagramConnection = result.rows.find(row => row.provider === "instagram");
    let instagramProfile: any = instagramConnection?.profile || {};
    if (!instagramProfile?.id && providerConfig("instagram").configured) {
        try {
            instagramProfile = await providerProfile("instagram", String(process.env.INSTAGRAM_ACCESS_TOKEN));
            await saveConnection(userId, "instagram", { access_token: String(process.env.INSTAGRAM_ACCESS_TOKEN), expires_in: 60 * 24 * 60 * 60 }, instagramProfile);
            connected.instagram = { connected: true, profile: instagramProfile, expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), updatedAt: new Date().toISOString() };
        } catch { }
    }
    return {
        configured, setup, connected, selections,
        channels: {
            facebook: Boolean((metaProfile as any).pages?.length),
            instagram: Boolean(instagramProfile?.id),
            whatsapp: whatsappReady,
            tiktok: Boolean(connected.tiktok), youtube: Boolean(connected.youtube), pinterest: Boolean(connected.pinterest)
        }
    };
}
export async function getWhatsAppDiagnosis(userId: string) {
    await ensureSocialConnectionsTable();
    const result = await pool.query<{ profile: any; updated_at: string }>(`SELECT profile, updated_at FROM marketing_social_connections WHERE user_id=$1 AND provider='whatsapp'`, [userId]);
    const row = result.rows[0];
    if (!row) return { rowExists: false, entries: 0, firstEntryHasWabaId: false, firstEntryHasPhoneId: false, topLevelWabaId: false, topLevelPhoneNumberId: false, signupMethod: "", ready: false, updatedAt: null as string | null };
    const profile: any = row.profile || {};
    const phones = Array.isArray(profile.whatsapp) ? profile.whatsapp : [];
    const first: any = phones[0] || {};
    const wabaId = String(profile.wabaId || first.wabaId || "");
    const phoneId = String(profile.phoneNumberId || first.phoneNumberId || first.id || "");
    const ready = Boolean(/^\d+$/.test(wabaId) && /^\d+$/.test(phoneId) && phones.some((phone: any) => String(phone.phoneNumberId || phone.id || "") === phoneId));
    return {
        rowExists: true,
        entries: phones.length,
        firstEntryHasWabaId: /^\d+$/.test(String(first.wabaId || "")),
        firstEntryHasPhoneId: /^\d+$/.test(String(first.id || "")),
        topLevelWabaId: /^\d+$/.test(String(profile.wabaId || "")),
        topLevelPhoneNumberId: /^\d+$/.test(String(profile.phoneNumberId || "")),
        signupMethod: String(profile.signupMethod || ""),
        ready,
        updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
    };
}
export async function ensureSocialConnectEventsTable() {
    await pool.query(`CREATE TABLE IF NOT EXISTS marketing_social_connect_events (id BIGSERIAL PRIMARY KEY, user_id TEXT NOT NULL, provider TEXT NOT NULL, channel TEXT, outcome TEXT NOT NULL, detail JSONB NOT NULL DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
}
export async function recordSocialConnectEvent(userId: string, provider: string, channel: string | undefined, outcome: string, detail: Record<string, unknown>) {
    try {
        await ensureSocialConnectEventsTable();
        await pool.query(`INSERT INTO marketing_social_connect_events (user_id, provider, channel, outcome, detail) VALUES ($1,$2,$3,$4,$5)`, [userId, provider, channel || null, outcome, JSON.stringify(detail)]);
    } catch { /* Diagnostics must never break the connection flow. */ }
}
export async function listSocialConnectEvents(userId: string, limit = 10) {
    await ensureSocialConnectEventsTable();
    const result = await pool.query(`SELECT provider, channel, outcome, detail, created_at FROM marketing_social_connect_events WHERE user_id=$1 ORDER BY id DESC LIMIT $2`, [userId, limit]);
    return result.rows.map((row: any) => ({ provider: row.provider, channel: row.channel, outcome: row.outcome, detail: row.detail || {}, createdAt: row.created_at ? new Date(row.created_at).toISOString() : null }));
}
export function peekConnectStateChannel(state: string) {
    try { const decoded: any = jwt.decode(state); return typeof decoded?.channel === "string" ? decoded.channel : undefined; } catch { return undefined; }
}
export function getConnectUrl(provider: SocialProvider, userId: string, channel?: SocialChannel) { const config = providerConfig(provider); if (!config.configured || !config.clientId) throw new Error(`${provider} integration is not configured on the server.`); const state = jwt.sign({ userId, provider, channel: channel === "whatsapp" ? "whatsapp" : undefined }, stateSecret(), { expiresIn: "10m" }); const url = new URL(config.authorize); url.searchParams.set("client_id", config.clientId); url.searchParams.set("redirect_uri", redirectUri(provider)); url.searchParams.set("response_type", "code"); url.searchParams.set("state", state); if (provider === "meta") { const loginConfigId = (channel === "whatsapp" ? process.env.META_WHATSAPP_LOGIN_CONFIG_ID : process.env.META_LOGIN_CONFIG_ID)?.trim(); if (channel === "whatsapp" && !loginConfigId) throw new Error("WhatsApp requires META_WHATSAPP_LOGIN_CONFIG_ID: configure a WhatsApp-specific Login for Business configuration in Meta Developers, then add its ID to the backend Production environment."); if (loginConfigId) { url.searchParams.set("config_id", loginConfigId); url.searchParams.set("override_default_response_type", "true"); } else { url.searchParams.set("scope", config.scopes.join(",")); } } else if (provider === "pinterest" || provider === "tiktok") url.searchParams.set("scope", config.scopes.join(",")); else url.searchParams.set("scope", config.scopes.join(" ")); if (provider === "tiktok") { url.searchParams.set("client_key", config.clientId); url.searchParams.delete("client_id"); } if (provider === "youtube") { url.searchParams.set("access_type", "offline"); url.searchParams.set("prompt", "consent"); url.searchParams.set("include_granted_scopes", "true"); } if (provider === "pinterest") url.searchParams.set("continuous_refresh", "true"); return url.toString(); }
async function exchange(provider: SocialProvider, code: string) { const config = providerConfig(provider); const uri = redirectUri(provider); if (provider === "meta" || provider === "whatsapp") { const url = new URL(config.token); url.searchParams.set("client_id", String(config.clientId)); url.searchParams.set("client_secret", String(config.clientSecret)); url.searchParams.set("redirect_uri", uri); url.searchParams.set("code", code); const response = await fetch(url); return response.json(); } const body = new URLSearchParams({ client_id: String(config.clientId), client_secret: String(config.clientSecret), code, redirect_uri: uri, grant_type: "authorization_code" }); if (provider === "tiktok") { body.set("client_key", String(config.clientId)); body.delete("client_id"); } const headers: Record<string,string> = { "Content-Type": "application/x-www-form-urlencoded" }; if (provider === "pinterest") { headers.Authorization = `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64")}`; body.delete("client_id"); body.delete("client_secret"); body.set("continuous_refresh", "true"); } const response = await fetch(config.token, { method: "POST", headers, body }); return response.json(); }
async function metaProfile(accessToken: string) { const base = `https://graph.facebook.com/${META_VERSION}`; const headers = { Authorization: `Bearer ${accessToken}` }; const meResponse = await fetch(`${base}/me?fields=id,name`, { headers }); const me = await meResponse.json(); if (!meResponse.ok) throw new Error(me.error?.message || "Unable to read the Meta account."); const pagesResponse = await fetch(`${base}/me/accounts?fields=id,name,access_token,instagram_business_account{id,username,name,profile_picture_url}`, { headers }); const pagesData = await pagesResponse.json(); const pages = (pagesData.data || []).map((page: any) => ({ id: page.id, name: page.name, accessToken: page.access_token, instagram: page.instagram_business_account || null })); const instagram = pages.filter((page: any) => page.instagram).map((page: any) => ({ ...page.instagram, pageId: page.id, pageName: page.name })); const businessesResponse = await fetch(`${base}/me/businesses?fields=id,name`, { headers }); const businessesData = await businessesResponse.json(); const whatsapp: any[] = []; for (const business of businessesData.data || []) { const wabaResponse = await fetch(`${base}/${business.id}/owned_whatsapp_business_accounts?fields=id,name`, { headers }); const wabaData = await wabaResponse.json(); for (const waba of wabaData.data || []) { const phonesResponse = await fetch(`${base}/${waba.id}/phone_numbers?fields=id,display_phone_number,verified_name`, { headers }); const phonesData = await phonesResponse.json(); for (const phone of phonesData.data || []) whatsapp.push({ businessId: business.id, businessName: business.name, wabaId: waba.id, wabaName: waba.name, ...phone }); } } return { id: me.id, name: me.name, pages, instagram, whatsapp }; }
async function providerProfile(provider: SocialProvider, accessToken: string) { if (!accessToken.trim()) throw new Error(`No access token was returned by ${provider}.`); if (provider === "meta" || provider === "whatsapp") return metaProfile(accessToken); if (provider === "instagram") { const r = await fetch("https://graph.instagram.com/me?fields=id,username,name,profile_picture_url", { headers: { Authorization: `Bearer ${accessToken}` } }); const d = await r.json(); if (!r.ok) throw new Error(d.error?.message || "Unable to read the Instagram account."); return d; } if (provider === "tiktok") { const r = await fetch("https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url,username", { headers: { Authorization: `Bearer ${accessToken}` } }); const d = await r.json(); if (!r.ok) throw new Error(d.error?.message || "Unable to read TikTok account."); return d.data?.user || {}; } if (provider === "pinterest") {
        const headers = { Authorization: `Bearer ${accessToken}` };
        const accountResponse = await fetch("https://api.pinterest.com/v5/user_account", { headers });
        const accountData = await accountResponse.json().catch(() => ({}));
        if (!accountResponse.ok) {
            const detail = accountData.message || accountData.error?.message || "Unable to read Pinterest account.";
            throw new Error(`Pinterest account verification failed (HTTP ${accountResponse.status}): ${detail}`);
        }

        // Pinterest Trial/Sandbox can return an empty page with a bookmark.
        // Follow every page before concluding that the account has no boards.
        const boards: any[] = [];
        const seenBookmarks = new Set<string>();
        let bookmark: string | undefined;
        let paginationComplete = false;
        for (let page = 0; page < 25; page += 1) {
            const boardsUrl = new URL("https://api.pinterest.com/v5/boards");
            boardsUrl.searchParams.set("page_size", "250");
            if (bookmark) boardsUrl.searchParams.set("bookmark", bookmark);
            const boardsResponse = await fetch(boardsUrl, { headers });
            const boardsData = await boardsResponse.json().catch(() => ({}));
            if (!boardsResponse.ok) {
                const detail = boardsData.message || boardsData.error?.message || "Unable to list Pinterest boards.";
                throw new Error(`Pinterest board lookup failed (HTTP ${boardsResponse.status}): ${detail}`);
            }
            if (Array.isArray(boardsData.items)) boards.push(...boardsData.items);
            const nextBookmark = typeof boardsData.bookmark === "string" && boardsData.bookmark ? boardsData.bookmark : "";
            if (!nextBookmark) {
                paginationComplete = true;
                break;
            }
            if (seenBookmarks.has(nextBookmark)) break;
            seenBookmarks.add(nextBookmark);
            bookmark = nextBookmark;
        }
        if (!paginationComplete && boards.length === 0) {
            throw new Error("Pinterest board pagination did not complete, so Marketing Brain will not create a duplicate default board. Retry the connection or check Pinterest API access.");
        }

        // Create one public default board only when the full board listing is empty.
        // This creates a board, not a Pin; no campaign is published here.
        if (boards.length === 0) {
            const createResponse = await fetch("https://api.pinterest.com/v5/boards", {
                method: "POST",
                headers: { ...headers, "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: "JQYDesigns — Official Products",
                    description: "Official products, personalized gifts, and custom designs from JQYDesigns.",
                    privacy: "PUBLIC"
                })
            });
            const createdBoard = await createResponse.json().catch(() => ({}));
            if (!createResponse.ok || !createdBoard.id) {
                const detail = createdBoard.message || createdBoard.error?.message || "Pinterest did not return a board ID.";
                throw new Error(`No Pinterest boards were found, and the default board could not be created (HTTP ${createResponse.status}): ${detail}. Check Pinterest boards:write permission and the app's access tier.`);
            }
            boards.push(createdBoard);
        }
        return { ...accountData, boards };
    } const r = await fetch("https://www.googleapis.com/youtube/v3/channels?part=id,snippet&mine=true", { headers: { Authorization: `Bearer ${accessToken}` } }); const d = await r.json(); if (!r.ok) throw new Error(d.error?.message || "Unable to read YouTube account."); const channel = Array.isArray(d.items) ? d.items[0] : null; if (!channel?.id) throw new Error("YouTube authorization succeeded, but no YouTube channel was returned for the authorized account."); return channel; }
export function getWhatsAppEmbeddedConfig(userId: string) {
    const config = providerConfig("whatsapp");
    if (!config.configured || !process.env.META_WHATSAPP_LOGIN_CONFIG_ID?.trim()) throw new Error("WhatsApp Embedded Signup is not configured in Production.");
    const state = jwt.sign({ userId, provider: "whatsapp", purpose: "whatsapp_embedded_signup" }, stateSecret(), { expiresIn: "10m" });
    return { appId: String(process.env.META_APP_ID), configId: String(process.env.META_WHATSAPP_LOGIN_CONFIG_ID).trim(), state };
}
// Per-call timeout for the Graph calls chained by the WhatsApp Embedded
// Signup completion flow, so a hung Meta response fails with a clear error
// instead of waiting for the serverless platform limit. Scoped to this flow.
const GRAPH_CALL_TIMEOUT_MS = 15000;
async function fetchGraphWithTimeout(url: string | URL, init: RequestInit, step: string) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), GRAPH_CALL_TIMEOUT_MS);
    try {
        return await fetch(url, { ...init, signal: controller.signal });
    } catch (error) {
        if ((error as Error)?.name === "AbortError") throw new Error(`Meta did not respond in time while ${step}. Check the connection and try connecting WhatsApp again.`);
        throw error;
    } finally {
        clearTimeout(timeout);
    }
}
export async function completeWhatsAppEmbeddedSignup(userId: string, code: string, state: string, wabaId: string, phoneNumberId: string) {
    const payload = jwt.verify(state, stateSecret()) as { userId: string; provider: string; purpose?: string };
    if (payload.userId !== userId || payload.provider !== "whatsapp" || payload.purpose !== "whatsapp_embedded_signup") throw new Error("WhatsApp signup session expired or is invalid. Start Connect WhatsApp again.");
    if (!code.trim() || !/^\\d+$/.test(wabaId)) throw new Error("Meta did not return a valid authorization code and WhatsApp Business Account ID.");
    const url = new URL(`https://graph.facebook.com/${META_VERSION}/oauth/access_token`);
    url.searchParams.set("client_id", String(process.env.META_APP_ID));
    url.searchParams.set("client_secret", String(process.env.META_APP_SECRET));
    url.searchParams.set("code", code);
    const response = await fetchGraphWithTimeout(url, {}, "exchanging the WhatsApp signup code");
    const tokens: any = await response.json().catch(() => ({}));
    if (!response.ok || !tokens.access_token) throw new Error(tokens.error?.message || tokens.error_description || "Meta could not exchange the WhatsApp signup code. Start the signup again.");
    const token = String(tokens.access_token);
    const base = `https://graph.facebook.com/${META_VERSION}`;
    const headers = { Authorization: `Bearer ${token}` };
    const wabaResponse = await fetchGraphWithTimeout(`${base}/${wabaId}?fields=id,name`, { headers }, "verifying the WhatsApp Business Account");
    const waba: any = await wabaResponse.json().catch(() => ({}));
    if (!wabaResponse.ok) throw new Error(waba.error?.message || "The WhatsApp Business Account could not be verified with the granted token.");

    // Embedded Signup's coexistence completion event may provide only waba_id.
    // Resolve the phone ID from that WABA rather than requiring a phone field in the browser event.
    let resolvedPhoneId = /^\\d+$/.test(String(phoneNumberId || "")) ? String(phoneNumberId) : "";
    let phone: any = null;
    if (resolvedPhoneId) {
        const phoneResponse = await fetchGraphWithTimeout(`${base}/${resolvedPhoneId}?fields=id,display_phone_number,verified_name,quality_rating`, { headers }, "verifying the WhatsApp phone number");
        phone = await phoneResponse.json().catch(() => ({}));
        if (!phoneResponse.ok) throw new Error(phone.error?.message || "The WhatsApp phone number could not be verified with the granted token.");
        resolvedPhoneId = String(phone.id || resolvedPhoneId);
    } else {
        const phonesResponse = await fetchGraphWithTimeout(`${base}/${wabaId}/phone_numbers?fields=id,display_phone_number,verified_name,quality_rating`, { headers }, "loading the WhatsApp phone numbers");
        const phonesData: any = await phonesResponse.json().catch(() => ({}));
        if (!phonesResponse.ok) throw new Error(phonesData.error?.message || "Meta authorized the WhatsApp Business Account but did not provide a phone number. Check that the Login for Business token has WhatsApp business-management permission and that a phone number is configured.");
        const phones = Array.isArray(phonesData.data) ? phonesData.data : [];
        phone = phones.find((item: any) => /^\\d+$/.test(String(item.id || ""))) || null;
        resolvedPhoneId = String(phone?.id || "");
        if (!resolvedPhoneId) throw new Error("Meta authorized the WhatsApp Business Account, but no phone number is available under it yet. Finish adding/verifying the number in Meta Business and reconnect.");
    }
    const whatsapp = [{ id: resolvedPhoneId, phoneNumberId: resolvedPhoneId, display_phone_number: phone?.display_phone_number || "", verified_name: phone?.verified_name || "", wabaId, wabaName: waba.name || "", name: phone?.verified_name || phone?.display_phone_number || "WhatsApp Business" }];
    await saveConnection(userId, "whatsapp", tokens, { id: wabaId, name: waba.name || "WhatsApp Business", wabaId, phoneNumberId: resolvedPhoneId, whatsapp, signupMethod: "embedded_signup" });
    await pool.query(`INSERT INTO marketing_social_selections (user_id,provider,channel,external_id) VALUES ($1,'whatsapp','whatsapp',$2) ON CONFLICT (user_id,provider,channel) DO UPDATE SET external_id=EXCLUDED.external_id, updated_at=NOW()`, [userId, resolvedPhoneId]);
    return { connected: true, profile: { id: wabaId, name: waba.name || "WhatsApp Business", wabaId, phoneNumberId: resolvedPhoneId, whatsapp } };
}
export async function completeWhatsAppFromCode(userId: string, code: string, state: string) {
    const payload = jwt.verify(state, stateSecret()) as { userId: string; provider: string; purpose?: string };
    if (payload.userId !== userId || payload.provider !== "whatsapp" || payload.purpose !== "whatsapp_embedded_signup") throw new Error("WhatsApp signup session expired or is invalid. Start Connect WhatsApp again.");
    if (!code.trim()) throw new Error("Meta did not return an authorization code. Start the signup again.");
    const url = new URL(`https://graph.facebook.com/${META_VERSION}/oauth/access_token`);
    url.searchParams.set("client_id", String(process.env.META_APP_ID));
    url.searchParams.set("client_secret", String(process.env.META_APP_SECRET));
    url.searchParams.set("code", code);
    const response = await fetchGraphWithTimeout(url, {}, "exchanging the WhatsApp signup code");
    const tokens: any = await response.json().catch(() => ({}));
    if (!response.ok || !tokens.access_token) throw new Error(tokens.error?.message || tokens.error_description || "Meta could not exchange the WhatsApp signup code. Start the signup again.");
    const token = String(tokens.access_token);
    // Fallback for signups where Meta's completion event never reaches the
    // browser tab (common on mobile Safari, where the dialog ends on a
    // "close this tab" screen): discover the WhatsApp Business Account and
    // phone number from the granted token instead of the browser event.
    const profile: any = await metaProfile(token);
    const candidates = Array.isArray(profile?.whatsapp) ? profile.whatsapp : [];
    const phone = candidates.find((item: any) => /^\d+$/.test(String(item?.wabaId || "")) && /^\d+$/.test(String(item?.id || "")));
    if (!phone) throw new Error("Meta authorized the login, but no WhatsApp Business phone number was found for this account. Finish adding the number in Meta Business and reconnect.");
    const wabaId = String(phone.wabaId);
    const resolvedPhoneId = String(phone.id);
    const whatsapp = [{ id: resolvedPhoneId, phoneNumberId: resolvedPhoneId, display_phone_number: phone.display_phone_number || "", verified_name: phone.verified_name || "", wabaId, wabaName: phone.wabaName || "", name: phone.verified_name || phone.display_phone_number || "WhatsApp Business" }];
    await saveConnection(userId, "whatsapp", tokens, { id: wabaId, name: phone.wabaName || "WhatsApp Business", wabaId, phoneNumberId: resolvedPhoneId, whatsapp, signupMethod: "embedded_signup_code_fallback" });
    await pool.query(`INSERT INTO marketing_social_selections (user_id,provider,channel,external_id) VALUES ($1,'whatsapp','whatsapp',$2) ON CONFLICT (user_id,provider,channel) DO UPDATE SET external_id=EXCLUDED.external_id, updated_at=NOW()`, [userId, resolvedPhoneId]);
    return { connected: true, profile: { id: wabaId, name: phone.wabaName || "WhatsApp Business", wabaId, phoneNumberId: resolvedPhoneId, whatsapp } };
}
export async function handleCallback(provider: SocialProvider, code: string, state: string) { const payload = jwt.verify(state, stateSecret()) as { userId: string; provider: SocialProvider; channel?: string }; if (payload.provider !== provider) throw new Error("Invalid social connection state."); const storageProvider: SocialProvider = provider === "meta" && payload.channel === "whatsapp" ? "whatsapp" : provider; const tokenProvider: SocialProvider = storageProvider === "whatsapp" ? "whatsapp" : provider; let tokens: Record<string, any>; try { tokens = await exchange(tokenProvider, code); } catch (error) { throw new Error(`OAuth token exchange failed for ${storageProvider}: ${error instanceof Error ? error.message : "unknown provider error"}`); } if (tokens.error) throw new Error(tokens.error_description || tokens.error.message || `OAuth token exchange failed for ${storageProvider}.`); const accessToken = String(tokens.access_token || "").trim(); if (!accessToken) throw new Error(`OAuth authorization completed for ${storageProvider}, but provider did not return an access token.`); let profile: Record<string, unknown>; try { profile = await providerProfile(tokenProvider, accessToken); } catch (error) { throw new Error(`OAuth token was obtained for ${storageProvider}, but account verification failed: ${error instanceof Error ? error.message : "unknown provider error"}`); } if (storageProvider === "whatsapp") {
        // The redirect OAuth callback returns the raw Meta profile, whose
        // whatsapp entries carry the phone ID as `id` and no top-level
        // wabaId/phoneNumberId. Normalize to the same shape the Embedded
        // Signup completions save, or the connection status check will
        // keep reporting WhatsApp as not connected.
        const candidates = Array.isArray((profile as any)?.whatsapp) ? (profile as any).whatsapp : [];
        const phone = candidates.find((item: any) => /^\d+$/.test(String(item?.wabaId || "")) && /^\d+$/.test(String(item?.id || "")));
        if (!phone) throw new Error("Meta authorized the login, but no WhatsApp Business phone number was found for this account. Finish adding the number in Meta Business and reconnect.");
        const wabaId = String(phone.wabaId);
        const resolvedPhoneId = String(phone.id);
        const whatsapp = [{ id: resolvedPhoneId, phoneNumberId: resolvedPhoneId, display_phone_number: phone.display_phone_number || "", verified_name: phone.verified_name || "", wabaId, wabaName: phone.wabaName || "", name: phone.verified_name || phone.display_phone_number || "WhatsApp Business" }];
        profile = { id: wabaId, name: phone.wabaName || "WhatsApp Business", wabaId, phoneNumberId: resolvedPhoneId, whatsapp, signupMethod: "oauth_redirect" };
        await saveConnection(payload.userId, storageProvider, tokens, profile);
        await pool.query(`INSERT INTO marketing_social_selections (user_id,provider,channel,external_id) VALUES ($1,'whatsapp','whatsapp',$2) ON CONFLICT (user_id,provider,channel) DO UPDATE SET external_id=EXCLUDED.external_id, updated_at=NOW()`, [payload.userId, resolvedPhoneId]);
        return { userId: payload.userId, channel: payload.channel };
    }
    await saveConnection(payload.userId, storageProvider, tokens, profile); return { userId: payload.userId, channel: payload.channel }; }
async function refreshProviderToken(provider: SocialProvider, refreshToken: string) {
    const config = providerConfig(provider);
    const body = new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken });
    const headers: Record<string,string> = { "Content-Type": "application/x-www-form-urlencoded" };
    if (provider === "tiktok") {
        body.set("client_key", String(config.clientId));
        body.set("client_secret", String(config.clientSecret));
    } else if (provider === "youtube") {
        body.set("client_id", String(config.clientId));
        body.set("client_secret", String(config.clientSecret));
    } else if (provider === "pinterest") {
        headers.Authorization = `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64")}`;
    } else {
        throw new Error("This provider does not support automatic token refresh.");
    }
    const response = await fetch(config.token, { method: "POST", headers, body });
    const data = await response.json();
    if (!response.ok || !data.access_token) throw new Error(data.error_description || data.error?.message || data.message || `Unable to refresh ${provider} access.`);
    return data;
}
async function getAccessToken(userId: string, provider: SocialProvider) {
    await ensureSocialConnectionsTable();
    if (provider === "instagram") {
        const configuredToken = process.env.INSTAGRAM_ACCESS_TOKEN?.trim();
        const result = await pool.query<{ access_token: string; expires_at: string | null }>(`SELECT access_token, expires_at FROM marketing_social_connections WHERE user_id=$1 AND provider=$2`, [userId, provider]);
        const row = result.rows[0];
        // INSTAGRAM_ACCESS_TOKEN is the production source of truth. If the token was
        // rotated in Vercel, never keep publishing with an older encrypted DB token.
        if (configuredToken) {
            const storedToken = row ? String(decrypt(row.access_token) || "") : "";
            if (!row || storedToken !== configuredToken) {
                const profile = await providerProfile("instagram", configuredToken);
                await saveConnection(
                    userId,
                    "instagram",
                    { access_token: configuredToken, expires_in: 60 * 24 * 60 * 60 },
                    profile
                );
                return configuredToken;
            }
        }
        if (!row) throw new Error("Instagram is not connected. Configure INSTAGRAM_ACCESS_TOKEN in the Marketing backend.");
        const expiresAt = row.expires_at ? new Date(row.expires_at).getTime() : 0;
        if (expiresAt && expiresAt - Date.now() < 7 * 24 * 60 * 60 * 1000) {
            const current = decrypt(row.access_token) as string;
            const refreshUrl = new URL("https://graph.instagram.com/refresh_access_token");
            refreshUrl.searchParams.set("grant_type", "ig_refresh_token");
            refreshUrl.searchParams.set("access_token", current);
            const refreshResponse = await fetch(refreshUrl);
            const refreshed = await refreshResponse.json();
            if (!refreshResponse.ok || !refreshed.access_token) throw new Error(refreshed.error?.message || "Instagram token refresh failed. Reconnect the Instagram account.");
            const nextExpiresAt = Number(refreshed.expires_in || 0) ? new Date(Date.now() + Number(refreshed.expires_in) * 1000) : null;
            await pool.query(`UPDATE marketing_social_connections SET access_token=$1, expires_at=$2, updated_at=NOW() WHERE user_id=$3 AND provider='instagram'`, [encrypt(refreshed.access_token), nextExpiresAt, userId]);
            return String(refreshed.access_token);
        }
        return decrypt(row.access_token) as string;
    }
    const result = await pool.query<{ access_token: string; refresh_token: string | null; expires_at: string | null }>(`SELECT access_token, refresh_token, expires_at FROM marketing_social_connections WHERE user_id=$1 AND provider=$2`, [userId, provider]);
    const row = result.rows[0];
    if (!row) throw new Error(`${provider} is not connected.`);
    const expiresAt = row.expires_at ? new Date(row.expires_at).getTime() : 0;
    if (row.refresh_token && expiresAt && expiresAt - Date.now() < 15 * 60 * 1000 && provider !== "meta") {
        const refreshed = await refreshProviderToken(provider, decrypt(row.refresh_token) as string);
        const nextExpiresAt = Number(refreshed.expires_in || 0) ? new Date(Date.now() + Number(refreshed.expires_in) * 1000) : null;
        await pool.query(`UPDATE marketing_social_connections SET access_token=$1, refresh_token=$2, expires_at=$3, updated_at=NOW() WHERE user_id=$4 AND provider=$5`, [encrypt(refreshed.access_token), refreshed.refresh_token ? encrypt(refreshed.refresh_token) : row.refresh_token, nextExpiresAt, userId, provider]);
        return String(refreshed.access_token);
    }
    return decrypt(row.access_token) as string;
}
export async function verifySocialConnection(userId: string, provider: SocialProvider) {
    const accessToken = await getAccessToken(userId, provider);
    let profile: Record<string, any>;
    if (provider === "whatsapp") {
        const saved = await pool.query<{profile:any}>(`SELECT profile FROM marketing_social_connections WHERE user_id=$1 AND provider=$2`, [userId, provider]);
        const current = saved.rows[0]?.profile || {};
        const phoneId = String(current.phoneNumberId || current.whatsapp?.[0]?.id || "");
        const wabaId = String(current.wabaId || current.id || "");
        if (!phoneId || !wabaId) throw new Error("WhatsApp connection is missing its Business Account or phone-number ID. Reconnect WhatsApp.");
        const base = `https://graph.facebook.com/${META_VERSION}`;
        const [wr, pr] = await Promise.all([fetch(`${base}/${wabaId}?fields=id,name`, {headers:{Authorization:`Bearer ${accessToken}`}}), fetch(`${base}/${phoneId}?fields=id,display_phone_number,verified_name`, {headers:{Authorization:`Bearer ${accessToken}`}})]);
        const waba:any = await wr.json().catch(()=>({})); const phone:any = await pr.json().catch(()=>({}));
        if (!wr.ok || !pr.ok) throw new Error(waba.error?.message || phone.error?.message || "WhatsApp account verification failed.");
        profile = {...current, id:wabaId, wabaId, phoneNumberId:phoneId, name:waba.name || current.name, whatsapp:[{...phone,id:phoneId,wabaId,wabaName:waba.name || ""}]};
    } else profile = await providerProfile(provider, accessToken);
    await pool.query(`UPDATE marketing_social_connections SET profile=$1::jsonb, updated_at=NOW() WHERE user_id=$2 AND provider=$3`, [JSON.stringify(profile), userId, provider]);
    return { verified: true, provider, profile, verifiedAt: new Date().toISOString() };
}
export async function selectSocialAccount(userId: string, provider: SocialProvider, channel: SocialChannel, externalId: string) {
    await ensureSocialConnectionsTable();
    const allowed: Record<SocialChannel, SocialProvider> = { facebook: "meta", instagram: "meta", whatsapp: "whatsapp", tiktok: "tiktok", youtube: "youtube", pinterest: "pinterest" };
    if (allowed[channel] !== provider) throw new Error("Channel/provider selection mismatch.");
    const id = externalId.trim();
    if (!id) throw new Error("Account selection requires an external account ID.");
    const row = await pool.query<{ profile: any }>(`SELECT profile FROM marketing_social_connections WHERE user_id=$1 AND provider=$2 LIMIT 1`, [userId, provider]);
    if (!row.rows[0]) throw new Error(`${provider} is not connected.`);
    let profile = row.rows[0]?.profile || {};
    if (provider === "instagram" && !profile.id) profile = await providerProfile("instagram", await getAccessToken(userId, "instagram"));
    const exists = channel === "facebook" ? profile.pages?.some((item: any) => String(item.id) === id) : channel === "instagram" ? profile.instagram?.some((item: any) => String(item.id) === id) : channel === "whatsapp" ? profile.whatsapp?.some((item: any) => String(item.id) === id) : channel === "pinterest" ? profile.boards?.some((item: any) => String(item.id) === id) : true;
    if (!exists) throw new Error("The selected account is not present in the live authorized profile.");
    await pool.query(`INSERT INTO marketing_social_selections (user_id, provider, channel, external_id) VALUES ($1,$2,$3,$4) ON CONFLICT (user_id, provider, channel) DO UPDATE SET external_id=EXCLUDED.external_id, updated_at=NOW()`, [userId, provider, channel, id]);
    return { provider, channel, externalId: id };
}
export async function disconnect(userId: string, provider: SocialProvider) { await ensureSocialConnectionsTable(); if (provider === "instagram") throw new Error("Instagram is environment-managed. Remove INSTAGRAM_ACCESS_TOKEN from the Marketing backend to disconnect it."); await pool.query(`DELETE FROM marketing_social_connections WHERE user_id=$1 AND provider=$2`, [userId, provider]); }
export async function publishPinterest(userId: string, text: string, imageUrl?: string, link?: string) {
    if (!imageUrl) throw new Error("Pinterest requires an image URL.");
    const token = await getAccessToken(userId, "pinterest");
    const profile = await providerProfile("pinterest", token) as any;
    const selection = await pool.query<{external_id:string}>(`SELECT external_id FROM marketing_social_selections WHERE user_id=$1 AND provider='pinterest' AND channel='pinterest' LIMIT 1`, [userId]); const board = selection.rows[0]?.external_id ? profile.boards?.find((item: any) => String(item.id) === selection.rows[0].external_id) : profile.boards?.length === 1 ? profile.boards[0] : null;
    if (!board?.id) throw new Error("No Pinterest board is available for this account.");
    const response = await fetch("https://api.pinterest.com/v5/pins", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
            board_id: board.id,
            title: text.slice(0, 100),
            description: text.slice(0, 500),
            link: link || undefined,
            media_source: { source_type: "image_url", url: imageUrl, is_standard: true }
        })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || data.error?.message || "Pinterest publication failed.");
    return { ok: true, id: data.id, account: profile.username || profile.business_name || "Pinterest", ...(data.id ? { url: "https://www.pinterest.com/pin/" + encodeURIComponent(String(data.id)) + "/" } : {}) };
}

async function getTikTokCreator(token: string) {
    const creatorResponse = await fetch("https://open.tiktokapis.com/v2/post/publish/creator_info/query/", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    });
    const creator = await creatorResponse.json();
    if (!creatorResponse.ok || creator.error?.code && creator.error.code !== "ok") {
        throw new Error(creator.error?.message || "Unable to read TikTok creator information.");
    }
    return creator.data || {};
}

export async function publishTikTokPhoto(userId: string, text: string, imageUrl?: string) {
    if (!imageUrl) throw new Error("TikTok photo publishing requires an image URL.");
    const token = await getAccessToken(userId, "tiktok");
    const creator = await getTikTokCreator(token);
    const privacy = creator.privacy_level_options?.[0] || "SELF_ONLY";
    const response = await fetch("https://open.tiktokapis.com/v2/post/publish/content/init/", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
            post_info: { title: text.slice(0, 90), description: text.slice(0, 4000), privacy_level: privacy, brand_organic_toggle: true },
            source_info: { source: "PULL_FROM_URL", photo_cover_index: 0, photo_images: [imageUrl] },
            post_mode: "DIRECT_POST",
            media_type: "PHOTO"
        })
    });
    const data = await response.json();
    if (!response.ok || data.error?.code && data.error.code !== "ok") throw new Error(data.error?.message || "TikTok photo publication failed.");
    return { ok: true, status: "PROCESSING", id: data.data?.publish_id, account: creator.creator_username || creator.creator_nickname || "TikTok", message: "TikTok accepted the publication request and is processing it. Final publication status must be confirmed by TikTok." };
}

export async function publishTikTokVideo(userId: string, text: string, videoUrl?: string) {
    if (!videoUrl) throw new Error("TikTok video publishing requires a public video URL.");
    const token = await getAccessToken(userId, "tiktok");
    const creator = await getTikTokCreator(token);
    const privacy = creator.privacy_level_options?.[0] || "SELF_ONLY";
    const response = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
            post_info: { title: text.slice(0, 2200), privacy_level: privacy, brand_organic_toggle: true },
            source_info: { source: "PULL_FROM_URL", video_url: videoUrl }
        })
    });
    const data = await response.json();
    if (!response.ok || data.error?.code && data.error.code !== "ok") throw new Error(data.error?.message || "TikTok video publication failed.");
    return {
        ok: true,
        status: "PROCESSING",
        id: data.data?.publish_id,
        account: creator.creator_username || creator.creator_nickname || "TikTok",
        message: "TikTok accepted the video publication request; final publication status must be confirmed asynchronously."
    };
}

export async function getInstagramInsights(userId: string, days = 30) {
    await ensureSocialConnectionsTable();
    const metaRow = await pool.query<{ access_token: string }>(`SELECT access_token FROM marketing_social_connections WHERE user_id=$1 AND provider='meta' LIMIT 1`, [userId]);
    let token = "";
    let instagramUserId = "";
    let accountName: string | null = null;
    let base = "";
    let provider = "meta";
    if (metaRow.rows[0]) {
        token = String(decrypt(metaRow.rows[0].access_token) || "");
        const profile = await metaProfile(token) as any;
        const selection = await pool.query<{ external_id: string }>(`SELECT external_id FROM marketing_social_selections WHERE user_id=$1 AND provider='meta' AND channel='instagram' LIMIT 1`, [userId]);
        const selectedId = selection.rows[0]?.external_id;
        const selectedAccount = selectedId ? profile.instagram?.find((item: any) => String(item.id) === selectedId) : profile.instagram?.length === 1 ? profile.instagram[0] : null;
        if (!selectedAccount?.id) throw new Error("Meta is connected, but no Instagram professional account is selected. In Marketing Brain, select the Instagram account under the Meta connection.");
        const page = profile.pages?.find((item: any) => String(item.id) === String(selectedAccount.pageId));
        if (!page?.accessToken) throw new Error("Meta returned the Instagram account but no linked Page access token. Check that the Instagram professional account is linked to a Facebook Page and reauthorize Meta.");
        token = String(page.accessToken);
        instagramUserId = String(selectedAccount.id);
        accountName = selectedAccount.username || selectedAccount.name || null;
        base = `https://graph.facebook.com/${META_VERSION}`;
    } else {
        token = await getAccessToken(userId, "instagram");
        const profile = await providerProfile("instagram", token) as any;
        instagramUserId = String(profile.id || "");
        accountName = profile.username || profile.name || null;
        base = `https://graph.instagram.com/${META_VERSION}`;
        provider = "instagram";
    }
    if (!instagramUserId) throw new Error("Instagram account ID is unavailable. Verify the connected professional account.");
    const request = async (url: URL) => {
        const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || data?.error) {
            const message = data?.error?.message || "Instagram Insights request failed.";
            const code = data?.error?.code ? ` (code ${data.error.code})` : "";
            throw new Error(message + code);
        }
        return data;
    };
    const period = Math.max(1, Math.min(90, Math.floor(days)));
    const accountUrl = new URL(`${base}/${encodeURIComponent(instagramUserId)}/insights`);
    accountUrl.searchParams.set("metric", "reach,views,accounts_engaged,total_interactions");
    accountUrl.searchParams.set("period", "day");
    accountUrl.searchParams.set("metric_type", "total_value");
    accountUrl.searchParams.set("since", String(Math.floor((Date.now() - period * 86400000) / 1000)));
    accountUrl.searchParams.set("until", String(Math.floor(Date.now() / 1000)));
    const accountData = await request(accountUrl);
    const mediaUrl = new URL(`${base}/${encodeURIComponent(instagramUserId)}/media`);
    mediaUrl.searchParams.set("fields", "id,caption,media_type,timestamp,permalink,like_count,comments_count");
    mediaUrl.searchParams.set("limit", "25");
    const mediaData = await request(mediaUrl);
    const media = Array.isArray(mediaData.data) ? mediaData.data : [];
    const recentMedia = await Promise.all(media.slice(0, 15).map(async (item: any) => {
        const insightsUrl = new URL(`${base}/${encodeURIComponent(String(item.id))}/insights`);
        insightsUrl.searchParams.set("metric", item.media_type === "VIDEO" || item.media_type === "REELS" ? "views,reach,likes,comments,shares,saved" : "reach,likes,shares,saved");
        try {
            const insights = await request(insightsUrl);
            return { id: String(item.id), caption: String(item.caption || "").slice(0, 180), mediaType: item.media_type || "UNKNOWN", timestamp: item.timestamp || null, permalink: item.permalink || null, likeCount: Number(item.like_count || 0), commentsCount: Number(item.comments_count || 0), insights: insights.data || [] };
        } catch (error) {
            return { id: String(item.id), caption: String(item.caption || "").slice(0, 180), mediaType: item.media_type || "UNKNOWN", timestamp: item.timestamp || null, permalink: item.permalink || null, likeCount: Number(item.like_count || 0), commentsCount: Number(item.comments_count || 0), insights: [], insightsError: error instanceof Error ? error.message : "Media insights unavailable." };
        }
    }));
    return { verified: true, provider, account: { id: instagramUserId, username: accountName }, periodDays: period, generatedAt: new Date().toISOString(), accountInsights: accountData.data || [], recentMedia };
}
export async function publishInstagram(userId: string, text: string, imageUrl?: string, videoUrl?: string) {
    const token = await getAccessToken(userId, "instagram");
    const profile = await providerProfile("instagram", token) as any;
    const instagramUserId = String(profile.id || "");
    if (!instagramUserId) throw new Error("Instagram account ID is unavailable. Reconnect the Instagram professional account.");

    const mediaUrl = videoUrl || imageUrl;
    if (!mediaUrl) throw new Error("Instagram requires a public image or video URL. The campaign has no usable media URL.");
    let parsedMediaUrl: URL;
    try { parsedMediaUrl = new URL(mediaUrl); } catch { throw new Error("Instagram media URL is invalid."); }
    if (parsedMediaUrl.protocol !== "https:") throw new Error("Instagram requires media to be hosted at a publicly accessible HTTPS URL.");

    const base = `https://graph.instagram.com/${META_VERSION}`;
    const requestJson = async (response: Response, fallback: string) => {
        let data: any;
        try { data = await response.json(); } catch { throw new Error(`${fallback} Instagram returned a non-JSON response (HTTP ${response.status}).`); }
        if (!response.ok || data?.error || data?.success === false) {
            const detail = data?.error?.message || data?.message || data?.error?.error_user_msg || fallback;
            const code = data?.error?.code ? ` (code ${data.error.code}${data.error.error_subcode ? `/${data.error.error_subcode}` : ""})` : "";
            throw new Error(`${detail}${code}`);
        }
        return data;
    };

    // Create the Instagram media container before polling it or publishing it.
    // Instagram captions should contain only the copy/hashtags, never campaign tracking URLs.
    // Remove pasted URLs with analytics parameters while preserving normal copy and hashtags.
    const caption = text
        .replace(/https?:\/\/[^\s]+/gi, (candidate) => {
            try {
                const cleaned = candidate.replace(/[),.!?]+$/, "");
                const parsed = new URL(cleaned);
                const hasTracking = [...parsed.searchParams.keys()].some((key) =>
                    /^(utm_|fbclid$|gclid$|mc_cid$|mc_eid$)/i.test(key)
                );
                return hasTracking ? "" : candidate;
            } catch {
                return candidate;
            }
        })
        .replace(/[ \t]{2,}/g, " ")
        .replace(/\n[ \t]+/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
    const mediaParams = new URLSearchParams({ caption });
    if (videoUrl) {
        mediaParams.set("media_type", "REELS");
        mediaParams.set("video_url", videoUrl);
    } else {
        mediaParams.set("image_url", imageUrl!);
    }
    const createUrl = new URL(base + "/" + encodeURIComponent(instagramUserId) + "/media");
    createUrl.searchParams.set("access_token", token);
    const createResponse = await fetch(createUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: mediaParams,
    });
    const created = await requestJson(createResponse, "Instagram media container creation failed.");
    if (!created?.id) throw new Error("Instagram did not return a media container ID; nothing was published.");

    // Poll every container type, including still images, before calling media_publish.
    const statusUrl = new URL(base + "/" + encodeURIComponent(String(created.id)));
    statusUrl.searchParams.set("fields", "status_code,status");
    statusUrl.searchParams.set("access_token", token);
    let containerReady = false;
    let lastContainerStatus = "UNKNOWN";
    for (let attempt = 0; attempt < 18; attempt += 1) {
        if (attempt > 0) await new Promise(resolve => setTimeout(resolve, 5000));
        const statusResponse = await fetch(statusUrl);
        const statusData = await requestJson(statusResponse, "Instagram media processing check failed.");
        lastContainerStatus = String(statusData.status_code || statusData.status || "UNKNOWN");
        if (lastContainerStatus === "FINISHED" || lastContainerStatus === "PUBLISHED") { containerReady = true; break; }
        if (lastContainerStatus === "ERROR" || lastContainerStatus === "EXPIRED") {
            throw new Error("Instagram could not process the media container: " + String(statusData.status || lastContainerStatus) + ".");
        }
    }
    if (!containerReady) throw new Error("Instagram media container was not ready after 90 seconds (status: " + lastContainerStatus + "). It was not published; check the media URL and try again later.");
    const publishUrl = new URL(base + "/" + encodeURIComponent(instagramUserId) + "/media_publish");
    publishUrl.searchParams.set("creation_id", String(created.id));
    publishUrl.searchParams.set("access_token", token);
    let published: any = null;
    for (let attempt = 0; attempt < 3; attempt += 1) {
        const publishResponse = await fetch(publishUrl, { method: "POST" });
        try {
            published = await requestJson(publishResponse, "Instagram publication failed.");
            break;
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            if (!(message.includes("9007") && message.includes("2207027")) || attempt === 2) throw error;
            await new Promise(resolve => setTimeout(resolve, 10000));
            const retryResponse = await fetch(statusUrl);
            const retryData = await requestJson(retryResponse, "Instagram media processing retry check failed.");
            const retryStatus = String(retryData.status_code || retryData.status || "UNKNOWN");
            if (retryStatus === "ERROR" || retryStatus === "EXPIRED") throw new Error("Instagram media container became unavailable: " + String(retryData.status || retryStatus) + ".");
        }
    }
    if (!published?.id) throw new Error("Instagram did not return a published media ID. The campaign will not be marked as published.");

    let url: string | undefined;
    const permalinkUrl = new URL(`${base}/${encodeURIComponent(String(published.id))}`);
    permalinkUrl.searchParams.set("fields", "permalink");
    permalinkUrl.searchParams.set("access_token", token);
    try {
        const permalinkResponse = await fetch(permalinkUrl);
        const permalinkData = await requestJson(permalinkResponse, "Instagram published the media but permalink lookup failed.");
        if (typeof permalinkData.permalink === "string" && permalinkData.permalink.startsWith("https://")) url = permalinkData.permalink;
    } catch (error) {
        // A valid published ID proves that Instagram accepted the publication.
        // Keep the ID, but surface the missing permalink for operational follow-up.
        console.warn("[marketing][instagram] Published media ID returned but permalink lookup failed:", error instanceof Error ? error.message : "unknown error");
    }

    return {
        ok: true,
        id: String(published.id),
        account: profile.username || profile.name || "Instagram",
        ...(url ? { url } : {})
    };
}
export async function publishMeta(userId: string, channels: SocialChannel[], text: string, imageUrl?: string, link?: string, whatsappTo?: string, videoUrl?: string) { const token = await getAccessToken(userId, "meta"); const profile = await metaProfile(token); const selections = await pool.query<{channel:string; external_id:string}>(`SELECT channel, external_id FROM marketing_social_selections WHERE user_id=$1 AND provider='meta'`, [userId]); const selected = new Map(selections.rows.map(row => [String(row.channel), String(row.external_id)])); const results: Record<string, unknown> = {}; const base = `https://graph.facebook.com/${META_VERSION}`; for (const channel of channels) { try { if (channel === "facebook") { const page = selected.get("facebook") ? profile.pages?.find((item: any) => String(item.id) === selected.get("facebook")) : profile.pages?.length === 1 ? profile.pages[0] : null; if (!page) throw new Error("No Facebook Page was authorized."); let endpoint = `${base}/${page.id}/feed`; const params = new URLSearchParams({ message: text, access_token: page.accessToken }); if (imageUrl) { endpoint = `${base}/${page.id}/photos`; params.set("url", imageUrl); } if (link && !imageUrl) params.set("link", link); const r = await fetch(endpoint, { method: "POST", body: params }); const d = await r.json(); if (!r.ok) throw new Error(d.error?.message || "Facebook publication failed."); const publicationId = d.id || d.post_id; let url: string | undefined; if (publicationId) { try { const permalink = await fetch(`${base}/${publicationId}?fields=permalink_url&access_token=${encodeURIComponent(page.accessToken)}`); const permalinkData = await permalink.json(); if (permalink.ok && permalinkData.permalink_url) url = permalinkData.permalink_url; } catch { /* publication succeeded even if permalink lookup is unavailable */ } } results.facebook = { ok: true, id: publicationId, account: page.name, ...(url ? { url } : {}) }; } else if (channel === "instagram") { throw new Error("Instagram uses the dedicated Instagram Login connection."); } else if (channel === "whatsapp") { const whatsappToken = await getAccessToken(userId, "whatsapp"); const saved = await pool.query<{profile:any}>(`SELECT profile FROM marketing_social_connections WHERE user_id=$1 AND provider=$2`, [userId, "whatsapp"]); const whatsappProfile = saved.rows[0]?.profile || {}; const phoneId = String(whatsappProfile.phoneNumberId || whatsappProfile.whatsapp?.[0]?.id || ""); const phone = whatsappProfile.whatsapp?.find((item: any) => String(item.id) === phoneId) || whatsappProfile.whatsapp?.[0]; if (!phoneId) throw new Error("No WhatsApp Business phone was authorized."); if (!whatsappTo) throw new Error("WhatsApp requires a recipient phone number."); const r = await fetch(`${base}/${phoneId}/messages`, { method: "POST", headers: { Authorization: `Bearer ${whatsappToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ messaging_product: "whatsapp", to: whatsappTo, type: "text", text: { body: text } }) }); const d = await r.json(); if (!r.ok) throw new Error(d.error?.message || "WhatsApp message failed."); results.whatsapp = { ok: true, id: d.messages?.[0]?.id, account: phone?.display_phone_number || phone?.verified_name || "WhatsApp Business" }; } else results[channel] = { ok: false, error: `${channel} connection is supported, but its publisher requires channel-specific media/API handling.` }; } catch (error) { results[channel] = { ok: false, error: error instanceof Error ? error.message : "Publication failed." }; } } return results; }
export async function checkTikTokPublicationStatus(userId: string, publishId: string) {
    const token = await getAccessToken(userId, "tiktok");
    const response = await fetch("https://open.tiktokapis.com/v2/post/publish/status/fetch/", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ publish_id: publishId }),
    });
    const data = await response.json();
    if (!response.ok || data.error?.code && data.error.code !== "ok") {
        throw new Error(data.error?.message || "Unable to verify TikTok publication status.");
    }
    const status = String(data.data?.status || "PROCESSING");
    const postId = data.data?.publicaly_available_post_id?.[0];
    return { status, published: status === "PUBLISH_COMPLETE", publicPostId: postId ? String(postId) : undefined, failReason: data.data?.fail_reason ? String(data.data.fail_reason) : undefined };
}

export async function checkYouTubePublicationStatus(userId: string, videoId: string) {
    const token = await getAccessToken(userId, "youtube");
    const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=status,processingDetails&id=${encodeURIComponent(videoId)}`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Unable to verify YouTube publication status.");
    const video = data.items?.[0];
    if (!video) throw new Error("YouTube video no longer exists or is not accessible.");
    const uploadStatus = String(video.status?.uploadStatus || "");
    const privacyStatus = String(video.status?.privacyStatus || "");
    const processingStatus = String(video.processingDetails?.processingStatus || "");
    const published = uploadStatus === "processed" && Boolean(privacyStatus);
    return { status: published ? "PUBLISHED" : "PROCESSING", published, uploadStatus, privacyStatus, processingStatus, url: `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}` };
}
export async function publishYouTube(userId: string, text: string, videoUrl?: string, link?: string, privacyStatus: "public" | "unlisted" | "private" = "public") {
    if (!videoUrl) throw new Error("YouTube requires a public video URL.");
    const token = await getAccessToken(userId, "youtube");
    const videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok) throw new Error("Unable to download the video from the supplied URL.");
    const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());
    const title = text.split(/\\r?\\n/)[0].slice(0, 100) || "JQYDesigns";
    const metadata = {
        snippet: { title, description: link ? `${text}\\n\\n${link}` : text, categoryId: "22" },
        status: { privacyStatus }
    };
    const init = await fetch("https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json; charset=UTF-8", "X-Upload-Content-Type": videoResponse.headers.get("content-type") || "video/mp4", "X-Upload-Content-Length": String(videoBuffer.length) },
        body: JSON.stringify(metadata)
    });
    if (!init.ok) { const d = await init.json().catch(() => ({})); throw new Error(d.error?.message || "YouTube upload initialization failed."); }
    const uploadUrl = init.headers.get("location");
    if (!uploadUrl) throw new Error("YouTube did not return an upload URL.");
    const uploaded = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": videoResponse.headers.get("content-type") || "video/mp4", "Content-Length": String(videoBuffer.length) }, body: videoBuffer });
    const data = await uploaded.json().catch(() => ({}));
    if (!uploaded.ok) throw new Error(data.error?.message || "YouTube video upload failed.");
    return { ok: true, status: "PROCESSING", id: data.id, account: "YouTube", privacyStatus, message: "YouTube accepted the upload; processing/publication status will be confirmed asynchronously.", ...(data.id ? { url: "https://www.youtube.com/watch?v=" + encodeURIComponent(String(data.id)) } : {}) };
}

export function isSocialProvider(value: string): value is SocialProvider { return ["meta", "whatsapp", "instagram", "tiktok", "youtube", "pinterest"].includes(value); }