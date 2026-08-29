-- =====================================================================
-- SPORTIFLY - Supabase veritabanı şeması
-- Supabase Dashboard > SQL Editor içinde bu dosyanın tamamını çalıştırın.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. PROFILLER
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique not null,
  full_name text,
  avatar_url text,
  banner_url text,
  bio text,
  is_field_owner boolean not null default false,
  is_instructor boolean not null default false,
  is_admin boolean not null default false,
  expo_push_token text,
  push_enabled boolean not null default true,
  created_at timestamptz not null default now()
);

-- Eski şemadan gelen kurulumlar için
alter table public.profiles add column if not exists is_field_owner boolean not null default false;
alter table public.profiles add column if not exists is_instructor boolean not null default false;
alter table public.profiles add column if not exists is_admin boolean not null default false;
alter table public.profiles add column if not exists push_enabled boolean not null default true;

alter table public.profiles enable row level security;

create policy "Profiller herkes tarafından okunabilir"
  on public.profiles for select using (true);

create policy "Kullanıcı kendi profilini oluşturabilir"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Kullanıcı kendi profilini güncelleyebilir"
  on public.profiles for update using (auth.uid() = id);

-- Kullanıcı kendi saha sahibi / eğitmen / admin bayrağını değiştiremesin.
create or replace function public.protect_profile_roles()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is not null and auth.uid() = new.id then
    if new.is_field_owner is distinct from old.is_field_owner
       or new.is_instructor is distinct from old.is_instructor
       or new.is_admin is distinct from old.is_admin then
      raise exception 'Rol alanları yalnızca yönetici tarafından değiştirilebilir';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_roles on public.profiles;
create trigger protect_profile_roles
  before update on public.profiles
  for each row execute function public.protect_profile_roles();

-- Yeni kullanıcı kaydında otomatik profil oluştur
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'full_name'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 2. TAKİP SİSTEMİ
-- ---------------------------------------------------------------------
create table if not exists public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

alter table public.follows enable row level security;

create policy "Takipler herkes tarafından okunabilir"
  on public.follows for select using (true);

create policy "Kullanıcı takip edebilir"
  on public.follows for insert with check (auth.uid() = follower_id);

create policy "Kullanıcı takibi bırakabilir"
  on public.follows for delete using (auth.uid() = follower_id);

-- ---------------------------------------------------------------------
-- 3. GÖNDERİLER (Akış / Feed)
-- ---------------------------------------------------------------------
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  image_url text not null,
  caption text,
  created_at timestamptz not null default now()
);

alter table public.posts enable row level security;

create policy "Gönderiler herkes tarafından okunabilir"
  on public.posts for select using (true);

create policy "Kullanıcı gönderi paylaşabilir"
  on public.posts for insert with check (auth.uid() = user_id);

create policy "Kullanıcı kendi gönderisini güncelleyebilir"
  on public.posts for update using (auth.uid() = user_id);

create policy "Kullanıcı kendi gönderisini silebilir"
  on public.posts for delete using (auth.uid() = user_id);

create table if not exists public.post_likes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.post_likes enable row level security;

create policy "Beğeniler herkes tarafından okunabilir"
  on public.post_likes for select using (true);

create policy "Kullanıcı beğenebilir"
  on public.post_likes for insert with check (auth.uid() = user_id);

create policy "Kullanıcı beğeniyi kaldırabilir"
  on public.post_likes for delete using (auth.uid() = user_id);

create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.post_comments enable row level security;

create policy "Yorumlar herkes tarafından okunabilir"
  on public.post_comments for select using (true);

create policy "Kullanıcı yorum yapabilir"
  on public.post_comments for insert with check (auth.uid() = user_id);

create policy "Kullanıcı kendi yorumunu silebilir"
  on public.post_comments for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 4. MAĞAZA: SAHA & DERS İLANLARI
-- ---------------------------------------------------------------------
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in ('field', 'lesson')),
  title text not null,
  description text,
  sport text not null,
  city text not null,
  district text not null,
  price numeric(10, 2) not null check (price >= 0),
  commission_accepted boolean not null default false,
  image_url text,
  open_hour int not null default 8 check (open_hour between 0 and 23),
  close_hour int not null default 22 check (close_hour between 1 and 24),
  open_days int[] not null default '{1,2,3,4,5,6,7}',
  duration_minutes int not null default 60 check (duration_minutes between 15 and 240),
  created_at timestamptz not null default now()
);

alter table public.listings enable row level security;

create policy "İlanlar herkes tarafından okunabilir"
  on public.listings for select using (true);

drop policy if exists "Kullanıcı ilan oluşturabilir (komisyon onayı zorunlu)" on public.listings;
drop policy if exists "Yetkili kullanıcı ilan oluşturabilir" on public.listings;
create policy "Yetkili kullanıcı ilan oluşturabilir"
  on public.listings for insert
  with check (
    auth.uid() = owner_id
    and commission_accepted = true
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (
          p.is_admin = true
          or (type = 'field' and p.is_field_owner = true)
          or (type = 'lesson' and p.is_instructor = true)
        )
    )
  );

create policy "Kullanıcı kendi ilanını güncelleyebilir"
  on public.listings for update using (auth.uid() = owner_id);

create policy "Kullanıcı kendi ilanını silebilir"
  on public.listings for delete using (auth.uid() = owner_id);

create table if not exists public.listing_reviews (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (listing_id, user_id)
);

alter table public.listing_reviews enable row level security;

create policy "Değerlendirmeler herkes tarafından okunabilir"
  on public.listing_reviews for select using (true);

-- Not: Değerlendirme ekleme politikası, purchases tablosuna bağımlı olduğu
-- için purchases tablosunun tanımından sonra oluşturuluyor (aşağıda).

create policy "Kullanıcı kendi değerlendirmesini güncelleyebilir"
  on public.listing_reviews for update using (auth.uid() = user_id);

-- Satın alma / kiralama talepleri ("Satın Alınanlar" için)
-- Talep akışı: pending (beklemede) -> accepted (onaylandı) / rejected (reddedildi)
create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  listing_id uuid not null references public.listings (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  slot_date date,
  slot_time time,
  created_at timestamptz not null default now()
);

alter table public.purchases enable row level security;

create policy "Kullanıcı ve ilan sahibi talepleri görebilir"
  on public.purchases for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.listings l
      where l.id = purchases.listing_id and l.owner_id = auth.uid()
    )
  );

create policy "Kullanıcı talep oluşturabilir"
  on public.purchases for insert
  with check (
    auth.uid() = user_id
    and status = 'pending'
    and slot_date is not null
    and slot_time is not null
  );

create unique index if not exists purchases_slot_unique
  on public.purchases (listing_id, slot_date, slot_time)
  where status = 'accepted'
    and slot_date is not null
    and slot_time is not null;

create policy "İlan sahibi talebi onaylayabilir veya reddedebilir"
  on public.purchases for update
  using (
    exists (
      select 1 from public.listings l
      where l.id = purchases.listing_id and l.owner_id = auth.uid()
    )
  );

create policy "Kullanıcı bekleyen talebini iptal edebilir"
  on public.purchases for delete
  using (auth.uid() = user_id and status = 'pending');

-- Puanlama yalnızca ilan sahibi talebi onayladıktan sonra yapılabilir
create policy "Onaylı talebi olan kullanıcı değerlendirme yapabilir"
  on public.listing_reviews for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.purchases p
      where p.listing_id = listing_reviews.listing_id
        and p.user_id = auth.uid()
        and p.status = 'accepted'
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
    and p.slot_time is not null;
$$;

grant execute on function public.listing_booked_slots(uuid, date) to authenticated, anon;

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

create policy "Kullanıcı kendi bildirimlerini görür"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Kullanıcı bildirimini okundu işaretler"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

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

-- ---------------------------------------------------------------------
-- 5. DÜELLOLAR (Müsabakalar)
-- ---------------------------------------------------------------------
create table if not exists public.duels (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles (id) on delete cascade,
  sport text not null,
  title text not null,
  description text,
  city text not null,
  district text not null,
  match_date date not null,
  start_time time not null,
  max_players int not null check (max_players between 2 and 12),
  level text not null check (level in ('baslangic', 'orta', 'ileri')),
  winner_id uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

alter table public.duels enable row level security;

create policy "Düellolar herkes tarafından okunabilir"
  on public.duels for select using (true);

create policy "Kullanıcı düello oluşturabilir"
  on public.duels for insert with check (auth.uid() = creator_id);

create policy "Kurucu düelloyu güncelleyebilir"
  on public.duels for update using (auth.uid() = creator_id);

create policy "Kurucu düelloyu silebilir"
  on public.duels for delete using (auth.uid() = creator_id);

create table if not exists public.duel_participants (
  duel_id uuid not null references public.duels (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (duel_id, user_id)
);

alter table public.duel_participants enable row level security;

create policy "Katılımcılar herkes tarafından okunabilir"
  on public.duel_participants for select using (true);

create policy "Kullanıcı düelloya katılabilir"
  on public.duel_participants for insert with check (auth.uid() = user_id);

create policy "Kullanıcı düellodan ayrılabilir"
  on public.duel_participants for delete using (auth.uid() = user_id);

-- Kontenjan koruması: dolu düelloya yeni katılımcı eklenemez (yarış durumlarına karşı).
create or replace function public.check_duel_capacity()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Aynı düelloya eşzamanlı katılımları sıraya sokmak için satırı kilitle.
  perform 1 from public.duels where id = new.duel_id for update;

  if (select count(*) from public.duel_participants where duel_id = new.duel_id)
     >= (select max_players from public.duels where id = new.duel_id) then
    raise exception 'Düello kontenjanı dolu';
  end if;
  return new;
end;
$$;

drop trigger if exists duel_capacity_check on public.duel_participants;
create trigger duel_capacity_check
  before insert on public.duel_participants
  for each row execute function public.check_duel_capacity();

-- Düello sohbeti (buluşma yeri ve saati netleştirmek için)
create table if not exists public.duel_messages (
  id uuid primary key default gen_random_uuid(),
  duel_id uuid not null references public.duels (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.duel_messages enable row level security;

create policy "Katılımcılar düello mesajlarını okuyabilir"
  on public.duel_messages for select
  using (
    exists (
      select 1 from public.duel_participants dp
      where dp.duel_id = duel_messages.duel_id and dp.user_id = auth.uid()
    )
  );

create policy "Katılımcılar düello mesajı gönderebilir"
  on public.duel_messages for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.duel_participants dp
      where dp.duel_id = duel_messages.duel_id and dp.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------
-- 6. DİREKT MESAJLAR (takipleşilen kişilerle)
-- ---------------------------------------------------------------------
create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles (id) on delete cascade,
  receiver_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  post_id uuid references public.posts (id) on delete set null,
  listing_id uuid references public.listings (id) on delete set null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.direct_messages enable row level security;

create policy "Kullanıcı kendi mesajlaşmalarını görebilir"
  on public.direct_messages for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create table if not exists public.chat_hides (
  user_id uuid not null references public.profiles (id) on delete cascade,
  partner_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, partner_id)
);
alter table public.chat_hides enable row level security;
drop policy if exists "Kullanıcı gizlediği sohbetleri görür" on public.chat_hides;
create policy "Kullanıcı gizlediği sohbetleri görür"
  on public.chat_hides for select using (auth.uid() = user_id);
drop policy if exists "Kullanıcı sohbet gizleyebilir" on public.chat_hides;
create policy "Kullanıcı sohbet gizleyebilir"
  on public.chat_hides for insert with check (auth.uid() = user_id);
drop policy if exists "Kullanıcı sohbet gizini kaldırabilir" on public.chat_hides;
create policy "Kullanıcı sohbet gizini kaldırabilir"
  on public.chat_hides for delete using (auth.uid() = user_id);

create table if not exists public.chat_mutes (
  user_id uuid not null references public.profiles (id) on delete cascade,
  partner_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, partner_id),
  check (user_id <> partner_id)
);
alter table public.chat_mutes enable row level security;
drop policy if exists "Kullanıcı sessiz sohbetlerini görür" on public.chat_mutes;
create policy "Kullanıcı sessiz sohbetlerini görür"
  on public.chat_mutes for select using (auth.uid() = user_id);
drop policy if exists "Kullanıcı sohbet sessize alabilir" on public.chat_mutes;
create policy "Kullanıcı sohbet sessize alabilir"
  on public.chat_mutes for insert with check (auth.uid() = user_id);
drop policy if exists "Kullanıcı sohbet sesini açabilir" on public.chat_mutes;
create policy "Kullanıcı sohbet sesini açabilir"
  on public.chat_mutes for delete using (auth.uid() = user_id);

create table if not exists public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
alter table public.blocks enable row level security;
drop policy if exists "Kullanıcı engellerini görür" on public.blocks;
create policy "Kullanıcı engellerini görür"
  on public.blocks for select using (auth.uid() = blocker_id or auth.uid() = blocked_id);
drop policy if exists "Kullanıcı engelleyebilir" on public.blocks;
create policy "Kullanıcı engelleyebilir"
  on public.blocks for insert with check (auth.uid() = blocker_id);
drop policy if exists "Kullanıcı engeli kaldırabilir" on public.blocks;
create policy "Kullanıcı engeli kaldırabilir"
  on public.blocks for delete using (auth.uid() = blocker_id);

create or replace function public.blocked_with(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select a is not null and b is not null and exists (
    select 1 from public.blocks
    where (blocker_id = a and blocked_id = b)
       or (blocker_id = b and blocked_id = a)
  );
$$;

create or replace function public.on_block_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.follows
  where (follower_id = new.blocker_id and following_id = new.blocked_id)
     or (follower_id = new.blocked_id and following_id = new.blocker_id);

  insert into public.chat_hides (user_id, partner_id)
  values (new.blocker_id, new.blocked_id), (new.blocked_id, new.blocker_id)
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists blocks_apply_effects on public.blocks;
create trigger blocks_apply_effects
  after insert on public.blocks
  for each row
  execute function public.on_block_insert();

drop policy if exists "Profiller herkes tarafından okunabilir" on public.profiles;
create policy "Profiller herkes tarafından okunabilir"
  on public.profiles for select
  using (
    auth.uid() is null
    or auth.uid() = id
    or not exists (
      select 1 from public.blocks
      where blocker_id = profiles.id and blocked_id = auth.uid()
    )
  );

drop policy if exists "Kullanıcı takip edebilir" on public.follows;
create policy "Kullanıcı takip edebilir"
  on public.follows for insert
  with check (
    auth.uid() = follower_id
    and not public.blocked_with(auth.uid(), following_id)
  );

drop policy if exists "Gönderiler herkes tarafından okunabilir" on public.posts;
create policy "Gönderiler herkes tarafından okunabilir"
  on public.posts for select
  using (auth.uid() is null or not public.blocked_with(auth.uid(), user_id));

drop policy if exists "Yorumlar herkes tarafından okunabilir" on public.post_comments;
create policy "Yorumlar herkes tarafından okunabilir"
  on public.post_comments for select
  using (auth.uid() is null or not public.blocked_with(auth.uid(), user_id));

drop policy if exists "İlanlar herkes tarafından okunabilir" on public.listings;
create policy "İlanlar herkes tarafından okunabilir"
  on public.listings for select
  using (auth.uid() is null or not public.blocked_with(auth.uid(), owner_id));

drop policy if exists "Değerlendirmeler herkes tarafından okunabilir" on public.listing_reviews;
create policy "Değerlendirmeler herkes tarafından okunabilir"
  on public.listing_reviews for select
  using (auth.uid() is null or not public.blocked_with(auth.uid(), user_id));

drop policy if exists "Düellolar herkes tarafından okunabilir" on public.duels;
create policy "Düellolar herkes tarafından okunabilir"
  on public.duels for select
  using (auth.uid() is null or not public.blocked_with(auth.uid(), creator_id));

drop policy if exists "Kullanıcı düelloya katılabilir" on public.duel_participants;
create policy "Kullanıcı düelloya katılabilir"
  on public.duel_participants for insert
  with check (
    auth.uid() = user_id
    and not exists (
      select 1 from public.duels d
      where d.id = duel_id and public.blocked_with(auth.uid(), d.creator_id)
    )
  );

drop policy if exists "Katılımcılar düello mesajlarını okuyabilir" on public.duel_messages;
create policy "Katılımcılar düello mesajlarını okuyabilir"
  on public.duel_messages for select
  using (
    exists (
      select 1 from public.duel_participants dp
      where dp.duel_id = duel_messages.duel_id and dp.user_id = auth.uid()
    )
    and not exists (
      select 1 from public.duels d
      where d.id = duel_messages.duel_id and public.blocked_with(auth.uid(), d.creator_id)
    )
    and (
      user_id = auth.uid()
      or not public.blocked_with(auth.uid(), user_id)
    )
  );

drop policy if exists "Kullanıcı kendi mesajlaşmalarını görebilir" on public.direct_messages;
create policy "Kullanıcı kendi mesajlaşmalarını görebilir"
  on public.direct_messages for select
  using (
    (auth.uid() = sender_id or auth.uid() = receiver_id)
    and not public.blocked_with(
      auth.uid(),
      case when auth.uid() = sender_id then receiver_id else sender_id end
    )
  );

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reported_id uuid not null references public.profiles (id) on delete cascade,
  reason text,
  created_at timestamptz not null default now(),
  check (reporter_id <> reported_id)
);
alter table public.reports enable row level security;
drop policy if exists "Kullanıcı kendi raporlarını görür" on public.reports;
create policy "Kullanıcı kendi raporlarını görür"
  on public.reports for select using (auth.uid() = reporter_id);
drop policy if exists "Kullanıcı rapor gönderebilir" on public.reports;
create policy "Kullanıcı rapor gönderebilir"
  on public.reports for insert with check (auth.uid() = reporter_id);

drop policy if exists "Kullanıcı takip ettiği kişiye mesaj gönderebilir" on public.direct_messages;
drop policy if exists "Kullanıcı sohbet ortağına mesaj gönderebilir" on public.direct_messages;
create policy "Kullanıcı sohbet ortağına mesaj gönderebilir"
  on public.direct_messages for insert
  with check (
    auth.uid() = sender_id
    and not exists (
      select 1 from public.blocks b
      where (b.blocker_id = auth.uid() and b.blocked_id = receiver_id)
         or (b.blocker_id = receiver_id and b.blocked_id = auth.uid())
    )
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

-- Alıcı, kendisine gelen mesajları okundu olarak işaretleyebilir.
create policy "Alıcı mesajı okundu işaretleyebilir"
  on public.direct_messages for update
  using (auth.uid() = receiver_id)
  with check (auth.uid() = receiver_id);

drop policy if exists "Gönderen kendi mesajını silebilir" on public.direct_messages;
create policy "Gönderen kendi mesajını silebilir"
  on public.direct_messages for delete
  using (auth.uid() = sender_id);

drop trigger if exists direct_messages_notify on public.direct_messages;
create trigger direct_messages_notify
  after insert on public.direct_messages
  for each row
  execute procedure public.notify_dm();

create table if not exists public.message_hides (
  user_id uuid not null references public.profiles (id) on delete cascade,
  message_id uuid not null references public.direct_messages (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, message_id)
);
alter table public.message_hides enable row level security;
drop policy if exists "Kullanıcı gizlediği mesajları görür" on public.message_hides;
create policy "Kullanıcı gizlediği mesajları görür"
  on public.message_hides for select using (auth.uid() = user_id);
drop policy if exists "Kullanıcı mesaj gizleyebilir" on public.message_hides;
create policy "Kullanıcı mesaj gizleyebilir"
  on public.message_hides for insert with check (auth.uid() = user_id);

drop policy if exists "Gönderen düello mesajını silebilir" on public.duel_messages;
create policy "Gönderen düello mesajını silebilir"
  on public.duel_messages for delete
  using (auth.uid() = user_id);

drop trigger if exists purchases_notify_booking on public.purchases;
create trigger purchases_notify_booking
  after insert or update of status on public.purchases
  for each row
  execute procedure public.notify_booking();

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

-- ---------------------------------------------------------------------
-- 7. DESTEK MESAJLARI
-- ---------------------------------------------------------------------
create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  is_from_support boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.support_messages enable row level security;

create policy "Kullanıcı kendi destek mesajlarını görebilir"
  on public.support_messages for select using (auth.uid() = user_id);

create policy "Kullanıcı destek mesajı gönderebilir"
  on public.support_messages for insert
  with check (auth.uid() = user_id and is_from_support = false);

-- ---------------------------------------------------------------------
-- 7b. ROL BAŞVURULARI (saha sahibi / eğitmen)
-- ---------------------------------------------------------------------
create table if not exists public.role_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('field_owner', 'instructor')),
  note text,
  description text,
  attachment_url text,
  attachment_name text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now()
);

alter table public.role_requests add column if not exists description text;
alter table public.role_requests add column if not exists attachment_url text;
alter table public.role_requests add column if not exists attachment_name text;

create unique index if not exists role_requests_one_pending
  on public.role_requests (user_id, role)
  where status = 'pending';

alter table public.role_requests enable row level security;

create policy "Kullanıcı kendi rol başvurularını görebilir"
  on public.role_requests for select using (auth.uid() = user_id);

create policy "Kullanıcı rol başvurusu gönderebilir"
  on public.role_requests for insert
  with check (auth.uid() = user_id and status = 'pending');

create or replace function public.is_current_user_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.is_admin from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

create policy "Adminler tüm rol başvurularını görebilir"
  on public.role_requests for select
  using (public.is_current_user_admin());

create or replace function public.admin_review_role_request(
  p_request_id uuid,
  p_decision text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  req public.role_requests%rowtype;
begin
  if not public.is_current_user_admin() then
    raise exception 'Bu işlem için admin yetkisi gerekli';
  end if;

  if p_decision not in ('accepted', 'rejected') then
    raise exception 'Geçersiz karar';
  end if;

  select * into req
  from public.role_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Başvuru bulunamadı';
  end if;

  if req.status <> 'pending' then
    raise exception 'Bu başvuru zaten sonuçlandırılmış';
  end if;

  update public.role_requests
  set status = p_decision
  where id = p_request_id;

  if p_decision = 'accepted' then
    if req.role = 'field_owner' then
      update public.profiles set is_field_owner = true where id = req.user_id;
    elsif req.role = 'instructor' then
      update public.profiles set is_instructor = true where id = req.user_id;
    end if;
  end if;
end;
$$;

grant execute on function public.admin_review_role_request(uuid, text) to authenticated;
grant execute on function public.is_current_user_admin() to authenticated;

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

-- ---------------------------------------------------------------------
-- 8. STORAGE BUCKET'LARI (görseller)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

create policy "Medya herkes tarafından görüntülenebilir"
  on storage.objects for select using (bucket_id = 'media');

create policy "Giriş yapan kullanıcı medya yükleyebilir"
  on storage.objects for insert
  with check (bucket_id = 'media' and auth.role() = 'authenticated');

create policy "Kullanıcı kendi medyasını silebilir"
  on storage.objects for delete
  using (bucket_id = 'media' and owner = auth.uid());

-- ---------------------------------------------------------------------
-- 9. REALTIME (sohbetler için)
-- ---------------------------------------------------------------------
alter publication supabase_realtime add table public.duel_messages;
alter publication supabase_realtime add table public.direct_messages;
