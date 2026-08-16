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
  created_at timestamptz not null default now()
);

-- Eski şemadan gelen kurulumlar için
alter table public.profiles add column if not exists is_field_owner boolean not null default false;
alter table public.profiles add column if not exists is_instructor boolean not null default false;
alter table public.profiles add column if not exists is_admin boolean not null default false;

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
  where status in ('pending', 'accepted')
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
    and p.status in ('pending', 'accepted')
    and p.slot_time is not null;
$$;

grant execute on function public.listing_booked_slots(uuid, date) to authenticated, anon;

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
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.direct_messages enable row level security;

create policy "Kullanıcı kendi mesajlaşmalarını görebilir"
  on public.direct_messages for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

drop policy if exists "Kullanıcı takip ettiği kişiye mesaj gönderebilir" on public.direct_messages;
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

-- Alıcı, kendisine gelen mesajları okundu olarak işaretleyebilir.
create policy "Alıcı mesajı okundu işaretleyebilir"
  on public.direct_messages for update
  using (auth.uid() = receiver_id)
  with check (auth.uid() = receiver_id);

drop trigger if exists purchases_notify_booking on public.purchases;
create trigger purchases_notify_booking
  after insert or update of status on public.purchases
  for each row
  execute procedure public.notify_booking();

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
