const axios = require("axios");
const fs = require("fs");
const path = require("path");
const config = require("../config/env");

/**
 * services/geocodingService.js
 * ----------------------------------------------------------------
 * REWRITTEN - ported directly from the client's existing, already-
 * working Zoho Creator Deluge geocoding function (get_lat_lng),
 * using the SAME provider (OpenCage Data) and the SAME API key
 * already proven to work against this client's real property
 * addresses in production - not a new/unproven provider.
 *
 * Confirmed request/response shape from the reference Deluge code:
 *   GET https://api.opencagedata.com/geocode/v1/json
 *     ?q=<url-encoded address>&key=<apiKey>
 *   -> results[0].geometry.{lat, lng}
 *
 * PERSISTENT CACHE: OpenCage is a paid/quota-based service (unlike
 * a free option) - every cache hit directly saves a paid API call.
 * Coordinates for a fixed street address never change, so this is
 * cached to DISK, permanently - a server restart never re-triggers
 * geocoding an address already resolved once. Same file-backed
 * pattern already used for assignedWorkOrderStore.js.
 * ----------------------------------------------------------------
 */

const CACHE_FILE = path.join(__dirname, "../../data/geocode-cache.json");
const OPENCAGE_URL = "https://api.opencagedata.com/geocode/v1/json";

function ensureDataDir() {
  const dir = path.dirname(CACHE_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readCache() {
  try {
    ensureDataDir();
    if (!fs.existsSync(CACHE_FILE)) {
      return {};
    }
    return JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
  } catch (error) {
    console.error("[Geocoding] Failed to read cache:", error.message);
    return {};
  }
}

function writeCache(cache) {
  try {
    ensureDataDir();
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), "utf8");
  } catch (error) {
    console.error("[Geocoding] Failed to write cache:", error.message);
  }
}

function normalizeAddressKey(address) {
  return String(address || "").trim().toLowerCase();
}

/**
 * geocodeAddress
 * ----------------------------------------------------------------
 * Returns { latitude, longitude } on a successful match, or null
 * if the address couldn't be matched at all - NOT treated as an
 * error worth throwing over, since that would otherwise block the
 * whole work order from resolving. Checks the persistent cache
 * first - a real (paid) API call only happens for an address never
 * successfully geocoded before.
 * ----------------------------------------------------------------
 */
async function geocodeAddress(address) {
  const key = normalizeAddressKey(address);

  if (!key) {
    return null;
  }

  const cache = readCache();

  if (cache[key]) {
    return cache[key];
  }

  try {
    const response = await axios.get(OPENCAGE_URL, {
      params: {
        q: address,
        key: config.geocoding.openCageApiKey,
      },
    });

    const results = response.data?.results;

    if (!Array.isArray(results) || results.length === 0) {
      console.warn(`[Geocoding] Address not found: "${address}"`);
      return null;
    }

    const geometry = results[0]?.geometry;

    if (!geometry || geometry.lat === undefined || geometry.lng === undefined) {
      console.warn(`[Geocoding] No geometry in result for: "${address}"`);
      return null;
    }

    const result = {
      latitude: geometry.lat,
      longitude: geometry.lng,
    };

    cache[key] = result;
    writeCache(cache);

    console.log(`[Geocoding] Resolved "${address}" ->`, result);

    return result;
  } catch (error) {
    console.error(
      `[Geocoding] Failed to geocode "${address}":`,
      error?.response?.data || error.message
    );
    return null;
  }
}

module.exports = { geocodeAddress };