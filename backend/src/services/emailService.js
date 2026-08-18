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
 *
 * UPDATED: the "how to reset" instructions now correctly reflect the
 * actual login flow (email -> Continue -> Forgot password appears),
 * rendered as a clear numbered list instead of one paragraph.
 */
async function sendTempPasswordEmail({ toEmail, tempPassword, isAdmin }) {
  const subject = "Welcome to the Breeze Technician App";
  const roleLabel = isAdmin ? "Admin" : "Technician";

  const text =
    `Hi,\n\n` +
    `You've been added as a ${roleLabel} on the Breeze Technician App.\n\n` +
    `Email: ${toEmail}\n` +
    `Temporary password: ${tempPassword}\n\n` +
    `Please change this password as soon as possible:\n` +
    `1. Open the app\n` +
    `2. Enter your email and tap Continue\n` +
    `3. Tap "Forgot password" and use this temporary password to set your own\n\n` +
    `- Breeze Property Group`;

  const html = `
    <div style="margin:0; padding:32px 16px; background-color:#f5f6f8; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px; margin:0 auto; background-color:#ffffff; border-radius:12px; overflow:hidden; border:1px solid #e2e5ea;">
        <tr>
          <td style="background-color:#0f1b33; padding:24px 32px;">
            <div style="font-size:18px; font-weight:700; color:#3b82f6; letter-spacing:0.5px;">BREEZE</div>
            <div style="font-size:11px; font-weight:600; color:#c7d0e0; letter-spacing:1.5px; margin-top:2px;">PROPERTY GROUP</div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h1 style="margin:0 0 4px; font-size:20px; color:#111827;">Welcome to the team</h1>
            <p style="margin:0 0 24px; font-size:14px; color:#6b7280;">
              You've been added as a <strong style="color:#111827;">${roleLabel}</strong> on the Breeze Technician App.
            </p>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f6f8; border-radius:8px; margin-bottom:24px;">
              <tr>
                <td style="padding:16px 20px;">
                  <div style="font-size:11px; font-weight:600; color:#6b7280; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">Email</div>
                  <div style="font-size:14px; color:#111827; margin-bottom:16px;">${toEmail}</div>

                  <div style="font-size:11px; font-weight:600; color:#6b7280; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">Temporary password</div>
                  <div style="font-size:16px; font-weight:700; color:#111827; font-family:'Courier New', monospace; letter-spacing:0.5px;">${tempPassword}</div>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 12px; font-size:14px; color:#111827; font-weight:600;">
              Please change this password as soon as possible
            </p>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-bottom:10px; vertical-align:top; width:24px;">
                  <div style="width:20px; height:20px; border-radius:50%; background-color:#e8edf7; color:#3b82f6; font-size:11px; font-weight:700; text-align:center; line-height:20px;">1</div>
                </td>
                <td style="padding-bottom:10px; padding-left:10px; vertical-align:top;">
                  <div style="font-size:13px; color:#374151; line-height:20px;">Open the app</div>
                </td>
              </tr>
              <tr>
                <td style="padding-bottom:10px; vertical-align:top; width:24px;">
                  <div style="width:20px; height:20px; border-radius:50%; background-color:#e8edf7; color:#3b82f6; font-size:11px; font-weight:700; text-align:center; line-height:20px;">2</div>
                </td>
                <td style="padding-bottom:10px; padding-left:10px; vertical-align:top;">
                  <div style="font-size:13px; color:#374151; line-height:20px;">Enter your email and tap <strong>Continue</strong></div>
                </td>
              </tr>
              <tr>
                <td style="vertical-align:top; width:24px;">
                  <div style="width:20px; height:20px; border-radius:50%; background-color:#e8edf7; color:#3b82f6; font-size:11px; font-weight:700; text-align:center; line-height:20px;">3</div>
                </td>
                <td style="padding-left:10px; vertical-align:top;">
                  <div style="font-size:13px; color:#374151; line-height:20px;">Tap <strong>"Forgot password"</strong> and use this temporary password to set your own</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px; background-color:#f5f6f8; border-top:1px solid #e2e5ea;">
            <p style="margin:0; font-size:12px; color:#9ca3af;">- Breeze Property Group</p>
          </td>
        </tr>
      </table>
    </div>
  `;

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
    html,
  });

  return { delivered: true };
}

module.exports = { sendTempPasswordEmail };