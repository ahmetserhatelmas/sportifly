-- Okunmamış mesaj bildirimi için read_at kolonu + alıcıya update izni.

alter table public.direct_messages
  add column if not exists read_at timestamptz;

-- Mevcut mesajlar okunmuş sayılsın; ani badge seli oluşmasın.
update public.direct_messages
set read_at = created_at
where read_at is null;

drop policy if exists "Alıcı mesajı okundu işaretleyebilir" on public.direct_messages;
create policy "Alıcı mesajı okundu işaretleyebilir"
  on public.direct_messages for update
  using (auth.uid() = receiver_id)
  with check (auth.uid() = receiver_id);
