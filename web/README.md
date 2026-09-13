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

## Şirket ve yasal metinler

İletişim bilgileri `lib/site.ts` içinde: Emrah İpek, adres, telefon, `destek@sportifly.app`.

Yasal metinler `content/legal/*.md` dosyalarından okunur.

Ayrıca:

- `public/payment/` içindeki logolar yer tutucudur; iyzico resmi logo paketiyle değiştirilebilir.
- `public/screens/*.jpg` uygulama ekran görüntüleridir.

## Vercel'e deploy

Repo kökü Expo projesi olduğu için Vercel'de **Root Directory = `web`** seç.
Alan adını bağladıktan sonra `lib/site.ts` içindeki `url` alanını güncelle
(sitemap/robots/OG meta bu değeri kullanır).
