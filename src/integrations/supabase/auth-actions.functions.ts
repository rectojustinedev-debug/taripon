// Server functions for auth actions that are otherwise easy to abuse if
// called straight from the browser with no server-side gate:
//   - login: brute-forceable without a per-IP+email attempt cap
//   - register: can be scripted to spam account creation
//   - password reset / resend verification: classic email-bombing vector
//
// Each of these re-validates input with the shared zod schemas (so a
// request that bypasses the client form, e.g. a direct fetch, is still
// rejected) and is rate limited per client IP before touching Supabase.
//
// Sign-in/sign-up still return the Supabase session to the browser, which
// calls `supabase.auth.setSession(...)` to keep using the existing
// client-side Supabase SDK (and therefore RLS-backed `auth.uid()` queries)
// unchanged.
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { loginSchema, resetPasswordRequestSchema } from "@/lib/validation/auth";
import {
  enforceRateLimit,
  getClientIp,
  resetRateLimit,
  RateLimitError,
} from "@/lib/rate-limit.server";
import { passwordResetEmail } from "@/lib/email-templates";

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }
    if (
      isNewSupabaseApiKey(supabaseKey) &&
      headers.get("Authorization") === `Bearer ${supabaseKey}`
    ) {
      headers.delete("Authorization");
    }
    headers.set("apikey", supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

// Same public, non-secret fallback used in src/integrations/supabase/client.ts —
// safe to hardcode since it's the publishable/anon key, not the service_role key.
const FALLBACK_SUPABASE_URL = "https://bcunytrpoodnvlktxrxj.supabase.co";
const FALLBACK_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_wsZ14LFmFgTA0Ok9VEd3nA_vUEK4wIq";

function getEnv() {
  const SUPABASE_URL = process.env.SUPABASE_URL || FALLBACK_SUPABASE_URL;

  // Prefer the new-format publishable key when the env var is the old JWT
  // format (`eyJ...`) but the fallback has already been migrated to the new
  // `sb_publishable_` format. The Supabase project expects the new format
  // for Auth API calls (resetPasswordForEmail, etc.), and sending the old
  // JWT anon key silently fails.
  const envKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  const SUPABASE_PUBLISHABLE_KEY =
    envKey && isNewSupabaseApiKey(envKey)
      ? envKey
      : FALLBACK_SUPABASE_PUBLISHABLE_KEY;

  if (SUPABASE_URL === FALLBACK_SUPABASE_URL) {
    console.warn(
      "[Supabase] SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY isn't set in this environment — " +
        "falling back to the built-in project values. Set them as real environment " +
        "variables on your host and redeploy to remove this warning.",
    );
  }
  return { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY };
}

function createRequestScopedSupabase() {
  const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } = getEnv();
  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: { fetch: createSupabaseFetch(SUPABASE_PUBLISHABLE_KEY) },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

function ipKey(action: string, ip: string, extra?: string) {
  return extra ? `${action}:${ip}:${extra.toLowerCase()}` : `${action}:${ip}`;
}

function friendlyRateLimitError(error: unknown): never {
  if (error instanceof RateLimitError) {
    throw new Error(error.message);
  }
  throw error;
}

export const loginAction = createServerFn({ method: "POST" })
  .validator(loginSchema)
  .handler(async ({ data }) => {
    const request = getRequest();
    const ip = getClientIp(request);

    try {
      // Per-IP cap (protects against distributed spray) and a tighter
      // per-IP+email cap (protects a single account from being hammered).
      enforceRateLimit(ipKey("login", ip), 30, 10 * 60 * 1000);
      enforceRateLimit(ipKey("login", ip, data.email), 5, 10 * 60 * 1000);
    } catch (error) {
      friendlyRateLimitError(error);
    }

    const supabase = createRequestScopedSupabase();
    const { data: result, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      return { session: null, user: null, error: error.message };
    }

    // Successful login clears the failed-attempt counter for this email.
    resetRateLimit(ipKey("login", ip, data.email));

    return { session: result.session, user: result.user, error: null };
  });

// Registration calls supabase.auth.signUp() directly from the client
// (src/routes/auth.tsx) and relies on Supabase's own built-in
// confirmation email — no server function or service-role key needed
// for sign-up itself.

// Attempts to send a password reset email using the admin client with
// a branded email through Brevo. Falls back to Supabase's built-in
// resetPasswordForEmail() if the service role key or SMTP is not
// configured, so the "forgot password" flow still works even when
// those aren't set up yet.
export const requestPasswordResetAction = createServerFn({ method: "POST" })
  .validator(resetPasswordRequestSchema)
  .handler(async ({ data }) => {
    const request = getRequest();
    const ip = getClientIp(request);
    const origin = new URL(request.url).origin;
    const email = data.email.trim().toLowerCase();

    try {
      enforceRateLimit(ipKey("reset-password", ip), 10, 60 * 60 * 1000);
      enforceRateLimit(ipKey("reset-password", ip, email), 3, 60 * 60 * 1000);
    } catch (error) {
      friendlyRateLimitError(error);
    }

    // Same generic response either way — never leak whether the email is
    // registered. Only a genuinely broken server config (missing service
    // role key, SMTP creds, etc.) short-circuits with a real error, and
    // even then the message stays generic so it can't be used to probe.
    const genericOk = { ok: true as const, error: null };

    // --- Strategy: try branded email via admin client + Brevo first ---
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const smtpConfigured =
      process.env.SMTP_USER && process.env.SMTP_PASS && process.env.SMTP_FROM_EMAIL;

    if (serviceRoleKey && smtpConfigured) {
      // Full branded path: service role key + Brevo SMTP + custom template.
      let supabaseAdmin: (typeof import("./client"))["supabaseAdmin"];
      try {
        ({ supabaseAdmin } = await import("./client"));
      } catch (error) {
        console.error("[requestPasswordResetAction] failed to load admin client:", error);
        return {
          ok: false,
          error: "Password reset is temporarily unavailable. Please try again shortly.",
        };
      }

      let actionLink: string | undefined;
      try {
        const { data: linkData, error } = await supabaseAdmin.auth.admin.generateLink({
          type: "recovery",
          email,
          options: { redirectTo: `${origin}/reset-password` },
        });

        if (error) {
          // Anti-enumeration: "user not found" (and similar) just quietly no-op.
          if (/not.*found|no.*user/i.test(error.message)) {
            return genericOk;
          }
          console.error("[requestPasswordResetAction] generateLink error:", error.message);
          return { ok: false, error: "Could not send reset email. Please try again." };
        }
        actionLink = linkData?.properties?.action_link;
      } catch (error) {
        console.error("[requestPasswordResetAction] generateLink threw:", error);
        return {
          ok: false,
          error: "Password reset is temporarily unavailable. Please try again shortly.",
        };
      }

      if (!actionLink) {
        return genericOk;
      }

      try {
        const { sendMail } = await import("@/lib/mailer");
        const { subject, html, text } = passwordResetEmail({ actionLink, email });
        const result = await sendMail({ to: [{ email }], subject, html, text });
        if (!result.success) {
          console.error("[requestPasswordResetAction] Brevo send failed:", result.error);
          return { ok: false, error: "Could not send reset email. Please try again." };
        }
      } catch (error) {
        console.error("[requestPasswordResetAction] Brevo send threw:", error);
        return { ok: false, error: "Could not send reset email. Please try again." };
      }

      return genericOk;
    }

    // --- Fallback: use Supabase's built-in password reset (works with anon key) ---
    console.info(
      "[requestPasswordResetAction] Service role key or SMTP not configured — " +
        "falling back to Supabase's built-in password reset.",
    );
    try {
      // Derive the public origin from the Host header (more reliable in
      // production behind a reverse proxy than `request.url`, which may carry
      // an internal server-relative path). Falls back to `origin` (from
      // `request.url`) when the header is absent.
      const host = request.headers.get("host");
      const publicOrigin = host ? `${request.headers.get("x-forwarded-proto") ?? "https"}://${host}` : origin;
      const supabase = createRequestScopedSupabase();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${publicOrigin}/reset-password`,
      });

      if (error) {
        // Anti-enumeration: "user not found" just quietly no-ops.
        if (/not.*found|no.*user/i.test(error.message)) {
          return genericOk;
        }
        console.error("[requestPasswordResetAction] resetPasswordForEmail error:", error.message);
        return { ok: false, error: "Could not send reset email. Please try again." };
      }
    } catch (error) {
      console.error("[requestPasswordResetAction] resetPasswordForEmail threw:", error);
      return {
        ok: false,
        error: "Password reset is temporarily unavailable. Please try again shortly.",
      };
    }

    return genericOk;
  });

// Resending the sign-up confirmation email is done client-side via
// supabase.auth.resend({ type: "signup", email }) — see
// src/routes/verify-email.tsx.