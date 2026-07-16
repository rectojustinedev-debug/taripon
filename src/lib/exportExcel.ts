import * as XLSX from "xlsx";

type EntryRow = {
  saving_date: string;
  amount: number | string;
  category: string;
  note?: string | null;
};

type GoalRow = {
  title: string;
  target_amount: number | string;
  current_amount: number | string;
  deadline?: string | null;
  status: string;
};

function capitalize(s: string) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

/** Sizes columns to fit their header + longest value, in Excel "character width" units. */
function autoWidth(rows: Record<string, unknown>[]) {
  if (rows.length === 0) return [];
  const keys = Object.keys(rows[0]);
  return keys.map((key) => {
    const longest = rows.reduce((max, row) => {
      const val = row[key];
      const len = val == null ? 0 : String(val).length;
      return Math.max(max, len);
    }, key.length);
    return { wch: Math.min(Math.max(longest + 2, 10), 42) };
  });
}

/** Applies a number format to every data cell (row 1 = header) in a given column index. */
function formatColumn(ws: XLSX.WorkSheet, colIndex: number, numFmt: string) {
  const ref = ws["!ref"];
  if (!ref) return;
  const range = XLSX.utils.decode_range(ref);
  for (let r = range.s.r + 1; r <= range.e.r; r++) {
    const cell = ws[XLSX.utils.encode_cell({ r, c: colIndex })];
    if (cell && cell.t === "n") cell.z = numFmt;
  }
}

function download(wb: XLSX.WorkBook, filename: string) {
  XLSX.writeFile(wb, filename, { compression: true });
}

/** Builds a two-sheet workbook (Entries + Summary) from a filtered list of savings entries. */
export function exportEntriesToExcel(
  entries: EntryRow[],
  opts: { currency?: string; filename?: string } = {},
) {
  const rows = entries.map((e) => ({
    Date: e.saving_date,
    Amount: Number(e.amount),
    Category: capitalize(e.category),
    Note: e.note ?? "",
  }));

  const wb = XLSX.utils.book_new();

  const entriesWs = XLSX.utils.json_to_sheet(rows);
  entriesWs["!cols"] = autoWidth(rows);
  formatColumn(entriesWs, 1, "#,##0.00");
  XLSX.utils.book_append_sheet(wb, entriesWs, "Entries");

  const total = rows.reduce((s, r) => s + (Number.isFinite(r.Amount) ? r.Amount : 0), 0);
  const byCategory = new Map<string, number>();
  for (const r of rows) byCategory.set(r.Category, (byCategory.get(r.Category) ?? 0) + r.Amount);

  const summaryAoa: (string | number)[][] = [
    ["TARIPON — Savings Export"],
    ["Generated", new Date().toLocaleString()],
    ["Currency", opts.currency ?? "PHP"],
    [],
    ["Total entries", rows.length],
    ["Total saved", total],
    [],
    ["By category", "Amount"],
    ...Array.from(byCategory.entries()).sort((a, b) => b[1] - a[1]),
  ];
  const summaryWs = XLSX.utils.aoa_to_sheet(summaryAoa);
  summaryWs["!cols"] = [{ wch: 24 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

  download(wb, opts.filename ?? `taripon-history-${Date.now()}.xlsx`);
}

/** Builds a full account export (Entries, Goals, Summary) for the settings "export all data" action. */
export function exportAccountToExcel(data: {
  entries: EntryRow[];
  goals: GoalRow[];
  currency?: string;
  fullName?: string | null;
  email?: string | null;
  filename?: string;
}) {
  const wb = XLSX.utils.book_new();

  const entryRows = data.entries.map((e) => ({
    Date: e.saving_date,
    Amount: Number(e.amount),
    Category: capitalize(e.category),
    Note: e.note ?? "",
  }));
  const entriesWs = XLSX.utils.json_to_sheet(entryRows);
  entriesWs["!cols"] = autoWidth(entryRows);
  formatColumn(entriesWs, 1, "#,##0.00");
  XLSX.utils.book_append_sheet(wb, entriesWs, "Entries");

  const goalRows = data.goals.map((g) => {
    const target = Number(g.target_amount);
    const current = Number(g.current_amount);
    return {
      Title: g.title,
      Target: target,
      Current: current,
      "Progress %": target > 0 ? Math.round((current / target) * 100) : 0,
      Deadline: g.deadline ?? "",
      Status: capitalize(g.status),
    };
  });
  const goalsWs = XLSX.utils.json_to_sheet(goalRows);
  goalsWs["!cols"] = autoWidth(goalRows);
  formatColumn(goalsWs, 1, "#,##0.00");
  formatColumn(goalsWs, 2, "#,##0.00");
  XLSX.utils.book_append_sheet(wb, goalsWs, "Goals");

  const total = entryRows.reduce((s, r) => s + (Number.isFinite(r.Amount) ? r.Amount : 0), 0);
  const summaryAoa: (string | number)[][] = [
    ["TARIPON — Account Export"],
    ["Name", data.fullName ?? "—"],
    ["Email", data.email ?? "—"],
    ["Generated", new Date().toLocaleString()],
    ["Currency", data.currency ?? "PHP"],
    [],
    ["Total entries", entryRows.length],
    ["Total saved", total],
    ["Total goals", goalRows.length],
    ["Goals completed", goalRows.filter((g) => g.Status === "Completed").length],
  ];
  const summaryWs = XLSX.utils.aoa_to_sheet(summaryAoa);
  summaryWs["!cols"] = [{ wch: 24 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

  download(wb, data.filename ?? `taripon-export-${Date.now()}.xlsx`);
}
