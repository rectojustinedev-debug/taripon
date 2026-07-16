import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/layout/AppShell";
import { Icon } from "@/components/Icon";
import {
  faWallet,
  faChartLine,
  faTrophy,
  faCalendarCheck,
} from "@fortawesome/free-solid-svg-icons";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { CATEGORIES, formatCurrency } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/statistics")({
  head: () => ({ meta: [{ title: "Statistics — TARIPON" }] }),
  component: StatsPage,
});

const PIE_COLORS = [
  "var(--chart-1)", // jade
  "var(--chart-3)", // harvest gold
  "var(--chart-2)", // bright jade
  "oklch(0.60 0.15 32)", // terracotta
  "oklch(0.60 0.10 220)", // teal-blue
  "var(--chart-5)", // deep jade
  "oklch(0.68 0.12 95)", // amber-tan
  "oklch(0.56 0.09 310)", // plum
  "oklch(0.68 0.11 130)", // olive
  "oklch(0.55 0.08 250)", // indigo
];

function StatsPage() {
  const currency =
    useQuery({
      queryKey: ["settings"],
      queryFn: async () => {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const u = { user: session?.user ?? null };
        const { data } = await supabase
          .from("settings")
          .select("currency")
          .eq("user_id", u.user!.id)
          .maybeSingle();
        return data?.currency ?? "PHP";
      },
    }).data ?? "PHP";

  const entries = useQuery({
    queryKey: ["entries"],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const u = { user: session?.user ?? null };
      if (!u.user) return [];
      const { data } = await supabase
        .from("entries")
        .select("*")
        .eq("user_id", u.user.id)
        .order("saving_date");
      return data ?? [];
    },
  });
  const list = useMemo(() => entries.data ?? [], [entries.data]);

  const stats = useMemo(() => {
    const total = list.reduce((s, e) => s + Number(e.amount), 0);
    const days = new Set(list.map((e) => e.saving_date)).size;
    const avg = days ? total / days : 0;
    const highest = list.reduce((m, e) => Math.max(m, Number(e.amount)), 0);
    return { total, days, avg, highest };
  }, [list]);

  // last 30 days bar
  const last30 = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const k = d.toISOString().slice(0, 10);
      map.set(k, 0);
    }
    for (const e of list) {
      if (map.has(e.saving_date))
        map.set(e.saving_date, (map.get(e.saving_date) ?? 0) + Number(e.amount));
    }
    return Array.from(map.entries()).map(([d, amt]) => ({ d: d.slice(5), amt }));
  }, [list]);

  // cumulative line
  const cumulative = useMemo(() => {
    let acc = 0;
    const map = new Map<string, number>();
    for (const e of list) {
      const k = e.saving_date;
      map.set(k, (map.get(k) ?? 0) + Number(e.amount));
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([d, amt]) => {
        acc += amt;
        return { d: d.slice(5), total: acc };
      });
  }, [list]);

  // category pie
  const byCategory = useMemo(() => {
    const out = CATEGORIES.map((c) => ({
      name: c[0].toUpperCase() + c.slice(1),
      value: list.filter((e) => e.category === c).reduce((s, e) => s + Number(e.amount), 0),
    })).filter((x) => x.value > 0);
    return out;
  }, [list]);

  // monthly comparison
  const monthly = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of list) {
      const k = e.saving_date.slice(0, 7);
      map.set(k, (map.get(k) ?? 0) + Number(e.amount));
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([m, amt]) => ({ m, amt }));
  }, [list]);

  return (
    <AppShell title="Statistics" background="bg-white dark:bg-background">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          icon={faWallet}
          label="Total saved"
          value={formatCurrency(stats.total, currency)}
          valueClassName="font-currency"
        />
        <Stat
          icon={faChartLine}
          label="Average / day"
          value={formatCurrency(stats.avg, currency)}
          valueClassName="font-currency"
        />
        <Stat
          icon={faTrophy}
          label="Highest entry"
          value={formatCurrency(stats.highest, currency)}
          valueClassName="font-currency"
        />
        <Stat icon={faCalendarCheck} label="Saving days" value={stats.days.toString()} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card title="Last 30 days">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={last30}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="d" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
              <YAxis tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid var(--color-border)",
                  background: "var(--color-card)",
                }}
              />
              <Bar dataKey="amt" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Cumulative savings">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={cumulative}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="d" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
              <YAxis tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid var(--color-border)",
                  background: "var(--color-card)",
                }}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="var(--color-primary)"
                strokeWidth={2.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card title="By category">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={byCategory}
                dataKey="value"
                nameKey="name"
                outerRadius={90}
                innerRadius={50}
              >
                {byCategory.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Monthly comparison">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="m" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
              <YAxis tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
              <Tooltip />
              <Bar dataKey="amt" fill="var(--color-accent-gold)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </AppShell>
  );
}

function Stat({
  icon,
  label,
  value,
  valueClassName = "",
}: {
  icon: typeof faWallet;
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft transition-all duration-200 hover:-translate-y-1 hover:shadow-md sm:p-5">
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
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-6">
      <h2 className="mb-4 font-display text-base font-bold text-foreground">{title}</h2>
      <div className="-mx-1 sm:mx-0">{children}</div>
    </div>
  );
}
