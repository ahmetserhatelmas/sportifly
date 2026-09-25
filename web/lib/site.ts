/**
 * Site geneli sabitler. İletişim sayfası, alt bilgi ve yasal metinler buradan okur.
 */
export const site = {
  name: "Sportifly",
  tagline: "Rakibini bul ve sahaya çık.",
  description:
    "Sportifly; futbol, basketbol, voleybol ve tenis gibi branşlarda rakip bulmanı, saha kiralamanı ve eğitmenlerden ders almanı tek uygulamada toplayan spor topluluğu.",
  url: "https://sportifly.app",
  appStoreUrl: "https://apps.apple.com/app/id6798912961",
  playStoreUrl: "https://play.google.com/store/apps/details?id=com.x4se.sportifly",
  supportEmail: "destek@sportifly.app",

  company: {
    legalName: "Emrah İpek",
    tradeName: "Sportifly",
    kind: "Şahıs işletmesi",
    address: "Kocaeli / Darıca, Fevzi Çakmak Mahallesi, Ayan Sokak No: 3",
    email: "destek@sportifly.app",
    phone: "+90 546 152 92 18",
  },

  /** İyzico'nun istediği "ürün ve fiyat bilgisi" bölümü için hizmet listesi. */
  services: [
    {
      name: "Üyelik, rakip bulma ve mesajlaşma",
      price: "Ücretsiz",
      note: "Profil, akış, düello (maç) ilanı ve sohbet için ücret alınmaz.",
    },
    {
      name: "Saha kiralama",
      price: "İlan bazında, saatlik ₺ fiyatı",
      note: "Fiyat saha sahibi tarafından belirlenir ve ilanda saat başı ₺ olarak gösterilir. Örnek aralık: 400 ₺ – 2.500 ₺ / saat.",
    },
    {
      name: "Özel ders (eğitmen)",
      price: "İlan bazında, ders başı ₺ fiyatı",
      note: "Fiyat eğitmen tarafından belirlenir ve ilanda ders başı ₺ olarak gösterilir. Örnek aralık: 300 ₺ – 1.500 ₺ / ders.",
    },
  ],
} as const;

export const nav = [
  { href: "/saha-kiralama", label: "Saha kiralama" },
  { href: "/ozel-ders", label: "Özel ders" },
  { href: "/#ucretler", label: "Ücretler" },
  { href: "/hakkimizda", label: "Hakkımızda" },
  { href: "/iletisim", label: "İletişim" },
] as const;

export const legalLinks = [
  { href: "/gizlilik-politikasi", label: "Gizlilik Politikası" },
  { href: "/kvkk-aydinlatma-metni", label: "KVKK Aydınlatma Metni" },
  { href: "/kullanim-kosullari", label: "Kullanım Koşulları" },
  { href: "/mesafeli-satis-sozlesmesi", label: "Mesafeli Satış Sözleşmesi" },
  { href: "/teslimat-ve-iade", label: "Teslimat ve İade Şartları" },
] as const;
