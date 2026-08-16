-- Hızlı: Arama ekranına 20 test düellosu ekler / tarihleri yeniler.
-- Supabase SQL Editor'da çalıştır.

insert into public.duels (id, creator_id, sport, title, description, city, district, match_date, start_time, max_players, level) values
  ('44444444-4444-4444-4444-444444444401', '11111111-1111-1111-1111-111111111101', 'Futbol',    'Acıbadem 5v5 Dostluk Maçı',   'Kaleci dahil, 60 dk.',                     'İstanbul', 'Kadıköy',     current_date + 1,  '21:00', 10, 'orta'),
  ('44444444-4444-4444-4444-444444444402', '11111111-1111-1111-1111-111111111102', 'Basketbol', '3v3 Sokak Basketbolu',        'Yarı saha, 21''de biter.',                 'Ankara',   'Çankaya',     current_date + 1,  '18:30', 6,  'ileri'),
  ('44444444-4444-4444-4444-444444444403', '11111111-1111-1111-1111-111111111106', 'Tenis',     'Kafa Kafaya Tek Maç',         'Toprak kort, top benden.',                 'İzmir',    'Bornova',     current_date + 2,  '19:00', 2,  'orta'),
  ('44444444-4444-4444-4444-444444444404', '11111111-1111-1111-1111-111111111105', 'Voleybol',  '6v6 Karma Voleybol',          'Kapalı salon, seviye fark etmez.',         'Bursa',    'Nilüfer',     current_date + 2,  '20:00', 12, 'baslangic'),
  ('44444444-4444-4444-4444-444444444405', '11111111-1111-1111-1111-111111111108', 'Futbol',    'Cuma Akşamı Halı Saha',       '7v7, forma iki renk getirin.',             'İstanbul', 'Ümraniye',    current_date + 3,  '22:00', 12, 'orta'),
  ('44444444-4444-4444-4444-444444444406', '11111111-1111-1111-1111-111111111103', 'Tenis',     'Çiftler Tenis Maçı',          '2v2 çiftler, orta seviye ve üzeri.',       'İstanbul', 'Beşiktaş',    current_date + 3,  '10:00', 4,  'ileri'),
  ('44444444-4444-4444-4444-444444444407', '11111111-1111-1111-1111-111111111107', 'Basketbol', 'Pazar Sabahı Basket',         'Tam saha 5v5, ısınma 09:30''da.',          'İzmir',    'Karşıyaka',   current_date + 4,  '10:00', 10, 'baslangic'),
  ('44444444-4444-4444-4444-444444444408', '11111111-1111-1111-1111-111111111104', 'Futbol',    'Kaleciler Kapışması',         'Penaltı ve refleks turnuvası, eğlencelik.', 'Ankara',  'Keçiören',    current_date + 4,  '17:00', 8,  'baslangic'),
  ('44444444-4444-4444-4444-444444444409', '11111111-1111-1111-1111-111111111101', 'Futbol',    'Moda Sahil 6v6',              'Sahil kenarı, top bizden.',                'İstanbul', 'Kadıköy',     current_date + 5,  '19:30', 12, 'baslangic'),
  ('44444444-4444-4444-4444-444444444410', '11111111-1111-1111-1111-111111111102', 'Basketbol', 'Gece Ligi 4v4',               'Aydınlatmalı saha, 45 dk.',                'Ankara',   'Yenimahalle', current_date + 5,  '21:00', 8,  'orta'),
  ('44444444-4444-4444-4444-444444444411', '11111111-1111-1111-1111-111111111106', 'Tenis',     'Sabah Kort Antrenmanı',       'Isınma + 2 set. Raket varsa getir.',       'İzmir',    'Karşıyaka',   current_date + 6,  '08:30', 2,  'baslangic'),
  ('44444444-4444-4444-4444-444444444412', '11111111-1111-1111-1111-111111111105', 'Voleybol',  'Plaj Voleybolu 2v2',          'Kum saha, güneş kremi şart.',              'Antalya',  'Muratpaşa',   current_date + 6,  '16:00', 4,  'orta'),
  ('44444444-4444-4444-4444-444444444413', '11111111-1111-1111-1111-111111111108', 'Futbol',    'Ofis Ekibi vs Herkes',        'Ofis turnuvası ısınması.',                 'İstanbul', 'Ataşehir',    current_date + 7,  '20:00', 10, 'baslangic'),
  ('44444444-4444-4444-4444-444444444414', '11111111-1111-1111-1111-111111111103', 'Tenis',     'Tekler Challenge',            'Kaybeden smoothie ısmarlar.',              'Bursa',    'Osmangazi',   current_date + 7,  '18:00', 2,  'ileri'),
  ('44444444-4444-4444-4444-444444444415', '11111111-1111-1111-1111-111111111107', 'Basketbol', 'Üni Kampüs 5v5',              'Kampüs sahası, herkese açık.',             'İzmir',    'Bornova',     current_date + 8,  '17:30', 10, 'orta'),
  ('44444444-4444-4444-4444-444444444416', '11111111-1111-1111-1111-111111111104', 'Futbol',    'Gençler Halı Saha',           '16-25 yaş, 5v5 hızlı tempo.',              'Ankara',   'Çankaya',     current_date + 8,  '21:30', 10, 'orta'),
  ('44444444-4444-4444-4444-444444444417', '11111111-1111-1111-1111-111111111101', 'Voleybol',  'Kadın Voleybol Antrenmanı',   'Blok ve smaç çalışması.',                  'İstanbul', 'Beşiktaş',    current_date + 9,  '19:00', 12, 'orta'),
  ('44444444-4444-4444-4444-444444444418', '11111111-1111-1111-1111-111111111102', 'Basketbol', 'Şut Atölyesi Mini Maç',       'Önce şut, sonra 3v3.',                     'İstanbul', 'Şişli',       current_date + 10, '18:00', 6,  'baslangic'),
  ('44444444-4444-4444-4444-444444444419', '11111111-1111-1111-1111-111111111106', 'Tenis',     'Akşam Çift Kort',             'Işıklar açık, 2v2.',                       'Ankara',   'Çankaya',     current_date + 11, '20:30', 4,  'orta'),
  ('44444444-4444-4444-4444-444444444420', '11111111-1111-1111-1111-111111111105', 'Futbol',    'Pazar Brunch Maçı',           'Maç sonrası kahvaltı planı var.',          'İzmir',    'Konak',       current_date + 12, '11:00', 12, 'baslangic')
on conflict (id) do update set
  match_date = excluded.match_date,
  start_time = excluded.start_time,
  title = excluded.title,
  description = excluded.description,
  city = excluded.city,
  district = excluded.district,
  max_players = excluded.max_players,
  level = excluded.level;

-- Katılımcıları sıfırdan yaz (ON CONFLICT tetikleyiciyi atlayamaz → kontenjan hatası)
alter table public.duel_participants disable trigger duel_capacity_check;

delete from public.duel_participants
where duel_id::text like '44444444-%';

insert into public.duel_participants (duel_id, user_id)
select d.id, d.creator_id
from public.duels d
where d.id::text like '44444444-%';

insert into public.duel_participants (duel_id, user_id)
select duel_id, user_id
from (
  select d.id as duel_id,
         pr.id as user_id,
         d.max_players,
         row_number() over (partition by d.id order by md5(d.id::text || pr.id::text)) as rn
  from public.duels d
  cross join public.profiles pr
  where d.id::text like '44444444-%'
    and pr.id::text like '11111111-%'
    and pr.id <> d.creator_id
    and (('x' || substr(md5(d.id::text || pr.id::text), 1, 2))::bit(8)::int % 3) = 0
) t
where t.rn <= greatest(t.max_players - 1, 0);

alter table public.duel_participants enable trigger duel_capacity_check;
