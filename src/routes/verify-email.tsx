import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Icon } from "@/components/Icon";
import { useForceLightTheme } from "@/lib/use-theme";
import { faEnvelopeOpenText, faSpinner, faArrowLeft } from "@fortawesome/free-solid-svg-icons";

const search = z.object({ email: z.string().optional() });

export const Route = createFileRoute("/verify-email")({
  validateSearch: search,
  head: () => ({ meta: [{ title: "Verify your email — TARIPON" }] }),
  component: VerifyEmail,
});

function VerifyEmail() {
  useForceLightTheme();
  const { email } = Route.useSearch();
  const [sending, setSending] = useState(false);

  async function resend() {
    if (!email) {
      toast.error("Missing email address.");
      return;
    }
    setSending(true);
    const { error } = await supabase.auth.resend({ type: "signup", email });
    setSending(false);
    if (error) toast.error(error.message);
    else toast.success("Confirmation email sent. Check your inbox.");
  }

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-br from-secondary/40 via-background to-background px-6">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-xl">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-2xl text-primary-dark">
          <Icon icon={faEnvelopeOpenText} />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-foreground">Check your email</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We sent a confirmation link{" "}
          {email ? (
            <>
              to <span className="font-semibold text-foreground">{email}</span>
            </>
          ) : (
            "to your email"
          )}
          . Click it to activate your account, then come back and sign in.
        </p>

        <button
          onClick={resend}
          disabled={sending}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground hover:border-primary hover:text-primary disabled:opacity-60"
        >
          {sending && <Icon icon={faSpinner} className="animate-spin" />}
          Resend confirmation email
        </button>
        <Link
          to="/auth"
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <Icon icon={faArrowLeft} className="text-xs" /> Back to sign in
        </Link>
      </div>
    </div>
  );
}
