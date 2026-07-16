import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icon } from "@/components/Icon";
import { formatCurrency } from "@/lib/format";
import { faCalculator, faFlagCheckered, faCoins } from "@fortawesome/free-solid-svg-icons";

interface SavingsCalculatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** ISO currency code, e.g. "PHP" — pulled from the user's saved settings. */
  currency?: string;
}

interface Projection {
  months: number;
  targetDate: Date;
  totalContributed: number;
  totalInterestEarned: number;
  finalBalance: number;
}

// Simulates month-by-month growth (interest applied, then the monthly
// contribution added) rather than solving the compound-interest formula
// algebraically for `n` — a closed form exists only for the r = 0 case,
// and this reads clearer anyway. Capped at 600 months (50 years) so an
// unreachable goal (e.g. 0 monthly contribution) can't loop forever.
function projectSavingsGoal(
  target: number,
  current: number,
  monthlyContribution: number,
  annualRatePercent: number,
): Projection | null {
  if (target <= current) {
    return {
      months: 0,
      targetDate: new Date(),
      totalContributed: 0,
      totalInterestEarned: 0,
      finalBalance: current,
    };
  }
  if (monthlyContribution <= 0) return null;

  const monthlyRate = annualRatePercent / 100 / 12;
  let balance = current;
  let totalContributed = 0;
  let totalInterest = 0;

  for (let month = 1; month <= 600; month++) {
    const interest = balance * monthlyRate;
    balance += interest;
    totalInterest += interest;
    balance += monthlyContribution;
    totalContributed += monthlyContribution;

    if (balance >= target) {
      const targetDate = new Date();
      targetDate.setMonth(targetDate.getMonth() + month);
      return {
        months: month,
        targetDate,
        totalContributed,
        totalInterestEarned: totalInterest,
        finalBalance: balance,
      };
    }
  }
  return null;
}

export function SavingsCalculatorDialog({
  open,
  onOpenChange,
  currency = "PHP",
}: SavingsCalculatorDialogProps) {
  const [target, setTarget] = useState("50000");
  const [current, setCurrent] = useState("0");
  const [monthly, setMonthly] = useState("2000");
  const [rate, setRate] = useState("0");

  const result = useMemo(() => {
    const t = Number(target) || 0;
    const c = Number(current) || 0;
    const m = Number(monthly) || 0;
    const r = Number(rate) || 0;
    if (t <= 0) return null;
    return projectSavingsGoal(t, c, m, r);
  }, [target, current, monthly, rate]);

  const years = result ? Math.floor(result.months / 12) : 0;
  const remMonths = result ? result.months % 12 : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
            <Icon icon={faCalculator} className="text-lg" />
          </div>
          <DialogTitle className="text-center font-display text-xl">Savings Calculator</DialogTitle>
          <DialogDescription className="text-center">
            See how long it'll take to hit your savings goal.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="calc-target">Goal amount</Label>
              <Input
                id="calc-target"
                type="number"
                min={0}
                inputMode="decimal"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="bg-muted/60"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="calc-current">Already saved</Label>
              <Input
                id="calc-current"
                type="number"
                min={0}
                inputMode="decimal"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                className="bg-muted/60"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="calc-monthly">Monthly savings</Label>
              <Input
                id="calc-monthly"
                type="number"
                min={0}
                inputMode="decimal"
                value={monthly}
                onChange={(e) => setMonthly(e.target.value)}
                className="bg-muted/60"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="calc-rate">Interest rate (%/yr)</Label>
              <Input
                id="calc-rate"
                type="number"
                min={0}
                step="0.1"
                inputMode="decimal"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="bg-muted/60"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-primary/15 bg-secondary/60 p-4">
            {!target || Number(target) <= 0 ? (
              <p className="text-center text-sm text-muted-foreground">
                Enter a goal amount to see your projection.
              </p>
            ) : result === null ? (
              <p className="text-center text-sm text-muted-foreground">
                Add a monthly savings amount above 0 to calculate a timeline.
              </p>
            ) : result.months === 0 ? (
              <div className="flex items-center justify-center gap-2 text-sm font-semibold text-success">
                <Icon icon={faFlagCheckered} /> You've already reached this goal!
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 text-center">
                  <Icon icon={faFlagCheckered} className="text-primary" />
                  <p className="text-sm font-semibold text-foreground">
                    You'll reach {formatCurrency(Number(target), currency)} in{" "}
                    {years > 0 && `${years} yr${years !== 1 ? "s" : ""} `}
                    {remMonths > 0 && `${remMonths} mo${remMonths !== 1 ? "s" : ""}`}
                    {years === 0 && remMonths === 0 && "less than a month"}
                  </p>
                </div>
                <p className="text-center text-xs text-muted-foreground">
                  Around{" "}
                  {result.targetDate.toLocaleDateString(undefined, {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <div className="grid grid-cols-2 gap-2 border-t border-primary/15 pt-3 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">You'll contribute</p>
                    <p className="text-sm font-semibold text-foreground">
                      {formatCurrency(result.totalContributed, currency)}
                    </p>
                  </div>
                  <div>
                    <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                      <Icon icon={faCoins} className="text-primary" /> Interest earned
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      {formatCurrency(result.totalInterestEarned, currency)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
