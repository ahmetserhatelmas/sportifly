-- Sohbetteki rezervasyon mesajından ilan detayına gidilebilsin.

alter table public.direct_messages
  add column if not exists listing_id uuid references public.listings (id) on delete set null;

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
  v_kind text;
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

  v_kind := case when v_type = 'field' then 'Saha kiralama talebi' else 'Ders talebi' end;

  if TG_OP = 'INSERT' then
    v_push_title := case when v_type = 'field' then 'Yeni kiralama talebi' else 'Yeni ders talebi' end;
    v_push_body := v_name || ' · ' || v_title || ' · ' || v_when;

    insert into public.notifications (user_id, type, title, body, listing_id, purchase_id, from_user_id)
    values (v_owner, 'booking_request', v_push_title, v_push_body, new.listing_id, new.id, new.user_id);

    insert into public.direct_messages (sender_id, receiver_id, content, listing_id)
    values (
      new.user_id,
      v_owner,
      v_kind || E'\nAd soyad: ' || v_name || E'\n' || v_title || E'\n' || v_when,
      new.listing_id
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

    insert into public.direct_messages (sender_id, receiver_id, content, listing_id)
    values (
      v_owner,
      new.user_id,
      v_push_title || E'\n' || v_title || E'\n' || v_when,
      new.listing_id
    );

    select expo_push_token into v_token from public.profiles where id = new.user_id;
    perform public.try_send_expo_push(v_token, v_push_title, v_push_body);
  end if;

  return new;
end;
$$;

update public.direct_messages dm
set listing_id = l.id
from public.listings l
where dm.listing_id is null
  and position(l.title in dm.content) > 0
  and (
    dm.content ilike '%talebi%'
    or dm.content ilike '%onaylandı%'
    or dm.content ilike '%reddedildi%'
  );
