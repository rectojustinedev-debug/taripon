import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/layout/AppShell";
import { EntryDialog, type EntryRecord } from "@/components/EntryDialog";
import { Icon } from "@/components/Icon";
import { faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { formatCurrency, formatCurrencyCompact, toISODate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/calendar")({
  head: () => ({ meta: [{ title: "Calendar — TARIPON" }] }),
  component: CalendarPage,
});

function shadeFor(amt: number, _max: number) {
  return amt > 0 ? "bg-leaf-2" : "bg-leaf-0";
}

function CalendarPage() {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [dialog, setDialog] = useState<{ open: boolean; date?: Date; entry?: EntryRecord }>({
    open: false,
  });
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

  const month = cursor.getMonth();
  const year = cursor.getFullYear();
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);

  const entries = useQuery({
    queryKey: ["entries", "month", year, month],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const u = { user: session?.user ?? null };
      if (!u.user) return [];
      const from = toISODate(monthStart);
      const to = toISODate(monthEnd);
      const { data, error } = await supabase
        .from("entries")
        .select("*")
        .eq("user_id", u.user.id)
        .gte("saving_date", from)
        .lte("saving_date", to)
        .order("saving_date");
      if (error) throw error;
      return data ?? [];
    },
  });

  const byDay = useMemo(() => {
    const m = new Map<string, { amt: number; items: EntryRecord[] }>();
    for (const e of entries.data ?? []) {
      const cur = m.get(e.saving_date) ?? { amt: 0, items: [] };
      cur.amt += Number(e.amount);
      cur.items.push(e as unknown as EntryRecord);
      m.set(e.saving_date, cur);
    }
    return m;
  }, [entries.data]);

  const max = useMemo(() => {
    let m = 0;
    byDay.forEach((v) => {
      if (v.amt > m) m = v.amt;
    });
    return m;
  }, [byDay]);

  // build grid: leading blanks + days
  const startWeekday = monthStart.getDay();
  const daysInMonth = monthEnd.getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const monthLabel = cursor.toLocaleString(undefined, { month: "long", year: "numeric" });
  const monthTotal = Array.from(byDay.values()).reduce((s, v) => s + v.amt, 0);

  return (
    <AppShell title="Calendar" background="bg-white dark:bg-background">
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:flex-wrap sm:justify-between">
          <div className="min-w-0">
            <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground sm:text-xs">
              Monthly savings
            </div>
            <div className="mt-1 truncate text-lg font-bold text-foreground sm:text-2xl">
              {monthLabel}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="font-currency hidden min-w-[7rem] whitespace-nowrap rounded-full bg-secondary px-3 py-1.5 text-center text-xs font-semibold text-primary-dark sm:block sm:text-sm sm:px-4">
              {formatCurrency(monthTotal, currency)}
            </div>
            <button
              onClick={() => setCursor(new Date(year, month - 1, 1))}
              aria-label="Previous month"
              className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-card hover:border-primary hover:text-primary sm:h-10 sm:w-10"
            >
              <Icon icon={faChevronLeft} />
            </button>
            <button
              onClick={() => setCursor(new Date(year, month + 1, 1))}
              aria-label="Next month"
              className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-card hover:border-primary hover:text-primary sm:h-10 sm:w-10"
            >
              <Icon icon={faChevronRight} />
            </button>
          </div>
        </div>

        <div className="font-currency mt-3 rounded-lg bg-secondary px-3 py-1.5 text-center text-xs font-semibold text-primary-dark sm:hidden">
          {formatCurrency(monthTotal, currency)}
        </div>

        <div className="mt-5 grid grid-cols-7 gap-1 sm:mt-6 sm:gap-2">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div
              key={i}
              className="pb-1 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:pb-2 sm:text-xs"
            >
              <span className="sm:hidden">{d}</span>
              <span className="hidden sm:inline">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][i]}
              </span>
            </div>
          ))}
          {cells.map((c, i) => {
            if (!c) return <div key={i} />;
            const iso = toISODate(c);
            const data = byDay.get(iso);
            const shade = shadeFor(data?.amt ?? 0, max);
            const isToday = iso === toISODate(new Date());
            return (
              <motion.button
                key={i}
                whileHover={{ scale: 1.04 }}
                onClick={() => setDialog({ open: true, date: c, entry: data?.items[0] })}
                className={`group relative flex aspect-square flex-col items-center rounded-lg sm:rounded-xl ${shade} p-1 pt-1.5 text-center transition-shadow hover:shadow-md sm:p-2 sm:pt-2 ${isToday ? "ring-2 ring-primary ring-offset-1 ring-offset-card sm:ring-offset-2" : ""}`}
              >
                <div
                  className={`shrink-0 text-[10px] font-semibold sm:text-xs ${data?.amt ? "text-foreground" : "text-muted-foreground"}`}
                >
                  {c.getDate()}
                </div>
                {data?.amt ? (
                  <div className="mt-auto flex w-full flex-1 flex-col items-center justify-end pb-0.5">
                    <div
                      title={formatCurrency(data.amt, currency)}
                      className="font-currency hidden w-full truncate text-center text-[10px] font-bold leading-tight text-foreground sm:block"
                    >
                      {formatCurrencyCompact(data.amt, currency)}
                    </div>
                    <div className="mx-auto h-1 w-1 rounded-full bg-foreground sm:hidden" />
                  </div>
                ) : null}
              </motion.button>
            );
          })}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground sm:mt-6">
          <span className="text-[11px] sm:text-xs">Tap a day to add or edit</span>
          <div className="flex items-center gap-1.5">
            <span>No savings</span>
            <div className="h-3 w-3 rounded-sm bg-leaf-0" />
            <div className="h-3 w-3 rounded-sm bg-leaf-2" />
            <span>Saved</span>
          </div>
        </div>
      </div>

      <EntryDialog
        open={dialog.open}
        onOpenChange={(v) => setDialog((d) => ({ ...d, open: v }))}
        defaultDate={dialog.date}
        entry={dialog.entry}
      />
    </AppShell>
  );
}
