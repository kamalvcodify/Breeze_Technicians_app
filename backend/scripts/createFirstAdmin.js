/**
 * Creates the very first admin user directly in Zoho Creator.
 * Needed once, before any admin panel exists to do this from the app itself.
 *
 * Usage:
 *   node scripts/createFirstAdmin.js --email admin@example.com --password SomeStrongPassword123
 */
const zohoUserService = require("../src/services/zohoUserService");
const { hashPassword } = require("../src/services/passwordService");

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {};
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === "--email") parsed.email = args[i + 1];
    if (args[i] === "--password") parsed.password = args[i + 1];
  }
  return parsed;
}

async function main() {
  const { email, password } = parseArgs();

  if (!email || !password) {
    console.error("Usage: node scripts/createFirstAdmin.js --email you@example.com --password YourPassword123");
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  const normalizedEmail = email.trim().toLowerCase();

  const existing = await zohoUserService.findUserByEmail(normalizedEmail);
  if (existing) {
    console.error(`A user with email "${normalizedEmail}" already exists in Zoho Creator.`);
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);
  await zohoUserService.createUser({
    email: normalizedEmail,
    passwordHash,
    isAdmin: true,
  });

  console.log(`✅ Admin account created for ${normalizedEmail}. You can now log in with the password you provided.`);
}

main().catch((err) => {
  console.error("Failed to create first admin:", err.response ? err.response.data : err.message);
  process.exit(1);
});
