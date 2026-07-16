import "dotenv/config";
import { verifyMailer, sendMail } from "./lib/mailer";
import { passwordResetEmail } from "./lib/email-templates";

// Sends a REAL password-reset email through the exact same pipeline the
// app uses (Supabase admin.generateLink + Brevo), without going through
// the UI or the rate limiter. Useful for isolating "is Brevo actually
// configured correctly" from "is the rest of the app wired up correctly".
//
// Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env (the admin
// client needs the service role key to call generateLink) as well as the
// SMTP_* Brevo variables.
//
// Usage:
//   npm run test:mail -- someone@example.com                  -> sends to that address (origin defaults to localhost:8080)
//   npm run test:mail -- someone@example.com https://taripon.app  -> reset link points at that origin
const DEFAULT_ORIGIN = "http://localhost:8080";

async function main() {
  const recipient = process.argv[2]?.trim();
  const origin = process.argv[3]?.trim() || DEFAULT_ORIGIN;

  if (!recipient) {
    console.error("❌ Usage: npm run test:mail -- <recipient-email> [origin]");
    console.error("   Example: npm run test:mail -- someone@example.com");
    process.exit(1);
  }

  // --- 1. Confirm Brevo SMTP auth works before doing anything else. ---
  const connected = await verifyMailer();
  if (!connected) {
    console.error(
      "❌ Brevo SMTP connection failed — see the error above for the real cause " +
        "(bad SMTP_USER/SMTP_PASS, unauthorized IP, network/firewall, etc).",
    );
    process.exit(1);
  }

  // --- 2. Generate a real Supabase recovery link for this email. ---
  let actionLink: string | undefined;
  try {
    const { supabaseAdmin } = await import("./integrations/supabase/client");
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: recipient,
      options: { redirectTo: `${origin}/reset-password` },
    });

    if (error) {
      console.error("❌ Supabase generateLink failed:", error.message);
      console.error(
        "   Check that SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env are correct, " +
          "and that this email belongs to an existing account.",
      );
      process.exit(1);
    }

    actionLink = data?.properties?.action_link;
  } catch (err) {
    console.error("❌ Could not reach Supabase to generate the reset link:", err);
    process.exit(1);
  }

  if (!actionLink) {
    console.error("❌ Supabase didn't return a recovery link for that email.");
    process.exit(1);
  }

  console.log(`🔗 Recovery link generated: ${actionLink}`);
  console.log(`📤 Sending password reset email to ${recipient}...`);

  // --- 3. Send it through Brevo using the real branded template. ---
  const { subject, html, text } = passwordResetEmail({ actionLink, email: recipient });
  const result = await sendMail({
    to: [{ email: recipient, name: "Taripon" }],
    subject,
    html,
    text,
  });

  if (!result.success) {
    console.error("❌ Send failed — see error above.");
    process.exit(1);
  }

  console.log(`✅ Password reset email sent to ${recipient}. Check the inbox (and spam folder).`);
}

main();
