create extension if not exists pgcrypto;

create table if not exists public.loans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  amount numeric not null check (amount > 0),
  duration_months integer not null check (duration_months > 0),
  emi numeric not null check (emi > 0),
  annual_rate numeric not null default 0,
  processing_fee numeric not null default 0,
  deduction_day integer not null default 1,
  late_fee_per_day numeric not null default 0,
  grace_days integer not null default 0,
  currency_code text not null default 'USD',
  start_month date not null,
  schedule jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.loans
add column if not exists currency_code text not null default 'USD';

alter table public.loans
add column if not exists annual_rate numeric not null default 0;

alter table public.loans
add column if not exists processing_fee numeric not null default 0;

alter table public.loans
add column if not exists deduction_day integer not null default 1;

alter table public.loans
add column if not exists late_fee_per_day numeric not null default 0;

alter table public.loans
add column if not exists grace_days integer not null default 0;

alter table public.loans enable row level security;

drop policy if exists "loans_select_own" on public.loans;
create policy "loans_select_own"
on public.loans
for select
using (auth.uid() = user_id);

drop policy if exists "loans_insert_own" on public.loans;
create policy "loans_insert_own"
on public.loans
for insert
with check (auth.uid() = user_id);

drop policy if exists "loans_update_own" on public.loans;
create policy "loans_update_own"
on public.loans
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "loans_delete_own" on public.loans;
create policy "loans_delete_own"
on public.loans
for delete
using (auth.uid() = user_id);
