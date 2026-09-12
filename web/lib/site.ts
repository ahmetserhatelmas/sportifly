/**
 * Site geneli sabitler. iyzico başvurusu için "[DOLDUR]" ile işaretli alanların
 * gerçek şirket bilgileriyle doldurulması gerekir; İletişim sayfası ve alt bilgi
 * bu dosyadan okur.
 */
export const site = {
  name: "Sportifly",
  tagline: "Rakibini bul ve sahaya çık.",
  description:
    "Sportifly; futbol, basketbol, voleybol ve tenis gibi branşlarda rakip bulmanı, saha kiralamanı ve eğitmenlerden ders almanı tek uygulamada toplayan spor topluluğu.",
  url: "https://sportifly.app", // [DOLDUR] yayın alan adı
  appStoreUrl: "https://apps.apple.com/app/id6798912961",
  playStoreUrl: "https://play.google.com/store/apps/details?id=com.x4se.sportifly",
  supportEmail: "destek@sportifly.app", // [DOLDUR]

  company: {
    legalName: "[DOLDUR] Ticaret Unvanı / Ad Soyad",
    tradeName: "Sportifly",
    mersis: "[DOLDUR] MERSİS No (tacir) ",
    taxId: "[DOLDUR] Vergi Kimlik No",
    taxOffice: "[DOLDUR] Vergi Dairesi",
    address: "[DOLDUR] Merkez adresi, İlçe / İl",
    kep: "[DOLDUR]@hs01.kep.tr",
    email: "info@sportifly.app", // [DOLDUR]
    phone: "+90 5XX XXX XX XX", // [DOLDUR]
    chamber: "[DOLDUR] Bağlı olunan meslek odası",
    chamberUrl: "https://www.tobb.org.tr/", // [DOLDUR] meslek kuralları bağlantısı
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
  { href: "/#ozellikler", label: "Özellikler" },
  { href: "/#nasil-calisir", label: "Nasıl çalışır" },
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
