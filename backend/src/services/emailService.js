const nodemailer = require("nodemailer");
const config = require("../config/env");

function isEmailConfigured() {
  return Boolean(config.email.user && config.email.password);
}

function buildTransport() {
  return nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.port === 465,
    auth: {
      user: config.email.user,
      pass: config.email.password,
    },
  });
}

/**
 * Sends the "here is your temporary password" email to a newly added user.
 * If SMTP credentials are not set in .env, this just logs to the console
 * instead of failing, so local development keeps working either way.
 */
async function sendTempPasswordEmail({ toEmail, tempPassword, isAdmin }) {
  const subject = "Your Breeze Technician App account";
  const roleLabel = isAdmin ? "Admin" : "Technician";
  const text =
    `Hi,\n\n` +
    `An account has been created for you on the Breeze Technician App (role: ${roleLabel}).\n\n` +
    `Email: ${toEmail}\n` +
    `Temporary password: ${tempPassword}\n\n` +
    `Please log in and use "Forgot password" with this temporary password to set your own password.\n\n` +
    `- Breeze Property Group`;

  if (!isEmailConfigured()) {
    console.log("\n[Email - console fallback, SMTP not configured in .env]");
    console.log(`To: ${toEmail}`);
    console.log(`Subject: ${subject}`);
    console.log(text);
    console.log("[End of email]\n");
    return { delivered: false, reason: "SMTP not configured" };
  }

  const transporter = buildTransport();
  await transporter.sendMail({
    from: config.email.from,
    to: toEmail,
    subject,
    text,
  });

  return { delivered: true };
}

module.exports = { sendTempPasswordEmail };
