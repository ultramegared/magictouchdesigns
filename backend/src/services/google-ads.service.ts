import { createHash } from "crypto";

type GoogleAdsState = "CONNECTED" | "CONFIGURATION_REQUIRED" | "REAUTH_REQUIRED" | "ERROR";

const requiredEnv = [
  "GOOGLE_ADS_DEVELOPER_TOKEN",
  "GOOGLE_ADS_CUSTOMER_ID",
  "GOOGLE_ADS_LOGIN_CUSTOMER_ID",
  "GOOGLE_ADS_REFRESH_TOKEN",
  "GOOGLE_OAUTH_CLIENT_ID",
  "GOOGLE_OAUTH_CLIENT_SECRET",
] as const;

const missingConfiguration = () => requiredEnv.filter((key) => !process.env[key]?.trim());

export function getGoogleAdsStatus() {
  const missing = missingConfiguration();
  return {
    provider: "Google Ads",
    state: "CONFIGURATION_REQUIRED" as GoogleAdsState,
    configured: false,
    connected: false,
    liveVerified: false,
    dataAvailable: false,
    customerId: process.env.GOOGLE_ADS_CUSTOMER_ID?.trim() || null,
    missing,
    message: missing.length
      ? "Google Ads is not connected. Supply the real developer token, customer ID, login customer ID, refresh token, and Google OAuth client credentials. No fake Connected state is exposed."
      : "Google Ads credentials exist, but live verification has not yet succeeded.",
  };
}

export async function verifyGoogleAdsConfiguration() {
  const missing = missingConfiguration();
  if (missing.length) return {
    provider: "Google Ads",
    state: "CONFIGURATION_REQUIRED" as GoogleAdsState,
    configured: false, connected: false, liveVerified: false, dataAvailable: false, missing,
  };
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID!.trim();
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET!.trim();
  const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN!.trim();
  const fingerprint = createHash("sha256").update(refreshToken).digest("hex").slice(0, 12);
  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: "refresh_token" }),
    });
    const tokenData = await tokenResponse.json().catch(() => ({}));
    if (!tokenResponse.ok || !tokenData.access_token) return {
      provider: "Google Ads", state: "REAUTH_REQUIRED" as GoogleAdsState, configured: true, connected: false, liveVerified: false, dataAvailable: false,
      error: `Google OAuth token refresh failed (${tokenResponse.status}).`, credentialFingerprint: fingerprint,
    };
    const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID!.trim().replace(/-/g, "");
    const url = `https://googleads.googleapis.com/v19/customers/${encodeURIComponent(customerId)}/googleAds:search`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN!.trim(),
        "login-customer-id": process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID!.trim().replace(/-/g, ""),
        "content-type": "application/json",
      },
      body: JSON.stringify({ query: "SELECT customer.id, customer.descriptive_name LIMIT 1" }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return {
      provider: "Google Ads", state: response.status === 401 ? "REAUTH_REQUIRED" as GoogleAdsState : "ERROR" as GoogleAdsState,
      configured: true, connected: false, liveVerified: false, dataAvailable: false,
      error: `Google Ads API verification failed (${response.status}).`,
      apiMessage: typeof data.error?.message === "string" ? data.error.message.slice(0, 300) : undefined,
    };
    return {
      provider: "Google Ads", state: "CONNECTED" as GoogleAdsState, configured: true, connected: true, liveVerified: true,
      dataAvailable: Array.isArray(data.results) && data.results.length > 0, customerId,
      customerName: data.results?.[0]?.customer?.descriptiveName || null,
    };
  } catch (error) {
    return { provider: "Google Ads", state: "ERROR" as GoogleAdsState, configured: true, connected: false, liveVerified: false, dataAvailable: false, error: error instanceof Error ? error.message : "Google Ads verification failed." };
  }
}
