import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Icon } from "@/components/Icon";
import { faSpinner, faTrash } from "@fortawesome/free-solid-svg-icons";
import { CATEGORIES, toISODate } from "@/lib/format";
import { toast } from "sonner";

const schema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  category: z.string().min(1),
  note: z.string().max(280).optional().or(z.literal("")),
  saving_date: z.string().min(1),
});
type Values = z.infer<typeof schema>;

const QUICK_AMOUNTS = [20, 50, 100, 200, 500, 1000];

export type EntryRecord = {
  id?: string;
  amount: number;
  category: string;
  note: string | null;
  saving_date: string;
};

export function EntryDialog({
  open,
  onOpenChange,
  entry,
  defaultDate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  entry?: EntryRecord;
  defaultDate?: Date;
}) {
  const qc = useQueryClient();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: 0,
      category: "general",
      note: "",
      saving_date: toISODate(defaultDate ?? new Date()),
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        amount: entry?.amount ?? 0,
        category: entry?.category ?? "general",
        note: entry?.note ?? "",
        saving_date: entry?.saving_date ?? toISODate(defaultDate ?? new Date()),
      });
    }
  }, [open, entry, defaultDate, form]);

  const save = useMutation({
    mutationFn: async (values: Values) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const u = { user: session?.user ?? null };
      if (!u.user) throw new Error("Not signed in");
      const payload = {
        user_id: u.user.id,
        amount: values.amount,
        category: values.category,
        note: values.note || null,
        saving_date: values.saving_date,
      };
      if (entry?.id) {
        const { error } = await supabase.from("entries").update(payload).eq("id", entry.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("entries").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(entry?.id ? "Entry updated" : "Saved!");
      qc.invalidateQueries({ queryKey: ["entries"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async () => {
      if (!entry?.id) return;
      const { error } = await supabase.from("entries").delete().eq("id", entry.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Entry deleted");
      qc.invalidateQueries({ queryKey: ["entries"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            {entry?.id ? "Edit savings" : "Add savings"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-center block">
              Amount
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              autoFocus
              {...form.register("amount")}
              className="font-currency h-14 text-center text-3xl font-bold tracking-tight"
            />
            {form.formState.errors.amount && (
              <p className="text-center text-xs text-destructive">
                {form.formState.errors.amount.message}
              </p>
            )}
            <div className="flex flex-wrap justify-center gap-1.5 pt-0.5">
              {QUICK_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() =>
                    form.setValue("amount", amt, { shouldValidate: true, shouldDirty: true })
                  }
                  className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all duration-150 active:scale-95 ${
                    Number(form.watch("amount")) === amt
                      ? "border-primary bg-secondary text-primary-dark shadow-sm"
                      : "border-border bg-background text-muted-foreground hover:border-primary hover:text-primary"
                  }`}
                >
                  +{amt}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="saving_date">Date</Label>
            <Input id="saving_date" type="date" {...form.register("saving_date")} />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={form.watch("category")}
              onValueChange={(v) => form.setValue("category", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c[0].toUpperCase() + c.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">Note</Label>
            <Textarea id="note" rows={2} {...form.register("note")} />
          </div>
          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            {entry?.id ? (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Delete this entry? This can't be undone.")) remove.mutate();
                }}
                disabled={remove.isPending}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-destructive/30 px-4 py-2.5 text-sm font-semibold text-destructive transition-all duration-150 hover:bg-destructive/10 active:scale-[0.98]"
              >
                <Icon icon={faTrash} /> Delete
              </button>
            ) : (
              <span />
            )}
            <button
              type="submit"
              disabled={save.isPending}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:bg-primary-dark hover:shadow-md active:translate-y-0 active:scale-[0.98] disabled:opacity-60"
            >
              {save.isPending && <Icon icon={faSpinner} className="animate-spin" />}
              Save
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function useEntriesQueryKey(userId?: string) {
  return ["entries", userId] as const;
}

export function useCurrentUserId() {
  const [id, setId] = useState<string | undefined>();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setId(data.session?.user?.id));
  }, []);
  return id;
}
