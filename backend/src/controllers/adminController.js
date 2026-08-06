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

function toPublicUser(record) {
  return {
    id: record.ID,
    email: record[config.zoho.fields.email],
    isAdmin: record[config.zoho.fields.isAdmin] === "Yes",
  };
}

async function addUser(req, res) {
  const email = normalizeEmail(req.body.email);
  const isAdmin = Boolean(req.body.isAdmin);

  if (!isValidEmail(email)) {
    return res.status(400).json({ detail: "Please provide a valid email address." });
  }

  const existing = await zohoUserService.findUserByEmail(email);
  if (existing) {
    return res.status(400).json({ detail: "A user with this email already exists." });
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);

  await zohoUserService.createUser({ email, passwordHash, isAdmin });

  const emailResult = await sendTempPasswordEmail({ toEmail: email, tempPassword, isAdmin });

  return res.status(201).json({
    email,
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

module.exports = { addUser, listUsers };