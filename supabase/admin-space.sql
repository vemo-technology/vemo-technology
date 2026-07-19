create table if not exists public.client_documents (
  id uuid primary key default gen_random_uuid(),
  client_email text not null,
  title text,
  document_type text default 'other',
  file_name text,
  file_url text,
  storage_path text,
  status text default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_client_documents_email on public.client_documents(client_email);

create table if not exists public.client_accounts (
  email text primary key,
  auth_user_id uuid,
  portal_enabled boolean default false,
  payment_status text,
  account_status text,
  name text,
  company_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.client_messages (
  id uuid primary key default gen_random_uuid(),
  client_email text not null,
  sender text default 'system',
  message text not null,
  created_at timestamptz default now()
);

insert into storage.buckets (id, name, public)
values ('client-documents', 'client-documents', false)
on conflict (id) do update set public = false;
