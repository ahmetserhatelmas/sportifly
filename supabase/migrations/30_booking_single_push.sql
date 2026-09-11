-- =====================================================================
-- MIGRATION 30: Rezervasyon push'u tek kaynaktan gitsin + token cihaza bağlı kalsın
--  - notify_booking artık Expo'ya push atmaz (istemci push_after_booking /
--    push_after_decision ile yollar; 28'deki mesaj mantığıyla aynı).
--  - claim_push_token: aynı token başka profilde kalmışsa temizler, böylece
--    aynı telefonda hesap değiştirince eski hesabın bildirimi gelmez.
-- =====================================================================

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

    insert into public.direct_messages (sender_id, receiver_id, content, listing_id)
    values (
      new.user_id,
      v_owner,
      case
        when v_type = 'field' then 'Saha kiralama talebi'
        else 'Ders talebi'
      end
      || E'\nAd soyad: ' || v_name || E'\n' || v_title || E'\n' || v_when,
      new.listing_id
    );

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
  end if;

  return new;
end;
$$;

-- Token'ı bu kullanıcıya bağla; aynı cihaz token'ı başka profilde kalmışsa sil.
create or replace function public.claim_push_token(p_token text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or p_token is null or length(trim(p_token)) = 0 then
    return;
  end if;

  update public.profiles
  set expo_push_token = null
  where expo_push_token = p_token
    and id <> auth.uid();

  update public.profiles
  set expo_push_token = p_token
  where id = auth.uid();
end;
$$;

grant execute on function public.claim_push_token(text) to authenticated;
