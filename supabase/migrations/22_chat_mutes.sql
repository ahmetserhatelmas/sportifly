-- Sohbet sessize alma + sessiz sohbetlere DM push gitmesin

create table if not exists public.chat_mutes (
  user_id uuid not null references public.profiles (id) on delete cascade,
  partner_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, partner_id),
  check (user_id <> partner_id)
);

alter table public.chat_mutes enable row level security;

drop policy if exists "Kullanıcı sessiz sohbetlerini görür" on public.chat_mutes;
create policy "Kullanıcı sessiz sohbetlerini görür"
  on public.chat_mutes for select using (auth.uid() = user_id);

drop policy if exists "Kullanıcı sohbet sessize alabilir" on public.chat_mutes;
create policy "Kullanıcı sohbet sessize alabilir"
  on public.chat_mutes for insert with check (auth.uid() = user_id);

drop policy if exists "Kullanıcı sohbet sesini açabilir" on public.chat_mutes;
create policy "Kullanıcı sohbet sesini açabilir"
  on public.chat_mutes for delete using (auth.uid() = user_id);

create or replace function public.notify_dm()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token text;
  v_enabled boolean;
  v_name text;
begin
  if exists (
    select 1 from public.chat_mutes m
    where m.user_id = new.receiver_id and m.partner_id = new.sender_id
  ) then
    return new;
  end if;

  select p.expo_push_token, coalesce(p.push_enabled, true)
    into v_token, v_enabled
  from public.profiles p
  where p.id = new.receiver_id;

  if not coalesce(v_enabled, true) or v_token is null or length(v_token) < 8 then
    return new;
  end if;

  select coalesce(nullif(trim(p.full_name), ''), p.username)
    into v_name
  from public.profiles p
  where p.id = new.sender_id;

  perform public.try_send_expo_push(
    v_token,
    coalesce(v_name, 'Yeni mesaj'),
    left(coalesce(new.content, ''), 120)
  );
  return new;
end;
$$;

drop trigger if exists direct_messages_notify on public.direct_messages;
create trigger direct_messages_notify
  after insert on public.direct_messages
  for each row
  execute procedure public.notify_dm();
