# AGENTS.md

This is a standalone TanStack Start (React) + Supabase app. It is not
connected to any third-party build/deploy service — treat this git
history as the only source of truth, and feel free to rewrite/rebase/force-push
on branches as normal for this repo.

- Frontend + backend: `src/` (TanStack Start routes, components, Supabase
  client, and server functions — this is a single app, not a monorepo).
- Database schema: `supabase/migrations/` — run these against your own
  Supabase project (see `README.md` at the repo root for setup).
- Email verification (OTP) and account confirmation are handled by
  server functions in `src/integrations/supabase/otp-actions.functions.ts`
  (plus `src/lib/otp.server.ts` and `src/lib/mailer.server.ts`) — there is
  no separate `otp-service/` process anymore, it was folded in here.
