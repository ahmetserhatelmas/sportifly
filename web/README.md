# Sportifly tanıtım sitesi

Next.js 16 (App Router, Tailwind v4) ile yapılmış, tamamen statik tanıtım sitesi.
iyzico üye işyeri başvurusu için gereken sayfaları içerir.

## Çalıştırma

```bash
cd web
npm install
npm run dev      # http://localhost:3000
npm run build    # üretim derlemesi
```

## Yayına almadan önce doldurulacaklar

Tüm şirket bilgileri tek dosyada: `lib/site.ts`. `[DOLDUR]` ile işaretli alanlar:

- Ticaret unvanı / ad-soyad, MERSİS (tacir) veya VKN (esnaf), vergi dairesi
- Merkez adresi, KEP adresi, e-posta, telefon
- Bağlı olunan meslek odası ve kural bağlantısı
- `url` (yayın alan adı), destek e-postası, mağaza linkleri

Ayrıca:

- `public/payment/` içindeki `iyzico-ile-ode.svg`, `visa.svg`, `mastercard.svg`, `troy.svg`
  yer tutucudur; iyzico panelinden indirilen resmi logo paketiyle **aynı adlarla** değiştir.
- Yasal metinler (`app/gizlilik-politikasi`, `app/kullanim-kosullari`,
  `app/mesafeli-satis-sozlesmesi`, `app/teslimat-ve-iade`, `app/kvkk-aydinlatma-metni`)
  taslaktır; yayın öncesi hukuk danışmanı kontrolünden geçmeli.
- `public/screens/*.jpg` emülatörden alınan ekran görüntüleri; istersen gerçek cihaz
  görüntüleriyle (aynı isim, 9:19.5 dikey) değiştir.

## Vercel'e deploy

Repo kökü Expo projesi olduğu için Vercel'de **Root Directory = `web`** seç.
Alan adını bağladıktan sonra `lib/site.ts` içindeki `url` alanını güncelle
(sitemap/robots/OG meta bu değeri kullanır).
