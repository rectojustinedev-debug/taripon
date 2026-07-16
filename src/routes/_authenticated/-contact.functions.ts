// Server function for the Contact & Support form.
//
// Two things happen on submit:
//   1. The message is written to `support_messages` (existing behavior) so
//      there's a durable record inside Supabase.
//   2. An email is sent to the support inbox via the Resend API so a human
//      actually sees it show up in Gmail, instead of the message only ever
//      sitting in a database table nobody is watching.
//
// Email sending is best-effort: if RESEND_API_KEY isn't configured (e.g.
// running locally without it) or the Resend call fails, the DB insert above
// still succeeds and the user still sees a success toast — we just log a
// warning server-side rather than blocking the whole form on an email
// provider being reachable.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { enforceRateLimit } from "@/lib/rate-limit.server";

// Where support messages land. Change this if the inbox ever moves.
const SUPPORT_INBOX = "rectojustinedev@gmail.com";

const contactSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(320),
  subject: z.string().trim().min(1).max(50),
  message: z.string().trim().min(1).max(5000),
});

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function sendSupportEmail(data: z.infer<typeof contactSchema>) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      "[contact] RESEND_API_KEY isn't set — message was saved to Supabase but no email was sent.",
    );
    return { emailed: false };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      // Resend's shared test domain — works with no DNS setup as long as
      // the Resend account itself was created with the SUPPORT_INBOX
      // address (their free tier lets you send to your own signup email
      // from onboarding@resend.dev without verifying a custom domain).
      from: "TARIPON Support <onboarding@resend.dev>",
      to: [SUPPORT_INBOX],
      reply_to: data.email,
      subject: `[TARIPON] ${data.subject} — ${data.name}`,
      html: `
        <div style="font-family: sans-serif; font-size: 14px; color: #1a1a1a;">
          <p><strong>From:</strong> ${escapeHtml(data.name)} (${escapeHtml(data.email)})</p>
          <p><strong>Subject:</strong> ${escapeHtml(data.subject)}</p>
          <p><strong>Message:</strong></p>
          <p style="white-space: pre-wrap;">${escapeHtml(data.message)}</p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[contact] Resend API error (${res.status}): ${body}`);
    return { emailed: false };
  }

  return { emailed: true };
}

export const sendContactMessageAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(contactSchema)
  .handler(async ({ data, context }) => {
    // A handful of messages per hour is plenty for a real person filling
    // out a support form; blocks accidental submit-spam.
    enforceRateLimit(`contact:${context.userId}`, 5, 60 * 60 * 1000);

    const { error } = await context.supabase.from("support_messages").insert({
      user_id: context.userId,
      name: data.name,
      email: data.email,
      subject: data.subject,
      message: data.message,
    });
    if (error) throw new Error(error.message);

    const { emailed } = await sendSupportEmail(data);

    return { ok: true, emailed };
  });
