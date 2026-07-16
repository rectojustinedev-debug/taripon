import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { Icon } from "@/components/Icon";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { EntryDialog } from "@/components/EntryDialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { getGreeting, formatPHDateTime, firstNameOf } from "@/lib/greeting";
import {
  faHouse,
  faCalendarDays,
  faBullseye,
  faChartLine,
  faClockRotateLeft,
  faGear,
  faMoon,
  faSun,
  faPlus,
  faSignOut,
  faUser,
  faMagnifyingGlass,
  faBars,
} from "@fortawesome/free-solid-svg-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLanguage, type TranslationKey } from "@/lib/i18n";
import { useTheme } from "@/lib/use-theme";

const NAV_ITEMS = [
  { to: "/dashboard", labelKey: "nav.home", icon: faHouse },
  { to: "/calendar", labelKey: "nav.calendar", icon: faCalendarDays },
  { to: "/goals", labelKey: "nav.goals", icon: faBullseye },
  { to: "/statistics", labelKey: "nav.stats", icon: faChartLine },
  { to: "/history", labelKey: "nav.history", icon: faClockRotateLeft },
  { to: "/settings", labelKey: "nav.settings", icon: faGear },
] as const satisfies { to: string; labelKey: TranslationKey; icon: unknown }[];

/**
 * Mobile bottom nav: Home, Calendar, Stats, Goals sit directly on the bar;
 * History and Settings live one tap deeper, behind the Menu tab's sheet.
 */
const MOBILE_PRIMARY_ITEMS = [
  { to: "/dashboard", labelKey: "nav.home", icon: faHouse },
  { to: "/calendar", labelKey: "nav.calendar", icon: faCalendarDays },
  { to: "/statistics", labelKey: "nav.stats", icon: faChartLine },
  { to: "/goals", labelKey: "nav.goals", icon: faBullseye },
] as const satisfies { to: string; labelKey: TranslationKey; icon: unknown }[];

const MOBILE_MENU_ITEMS = [
  { to: "/history", labelKey: "nav.history", icon: faClockRotateLeft },
  { to: "/settings", labelKey: "nav.settings", icon: faGear },
] as const satisfies { to: string; labelKey: TranslationKey; icon: unknown }[];

export function ThemeToggle({
  className = "",
  size = "default",
}: {
  className?: string;
  size?: "default" | "sm";
}) {
  const { dark, toggle } = useTheme();
  const sizeClasses = size === "sm" ? "h-7 w-7 rounded-lg" : "h-10 w-10 rounded-xl";
  return (
    <button
      type="button"
      aria-label="Toggle dark mode"
      onClick={toggle}
      className={`grid shrink-0 place-items-center border border-border bg-card text-foreground transition-colors hover:border-primary hover:text-primary ${sizeClasses} ${className}`}
    >
      <Icon icon={dark ? faSun : faMoon} className={size === "sm" ? "text-xs" : undefined} />
    </button>
  );
}

/** Ticks once a minute so greetings / clocks stay fresh without excess re-renders. */
function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

/** Initials from a full name/email, used as the avatar fallback — no auto-generated avatar images. */
function initialsOf(
  profile: { full_name?: string | null; email?: string | null } | null | undefined,
) {
  const source = profile?.full_name?.trim() || profile?.email?.trim();
  if (!source) return null;
  const parts = source.includes("@") ? [source.split("@")[0]] : source.split(/\s+/);
  const letters = parts
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
  return letters || null;
}

/** Avatar: shows the user's real photo if set, otherwise their initials, otherwise a generic icon. Never fabricates a fake avatar image. */
function Avatar({
  profile,
  className = "",
  iconClassName = "",
}: {
  profile:
    | { avatar_url?: string | null; full_name?: string | null; email?: string | null }
    | null
    | undefined;
  className?: string;
  iconClassName?: string;
}) {
  const initials = initialsOf(profile);
  return (
    <div
      className={`grid shrink-0 place-items-center overflow-hidden rounded-full bg-secondary font-bold text-primary-dark ${className}`}
    >
      {profile?.avatar_url ? (
        <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
      ) : initials ? (
        <span>{initials}</span>
      ) : (
        <Icon icon={faUser} className={iconClassName} />
      )}
    </div>
  );
}

function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const u = { user: session?.user ?? null };
      if (!u.user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", u.user.id)
        .maybeSingle();
      return { ...data, email: u.user.email } as (typeof data & { email?: string | null }) | null;
    },
  });
}

function ProfileChip({
  profile,
  onSignOut,
  className = "",
  trailing,
}: {
  profile: { avatar_url?: string | null; full_name?: string | null } | null | undefined;
  onSignOut: () => void;
  className?: string;
  trailing?: ReactNode;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-xl border border-border bg-card px-2 py-1.5 ${className}`}
    >
      <Avatar profile={profile} className="h-7 w-7 text-xs" iconClassName="text-xs" />
      <div className="hidden min-w-0 flex-1 md:block">
        <div className="max-w-[120px] truncate text-xs font-semibold text-foreground">
          {profile?.full_name ?? "You"}
        </div>
      </div>
      {trailing}
      <button
        onClick={onSignOut}
        aria-label="Sign out"
        className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <Icon icon={faSignOut} />
      </button>
    </div>
  );
}

function SidebarNav({ pathname }: { pathname: string }) {
  const { t } = useLanguage();
  return (
    <nav aria-label="Primary" className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-2">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
              active
                ? "bg-secondary text-primary-dark dark:text-white"
                : "text-muted-foreground hover:translate-x-0.5 hover:bg-primary/10 hover:text-primary-dark dark:text-white/70 dark:hover:bg-primary/15 dark:hover:text-white"
            }`}
          >
            <span
              className={`absolute left-0 h-5 w-1 rounded-full bg-primary transition-opacity ${active ? "opacity-100" : "opacity-0"}`}
            />
            <span
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white transition-colors ${
                active ? "bg-primary shadow-sm" : "bg-muted-foreground/40 group-hover:bg-primary/80"
              }`}
            >
              <Icon icon={item.icon} className="text-sm" />
            </span>
            {t(item.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({
  children,
  title,
  actions,
  background = "bg-background",
}: {
  children: ReactNode;
  title?: string;
  actions?: ReactNode;
  /** Tailwind background class for the page's outer wrapper. Defaults to the theme's standard background. */
  background?: string;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isDashboard = pathname === "/dashboard";
  const isMenuActive = MOBILE_MENU_ITEMS.some((item) => item.to === pathname);
  const router = useRouter();
  const qc = useQueryClient();
  const now = useClock();
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { dark, toggle: toggleTheme } = useTheme();

  const { data: profile } = useProfile();
  const name = firstNameOf(profile?.full_name, profile?.email);
  const { t } = useLanguage();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    router.navigate({ to: "/auth", replace: true });
  }

  // Keyboard shortcuts: "n" logs savings fast, Cmd/Ctrl+K opens the command palette.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen((v) => !v);
        return;
      }
      if (!typing && !e.metaKey && !e.ctrlKey && !e.altKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        setQuickAddOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className={`min-h-screen ${background} text-foreground lg:flex`}>
      {/* desktop sidebar */}
      <aside className="hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:shrink-0 lg:flex-col lg:border-r lg:border-border lg:bg-card/40">
        <Link to="/dashboard" className="flex items-center gap-2 px-5 py-5">
          <Logo />
        </Link>

        <SidebarNav pathname={pathname} />

        <div className="mt-auto space-y-2 border-t border-border p-3">
          <button
            onClick={() => setQuickAddOpen(true)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:bg-primary-dark hover:shadow-md active:translate-y-0 active:scale-[0.98]"
          >
            <Icon icon={faPlus} /> Add savings{" "}
            <kbd className="ml-auto rounded border border-white/30 bg-white/10 px-1.5 py-0.5 text-[10px] font-normal opacity-80">
              N
            </kbd>
          </button>
          <ProfileChip
            profile={profile}
            onSignOut={signOut}
            className="w-full"
            trailing={<ThemeToggle size="sm" className="border-transparent bg-transparent" />}
          />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* top bar */}
        <header
          className={`sticky top-0 z-30 border-b border-border ${background} backdrop-blur-xl`}
        >
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <Link to="/dashboard" className="flex min-w-0 items-center gap-2 lg:hidden">
              <Logo />
            </Link>
            {isDashboard && (
              <div className="hidden min-w-0 items-center gap-3 lg:flex">
                <Avatar
                  profile={profile}
                  className="h-12 w-12 text-sm ring-2 ring-border"
                  iconClassName="text-base"
                />
                <div className="min-w-0">
                  <div className="truncate text-xs font-medium text-muted-foreground">
                    {getGreeting(now)}
                  </div>
                  <div className="truncate text-lg font-bold leading-tight text-foreground">
                    {name}
                  </div>
                  <div className="truncate text-[11px] text-muted-foreground/70">
                    {formatPHDateTime(now)}
                  </div>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCommandOpen(true)}
                className="hidden items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm text-muted-foreground transition-all duration-150 hover:border-primary hover:text-primary hover:shadow-sm sm:flex"
              >
                <Icon icon={faMagnifyingGlass} className="text-xs" />
                <span className="hidden md:inline">Search…</span>
                <kbd className="ml-1 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium">
                  ⌘K
                </kbd>
              </button>
              <button
                type="button"
                onClick={() => setCommandOpen(true)}
                aria-label="Open command palette"
                className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card text-foreground transition-all duration-150 hover:border-primary hover:text-primary active:scale-95 sm:hidden"
              >
                <Icon icon={faMagnifyingGlass} />
              </button>
              {actions}
              <div className="lg:hidden">
                <ThemeToggle />
              </div>
              <ProfileChip
                profile={profile}
                onSignOut={signOut}
                className="hidden sm:flex lg:hidden"
              />
            </div>
          </div>
        </header>

        {/* main */}
        <main className="mx-auto w-full max-w-7xl flex-1 px-3 pb-24 pt-4 sm:px-6 sm:pb-20 sm:pt-6 lg:px-8 lg:pb-10 lg:pt-8">
          {isDashboard && (
            <div className="mb-4 flex items-center justify-between gap-3 sm:mb-6 lg:hidden">
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-medium text-muted-foreground">
                  {getGreeting(now)}
                </div>
                <div className="truncate text-lg font-bold leading-tight text-foreground">
                  {name}
                </div>
                <div className="truncate text-[11px] text-muted-foreground/70">
                  {formatPHDateTime(now)}
                </div>
              </div>
              <Avatar
                profile={profile}
                className="h-11 w-11 text-sm ring-2 ring-border"
                iconClassName="text-base"
              />
            </div>
          )}
          {title && (
            <h1
              className={`mb-4 font-display text-xl font-bold tracking-tight text-foreground sm:mb-6 sm:text-2xl lg:text-3xl ${isDashboard ? "hidden lg:block" : ""}`}
            >
              {title}
            </h1>
          )}
          {children}
        </main>
      </div>

      {/* mobile bottom nav — full-width fixed tab bar, Spotify style: icon-over-label, flat color states, no floating pill */}
      <nav
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-border ${background} backdrop-blur-xl lg:hidden`}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Primary"
      >
        <ul className="mx-auto flex max-w-md items-stretch">
          {MOBILE_PRIMARY_ITEMS.map((item) => {
            const active = pathname === item.to;
            return (
              <li key={item.to} className="flex-1">
                <Link
                  to={item.to}
                  className="flex flex-col items-center justify-center gap-1 py-2.5 transition-colors duration-150"
                >
                  <Icon
                    icon={item.icon}
                    className={`text-lg transition-transform duration-150 ${
                      active ? "scale-110 text-primary" : "text-muted-foreground dark:text-white/70"
                    }`}
                  />
                  <span
                    className={`text-[11px] font-semibold ${active ? "text-foreground dark:text-white" : "text-muted-foreground dark:text-white/70"}`}
                  >
                    {t(item.labelKey)}
                  </span>
                </Link>
              </li>
            );
          })}
          <li className="flex-1">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label={t("nav.menu")}
              className="flex w-full flex-col items-center justify-center gap-1 py-2.5 transition-colors duration-150"
            >
              <Icon
                icon={faBars}
                className={`text-lg transition-transform duration-150 ${
                  isMenuActive
                    ? "scale-110 text-primary"
                    : "text-muted-foreground dark:text-white/70"
                }`}
              />
              <span
                className={`text-[11px] font-semibold ${isMenuActive ? "text-foreground dark:text-white" : "text-muted-foreground dark:text-white/70"}`}
              >
                {t("nav.menu")}
              </span>
            </button>
          </li>
        </ul>
      </nav>

      {/* Menu sheet — houses History and Settings, one tap deeper than the bottom bar */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-3xl border-t border-border bg-background px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5 lg:hidden"
        >
          <SheetHeader className="mb-1 text-left">
            <SheetTitle className="font-display text-base text-foreground">
              {t("nav.menu")}
            </SheetTitle>
          </SheetHeader>

          <div className="mt-2 flex flex-col gap-2">
            {MOBILE_MENU_ITEMS.map((item) => {
              const active = pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-2xl border p-3 text-sm font-medium transition-all duration-150 active:scale-[0.98] ${
                    active
                      ? "border-primary/40 bg-secondary text-primary-dark"
                      : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-secondary/60"
                  }`}
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-secondary text-primary-dark">
                    <Icon icon={item.icon} />
                  </span>
                  {t(item.labelKey)}
                </Link>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>

      {/* mobile floating quick-add button, sits above the bottom tab bar */}
      <button
        onClick={() => setQuickAddOpen(true)}
        aria-label="Add savings"
        className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-4 z-40 grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-elegant transition-transform hover:-translate-y-0.5 active:scale-95 lg:hidden"
      >
        <Icon icon={faPlus} className="text-lg" />
      </button>

      <EntryDialog open={quickAddOpen} onOpenChange={setQuickAddOpen} />
      <CommandPalette
        open={commandOpen}
        onOpenChange={setCommandOpen}
        onQuickAdd={() => setQuickAddOpen(true)}
        onSignOut={signOut}
        dark={dark}
        onToggleTheme={toggleTheme}
      />
    </div>
  );
}

export function QuickAddButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary-dark hover:-translate-y-0.5 sm:px-4 sm:py-2.5"
    >
      <Icon icon={faPlus} /> <span className="hidden sm:inline">Add Savings</span>
      <span className="sm:hidden">Add</span>
    </button>
  );
}
