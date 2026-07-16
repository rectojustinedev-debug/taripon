import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { sendContactMessageAction } from "./-contact.functions";
import { getErrorMessage } from "@/lib/error-reporting";
import { AppShell } from "@/components/layout/AppShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Icon } from "@/components/Icon";
import { useLanguage, type TranslationKey } from "@/lib/i18n";
import { faEnvelope, faPaperPlane, faSpinner, faHeadset } from "@fortawesome/free-solid-svg-icons";

const SUPPORT_EMAIL = "tariponsavings@gmail.com";

const SUBJECTS: { value: string; labelKey: TranslationKey }[] = [
  { value: "general", labelKey: "contact.subjectGeneral" },
  { value: "bug", labelKey: "contact.subjectBug" },
  { value: "account", labelKey: "contact.subjectAccount" },
  { value: "feature", labelKey: "contact.subjectFeature" },
];

export const Route = createFileRoute("/_authenticated/contact")({
  head: () => ({ meta: [{ title: "Contact & Support — TARIPON" }] }),
  component: ContactPage,
});

function ContactPage() {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("general");
  const [message, setMessage] = useState("");

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
      return { ...data, email: u.user.email };
    },
  });

  useEffect(() => {
    if (profile.data?.full_name) setName(profile.data.full_name);
    if (profile.data?.email) setEmail(profile.data.email);
  }, [profile.data?.full_name, profile.data?.email]);

  const sendMessage = useMutation({
    mutationFn: async () => {
      if (!name.trim() || !email.trim() || !message.trim()) {
        throw new Error(
          t("contact.name") +
            ", " +
            t("contact.email") +
            " & " +
            t("contact.message") +
            " required",
        );
      }
      await sendContactMessageAction({
        data: {
          name: name.trim(),
          email: email.trim(),
          subject,
          message: message.trim(),
        },
      });
    },
    onSuccess: () => {
      toast.success(t("contact.success"));
      setMessage("");
    },
    onError: (e: unknown) => toast.error(getErrorMessage(e, t("contact.error"))),
  });

  return (
    <AppShell title={t("contact.title")}>
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="rounded-3xl border border-border bg-gradient-to-br from-secondary/60 to-blush/40 p-5 text-center sm:p-8">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
            <Icon icon={faHeadset} className="text-lg" />
          </div>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">{t("contact.subtitle")}</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contact-name">{t("contact.name")}</Label>
              <Input id="contact-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-email">{t("contact.email")}</Label>
              <Input
                id="contact-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <Label>{t("contact.subject")}</Label>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUBJECTS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {t(s.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mt-4 space-y-2">
            <Label htmlFor="contact-message">{t("contact.message")}</Label>
            <Textarea
              id="contact-message"
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("contact.messagePlaceholder")}
            />
          </div>

          <button
            onClick={() => sendMessage.mutate()}
            disabled={sendMessage.isPending}
            className="hover-bounce mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            <Icon
              icon={sendMessage.isPending ? faSpinner : faPaperPlane}
              className={sendMessage.isPending ? "animate-spin" : ""}
            />
            {sendMessage.isPending ? t("contact.sending") : t("contact.send")}
          </button>

          <div className="mt-5 border-t border-border pt-4 text-center text-xs text-muted-foreground">
            {t("contact.directEmail")}{" "}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
            >
              <Icon icon={faEnvelope} className="text-[10px]" /> {SUPPORT_EMAIL}
            </a>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
