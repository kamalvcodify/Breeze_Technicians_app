const axios = require("axios");
const config = require("../config/env");

let cachedToken = null;
let cachedTokenExpiresAt = 0; // epoch ms

/**
 * Returns a valid Zoho access token, refreshing it only when the cached one
 * is missing or about to expire. Access tokens are short-lived (~1 hour),
 * the refresh token is long-lived and never sent anywhere except Zoho.
 */
async function getAccessToken() {
  const now = Date.now();
  const bufferMs = 60 * 1000; // refresh a minute early to avoid edge-of-expiry failures

  if (cachedToken && now < cachedTokenExpiresAt - bufferMs) {
    return cachedToken;
  }

  if (!config.zoho.refreshToken || !config.zoho.clientId || !config.zoho.clientSecret) {
    throw new Error(
      "Zoho OAuth credentials are missing. Set ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET and " +
        "ZOHO_REFRESH_TOKEN in backend/.env before calling Zoho Creator."
    );
  }

  const url = `${config.zoho.accountsDomain}/oauth/v2/token`;
  const response = await axios.post(
    url,
    null,
    {
      params: {
        refresh_token: config.zoho.refreshToken,
        client_id: config.zoho.clientId,
        client_secret: config.zoho.clientSecret,
        grant_type: "refresh_token",
      },
    }
  );

  if (!response.data || !response.data.access_token) {
    throw new Error("Zoho did not return an access token. Check your refresh token/credentials.");
  }

  cachedToken = response.data.access_token;
  const expiresInSeconds = response.data.expires_in || 3600;
  cachedTokenExpiresAt = Date.now() + expiresInSeconds * 1000;

  return cachedToken;
}

module.exports = { getAccessToken };
