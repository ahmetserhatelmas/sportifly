-- =====================================================================
-- MIGRATION 13: Saat yalnızca onaylanınca dolsun (1 saatlik slot)
-- =====================================================================

drop index if exists public.purchases_slot_unique;
create unique index if not exists purchases_slot_unique
  on public.purchases (listing_id, slot_date, slot_time)
  where status = 'accepted'
    and slot_date is not null
    and slot_time is not null;

create or replace function public.listing_booked_slots(p_listing_id uuid, p_date date)
returns table (slot_time time)
language sql
stable
security definer
set search_path = public
as $$
  select p.slot_time
  from public.purchases p
  where p.listing_id = p_listing_id
    and p.slot_date = p_date
    and p.status = 'accepted'
    and p.slot_time is not null;
$$;

-- Aynı saate başka bekleyen talepler onaylanınca otomatik reddedilsin
create or replace function public.reject_overlapping_pending()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'accepted' and new.slot_date is not null and new.slot_time is not null then
    update public.purchases
    set status = 'rejected'
    where listing_id = new.listing_id
      and slot_date = new.slot_date
      and slot_time = new.slot_time
      and status = 'pending'
      and id <> new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists purchases_reject_overlap on public.purchases;
create trigger purchases_reject_overlap
  after update of status on public.purchases
  for each row
  execute procedure public.reject_overlapping_pending();
