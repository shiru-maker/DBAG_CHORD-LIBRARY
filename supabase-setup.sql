-- I-paste sa Supabase: SQL Editor > New query > Run
create table songs (
  id text primary key,
  title text not null,
  artist text,
  song_key text,
  bpm text,
  chords text,
  singers jsonb default '{}'
);
create table lineup (id int primary key, song_ids jsonb default '[]');
insert into lineup (id) values (1);

-- RLS: LAHAT pwedeng bumasa, pero LOGGED-IN (ikaw) lang ang pwedeng mag-edit
alter table songs enable row level security;
alter table lineup enable row level security;
create policy "read songs"  on songs  for select using (true);
create policy "read lineup" on lineup for select using (true);
create policy "edit songs"  on songs  for all to authenticated using (true) with check (true);
create policy "edit lineup" on lineup for all to authenticated using (true) with check (true);
-- Pagkatapos: Authentication > Users > Add user (gumawa ng account mo),
-- at i-OFF ang "Allow new users to sign up" sa Authentication > Sign In / Providers.
