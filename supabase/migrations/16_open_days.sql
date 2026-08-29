-- =====================================================================
-- MIGRATION 16: İlan açık günleri + en fazla 1 haftalık randevu penceresi
-- =====================================================================

alter table public.listings
  add column if not exists open_days int[] not null default '{1,2,3,4,5,6,7}';

alter table public.listings
  drop constraint if exists listings_open_days_check;

alter table public.listings
  add constraint listings_open_days_check
  check (
    array_length(open_days, 1) >= 1
    and open_days <@ array[1, 2, 3, 4, 5, 6, 7]
  );

create or replace function public.enforce_booking_window()
returns trigger
language plpgsql
as $$
declare
  v_days int[];
  v_today date := (timezone('Europe/Istanbul', now()))::date;
  v_dow int;
begin
  if new.slot_date is null then
    raise exception 'Tarih gerekli';
  end if;

  if new.slot_date < v_today then
    raise exception 'Geçmiş güne randevu alınamaz';
  end if;

  if new.slot_date > v_today + 6 then
    raise exception 'En fazla 1 hafta sonrası için randevu alınabilir';
  end if;

  select open_days into v_days from public.listings where id = new.listing_id;
  v_dow := extract(isodow from new.slot_date)::int;

  if v_days is not null and not (v_dow = any (v_days)) then
    raise exception 'Bu günde ilan müsait değil';
  end if;

  return new;
end;
$$;

drop trigger if exists purchases_enforce_booking_window on public.purchases;
create trigger purchases_enforce_booking_window
  before insert or update of slot_date, listing_id
  on public.purchases
  for each row
  execute function public.enforce_booking_window();
