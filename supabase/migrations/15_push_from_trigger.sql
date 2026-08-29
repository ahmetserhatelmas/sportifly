-- =====================================================================
-- MIGRATION 15: Rezervasyon olunca Expo push'u sunucudan gönder
-- (istemci kapalı/Expo Go olsa bile token varsa telefon çalar)
-- =====================================================================

create extension if not exists pg_net with schema extensions;

create or replace function public.try_send_expo_push(p_token text, p_title text, p_body text)
returns void
language plpgsql
security definer
set search_path = public, extensions, net
as $$
begin
  if p_token is null or length(trim(p_token)) = 0 then
    return;
  end if;

  perform net.http_post(
    url := 'https://exp.host/--/api/v2/push/send',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Accept', 'application/json'
    ),
    body := jsonb_build_object(
      'to', p_token,
      'title', p_title,
      'body', p_body,
      'sound', 'default',
      'channelId', 'reservations',
      'priority', 'high'
    )
  );
exception
  when others then
    return;
end;
$$;

create or replace function public.notify_booking()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
  v_title text;
  v_type text;
  v_name text;
  v_when text;
  v_push_title text;
  v_push_body text;
  v_token text;
begin
  select owner_id, title, type into v_owner, v_title, v_type
  from public.listings
  where id = new.listing_id;

  if v_owner is null or v_owner = new.user_id then
    return new;
  end if;

  select coalesce(nullif(trim(full_name), ''), username) into v_name
  from public.profiles
  where id = new.user_id;

  v_when := case
    when new.slot_date is not null then
      to_char(new.slot_date, 'DD.MM.YYYY') || ' • ' || to_char(new.slot_time, 'HH24:MI')
    else
      to_char(new.created_at at time zone 'Europe/Istanbul', 'DD.MM.YYYY')
  end;

  if TG_OP = 'INSERT' then
    v_push_title := case when v_type = 'field' then 'Yeni kiralama talebi' else 'Yeni ders talebi' end;
    v_push_body := v_name || ' · ' || v_title || ' · ' || v_when;

    insert into public.notifications (user_id, type, title, body, listing_id, purchase_id, from_user_id)
    values (v_owner, 'booking_request', v_push_title, v_push_body, new.listing_id, new.id, new.user_id);

    insert into public.direct_messages (sender_id, receiver_id, content)
    values (
      new.user_id,
      v_owner,
      case
        when v_type = 'field' then '📅 Saha kiralama talebi: ' || v_title || E'\n' || v_when
        else '📅 Ders talebi: ' || v_title || E'\n' || v_when
      end
    );

    select expo_push_token into v_token from public.profiles where id = v_owner;
    perform public.try_send_expo_push(v_token, v_push_title, v_push_body);

  elsif TG_OP = 'UPDATE' and old.status is distinct from new.status and new.status in ('accepted', 'rejected') then
    v_push_title := case when new.status = 'accepted' then 'Talebin onaylandı' else 'Talebin reddedildi' end;
    v_push_body := v_title || ' · ' || v_when;

    insert into public.notifications (user_id, type, title, body, listing_id, purchase_id, from_user_id)
    values (
      new.user_id,
      case when new.status = 'accepted' then 'booking_accepted' else 'booking_rejected' end,
      v_push_title,
      v_push_body,
      new.listing_id,
      new.id,
      v_owner
    );

    insert into public.direct_messages (sender_id, receiver_id, content)
    values (
      v_owner,
      new.user_id,
      case
        when new.status = 'accepted' then '✅ Talebin onaylandı: ' || v_title || E'\n' || v_when
        else '❌ Talebin reddedildi: ' || v_title || E'\n' || v_when
      end
    );

    select expo_push_token into v_token from public.profiles where id = new.user_id;
    perform public.try_send_expo_push(v_token, v_push_title, v_push_body);
  end if;

  return new;
end;
$$;

grant execute on function public.try_send_expo_push(text, text, text) to postgres, service_role;
