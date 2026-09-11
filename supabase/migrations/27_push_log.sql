-- Push neden gitmiyor görelim + pg_net yetkisi

create table if not exists public.push_log (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  kind text not null,
  receiver_id uuid,
  has_token boolean,
  note text
);

alter table public.push_log enable row level security;

grant usage on schema net to postgres, service_role;
grant execute on all functions in schema net to postgres, service_role;

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
  if new.sender_id = new.receiver_id then
    insert into public.push_log (kind, receiver_id, has_token, note)
    values ('dm', new.receiver_id, false, 'kendi kendine');
    return new;
  end if;

  if exists (
    select 1 from public.chat_mutes m
    where m.user_id = new.receiver_id and m.partner_id = new.sender_id
  ) then
    insert into public.push_log (kind, receiver_id, has_token, note)
    values ('dm', new.receiver_id, false, 'sessize alinmis');
    return new;
  end if;

  select p.expo_push_token, coalesce(p.push_enabled, true)
    into v_token, v_enabled
  from public.profiles p
  where p.id = new.receiver_id;

  if not coalesce(v_enabled, true) then
    insert into public.push_log (kind, receiver_id, has_token, note)
    values ('dm', new.receiver_id, v_token is not null, 'bildirim kapali');
    return new;
  end if;

  if v_token is null or length(v_token) < 8 then
    insert into public.push_log (kind, receiver_id, has_token, note)
    values ('dm', new.receiver_id, false, 'token yok — alici uygulamayi bir kez acmali');
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

  insert into public.push_log (kind, receiver_id, has_token, note)
  values ('dm', new.receiver_id, true, 'expo ya gonderildi');
  return new;
end;
$$;

drop trigger if exists direct_messages_notify on public.direct_messages;
create trigger direct_messages_notify
  after insert on public.direct_messages
  for each row
  execute function public.notify_dm();
