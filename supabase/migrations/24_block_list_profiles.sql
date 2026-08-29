-- Engelleyen, engellediği profili listede ve profil sayfasında görebilsin.
-- Karşı taraf beni engellediyse profili hâlâ gizli kalır.

drop policy if exists "Profiller herkes tarafından okunabilir" on public.profiles;
create policy "Profiller herkes tarafından okunabilir"
  on public.profiles for select
  using (
    auth.uid() is null
    or auth.uid() = id
    or not exists (
      select 1 from public.blocks
      where blocker_id = profiles.id and blocked_id = auth.uid()
    )
  );
