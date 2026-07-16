import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { deleteAccountAction } from "./-settings.functions";
import { sendContactMessageAction } from "./-contact.functions";
import { getErrorMessage } from "@/lib/error-reporting";
import { AppShell } from "@/components/layout/AppShell";
import { useLanguage, LANGUAGES } from "@/lib/i18n";
import { useTheme } from "@/lib/use-theme";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Icon } from "@/components/Icon";
import {
  faUser,
  faUpload,
  faSignOut,
  faSpinner,
  faFileExcel,
  faTrash,
  faEye,
  faEyeSlash,
  faCheck,
  faXmark,
  faLaptop,
  faCircleQuestion,
  faCalculator,
  faLightbulb,
  faChevronRight,
  faStar,
  faPaperPlane,
  faCommentDots,
} from "@fortawesome/free-solid-svg-icons";
import { exportAccountToExcel } from "@/lib/exportExcel";
import {
  PASSWORD_RULES,
  passwordFailures,
  passwordScore,
  STRENGTH_LABELS,
  STRENGTH_COLORS,
} from "@/lib/validation/auth";
import { SavingsCalculatorDialog } from "@/components/SavingsCalculatorDialog";
import { MoneyTipsDialog } from "@/components/MoneyTipsDialog";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — TARIPON" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const qc = useQueryClient();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const { t, lang, setLang } = useLanguage();
  const { dark, toggle: toggleTheme } = useTheme();
  const [name, setName] = useState("");
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });
  const [newEmail, setNewEmail] = useState("");
  const [emailPending, setEmailPending] = useState<string | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [moneyTipsOpen, setMoneyTipsOpen] = useState(false);

  const profile = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const u = { user: session?.user ?? null };
      if (!u.user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", u.user.id)
        .maybeSingle();
      return data;
    },
  });

  const settings = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const u = { user: session?.user ?? null };
      if (!u.user) return null;
      const { data } = await supabase
        .from("settings")
        .select("*")
        .eq("user_id", u.user.id)
        .maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (profile.data?.full_name) setName(profile.data.full_name);
  }, [profile.data?.full_name]);

  useEffect(() => {
    if (settings.data?.language === "en" || settings.data?.language === "fil") {
      setLang(settings.data.language);
    }
    // Only react to the fetched value changing, not to setLang identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.data?.language]);

  const saveName = useMutation({
    mutationFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const u = { user: session?.user ?? null };
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: name })
        .eq("id", u.user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Name updated");
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const sendFeedback = useMutation({
    mutationFn: async () => {
      if (!feedbackMessage.trim()) {
        throw new Error(t("feedback.messageRequired"));
      }
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const email = session?.user?.email ?? "unknown@taripon.app";
      const name = profile.data?.full_name?.trim() || "Taripon user";
      const stars = feedbackRating > 0 ? `Rating: ${feedbackRating}/5\n\n` : "";
      await sendContactMessageAction({
        data: {
          name,
          email,
          subject: "App feedback",
          message: `${stars}${feedbackMessage.trim()}`,
        },
      });
    },
    onSuccess: () => {
      toast.success(t("feedback.success"));
      setFeedbackOpen(false);
      setFeedbackMessage("");
      setFeedbackRating(0);
    },
    onError: (e: unknown) => toast.error(getErrorMessage(e, t("feedback.error"))),
  });

  const savePassword = useMutation({
    mutationFn: async () => {
      if (!pw.current) throw new Error("Enter your current password");
      const failures = passwordFailures(pw.next);
      if (failures.length > 0) throw new Error(failures[0].label + " is required");
      if (pw.next !== pw.confirm) throw new Error("New passwords do not match");
      if (pw.current === pw.next)
        throw new Error("New password must be different from your current password");

      const {
        data: { session },
      } = await supabase.auth.getSession();
      const u = { user: session?.user ?? null };
      const email = u.user?.email;
      if (!email) throw new Error("Not signed in");

      // Re-authenticate with the current password first. This confirms the
      // user actually knows their current password, and also refreshes the
      // session so Supabase's "recent login required" check (enabled by
      // default on many projects for sensitive changes) doesn't silently
      // reject the update with an unrelated-looking error.
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email,
        password: pw.current,
      });
      if (reauthError) {
        // Supabase throws a generic 400 for both "wrong password" and
        // "too many attempts" — surface the rate-limit case distinctly so
        // it doesn't read as "you typo'd your password" when it's actually
        // a cooldown.
        if (/rate limit|too many/i.test(reauthError.message)) {
          throw new Error("Too many attempts. Please wait a minute and try again.");
        }
        throw new Error("Current password is incorrect");
      }

      const { error } = await supabase.auth.updateUser({ password: pw.next });
      if (error) {
        if (/same.*password|different from.*old/i.test(error.message)) {
          throw new Error("New password must be different from your current password");
        }
        if (/weak|should contain|at least/i.test(error.message)) {
          throw new Error("Password is too weak: " + error.message);
        }
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Password updated");
      setPw({ current: "", next: "", confirm: "" });
      setShowPw({ current: false, next: false, confirm: false });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Revokes every other active session (other browsers/devices) while
  // keeping this one signed in — useful right after a password change,
  // or any time a user suspects a device they no longer use is still
  // logged in.
  const signOutOthers = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut({ scope: "others" });
      if (error) throw error;
    },
    onSuccess: () => toast.success("Signed out of all other devices"),
    onError: (e: Error) => toast.error(e.message),
  });

  // Changing email goes through Supabase's own re-verification flow:
  // updateUser({ email }) doesn't change anything immediately — it sends
  // a confirmation link to the new address (and, depending on project
  // settings, the old one too) and the address only switches over once
  // that link is clicked. We surface that pending state rather than
  // implying the change already happened.
  const changeEmail = useMutation({
    mutationFn: async () => {
      const trimmed = newEmail.trim();
      if (!trimmed) throw new Error("Enter a new email address");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed))
        throw new Error("Enter a valid email address");
      if (trimmed.toLowerCase() === profile.data?.email?.toLowerCase()) {
        throw new Error("That's already your current email");
      }
      const { error } = await supabase.auth.updateUser({ email: trimmed });
      if (error) throw error;
      return trimmed;
    },
    onSuccess: (trimmed) => {
      setEmailPending(trimmed);
      setNewEmail("");
      toast.success(
        `Confirmation link sent to ${trimmed}. Your email won't change until you click it.`,
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveSettings = useMutation({
    mutationFn: async (patch: {
      currency?: string;
      theme?: string;
      notifications?: boolean;
      language?: string;
    }) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const u = { user: session?.user ?? null };
      const { error } = await supabase.from("settings").update(patch).eq("user_id", u.user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function onAvatarChange(file: File) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const u = { user: session?.user ?? null };
    if (!u.user) return;
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${u.user.id}/avatar-${Date.now()}.${ext}`;
    const up = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (up.error) return toast.error(up.error.message);
    const { data: signed } = await supabase.storage
      .from("avatars")
      .createSignedUrl(path, 60 * 60 * 24 * 365);
    const url = signed?.signedUrl;
    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: url })
      .eq("id", u.user.id);
    if (error) return toast.error(error.message);
    toast.success("Avatar updated");
    qc.invalidateQueries({ queryKey: ["profile"] });
  }

  async function exportExcel() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const u = { user: session?.user ?? null };
    if (!u.user) return;
    const [{ data: entries, error: entriesErr }, { data: goals, error: goalsErr }] =
      await Promise.all([
        supabase.from("entries").select("*").eq("user_id", u.user.id),
        supabase.from("goals").select("*").eq("user_id", u.user.id),
      ]);
    if (entriesErr || goalsErr)
      return toast.error(entriesErr?.message ?? goalsErr?.message ?? "Export failed");
    if ((entries?.length ?? 0) === 0 && (goals?.length ?? 0) === 0)
      return toast.error("Nothing to export yet.");
    exportAccountToExcel({
      entries: entries ?? [],
      goals: goals ?? [],
      currency: settings.data?.currency ?? "PHP",
      fullName: profile.data?.full_name,
      email: u.user.email,
    });
    toast.success("Excel file downloaded");
  }

  async function deleteAccount() {
    try {
      // Runs server-side with the service-role client so it can clean up
      // rows RLS no longer lets the client delete directly (notifications),
      // and removes the auth user itself so the account can't sign back in.
      await deleteAccountAction();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete account. Try again.");
      return;
    }
    await supabase.auth.signOut();
    toast.success("Account deleted.");
    router.navigate({ to: "/auth", replace: true });
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.navigate({ to: "/auth", replace: true });
  }

  return (
    <AppShell title={t("settings.title")} background="bg-white dark:bg-background">
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <Section title={t("settings.profile")}>
          <div className="flex flex-wrap items-center gap-4">
            <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-secondary text-xl text-primary-dark">
              {profile.data?.avatar_url ? (
                <img src={profile.data.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <Icon icon={faUser} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-foreground">
                {profile.data?.full_name ?? "—"}
              </div>
              <div className="truncate text-xs text-muted-foreground">{profile.data?.email}</div>
            </div>
            <input
              type="file"
              accept="image/*"
              ref={fileRef}
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onAvatarChange(f);
              }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground hover:border-primary hover:text-primary"
            >
              <Icon icon={faUpload} /> Avatar
            </button>
          </div>
          <div className="mt-5 space-y-2">
            <Label htmlFor="name">Full name</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="min-w-0 flex-1"
              />
              <button
                onClick={() => saveName.mutate()}
                disabled={saveName.isPending}
                className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-dark disabled:opacity-60 sm:py-0"
              >
                {saveName.isPending ? <Icon icon={faSpinner} className="animate-spin" /> : "Save"}
              </button>
            </div>
          </div>

          <div className="mt-5 space-y-2 border-t border-border pt-4">
            <Label htmlFor="email">Email address</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="email"
                type="email"
                placeholder={profile.data?.email ?? "you@example.com"}
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="min-w-0 flex-1"
              />
              <button
                onClick={() => changeEmail.mutate()}
                disabled={changeEmail.isPending || !newEmail.trim()}
                className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground hover:border-primary hover:text-primary disabled:opacity-60 sm:py-0"
              >
                {changeEmail.isPending ? (
                  <Icon icon={faSpinner} className="animate-spin" />
                ) : (
                  "Change"
                )}
              </button>
            </div>
            {emailPending && (
              <p className="text-xs text-muted-foreground">
                Confirmation link sent to{" "}
                <span className="font-semibold text-foreground">{emailPending}</span>. Your sign-in
                email stays as-is until you confirm it.
              </p>
            )}
          </div>
        </Section>

        <Section title={t("settings.changePassword")}>
          <div className="space-y-2">
            <Label htmlFor="pw-current">Current password</Label>
            <PasswordInput
              id="pw-current"
              value={pw.current}
              onChange={(v) => setPw((p) => ({ ...p, current: v }))}
              show={showPw.current}
              onToggleShow={() => setShowPw((s) => ({ ...s, current: !s.current }))}
              autoComplete="current-password"
            />
          </div>
          <div className="mt-3 space-y-2">
            <Label htmlFor="pw-next">New password</Label>
            <PasswordInput
              id="pw-next"
              value={pw.next}
              onChange={(v) => setPw((p) => ({ ...p, next: v }))}
              show={showPw.next}
              onToggleShow={() => setShowPw((s) => ({ ...s, next: !s.next }))}
              autoComplete="new-password"
            />
            <p className="text-xs text-muted-foreground">At least 8 characters.</p>
          </div>
          <div className="mt-3 space-y-2">
            <Label htmlFor="pw-confirm">Confirm new password</Label>
            <PasswordInput
              id="pw-confirm"
              value={pw.confirm}
              onChange={(v) => setPw((p) => ({ ...p, confirm: v }))}
              show={showPw.confirm}
              onToggleShow={() => setShowPw((s) => ({ ...s, confirm: !s.confirm }))}
              autoComplete="new-password"
            />
            {pw.confirm.length > 0 && pw.confirm !== pw.next && (
              <p className="text-xs text-destructive">Passwords don't match yet.</p>
            )}
          </div>
          {pw.next.length > 0 && (
            <div className="mt-3">
              <div className="flex gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${i <= passwordScore(pw.next) ? STRENGTH_COLORS[passwordScore(pw.next)] : "bg-secondary"}`}
                  />
                ))}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {STRENGTH_LABELS[passwordScore(pw.next)]}
              </p>
            </div>
          )}
          {pw.next.length > 0 && (
            <ul className="mt-3 grid grid-cols-1 gap-1 sm:grid-cols-2">
              {PASSWORD_RULES.map((rule) => {
                const met = rule.test(pw.next);
                return (
                  <li
                    key={rule.label}
                    className={`flex items-center gap-1.5 text-xs ${met ? "text-success" : "text-muted-foreground"}`}
                  >
                    <Icon icon={met ? faCheck : faXmark} className="text-[10px]" />
                    {rule.label}
                  </li>
                );
              })}
            </ul>
          )}
          <button
            onClick={() => savePassword.mutate()}
            disabled={
              savePassword.isPending ||
              !pw.current ||
              passwordFailures(pw.next).length > 0 ||
              pw.next !== pw.confirm
            }
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {savePassword.isPending && <Icon icon={faSpinner} className="animate-spin" />} Update
            password
          </button>

          <div className="mt-5 border-t border-border pt-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-foreground">Other devices</div>
                <div className="text-xs text-muted-foreground">
                  Sign out everywhere else you're logged in, keeping this device signed in.
                </div>
              </div>
              <button
                onClick={() => signOutOthers.mutate()}
                disabled={signOutOthers.isPending}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:border-primary hover:text-primary disabled:opacity-60"
              >
                {signOutOthers.isPending ? (
                  <Icon icon={faSpinner} className="animate-spin" />
                ) : (
                  <Icon icon={faLaptop} />
                )}
                Sign out other devices
              </button>
            </div>
          </div>
        </Section>

        <Section title={t("settings.preferences")}>
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-foreground">
                  {t("settings.darkTheme")}
                </div>
                <div className="text-xs text-muted-foreground">{t("settings.darkThemeDesc")}</div>
              </div>
              <Switch
                checked={dark}
                onCheckedChange={(v) => {
                  // toggleTheme() flips whatever is currently applied, so we
                  // only call it when the requested value actually differs —
                  // keeps this in sync with the sidebar/command-palette toggle
                  // instead of trusting (possibly stale) server settings.
                  if (v !== dark) toggleTheme();
                  saveSettings.mutate({ theme: v ? "dark" : "light" });
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("settings.language")}</Label>
              <p className="text-xs text-muted-foreground">{t("settings.languageDesc")}</p>
              <Select
                value={lang}
                onValueChange={(v: "en" | "fil") => {
                  setLang(v);
                  saveSettings.mutate({ language: v });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => (
                    <SelectItem key={l.value} value={l.value}>
                      {l.flag} {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("settings.currency")}</Label>
              <Select
                value={settings.data?.currency ?? "PHP"}
                onValueChange={(v) => saveSettings.mutate({ currency: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["PHP", "USD", "EUR", "GBP", "JPY", "SGD", "AUD", "CAD"].map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Section>

        <Section title={t("settings.support")}>
          <div className="space-y-2">
            <Link
              to="/help"
              className="hover-bounce flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <span className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-secondary text-primary-dark">
                  <Icon icon={faCircleQuestion} className="text-sm" />
                </span>
                <span className="text-left">
                  <span className="block">{t("settings.helpCenter")}</span>
                  <span className="block text-xs font-normal text-muted-foreground">
                    {t("settings.helpCenterDesc")}
                  </span>
                </span>
              </span>
              <Icon icon={faChevronRight} className="shrink-0 text-xs text-muted-foreground" />
            </Link>
            <button
              type="button"
              onClick={() => setCalculatorOpen(true)}
              className="hover-bounce flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <span className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-secondary text-primary-dark">
                  <Icon icon={faCalculator} className="text-sm" />
                </span>
                <span className="text-left">
                  <span className="block">{t("settings.savingsCalculator")}</span>
                  <span className="block text-xs font-normal text-muted-foreground">
                    {t("settings.savingsCalculatorDesc")}
                  </span>
                </span>
              </span>
              <Icon icon={faChevronRight} className="shrink-0 text-xs text-muted-foreground" />
            </button>
            <button
              type="button"
              onClick={() => setMoneyTipsOpen(true)}
              className="hover-bounce flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <span className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-secondary text-primary-dark">
                  <Icon icon={faLightbulb} className="text-sm" />
                </span>
                <span className="text-left">
                  <span className="block">{t("settings.moneyTips")}</span>
                  <span className="block text-xs font-normal text-muted-foreground">
                    {t("settings.moneyTipsDesc")}
                  </span>
                </span>
              </span>
              <Icon icon={faChevronRight} className="shrink-0 text-xs text-muted-foreground" />
            </button>
            <button
              type="button"
              onClick={() => setFeedbackOpen(true)}
              className="hover-bounce flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <span className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-secondary text-primary-dark">
                  <Icon icon={faCommentDots} className="text-sm" />
                </span>
                <span className="text-left">
                  <span className="block">{t("settings.feedback")}</span>
                  <span className="block text-xs font-normal text-muted-foreground">
                    {t("settings.feedbackDesc")}
                  </span>
                </span>
              </span>
              <Icon icon={faChevronRight} className="shrink-0 text-xs text-muted-foreground" />
            </button>
          </div>
        </Section>

        <Section title={t("settings.data")}>
          <button
            onClick={exportExcel}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground hover:border-primary hover:text-primary"
          >
            <Icon icon={faFileExcel} /> {t("settings.exportData")}
          </button>
          <button
            onClick={signOut}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground hover:border-primary hover:text-primary"
          >
            <Icon icon={faSignOut} /> {t("settings.signOut")}
          </button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/30 px-4 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/10">
                <Icon icon={faTrash} /> {t("settings.deleteAccount")}
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="font-display">Delete all your data?</AlertDialogTitle>
                <AlertDialogDescription>
                  This removes your savings, goals, profile and settings. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={deleteAccount}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </Section>
      </div>

      <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">{t("feedback.title")}</DialogTitle>
            <DialogDescription>{t("feedback.subtitle")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("feedback.ratingLabel")}</Label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    aria-label={`${n} star${n === 1 ? "" : "s"}`}
                    onClick={() => setFeedbackRating(n)}
                    className="grid h-9 w-9 place-items-center rounded-lg text-lg transition-transform hover:scale-110"
                  >
                    <Icon
                      icon={faStar}
                      className={n <= feedbackRating ? "text-accent-gold" : "text-muted"}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback-message">{t("contact.message")}</Label>
              <Textarea
                id="feedback-message"
                rows={4}
                value={feedbackMessage}
                onChange={(e) => setFeedbackMessage(e.target.value)}
                placeholder={t("feedback.messagePlaceholder")}
              />
            </div>

            <button
              onClick={() => sendFeedback.mutate()}
              disabled={sendFeedback.isPending}
              className="hover-bounce inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Icon
                icon={sendFeedback.isPending ? faSpinner : faPaperPlane}
                className={sendFeedback.isPending ? "animate-spin" : ""}
              />
              {sendFeedback.isPending ? t("feedback.sending") : t("feedback.send")}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <SavingsCalculatorDialog
        open={calculatorOpen}
        onOpenChange={setCalculatorOpen}
        currency={settings.data?.currency ?? "PHP"}
      />
      <MoneyTipsDialog open={moneyTipsOpen} onOpenChange={setMoneyTipsOpen} />
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
      <h2 className="mb-4 text-base font-bold text-foreground">{title}</h2>
      {children}
    </div>
  );
}

function PasswordInput({
  id,
  value,
  onChange,
  show,
  onToggleShow,
  autoComplete,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggleShow: () => void;
  autoComplete: string;
}) {
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        className="pr-10"
      />
      <button
        type="button"
        onClick={onToggleShow}
        aria-label={show ? "Hide password" : "Show password"}
        tabIndex={-1}
        className="absolute inset-y-0 right-0 grid w-10 place-items-center text-muted-foreground hover:text-foreground"
      >
        <Icon icon={show ? faEyeSlash : faEye} className="text-sm" />
      </button>
    </div>
  );
}
