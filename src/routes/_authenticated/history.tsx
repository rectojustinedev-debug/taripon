import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { EntryDialog, type EntryRecord } from "@/components/EntryDialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Icon } from "@/components/Icon";
import {
  faSearch,
  faDownload,
  faFileExcel,
  faPen,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { CATEGORIES, formatCurrency, formatDate } from "@/lib/format";
import { exportEntriesToExcel } from "@/lib/exportExcel";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({ meta: [{ title: "History — TARIPON" }] }),
  component: HistoryPage,
});

const PAGE = 12;

function HistoryPage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [sort, setSort] = useState<"date_desc" | "date_asc" | "amt_desc" | "amt_asc">("date_desc");
  const [page, setPage] = useState(0);
  const [dialog, setDialog] = useState<{ open: boolean; entry?: EntryRecord }>({ open: false });

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
      const { data } = await supabase.from("entries").select("*").eq("user_id", u.user.id);
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    let l = entries.data ?? [];
    if (cat !== "all") l = l.filter((e) => e.category === cat);
    if (q.trim()) {
      const s = q.toLowerCase();
      l = l.filter((e) => (e.note ?? "").toLowerCase().includes(s) || e.category.includes(s));
    }
    const sorted = [...l].sort((a, b) => {
      switch (sort) {
        case "date_asc":
          return a.saving_date.localeCompare(b.saving_date);
        case "amt_desc":
          return Number(b.amount) - Number(a.amount);
        case "amt_asc":
          return Number(a.amount) - Number(b.amount);
        default:
          return b.saving_date.localeCompare(a.saving_date);
      }
    });
    return sorted;
  }, [entries.data, q, cat, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const pageRows = filtered.slice(page * PAGE, page * PAGE + PAGE);

  function exportCsv() {
    const rows = [
      ["Date", "Amount", "Category", "Note"],
      ...filtered.map((e) => [
        e.saving_date,
        e.amount,
        e.category,
        (e.note ?? "").replace(/"/g, '""'),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c)}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `taripon-history-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportExcel() {
    if (filtered.length === 0) return toast.error("No entries to export.");
    exportEntriesToExcel(filtered, { currency });
    toast.success("Excel file downloaded");
  }

  return (
    <AppShell
      title="History"
      background="bg-white dark:bg-background"
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground hover:border-primary hover:text-primary"
          >
            <Icon icon={faDownload} /> <span className="hidden sm:inline">CSV</span>
          </button>
          <button
            onClick={exportExcel}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground hover:border-primary hover:text-primary"
          >
            <Icon icon={faFileExcel} /> <span className="hidden sm:inline">Excel</span>
          </button>
        </div>
      }
    >
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Icon
              icon={faSearch}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm"
            />
            <Input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(0);
              }}
              placeholder="Search notes or categories…"
              className="pl-9"
            />
          </div>
          <Select
            value={cat}
            onValueChange={(v) => {
              setCat(v);
              setPage(0);
            }}
          >
            <SelectTrigger className="w-full sm:min-w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c[0].toUpperCase() + c.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
            <SelectTrigger className="w-full sm:min-w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date_desc">Newest first</SelectItem>
              <SelectItem value="date_asc">Oldest first</SelectItem>
              <SelectItem value="amt_desc">Largest amount</SelectItem>
              <SelectItem value="amt_asc">Smallest amount</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Mobile card list */}
        <ul className="mt-5 space-y-2 md:hidden">
          {pageRows.map((e) => (
            <li key={e.id} className="rounded-xl border border-border bg-background p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-currency text-base font-bold text-foreground">
                    {formatCurrency(Number(e.amount), currency)}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {formatDate(e.saving_date)} ·{" "}
                    {e.category[0].toUpperCase() + e.category.slice(1)}
                  </div>
                  {e.note && (
                    <div className="mt-1 line-clamp-2 text-xs text-foreground/80">{e.note}</div>
                  )}
                </div>
                <button
                  onClick={() => setDialog({ open: true, entry: e as unknown as EntryRecord })}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border text-foreground hover:border-primary hover:text-primary"
                >
                  <Icon icon={faPen} className="text-xs" />
                </button>
              </div>
            </li>
          ))}
          {pageRows.length === 0 && (
            <li className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
              No results.
            </li>
          )}
        </ul>

        {/* Desktop table */}
        <div className="mt-6 hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="pb-3 pr-4 font-semibold">Date</th>
                <th className="pb-3 pr-4 font-semibold">Amount</th>
                <th className="pb-3 pr-4 font-semibold">Category</th>
                <th className="pb-3 pr-4 font-semibold">Note</th>
                <th className="pb-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pageRows.map((e) => (
                <tr key={e.id} className="text-foreground">
                  <td className="py-3 pr-4 whitespace-nowrap">{formatDate(e.saving_date)}</td>
                  <td className="font-currency py-3 pr-4 font-semibold whitespace-nowrap">
                    {formatCurrency(Number(e.amount), currency)}
                  </td>
                  <td className="py-3 pr-4">{e.category[0].toUpperCase() + e.category.slice(1)}</td>
                  <td className="py-3 pr-4 max-w-xs truncate text-muted-foreground">
                    {e.note ?? "—"}
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => setDialog({ open: true, entry: e as unknown as EntryRecord })}
                      className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-foreground hover:border-primary hover:text-primary"
                    >
                      <Icon icon={faPen} className="text-[10px]" /> Edit
                    </button>
                  </td>
                </tr>
              ))}
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground">
                    No results.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 text-xs text-muted-foreground sm:text-sm">
          <span className="truncate">
            {filtered.length} entr{filtered.length === 1 ? "y" : "ies"}
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="grid h-9 w-9 place-items-center rounded-lg border border-border disabled:opacity-40 hover:border-primary hover:text-primary"
            >
              <Icon icon={faChevronLeft} />
            </button>
            <span className="whitespace-nowrap">
              {page + 1} / {totalPages}
            </span>
            <button
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="grid h-9 w-9 place-items-center rounded-lg border border-border disabled:opacity-40 hover:border-primary hover:text-primary"
            >
              <Icon icon={faChevronRight} />
            </button>
          </div>
        </div>
      </div>

      <EntryDialog
        open={dialog.open}
        onOpenChange={(v) => setDialog((d) => ({ ...d, open: v }))}
        entry={dialog.entry}
      />
    </AppShell>
  );
}
