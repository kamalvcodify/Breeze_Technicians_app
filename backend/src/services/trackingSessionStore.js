/**
 * services/trackingSessionStore.js
 * ----------------------------------------------------------------
 * Temporary local persistence for tracking sessions, used only
 * until the real Zoho Creator sync (see trackingService.js) is
 * switched on. Sessions are stored as a plain JSON file on disk so
 * a Start -> Break -> Continue -> Stop flow survives a backend
 * restart during development/testing.
 *
 * This is intentionally a small, self-contained key-value file
 * store - not a database - so it is trivial to delete later once
 * Zoho Creator is the real source of truth. Nothing outside this
 * file should read/write the JSON file directly.
 * ----------------------------------------------------------------
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const config = require("../config/env");

const STORE_FILE_PATH = path.resolve(process.cwd(), config.tracking.sessionStoreFilePath);

function ensureStoreFileExists() {
  const directory = path.dirname(STORE_FILE_PATH);

  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }

  if (!fs.existsSync(STORE_FILE_PATH)) {
    fs.writeFileSync(STORE_FILE_PATH, JSON.stringify({ sessions: {} }, null, 2), "utf8");
  }
}

function readStore() {
  ensureStoreFileExists();

  try {
    const raw = fs.readFileSync(STORE_FILE_PATH, "utf8");
    const parsed = JSON.parse(raw);

    if (!parsed || typeof parsed !== "object" || !parsed.sessions) {
      return { sessions: {} };
    }

    return parsed;
  } catch (error) {
    console.error(
      "[Tracking Session Store] Could not read/parse the session store file, starting fresh:",
      error.message
    );
    return { sessions: {} };
  }
}

function writeStore(store) {
  ensureStoreFileExists();
  fs.writeFileSync(STORE_FILE_PATH, JSON.stringify(store, null, 2), "utf8");
}

function generateSessionId() {
  return `sess_${crypto.randomBytes(12).toString("hex")}`;
}

/**
 * Creates a new session record and persists it.
 * Returns the full session object, including its new id.
 */
function createSession(sessionData) {
  const store = readStore();

  const sessionId = generateSessionId();
  const now = new Date().toISOString();

  const session = {
    sessionId,
    createdAt: now,
    updatedAt: now,
    ...sessionData,
  };

  store.sessions[sessionId] = session;
  writeStore(store);

  return session;
}

/**
 * Returns a session by id, or null if it does not exist.
 */
function getSessionById(sessionId) {
  if (!sessionId) {
    return null;
  }

  const store = readStore();
  return store.sessions[sessionId] || null;
}

/**
 * Finds the most recent non-ended session for a given technician +
 * Work Order pair. Useful for resuming state if the app was closed
 * and reopened mid-shift (GET /api/tracking/session).
 */
function findActiveSessionForWorkOrder({ technicianEmail, workOrderId }) {
  const store = readStore();

  const matches = Object.values(store.sessions).filter(
    (session) =>
      session.technicianEmail === technicianEmail &&
      session.workOrderId === workOrderId &&
      session.status !== "Stopped"
  );

  if (matches.length === 0) {
    return null;
  }

  // Most recently created/updated match wins.
  matches.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  return matches[0];
}

/**
 * Updates an existing session with a partial patch and persists it.
 * Returns the updated session, or null if the session did not exist.
 */
function updateSession(sessionId, patch) {
  const store = readStore();
  const existing = store.sessions[sessionId];

  if (!existing) {
    return null;
  }

  const updated = {
    ...existing,
    ...patch,
    updatedAt: new Date().toISOString(),
  };

  store.sessions[sessionId] = updated;
  writeStore(store);

  return updated;
}

/**
 * Appends a single location point to a session's in-memory log
 * array. Kept simple (an array on the session record) since this is
 * throwaway local storage, not the final Location Logs destination.
 */
function appendLocationPoint(sessionId, point) {
  const store = readStore();
  const existing = store.sessions[sessionId];

  if (!existing) {
    return null;
  }

  const locationLog = Array.isArray(existing.locationLog) ? existing.locationLog : [];
  locationLog.push({ ...point, recordedAt: new Date().toISOString() });

  const updated = {
    ...existing,
    locationLog,
    updatedAt: new Date().toISOString(),
  };

  store.sessions[sessionId] = updated;
  writeStore(store);

  return updated;
}

module.exports = {
  createSession,
  getSessionById,
  findActiveSessionForWorkOrder,
  updateSession,
  appendLocationPoint,
};