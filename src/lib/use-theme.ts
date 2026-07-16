import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { getAppliedTheme, hasExplicitTheme, setTheme, type Theme } from "@/lib/theme";

/**
 * Single hook for reading/toggling the app theme. Any component that needs
 * to show or change the current theme should use this instead of touching
 * `document.documentElement` or localStorage directly — keeps every surface
 * (sidebar toggle, command palette, settings page) in sync with each other
 * and with the no-flash init script in the root route.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    setThemeState(getAppliedTheme());

    // If the user hasn't made an explicit choice yet, keep following the OS
    // theme live (e.g. they switch their system to dark while the tab is open).
    if (hasExplicitTheme()) return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => {
      const next = e.matches ? "dark" : "light";
      document.documentElement.classList.toggle("dark", next === "dark");
      setThemeState(next);
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  const toggle = useCallback(() => {
    setThemeState((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      setTheme(next);
      return next;
    });
  }, []);

  return { theme, dark: theme === "dark", toggle };
}

/**
 * Forces the document into light mode for as long as the calling component is
 * mounted, regardless of the user's saved preference. Used by the public
 * marketing/auth pages (landing, sign in, reset password, verify email, terms),
 * which keep a fixed light brand look even when the rest of the app is dark.
 *
 * Restores whatever theme was active before on unmount, so navigating from a
 * light-only page into the themeable app (e.g. after signing in) doesn't get
 * stuck in light mode.
 */
export function useForceLightTheme() {
  useLayoutEffect(() => {
    const root = document.documentElement;
    const wasDark = root.classList.contains("dark");
    root.classList.remove("dark");
    return () => {
      if (wasDark) root.classList.add("dark");
    };
  }, []);
}
