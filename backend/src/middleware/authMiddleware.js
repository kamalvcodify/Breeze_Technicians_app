const jwt = require("jsonwebtoken");
const config = require("../config/env");

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ detail: "Missing or invalid Authorization header." });
  }

  try {
    const payload = jwt.verify(token, config.jwt.secret);
    req.user = payload; // { email, isAdmin }
    return next();
  } catch (err) {
    return res.status(401).json({ detail: "Invalid or expired session. Please log in again." });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ detail: "Admin access required." });
  }
  return next();
}

module.exports = { requireAuth, requireAdmin };
