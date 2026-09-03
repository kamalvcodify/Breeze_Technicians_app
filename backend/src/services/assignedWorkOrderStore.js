const fs = require("fs");
const path = require("path");

/**
 * services/assignedWorkOrderStore.js
 * ----------------------------------------------------------------
 * Simple JSON-file-backed local store for AppFolio-resolved work
 * orders - "My Assigned Work Orders" reads from HERE, not from
 * AppFolio directly. This is the whole point of the background
 * sync design: the app stays fast and never waits on AppFolio's
 * live response time, and AppFolio's own API only ever sees the
 * periodic sync job's traffic, never per-screen-load traffic from
 * technicians.
 *
 * Same file-backed pattern already used elsewhere in this project
 * (trackingSessionStore.js) - fine for this data's scale and
 * update frequency.
 * ----------------------------------------------------------------
 */
const STORE_FILE = path.join(__dirname, "../../data/assigned-work-orders.json");

function ensureDataDir() {
  const dir = path.dirname(STORE_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readStore() {
  try {
    ensureDataDir();
    if (!fs.existsSync(STORE_FILE)) {
      return { workOrdersById: {}, lastSyncedAt: null };
    }
    const raw = fs.readFileSync(STORE_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return {
      workOrdersById: parsed.workOrdersById || {},
      lastSyncedAt: parsed.lastSyncedAt || null,
    };
  } catch (error) {
    console.error("[AssignedWorkOrderStore] Failed to read store:", error.message);
    return { workOrdersById: {}, lastSyncedAt: null };
  }
}

function writeStore(data) {
  try {
    ensureDataDir();
    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (error) {
    console.error("[AssignedWorkOrderStore] Failed to write store:", error.message);
  }
}

/**
 * Merges a batch of newly-resolved work orders into the existing
 * store, keyed by AppFolio's own work order Id - each sync cycle
 * only brings back what CHANGED, so this must merge, not replace.
 */
function upsertWorkOrders(resolvedWorkOrders, syncedAtIso) {
  const store = readStore();

  resolvedWorkOrders.forEach((workOrder) => {
    store.workOrdersById[workOrder.id] = workOrder;
  });

  store.lastSyncedAt = syncedAtIso;
  writeStore(store);
}

/**
 * replaceAllWorkOrders
 * ----------------------------------------------------------------
 * NEW - used by the daily full-reconciliation job (see jobs/
 * appFolioSyncJob.js's runFullReconciliation) to handle TRUE
 * deletions. The 5-minute incremental sync (upsertWorkOrders above)
 * correctly handles updates, but AppFolio's LastUpdatedAtFrom
 * filter has no way to signal "this record was deleted" - a
 * deleted work order simply stops appearing in results, so
 * upsertWorkOrders alone would leave it in the store forever.
 *
 * This function REPLACES the entire store wholesale with a fresh,
 * complete pull - anything genuinely removed from AppFolio's side
 * correctly disappears here too, since it's simply absent from the
 * new complete list.
 * ----------------------------------------------------------------
 */
function replaceAllWorkOrders(resolvedWorkOrders, syncedAtIso) {
  const workOrdersById = {};

  resolvedWorkOrders.forEach((workOrder) => {
    workOrdersById[workOrder.id] = workOrder;
  });

  writeStore({ workOrdersById, lastSyncedAt: syncedAtIso });
}

function getAllWorkOrders() {
  const store = readStore();
  return Object.values(store.workOrdersById);
}

function getLastSyncedAt() {
  return readStore().lastSyncedAt;
}

/**
 * getWorkOrdersForTechnician
 * ----------------------------------------------------------------
 * Filters the full store by matching the technician's email
 * against each work order's resolved assignedTechnicians list.
 * ----------------------------------------------------------------
 */
function getWorkOrdersForTechnician(technicianEmail) {
  const normalizedEmail = String(technicianEmail || "").trim().toLowerCase();

  if (!normalizedEmail) {
    return [];
  }

  return getAllWorkOrders().filter((workOrder) =>
    (workOrder.assignedTechnicians || []).some(
      (tech) => String(tech.email || "").trim().toLowerCase() === normalizedEmail
    )
  );
}

module.exports = {
  upsertWorkOrders,
  replaceAllWorkOrders,
  getAllWorkOrders,
  getLastSyncedAt,
  getWorkOrdersForTechnician,
};