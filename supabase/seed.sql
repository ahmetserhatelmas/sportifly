-- =====================================================================
-- SPORTIFLY - Sahte test verisi (seed)
-- schema.sql çalıştırıldıktan SONRA Supabase SQL Editor'de çalıştırın.
-- Tekrar çalıştırılabilir (on conflict do nothing).
--
-- Oluşturulan sahte hesapların tümünün şifresi: sportifly123
-- (ör: ahmet_y@test.com / sportifly123 ile giriş yapabilirsiniz)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. SAHTE KULLANICILAR (auth.users -> trigger profilleri oluşturur)
-- ---------------------------------------------------------------------
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new
)
values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111101', 'authenticated', 'authenticated', 'ahmet_y@test.com',     extensions.crypt('sportifly123', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"username":"ahmet_y","full_name":"Ahmet Yılmaz"}',      now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111102', 'authenticated', 'authenticated', 'basket_can@test.com',  extensions.crypt('sportifly123', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"username":"basket_can","full_name":"Can Demir"}',       now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111103', 'authenticated', 'authenticated', 'elif_smash@test.com',  extensions.crypt('sportifly123', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"username":"elif_smash","full_name":"Elif Kaya"}',       now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111104', 'authenticated', 'authenticated', 'mert_gk@test.com',     extensions.crypt('sportifly123', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"username":"mert_gk","full_name":"Mert Aksoy"}',         now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111105', 'authenticated', 'authenticated', 'zeynep_v@test.com',    extensions.crypt('sportifly123', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"username":"zeynep_v","full_name":"Zeynep Vural"}',      now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111106', 'authenticated', 'authenticated', 'kaan_tennis@test.com', extensions.crypt('sportifly123', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"username":"kaan_tennis","full_name":"Kaan Öztürk"}',    now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111107', 'authenticated', 'authenticated', 'selin_run@test.com',   extensions.crypt('sportifly123', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"username":"selin_run","full_name":"Selin Arslan"}',     now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111108', 'authenticated', 'authenticated', 'burak_10@test.com',    extensions.crypt('sportifly123', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"username":"burak_10","full_name":"Burak Şahin"}',       now(), now(), '', '', '', '')
on conflict (id) do nothing;

-- E-posta/şifre girişi için identity kayıtları
insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id, u.id::text,
       jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
       'email', now(), now(), now()
from auth.users u
where u.id::text like '11111111-1111-1111-1111-1111111111%'
  and not exists (select 1 from auth.identities i where i.user_id = u.id);

-- Profil detayları (avatar / banner / bio)
update public.profiles set
  avatar_url = 'https://i.pravatar.cc/300?img=' || (12 + (('x' || substr(id::text, 36, 1))::bit(4)::int)),
  banner_url = (array[
    'https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=900&h=300&q=70',
    'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=900&h=300&q=70',
    'https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=900&h=300&q=70',
    'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=900&h=300&q=70'
  ])[1 + (('x' || substr(id::text, 36, 1))::bit(4)::int % 4)],
  bio = 'Sportifly test kullanıcısı'
where id::text like '11111111-1111-1111-1111-1111111111%';

-- Demo ilan sahiplerine rol yetkisi
update public.profiles set is_field_owner = true
where id in (
  '11111111-1111-1111-1111-111111111101',
  '11111111-1111-1111-1111-111111111102',
  '11111111-1111-1111-1111-111111111105',
  '11111111-1111-1111-1111-111111111106'
);
update public.profiles set is_instructor = true
where id in (
  '11111111-1111-1111-1111-111111111102',
  '11111111-1111-1111-1111-111111111104',
  '11111111-1111-1111-1111-111111111105',
  '11111111-1111-1111-1111-111111111106'
);

-- ---------------------------------------------------------------------
-- 2. TAKİPLER
--    - Sahte kullanıcılar birbirini takip eder
--    - Gerçek kullanıcı(lar) sahteleri, sahteler gerçekleri takip eder (DM testi için)
-- ---------------------------------------------------------------------
insert into public.follows (follower_id, following_id)
select a.id, b.id
from public.profiles a
cross join public.profiles b
where a.id <> b.id
  and (a.id::text like '11111111-%' or b.id::text like '11111111-%')
on conflict do nothing;

-- ---------------------------------------------------------------------
-- 3. GÖNDERİLER (Ana Sayfa akışı)
-- ---------------------------------------------------------------------
insert into public.posts (id, user_id, image_url, caption, created_at) values
  ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111101', 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=800&h=800&q=70',  'Sabah antrenmanı tamam! Bugün 10 km koştuk.', now() - interval '2 hours'),
  ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111102', 'https://images.unsplash.com/photo-1519861531473-9200262188bf?auto=format&fit=crop&w=800&h=800&q=70',  '3v3 sokak basketbolu, kaybeden tatlı ısmarlıyor.', now() - interval '5 hours'),
  ('22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111103', 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=800&h=800&q=70',  'Backhand çalışması. Hoca "bileği kır" demekten yoruldu.', now() - interval '9 hours'),
  ('22222222-2222-2222-2222-222222222204', '11111111-1111-1111-1111-111111111104', 'https://images.unsplash.com/photo-1553778263-73a83bab9b0c?auto=format&fit=crop&w=800&h=800&q=70',  'Kalede geçen bir sezon daha. Temiz çarşaf, 3 maçtır gol yok!', now() - interval '1 day'),
  ('22222222-2222-2222-2222-222222222205', '11111111-1111-1111-1111-111111111105', 'https://images.unsplash.com/photo-1592656094267-764a45160876?auto=format&fit=crop&w=800&h=800&q=70',  'Voleybol turnuvası hazırlıkları başladı.', now() - interval '1 day 4 hours'),
  ('22222222-2222-2222-2222-222222222206', '11111111-1111-1111-1111-111111111106', 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=800&h=800&q=70',  'Kort keyfi. Akşam maçına rakip arıyorum, DM atın!', now() - interval '2 days'),
  ('22222222-2222-2222-2222-222222222207', '11111111-1111-1111-1111-111111111107', 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&h=800&q=70',  'Gün doğumunda sahil koşusu. Bundan iyisi yok.', now() - interval '3 days'),
  ('22222222-2222-2222-2222-222222222208', '11111111-1111-1111-1111-111111111108', 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=800&h=800&q=70',  'Halı saha klasiği: son dakika golüyle 5-4.', now() - interval '4 days')
on conflict (id) do update set image_url = excluded.image_url;

-- Beğeniler (her gönderiye rastgele 3-6 sahte kullanıcı)
insert into public.post_likes (post_id, user_id)
select p.id, pr.id
from public.posts p
cross join public.profiles pr
where pr.id::text like '11111111-%'
  and pr.id <> p.user_id
  and (('x' || substr(md5(p.id::text || pr.id::text), 1, 2))::bit(8)::int % 3) < 2
on conflict do nothing;

-- Yorumlar (tekrar çalıştırmada çoğalmaz)
insert into public.post_comments (post_id, user_id, content)
select v.post_id::uuid, v.user_id::uuid, v.content
from (values
  ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111102', 'Helal olsun, tempo nasıldı?'),
  ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111107', 'Yarın ben de geliyorum!'),
  ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111108', 'Tatlıyı kim ısmarladı? :)'),
  ('22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111106', 'Backhand çok gelişmiş, tebrikler.'),
  ('22222222-2222-2222-2222-222222222204', '11111111-1111-1111-1111-111111111101', 'Kalecilerin de günü gelecek dostum.'),
  ('22222222-2222-2222-2222-222222222206', '11111111-1111-1111-1111-111111111103', 'Cumartesi müsaitim, DM attım.'),
  ('22222222-2222-2222-2222-222222222208', '11111111-1111-1111-1111-111111111104', 'O son golü ben yedim, hatırlatma...')
) as v(post_id, user_id, content)
where not exists (
  select 1 from public.post_comments c
  where c.post_id = v.post_id::uuid and c.user_id = v.user_id::uuid and c.content = v.content
);

-- ---------------------------------------------------------------------
-- 4. MAĞAZA İLANLARI (Sahalar + Dersler)
-- ---------------------------------------------------------------------
insert into public.listings (id, owner_id, type, title, description, sport, city, district, price, commission_accepted, image_url) values
  ('33333333-3333-3333-3333-333333333301', '11111111-1111-1111-1111-111111111101', 'field',  'Yıldız Halı Saha',            'Kapalı halı saha, duş ve soyunma odası mevcut. Gece ışıklandırması vardır.', 'Futbol',    'İstanbul', 'Kadıköy',   950,  true, 'https://images.unsplash.com/photo-1459865264687-595d652de67e?auto=format&fit=crop&w=800&h=600&q=70'),
  ('33333333-3333-3333-3333-333333333302', '11111111-1111-1111-1111-111111111102', 'field',  'Çankaya Basketbol Sahası',    'Açık saha, akşam saatleri için rezervasyon önerilir. Top kiralama ücretsiz.', 'Basketbol', 'Ankara',   'Çankaya',   400,  true, 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&w=800&h=600&q=70'),
  ('33333333-3333-3333-3333-333333333303', '11111111-1111-1111-1111-111111111106', 'field',  'Bornova Tenis Kortu',         'Toprak kort, 2 saatlik rezervasyonlarda %10 indirim.', 'Tenis',     'İzmir',    'Bornova',   600,  true, 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=800&h=600&q=70'),
  ('33333333-3333-3333-3333-333333333304', '11111111-1111-1111-1111-111111111105', 'field',  'Nilüfer Voleybol Salonu',     'Profesyonel zemin, tribünlü kapalı salon. Grup rezervasyonlarına uygundur.', 'Voleybol',  'Bursa',    'Nilüfer',   750,  true, 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=800&h=600&q=70'),
  ('33333333-3333-3333-3333-333333333305', '11111111-1111-1111-1111-111111111106', 'lesson', 'Bireysel Tenis Dersi',        '10 yıllık antrenörlük deneyimi. Başlangıç ve orta seviye için birebir ders.', 'Tenis',     'İstanbul', 'Beşiktaş',  1200, true, 'https://images.unsplash.com/photo-1542144582-1ba00456b5e3?auto=format&fit=crop&w=800&h=600&q=70'),
  ('33333333-3333-3333-3333-333333333306', '11111111-1111-1111-1111-111111111102', 'lesson', 'Basketbol Şut Gelişim Dersi', 'Şut mekaniği ve kondisyon odaklı grup dersi. 12-18 yaş ve yetişkin grupları.', 'Basketbol', 'Ankara',   'Keçiören',  500,  true, 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&h=600&q=70'),
  ('33333333-3333-3333-3333-333333333307', '11111111-1111-1111-1111-111111111104', 'lesson', 'Kaleci Antrenmanı',           'Eski profesyonel kaleciden birebir kaleci antrenmanı. Ekipman dahildir.', 'Futbol',    'İstanbul', 'Ümraniye',  800,  true, 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&h=600&q=70'),
  ('33333333-3333-3333-3333-333333333308', '11111111-1111-1111-1111-111111111105', 'lesson', 'Voleybol Temel Teknik Dersi', 'Manşet, parmak pas ve servis teknikleri. Kadın ve karma gruplar mevcut.', 'Voleybol',  'İzmir',    'Karşıyaka', 450,  true, 'https://images.unsplash.com/photo-1547347298-4074fc3086f0?auto=format&fit=crop&w=800&h=600&q=70')
on conflict (id) do update set image_url = excluded.image_url;

-- Değerlendirmeler
insert into public.listing_reviews (listing_id, user_id, rating, comment) values
  ('33333333-3333-3333-3333-333333333301', '11111111-1111-1111-1111-111111111108', 5, 'Zemin çok iyi, duşlar temizdi. Kesinlikle tekrar geliriz.'),
  ('33333333-3333-3333-3333-333333333301', '11111111-1111-1111-1111-111111111104', 4, 'Saha güzel ama otopark biraz sıkıntılı.'),
  ('33333333-3333-3333-3333-333333333302', '11111111-1111-1111-1111-111111111101', 5, 'Akşam ışıklandırması harika, pota yükseklikleri standart.'),
  ('33333333-3333-3333-3333-333333333303', '11111111-1111-1111-1111-111111111103', 4, 'Kort bakımlı, rezervasyon süreci çok kolaydı.'),
  ('33333333-3333-3333-3333-333333333305', '11111111-1111-1111-1111-111111111103', 5, 'Hoca çok ilgili, 4 derste servis atışım ciddi gelişti.'),
  ('33333333-3333-3333-3333-333333333305', '11111111-1111-1111-1111-111111111107', 5, 'Başlangıç seviyesi için mükemmel anlatım.'),
  ('33333333-3333-3333-3333-333333333306', '11111111-1111-1111-1111-111111111108', 4, 'Grup kalabalıktı ama içerik dolu dolu.'),
  ('33333333-3333-3333-3333-333333333307', '11111111-1111-1111-1111-111111111102', 5, 'Refleks çalışmaları çok faydalıydı, tavsiye ederim.')
on conflict do nothing;

-- ---------------------------------------------------------------------
-- 5. DÜELLOLAR (Arama ekranı) + katılımcılar
-- ---------------------------------------------------------------------
insert into public.duels (id, creator_id, sport, title, description, city, district, match_date, start_time, max_players, level) values
  ('44444444-4444-4444-4444-444444444401', '11111111-1111-1111-1111-111111111101', 'Futbol',    'Acıbadem 5v5 Dostluk Maçı',   'Kaleci dahil, 60 dk.',                     'İstanbul', 'Kadıköy',    current_date + 1,  '21:00', 10, 'orta'),
  ('44444444-4444-4444-4444-444444444402', '11111111-1111-1111-1111-111111111102', 'Basketbol', '3v3 Sokak Basketbolu',        'Yarı saha, 21''de biter.',                 'Ankara',   'Çankaya',    current_date + 1,  '18:30', 6,  'ileri'),
  ('44444444-4444-4444-4444-444444444403', '11111111-1111-1111-1111-111111111106', 'Tenis',     'Kafa Kafaya Tek Maç',         'Toprak kort, top benden.',                 'İzmir',    'Bornova',    current_date + 2,  '19:00', 2,  'orta'),
  ('44444444-4444-4444-4444-444444444404', '11111111-1111-1111-1111-111111111105', 'Voleybol',  '6v6 Karma Voleybol',          'Kapalı salon, seviye fark etmez.',         'Bursa',    'Nilüfer',    current_date + 2,  '20:00', 12, 'baslangic'),
  ('44444444-4444-4444-4444-444444444405', '11111111-1111-1111-1111-111111111108', 'Futbol',    'Cuma Akşamı Halı Saha',       '7v7, forma iki renk getirin.',             'İstanbul', 'Ümraniye',   current_date + 3,  '22:00', 12, 'orta'),
  ('44444444-4444-4444-4444-444444444406', '11111111-1111-1111-1111-111111111103', 'Tenis',     'Çiftler Tenis Maçı',          '2v2 çiftler, orta seviye ve üzeri.',       'İstanbul', 'Beşiktaş',   current_date + 3,  '10:00', 4,  'ileri'),
  ('44444444-4444-4444-4444-444444444407', '11111111-1111-1111-1111-111111111107', 'Basketbol', 'Pazar Sabahı Basket',         'Tam saha 5v5, ısınma 09:30''da.',          'İzmir',    'Karşıyaka',  current_date + 4,  '10:00', 10, 'baslangic'),
  ('44444444-4444-4444-4444-444444444408', '11111111-1111-1111-1111-111111111104', 'Futbol',    'Kaleciler Kapışması',         'Penaltı ve refleks turnuvası, eğlencelik.', 'Ankara',  'Keçiören',   current_date + 4,  '17:00', 8,  'baslangic'),
  ('44444444-4444-4444-4444-444444444409', '11111111-1111-1111-1111-111111111101', 'Futbol',    'Moda Sahil 6v6',              'Sahil kenarı, top bizden.',                'İstanbul', 'Kadıköy',    current_date + 5,  '19:30', 12, 'baslangic'),
  ('44444444-4444-4444-4444-444444444410', '11111111-1111-1111-1111-111111111102', 'Basketbol', 'Gece Ligı 4v4',               'Aydınlatmalı saha, 45 dk.',                'Ankara',   'Yenimahalle', current_date + 5, '21:00', 8,  'orta'),
  ('44444444-4444-4444-4444-444444444411', '11111111-1111-1111-1111-111111111106', 'Tenis',     'Sabah Kort Antrenmanı',       'Isınma + 2 set. Raket varsa getir.',       'İzmir',    'Karşıyaka',  current_date + 6,  '08:30', 2,  'baslangic'),
  ('44444444-4444-4444-4444-444444444412', '11111111-1111-1111-1111-111111111105', 'Voleybol',  'Plaj Voleybolu 2v2',          'Kum saha, güneş kremi şart.',              'Antalya',  'Muratpaşa',  current_date + 6,  '16:00', 4,  'orta'),
  ('44444444-4444-4444-4444-444444444413', '11111111-1111-1111-1111-111111111108', 'Futbol',    'Ofis Ekibi vs Herkes',        'Ofis turnuvası ısınması, herkes katılabilir.','İstanbul','Ataşehir', current_date + 7,  '20:00', 10, 'baslangic'),
  ('44444444-4444-4444-4444-444444444414', '11111111-1111-1111-1111-111111111103', 'Tenis',     'Tekler Challenge',            'Kaybeden smoothie ısmarlar.',              'Bursa',    'Osmangazi',  current_date + 7,  '18:00', 2,  'ileri'),
  ('44444444-4444-4444-4444-444444444415', '11111111-1111-1111-1111-111111111107', 'Basketbol', 'Üni Kampüs 5v5',              'Kampüs sahası, öğrenci / mezun serbest.',  'İzmir',    'Bornova',    current_date + 8,  '17:30', 10, 'orta'),
  ('44444444-4444-4444-4444-444444444416', '11111111-1111-1111-1111-111111111104', 'Futbol',    'Gençler Halı Saha',           '16-25 yaş, 5v5 hızlı tempo.',              'Ankara',   'Çankaya',    current_date + 8,  '21:30', 10, 'orta'),
  ('44444444-4444-4444-4444-444444444417', '11111111-1111-1111-1111-111111111101', 'Voleybol',  'Kadın Voleybol Antrenmanı',   'Blok ve smaç çalışması, her seviye.',      'İstanbul', 'Beşiktaş',   current_date + 9,  '19:00', 12, 'orta'),
  ('44444444-4444-4444-4444-444444444418', '11111111-1111-1111-1111-111111111102', 'Basketbol', 'Şut Atölyesi Mini Maç',       'Önce şut çalışması, sonra 3v3.',           'İstanbul', 'Şişli',      current_date + 10, '18:00', 6,  'baslangic'),
  ('44444444-4444-4444-4444-444444444419', '11111111-1111-1111-1111-111111111106', 'Tenis',     'Akşam Çift Kort',             'Işıklar açık, 2v2 arıyoruz.',              'Ankara',   'Çankaya',    current_date + 11, '20:30', 4,  'orta'),
  ('44444444-4444-4444-4444-444444444420', '11111111-1111-1111-1111-111111111105', 'Futbol',    'Pazar Brunch Maçı',           'Maç sonrası kahvaltı planı var.',          'İzmir',    'Konak',      current_date + 12, '11:00', 12, 'baslangic')
on conflict (id) do update set
  match_date = excluded.match_date,
  start_time = excluded.start_time,
  title = excluded.title,
  description = excluded.description,
  city = excluded.city,
  district = excluded.district,
  max_players = excluded.max_players,
  level = excluded.level;

-- Katılımcılar (kurucular + deterministik rastgele katılımcılar)
insert into public.duel_participants (duel_id, user_id)
select d.id, d.creator_id from public.duels d
on conflict do nothing;

-- Kurucu dışında en fazla (max_players - 1) katılımcı eklenir; kontenjan asla aşılmaz.
insert into public.duel_participants (duel_id, user_id)
select duel_id, user_id
from (
  select d.id as duel_id,
         pr.id as user_id,
         d.max_players,
         row_number() over (partition by d.id order by md5(d.id::text || pr.id::text)) as rn
  from public.duels d
  cross join public.profiles pr
  where pr.id::text like '11111111-%'
    and pr.id <> d.creator_id
    and (('x' || substr(md5(d.id::text || pr.id::text), 1, 2))::bit(8)::int % 4) < 2
) t
where t.rn <= t.max_players - 1
on conflict do nothing;

-- Düello sohbetlerine örnek mesajlar (tekrar çalıştırmada çoğalmaz)
insert into public.duel_messages (duel_id, user_id, content, created_at)
select d.id, d.creator_id, 'Selam! Saha ve saat başlıktaki gibi, gelirken suyunuzu almayı unutmayın.', now() - interval '3 hours'
from public.duels d
where not exists (
  select 1 from public.duel_messages m where m.duel_id = d.id and m.user_id = d.creator_id
);

-- ---------------------------------------------------------------------
-- 6. DİREKT MESAJLAR (sahte kullanıcılardan gerçek kullanıcılara)
-- ---------------------------------------------------------------------
insert into public.direct_messages (sender_id, receiver_id, content, created_at)
select '11111111-1111-1111-1111-111111111101', p.id, 'Selam! Kadıköy''deki 5v5 maçına var mısın?', now() - interval '1 hour'
from public.profiles p
where p.id::text not like '11111111-%'
  and not exists (
    select 1 from public.direct_messages m
    where m.sender_id = '11111111-1111-1111-1111-111111111101' and m.receiver_id = p.id
  );

insert into public.direct_messages (sender_id, receiver_id, content, created_at)
select '11111111-1111-1111-1111-111111111103', p.id, 'Merhaba, çiftler tenis için 4. kişiyi arıyoruz :)', now() - interval '30 minutes'
from public.profiles p
where p.id::text not like '11111111-%'
  and not exists (
    select 1 from public.direct_messages m
    where m.sender_id = '11111111-1111-1111-1111-111111111103' and m.receiver_id = p.id
  );
