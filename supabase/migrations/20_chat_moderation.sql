-- Bildirim tercihi + sohbet gizleme / engelleme / raporlama

alter table public.profiles
  add column if not exists push_enabled boolean not null default true;

create table if not exists public.chat_hides (
  user_id uuid not null references public.profiles (id) on delete cascade,
  partner_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, partner_id)
);

alter table public.chat_hides enable row level security;

drop policy if exists "Kullanıcı gizlediği sohbetleri görür" on public.chat_hides;
create policy "Kullanıcı gizlediği sohbetleri görür"
  on public.chat_hides for select using (auth.uid() = user_id);

drop policy if exists "Kullanıcı sohbet gizleyebilir" on public.chat_hides;
create policy "Kullanıcı sohbet gizleyebilir"
  on public.chat_hides for insert with check (auth.uid() = user_id);

drop policy if exists "Kullanıcı sohbet gizini kaldırabilir" on public.chat_hides;
create policy "Kullanıcı sohbet gizini kaldırabilir"
  on public.chat_hides for delete using (auth.uid() = user_id);

create table if not exists public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

alter table public.blocks enable row level security;

drop policy if exists "Kullanıcı engellerini görür" on public.blocks;
create policy "Kullanıcı engellerini görür"
  on public.blocks for select using (auth.uid() = blocker_id or auth.uid() = blocked_id);

drop policy if exists "Kullanıcı engelleyebilir" on public.blocks;
create policy "Kullanıcı engelleyebilir"
  on public.blocks for insert with check (auth.uid() = blocker_id);

drop policy if exists "Kullanıcı engeli kaldırabilir" on public.blocks;
create policy "Kullanıcı engeli kaldırabilir"
  on public.blocks for delete using (auth.uid() = blocker_id);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reported_id uuid not null references public.profiles (id) on delete cascade,
  reason text,
  created_at timestamptz not null default now(),
  check (reporter_id <> reported_id)
);

alter table public.reports enable row level security;

drop policy if exists "Kullanıcı kendi raporlarını görür" on public.reports;
create policy "Kullanıcı kendi raporlarını görür"
  on public.reports for select using (auth.uid() = reporter_id);

drop policy if exists "Kullanıcı rapor gönderebilir" on public.reports;
create policy "Kullanıcı rapor gönderebilir"
  on public.reports for insert with check (auth.uid() = reporter_id);

-- Engellenen kişiye mesaj atılamasın
drop policy if exists "Kullanıcı sohbet ortağına mesaj gönderebilir" on public.direct_messages;
create policy "Kullanıcı sohbet ortağına mesaj gönderebilir"
  on public.direct_messages for insert
  with check (
    auth.uid() = sender_id
    and not exists (
      select 1 from public.blocks b
      where (b.blocker_id = auth.uid() and b.blocked_id = receiver_id)
         or (b.blocker_id = receiver_id and b.blocked_id = auth.uid())
    )
    and (
      exists (
        select 1 from public.follows f
        where f.follower_id = auth.uid() and f.following_id = receiver_id
      )
      or exists (
        select 1 from public.follows f
        where f.follower_id = receiver_id and f.following_id = auth.uid()
      )
      or exists (
        select 1 from public.direct_messages m
        where m.sender_id = receiver_id and m.receiver_id = auth.uid()
      )
    )
  );
