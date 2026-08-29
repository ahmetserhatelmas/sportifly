-- =====================================================================
-- MIGRATION 14: Telefon push bildirimi (Expo token)
-- =====================================================================

alter table public.profiles
  add column if not exists expo_push_token text;

create or replace function public.push_after_booking(p_purchase_id uuid)
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
    owner.expo_push_token as token,
    case when l.type = 'field' then 'Yeni kiralama talebi' else 'Yeni ders talebi' end as title,
    coalesce(nullif(trim(buyer.full_name), ''), buyer.username)
      || ' · ' || l.title
      || case
        when pu.slot_date is not null then
          ' · ' || to_char(pu.slot_date, 'DD.MM.YYYY') || ' • ' || to_char(pu.slot_time, 'HH24:MI')
        else ''
      end as body
  into rec
  from public.purchases pu
  join public.listings l on l.id = pu.listing_id
  join public.profiles owner on owner.id = l.owner_id
  join public.profiles buyer on buyer.id = pu.user_id
  where pu.id = p_purchase_id
    and pu.user_id = auth.uid();

  if rec.token is null or rec.token = '' then
    return null;
  end if;

  return json_build_object('token', rec.token, 'title', rec.title, 'body', rec.body);
end;
$$;

create or replace function public.push_after_decision(p_purchase_id uuid)
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
    buyer.expo_push_token as token,
    case when pu.status = 'accepted' then 'Talebin onaylandı' else 'Talebin reddedildi' end as title,
    l.title
      || case
        when pu.slot_date is not null then
          ' · ' || to_char(pu.slot_date, 'DD.MM.YYYY') || ' • ' || to_char(pu.slot_time, 'HH24:MI')
        else ''
      end as body
  into rec
  from public.purchases pu
  join public.listings l on l.id = pu.listing_id
  join public.profiles buyer on buyer.id = pu.user_id
  where pu.id = p_purchase_id
    and l.owner_id = auth.uid()
    and pu.status in ('accepted', 'rejected');

  if rec.token is null or rec.token = '' then
    return null;
  end if;

  return json_build_object('token', rec.token, 'title', rec.title, 'body', rec.body);
end;
$$;

grant execute on function public.push_after_booking(uuid) to authenticated;
grant execute on function public.push_after_decision(uuid) to authenticated;
