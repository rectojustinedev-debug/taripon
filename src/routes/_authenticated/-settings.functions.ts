// Server function for destructive account cleanup. This must run with the
// service-role client because the `notifications` table's RLS policy no
// longer grants authenticated users DELETE — deletion is a system action.
// `requireSupabaseAuth` verifies the caller's Supabase JWT and gives us a
// trustworthy `userId` (from the verified claims, not from client input),
// so there's no way to pass someone else's id in and delete their data.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { enforceRateLimit } from "@/lib/rate-limit.server";

export const deleteAccountAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Tight per-user cap — this is a one-shot destructive action, not
    // something a legitimate client should ever call in a loop.
    enforceRateLimit(`delete-account:${context.userId}`, 3, 60 * 60 * 1000);

    const { supabaseAdmin } = await import("@/integrations/supabase/client");
    const userId = context.userId;

    const results = await Promise.all([
      supabaseAdmin.from("entries").delete().eq("user_id", userId),
      supabaseAdmin.from("goals").delete().eq("user_id", userId),
      supabaseAdmin.from("notifications").delete().eq("user_id", userId),
      supabaseAdmin.from("settings").delete().eq("user_id", userId),
    ]);

    for (const result of results) {
      if (result.error) throw new Error(`Account cleanup failed: ${result.error.message}`);
    }

    // Delete the profile row last, then the auth user itself so no
    // sign-in is possible afterward (previously the auth user was left
    // behind indefinitely with an empty profile).
    const { error: profileError } = await supabaseAdmin.from("profiles").delete().eq("id", userId);
    if (profileError) throw new Error(`Account cleanup failed: ${profileError.message}`);

    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authError) throw new Error(`Account cleanup failed: ${authError.message}`);

    return { ok: true };
  });
