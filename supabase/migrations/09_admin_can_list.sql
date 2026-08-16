-- Adminler başvuru olmadan her tür ilanı oluşturabilir.

drop policy if exists "Yetkili kullanıcı ilan oluşturabilir" on public.listings;
create policy "Yetkili kullanıcı ilan oluşturabilir"
  on public.listings for insert
  with check (
    auth.uid() = owner_id
    and commission_accepted = true
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (
          p.is_admin = true
          or (type = 'field' and p.is_field_owner = true)
          or (type = 'lesson' and p.is_instructor = true)
        )
    )
  );
