const cron = require("node-cron");

const config = require("../config/env");
const zohoCrmShiftService = require("../services/zohoCrmShiftService");

/**
 * jobs/autoEndShiftJob.js
 * ----------------------------------------------------------------
 * Runs once daily and automatically closes out any technician's
 * shift still open at that point. The exact time is now configured
 * via .env (AUTO_END_SHIFT_CRON) instead of hardcoded - to change
 * when this runs, just update that one value and restart the
 * backend, no code change needed.
 *
 * Default: "0 17 * * *" = 5:00 PM daily. Cron format is
 * "minute hour day month weekday" - e.g. "30 16 * * *" = 4:30 PM,
 * "0 18 * * *" = 6:00 PM.
 *
 * node-cron's `timezone` option handles the EST/EDT switch
 * automatically - no manual daylight-saving math needed.
 *
 * Technicians CAN start a new shift again after this runs - this
 * only closes whatever is currently open, it does not lock the
 * toggle button or prevent starting again later that same day.
 * ----------------------------------------------------------------
 */
function startAutoEndShiftJob() {
  const cronExpression = config.zoho.autoEndShift.cronExpression;

  cron.schedule(
    cronExpression,
    async () => {
      console.log(`[Auto End Shift] Running scheduled auto-close check (${cronExpression} ET)...`);

      try {
        const result = await zohoCrmShiftService.autoCloseAllOpenSessions();
        console.log(
          `[Auto End Shift] Checked ${result.checkedCount} record(s), closed ${result.closedCount} open session(s).`
        );
      } catch (error) {
        console.error("[Auto End Shift] Failed:", error?.response?.data || error.message);
      }
    },
    {
      timezone: "America/New_York",
    }
  );

  console.log(`[Auto End Shift] Scheduled: "${cronExpression}" (America/New_York).`);
}

module.exports = { startAutoEndShiftJob };