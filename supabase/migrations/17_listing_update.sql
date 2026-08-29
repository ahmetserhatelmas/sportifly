-- İlan sahibi kendi ilanını düzenleyebilsin (eski kurulumlarda policy eksik kalmış olabilir).
drop policy if exists "Kullanıcı kendi ilanını güncelleyebilir" on public.listings;
create policy "Kullanıcı kendi ilanını güncelleyebilir"
  on public.listings for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);
