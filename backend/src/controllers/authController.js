const jwt = require("jsonwebtoken");
const config = require("../config/env");
const zohoUserService = require("../services/zohoUserService");
const { hashPassword, verifyPassword } = require("../services/passwordService");

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function signToken(user) {
  return jwt.sign(
    { email: user.email, isAdmin: user.isAdmin },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
}

function readIsAdmin(record) {
  const raw = record[config.zoho.fields.isAdmin];
  return raw === "Yes";
}

function readEmail(record) {
  return record[config.zoho.fields.email];
}

function readPasswordHash(record) {
  return record[config.zoho.fields.password];
}

function readName(record) {
  return record[config.zoho.fields.name] || "";
}

function readCity(record) {
  return record[config.zoho.fields.city] || "";
}

/**
 * readTermsAccepted
 * ----------------------------------------------------------------
 * NEW - reads the Term_Conditions dropdown field (values:
 * "Accepted" / "Not Accepted"). Treated as accepted ONLY when the
 * value is exactly "Accepted" - any other value (including blank/
 * missing, for accounts created before this field existed) is
 * treated as not yet accepted, which is the safer default.
 * ----------------------------------------------------------------
 */
function readTermsAccepted(record) {
  return record[config.zoho.fields.termsAccepted] === "Accepted";
}

/**
 * checkEmail
 * ----------------------------------------------------------------
 * UPDATED: now also returns termsAccepted alongside exists. The
 * frontend uses this at the email-entry step (before password) to
 * decide whether to show the Terms & Conditions acceptance screen
 * instead of the password field.
 * ----------------------------------------------------------------
 */
async function checkEmail(req, res) {
  const email = normalizeEmail(req.body.email);
  if (!isValidEmail(email)) {
    return res.status(400).json({ detail: "Please provide a valid email address." });
  }

  const record = await zohoUserService.findUserByEmail(email);

  if (!record) {
    return res.json({ exists: false, termsAccepted: false });
  }

  return res.json({
    exists: true,
    termsAccepted: readTermsAccepted(record),
  });
}

/**
 * acceptTerms
 * ----------------------------------------------------------------
 * NEW - called when the user taps "I Accept" on the Terms &
 * Conditions screen, before the password step. Updates the Users
 * record's Term_Conditions field to "Accepted" so this is never
 * shown again for this account.
 * ----------------------------------------------------------------
 */
async function acceptTerms(req, res) {
  const email = normalizeEmail(req.body.email);

  if (!isValidEmail(email)) {
    return res.status(400).json({ detail: "Please provide a valid email address." });
  }

  const record = await zohoUserService.findUserByEmail(email);

  if (!record) {
    return res.status(404).json({ detail: "No account found for this email." });
  }

  await zohoUserService.updateUserTermsAccepted(record.ID, true);

  return res.json({ detail: "Terms and conditions accepted." });
}

async function login(req, res) {
  const email = normalizeEmail(req.body.email);
  const password = req.body.password;

  if (!email || !password) {
    return res.status(400).json({ detail: "Email and password are required." });
  }

  const record = await zohoUserService.findUserByEmail(email);
  if (!record) {
    return res.status(401).json({ detail: "Incorrect email or password." });
  }

  const passwordMatches = await verifyPassword(password, readPasswordHash(record));
  if (!passwordMatches) {
    return res.status(401).json({ detail: "Incorrect email or password." });
  }

  const user = {
    email: readEmail(record),
    isAdmin: readIsAdmin(record),
    name: readName(record),
    city: readCity(record),
  };

  const token = signToken(user);

  return res.json({
    token,
    email: user.email,
    isAdmin: user.isAdmin,
    name: user.name,
    city: user.city,
  });
}

async function signup(req, res) {
  const email = normalizeEmail(req.body.email);
  const password = req.body.password;

  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ detail: "Please provide a valid email address." });
  }
  if (!password || password.length < 8) {
    return res.status(400).json({ detail: "Password must be at least 8 characters." });
  }

  const existing = await zohoUserService.findUserByEmail(email);
  if (existing) {
    return res.status(400).json({ detail: "An account with this email already exists." });
  }

  const passwordHash = await hashPassword(password);
  await zohoUserService.createUser({ email, passwordHash, isAdmin: false });

  return res.status(201).json({ email, detail: "Account created. You can now log in." });
}

async function forgotPassword(req, res) {
  const email = normalizeEmail(req.body.email);
  const currentPassword = req.body.temp_password;
  const newPassword = req.body.new_password;

  if (!email || !currentPassword || !newPassword) {
    return res.status(400).json({ detail: "Email, current password and new password are required." });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ detail: "New password must be at least 8 characters." });
  }

  const record = await zohoUserService.findUserByEmail(email);
  if (!record) {
    return res.status(404).json({ detail: "No account found for this email." });
  }

  const matches = await verifyPassword(currentPassword, readPasswordHash(record));
  if (!matches) {
    return res.status(400).json({ detail: "The current/temporary password is incorrect." });
  }

  const newHash = await hashPassword(newPassword);
  await zohoUserService.updateUserPassword(record.ID, newHash);

  return res.json({ detail: "Password updated successfully. You can now log in." });
}

module.exports = { checkEmail, login, signup, forgotPassword, acceptTerms };