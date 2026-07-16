import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { supabase, setRememberPreference } from "@/integrations/supabase/client";
import {
  loginAction,
  requestPasswordResetAction,
} from "@/integrations/supabase/auth-actions.functions";
import {
  loginSchema,
  registerSchema,
  emailSchema,
  PASSWORD_RULES,
  type LoginValues,
  type RegisterValues,
} from "@/lib/validation/auth";
import { Icon } from "@/components/Icon";
import { Logo } from "@/components/Logo";
import { useForceLightTheme } from "@/lib/use-theme";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  faArrowLeft,
  faEye,
  faEyeSlash,
  faSpinner,
  faEnvelope,
  faEnvelopeCircleCheck,
  faLock,
  faCheck,
  faXmark,
  faSeedling,
  faCoins,
  faChartLine,
  faKey,
} from "@fortawesome/free-solid-svg-icons";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — TARIPON" },
      { name: "description", content: "Sign in or create your TARIPON account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  useForceLightTheme();
  const navigate = useNavigate();
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "register">("login");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-2">
      {/* ------------------------------------------------------------- */}
      {/* Left on desktop — form panel                                   */}
      {/* ------------------------------------------------------------- */}
      <div className="relative flex min-h-screen flex-col px-6 py-8 sm:px-10 lg:order-1 lg:min-h-0 lg:py-10">
        <Link
          to="/"
          className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <Icon icon={faArrowLeft} className="text-xs" /> Back to homepage
        </Link>

        <div className="flex flex-1 flex-col items-center justify-center py-10">
          <div className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-3 duration-200">
            <div className="mb-6 flex flex-col items-center text-center">
              <Logo />
              <h1 className="mt-6 font-display text-3xl font-bold tracking-tight text-foreground">
                {tab === "login" ? "Welcome back to Taripon!" : "Create your account"}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {tab === "login"
                  ? "Sign in to continue your savings journey with Taripon."
                  : "Every peso counts. Start tracking today."}
              </p>
            </div>

            {/* Segmented tab switcher */}
            <div className="mb-6 grid grid-cols-2 gap-1 rounded-full border border-border bg-muted p-1">
              <button
                type="button"
                onClick={() => setTab("login")}
                className={`rounded-full px-4 py-2.5 text-sm font-semibold transition-all duration-150 ${
                  tab === "login"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => setTab("register")}
                className={`rounded-full px-4 py-2.5 text-sm font-semibold transition-all duration-150 ${
                  tab === "register"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Register
              </button>
            </div>

            <div className="rounded-3xl border border-border bg-card p-5 shadow-soft sm:p-6">
              {tab === "login" ? (
                <LoginForm onDone={() => router.invalidate()} />
              ) : (
                <RegisterForm onDone={() => setTab("login")} />
              )}
            </div>

           <p className="mt-6 text-center text-sm text-muted-foreground">
              {tab !== "login" && (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setTab("login")}
                    className="font-semibold text-primary hover:underline"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          By continuing you agree to our{" "}
          <Link to="/terms" className="font-medium text-primary hover:underline">
            Terms &amp; Conditions
          </Link>{" "}
          and Privacy Policy.
        </p>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Right on desktop — decorative brand panel                     */}
      {/* ------------------------------------------------------------- */}
      <div className="relative hidden overflow-hidden bg-primary lg:order-2 lg:block">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 15% 15%, color-mix(in oklab, var(--primary) 50%, transparent) 0%, transparent 45%), radial-gradient(circle at 85% 80%, color-mix(in oklab, var(--primary-deep) 65%, transparent) 0%, transparent 55%), var(--gradient-primary)",
          }}
        />
        <div aria-hidden className="absolute inset-0 bg-weave opacity-[0.15]" />

        {/* Floating decorative circles */}
        <div
          aria-hidden
          className="absolute -right-16 -top-16 h-64 w-64 rounded-full border border-white/10"
        />
        <div
          aria-hidden
          className="absolute -bottom-24 -left-10 h-72 w-72 rounded-full border border-white/10"
        />

        <div className="relative flex h-full flex-col items-center justify-center gap-10 px-12 py-16">
          {/* Avatar bubbles */}
          <div className="relative h-16 w-full max-w-sm">
            <div className="absolute left-2 top-0 grid h-14 w-14 place-items-center rounded-full border-4 border-white/90 bg-accent-gold-soft text-accent-gold shadow-lg">
              <Icon icon={faCoins} className="text-xl" />
            </div>
            <div className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full border-4 border-white/90 bg-blush text-blush-foreground shadow-lg">
              <Icon icon={faSeedling} className="text-base" />
            </div>
          </div>

          {/* Goal / progress card mockup */}
          <div className="w-full max-w-sm rounded-3xl border border-white/40 bg-card/95 p-5 shadow-2xl backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">New Laptop Fund</p>
                <p className="text-xs text-muted-foreground">12 entries this month</p>
              </div>
              <div className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full bg-secondary text-primary">
                <Icon icon={faChartLine} className="text-sm" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                <div className="h-full w-[68%] rounded-full bg-primary" />
              </div>
              <span className="text-xs font-bold text-primary">68%</span>
            </div>
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
              <Icon icon={faSeedling} className="text-[10px]" /> Savings
            </div>
          </div>

          <div className="max-w-sm text-center">
            <p className="font-display text-2xl font-bold leading-snug text-primary-foreground">
              Grow your savings, one peso at a time.
            </p>
            <p className="mt-2 text-sm text-primary-foreground/80">
              TARIPON keeps every goal, entry, and milestone organized so your progress is always
              in view.
            </p>
          </div>

          <div className="flex items-center gap-2" aria-hidden>
            <span className="h-1.5 w-5 rounded-full bg-white/90" />
            <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
            <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginForm({ onDone }: { onDone: () => void }) {
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [forgotOpen, setForgotOpen] = useState(false);
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { remember: true },
  });

  async function onSubmit(values: LoginValues) {
    setFormError(null);
    setSubmitting(true);
    let result: Awaited<ReturnType<typeof loginAction>>;
    try {
      result = await loginAction({ data: values });
    } catch (err) {
      setSubmitting(false);
      const msg = err instanceof Error ? err.message : "Sign-in failed. Try again.";
      setFormError(msg);
      toast.error(msg);
      return;
    }
    setSubmitting(false);

    if (result.error) {
      if (/email.+not.+confirm/i.test(result.error)) {
        toast.error("Please verify your email before logging in.");
        navigate({ to: "/verify-email", search: { email: values.email } });
        return;
      }
      const friendly = /invalid.+(login|credential)|invalid.+grant|wrong.+password/i.test(
        result.error,
      )
        ? "Incorrect email or password. Please try again."
        : result.error;
      setFormError(friendly);
      toast.error(friendly);
      return;
    }
    if (!result.session) {
      const msg = "Sign-in failed. Try again.";
      setFormError(msg);
      toast.error(msg);
      return;
    }
    if (!result.user?.email_confirmed_at && result.user?.app_metadata?.provider === "email") {
      toast.error("Please verify your email before logging in.");
      navigate({ to: "/verify-email", search: { email: values.email } });
      return;
    }

    // Record the "remember me" choice *before* the session is written so
    // the storage adapter knows whether to persist it (localStorage) or
    // keep it for this browser session only (sessionStorage). Previously
    // this checkbox was collected but never used for anything.
    setRememberPreference(values.remember ?? true);

    await supabase.auth.setSession({
      access_token: result.session.access_token,
      refresh_token: result.session.refresh_token,
    });

    toast.success("Welcome back to Taripon!");
    onDone();
    navigate({ to: "/dashboard" });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Icon
            icon={faEnvelope}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
          />
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            disabled={submitting}
            className="h-11 rounded-2xl pl-10"
            {...form.register("email")}
          />
        </div>
        {form.formState.errors.email && (
          <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
        )}
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <button
            type="button"
            onClick={() => setForgotOpen(true)}
            className="text-xs font-medium text-primary hover:underline"
          >
            Forgot password?
          </button>
        </div>
        <div className="relative">
          <Icon
            icon={faLock}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
          />
          <Input
            id="password"
            type={showPw ? "text" : "password"}
            autoComplete="current-password"
            disabled={submitting}
            className="h-11 rounded-2xl pl-10 pr-10"
            {...form.register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            aria-label={showPw ? "Hide password" : "Show password"}
            aria-pressed={showPw}
            tabIndex={-1}
            className="absolute inset-y-0 right-3 my-auto text-muted-foreground"
          >
            <Icon icon={showPw ? faEyeSlash : faEye} className="text-sm" />
          </button>
        </div>
        {form.formState.errors.password && (
          <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
        )}
      </div>
      {formError && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {formError}
        </div>
      )}
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <Checkbox
          checked={!!form.watch("remember")}
          onCheckedChange={(v) => form.setValue("remember", !!v)}
        />
        Remember me
      </label>
      <button
        type="submit"
        disabled={submitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-3.5 text-sm font-bold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary-dark hover:shadow-md active:translate-y-0 active:scale-[0.98] disabled:opacity-60 disabled:hover:translate-y-0"
      >
        {submitting && <Icon icon={faSpinner} className="animate-spin" />}
        Sign in
      </button>

      <ForgotPasswordDialog
        open={forgotOpen}
        onOpenChange={setForgotOpen}
        defaultEmail={form.getValues("email") ?? ""}
      />
    </form>
  );
}

function ForgotPasswordDialog({
  open,
  onOpenChange,
  defaultEmail,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultEmail: string;
}) {
  const [email, setEmail] = useState(defaultEmail);
  const [submitting, setSubmitting] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (open) {
      setEmail(defaultEmail);
      setFieldError(null);
      setSent(false);
      setCooldown(0);
    }
  }, [open, defaultEmail]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function handleReset() {
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? "Enter a valid email address.");
      return;
    }
    setFieldError(null);
    setSubmitting(true);
    try {
      const result = await requestPasswordResetAction({ data: { email: parsed.data } });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setSent(true);
      setCooldown(30);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send reset link. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Don't let a stray click/escape close the dialog mid-request —
        // previously this could abandon the request while still "sending".
        if (!next && submitting) return;
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-sm gap-0 overflow-hidden rounded-3xl p-0">
        {sent ? (
          <>
            <div className="bg-white px-8 pb-7 pt-9">
              <DialogHeader>
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-success/15 text-success ring-8 ring-success/5">
                  <Icon icon={faEnvelopeCircleCheck} className="text-2xl" />
                </div>
                <DialogTitle className="mt-4 text-center font-display text-2xl font-bold">
                  Check your inbox
                </DialogTitle>
                <DialogDescription className="text-center text-sm">
                  If an account exists for{" "}
                  <span className="font-semibold text-foreground">{email}</span>, a reset link is
                  on its way. It expires in 1 hour.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-6 rounded-xl border border-border bg-card px-4 py-3 text-center text-xs text-muted-foreground">
                Didn't get it? Check your spam folder, or resend below.
              </div>
            </div>

            <DialogFooter className="flex-col gap-2 border-t border-border p-4 sm:flex-row sm:gap-3">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="w-full flex-1 rounded-full border border-border px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary/60 sm:w-auto"
              >
                Done
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={submitting || cooldown > 0}
                className="inline-flex w-full flex-1 items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-all hover:bg-primary-dark disabled:opacity-60 sm:w-auto"
              >
                {submitting && <Icon icon={faSpinner} className="animate-spin" />}
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend email"}
              </button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="bg-white px-8 pb-7 pt-9">
              <DialogHeader>
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground ring-8 ring-primary/10">
                  <Icon icon={faKey} className="text-lg" />
                </div>
                <DialogTitle className="mt-4 text-center font-display text-2xl font-bold">
                  Forgot password?
                </DialogTitle>
                <DialogDescription className="text-center text-sm">
                  No worries — enter your email and we'll send you{" "}
                  <span className="font-semibold text-foreground">reset instructions</span>.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-6 space-y-1.5">
                <Label htmlFor="forgot-email" className="sr-only">
                  Email
                </Label>
                <div className="relative">
                  <Icon
                    icon={faEnvelope}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
                  />
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    autoFocus
                    disabled={submitting}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldError) setFieldError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleReset();
                      }
                    }}
                    className="h-11 rounded-2xl bg-card pl-10"
                  />
                </div>
                {fieldError && <p className="text-xs text-destructive">{fieldError}</p>}
              </div>
            </div>

            <DialogFooter className="flex-col gap-2 border-t border-border p-4 sm:flex-row sm:gap-3">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
                className="w-full flex-1 rounded-full border border-border px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary/60 disabled:opacity-60 sm:w-auto"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={submitting}
                className="inline-flex w-full flex-1 items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-all hover:bg-primary-dark disabled:opacity-60 sm:w-auto"
              >
                {submitting && <Icon icon={faSpinner} className="animate-spin" />}
                Send reset link
              </button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function RegisterForm({ onDone }: { onDone: () => void }) {
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { agree: false as unknown as true },
  });
  const watchedPassword = form.watch("password");

  async function onSubmit(values: RegisterValues) {
    setFormError(null);
    setSubmitting(true);
    let result: Awaited<ReturnType<typeof supabase.auth.signUp>>;
    try {
      result = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: { full_name: values.full_name },
          emailRedirectTo: `${window.location.origin}/auth`,
        },
      });
    } catch (err) {
      setSubmitting(false);
      const msg = err instanceof Error ? err.message : "Could not create account. Try again.";
      setFormError(msg);
      toast.error(msg);
      return;
    }
    setSubmitting(false);
    const { data, error } = result;

    if (error) {
      const friendly = /already registered|already exists/i.test(error.message)
        ? "An account with this email already exists."
        : error.message;
      setFormError(friendly);
      toast.error(friendly);
      return;
    }

    // Supabase's signUp() doesn't return an error when the email already
    // belongs to a confirmed account — it's a deliberate anti-enumeration
    // measure, but left unhandled it made "create account" look broken:
    // the form reported success, sent nothing, and dropped the user on
    // /verify-email for an account that already exists. `identities` is
    // an empty array only in that specific case.
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      const msg = "An account with this email already exists. Try signing in instead.";
      setFormError(msg);
      toast.error(msg);
      return;
    }

    toast.success("Account created! Check your email to confirm, then sign in.");
    form.reset();
    onDone();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="full_name">Full name</Label>
        <Input
          id="full_name"
          autoComplete="name"
          disabled={submitting}
          className="h-11 rounded-2xl"
          {...form.register("full_name")}
        />
        {form.formState.errors.full_name && (
          <p className="text-xs text-destructive">{form.formState.errors.full_name.message}</p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="r_email">Email</Label>
        <Input
          id="r_email"
          type="email"
          autoComplete="email"
          disabled={submitting}
          className="h-11 rounded-2xl"
          {...form.register("email")}
        />
        {form.formState.errors.email && (
          <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="r_password">Password</Label>
        <div className="relative">
          <Input
            id="r_password"
            type={showPw ? "text" : "password"}
            autoComplete="new-password"
            disabled={submitting}
            className="h-11 rounded-2xl pr-10"
            {...form.register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            aria-label={showPw ? "Hide password" : "Show password"}
            aria-pressed={showPw}
            tabIndex={-1}
            className="absolute inset-y-0 right-3 my-auto text-muted-foreground"
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
      <div className="space-y-1.5">
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
      <label className="flex items-start gap-2 text-sm text-muted-foreground">
        <Checkbox
          checked={!!form.watch("agree")}
          onCheckedChange={(v) =>
            form.setValue("agree", !!v as unknown as true, { shouldValidate: true })
          }
          className="mt-0.5"
        />
        <span>
          I agree to the{" "}
          <Link to="/terms" className="font-medium text-primary hover:underline">
            Terms &amp; Conditions
          </Link>{" "}
          and Privacy Policy.
        </span>
      </label>
      {form.formState.errors.agree && (
        <p className="text-xs text-destructive">{form.formState.errors.agree.message}</p>
      )}
      {formError && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {formError}
        </div>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-3.5 text-sm font-bold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary-dark hover:shadow-md active:translate-y-0 active:scale-[0.98] disabled:opacity-60 disabled:hover:translate-y-0"
      >
        {submitting && <Icon icon={faSpinner} className="animate-spin" />}
        Create account
      </button>
      
    </form>
  );
}
