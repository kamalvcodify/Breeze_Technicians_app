const zohoCrmShiftService = require("../services/zohoCrmShiftService");

function cleanText(value) {
  return String(value || "").trim();
}

/**
 * controllers/simpleShiftController.js
 * ----------------------------------------------------------------
 * Handles the header bar's Start Shift/End Shift toggle button -
 * now wired to the real Zoho CRM "Login" module (previously a
 * placeholder that only logged to the console). Completely
 * separate from TechnicianShiftScreen.js's existing GPS-based
 * tracking system, which is untouched.
 *
 * technicianEmail comes from the authenticated request
 * (req.user.email), never trusted from the request body.
 * technicianName is sent by the frontend (from useAuth()'s stored
 * profile), since the JWT itself only encodes email/isAdmin, not
 * name - see ShiftToggleButton.js.
 * ----------------------------------------------------------------
 */
async function startShift(req, res) {
  const technicianName = cleanText(req.body?.technicianName);

  if (!technicianName) {
    return res.status(400).json({ detail: "Technician name is required to start a shift." });
  }

  const result = await zohoCrmShiftService.recordLogin({
    technicianEmail: req.user.email,
    technicianName,
  });

  return res.status(200).json(result);
}

async function endShift(req, res) {
  const technicianName = cleanText(req.body?.technicianName);

  if (!technicianName) {
    return res.status(400).json({ detail: "Technician name is required to end a shift." });
  }

  const result = await zohoCrmShiftService.recordLogout({
    technicianEmail: req.user.email,
    technicianName,
  });

  return res.status(200).json(result);
}

module.exports = {
  startShift,
  endShift,
};