import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Icon } from "@/components/Icon";
import {
  faLightbulb,
  faPiggyBank,
  faWallet,
  faChartLine,
  faCreditCard,
  faBasketShopping,
  faShuffle,
} from "@fortawesome/free-solid-svg-icons";

interface Tip {
  title: string;
  body: string;
  icon: typeof faPiggyBank;
}

const TIPS: Tip[] = [
  {
    icon: faPiggyBank,
    title: "Pay yourself first",
    body: "Move a fixed amount into savings the moment you get paid, before it has a chance to disappear into everyday spending.",
  },
  {
    icon: faWallet,
    title: "Try the 50/30/20 rule",
    body: "Aim for roughly 50% of income on needs, 30% on wants, and 20% on savings or debt payoff as a simple starting budget.",
  },
  {
    icon: faBasketShopping,
    title: "Track small purchases",
    body: "Coffee, snacks, and delivery fees add up fast. Log every entry in Taripon for a week and you'll usually find one easy cut.",
  },
  {
    icon: faCreditCard,
    title: "Pay off high-interest debt first",
    body: "Interest on credit cards usually outpaces what any savings account earns, so clearing that balance is often your best return.",
  },
  {
    icon: faChartLine,
    title: "Automate your savings goals",
    body: "Set up an automatic transfer on payday sized to your goal's timeline — use the Savings Calculator to work out the monthly amount.",
  },
  {
    icon: faWallet,
    title: "Build a starter emergency fund",
    body: "Even ₱5,000–₱10,000 set aside can keep a surprise expense from turning into new debt.",
  },
  {
    icon: faBasketShopping,
    title: "Wait 24 hours on non-essentials",
    body: "For anything over a comfortable threshold, sleep on it. Most impulse urges fade by the next day.",
  },
  {
    icon: faPiggyBank,
    title: "Round up and save the difference",
    body: "Round purchases up to the nearest ₱50 or ₱100 and sweep the difference into a goal — it's painless and adds up quietly.",
  },
  {
    icon: faChartLine,
    title: "Review your subscriptions monthly",
    body: "Streaming, apps, and memberships quietly renew. A five-minute monthly review usually finds something you're not using.",
  },
  {
    icon: faWallet,
    title: "Give every peso a job",
    body: "Zero-based budgeting — assigning every bit of income to a category (including savings) — makes it much harder for money to vanish unnoticed.",
  },
];

export function MoneyTipsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [seed, setSeed] = useState(0);

  const shown = useMemo(() => {
    // Simple deterministic shuffle keyed by `seed` so "Shuffle tips" gives
    // a visibly different order each click without pulling in a random
    // library for ten items.
    const arr = [...TIPS];
    let s = seed + 1;
    for (let i = arr.length - 1; i > 0; i--) {
      s = (s * 9301 + 49297) % 233280;
      const j = Math.floor((s / 233280) * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.slice(0, 5);
  }, [seed]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85dvh] w-[calc(100%-1.5rem)] max-w-md flex-col gap-0 overflow-hidden p-0 sm:w-[calc(100%-2rem)]">
        <DialogHeader className="shrink-0 px-5 pb-3 pt-6 sm:px-6">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
            <Icon icon={faLightbulb} className="text-lg" />
          </div>
          <DialogTitle className="text-center font-display text-xl">Money Tips</DialogTitle>
          <DialogDescription className="text-center">
            Small habits that add up to real savings.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 pb-1 sm:px-6">
          {shown.map((tip) => (
            <div
              key={tip.title}
              className="flex items-start gap-3 rounded-xl border border-border bg-card px-3 py-3 sm:px-4"
            >
              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-secondary text-primary-dark">
                <Icon icon={tip.icon} className="text-sm" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{tip.title}</p>
                <p className="mt-0.5 break-words text-xs text-muted-foreground">{tip.body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="shrink-0 px-5 pb-6 pt-3 sm:px-6">
          <button
            type="button"
            onClick={() => setSeed((s) => s + 1)}
            className="hover-bounce inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground hover:border-primary hover:text-primary"
          >
            <Icon icon={faShuffle} /> Shuffle tips
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
