-- Patakbuhin ito sa Supabase SQL Editor > New query > Run.
-- Ipinapalagay na songs at lineup tables mo ay nagawa na.
-- Public write policies para gumana ang app nang walang email login.
-- Babala: Developer code ay UI lang; hindi nito pinoprotektahan ang database API.
alter table songs enable row level security;
alter table lineup enable row level security;
drop policy if exists "read songs" on songs;
drop policy if exists "read lineup" on lineup;
create policy "read songs"  on songs  for select using (true);
create policy "read lineup" on lineup for select using (true);
drop policy if exists "edit songs" on songs;
drop policy if exists "admin edits songs" on songs;
drop policy if exists "public edits songs" on songs;
create policy "public edits songs" on songs for all to anon, authenticated using (true) with check (true);
drop policy if exists "edit lineup" on lineup;
drop policy if exists "public edits lineup" on lineup;
create policy "public edits lineup" on lineup for all to anon, authenticated using (true) with check (true);
