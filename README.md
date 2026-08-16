# Sportifly

Rakibini bul ve sahaya çık. React Native (Expo) + Supabase ile geliştirilmiş spor buluşma uygulaması.

## Özellikler

- **Ana Sayfa (Akış):** Instagram tarzı gönderi akışı, beğeni ve yorum
- **Mağaza:** Saha kiralama ve ders ilanları (Sahalar / Dersler sekmeleri), 5 yıldızlı puanlama, komisyon onaylı ilan oluşturma
- **Arama / Keşfet:** İl-ilçe ve branş filtreli düello listesi, düello oluşturma (tarih, saat, max 12 oyuncu, seviye)
- **Düello Sohbeti:** Katılımcıların buluşma yeri ve saati netleştirmesi için gerçek zamanlı sohbet
- **Direkt Mesaj:** Takip edilen kişilerle mesajlaşma
- **Turnuvalar:** "Çok Yakında" ekranı (gelecek özellik)
- **Profil:** Banner + avatar, takipçi / maç / kazanılan sayaçları, fotoğraf galerisi, yandan açılır menü (Satın Alınanlar, Destek, Ayarlar, yasal metinler)
- **Auth:** Karşılama, kayıt ol, giriş yap (Supabase Auth)

## Kurulum

### 1. Supabase projesi

1. [supabase.com](https://supabase.com) üzerinden yeni bir proje oluşturun.
2. **SQL Editor**'ü açın ve `supabase/schema.sql` dosyasının tamamını çalıştırın.
   Bu; tabloları, RLS politikalarını, yeni kullanıcı trigger'ını, `media` storage bucket'ını ve realtime yayınlarını kurar.
3. (İsteğe bağlı) Ekranları test verisiyle doldurmak için `supabase/seed.sql` dosyasını da çalıştırın.
   8 sahte kullanıcı (şifreleri `sportifly123`), gönderiler, ilanlar, düellolar ve yorumlar oluşturur.
3. (Geliştirme kolaylığı için) **Authentication > Providers > Email** altından "Confirm email" seçeneğini kapatabilirsiniz.

### 2. Ortam değişkenleri

```bash
cp .env.example .env
```

`.env` dosyasına Supabase Dashboard > **Project Settings > API** bölümündeki URL ve anon key değerlerini girin.

### 3. Uygulamayı çalıştırma

```bash
npm install
npm start
```

Ardından Expo Go ile QR kodu okutun veya `i` (iOS simülatör) / `a` (Android emülatör) tuşlarına basın.

## Proje Yapısı

```
src/
  components/    # Button, Input, Select, Chip, DuelCard, ChatView, ...
  context/       # AuthContext (oturum + profil)
  data/          # İl / ilçe listesi
  lib/           # Supabase istemcisi, görsel yükleme yardımcısı
  navigation/    # RootNavigator (auth akışı + 5 sekmeli tab bar)
  screens/       # auth, home, store, search, tournaments, profile, messages
supabase/
  schema.sql     # Veritabanı şeması + RLS + storage + realtime
```

## Notlar

- Yasal metinler (`LegalScreen`) yer tutucudur; yayına almadan önce gerçek sözleşme metinleriyle değiştirin.
- Satın alma akışı şimdilik "talep oluşturma" olarak çalışır; ödeme entegrasyonu (iyzico, Stripe vb.) sonraki fazda eklenebilir.
- Turnuvalar sayfası bilinçli olarak pasif bırakılmıştır (backlog gereği).
