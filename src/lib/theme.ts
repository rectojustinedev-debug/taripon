/**
 * Centralized dark/light theme logic.
 *
 * Source of truth, in priority order:
 *   1. Explicit user choice, saved in localStorage under THEME_KEY.
 *   2. The OS-level `prefers-color-scheme` on first visit.
 *
 * The actual "no flash" behavior comes from `THEME_INIT_SCRIPT` below, which
 * must run as a blocking inline <script> in <head>, before any CSS paints.
 * Everything else in this file (React-side helpers) just needs to agree with
 * what that script already decided.
 */

export const THEME_KEY = "taripon-theme";

export type Theme = "light" | "dark";

/** Routes that are always rendered in light mode, regardless of the user's saved
 *  theme — the public marketing/auth shell keeps a fixed light brand look, while
 *  the authenticated app (dashboard, settings, etc.) remains themeable. */
export const LIGHT_ONLY_ROUTES = ["/", "/auth", "/reset-password", "/verify-email", "/terms"];

/** Inline script source, inlined into <head> so it runs before first paint. */
export const THEME_INIT_SCRIPT = `
(function () {
  try {
    var lightOnlyRoutes = ${JSON.stringify(LIGHT_ONLY_ROUTES)};
    if (lightOnlyRoutes.indexOf(window.location.pathname) !== -1) {
      document.documentElement.classList.remove("dark");
      return;
    }
    var stored = localStorage.getItem("${THEME_KEY}");
    var dark = stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", dark);
  } catch (e) {}
})();
`;

/** Reads the currently-applied theme. Safe to call after mount only. */
export function getAppliedTheme(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

/** Applies + persists an explicit user choice. */
export function setTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // localStorage may be unavailable (private mode, etc.) — theme still
    // applies for this session, it just won't persist.
  }
}

/** Has the user ever made an explicit choice, or are we still following the OS? */
export function hasExplicitTheme(): boolean {
  try {
    return localStorage.getItem(THEME_KEY) !== null;
  } catch {
    return false;
  }
}
