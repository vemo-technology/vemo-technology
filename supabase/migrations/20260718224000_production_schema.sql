create extension if not exists pgcrypto;

create table if not exists public.llc_orders (
  id uuid primary key default gen_random_uuid(),
  dossier_number text unique,
  language text default 'fr',
  status text not null default 'pending_payment',
  payment_status text not null default 'pending_payment',
  admin_status text default 'new',
  dossier_status text default 'pending',
  dossier_progress integer default 0 check (dossier_progress between 0 and 100),
  package_name text,
  plan_name text,
  jurisdiction text,
  state text,
  full_company_name text,
  company_name text,
  first_name text,
  last_name text,
  customer_name text,
  email text,
  client_email text,
  customer_email text,
  phone_e164 text,
  residence_country text,
  amount numeric(12,2),
  total_amount numeric(12,2),
  currency text not null default 'usd',
  payment_method text,
  stripe_session_id text unique,
  stripe_payment_intent_id text unique,
  dossier jsonb not null default '{}'::jsonb,
  services jsonb not null default '[]'::jsonb,
  missing_items jsonb not null default '[]'::jsonb,
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  admin_updated_at timestamptz,
  processed_at timestamptz,
  paid_at timestamptz
);

create index if not exists llc_orders_customer_email_idx
  on public.llc_orders (lower(customer_email), created_at desc);
create index if not exists llc_orders_client_email_idx
  on public.llc_orders (lower(client_email), created_at desc);

create table if not exists public.client_accounts (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.llc_orders(id) on delete set null,
  email text not null unique,
  auth_user_id uuid unique,
  full_name text,
  name text,
  company_name text,
  plan_name text,
  status text not null default 'pending_activation',
  account_status text,
  payment_status text,
  portal_enabled boolean not null default false,
  email_confirmed boolean not null default false,
  activation_email_sent_at timestamptz,
  access_token text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.client_documents (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.llc_orders(id) on delete cascade,
  client_email text not null,
  title text,
  document_key text,
  document_type text default 'other',
  file_name text,
  file_url text,
  storage_path text,
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  status text not null default 'pending',
  required boolean not null default false,
  admin_comment text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists client_documents_email_idx
  on public.client_documents (lower(client_email), updated_at desc);
create unique index if not exists client_documents_order_key_uidx
  on public.client_documents (order_id, document_key)
  where order_id is not null and document_key is not null;

create table if not exists public.client_messages (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.llc_orders(id) on delete cascade,
  client_email text not null,
  sender text not null default 'system',
  subject text,
  message text not null,
  content text,
  direction text,
  message_type text default 'info',
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists client_messages_email_idx
  on public.client_messages (lower(client_email), created_at desc);

create table if not exists public.llc_order_documents (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.llc_orders(id) on delete cascade,
  uploaded_by text not null default 'admin',
  document_type text,
  document_label text,
  file_name text not null,
  file_path text not null,
  mime_type text,
  file_size bigint,
  status text not null default 'active',
  admin_comment text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

insert into storage.buckets (id, name, public)
values
  ('client-documents', 'client-documents', false),
  ('payment-proofs', 'payment-proofs', false),
  ('llc-documents', 'llc-documents', false)
on conflict (id) do update set public = false;

alter table public.llc_orders enable row level security;
alter table public.client_accounts enable row level security;
alter table public.client_documents enable row level security;
alter table public.client_messages enable row level security;
alter table public.llc_order_documents enable row level security;

drop policy if exists "clients_read_own_orders" on public.llc_orders;
create policy "clients_read_own_orders" on public.llc_orders
for select to authenticated
using (lower(customer_email) = lower(coalesce(auth.jwt() ->> 'email', '')));

drop policy if exists "clients_read_own_account" on public.client_accounts;
create policy "clients_read_own_account" on public.client_accounts
for select to authenticated
using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

drop policy if exists "clients_read_own_documents" on public.client_documents;
create policy "clients_read_own_documents" on public.client_documents
for select to authenticated
using (lower(client_email) = lower(coalesce(auth.jwt() ->> 'email', '')));

drop policy if exists "clients_read_own_messages" on public.client_messages;
create policy "clients_read_own_messages" on public.client_messages
for select to authenticated
using (lower(client_email) = lower(coalesce(auth.jwt() ->> 'email', '')));

drop policy if exists "clients_create_own_messages" on public.client_messages;
create policy "clients_create_own_messages" on public.client_messages
for insert to authenticated
with check (
  lower(client_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  and lower(sender) = 'client'
);

drop policy if exists "clients_read_own_order_documents" on public.llc_order_documents;
create policy "clients_read_own_order_documents" on public.llc_order_documents
for select to authenticated
using (
  exists (
    select 1 from public.llc_orders o
    where o.id = order_id
      and lower(o.customer_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
);

-- Storage objects are intentionally inaccessible directly to anon/authenticated.
-- Server routes verify ownership/admin access and issue short-lived signed URLs.
