// Shared between client forms and server functions so validation is
// enforced in both places with a single source of truth. Client-side
// validation is a UX nicety; the server-side check in
// `auth-actions.functions.ts` is the one that actually protects the app,
// since anyone can call a server function directly without going through
// the form.
import { z } from "zod";

// Single source of truth for password rules, shared by the sign-up form,
// the settings "change password" form, and the reset-password form so
// all three enforce (and *display*) exactly the same requirements. Before
// this was duplicated ad hoc, which is how sign-up ended up silently
// rejecting passwords with no visible explanation of why.
export const PASSWORD_RULES: { label: string; test: (v: string) => boolean }[] = [
  { label: "At least 8 characters", test: (v) => v.length >= 8 },
  { label: "One lowercase letter", test: (v) => /[a-z]/.test(v) },
  { label: "One uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { label: "One number", test: (v) => /[0-9]/.test(v) },
];

export function passwordFailures(v: string) {
  return PASSWORD_RULES.filter((r) => !r.test(v));
}

// 0-4 strength score for the visual meter: one point per rule met, plus
// a bonus point for real length (12+) so "Aa1aaaaa" and a genuinely long
// passphrase don't look identical.
export function passwordScore(v: string): number {
  if (!v) return 0;
  const metRules = PASSWORD_RULES.filter((r) => r.test(v)).length;
  const lengthBonus = v.length >= 12 ? 1 : 0;
  // Clamped to [0, 4] — previously this could go to -1 when no rules were
  // met (e.g. a password of only symbols), which indexed STRENGTH_LABELS /
  // STRENGTH_COLORS out of bounds and rendered "undefined" in the strength
  // meter on the settings page.
  return Math.max(0, Math.min(4, metRules + lengthBonus - 1));
}

export const STRENGTH_LABELS = ["Weak", "Fair", "Good", "Strong", "Excellent"];
export const STRENGTH_COLORS = [
  "bg-destructive",
  "bg-accent-gold",
  "bg-primary-glow",
  "bg-primary",
  "bg-success",
];

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("Enter a valid email")
  .max(254);

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required").max(200),
  remember: z.boolean().optional(),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    full_name: z.string().trim().min(2, "Enter your full name").max(80),
    email: emailSchema,
    password: z
      .string()
      .min(8, "At least 8 characters")
      .max(72)
      .regex(/[a-z]/, "Include a lowercase letter")
      .regex(/[A-Z]/, "Include an uppercase letter")
      .regex(/[0-9]/, "Include a number"),
    confirm: z.string(),
    agree: z.literal(true, { errorMap: () => ({ message: "You must agree to continue" }) }),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });
export type RegisterValues = z.infer<typeof registerSchema>;

export const resetPasswordRequestSchema = z.object({
  email: emailSchema,
});
export type ResetPasswordRequestValues = z.infer<typeof resetPasswordRequestSchema>;

export const newPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "At least 8 characters")
      .max(72)
      .regex(/[a-z]/, "Include a lowercase letter")
      .regex(/[A-Z]/, "Include an uppercase letter")
      .regex(/[0-9]/, "Include a number"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });
export type NewPasswordValues = z.infer<typeof newPasswordSchema>;
