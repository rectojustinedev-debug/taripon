import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { Icon } from "@/components/Icon";
import { useForceLightTheme } from "@/lib/use-theme";
import {
  faArrowRight,
  faBullseye,
  faChartLine,
  faCalendarDays,
  faShieldHalved,
  faSeedling,
  faWandMagicSparkles,
  faHandHoldingDollar,
  faPiggyBank,
  faCircleCheck,
} from "@fortawesome/free-solid-svg-icons";

export const Route = createFileRoute("/")({
  component: Landing,
});

const FEATURES = [
  {
    icon: faSeedling,
    title: "Daily deposits",
    body: "Log every peso in seconds. Small acts, compounded — that's the whole game.",
  },
  {
    icon: faBullseye,
    title: "Goals with meaning",
    body: "Name what you're saving for. Track progress toward it, not toward an abstract number.",
  },
  {
    icon: faCalendarDays,
    title: "Calendar view",
    body: "See your saving streaks laid out by day. Skipped one? No guilt — just show up tomorrow.",
  },
  {
    icon: faChartLine,
    title: "Real statistics",
    body: "Monthly trends, category splits, and momentum — designed to be read, not decoded.",
  },
  {
    icon: faShieldHalved,
    title: "Private by default",
    body: "Row-level security keeps your data yours. Email sign-in with code verification — no tracking.",
  },
  {
    icon: faWandMagicSparkles,
    title: "Calm design",
    body: "No dark patterns, no nagging streaks. Just a quiet space to build a saving habit.",
  },
];

const STATS = [
  { icon: faCalendarDays, label: "Days to track savings" },
  { icon: faHandHoldingDollar, label: "Your savings, your control" },
  { icon: faPiggyBank, label: "Save anytime, anywhere" },
];

const CTA_PERKS = ["No credit card required", "No time-limited trials"];

function Landing() {
  useForceLightTheme();
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setAuthed(!!data.session?.user);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const ctaHref = authed ? "/dashboard" : "/auth";
  const ctaLabel = authed ? "Open your dashboard" : "Start saving free";

  return (
    <div className="landing-theme min-h-screen bg-white text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link to="/" className="flex min-w-0 items-center gap-2">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">
              Features
            </a>
            <a href="#how" className="transition-colors hover:text-foreground">
              How it works
            </a>
            <a href="#faq" className="transition-colors hover:text-foreground">
              FAQ
            </a>
          </nav>
          <Link
            to={ctaHref}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-soft transition-all hover:-translate-y-0.5 hover:bg-primary-dark"
          >
            {authed ? "Dashboard" : "Sign in"}
            <Icon icon={faArrowRight} className="text-xs" />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-20 bg-weave opacity-60"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-coin-scatter opacity-90"
        />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-14 sm:px-6 sm:pt-20 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:pb-28 lg:pt-24">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary-dark">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-gold" />
              Your Financial Goals Starts Here
            </span>

            <h1 className="mt-5 font-display text-5xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Save with purpose.
              <span className="text-gradient-primary"> Achieve more </span>
              with Taripon.
            </h1>
            <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
              Taripon makes saving simple. Record deposits, monitor your progress, and stay on track
              toward achieving every financial goal.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to={ctaHref}
                className="group inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-elegant transition-transform hover:-translate-y-0.5"
              >
                {ctaLabel}
                <Icon
                  icon={faArrowRight}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary-dark"
              >
                See how it works
              </a>
            </div>

            <dl className="mt-10 grid max-w-md grid-cols-3 gap-3">
              {STATS.map((s) => (
                <div
                  key={s.label}
                  className="rounded-2xl border border-border bg-card/70 px-3 py-3 text-center"
                >
                  <dt className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-lg text-primary-dark mx-auto sm:h-10 sm:w-10 sm:text-xl">
                    <Icon icon={s.icon} />
                  </dt>
                  <dd className="mt-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    {s.label}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <HeroCard />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border/60 bg-card/40">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-dark">
              Features Designed Around Your Goals
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold text-foreground sm:text-4xl">
              Designed to Fit Your Saving Lifestyle
            </h2>
            <p className="mt-4 text-muted-foreground">
              Designed to keep saving simple. Essential tools, clear progress, and meaningful
              insights to help you stay on track.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <article
                key={f.title}
                className="group rounded-3xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-soft"
              >
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-secondary text-primary-dark transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon icon={f.icon} />
                </div>
                <h3 className="mt-5 font-display text-lg font-bold text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <div aria-hidden className="h-3 bg-weave opacity-40" />

      {/* How it works */}
      <section id="how" className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-dark">
                Start Saving in Three Simple Steps
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold text-foreground sm:text-4xl">
                Track your savings. Build better saving habits. Reach your goals.
              </h2>
              <p className="mt-4 text-muted-foreground">
                Taripon is intentionally simple. A focused flow keeps saving easy and consistent.
              </p>
            </div>
            <ol className="space-y-4">
              {[
                {
                  n: "01",
                  t: "Create a savings goal that matters to you.",
                  d: "Whether you're saving for emergencies, a home, or retirement, every goal begins with a clear target.",
                },
                {
                  n: "02",
                  t: "Keep your savings on track by logging every deposit.",
                  d: "One quick entry. Add the amount, choose a category, and an optional note. Done in seconds.",
                },
                {
                  n: "03",
                  t: "Watch your savings grow, then adjust your plan as needed.",
                  d: "Your calendar and insights reveal your savings habits. Adjust your plan and keep improving.",
                },
              ].map((s) => (
                <li
                  key={s.n}
                  className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-5 rounded-3xl border border-border bg-card p-5 sm:p-6"
                >
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary font-display text-sm font-bold text-primary-foreground shadow-soft">
                    {s.n}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-display text-lg font-semibold text-foreground">{s.t}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-border/60 bg-card/40">
        <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 sm:py-24">
          <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <div className="mt-10 divide-y divide-border rounded-3xl border border-border bg-card">
            {[
              {
                q: "Is Taripon free to use?",
                a: "Yes. Taripon's core features—including savings tracking, goals, calendar, and insights—are free to use during beta.",
              },
              {
                q: "Does Taripon connect to my bank account?",
                a: "No. Taripon is designed for manual savings tracking. Logging each deposit helps you stay mindful of your progress and build a consistent savings habit.",
              },
              {
                q: "Is my data private and secure?",
                a: "Yes. Your data is private and accessible only to you. Every record is protected with secure authentication and row-level security tied to your account.",
              },
              {
                q: "Can I use Taripon outside the Philippines?",
                a: "Yes. Taripon works anywhere. You can customize your preferred currency and regional settings to match your location.",
              },
            ].map((f) => (
              <details key={f.q} className="group px-5 py-5 sm:px-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                  <span className="font-display text-base font-semibold text-foreground sm:text-lg">
                    {f.q}
                  </span>
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border text-muted-foreground transition-transform group-open:rotate-45">
                    <Icon icon={faArrowRight} className="rotate-[-45deg] text-xs" />
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/60">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 sm:py-24">
          <div className="group relative overflow-hidden rounded-[2rem] border border-border bg-gradient-primary p-8 text-primary-foreground shadow-elegant transition-shadow hover:shadow-[0_32px_80px_-30px_color-mix(in_oklab,var(--color-primary)_55%,transparent)] sm:p-12">
            {/* Layer 1 — woven ledger texture */}
            <div aria-hidden className="pointer-events-none absolute inset-0 bg-weave opacity-20" />

            {/* Layer 2 — scattered coin dots */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-coin-scatter opacity-30"
            />

            {/* Layer 3 — decorative floating coins */}
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full border-[6px] border-white/10"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-8 -left-8 h-36 w-36 rounded-full border-[4px] border-white/8"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute right-8 top-1/3 h-12 w-12 rounded-full bg-accent-gold/20 blur-sm"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute bottom-12 right-1/4 h-6 w-6 rounded-full bg-white/15 blur-[2px]"
            />

            {/* Layer 4 — abstract savings illustration (coins stacking upward) */}
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-2 -right-2 hidden select-none sm:block"
            >
              {/* Coin stack */}
              <div className="flex flex-col items-center gap-1.5 opacity-30">
                <div className="h-4 w-16 rounded-full border-2 border-white/25 bg-white/10" />
                <div className="h-4 w-20 rounded-full border-2 border-white/25 bg-white/10" />
                <div className="h-4 w-24 rounded-full border-2 border-white/25 bg-white/10" />
                <div className="h-4 w-28 rounded-full border-2 border-white/25 bg-white/10" />
                <div className="h-4 w-32 rounded-full border-2 border-white/25 bg-white/10" />
                <div className="h-4 w-36 rounded-full border-2 border-white/25 bg-white/15 shadow-[0_-6px_20px_rgba(255,255,255,0.08)]" />
              </div>
              {/* Small sparkle dots near the stack */}
              <div className="absolute -right-1 bottom-10 h-3 w-3 rounded-full bg-accent-gold/30 blur-[3px]" />
              <div className="absolute -left-2 bottom-6 h-2 w-2 rounded-full bg-white/20 blur-[2px]" />
            </div>

            <div className="relative max-w-xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-foreground/90 backdrop-blur-sm">
                <Icon icon={faSeedling} className="text-[10px]" /> Start today
              </span>
              <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">
                Begin your savings journey today — one step at a time.
              </h2>

              <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
                {CTA_PERKS.map((perk) => (
                  <li
                    key={perk}
                    className="flex items-center gap-2 text-sm font-medium text-primary-foreground/90"
                  >
                    <Icon icon={faCircleCheck} className="text-primary-foreground" />
                    {perk}
                  </li>
                ))}
              </ul>

              <p className="mt-4 text-sm text-primary-foreground/85 sm:text-base">
                Just a straightforward way to build better saving habits.
              </p>

              <Link
                to={ctaHref}
                className="mt-7 inline-flex items-center gap-2 rounded-full bg-background px-6 py-3 text-sm font-semibold text-primary-dark shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_28px_-12px_color-mix(in_oklab,var(--color-primary-dark)_30%,transparent)] active:scale-[0.97]"
              >
                {ctaLabel}
                <Icon
                  icon={faArrowRight}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-xs text-muted-foreground sm:px-6">
          <div className="flex items-center gap-2">
            <Logo />
          </div>
          <p>
            {`\u00a9 ${new Date().getFullYear()} TARIPON. Designed and powered by Coziestine Develops. All rights reserved.`}
          </p>
        </div>
      </footer>
    </div>
  );
}

/** Illustrative product card that sits next to the hero copy. */
function HeroCard() {
  return (
    <div className="relative min-w-0">
      <div
        aria-hidden
        className="absolute -inset-6 -z-10 rounded-[3rem] bg-coin-scatter opacity-80"
      />
      <div className="relative rounded-[2rem] border border-border bg-card p-5 shadow-elegant sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Current balance
            </p>
            <p className="mt-1 font-display font-currency text-3xl font-extrabold text-foreground sm:text-4xl">
              ₱42,180<span className="text-lg text-muted-foreground">.50</span>
            </p>
          </div>
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary-dark">
            <span className="font-currency">+₱1,240 this week</span>
          </span>
        </div>

        <div className="mt-5 grid grid-cols-7 items-end gap-1.5">
          {[38, 62, 45, 78, 55, 92, 70].map((h, i) => (
            <div
              key={i}
              className="rounded-md bg-primary"
              style={{ height: `${h * 0.9}px`, opacity: 0.4 + i * 0.09 }}
            />
          ))}
        </div>
        <div className="mt-2 grid grid-cols-7 text-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          {[
            { name: "Emergency fund", pct: 74, amt: "₱14,800 / ₱20,000" },
            { name: "Dream Home", pct: 42, amt: "₱8,400 / ₱20,000" },
            { name: "Retirement Fund", pct: 30, amt: "₱10,700 / ₱70,000" },
          ].map((g) => (
            <div key={g.name} className="rounded-2xl border border-border bg-background/60 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-foreground">{g.name}</span>
                <span className="font-currency text-xs text-muted-foreground">{g.amt}</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${g.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
