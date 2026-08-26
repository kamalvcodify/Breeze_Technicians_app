const axios = require("axios");
const config = require("../config/env");
const { getAccessToken } = require("./zohoAuthService");

/**
 * services/zohoCrmShiftService.js
 * ----------------------------------------------------------------
 * REST API port of the client-provided Deluge "Login(id)" function.
 * Talks to Zoho CRM (a completely separate API from Zoho Creator -
 * base URL is /crm/v2/..., not /creator/v2.1/data/...) using the
 * SAME OAuth access token as every other Zoho call in this project
 * (getAccessToken() from zohoAuthService.js), since the refresh
 * token has already been authorized with CRM scopes.
 *
 * Per instructions: the Terms & Conditions fields from the original
 * Deluge script (T_C_Accepted / T_C_Accepted_Time) are DELIBERATELY
 * OMITTED here - acceptance is already fully enforced at login
 * (built earlier), so a user who hasn't accepted can never reach
 * this code path at all. No need to re-derive or re-store it here.
 *
 * DATA MODEL (exactly matching the Deluge script, module "Login"):
 *   One record per technician per calendar day, matched by
 *   Name + Record_Date. Top-level "headline" fields summarize the
 *   day (Login_Time/Date, Logout_Time/Date, Hours_Worked). A
 *   subform, login_logout_status_update, holds one row per
 *   individual login/logout session that day (supports multiple
 *   login/logout cycles per day, e.g. a lunch break).
 *
 * FIX: recordLogout() and autoCloseAllOpenSessions() previously only
 * updated the headline Logout_Time/Logout_Date when closing the
 * DAY'S FIRST session (the "isMainLogoutEmpty" branch) - closing any
 * LATER session that same day (second, third, etc.) only updated the
 * matching subform row + Hours_Worked, leaving the headline
 * Logout_Time frozen at whatever the first session's close time was.
 * Confirmed via a real screenshot: headline showed 7:22am while a
 * later subform row correctly showed 10:37am. Both functions now
 * update the headline Logout_Time/Logout_Date on EVERY close,
 * regardless of which session (first or later) is being closed -
 * this field should always reflect the most recent logout, per the
 * original client requirement ("you want the last logout time").
 *
 * FIELD FORMATS: matching exactly what the Deluge script already
 * produces (confirmed as the "format CRM stores") - NOT ISO 8601,
 * since these are plain Date/Text fields, not native DateTime
 * fields:
 *   - Record_Date / Login_Date / Logout_Date / Login_date (subform,
 *     lowercase d) / Logout_Date (subform): "yyyy-MM-dd"
 *   - Login_Time / Logout_Time / Logout_time (subform, lowercase t):
 *     "h:mm a" text, e.g. "6:07 am"
 *   - Hours / Hours_Worked: "X hr Y min" or "Y min" text
 * ----------------------------------------------------------------
 */

const CRM_MODULE = "Login";
const CRM_BASE_URL = "https://www.zohoapis.com/crm/v2";

async function crmRequest(method, path, { params, data } = {}) {
  const accessToken = await getAccessToken();

  const response = await axios({
    method,
    url: `${CRM_BASE_URL}${path}`,
    params,
    data,
    headers: {
      Authorization: `Zoho-oauthtoken ${accessToken}`,
      "Content-Type": "application/json",
    },
    validateStatus: (status) => status === 204 || (status >= 200 && status < 300),
  });

  return response.status === 204 ? { data: [] } : response.data;
}

/* ------------------------------------------------------------------
 * Eastern-time helpers - the technician's login/logout day and time
 * are always computed in US Eastern, regardless of the server's own
 * timezone, and regardless of daylight saving (Intl handles the
 * EST/EDT switch automatically).
 * ------------------------------------------------------------------ */

function getEasternNowParts() {
  const now = new Date();

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(now);

  const map = {};
  parts.forEach((part) => {
    map[part.type] = part.value;
  });

  const dateStr = `${map.year}-${map.month}-${map.day}`;
  const timeStr = `${Number(map.hour)}:${map.minute} ${map.dayPeriod.toLowerCase()}`;

  return { dateStr, timeStr, now };
}

/**
 * Reconstructs a comparable timestamp from a stored "yyyy-MM-dd" +
 * "h:mm a" pair. Both login and logout timestamps are always
 * produced by getEasternNowParts() above and parsed back the same
 * way here, so the millisecond DIFFERENCE between two such values
 * is always correct real elapsed time, even though this doesn't
 * represent true UTC (which doesn't matter - only the duration
 * between two of these matters).
 */
function parseCrmDateAndTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) {
    return null;
  }

  const [year, month, day] = dateStr.split("-").map(Number);
  const match = String(timeStr).trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);

  if (!match) {
    return null;
  }

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem = match[3].toLowerCase();

  if (meridiem === "pm" && hour !== 12) hour += 12;
  if (meridiem === "am" && hour === 12) hour = 0;

  return new Date(Date.UTC(year, month - 1, day, hour, minute));
}

function formatMinutesToHoursString(totalMinutes) {
  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }

  const wholeHours = Math.floor(totalMinutes / 60);
  const remMinutes = totalMinutes - wholeHours * 60;
  return `${wholeHours} hr ${remMinutes} min`;
}

function parseHoursStringToMinutes(hoursStr) {
  if (!hoursStr) {
    return 0;
  }

  try {
    if (hoursStr.includes("hr")) {
      const hrIdx = hoursStr.indexOf("hr");
      const hrPart = hoursStr.slice(0, hrIdx).trim();
      const remainder = hoursStr.slice(hrIdx + 2);
      const minIdx = remainder.indexOf("min");
      const minPart = minIdx >= 0 ? remainder.slice(0, minIdx).trim() : "0";
      return Number(hrPart) * 60 + Number(minPart);
    }

    if (hoursStr.includes("min")) {
      const minIdx = hoursStr.indexOf("min");
      return Number(hoursStr.slice(0, minIdx).trim());
    }
  } catch (error) {
    return 0;
  }

  return 0;
}

function computeElapsedHoursString(startDateStr, startTimeStr, endDateStr, endTimeStr) {
  const startMoment = parseCrmDateAndTime(startDateStr, startTimeStr);
  const endMoment = parseCrmDateAndTime(endDateStr, endTimeStr);

  if (!startMoment || !endMoment) {
    return "0 min";
  }

  const diffMinutes = Math.floor((endMoment.getTime() - startMoment.getTime()) / (1000 * 60));
  return formatMinutesToHoursString(Math.max(diffMinutes, 0));
}

function computeTotalHoursString(sessions) {
  const totalMinutes = sessions.reduce(
    (total, session) => total + parseHoursStringToMinutes(session.Hours),
    0
  );

  return formatMinutesToHoursString(totalMinutes);
}

/* ------------------------------------------------------------------
 * CRM record helpers
 * ------------------------------------------------------------------ */

function escapeForCriteria(value) {
  return String(value || "").replace(/"/g, '\\"');
}

async function findTodaysRecord(technicianName, dateStr) {
  const criteria = `(Name:equals:${escapeForCriteria(technicianName)})and(Record_Date:equals:${dateStr})`;

  try {
    const result = await crmRequest("get", `/${CRM_MODULE}/search`, {
      params: { criteria },
    });

    return Array.isArray(result?.data) && result.data.length > 0 ? result.data[0] : null;
  } catch (error) {
    if (error?.response?.status === 204) {
      return null;
    }
    throw error;
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * findTodaysRecordWithRetry
 * ----------------------------------------------------------------
 * FIX: findTodaysRecord's plain search can come back empty for a
 * few moments right after a record is created - Zoho's search
 * index has a brief propagation delay, same class of issue already
 * hit once tonight with a different module. This is most visible
 * when Logout is called very soon after Login (e.g. rapid manual
 * testing) - the search for the record Login just created can
 * momentarily miss it, and the code was silently treating "not
 * found yet" as "genuinely doesn't exist", returning a misleading
 * HTTP 200 without actually updating anything. Retries a few times
 * with a short growing delay before concluding the record really
 * doesn't exist.
 * ----------------------------------------------------------------
 */
async function findTodaysRecordWithRetry(technicianName, dateStr) {
  const delaysMs = [0, 800, 1500];

  for (let attempt = 0; attempt < delaysMs.length; attempt += 1) {
    if (delaysMs[attempt] > 0) {
      // eslint-disable-next-line no-await-in-loop
      await wait(delaysMs[attempt]);
    }

    // eslint-disable-next-line no-await-in-loop
    const found = await findTodaysRecord(technicianName, dateStr);

    if (found) {
      return found;
    }
  }

  return null;
}

async function getFullRecord(recordId) {
  const result = await crmRequest("get", `/${CRM_MODULE}/${recordId}`);
  return Array.isArray(result?.data) && result.data.length > 0 ? result.data[0] : null;
}

async function createRecord(data) {
  const result = await crmRequest("post", `/${CRM_MODULE}`, {
    data: { data: [data] },
  });

  const entry = result?.data?.[0];
  return {
    success: entry?.code === "SUCCESS",
    recordId: entry?.details?.id || null,
    raw: result,
  };
}

async function updateRecord(recordId, data) {
  const result = await crmRequest("put", `/${CRM_MODULE}/${recordId}`, {
    data: { data: [data] },
  });

  const entry = result?.data?.[0];
  return {
    success: entry?.code === "SUCCESS",
    raw: result,
  };
}

function hasOpenSession(sessions) {
  return sessions.some((row) => {
    const hasLogin = !!(row.Login_date || row.Login_Time);
    const isLogoutEmpty = !row.Logout_time && !row.Logout_Date;
    return hasLogin && isLogoutEmpty;
  });
}

function findOpenSessionIndex(sessions) {
  let openIndex = -1;
  sessions.forEach((row, index) => {
    if (!row.Logout_time) {
      openIndex = index;
    }
  });
  return openIndex;
}

/* ------------------------------------------------------------------
 * Public: recordLogin / recordLogout
 * ------------------------------------------------------------------ */

async function recordLogin({ technicianEmail, technicianName }) {
  const { dateStr, timeStr } = getEasternNowParts();

  const firstRow = {
    Hours: "",
    Logout_time: "",
    Login_date: dateStr,
    Login_Time: timeStr,
    Logout_Date: "",
  };

  const existing = await findTodaysRecord(technicianName, dateStr);

  if (!existing) {
    const mainData = {
      Name: technicianName,
      Email: technicianEmail,
      Record_Date: dateStr,
      Login_Time: timeStr,
      Login_Date: dateStr,
      Logout_Time: "",
      Logout_Date: "",
      login_logout_status_update: [firstRow],
    };

    const created = await createRecord(mainData);

    if (created.success) {
      return { detail: "You have successfully logged in.", synced: true };
    }

    const recheck = await findTodaysRecord(technicianName, dateStr);

    if (recheck) {
      const fullRecord = await getFullRecord(recheck.id);
      const sessions = fullRecord.login_logout_status_update || [];
      sessions.push(firstRow);

      await updateRecord(recheck.id, { login_logout_status_update: sessions });
      return { detail: "You have successfully logged in.", synced: true };
    }

    throw new Error("Could not create today's login record in Zoho CRM.");
  }

  const fullRecord = await getFullRecord(existing.id);

  const mainLoginTime = fullRecord.Login_Time;
  const mainLoginDate = fullRecord.Login_Date;
  const mainLogoutTime = fullRecord.Logout_Time;
  const mainLogoutDate = fullRecord.Logout_Date;

  const isMainEmpty =
    (!mainLoginTime && !mainLoginDate) && (!mainLogoutTime && !mainLogoutDate);

  if (isMainEmpty) {
    await updateRecord(existing.id, {
      Login_Time: timeStr,
      Login_Date: dateStr,
      login_logout_status_update: [firstRow],
    });

    return { detail: "You have successfully logged in.", synced: true };
  }

  const existingSessions = fullRecord.login_logout_status_update || [];

  if (hasOpenSession(existingSessions)) {
    return {
      detail: "You already have an open login session today. Please log out before logging in again.",
      synced: true,
      blocked: true,
    };
  }

  existingSessions.push(firstRow);
  await updateRecord(existing.id, { login_logout_status_update: existingSessions });

  return { detail: "You have successfully logged in.", synced: true };
}

async function recordLogout({ technicianEmail, technicianName }) {
  const { dateStr, timeStr, now } = getEasternNowParts();

  const existing = await findTodaysRecordWithRetry(technicianName, dateStr);

  if (!existing) {
    return {
      detail: "There is no open login record found today (or the session has already been logged out).",
      synced: true,
      blocked: true,
    };
  }

  const fullRecord = await getFullRecord(existing.id);

  const mainLoginTime = fullRecord.Login_Time;
  const mainLoginDate = fullRecord.Login_Date;
  const mainLogoutTime = fullRecord.Logout_Time;
  const mainLogoutDate = fullRecord.Logout_Date;

  const isMainLogoutEmpty = !mainLogoutTime && !mainLogoutDate;

  if (isMainLogoutEmpty && mainLoginTime) {
    const hoursStr = computeElapsedHoursString(mainLoginDate, mainLoginTime, dateStr, timeStr);

    const sessions = fullRecord.login_logout_status_update || [];
    let closedOne = false;

    const updatedSessions = sessions.map((row) => {
      if (!closedOne && !row.Logout_time) {
        closedOne = true;
        return { ...row, Logout_time: timeStr, Logout_Date: dateStr, Hours: hoursStr };
      }
      return row;
    });

    const totalHoursStr = computeTotalHoursString(updatedSessions);

    await updateRecord(existing.id, {
      Logout_Time: timeStr,
      Logout_Date: dateStr,
      Hours_Worked: totalHoursStr,
      login_logout_status_update: updatedSessions,
    });

    return { detail: "You have logged out.", synced: true };
  }

  const sessions = fullRecord.login_logout_status_update || [];
  const openIndex = findOpenSessionIndex(sessions);

  if (openIndex < 0) {
    return {
      detail: "There is no open login session found today (or the session has already been logged out).",
      synced: true,
      blocked: true,
    };
  }

  const openRow = sessions[openIndex];
  const hoursStr = computeElapsedHoursString(openRow.Login_date, openRow.Login_Time, dateStr, timeStr);

  const updatedSessions = sessions.map((row, index) =>
    index === openIndex
      ? { ...row, Logout_time: timeStr, Logout_Date: dateStr, Hours: hoursStr }
      : row
  );

  const totalHoursStr = computeTotalHoursString(updatedSessions);

  // FIX: the headline Logout_Time/Logout_Date are now ALWAYS updated
  // here too, not just in the isMainLogoutEmpty branch above - this
  // field should reflect the MOST RECENT logout regardless of
  // whether it's the day's first session or a later one.
  await updateRecord(existing.id, {
    Logout_Time: timeStr,
    Logout_Date: dateStr,
    Hours_Worked: totalHoursStr,
    login_logout_status_update: updatedSessions,
  });

  return { detail: "You have logged out.", synced: true };
}

/**
 * autoCloseAllOpenSessions
 * ----------------------------------------------------------------
 * Called by the 5:00 PM ET daily cron job (see jobs/
 * autoEndShiftJob.js). Finds every "Login" record for TODAY (across
 * all technicians) that still has an open session, and closes it
 * automatically - exactly like a manual logout, computed at the
 * moment this job runs. Technicians can start a new shift again
 * afterward; this only closes what's currently open, it does not
 * lock anything.
 * ----------------------------------------------------------------
 */
async function autoCloseAllOpenSessions() {
  const { dateStr, timeStr, now } = getEasternNowParts();

  let todaysRecords = [];

  try {
    const result = await crmRequest("get", `/${CRM_MODULE}/search`, {
      params: { criteria: `(Record_Date:equals:${dateStr})` },
    });
    todaysRecords = Array.isArray(result?.data) ? result.data : [];
  } catch (error) {
    if (error?.response?.status === 204) {
      todaysRecords = [];
    } else {
      throw error;
    }
  }

  let closedCount = 0;

  for (const record of todaysRecords) {
    // eslint-disable-next-line no-await-in-loop
    const fullRecord = await getFullRecord(record.id);

    const mainLoginTime = fullRecord.Login_Time;
    const mainLoginDate = fullRecord.Login_Date;
    const mainLogoutTime = fullRecord.Logout_Time;
    const mainLogoutDate = fullRecord.Logout_Date;

    const isMainLogoutEmpty = !mainLogoutTime && !mainLogoutDate;
    const sessions = fullRecord.login_logout_status_update || [];

    if (isMainLogoutEmpty && mainLoginTime) {
      const hoursStr = computeElapsedHoursString(mainLoginDate, mainLoginTime, dateStr, timeStr);

      let closedOne = false;
      const updatedSessions = sessions.map((row) => {
        if (!closedOne && !row.Logout_time) {
          closedOne = true;
          return { ...row, Logout_time: timeStr, Logout_Date: dateStr, Hours: hoursStr };
        }
        return row;
      });

      const totalHoursStr = computeTotalHoursString(updatedSessions);

      // eslint-disable-next-line no-await-in-loop
      await updateRecord(record.id, {
        Logout_Time: timeStr,
        Logout_Date: dateStr,
        Hours_Worked: totalHoursStr,
        login_logout_status_update: updatedSessions,
      });

      closedCount += 1;
      continue;
    }

    const openIndex = findOpenSessionIndex(sessions);

    if (openIndex >= 0) {
      const openRow = sessions[openIndex];
      const hoursStr = computeElapsedHoursString(openRow.Login_date, openRow.Login_Time, dateStr, timeStr);

      const updatedSessions = sessions.map((row, index) =>
        index === openIndex
          ? { ...row, Logout_time: timeStr, Logout_Date: dateStr, Hours: hoursStr }
          : row
      );

      const totalHoursStr = computeTotalHoursString(updatedSessions);

      // FIX: same as recordLogout above - always update the headline
      // Logout_Time/Logout_Date, not just when closing the day's
      // first session.
      // eslint-disable-next-line no-await-in-loop
      await updateRecord(record.id, {
        Logout_Time: timeStr,
        Logout_Date: dateStr,
        Hours_Worked: totalHoursStr,
        login_logout_status_update: updatedSessions,
      });

      closedCount += 1;
    }
  }

  return { closedCount, checkedCount: todaysRecords.length };
}

module.exports = {
  recordLogin,
  recordLogout,
  autoCloseAllOpenSessions,
};