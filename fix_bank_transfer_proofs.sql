create extension if not exists "pgcrypto";

create table if not exists public.bank_transfer_proofs (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  company_name text null,
  package_name text null,
  state_name text null,
  amount text null,
  payment_reference text null,
  file_name text null,
  file_url text null,
  storage_path text null,
  status text not null default 'pending_verification',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bank_transfer_proofs_email_idx
on public.bank_transfer_proofs (email);

insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false)
on conflict (id) do update
set public = excluded.public;

alter table public.client_accounts
add column if not exists payment_status text default 'pending',
add column if not exists payment_method text;

notify pgrst, 'reload schema';