-- =====================================================================
-- MIGRATION 11: Saatli randevu, sahip bildirimi, gönderi paylaşımı
-- =====================================================================

-- 1. İlan çalışma saatleri
alter table public.listings
  add column if not exists open_hour int not null default 8
    check (open_hour between 0 and 23);

alter table public.listings
  add column if not exists close_hour int not null default 22
    check (close_hour between 1 and 24);

-- 2. Talep için tarih + saat
alter table public.purchases
  add column if not exists slot_date date;

alter table public.purchases
  add column if not exists slot_time time;

create unique index if not exists purchases_slot_unique
  on public.purchases (listing_id, slot_date, slot_time)
  where status in ('pending', 'accepted')
    and slot_date is not null
    and slot_time is not null;

-- Yeni taleplerde tarih/saat zorunlu
drop policy if exists "Kullanıcı talep oluşturabilir" on public.purchases;
create policy "Kullanıcı talep oluşturabilir"
  on public.purchases for insert
  with check (
    auth.uid() = user_id
    and status = 'pending'
    and slot_date is not null
    and slot_time is not null
  );

-- 3. Dolu saatleri herkes görebilsin (kim kiraladı görünmez)
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
    and p.status in ('pending', 'accepted')
    and p.slot_time is not null;
$$;

grant execute on function public.listing_booked_slots(uuid, date) to authenticated, anon;

-- 4. Bildirimler
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  listing_id uuid references public.listings (id) on delete cascade,
  purchase_id uuid references public.purchases (id) on delete cascade,
  post_id uuid references public.posts (id) on delete cascade,
  from_user_id uuid references public.profiles (id) on delete set null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

drop policy if exists "Kullanıcı kendi bildirimlerini görür" on public.notifications;
create policy "Kullanıcı kendi bildirimlerini görür"
  on public.notifications for select
  using (auth.uid() = user_id);

drop policy if exists "Kullanıcı bildirimini okundu işaretler" on public.notifications;
create policy "Kullanıcı bildirimini okundu işaretler"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 5. Talep gelince sahibe, karar verilince kullanıcıya bildir + DM
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
    insert into public.notifications (user_id, type, title, body, listing_id, purchase_id, from_user_id)
    values (
      v_owner,
      'booking_request',
      case when v_type = 'field' then 'Yeni kiralama talebi' else 'Yeni ders talebi' end,
      v_name || ' · ' || v_title || ' · ' || v_when,
      new.listing_id,
      new.id,
      new.user_id
    );

    insert into public.direct_messages (sender_id, receiver_id, content)
    values (
      new.user_id,
      v_owner,
      case
        when v_type = 'field' then '📅 Saha kiralama talebi: ' || v_title || E'\n' || v_when
        else '📅 Ders talebi: ' || v_title || E'\n' || v_when
      end
    );
  elsif TG_OP = 'UPDATE' and old.status is distinct from new.status and new.status in ('accepted', 'rejected') then
    insert into public.notifications (user_id, type, title, body, listing_id, purchase_id, from_user_id)
    values (
      new.user_id,
      case when new.status = 'accepted' then 'booking_accepted' else 'booking_rejected' end,
      case when new.status = 'accepted' then 'Talebin onaylandı' else 'Talebin reddedildi' end,
      v_title || ' · ' || v_when,
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
  end if;

  return new;
end;
$$;

drop trigger if exists purchases_notify_booking on public.purchases;
create trigger purchases_notify_booking
  after insert or update of status on public.purchases
  for each row
  execute procedure public.notify_booking();

-- 6. Gönderi paylaşımı (DM içinde kart)
alter table public.direct_messages
  add column if not exists post_id uuid references public.posts (id) on delete set null;

-- Takipçilerine de mesaj / paylaşım gönderebilsin
drop policy if exists "Kullanıcı sohbet ortağına mesaj gönderebilir" on public.direct_messages;
create policy "Kullanıcı sohbet ortağına mesaj gönderebilir"
  on public.direct_messages for insert
  with check (
    auth.uid() = sender_id
    and (
      exists (
        select 1 from public.follows f
        where f.follower_id = auth.uid() and f.following_id = receiver_id
      )
      or exists (
        select 1 from public.follows f
        where f.follower_id = receiver_id and f.following_id = auth.uid()
      )
      or exists (
        select 1 from public.direct_messages m
        where m.sender_id = receiver_id and m.receiver_id = auth.uid()
      )
    )
  );
