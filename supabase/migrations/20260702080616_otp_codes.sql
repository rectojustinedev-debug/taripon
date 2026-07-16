-- OTP codes for the standalone Node/Express OTP microservice
-- (otp-service/). Only ever touched with the service_role key, so RLS is
-- enabled with zero policies: no anon/authenticated client can read or
-- write this table directly.
create table if not exists public.otp_codes (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  purpose text not null check (purpose in ('signup', 'login')),
  code_hash text not null,
  attempts integer not null default 0,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create unique index if not exists otp_codes_email_purpose_key on public.otp_codes (email, purpose);
create index if not exists otp_codes_expires_at_idx on public.otp_codes (expires_at);

alter table public.otp_codes enable row level security;
-- No policies added on purpose — table is only reachable via the
-- service-role key from otp-service, never from the browser.
