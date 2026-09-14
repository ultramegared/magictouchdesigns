import crypto from "crypto";
import jwt from "jsonwebtoken";
import { pool } from "../config/database";

export type SocialProvider = "meta" | "tiktok" | "youtube" | "pinterest";
export type SocialChannel = "facebook" | "instagram" | "whatsapp" | "tiktok" | "youtube" | "pinterest";

interface ConnectionRow { provider: SocialProvider; profile: Record<string, unknown>; expires_at: string | null; created_at: string; updated_at: string; }

const META_VERSION = process.env.META_GRAPH_API_VERSION || "v26.0";
const FRONTEND_URL = process.env.FRONTEND_PUBLIC_URL || "https://jqydesigns.com";
const BACKEND_URL = process.env.BACKEND_PUBLIC_URL || "https://api.jqydesigns.com";

const providerConfig = (provider: SocialProvider) => {
    if (provider === "meta") return { configured: Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET), clientId: process.env.META_APP_ID, clientSecret: process.env.META_APP_SECRET, authorize: `https://www.facebook.com/${META_VERSION}/dialog/oauth`, token: `https://graph.facebook.com/${META_VERSION}/oauth/access_token`, scopes: ["pages_show_list", "pages_read_engagement", "pages_manage_posts", "instagram_basic", "instagram_content_publish", "instagram_manage_insights", "whatsapp_business_management", "whatsapp_business_messaging"] };
    if (provider === "tiktok") return { configured: Boolean(process.env.TIKTOK_CLIENT_KEY && process.env.TIKTOK_CLIENT_SECRET), clientId: process.env.TIKTOK_CLIENT_KEY, clientSecret: process.env.TIKTOK_CLIENT_SECRET, authorize: "https://www.tiktok.com/v2/auth/authorize/", token: "https://open.tiktokapis.com/v2/oauth/token/", scopes: ["user.info.basic", "video.publish", "video.upload"] };
    if (provider === "youtube") return { configured: Boolean(process.env.GOOGLE_OAUTH_CLIENT_ID && process.env.GOOGLE_OAUTH_CLIENT_SECRET), clientId: process.env.GOOGLE_OAUTH_CLIENT_ID, clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET, authorize: "https://accounts.google.com/o/oauth2/v2/auth", token: "https://oauth2.googleapis.com/token", scopes: ["openid", "profile", "https://www.googleapis.com/auth/youtube.upload", "https://www.googleapis.com/auth/youtube.readonly"] };
    return { configured: Boolean(process.env.PINTEREST_APP_ID && process.env.PINTEREST_APP_SECRET), clientId: process.env.PINTEREST_APP_ID, clientSecret: process.env.PINTEREST_APP_SECRET, authorize: "https://www.pinterest.com/oauth/", token: "https://api.pinterest.com/v5/oauth/token", scopes: ["user_accounts:read", "boards:read", "boards:write", "pins:read", "pins:write"] };
};

const redirectUri = (provider: SocialProvider) => `${BACKEND_URL}/api/admin/marketing/social/${provider}/callback`;
const stateSecret = () => process.env.JWT_SECRET || "marketing-state-secret";
const tokenKey = () => crypto.createHash("sha256").update(process.env.SOCIAL_TOKEN_ENCRYPTION_KEY || stateSecret()).digest();

function encrypt(value: unknown) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", tokenKey(), iv);
    const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
    return `${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${encrypted.toString("base64url")}`;
}
function decrypt(value: string): any {
    const [ivRaw, tagRaw, dataRaw] = value.split(".");
    const decipher = crypto.createDecipheriv("aes-256-gcm", tokenKey(), Buffer.from(ivRaw, "base64url"));
    decipher.setAuthTag(Buffer.from(tagRaw, "base64url"));
    return JSON.parse(Buffer.concat([decipher.update(Buffer.from(dataRaw, "base64url")), decipher.final()]).toString("utf8"));
}

export async function ensureSocialConnectionsTable() {
    await pool.query(`CREATE TABLE IF NOT EXISTS marketing_social_connections (id BIGSERIAL PRIMARY KEY, user_id TEXT NOT NULL, provider TEXT NOT NULL, access_token TEXT NOT NULL, refresh_token TEXT, expires_at TIMESTAMPTZ, profile JSONB NOT NULL DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(user_id, provider));`);
}

async function saveConnection(userId: string, provider: SocialProvider, tokens: Record<string, unknown>, profile: Record<string, unknown>) {
    await ensureSocialConnectionsTable();
    const accessToken = String(tokens.access_token || "");
    if (!accessToken) throw new Error("The provider did not return an access token.");
    const expiresIn = Number(tokens.expires_in || 0);
    const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null;
    await pool.query(`INSERT INTO marketing_social_connections (user_id,provider,access_token,refresh_token,expires_at,profile) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (user_id,provider) DO UPDATE SET access_token=EXCLUDED.access_token, refresh_token=EXCLUDED.refresh_token, expires_at=EXCLUDED.expires_at, profile=EXCLUDED.profile, updated_at=NOW()`, [userId, provider, encrypt(accessToken), tokens.refresh_token ? encrypt(tokens.refresh_token) : null, expiresAt, JSON.stringify(profile)]);
}

export async function getConnections(userId: string) {
    await ensureSocialConnectionsTable();
    const result = await pool.query<ConnectionRow>(`SELECT provider, profile, expires_at, created_at, updated_at FROM marketing_social_connections WHERE user_id=$1 ORDER BY provider`, [userId]);
    const configured = ["meta", "tiktok", "youtube", "pinterest"].reduce<Record<string, boolean>>((out, provider) => { out[provider] = providerConfig(provider as SocialProvider).configured; return out; }, {});
    const connected = result.rows.reduce<Record<string, unknown>>((out, row) => { out[row.provider] = { connected: true, profile: row.profile, expiresAt: row.expires_at, updatedAt: row.updated_at }; return out; }, {});
    const metaProfile = result.rows.find(row => row.provider === "meta")?.profile || {};
    return { configured, connected, channels: { facebook: Boolean((metaProfile as any).pages?.length), instagram: Boolean((metaProfile as any).instagram?.length), whatsapp: Boolean((metaProfile as any).whatsapp?.length), tiktok: Boolean(connected.tiktok), youtube: Boolean(connected.youtube), pinterest: Boolean(connected.pinterest) } };
}

export function getConnectUrl(provider: SocialProvider, userId: string) {
    const config = providerConfig(provider);
    if (!config.configured || !config.clientId) throw new Error(`${provider} integration is not configured on the server.`);
    const state = jwt.sign({ userId, provider }, stateSecret(), { expiresIn: "10m" });
    const url = new URL(config.authorize);
    url.searchParams.set("client_id", config.clientId);
    url.searchParams.set("redirect_uri", redirectUri(provider));
    url.searchParams.set("response_type", "code");
    url.searchParams.set("state", state);
    if (provider === "meta") url.searchParams.set("scope", config.scopes.join(","));
    else if (provider === "pinterest") url.searchParams.set("scope", config.scopes.join(","));
    else url.searchParams.set("scope", config.scopes.join(" "));
    if (provider === "tiktok") url.searchParams.set("client_key", config.clientId);
    if (provider === "tiktok") url.searchParams.delete("client_id");
    if (provider === "youtube") { url.searchParams.set("access_type", "offline"); url.searchParams.set("prompt", "consent"); }
    if (provider === "pinterest") url.searchParams.set("continuous_refresh", "true");
    return url.toString();
}

async function exchange(provider: SocialProvider, code: string) {
    const config = providerConfig(provider);
    const uri = redirectUri(provider);
    if (provider === "meta") {
        const url = new URL(config.token); url.searchParams.set("client_id", String(config.clientId)); url.searchParams.set("client_secret", String(config.clientSecret)); url.searchParams.set("redirect_uri", uri); url.searchParams.set("code", code);
        const response = await fetch(url); return response.json();
    }
    const body = new URLSearchParams({ client_id: String(config.clientId), client_secret: String(config.clientSecret), code, redirect_uri: uri, grant_type: "authorization_code" });
    if (provider === "tiktok") { body.set("client_key", String(config.clientId)); body.delete("client_id"); }
    const response = await fetch(config.token, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
    return response.json();
}

async function metaProfile(accessToken: string) {
    const base = `https://graph.facebook.com/${META_VERSION}`;
    const headers = { Authorization: `Bearer ${accessToken}` };
    const meResponse = await fetch(`${base}/me?fields=id,name`, { headers });
    const me = await meResponse.json();
    if (!meResponse.ok) throw new Error(me.error?.message || "Unable to read the Meta account.");
    const pagesResponse = await fetch(`${base}/me/accounts?fields=id,name,access_token,instagram_business_account{id,username,name,profile_picture_url}`, { headers });
    const pagesData = await pagesResponse.json();
    const pages = (pagesData.data || []).map((page: any) => ({ id: page.id, name: page.name, accessToken: page.access_token, instagram: page.instagram_business_account || null }));
    const instagram = pages.filter((page: any) => page.instagram).map((page: any) => ({ ...page.instagram, pageId: page.id, pageName: page.name }));
    const businessesResponse = await fetch(`${base}/me/businesses?fields=id,name`, { headers });
    const businessesData = await businessesResponse.json();
    const whatsapp: any[] = [];
    for (const business of businessesData.data || []) {
        const wabaResponse = await fetch(`${base}/${business.id}/owned_whatsapp_business_accounts?fields=id,name`, { headers });
        const wabaData = await wabaResponse.json();
        for (const waba of wabaData.data || []) {
            const phonesResponse = await fetch(`${base}/${waba.id}/phone_numbers?fields=id,display_phone_number,verified_name`, { headers });
            const phonesData = await phonesResponse.json();
            for (const phone of phonesData.data || []) whatsapp.push({ businessId: business.id, businessName: business.name, wabaId: waba.id, wabaName: waba.name, ...phone });
        }
    }
    return { id: me.id, name: me.name, pages, instagram, whatsapp };
}

async function providerProfile(provider: SocialProvider, accessToken: string) {
    if (provider === "meta") return metaProfile(accessToken);
    if (provider === "tiktok") { const r = await fetch("https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url,username", { headers: { Authorization: `Bearer ${accessToken}` } }); const d = await r.json(); if (!r.ok) throw new Error(d.error?.message || "Unable to read TikTok account."); return d.data?.user || {}; }
    if (provider === "pinterest") { const r = await fetch("https://api.pinterest.com/v5/user_account", { headers: { Authorization: `Bearer ${accessToken}` } }); const d = await r.json(); if (!r.ok) throw new Error(d.message || "Unable to read Pinterest account."); return d; }
    const r = await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true", { headers: { Authorization: `Bearer ${accessToken}` } }); const d = await r.json(); if (!r.ok) throw new Error(d.error?.message || "Unable to read YouTube account."); return d.items?.[0] || {};
}

export async function handleCallback(provider: SocialProvider, code: string, state: string) {
    const payload = jwt.verify(state, stateSecret()) as { userId: string; provider: SocialProvider };
    if (payload.provider !== provider) throw new Error("Invalid social connection state.");
    const tokens = await exchange(provider, code);
    if (tokens.error) throw new Error(tokens.error_description || tokens.error.message || "Provider authorization failed.");
    const profile = await providerProfile(provider, String(tokens.access_token));
    await saveConnection(payload.userId, provider, tokens, profile);
    return payload.userId;
}

async function getAccessToken(userId: string, provider: SocialProvider) {
    await ensureSocialConnectionsTable();
    const result = await pool.query<{ access_token: string }>(`SELECT access_token FROM marketing_social_connections WHERE user_id=$1 AND provider=$2`, [userId, provider]);
    if (!result.rows[0]) throw new Error(`${provider} is not connected.`);
    return decrypt(result.rows[0].access_token) as string;
}

export async function disconnect(userId: string, provider: SocialProvider) {
    await ensureSocialConnectionsTable();
    await pool.query(`DELETE FROM marketing_social_connections WHERE user_id=$1 AND provider=$2`, [userId, provider]);
}

export async function publishMeta(userId: string, channels: SocialChannel[], text: string, imageUrl?: string, link?: string, whatsappTo?: string) {
    const token = await getAccessToken(userId, "meta");
    const profile = await metaProfile(token);
    const results: Record<string, unknown> = {};
    const base = `https://graph.facebook.com/${META_VERSION}`;
    for (const channel of channels) {
        try {
            if (channel === "facebook") {
                const page = profile.pages?.[0]; if (!page) throw new Error("No Facebook Page was authorized.");
                const params = new URLSearchParams({ message: text, access_token: page.accessToken }); if (link) params.set("link", link);
                const r = await fetch(`${base}/${page.id}/feed`, { method: "POST", body: params }); const d = await r.json(); if (!r.ok) throw new Error(d.error?.message || "Facebook publication failed."); results.facebook = { ok: true, id: d.id, account: page.name };
            } else if (channel === "instagram") {
                const account = profile.instagram?.[0]; if (!account) throw new Error("No Instagram Professional account was authorized."); if (!imageUrl) throw new Error("Instagram requires an image URL for this publication.");
                const params = new URLSearchParams({ image_url: imageUrl, caption: text, access_token: account.pageId ? (profile.pages?.find((p: any) => p.id === account.pageId)?.accessToken || token) : token });
                const create = await fetch(`${base}/${account.id}/media`, { method: "POST", body: params }); const created = await create.json(); if (!create.ok) throw new Error(created.error?.message || "Instagram media creation failed.");
                const publish = await fetch(`${base}/${account.id}/media_publish`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ creation_id: created.id, access_token: params.get("access_token") || token }) }); const published = await publish.json(); if (!publish.ok) throw new Error(published.error?.message || "Instagram publication failed."); results.instagram = { ok: true, id: published.id, account: account.username || account.name };
            } else if (channel === "whatsapp") {
                const phone = profile.whatsapp?.[0]; if (!phone) throw new Error("No WhatsApp Business phone was authorized."); if (!whatsappTo) throw new Error("WhatsApp requires a recipient phone number.");
                const r = await fetch(`${base}/${phone.id}/messages`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ messaging_product: "whatsapp", to: whatsappTo, type: "text", text: { body: text } }) }); const d = await r.json(); if (!r.ok) throw new Error(d.error?.message || "WhatsApp message failed."); results.whatsapp = { ok: true, id: d.messages?.[0]?.id, account: phone.display_phone_number };
            } else results[channel] = { ok: false, error: `${channel} connection is supported, but its publisher requires channel-specific media/API handling.` };
        } catch (error) { results[channel] = { ok: false, error: error instanceof Error ? error.message : "Publication failed." }; }
    }
    return results;
}

export function isSocialProvider(value: string): value is SocialProvider { return ["meta", "tiktok", "youtube", "pinterest"].includes(value); }
