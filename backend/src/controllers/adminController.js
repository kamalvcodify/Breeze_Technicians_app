const config = require("../config/env");
const zohoUserService = require("../services/zohoUserService");
const { hashPassword, generateTempPassword } = require("../services/passwordService");
const { sendTempPasswordEmail } = require("../services/emailService");

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * toPublicUser
 * ----------------------------------------------------------------
 * Also returns name/city - the frontend's "Existing users" list row
 * displays these, but without reading them here they'd silently
 * show blank/fallback to email only.
 * ----------------------------------------------------------------
 */
function toPublicUser(record) {
  return {
    id: record.ID,
    email: record[config.zoho.fields.email],
    name: record[config.zoho.fields.name],
    city: record[config.zoho.fields.city],
    isAdmin: record[config.zoho.fields.isAdmin] === "Yes",
  };
}

async function addUser(req, res) {
  const email = normalizeEmail(req.body.email);

  const name = String(req.body.name || "").trim();
  const city = String(req.body.city || "").trim();

  const isAdmin = Boolean(req.body.isAdmin);

  if (!isValidEmail(email)) {
    return res.status(400).json({ detail: "Please provide a valid email address." });
  }

  if (!name) {
    return res.status(400).json({ detail: "Please provide the technician's name." });
  }

  if (!city) {
    return res.status(400).json({ detail: "Please select a city." });
  }

  const existing = await zohoUserService.findUserByEmail(email);
  if (existing) {
    return res.status(400).json({ detail: "A user with this email already exists." });
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);

  await zohoUserService.createUser({ name, city, email, passwordHash, isAdmin });

  const emailResult = await sendTempPasswordEmail({ toEmail: email, tempPassword, isAdmin });

  return res.status(201).json({
    email,
    name,
    city,
    isAdmin,
    emailDelivered: emailResult.delivered,
    detail: emailResult.delivered
      ? "User created and the temporary password was emailed to them."
      : "User created. SMTP is not configured, so check the backend console for the temporary password.",
  });
}

async function listUsers(req, res) {
  const records = await zohoUserService.listUsers();
  return res.json({ users: records.map(toPublicUser) });
}

/**
 * findRecordById
 * ----------------------------------------------------------------
 * NEW - small helper shared by the 3 functions below.
 * zohoUserService only exposes findUserByEmail, not by ID, and the
 * list of users is small enough that fetching the full list and
 * finding the match is simpler than adding a new Zoho lookup
 * function just for this.
 * ----------------------------------------------------------------
 */
async function findRecordById(id) {
  const records = await zohoUserService.listUsers();
  return records.find((record) => String(record.ID) === String(id)) || null;
}

/**
 * deleteUser
 * ----------------------------------------------------------------
 * PERMANENTLY removes the record from Zoho Creator. An admin
 * cannot delete their OWN account (a safety guard against
 * accidental lockout).
 * ----------------------------------------------------------------
 */
async function deleteUser(req, res) {
  const { id } = req.params;

  const record = await findRecordById(id);

  if (!record) {
    return res.status(404).json({ detail: "User not found." });
  }

  if (normalizeEmail(record[config.zoho.fields.email]) === normalizeEmail(req.user.email)) {
    return res.status(400).json({ detail: "You cannot delete your own account." });
  }

  await zohoUserService.deleteUser(record.ID);

  return res.json({ detail: "User deleted." });
}

module.exports = {
  addUser,
  listUsers,
  deleteUser,
};