/**
 * Safely pulls a human-readable message out of anything a mutation/promise
 * might reject with. Server function calls normally reject with a real
 * `Error`, but if a non-Error value ever slips through (a plain object, a
 * failed-to-parse response, etc.), naively doing `String(value)` produces
 * the unhelpful "[object Object]" — this always prefers a real string
 * message and falls back to `fallback` instead.
 */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string" &&
    (error as { message: string }).message.trim()
  ) {
    return (error as { message: string }).message;
  }
  return fallback;
}

type ReportOptions = {
  mechanism?: "manual" | "onerror" | "unhandledrejection" | "react_error_boundary";
  handled?: boolean;
  severity?: "error" | "warning" | "info";
};

/**
 * Lightweight client-side error reporter. Currently logs to the console;
 * swap in a real monitoring provider (Sentry, etc.) here if/when one is added.
 */
export function reportError(
  error: unknown,
  context: Record<string, unknown> = {},
  options: ReportOptions = {},
) {
  if (typeof window === "undefined") return;
  console.error("[TARIPON]", error, {
    route: window.location.pathname,
    mechanism: options.mechanism ?? "manual",
    severity: options.severity ?? "error",
    ...context,
  });
}
