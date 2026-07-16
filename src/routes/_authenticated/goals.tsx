import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/layout/AppShell";
import { Icon } from "@/components/Icon";
import { Confetti } from "@/components/Confetti";
import {
  faPlus,
  faPen,
  faTrash,
  faSpinner,
  faCheck,
  faBullseye,
} from "@fortawesome/free-solid-svg-icons";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { faCoins } from "@fortawesome/free-solid-svg-icons";
import { supabase as db } from "@/integrations/supabase/client";
import { formatCurrency, formatDate, toISODate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/goals")({
  head: () => ({ meta: [{ title: "Goals — TARIPON" }] }),
  component: GoalsPage,
});

type Goal = {
  id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  status: "active" | "completed" | "archived";
  created_at: string;
};

const schema = z.object({
  title: z.string().trim().min(2, "Title is required").max(80),
  target_amount: z.coerce.number().positive("Target must be greater than 0"),
  current_amount: z.coerce.number().min(0),
  deadline: z.string().optional().or(z.literal("")),
});
type Values = z.infer<typeof schema>;

function GoalsPage() {
  const [dialog, setDialog] = useState<{ open: boolean; goal?: Goal }>({ open: false });
  const [celebrate, setCelebrate] = useState(false);
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

  const goals = useQuery({
    queryKey: ["goals"],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const u = { user: session?.user ?? null };
      if (!u.user) return [];
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .eq("user_id", u.user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Goal[];
    },
  });

  return (
    <AppShell
      title="Goals"
      background="bg-white dark:bg-background"
      actions={
        <button
          onClick={() => setDialog({ open: true })}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:bg-primary-dark hover:shadow-md sm:px-4 sm:py-2.5"
        >
          <Icon icon={faPlus} /> <span className="hidden sm:inline">New Goal</span>
        </button>
      }
    >
      {(goals.data ?? []).length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center sm:p-12">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-secondary text-primary-dark dark:text-white">
            <Icon icon={faBullseye} />
          </div>
          <h3 className="mt-4 text-lg font-bold text-foreground">No goals yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Set your first savings goal to stay accountable.
          </p>
          <button
            onClick={() => setDialog({ open: true })}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-dark"
          >
            <Icon icon={faPlus} /> Create goal
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {goals.data!.map((g) => (
            <GoalCard
              key={g.id}
              goal={g}
              currency={currency}
              onEdit={() => setDialog({ open: true, goal: g })}
            />
          ))}
        </div>
      )}

      <GoalDialog
        open={dialog.open}
        onOpenChange={(v) => setDialog((d) => ({ ...d, open: v }))}
        goal={dialog.goal}
        onGoalCompleted={() => setCelebrate(true)}
      />
      <Confetti active={celebrate} onDone={() => setCelebrate(false)} />
    </AppShell>
  );
}

function GoalCard({
  goal,
  currency,
  onEdit,
}: {
  goal: Goal;
  currency: string;
  onEdit: () => void;
}) {
  const qc = useQueryClient();
  const targetAmount = Number(goal.target_amount);
  const pct =
    targetAmount > 0 ? Math.min(100, (Number(goal.current_amount) / targetAmount) * 100) : 0;
  const reached = pct >= 100 || goal.status === "completed";

  // estimate completion based on remaining and 30-day average pace
  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("goals").delete().eq("id", goal.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goals"] });
      toast.success("Goal deleted");
    },
  });

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-soft transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
      {reached && (
        <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-success/15 px-3 py-1 text-xs font-bold text-success">
          <Icon icon={faCheck} /> Reached
        </span>
      )}
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-secondary text-primary-dark dark:text-white">
        <Icon icon={faBullseye} />
      </div>
      <h3 className="mt-4 text-lg font-bold text-foreground">{goal.title}</h3>
      <p className="font-currency text-xs text-muted-foreground">
        {formatCurrency(Number(goal.current_amount), currency)} of{" "}
        {formatCurrency(Number(goal.target_amount), currency)}
      </p>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ease-out ${reached ? "bg-success" : "bg-primary"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="font-semibold text-foreground">{Math.round(pct)}%</span>
        {goal.deadline && (
          <span className="text-muted-foreground">by {formatDate(goal.deadline)}</span>
        )}
      </div>
      <div className="mt-5 flex gap-2">
        <button
          onClick={onEdit}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground transition-all duration-150 hover:border-primary hover:text-primary active:scale-[0.98]"
        >
          <Icon icon={faPen} /> Edit
        </button>
        <button
          onClick={() => {
            if (window.confirm(`Delete "${goal.title}"? This can't be undone.`)) remove.mutate();
          }}
          disabled={remove.isPending}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-destructive/30 px-3 py-2 text-xs font-semibold text-destructive transition-all duration-150 hover:bg-destructive/10 active:scale-[0.98] disabled:opacity-60"
        >
          {remove.isPending ? (
            <Icon icon={faSpinner} className="animate-spin" />
          ) : (
            <Icon icon={faTrash} />
          )}
        </button>
      </div>
    </div>
  );
}

function GoalDialog({
  open,
  onOpenChange,
  goal,
  onGoalCompleted,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  goal?: Goal;
  onGoalCompleted?: () => void;
}) {
  const qc = useQueryClient();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", target_amount: 1000, current_amount: 0, deadline: "" },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        title: goal?.title ?? "",
        target_amount: Number(goal?.target_amount ?? 1000),
        current_amount: Number(goal?.current_amount ?? 0),
        deadline: goal?.deadline ?? "",
      });
    }
  }, [open, goal, form]);

  const save = useMutation({
    mutationFn: async (values: Values) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const u = { user: session?.user ?? null };
      if (!u.user) throw new Error("Not signed in");
      const payload = {
        user_id: u.user.id,
        title: values.title,
        target_amount: values.target_amount,
        current_amount: values.current_amount,
        deadline: values.deadline || null,
        status: values.current_amount >= values.target_amount ? "completed" : "active",
      } as const;
      if (goal?.id) {
        const { error } = await supabase.from("goals").update(payload).eq("id", goal.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("goals").insert(payload);
        if (error) throw error;
      }
      return { justCompleted: payload.status === "completed" && goal?.status !== "completed" };
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["goals"] });
      if (result?.justCompleted) {
        toast.success("Goal reached!", {
          description: "Nice work — that's one more milestone banked.",
        });
        onGoalCompleted?.();
      } else {
        toast.success(goal?.id ? "Goal updated" : "Goal created");
      }
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{goal?.id ? "Edit goal" : "New goal"}</DialogTitle>
        </DialogHeader>
        <form
          key={goal?.id ?? "new"}
          onSubmit={form.handleSubmit((v) => save.mutate(v))}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" defaultValue={goal?.title ?? ""} {...form.register("title")} />
            {form.formState.errors.title && (
              <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="target_amount">Target</Label>
              <Input
                id="target_amount"
                type="number"
                step="0.01"
                defaultValue={goal?.target_amount ?? 1000}
                {...form.register("target_amount")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="current_amount">Current</Label>
              <Input
                id="current_amount"
                type="number"
                step="0.01"
                defaultValue={goal?.current_amount ?? 0}
                {...form.register("current_amount")}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline (optional)</Label>
            <Input
              id="deadline"
              type="date"
              defaultValue={goal?.deadline ?? ""}
              {...form.register("deadline")}
            />
          </div>
          <DialogFooter>
            <button
              type="submit"
              disabled={save.isPending}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-dark disabled:opacity-60"
            >
              {save.isPending && <Icon icon={faSpinner} className="animate-spin" />} Save
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
