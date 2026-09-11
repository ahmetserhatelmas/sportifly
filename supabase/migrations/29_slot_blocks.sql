-- =====================================================================
-- MIGRATION 29: İlan sahibi / hoca saati elle dolu işaretler (elden ödeme)
-- =====================================================================

create table if not exists public.listing_slot_blocks (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  slot_date date not null,
  slot_time time not null,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (listing_id, slot_date, slot_time)
);

alter table public.listing_slot_blocks enable row level security;

drop policy if exists "Herkes kilitli saatleri görebilir" on public.listing_slot_blocks;
create policy "Herkes kilitli saatleri görebilir"
  on public.listing_slot_blocks for select
  using (true);

drop policy if exists "İlan sahibi saat kilitleyebilir" on public.listing_slot_blocks;
create policy "İlan sahibi saat kilitleyebilir"
  on public.listing_slot_blocks for insert
  with check (
    auth.uid() = created_by
    and exists (
      select 1 from public.listings l
      where l.id = listing_slot_blocks.listing_id and l.owner_id = auth.uid()
    )
  );

drop policy if exists "İlan sahibi kilit kaldırabilir" on public.listing_slot_blocks;
create policy "İlan sahibi kilit kaldırabilir"
  on public.listing_slot_blocks for delete
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_slot_blocks.listing_id and l.owner_id = auth.uid()
    )
  );

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
    and p.slot_time is not null
  union
  select b.slot_time
  from public.listing_slot_blocks b
  where b.listing_id = p_listing_id
    and b.slot_date = p_date;
$$;

create or replace function public.reject_pending_on_slot_block()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1 from public.purchases p
    where p.listing_id = new.listing_id
      and p.slot_date = new.slot_date
      and p.slot_time = new.slot_time
      and p.status = 'accepted'
  ) then
    raise exception 'Bu saat zaten uygulamadan dolu';
  end if;

  update public.purchases
  set status = 'rejected'
  where listing_id = new.listing_id
    and slot_date = new.slot_date
    and slot_time = new.slot_time
    and status = 'pending';

  return new;
end;
$$;

drop trigger if exists listing_slot_blocks_reject_pending on public.listing_slot_blocks;
create trigger listing_slot_blocks_reject_pending
  before insert on public.listing_slot_blocks
  for each row
  execute function public.reject_pending_on_slot_block();

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

  if exists (
    select 1 from public.listing_slot_blocks b
    where b.listing_id = new.listing_id
      and b.slot_date = new.slot_date
      and b.slot_time = new.slot_time
  ) then
    raise exception 'Bu saat dolu';
  end if;

  return new;
end;
$$;
