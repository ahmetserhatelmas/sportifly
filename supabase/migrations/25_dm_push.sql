-- DM push: pg_net şema farkını düzelt + istemcinin token çekebileceği RPC

create extension if not exists pg_net;

create or replace function public.try_send_expo_push(p_token text, p_title text, p_body text)
returns void
language plpgsql
security definer
set search_path = public, extensions, net
as $$
declare
  v_headers jsonb;
  v_body jsonb;
begin
  if p_token is null or length(trim(p_token)) = 0 then
    return;
  end if;

  v_headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Accept', 'application/json'
  );
  v_body := jsonb_build_object(
    'to', p_token,
    'title', p_title,
    'body', p_body,
    'sound', 'default',
    'channelId', 'reservations',
    'priority', 'high'
  );

  begin
    perform net.http_post(
      url := 'https://exp.host/--/api/v2/push/send',
      headers := v_headers,
      body := v_body
    );
  exception
    when undefined_function then
      perform extensions.http_post(
        url := 'https://exp.host/--/api/v2/push/send',
        headers := v_headers,
        body := v_body
      );
    when others then
      return;
  end;
exception
  when others then
    return;
end;
$$;

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
    return new;
  end if;

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
  execute function public.notify_dm();

create or replace function public.push_after_dm(p_message_id uuid)
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  rec record;
begin
  select
    recv.expo_push_token as token,
    coalesce(recv.push_enabled, true) as enabled,
    coalesce(nullif(trim(send.full_name), ''), send.username, 'Yeni mesaj') as title,
    left(coalesce(m.content, ''), 120) as body,
    m.sender_id,
    m.receiver_id
  into rec
  from public.direct_messages m
  join public.profiles recv on recv.id = m.receiver_id
  join public.profiles send on send.id = m.sender_id
  where m.id = p_message_id
    and m.sender_id = auth.uid();

  if rec.token is null or rec.token = '' or not rec.enabled then
    return null;
  end if;
  if rec.sender_id = rec.receiver_id then
    return null;
  end if;
  if exists (
    select 1 from public.chat_mutes
    where user_id = rec.receiver_id and partner_id = rec.sender_id
  ) then
    return null;
  end if;

  return json_build_object('token', rec.token, 'title', rec.title, 'body', rec.body);
end;
$$;

grant execute on function public.push_after_dm(uuid) to authenticated;
