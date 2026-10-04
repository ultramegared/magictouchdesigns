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
    if (provider === "meta") return { configured: Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET), clientId: process.env.META_APP_ID, clientSecret: process.env.META_APP_SECRET, authorize: `https://www.facebook.com/${META_VERSION}/dialog/oauth`, token: `https://graph.facebook.com/${META_VERSION}/oauth/access_token`, scopes: ["pages_show_list", "pages_read_engagement", "pages_manage_posts", "instagram_basic", "instagram_content_publish", "instagram_manage_insights", "whatsapp_business_management", "whatsapp_business_messaging"], envKeys: ["META_APP_ID", "META_APP_SECRET"] };
    if (provider === "tiktok") return { configured: Boolean(process.env.TIKTOK_CLIENT_KEY && process.env.TIKTOK_CLIENT_SECRET), clientId: process.env.TIKTOK_CLIENT_KEY, clientSecret: process.env.TIKTOK_CLIENT_SECRET, authorize: "https://www.tiktok.com/v2/auth/authorize/", token: "https://open.tiktokapis.com/v2/oauth/token/", scopes: ["user.info.basic", "video.publish", "video.upload"], envKeys: ["TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET"] };
    if (provider === "youtube") return { configured: Boolean(process.env.GOOGLE_OAUTH_CLIENT_ID && process.env.GOOGLE_OAUTH_CLIENT_SECRET), clientId: process.env.GOOGLE_OAUTH_CLIENT_ID, clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET, authorize: "https://accounts.google.com/o/oauth2/v2/auth", token: "https://oauth2.googleapis.com/token", scopes: ["openid", "profile", "https://www.googleapis.com/auth/youtube.upload", "https://www.googleapis.com/auth/youtube.readonly"], envKeys: ["GOOGLE_OAUTH_CLIENT_ID", "GOOGLE_OAUTH_CLIENT_SECRET"] };
    return { configured: Boolean(process.env.PINTEREST_APP_ID && process.env.PINTEREST_APP_SECRET), clientId: process.env.PINTEREST_APP_ID, clientSecret: process.env.PINTEREST_APP_SECRET, authorize: "https://www.pinterest.com/oauth/", token: "https://api.pinterest.com/v5/oauth/token", scopes: ["user_accounts:read", "boards:read", "boards:write", "pins:read", "pins:write"], envKeys: ["PINTEREST_APP_ID", "PINTEREST_APP_SECRET"] };
};
const redirectUri = (provider: SocialProvider) => `${BACKEND_URL}/api/admin/marketing/social/${provider}/callback`;
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
    const providers = ["meta", "tiktok", "youtube", "pinterest"] as SocialProvider[];
    const configured = providers.reduce<Record<string, boolean>>((out, provider) => { out[provider] = providerConfig(provider).configured; return out; }, {});
    const setup = providers.reduce<Record<string, unknown>>((out, provider) => { const config = providerConfig(provider); out[provider] = { configured: config.configured, envKeys: config.envKeys, callback: redirectUri(provider) }; return out; }, {});
    const connected = result.rows.reduce<Record<string, unknown>>((out, row) => { out[row.provider] = { connected: true, profile: row.profile, expiresAt: row.expires_at, updatedAt: row.updated_at }; return out; }, {});
    const metaProfile = result.rows.find(row => row.provider === "meta")?.profile || {};
    return {
        configured, setup, connected, selections,
        channels: {
            facebook: Boolean((metaProfile as any).pages?.length),
            instagram: Boolean((metaProfile as any).instagram?.length),
            whatsapp: Boolean((metaProfile as any).whatsapp?.length),
            tiktok: Boolean(connected.tiktok), youtube: Boolean(connected.youtube), pinterest: Boolean(connected.pinterest)
        }
    };
}
export function getConnectUrl(provider: SocialProvider, userId: string) { const config = providerConfig(provider); if (!config.configured || !config.clientId) throw new Error(`${provider} integration is not configured on the server.`); const state = jwt.sign({ userId, provider }, stateSecret(), { expiresIn: "10m" }); const url = new URL(config.authorize); url.searchParams.set("client_id", config.clientId); url.searchParams.set("redirect_uri", redirectUri(provider)); url.searchParams.set("response_type", "code"); url.searchParams.set("state", state); if (provider === "meta" || provider === "pinterest" || provider === "tiktok") url.searchParams.set("scope", config.scopes.join(",")); else url.searchParams.set("scope", config.scopes.join(" ")); if (provider === "tiktok") { url.searchParams.set("client_key", config.clientId); url.searchParams.delete("client_id"); } if (provider === "youtube") { url.searchParams.set("access_type", "offline"); url.searchParams.set("prompt", "consent"); url.searchParams.set("include_granted_scopes", "true"); } if (provider === "pinterest") url.searchParams.set("continuous_refresh", "true"); return url.toString(); }
async function exchange(provider: SocialProvider, code: string) { const config = providerConfig(provider); const uri = redirectUri(provider); if (provider === "meta") { const url = new URL(config.token); url.searchParams.set("client_id", String(config.clientId)); url.searchParams.set("client_secret", String(config.clientSecret)); url.searchParams.set("redirect_uri", uri); url.searchParams.set("code", code); const response = await fetch(url); return response.json(); } const body = new URLSearchParams({ client_id: String(config.clientId), client_secret: String(config.clientSecret), code, redirect_uri: uri, grant_type: "authorization_code" }); if (provider === "tiktok") { body.set("client_key", String(config.clientId)); body.delete("client_id"); } const headers: Record<string,string> = { "Content-Type": "application/x-www-form-urlencoded" }; if (provider === "pinterest") { headers.Authorization = `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64")}`; body.delete("client_id"); body.delete("client_secret"); body.set("continuous_refresh", "true"); } const response = await fetch(config.token, { method: "POST", headers, body }); return response.json(); }
async function metaProfile(accessToken: string) { const base = `https://graph.facebook.com/${META_VERSION}`; const headers = { Authorization: `Bearer ${accessToken}` }; const meResponse = await fetch(`${base}/me?fields=id,name`, { headers }); const me = await meResponse.json(); if (!meResponse.ok) throw new Error(me.error?.message || "Unable to read the Meta account."); const pagesResponse = await fetch(`${base}/me/accounts?fields=id,name,access_token,instagram_business_account{id,username,name,profile_picture_url}`, { headers }); const pagesData = await pagesResponse.json(); const pages = (pagesData.data || []).map((page: any) => ({ id: page.id, name: page.name, accessToken: page.access_token, instagram: page.instagram_business_account || null })); const instagram = pages.filter((page: any) => page.instagram).map((page: any) => ({ ...page.instagram, pageId: page.id, pageName: page.name })); const businessesResponse = await fetch(`${base}/me/businesses?fields=id,name`, { headers }); const businessesData = await businessesResponse.json(); const whatsapp: any[] = []; for (const business of businessesData.data || []) { const wabaResponse = await fetch(`${base}/${business.id}/owned_whatsapp_business_accounts?fields=id,name`, { headers }); const wabaData = await wabaResponse.json(); for (const waba of wabaData.data || []) { const phonesResponse = await fetch(`${base}/${waba.id}/phone_numbers?fields=id,display_phone_number,verified_name`, { headers }); const phonesData = await phonesResponse.json(); for (const phone of phonesData.data || []) whatsapp.push({ businessId: business.id, businessName: business.name, wabaId: waba.id, wabaName: waba.name, ...phone }); } } return { id: me.id, name: me.name, pages, instagram, whatsapp }; }
async function providerProfile(provider: SocialProvider, accessToken: string) { if (!accessToken.trim()) throw new Error(`No access token was returned by ${provider}.`); if (provider === "meta") return metaProfile(accessToken); if (provider === "tiktok") { const r = await fetch("https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url,username", { headers: { Authorization: `Bearer ${accessToken}` } }); const d = await r.json(); if (!r.ok) throw new Error(d.error?.message || "Unable to read TikTok account."); return d.data?.user || {}; } if (provider === "pinterest") { const r = await fetch("https://api.pinterest.com/v5/user_account", { headers: { Authorization: `Bearer ${accessToken}` } }); const d = await r.json(); if (!r.ok) throw new Error(d.message || "Unable to read Pinterest account."); const boardsResponse = await fetch("https://api.pinterest.com/v5/boards?page_size=50", { headers: { Authorization: `Bearer ${accessToken}` } }); const boardsData = await boardsResponse.json(); return { ...d, boards: boardsData.items || [] }; } const r = await fetch("https://www.googleapis.com/youtube/v3/channels?part=id,snippet&mine=true", { headers: { Authorization: `Bearer ${accessToken}` } }); const d = await r.json(); if (!r.ok) throw new Error(d.error?.message || "Unable to read YouTube account."); const channel = Array.isArray(d.items) ? d.items[0] : null; if (!channel?.id) throw new Error("YouTube authorization succeeded, but no YouTube channel was returned for the authorized account."); return channel; }
export async function handleCallback(provider: SocialProvider, code: string, state: string) { const payload = jwt.verify(state, stateSecret()) as { userId: string; provider: SocialProvider }; if (payload.provider !== provider) throw new Error("Invalid social connection state."); let tokens: Record<string, any>; try { tokens = await exchange(provider, code); } catch (error) { throw new Error(`OAuth token exchange failed for ${provider}: ${error instanceof Error ? error.message : "unknown provider error"}`); } if (tokens.error) throw new Error(tokens.error_description || tokens.error.message || `OAuth token exchange failed for ${provider}.`); const accessToken = String(tokens.access_token || "").trim(); if (!accessToken) throw new Error(`OAuth authorization completed for ${provider}, but Google/provider did not return an access token.`); let profile: Record<string, unknown>; try { profile = await providerProfile(provider, accessToken); } catch (error) { throw new Error(`OAuth token was obtained for ${provider}, but account verification failed: ${error instanceof Error ? error.message : "unknown provider error"}`); } await saveConnection(payload.userId, provider, tokens, profile); return payload.userId; }
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
    const profile = await providerProfile(provider, accessToken);
    await pool.query(
        `UPDATE marketing_social_connections SET profile=$1::jsonb, updated_at=NOW() WHERE user_id=$2 AND provider=$3`,
        [JSON.stringify(profile), userId, provider]
    );
    return {
        verified: true,
        provider,
        profile,
        verifiedAt: new Date().toISOString(),
    };
}

export async function selectSocialAccount(userId: string, provider: SocialProvider, channel: SocialChannel, externalId: string) {
    await ensureSocialConnectionsTable();
    const allowed: Record<SocialChannel, SocialProvider> = { facebook: "meta", instagram: "meta", whatsapp: "meta", tiktok: "tiktok", youtube: "youtube", pinterest: "pinterest" };
    if (allowed[channel] !== provider) throw new Error("Channel/provider selection mismatch.");
    const id = externalId.trim();
    if (!id) throw new Error("Account selection requires an external account ID.");
    const row = await pool.query<{ profile: any }>(`SELECT profile FROM marketing_social_connections WHERE user_id=$1 AND provider=$2 LIMIT 1`, [userId, provider]);
    if (!row.rows[0]) throw new Error(`${provider} is not connected.`);
    const profile = row.rows[0].profile || {};
    const exists = channel === "facebook" ? profile.pages?.some((item: any) => String(item.id) === id) : channel === "instagram" ? profile.instagram?.some((item: any) => String(item.id) === id) : channel === "whatsapp" ? profile.whatsapp?.some((item: any) => String(item.id) === id) : channel === "pinterest" ? profile.boards?.some((item: any) => String(item.id) === id) : true;
    if (!exists) throw new Error("The selected account is not present in the live authorized profile.");
    await pool.query(`INSERT INTO marketing_social_selections (user_id, provider, channel, external_id) VALUES ($1,$2,$3,$4) ON CONFLICT (user_id, provider, channel) DO UPDATE SET external_id=EXCLUDED.external_id, updated_at=NOW()`, [userId, provider, channel, id]);
    return { provider, channel, externalId: id };
}
export async function disconnect(userId: string, provider: SocialProvider) { await ensureSocialConnectionsTable(); await pool.query(`DELETE FROM marketing_social_connections WHERE user_id=$1 AND provider=$2`, [userId, provider]); }
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

export async function publishMeta(userId: string, channels: SocialChannel[], text: string, imageUrl?: string, link?: string, whatsappTo?: string, videoUrl?: string) { const token = await getAccessToken(userId, "meta"); const profile = await metaProfile(token); const selections = await pool.query<{channel:string; external_id:string}>(`SELECT channel, external_id FROM marketing_social_selections WHERE user_id=$1 AND provider='meta'`, [userId]); const selected = new Map(selections.rows.map(row => [String(row.channel), String(row.external_id)])); const results: Record<string, unknown> = {}; const base = `https://graph.facebook.com/${META_VERSION}`; for (const channel of channels) { try { if (channel === "facebook") { const page = selected.get("facebook") ? profile.pages?.find((item: any) => String(item.id) === selected.get("facebook")) : profile.pages?.length === 1 ? profile.pages[0] : null; if (!page) throw new Error("No Facebook Page was authorized."); let endpoint = `${base}/${page.id}/feed`; const params = new URLSearchParams({ message: text, access_token: page.accessToken }); if (imageUrl) { endpoint = `${base}/${page.id}/photos`; params.set("url", imageUrl); } if (link && !imageUrl) params.set("link", link); const r = await fetch(endpoint, { method: "POST", body: params }); const d = await r.json(); if (!r.ok) throw new Error(d.error?.message || "Facebook publication failed."); const publicationId = d.id || d.post_id; let url: string | undefined; if (publicationId) { try { const permalink = await fetch(`${base}/${publicationId}?fields=permalink_url&access_token=${encodeURIComponent(page.accessToken)}`); const permalinkData = await permalink.json(); if (permalink.ok && permalinkData.permalink_url) url = permalinkData.permalink_url; } catch { /* publication succeeded even if permalink lookup is unavailable */ } } results.facebook = { ok: true, id: publicationId, account: page.name, ...(url ? { url } : {}) }; } else if (channel === "instagram") { const account = selected.get("instagram") ? profile.instagram?.find((item: any) => String(item.id) === selected.get("instagram")) : profile.instagram?.length === 1 ? profile.instagram[0] : null; if (!account) throw new Error("No Instagram Professional account was authorized."); if (!imageUrl && !videoUrl) throw new Error("Instagram requires an image or video URL for this publication."); const pageToken = profile.pages?.find((p: any) => p.id === account.pageId)?.accessToken || token; const mediaParams = videoUrl ? new URLSearchParams({ media_type: "REELS", video_url: videoUrl, caption: text, access_token: pageToken }) : new URLSearchParams({ image_url: imageUrl!, caption: text, access_token: pageToken }); const create = await fetch(`${base}/${account.id}/media`, { method: "POST", body: mediaParams }); const created = await create.json(); if (!create.ok) throw new Error(created.error?.message || "Instagram media creation failed."); if (videoUrl) { for (let attempt = 0; attempt < 12; attempt += 1) { await new Promise(resolve => setTimeout(resolve, 5000)); const statusResponse = await fetch(`${base}/${created.id}?fields=status_code&access_token=${encodeURIComponent(pageToken)}`); const statusData = await statusResponse.json(); if (!statusResponse.ok) throw new Error(statusData.error?.message || "Instagram Reel processing failed."); if (statusData.status_code === "ERROR") throw new Error("Instagram Reel processing failed."); if (statusData.status_code === "FINISHED") break; if (attempt === 11) throw new Error("Instagram Reel is still processing. Try publishing again later."); } } const publish = await fetch(`${base}/${account.id}/media_publish`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ creation_id: created.id, access_token: pageToken }) }); const published = await publish.json(); if (!publish.ok) throw new Error(published.error?.message || "Instagram publication failed."); let url: string | undefined; if (published.id) { try { const permalink = await fetch(`${base}/${published.id}?fields=permalink&access_token=${encodeURIComponent(pageToken)}`); const permalinkData = await permalink.json(); if (permalink.ok && permalinkData.permalink) url = permalinkData.permalink; } catch { /* publication succeeded even if permalink lookup is unavailable */ } } results.instagram = { ok: true, id: published.id, account: account.username || account.name, ...(url ? { url } : {}) }; } else if (channel === "whatsapp") { const phone = selected.get("whatsapp") ? profile.whatsapp?.find((item: any) => String(item.id) === selected.get("whatsapp")) : profile.whatsapp?.length === 1 ? profile.whatsapp[0] : null; if (!phone) throw new Error("No WhatsApp Business phone was authorized."); if (!whatsappTo) throw new Error("WhatsApp requires a recipient phone number."); const r = await fetch(`${base}/${phone.id}/messages`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ messaging_product: "whatsapp", to: whatsappTo, type: "text", text: { body: text } }) }); const d = await r.json(); if (!r.ok) throw new Error(d.error?.message || "WhatsApp message failed."); results.whatsapp = { ok: true, id: d.messages?.[0]?.id, account: phone.display_phone_number }; } else results[channel] = { ok: false, error: `${channel} connection is supported, but its publisher requires channel-specific media/API handling.` }; } catch (error) { results[channel] = { ok: false, error: error instanceof Error ? error.message : "Publication failed." }; } } return results; }
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

export function isSocialProvider(value: string): value is SocialProvider { return ["meta", "tiktok", "youtube", "pinterest"].includes(value); }
