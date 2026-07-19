-- Apply once in the Supabase SQL editor. Server routes use the service role;
-- authenticated clients can only see rows matching their verified JWT email.

insert into storage.buckets (id, name, public)
values ('client-documents', 'client-documents', false)
on conflict (id) do update set public = false;

update storage.buckets set public = false
where id in ('client-documents', 'payment-proofs', 'llc-documents');

alter table if exists public.client_documents
  add column if not exists storage_path text,
  add column if not exists mime_type text;

alter table if exists public.client_documents enable row level security;
alter table if exists public.client_messages enable row level security;
alter table if exists public.client_accounts enable row level security;

drop policy if exists "clients_read_own_documents" on public.client_documents;
create policy "clients_read_own_documents"
on public.client_documents for select to authenticated
using (lower(client_email) = lower(coalesce(auth.jwt() ->> 'email', '')));

drop policy if exists "clients_read_own_messages" on public.client_messages;
create policy "clients_read_own_messages"
on public.client_messages for select to authenticated
using (lower(client_email) = lower(coalesce(auth.jwt() ->> 'email', '')));

drop policy if exists "clients_create_own_messages" on public.client_messages;
create policy "clients_create_own_messages"
on public.client_messages for insert to authenticated
with check (
  lower(client_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  and lower(coalesce(sender, 'client')) = 'client'
);

drop policy if exists "clients_read_own_account" on public.client_accounts;
create policy "clients_read_own_account"
on public.client_accounts for select to authenticated
using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

-- No storage.objects policy is intentionally granted here. Files are delivered
-- by authenticated server routes after ownership checks, via short-lived access.
