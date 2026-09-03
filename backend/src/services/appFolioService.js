const axios = require("axios");
const config = require("../config/env");
const { geocodeAddress } = require("./geocodingService");

/**
 * services/appFolioService.js
 * ----------------------------------------------------------------
 * Owns every AppFolio API call in one place. Replaces the old
 * Desk-based "My Assigned Work Orders" data source entirely, per
 * the client's explicit instruction ("rip it out, pull it from
 * AppFolio directly").
 *
 * ENDPOINTS CONFIRMED AGAINST REAL SAMPLE DATA:
 *   - GET /work_orders?filters[LastUpdatedAtFrom]=<iso> - primary
 *     sync source. AssignedUsers gives {Id, Name} only, no email.
 *   - GET /properties?filters[Id]=<uuid> - resolves PropertyId.
 *   - GET /units?filters[Id]=<uuid> - resolves UnitId.
 *   - GET /users?filters[LastUpdatedAtFrom]=<iso> - staff list,
 *     DOES include Email - used to match AssignedUsers[].Id to a
 *     real technician email.
 *
 * ADDRESS QUIRK (confirmed from 2 real sample records): Address1
 * correctly holds the street address, but Address2 actually holds
 * the CITY (not a suite/apt line), and City actually holds the
 * STATE NAME (State itself is correct separately). This is
 * consistent across samples, not a one-off - formatPropertyAddress
 * below is built around this confirmed real shape, not the field
 * labels' literal names.
 *
 * GEOCODING: latitude/longitude are resolved via the US Census
 * Geocoder (see services/geocodingService.js), cached permanently
 * on disk per unique address - AppFolio itself provides no
 * coordinates at all, only text addresses. A failed/unmatched
 * address (rural, new construction, bad data) leaves lat/lng as
 * null rather than blocking the work order from resolving.
 *
 * CACHING: Property/Unit lookups and the Users list are cached
 * in-memory with a TTL (config.zoho... no, config.appFolio
 * .propertyCacheTtlMs/.unitCacheTtlMs/.usersCacheTtlMs) - many work
 * orders share the same property, and staff lists change rarely,
 * so this avoids redundant API calls on every sync cycle. A
 * confirmed real-world rate limit exists for AppFolio (5 requests
 * per 5 seconds, per a third-party integrator's reported
 * experience - not officially published by AppFolio) - caching is
 * the main defense against approaching that limit, plus a small
 * inter-call delay during any bulk/cold-cache resolution (see
 * BULK_RESOLVE_DELAY_MS).
 * ----------------------------------------------------------------
 */

const BULK_RESOLVE_DELAY_MS = 250; // ~4 req/sec, safely under 5-per-5-sec

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function appFolioRequest(path, params = {}) {
  const response = await axios.get(`${config.appFolio.baseUrl}${path}`, {
    params,
    headers: {
      Authorization: config.appFolio.authHeader,
      "X-AppFolio-Developer-ID": config.appFolio.developerId,
    },
  });

  return response.data;
}

/**
 * Follows next_page_path until exhausted, accumulating every page's
 * `data` array into one flat list.
 */
async function fetchAllPages(path, params = {}) {
  let results = [];
  let currentPath = path;
  let currentParams = params;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    // eslint-disable-next-line no-await-in-loop
    const response = await appFolioRequest(currentPath, currentParams);
    results = results.concat(Array.isArray(response?.data) ? response.data : []);

    if (!response?.next_page_path) {
      break;
    }

    // next_page_path is already a full query string - use it
    // directly as the path, with no additional params layered on.
    currentPath = response.next_page_path.replace(/^\/api\/v0/, "");
    currentParams = {};
  }

  return results;
}

/* ------------------------------------------------------------------
 * Property / Unit caches (TTL-based, in-memory)
 * ------------------------------------------------------------------ */

const propertyCache = new Map(); // id -> { value, cachedAt }
const unitCache = new Map();

function getFromCache(cache, id, ttlMs) {
  const entry = cache.get(id);
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > ttlMs) {
    cache.delete(id);
    return null;
  }
  return entry.value;
}

function setInCache(cache, id, value) {
  cache.set(id, { value, cachedAt: Date.now() });
}

/**
 * formatPropertyAddress
 * ----------------------------------------------------------------
 * Built around the CONFIRMED real field shape (Address2 is
 * actually the city, City is actually the state name) - see file
 * header. Only Address1, Address2 (as city), State, and Zip are
 * used; the mislabeled City field is deliberately ignored.
 * ----------------------------------------------------------------
 */
function formatPropertyAddress(property) {
  if (!property) {
    return "";
  }

  const parts = [property.Address1, property.Address2, property.State, property.Zip].filter(
    Boolean
  );

  // Address1, Address2 - join with a comma; State/Zip join with a
  // space at the end, matching a normal "Street, City, ST Zip"
  // display format.
  const [street, city, state, zip] = [
    property.Address1,
    property.Address2,
    property.State,
    property.Zip,
  ];

  const stateZip = [state, zip].filter(Boolean).join(" ");
  return [street, city, stateZip].filter(Boolean).join(", ");
}

async function getProperty(propertyId) {
  if (!propertyId) {
    return null;
  }

  const cached = getFromCache(propertyCache, propertyId, config.appFolio.propertyCacheTtlMs);
  if (cached) {
    return cached;
  }

  const results = await fetchAllPages("/properties", { "filters[Id]": propertyId });
  const property = results[0] || null;

  if (property) {
    setInCache(propertyCache, propertyId, property);
  }

  return property;
}

async function getUnit(unitId) {
  if (!unitId) {
    return null;
  }

  const cached = getFromCache(unitCache, unitId, config.appFolio.unitCacheTtlMs);
  if (cached) {
    return cached;
  }

  const results = await fetchAllPages("/units", { "filters[Id]": unitId });
  const unit = results[0] || null;

  if (unit) {
    setInCache(unitCache, unitId, unit);
  }

  return unit;
}

/* ------------------------------------------------------------------
 * Users (staff) cache - refreshed on its own longer cycle, not part
 * of the 5-minute work order sync.
 * ------------------------------------------------------------------ */

let usersCache = { byId: new Map(), cachedAt: 0 };

async function refreshUsersCache() {
  const users = await fetchAllPages("/users", {
    "filters[LastUpdatedAtFrom]": "2020-01-01T00:00:00Z",
  });

  const byId = new Map();
  users.forEach((user) => {
    byId.set(user.Id, user);
  });

  usersCache = { byId, cachedAt: Date.now() };
  console.log(`[AppFolio] Users cache refreshed - ${byId.size} staff record(s).`);

  return usersCache;
}

async function getUsersCache() {
  const isStale = Date.now() - usersCache.cachedAt > config.appFolio.usersCacheTtlMs;

  if (usersCache.byId.size === 0 || isStale) {
    await refreshUsersCache();
  }

  return usersCache;
}

/**
 * resolveTechnicianEmails
 * ----------------------------------------------------------------
 * Matches a work order's AssignedUsers (Id + Name only) against
 * the Users cache (which DOES have Email) by the stable AppFolio
 * user ID - not by name matching, which would be fragile.
 * ----------------------------------------------------------------
 */
async function resolveTechnicianEmails(assignedUsers) {
  if (!Array.isArray(assignedUsers) || assignedUsers.length === 0) {
    return [];
  }

  const { byId } = await getUsersCache();

  return assignedUsers
    .map((assignedUser) => {
      const userRecord = byId.get(assignedUser.Id);
      return userRecord
        ? { email: userRecord.Email, name: userRecord ? `${userRecord.FirstName} ${userRecord.LastName}`.trim() : assignedUser.Name }
        : { email: null, name: assignedUser.Name };
    })
    .filter((entry) => !!entry.email || !!entry.name);
}

/* ------------------------------------------------------------------
 * Work Orders
 * ------------------------------------------------------------------ */

/**
 * fetchUpdatedWorkOrders
 * ----------------------------------------------------------------
 * sinceIso: ISO timestamp - only work orders updated at or after
 * this moment are returned (AppFolio's LastUpdatedAtFrom filter).
 * ----------------------------------------------------------------
 */
async function fetchUpdatedWorkOrders(sinceIso) {
  return fetchAllPages("/work_orders", {
    "filters[LastUpdatedAtFrom]": sinceIso,
  });
}

/**
 * resolveWorkOrder
 * ----------------------------------------------------------------
 * Takes one raw AppFolio work order and resolves it into the shape
 * "My Assigned Work Orders" actually needs: real property address,
 * unit name, and technician email(s). latitude/longitude are
 * always null here - see the GEOCODING GAP note at the top of this
 * file.
 * ----------------------------------------------------------------
 */
async function resolveWorkOrder(rawWorkOrder) {
  const [property, unit, assignedTechnicians] = await Promise.all([
    getProperty(rawWorkOrder.PropertyId),
    getUnit(rawWorkOrder.UnitId),
    resolveTechnicianEmails(rawWorkOrder.AssignedUsers),
  ]);

  const address = formatPropertyAddress(property);

  // Geocoded once per unique address, then cached permanently on
  // disk (see geocodingService.js) - a failed/unmatched address
  // just leaves latitude/longitude as null rather than blocking
  // this work order from resolving at all.
  const coordinates = await geocodeAddress(address);

  return {
    id: rawWorkOrder.Id,
    workOrder: rawWorkOrder.WorkOrderNumber,
    status: rawWorkOrder.Status,
    priority: rawWorkOrder.Priority,
    description: rawWorkOrder.Description || rawWorkOrder.JobDescription || "",
    jobDescription: rawWorkOrder.JobDescription || rawWorkOrder.Description || "",
    address,
    unitName: unit?.Name || "",
    latitude: coordinates?.latitude ?? null,
    longitude: coordinates?.longitude ?? null,
    assignedTechnicians,
    createdAt: rawWorkOrder.CreatedAt,
    lastUpdatedAt: rawWorkOrder.LastUpdatedAt,
    link: rawWorkOrder.Link,
  };
}

/**
 * resolveWorkOrdersInBulk
 * ----------------------------------------------------------------
 * Resolves a whole batch (e.g. one sync cycle's worth of updated
 * work orders), with a small delay between EACH work order's
 * resolution - a defensive measure specifically for a cold cache
 * (many new, not-yet-cached properties/units at once), staying
 * comfortably under the confirmed real-world 5-requests-per-5-
 * seconds limit rather than firing everything simultaneously.
 * ----------------------------------------------------------------
 */
async function resolveWorkOrdersInBulk(rawWorkOrders) {
  const resolved = [];

  for (const rawWorkOrder of rawWorkOrders) {
    // eslint-disable-next-line no-await-in-loop
    const result = await resolveWorkOrder(rawWorkOrder);
    resolved.push(result);
    // eslint-disable-next-line no-await-in-loop
    await wait(BULK_RESOLVE_DELAY_MS);
  }

  return resolved;
}

module.exports = {
  fetchUpdatedWorkOrders,
  resolveWorkOrder,
  resolveWorkOrdersInBulk,
  getProperty,
  getUnit,
  refreshUsersCache,
};