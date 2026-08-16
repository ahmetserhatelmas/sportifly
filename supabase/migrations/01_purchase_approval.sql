-- =====================================================================
-- MIGRATION 01: Talep onay akışı
-- schema.sql'i DAHA ÖNCE çalıştırmış mevcut veritabanları için.
-- (Sıfırdan kurulumda gerek yok; schema.sql güncel halini içeriyor.)
-- =====================================================================

-- 1. purchases tablosuna durum kolonu ekle
alter table public.purchases
  add column if not exists status text not null default 'pending'
  check (status in ('pending', 'accepted', 'rejected'));

-- Eski kayıtlar onaylanmış sayılsın (daha önce direkt satın alma vardı)
update public.purchases set status = 'accepted' where status = 'pending';

-- 2. purchases politikalarını yenile
drop policy if exists "Kullanıcı kendi satın alımlarını görebilir" on public.purchases;
drop policy if exists "Kullanıcı satın alma yapabilir" on public.purchases;
drop policy if exists "Kullanıcı ve ilan sahibi talepleri görebilir" on public.purchases;
drop policy if exists "Kullanıcı talep oluşturabilir" on public.purchases;
drop policy if exists "İlan sahibi talebi onaylayabilir veya reddedebilir" on public.purchases;

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
  with check (auth.uid() = user_id and status = 'pending');

create policy "İlan sahibi talebi onaylayabilir veya reddedebilir"
  on public.purchases for update
  using (
    exists (
      select 1 from public.listings l
      where l.id = purchases.listing_id and l.owner_id = auth.uid()
    )
  );

-- 3. Değerlendirme: yalnızca onaylı talebi olanlar puan verebilsin
drop policy if exists "Kullanıcı değerlendirme yapabilir" on public.listing_reviews;
drop policy if exists "Onaylı talebi olan kullanıcı değerlendirme yapabilir" on public.listing_reviews;

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
