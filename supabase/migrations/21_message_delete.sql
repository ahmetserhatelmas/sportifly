-- Tek mesaj silme: gönderen herkesten siler, alıcı kendi listesinden gizler.

create table if not exists public.message_hides (
  user_id uuid not null references public.profiles (id) on delete cascade,
  message_id uuid not null references public.direct_messages (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, message_id)
);

alter table public.message_hides enable row level security;

drop policy if exists "Kullanıcı gizlediği mesajları görür" on public.message_hides;
create policy "Kullanıcı gizlediği mesajları görür"
  on public.message_hides for select using (auth.uid() = user_id);

drop policy if exists "Kullanıcı mesaj gizleyebilir" on public.message_hides;
create policy "Kullanıcı mesaj gizleyebilir"
  on public.message_hides for insert with check (auth.uid() = user_id);

drop policy if exists "Gönderen kendi mesajını silebilir" on public.direct_messages;
create policy "Gönderen kendi mesajını silebilir"
  on public.direct_messages for delete
  using (auth.uid() = sender_id);

drop policy if exists "Gönderen düello mesajını silebilir" on public.duel_messages;
create policy "Gönderen düello mesajını silebilir"
  on public.duel_messages for delete
  using (auth.uid() = user_id);
