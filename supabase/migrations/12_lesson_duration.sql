-- =====================================================================
-- MIGRATION 12: Ders süresi (45 dk, 1 saat, 2 saat...)
-- =====================================================================

alter table public.listings
  add column if not exists duration_minutes int not null default 60
    check (duration_minutes between 15 and 240);

update public.listings
  set duration_minutes = 60
  where duration_minutes is null;
