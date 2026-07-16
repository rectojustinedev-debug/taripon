import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/layout/AppShell";
import { Icon } from "@/components/Icon";
import { Skeleton } from "@/components/ui/skeleton";
import {
  faWallet,
  faChartLine,
  faBolt,
  faBullseye,
  faCalendarDays,
  faArrowRight,
  faClock,
  faPiggyBank,
  faRocket,
  faArrowUp,
  faArrowDown,
  faChevronDown,
} from "@fortawesome/free-solid-svg-icons";
import { CATEGORIES, formatCurrency, formatDate, toISODate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — TARIPON" }] }),
  component: Dashboard,
});

function useCurrency() {
  const { data } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const u = { user: session?.user ?? null };
      if (!u.user) return null;
      const { data } = await supabase
        .from("settings")
        .select("currency")
        .eq("user_id", u.user.id)
        .maybeSingle();
      return data;
    },
  });
  return data?.currency ?? "PHP";
}

function Dashboard() {
  const currency = useCurrency();

  const entries = useQuery({
    queryKey: ["entries"],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const u = { user: session?.user ?? null };
      if (!u.user) return [];
      const { data, error } = await supabase
        .from("entries")
        .select("*")
        .eq("user_id", u.user.id)
        .order("saving_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const goals = useQuery({
    queryKey: ["goals"],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const u = { user: session?.user ?? null };
      if (!u.user) return [];
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .eq("user_id", u.user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const list = entries.data ?? [];
  const total = list.reduce((s, e) => s + Number(e.amount), 0);
  const today = new Date();
  const monthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const thisMonth = list.filter((e) => e.saving_date.startsWith(monthKey));
  const monthTotal = thisMonth.reduce((s, e) => s + Number(e.amount), 0);

  // streak (consecutive days from today)
  const dateSet = new Set(list.map((e) => e.saving_date));
  let streak = 0;
  const cur = new Date();
  while (dateSet.has(toISODate(cur))) {
    streak++;
    cur.setDate(cur.getDate() - 1);
  }

  // best day
  const byDay = new Map<string, number>();
  for (const e of list)
    byDay.set(e.saving_date, (byDay.get(e.saving_date) ?? 0) + Number(e.amount));
  const dayEntries: Array<{ date: string; amt: number }> = Array.from(byDay.entries()).map(
    ([date, amt]) => ({ date, amt }),
  );
  const best = dayEntries.reduce<{ date: string; amt: number } | null>(
    (acc, cur) => (!acc || cur.amt > acc.amt ? cur : acc),
    null,
  );

  const categoryTotals = CATEGORIES.map((c) => ({
    category: c,
    amt: list.filter((e) => e.category === c).reduce((s, e) => s + Number(e.amount), 0),
  }))
    .filter((c) => c.amt > 0)
    .sort((a, b) => b.amt - a.amt);

  const activeGoal = goals.data?.find((g) => g.status === "active");
  const activeGoalTarget = Number(activeGoal?.target_amount);
  const goalPct =
    activeGoal && activeGoalTarget > 0
      ? Math.min(100, (Number(activeGoal.current_amount) / activeGoalTarget) * 100)
      : 0;

  // Savings pace: average daily amount over the last 30 days of activity,
  // used to project when the active goal will be reached at the current rate.
  const last30 = new Date();
  last30.setDate(last30.getDate() - 30);
  const recent = list.filter((e) => new Date(e.saving_date) >= last30);
  const recentTotal = recent.reduce((s, e) => s + Number(e.amount), 0);
  const dailyPace = recentTotal / 30;

  let projection: string | null = null;
  if (activeGoal && dailyPace > 0) {
    const remaining = Math.max(
      0,
      Number(activeGoal.target_amount) - Number(activeGoal.current_amount),
    );
    if (remaining === 0) {
      projection = "Goal reached!";
    } else {
      const daysNeeded = Math.ceil(remaining / dailyPace);
      const eta = new Date();
      eta.setDate(eta.getDate() + daysNeeded);
      projection = `${formatDate(eta, { month: "short", day: "numeric", year: "numeric" })} at this pace`;
    }
  }

  return (
    <AppShell
      title="Dashboard"
      background="bg-white dark:bg-background"
      actions={
        <Link
          to="/calendar"
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-primary hover:text-primary hover:shadow-md sm:px-4 sm:py-2.5"
        >
          <Icon icon={faCalendarDays} /> <span className="hidden sm:inline">View Calendar</span>
        </Link>
      }
    >
      {/* Hero balance card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-primary p-5 text-white shadow-elegant sm:p-8">
        {/* decorative blobs + signature weave */}
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-weave opacity-10" />
        <div className="pointer-events-none absolute -right-6 -top-10 h-36 w-36 rounded-full bg-accent-gold/40 blur-0 sm:h-44 sm:w-44" />
        <div className="pointer-events-none absolute -right-14 top-6 h-24 w-24 rounded-full bg-white/15 sm:h-28 sm:w-28" />
        <div className="pointer-events-none absolute -bottom-10 -left-8 h-28 w-28 rounded-full bg-white/10 sm:h-32 sm:w-32" />

        <div className="relative z-10">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider opacity-80 sm:text-sm">
              Total saved
            </span>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15 backdrop-blur-sm">
              <Icon icon={faWallet} />
            </span>
          </div>

          {entries.isLoading ? (
            <div className="mt-3 h-10 w-48 animate-pulse rounded-lg bg-white/15" />
          ) : (
            <div className="font-currency mt-2 text-left font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
              {formatCurrency(total, currency)}
            </div>
          )}

          <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-white/10 p-3 backdrop-blur-sm sm:p-4">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15 text-emerald-200">
                <Icon icon={faArrowUp} className="text-xs" />
              </span>
              <div className="min-w-0">
                <div className="text-[11px] opacity-80">This month</div>
                <div className="font-currency truncate text-sm font-bold sm:text-base">
                  {formatCurrency(monthTotal, currency)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2.5 border-l border-white/15 pl-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15 text-amber-200">
                <Icon icon={faBolt} className="text-xs" />
              </span>
              <div className="min-w-0">
                <div className="text-[11px] opacity-80">Current streak</div>
                <div className="truncate text-sm font-bold sm:text-base">
                  {streak} day{streak === 1 ? "" : "s"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {entries.isLoading || goals.isLoading ? (
          Array.from({ length: 2 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              icon={faBullseye}
              label="Goal progress"
              value={`${Math.round(goalPct)}%`}
              sub={activeGoal?.title ?? "No active goal"}
              tint
            />
            <StatCard
              icon={faChartLine}
              label="Daily average (30d)"
              value={formatCurrency(dailyPace, currency)}
              valueClassName="font-currency"
              sub="Based on the last 30 days"
            />
          </>
        )}
      </div>

      <div className="mt-4 grid gap-4 sm:mt-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="truncate font-display text-base font-bold text-foreground">
              Recent activity
            </h2>
            <Link
              to="/history"
              className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary-dark hover:underline"
            >
              See all <Icon icon={faArrowRight} className="text-[10px]" />
            </Link>
          </div>
          {entries.isLoading ? (
            <ul className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <li key={i} className="flex items-center gap-3 py-1 sm:gap-4">
                  <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-20" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-3 w-14 shrink-0" />
                </li>
              ))}
            </ul>
          ) : list.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-10 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary text-xl text-primary-dark">
                <Icon icon={faPiggyBank} />
              </div>
              <p className="text-sm text-muted-foreground">
                No savings yet — tap "Add" to log your first peso.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {list.slice(0, 6).map((e) => (
                <li
                  key={e.id}
                  className="flex items-center gap-3 py-3 transition-all duration-150 hover:bg-muted/40 sm:-mx-2 sm:gap-4 sm:rounded-lg sm:px-2"
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary text-primary-dark">
                    <Icon icon={faWallet} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-currency truncate text-sm font-semibold text-foreground">
                      {formatCurrency(Number(e.amount), currency)}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {capitalize(e.category)}
                      {e.note ? ` · ${e.note}` : ""}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 whitespace-nowrap text-xs text-muted-foreground">
                    <Icon icon={faClock} className="text-[10px]" />{" "}
                    {formatDate(e.saving_date, { month: "short", day: "numeric" })}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl bg-gradient-primary p-5 text-white shadow-elegant sm:p-6">
          <div className="text-xs font-semibold uppercase tracking-wider opacity-80">
            Monthly summary
          </div>
          <div className="font-currency mt-2 font-display text-2xl font-bold sm:text-3xl">
            {formatCurrency(monthTotal, currency)}
          </div>
          <p className="mt-1 text-xs opacity-90 sm:text-sm">
            {thisMonth.length} entries · best day{" "}
            {best ? (
              <>
                {formatDate(best.date, { month: "short", day: "numeric" })} (
                <span className="font-currency">{formatCurrency(best.amt, currency)}</span>)
              </>
            ) : (
              "—"
            )}
          </p>
          <div className="mt-5 rounded-xl bg-white/10 p-4 backdrop-blur-sm">
            <div className="text-xs opacity-80">Active goal</div>
            <div className="mt-1 truncate text-base font-semibold">
              {activeGoal?.title ?? "Set your first goal"}
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-white transition-[width] duration-500 ease-out"
                style={{ width: `${goalPct}%` }}
              />
            </div>
            <div className="mt-2 text-xs opacity-90">{Math.round(goalPct)}% complete</div>
            {projection && (
              <div className="mt-3 flex items-center gap-1.5 border-t border-white/15 pt-3 text-xs opacity-90">
                <Icon icon={faRocket} className="text-[11px]" /> On track for {projection}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* top categories — ranked, colorful cards */}
      <div className="mt-4 sm:mt-6">
        <div className="mb-3 flex items-center justify-between gap-3 sm:mb-4">
          <h2 className="font-display text-base font-bold text-foreground sm:text-lg">
            Top categories
          </h2>
          <span className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary-dark">
            All time
          </span>
        </div>
        {entries.isLoading ? (
          <div className="flex gap-3 overflow-x-auto pb-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-36 shrink-0 rounded-2xl" />
            ))}
          </div>
        ) : categoryTotals.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-10 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary text-xl text-primary-dark">
              <Icon icon={faPiggyBank} />
            </div>
            <p className="text-sm text-muted-foreground">No categories yet.</p>
          </div>
        ) : (
          <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2 sm:gap-4">
            {categoryTotals.slice(0, 5).map((c, i) => (
              <div
                key={c.category}
                className={`relative flex h-32 w-32 shrink-0 flex-col justify-between rounded-2xl p-3.5 text-white shadow-soft transition-transform duration-150 hover:-translate-y-0.5 sm:h-36 sm:w-36 sm:p-4 ${RANK_COLORS[i % RANK_COLORS.length]}`}
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-white/25 text-xs font-bold backdrop-blur-sm">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-xs font-medium opacity-90 sm:text-sm">
                    {capitalize(c.category)}
                  </div>
                  <div className="font-currency truncate text-base font-extrabold sm:text-lg">
                    {formatCurrency(c.amt, currency)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* category share — budget-style progress bars */}
      <div className="mt-4 rounded-2xl border border-border bg-card p-4 shadow-soft sm:mt-6 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-display text-base font-bold text-foreground">Category breakdown</h2>
          <span className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary-dark">
            All time
          </span>
        </div>
        {entries.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : categoryTotals.length === 0 ? (
          <p className="text-sm text-muted-foreground">No entries logged yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {categoryTotals.map((c) => {
              const share = total > 0 ? (c.amt / total) * 100 : 0;
              return (
                <div key={c.category} className="rounded-xl border border-border p-3.5 sm:p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-foreground">
                      {capitalize(c.category)}
                    </span>
                    <Icon
                      icon={faChevronDown}
                      className="shrink-0 -rotate-90 text-[10px] text-muted-foreground"
                    />
                  </div>
                  <div className="font-currency mt-1 text-center text-lg font-bold text-foreground sm:text-left">
                    {formatCurrency(c.amt, currency)}
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
                      style={{ width: `${Math.max(4, share)}%` }}
                    />
                  </div>
                  <div className="mt-1.5 text-right text-xs text-muted-foreground">
                    {share.toFixed(0)}% of total
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}

const RANK_COLORS = [
  "bg-gradient-to-br from-[oklch(0.72_0.14_78)] to-[oklch(0.56_0.14_50)]", // gold — 1st
  "bg-gradient-to-br from-[oklch(0.56_0.13_162)] to-[oklch(0.36_0.10_163)]", // jade — 2nd
  "bg-gradient-to-br from-[oklch(0.58_0.09_220)] to-[oklch(0.40_0.08_230)]", // teal-blue — 3rd
  "bg-gradient-to-br from-[oklch(0.56_0.09_310)] to-[oklch(0.38_0.09_305)]", // plum
  "bg-gradient-to-br from-[oklch(0.60_0.15_32)] to-[oklch(0.44_0.13_28)]", // terracotta
];

function capitalize(s: string) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

function StatCard({
  icon,
  label,
  value,
  sub,
  tint,
  valueClassName = "",
}: {
  icon: typeof faWallet;
  label: string;
  value: string;
  sub?: string;
  tint?: boolean;
  valueClassName?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-border p-4 shadow-soft transition-all duration-200 hover:-translate-y-1 hover:shadow-md sm:p-5 ${tint ? "bg-secondary/40" : "bg-card"}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-primary text-white shadow-sm sm:h-10 sm:w-10">
          <Icon icon={icon} />
        </div>
        <span className="truncate text-[11px] font-medium text-muted-foreground sm:text-xs">
          {label}
        </span>
      </div>
      <div
        className={`mt-3 truncate font-display text-xl font-bold text-foreground sm:mt-4 sm:text-2xl ${valueClassName}`}
      >
        {value}
      </div>
      {sub && <div className="mt-1 truncate text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-9 w-9 rounded-xl sm:h-10 sm:w-10" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="mt-4 h-6 w-24 sm:mt-5" />
    </div>
  );
}
