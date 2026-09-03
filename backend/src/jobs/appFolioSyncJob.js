const cron = require("node-cron");

const config = require("../config/env");
const appFolioService = require("../services/appFolioService");
const assignedWorkOrderStore = require("../services/assignedWorkOrderStore");

/**
 * jobs/appFolioSyncJob.js
 * ----------------------------------------------------------------
 * BACK TO TWO JOBS, but for a different, now-confirmed-real reason
 * than before: the single-job full-replace-every-cycle design
 * (previous version) was hitting AppFolio's own rate limit -
 * confirmed via a real "Retry later" error in production logs -
 * because it re-pulled all ~1000 work orders EVERY single cycle,
 * even when almost nothing had actually changed.
 *
 * 1. INCREMENTAL SYNC (every 1 minute, config.appFolio.syncCron) -
 *    fetches ONLY work orders updated since the last successful
 *    sync of EITHER kind (not always 90 days back) - typically a
 *    handful of records, not ~1000. MERGES these into the existing
 *    store (upsertWorkOrders) - does NOT touch anything else.
 *
 * 2. FULL RECONCILIATION (every 15 minutes,
 *    config.appFolio.reconciliationCron) - the only mechanism that
 *    can catch DELETIONS, since AppFolio's LastUpdatedAtFrom filter
 *    has no way to signal "this record was deleted" - a deleted
 *    work order simply stops appearing in incremental results.
 *    Fetches the full config.appFolio.reconciliationLookbackDays
 *    (90) window and REPLACES the entire store wholesale - anything
 *    missing from that fresh pull is gone.
 *
 * A single shared "lastSyncedAt" timestamp (assignedWorkOrderStore
 * .getLastSyncedAt()) is used by BOTH jobs' "since" calculation, so
 * whichever ran most recently (of either kind) sets the starting
 * point for the next incremental check - no gaps between the two
 * schedules.
 * ----------------------------------------------------------------
 */
function getDefaultSinceIso() {
  // Used only if there is truly no prior sync on record at all
  // (very first run ever) - falls back to the full reconciliation
  // lookback window rather than an arbitrary short window, so the
  // very first sync populates the store completely.
  const lookbackMs = config.appFolio.reconciliationLookbackDays * 24 * 60 * 60 * 1000;
  return new Date(Date.now() - lookbackMs).toISOString();
}

function getReconciliationSinceIso() {
  const lookbackMs = config.appFolio.reconciliationLookbackDays * 24 * 60 * 60 * 1000;
  return new Date(Date.now() - lookbackMs).toISOString();
}

/**
 * runIncrementalSync
 * ----------------------------------------------------------------
 * Small, fast, frequent - only pulls what's genuinely changed since
 * the last successful sync (of either kind).
 * ----------------------------------------------------------------
 */
async function runIncrementalSync() {
  const sinceIso = assignedWorkOrderStore.getLastSyncedAt() || getDefaultSinceIso();

  console.log(`[AppFolio Incremental Sync] Checking for updates since ${sinceIso}...`);

  try {
    const rawWorkOrders = await appFolioService.fetchUpdatedWorkOrders(sinceIso);

    if (rawWorkOrders.length === 0) {
      console.log("[AppFolio Incremental Sync] No updates.");
      // Still advance the shared sync timestamp so the next cycle's
      // window doesn't keep growing indefinitely.
      assignedWorkOrderStore.upsertWorkOrders([], new Date().toISOString());
      return;
    }

    console.log(
      `[AppFolio Incremental Sync] ${rawWorkOrders.length} work order(s) updated - resolving...`
    );

    const resolved = await appFolioService.resolveWorkOrdersInBulk(rawWorkOrders);

    assignedWorkOrderStore.upsertWorkOrders(resolved, new Date().toISOString());

    console.log(`[AppFolio Incremental Sync] Done - ${resolved.length} work order(s) merged in.`);
  } catch (error) {
    console.error(
      "[AppFolio Incremental Sync] Failed:",
      error?.response?.data || error.message
    );
  }
}

/**
 * runFullReconciliation
 * ----------------------------------------------------------------
 * Larger, less frequent - the only pass that can catch deletions,
 * since it fully REPLACES the store rather than merging into it.
 * ----------------------------------------------------------------
 */
async function runFullReconciliation() {
  const sinceIso = getReconciliationSinceIso();

  console.log(
    `[AppFolio Reconciliation] Pulling all work orders since ${sinceIso} for a full store replace...`
  );

  try {
    const rawWorkOrders = await appFolioService.fetchUpdatedWorkOrders(sinceIso);

    console.log(
      `[AppFolio Reconciliation] ${rawWorkOrders.length} work order(s) in the current window - resolving...`
    );

    const resolved = await appFolioService.resolveWorkOrdersInBulk(rawWorkOrders);

    const beforeCount = assignedWorkOrderStore.getAllWorkOrders().length;

    assignedWorkOrderStore.replaceAllWorkOrders(resolved, new Date().toISOString());

    const removedCount = beforeCount - resolved.length;

    console.log(
      `[AppFolio Reconciliation] Done - store now has ${resolved.length} work order(s)` +
        (removedCount > 0
          ? ` (${removedCount} removed - deleted or aged out of the ${config.appFolio.reconciliationLookbackDays}-day window on AppFolio's side).`
          : ".")
    );
  } catch (error) {
    console.error(
      "[AppFolio Reconciliation] Failed - leaving existing store untouched:",
      error?.response?.data || error.message
    );
  }
}

function startAppFolioSyncJob() {
  cron.schedule(config.appFolio.syncCron, runIncrementalSync, {
    timezone: "America/New_York",
  });

  cron.schedule(config.appFolio.reconciliationCron, runFullReconciliation, {
    timezone: "America/New_York",
  });

  console.log(
    `[AppFolio Sync] Incremental scheduled: "${config.appFolio.syncCron}" (America/New_York).`
  );
  console.log(
    `[AppFolio Sync] Reconciliation scheduled: "${config.appFolio.reconciliationCron}" (America/New_York), ${config.appFolio.reconciliationLookbackDays}-day lookback.`
  );

  // Run a full reconciliation once immediately on startup, so the
  // store is completely populated right away rather than waiting
  // for the first scheduled tick of either job.
  runFullReconciliation();
}

module.exports = { startAppFolioSyncJob, runIncrementalSync, runFullReconciliation };