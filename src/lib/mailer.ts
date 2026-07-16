import "dotenv/config";
import nodemailer, { type Transporter } from "nodemailer";

export type MailRecipient = {
  email: string;
  name?: string;
};

export type SendMailArgs = {
  to: MailRecipient[];
  subject: string;
  text?: string;
  html?: string;
};

export type SendMailResult =
  | { success: true; messageId: string; response: string }
  | { success: false; error: string };

// ---------------------------------------------------------------------------
// Env var validation
// ---------------------------------------------------------------------------
// A serverless function on Vercel that's missing SMTP_USER/SMTP_PASS/
// SMTP_FROM_EMAIL doesn't throw at import time with nodemailer — it builds
// a transporter happily and only fails (often opaquely) once you try to
// send. That made root-causing "reset email never arrives" much harder
// than it needed to be. Fail loudly and specifically instead.
const REQUIRED_ENV_VARS = ["SMTP_USER", "SMTP_PASS", "SMTP_FROM_EMAIL"] as const;

function getMissingEnvVars(): string[] {
  return REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
}

function assertMailerConfigured(): void {
  const missing = getMissingEnvVars();
  if (missing.length > 0) {
    throw new Error(
      `[mailer] Missing required env var(s): ${missing.join(", ")}. ` +
        "Set these in your host's environment (e.g. Vercel → Project Settings → " +
        "Environment Variables) and redeploy.",
    );
  }
}

// ---------------------------------------------------------------------------
// Transporter
// ---------------------------------------------------------------------------
// Lazily created (and cached) rather than built at module load time, so a
// missing env var surfaces as a clear thrown error from sendMail()/
// verifyMailer() instead of a transporter that silently can't auth.
// Serverless-friendly timeouts are set explicitly — the nodemailer/Node
// defaults can hang close to (or past) a Vercel function's execution
// limit instead of failing fast with a useful error.
let _transporter: Transporter | undefined;

function getTransporter(): Transporter {
  if (_transporter) return _transporter;

  const port = Number(process.env.SMTP_PORT ?? 587);

  _transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp-relay.brevo.com",
    port,
    // Port 465 is implicit TLS; anything else (587, 2525) is STARTTLS.
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // Serverless functions have a hard wall-clock limit — fail fast
    // instead of hanging until the platform kills the invocation.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
    // Each invocation is a fresh, short-lived process — a pooled
    // transporter just holds a socket open that will never be reused.
    pool: false,
  });

  return _transporter;
}

/**
 * Verify the SMTP connection and credentials.
 * Returns false (rather than throwing) so callers can use this as a
 * simple health check, e.g. from a diagnostics route or startup log.
 */
export async function verifyMailer(): Promise<boolean> {
  try {
    assertMailerConfigured();
    await getTransporter().verify();
    console.log("✅ Brevo SMTP connection successful.");
    return true;
  } catch (error) {
    console.error("❌ Brevo SMTP connection failed.");
    console.error(error instanceof Error ? error.message : error);
    return false;
  }
}

/**
 * Send an email.
 */
export async function sendMail({ to, subject, text, html }: SendMailArgs): Promise<SendMailResult> {
  try {
    assertMailerConfigured();

    if (to.length === 0) {
      throw new Error("[mailer] sendMail() called with an empty `to` list.");
    }

    const info = await getTransporter().sendMail({
      from: {
        name: process.env.SMTP_FROM_NAME || "Taripon",
        address: process.env.SMTP_FROM_EMAIL!,
      },

      to: to.map((recipient) => ({
        name: recipient.name,
        address: recipient.email,
      })),

      subject,

      text: text ?? html?.replace(/<[^>]*>/g, ""),
      html: html ?? `<pre>${text}</pre>`,
    });

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📧 Email sent successfully");
    console.log("Message ID:", info.messageId);
    console.log("Response:", info.response);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━");

    return {
      success: true,
      messageId: info.messageId,
      response: info.response,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("❌ Failed to send email");
    console.error(message);
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━");

    return {
      success: false,
      error: message,
    };
  }
}

// No default export of a module-level transporter anymore — it was built
// eagerly at import time (before env vars could be validated) and every
// caller in this codebase already uses the named `sendMail`/`verifyMailer`
// exports instead. If you need raw transporter access, use
// `getTransporter()`-style code inside this file.
