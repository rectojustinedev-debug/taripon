import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { newPasswordSchema as schema, PASSWORD_RULES } from "@/lib/validation/auth";
import { Logo } from "@/components/Logo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icon } from "@/components/Icon";
import { useForceLightTheme } from "@/lib/use-theme";
import {
  faSpinner,
  faEye,
  faEyeSlash,
  faCheck,
  faXmark,
  faKey,
  faLock,
  faTriangleExclamation,
  faCircleCheck,
  faArrowLeft,
} from "@fortawesome/free-solid-svg-icons";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset password — TARIPON" }] }),
  component: ResetPassword,
});

type LinkState = "checking" | "ready" | "invalid" | "success";

function ResetPassword() {
  useForceLightTheme();
  const navigate = useNavigate();
  const [state, setState] = useState<LinkState>("checking");
  const [submitting, setSubmitting] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });
  const watchedPassword = form.watch("password");

  useEffect(() => {
    let settled = false;

    // Supabase's recovery link redirects here with tokens in the URL hash;
    // supabase-js picks those up automatically and fires PASSWORD_RECOVERY
    // once the session is established. We also check for an existing
    // session up front in case that already happened before this effect
    // ran. If neither shows up within a few seconds, the link is treated
    // as missing/expired/already-used rather than leaving the page stuck
    // on a spinner forever.
    supabase.auth.getSession().then(({ data }) => {
      if (!settled && data.session) {
        settled = true;
        setState("ready");
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (!settled && (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN")) {
        settled = true;
        setState("ready");
      }
    });

    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        setState("invalid");
      }
    }, 4000);

    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  async function onSubmit(values: z.infer<typeof schema>) {
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password: values.password });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setState("success");
    toast.success("Password updated.");
    await supabase.auth.signOut();
  }

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-gradient-to-br from-secondary/40 via-background to-background px-6">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-weave opacity-60" />
      <div className="absolute left-6 top-6 hidden md:block">
        <Link
          to="/auth"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-2 text-sm font-medium text-foreground backdrop-blur transition-colors hover:border-primary hover:text-primary"
        >
          <Icon icon={faArrowLeft} className="text-xs" /> Back to sign in
        </Link>
      </div>

      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-3 rounded-3xl border border-border bg-card p-6 shadow-2xl shadow-primary/10 duration-200 sm:p-8">
        <div className="mb-6 flex flex-col items-center">
          <Logo />

          {state === "checking" && (
            <>
              <div className="mt-5 grid h-14 w-14 place-items-center rounded-full bg-secondary text-primary ring-8 ring-secondary/50">
                <Icon icon={faSpinner} className="animate-spin text-lg" />
              </div>
              <h1 className="mt-4 text-2xl font-bold text-foreground">Verifying your link</h1>
              <p className="mt-1 text-center text-sm text-muted-foreground">
                Hang tight while we confirm your reset link.
              </p>
            </>
          )}

          {state === "invalid" && (
            <>
              <div className="mt-5 grid h-14 w-14 place-items-center rounded-full bg-destructive/10 text-destructive ring-8 ring-destructive/5">
                <Icon icon={faTriangleExclamation} className="text-lg" />
              </div>
              <h1 className="mt-4 text-2xl font-bold text-foreground">Link expired</h1>
              <p className="mt-1 text-center text-sm text-muted-foreground">
                This reset link is invalid or has already been used. Reset links expire after 1 hour
                for your security.
              </p>
              <Link
                to="/auth"
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-3.5 text-sm font-bold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary-dark hover:shadow-md active:translate-y-0 active:scale-[0.98]"
              >
                Request a new link
              </Link>
            </>
          )}

          {state === "success" && (
            <>
              <div className="mt-5 grid h-14 w-14 place-items-center rounded-full bg-success/15 text-success ring-8 ring-success/5">
                <Icon icon={faCircleCheck} className="text-lg" />
              </div>
              <h1 className="mt-4 text-2xl font-bold text-foreground">Password updated</h1>
              <p className="mt-1 text-center text-sm text-muted-foreground">
                Your password has been changed successfully. Sign in with your new password.
              </p>
              <button
                type="button"
                onClick={() => navigate({ to: "/auth" })}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-3.5 text-sm font-bold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary-dark hover:shadow-md active:translate-y-0 active:scale-[0.98]"
              >
                Continue to sign in
              </button>
            </>
          )}

          {state === "ready" && (
            <>
              <div className="mt-5 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground ring-8 ring-primary/10">
                <Icon icon={faKey} className="text-lg" />
              </div>
              <h1 className="mt-4 text-2xl font-bold text-foreground">Set a new password</h1>
              <p className="mt-1 text-center text-sm text-muted-foreground">
                Choose a strong password you haven't used before.
              </p>
            </>
          )}
        </div>

        {state === "ready" && (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <div className="relative">
                <Icon
                  icon={faLock}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
                />
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  autoComplete="new-password"
                  disabled={submitting}
                  className="h-11 rounded-2xl pl-10 pr-10"
                  {...form.register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                  aria-pressed={showPw}
                  className="absolute inset-y-0 right-3 my-auto text-muted-foreground"
                  tabIndex={-1}
                >
                  <Icon icon={showPw ? faEyeSlash : faEye} className="text-sm" />
                </button>
              </div>
              {watchedPassword && (
                <ul className="grid grid-cols-2 gap-x-3 gap-y-1 pt-1">
                  {PASSWORD_RULES.map((rule) => {
                    const met = rule.test(watchedPassword);
                    return (
                      <li
                        key={rule.label}
                        className={`flex items-center gap-1.5 text-xs ${
                          met ? "text-success" : "text-muted-foreground"
                        }`}
                      >
                        <Icon icon={met ? faCheck : faXmark} className="text-[10px]" />
                        {rule.label}
                      </li>
                    );
                  })}
                </ul>
              )}
              {form.formState.errors.password && (
                <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm password</Label>
              <Input
                id="confirm"
                type={showPw ? "text" : "password"}
                autoComplete="new-password"
                disabled={submitting}
                className="h-11 rounded-2xl"
                {...form.register("confirm")}
              />
              {form.formState.errors.confirm && (
                <p className="text-xs text-destructive">{form.formState.errors.confirm.message}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-3.5 text-sm font-bold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary-dark hover:shadow-md active:translate-y-0 active:scale-[0.98] disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {submitting && <Icon icon={faSpinner} className="animate-spin" />} Update password
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
