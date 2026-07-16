import { useRouter } from "@tanstack/react-router";
import { useLanguage } from "@/lib/i18n";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { Icon } from "@/components/Icon";
import {
  faHouse,
  faCalendarDays,
  faBullseye,
  faChartLine,
  faClockRotateLeft,
  faGear,
  faPlus,
  faMoon,
  faSun,
  faSignOut,
  faDownload,
} from "@fortawesome/free-solid-svg-icons";

const PAGES = [
  { to: "/dashboard", labelKey: "nav.home", icon: faHouse },
  { to: "/calendar", labelKey: "nav.calendar", icon: faCalendarDays },
  { to: "/goals", labelKey: "nav.goals", icon: faBullseye },
  { to: "/statistics", labelKey: "nav.stats", icon: faChartLine },
  { to: "/history", labelKey: "nav.history", icon: faClockRotateLeft },
  { to: "/settings", labelKey: "nav.settings", icon: faGear },
] as const;

export function CommandPalette({
  open,
  onOpenChange,
  onQuickAdd,
  onSignOut,
  dark,
  onToggleTheme,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onQuickAdd: () => void;
  onSignOut: () => void;
  dark: boolean;
  onToggleTheme: () => void;
}) {
  const router = useRouter();
  const { t } = useLanguage();

  function go(to: (typeof PAGES)[number]["to"]) {
    onOpenChange(false);
    router.navigate({ to });
  }

  function run(fn: () => void) {
    onOpenChange(false);
    fn();
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Jump to a page or run a quick action…" />
      <CommandList>
        <CommandEmpty>Nothing found.</CommandEmpty>
        <CommandGroup heading="Quick actions">
          <CommandItem onSelect={() => run(onQuickAdd)}>
            <Icon icon={faPlus} />
            <span>Add savings</span>
            <CommandShortcut>N</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => go("/goals")}>
            <Icon icon={faBullseye} />
            <span>Create a new goal</span>
          </CommandItem>
          <CommandItem onSelect={() => run(onToggleTheme)}>
            <Icon icon={dark ? faSun : faMoon} />
            <span>{dark ? "Switch to light mode" : "Switch to dark mode"}</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/history")}>
            <Icon icon={faDownload} />
            <span>Export history (CSV or Excel)</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Go to">
          {PAGES.map((p) => (
            <CommandItem key={p.to} onSelect={() => go(p.to)}>
              <Icon icon={p.icon} />
              <span>{t(p.labelKey)}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Account">
          <CommandItem onSelect={() => run(onSignOut)}>
            <Icon icon={faSignOut} />
            <span>Sign out</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
