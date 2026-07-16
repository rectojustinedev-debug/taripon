export function formatCurrency(amount: number, currency = "PHP") {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

/** Compact form for tight spaces, e.g. "₱150K" instead of "₱150,000.00", so amounts don't overflow small calendar cells. */
export function formatCurrencyCompact(amount: number, currency = "PHP") {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount);
  } catch {
    return formatCurrency(amount, currency);
  }
}

export function formatDate(
  date: string | Date,
  opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" },
) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(undefined, opts);
}

export function toISODate(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export const CATEGORIES = [
  "general",
  "food",
  "transport",
  "shopping",
  "bills",
  "entertainment",
  "education",
  "health",
  "gift",
  "other",
] as const;
export type Category = (typeof CATEGORIES)[number];
