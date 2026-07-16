import { createFileRoute, Link } from "@tanstack/react-router";
import { Icon } from "@/components/Icon";
import { useForceLightTheme } from "@/lib/use-theme";
import { Logo } from "@/components/Logo";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — TARIPON" },
      { name: "description", content: "The terms and conditions for using TARIPON." },
    ],
  }),
  component: TermsPage,
});

const LAST_UPDATED = "July 5, 2026";

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "1. Acceptance of terms",
    body: [
      "By creating an account or using TARIPON in any way, you agree to these Terms & Conditions. If you don't agree with them, please don't use the app.",
    ],
  },
  {
    title: "2. What TARIPON is",
    body: [
      "TARIPON is a personal savings-tracking tool. It lets you log deposits, set goals, and view your own savings history and statistics.",
      "TARIPON is not a bank, is not a financial institution, and doesn't hold, transfer, or move real money on your behalf. It only records the numbers you enter yourself.",
    ],
  },
  {
    title: "3. Your account",
    body: [
      "You're responsible for keeping your login credentials secure and for all activity that happens under your account.",
      "You must provide accurate information when creating your account, and you must be old enough to legally agree to these terms in your country of residence.",
    ],
  },
  {
    title: "4. Accuracy of your data",
    body: [
      "Everything you see in TARIPON — balances, streaks, goal progress — is based entirely on the entries you make. We don't verify these against any bank or financial account, so the accuracy of your records is your responsibility.",
    ],
  },
  {
    title: "5. Acceptable use",
    body: [
      "Don't use TARIPON to store or transmit unlawful content, attempt to access other users' data, interfere with the service, or reverse-engineer the app beyond what's permitted by law.",
    ],
  },
  {
    title: "6. Your content",
    body: [
      "You own the data you enter into TARIPON. We store it so the app can function, and we don't sell your personal savings data to third parties.",
    ],
  },
  {
    title: "7. Service availability",
    body: [
      "We aim to keep TARIPON available and your data intact, but we can't guarantee uninterrupted access. We recommend exporting your data periodically if you want an offline backup.",
    ],
  },
  {
    title: "8. Termination",
    body: [
      "You can stop using TARIPON and delete your account at any time from Settings. We may suspend or terminate accounts that violate these terms.",
    ],
  },
  {
    title: "9. Disclaimer & limitation of liability",
    body: [
      'TARIPON is provided "as is," without warranties of any kind. To the fullest extent permitted by law, we aren\'t liable for financial decisions you make based on the app, or for any indirect or consequential damages arising from your use of it.',
    ],
  },
  {
    title: "10. Changes to these terms",
    body: [
      "We may update these terms from time to time. If we make material changes, we'll let you know in the app. Continuing to use TARIPON after an update means you accept the revised terms.",
    ],
  },
  {
    title: "11. Contact",
    body: ["Questions about these terms? Reach out through the Help & Support page in the app."],
  },
];

function TermsPage() {
  useForceLightTheme();
  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/40 via-background to-background">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-8 flex items-center justify-between gap-3">
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-2 text-sm font-medium text-foreground backdrop-blur transition-colors hover:border-primary hover:text-primary"
          >
            <Icon icon={faArrowLeft} className="text-xs" /> Back
          </Link>
          <Logo />
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-xl shadow-primary/5 sm:p-10">
          <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
            Terms &amp; Conditions
          </h1>
          <p className="mt-2 text-sm text-muted-foreground"> Current as of: {LAST_UPDATED}</p>

          <div className="mt-8 space-y-7">
            {SECTIONS.map((section) => (
              <section key={section.title}>
                <h2 className="font-display text-base font-semibold text-foreground">
                  {section.title}
                </h2>
                <div className="mt-2 space-y-2">
                  {section.body.map((p, i) => (
                    <p key={i} className="text-sm leading-relaxed text-muted-foreground">
                      {p}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Have questions?{" "}
          <Link to="/auth" className="font-medium text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
