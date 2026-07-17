insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false)
on conflict (id) do update
set public = false;

update storage.buckets
set public = false
where id = 'payment-proofs';
