export type CatalogKind = "field" | "lesson";

export type CatalogItem = {
  slug: string;
  kind: CatalogKind;
  sport: string;
  title: string;
  city: string;
  district: string;
  price: number;
  unit: "saat" | "ders";
  duration: string;
  image: string;
  description: string;
  includes: string[];
};

export const catalog: CatalogItem[] = [
  {
    slug: "kadikoy-arena-hali-saha",
    kind: "field",
    sport: "Futbol",
    title: "Kadıköy Arena Halı Saha",
    city: "İstanbul",
    district: "Kadıköy",
    price: 1100,
    unit: "saat",
    duration: "60 dakika",
    image: "/catalog/kadikoy-arena.jpg",
    description:
      "Kapalı 7v7 halı saha. Duş, soyunma odası ve ücretsiz otopark vardır. Gece ışıklandırması ile 24:00’e kadar kiralanabilir.",
    includes: ["Kapalı saha", "Duş ve soyunma", "Otopark", "Işıklandırma"],
  },
  {
    slug: "moda-tenis-kortu-2",
    kind: "field",
    sport: "Tenis",
    title: "Moda Tenis Kulübü — Kort 2",
    city: "İstanbul",
    district: "Kadıköy",
    price: 650,
    unit: "saat",
    duration: "60 dakika",
    image: "/catalog/moda-tenis.jpg",
    description:
      "Işıklı toprak kort. Raket ve top kiralama mevcuttur. 2 saatlik rezervasyonda %10 indirim uygulanır.",
    includes: ["Toprak kort", "Raket / top kiralama", "Akşam ışığı"],
  },
  {
    slug: "kizilay-basket-park",
    kind: "field",
    sport: "Basketbol",
    title: "Kızılay Basket Park",
    city: "Ankara",
    district: "Çankaya",
    price: 450,
    unit: "saat",
    duration: "60 dakika",
    image: "/catalog/kizilay-basket.jpg",
    description:
      "Açık akrilik zemin, iki pota. Akşam ışıklandırması vardır. Top ücretsiz verilir.",
    includes: ["Akrilik zemin", "2 pota", "Top dahil", "Işıklandırma"],
  },
  {
    slug: "karsiyaka-plaj-voleybol",
    kind: "field",
    sport: "Voleybol",
    title: "Karşıyaka Plaj Voleybol Sahası",
    city: "İzmir",
    district: "Karşıyaka",
    price: 500,
    unit: "saat",
    duration: "60 dakika",
    image: "/catalog/karsiyaka-plaj.jpg",
    description:
      "Kum saha; file ve top dahildir. Gün batımı saatleri hızlı dolar, erken rezervasyon önerilir.",
    includes: ["Kum saha", "File ve top", "Deniz manzarası"],
  },
  {
    slug: "akatlar-basketbol-salonu",
    kind: "field",
    sport: "Basketbol",
    title: "Akatlar Basketbol Salonu",
    city: "İstanbul",
    district: "Beşiktaş",
    price: 900,
    unit: "saat",
    duration: "60 dakika",
    image: "/catalog/akatlar-salon.jpg",
    description:
      "Kapalı parke salon, tribünlü. Tam saha 5v5 için uygundur. Soyunma odası ve duş vardır.",
    includes: ["Parke salon", "Tribün", "Duş", "Tam saha"],
  },
  {
    slug: "atasehir-kapali-voleybol",
    kind: "field",
    sport: "Voleybol",
    title: "Ataşehir Kapalı Voleybol Salonu",
    city: "İstanbul",
    district: "Ataşehir",
    price: 800,
    unit: "saat",
    duration: "60 dakika",
    image: "/catalog/atasehir-voleybol.jpg",
    description:
      "Profesyonel taraflex zemin, iki saha. Grup ve kulüp rezervasyonlarına uygundur.",
    includes: ["Taraflex zemin", "2 saha", "Grup rezervasyonu"],
  },
  {
    slug: "basketbol-bireysel-sut-dersi",
    kind: "lesson",
    sport: "Basketbol",
    title: "Basketbol Bireysel Şut Dersi",
    city: "Ankara",
    district: "Çankaya",
    price: 600,
    unit: "ders",
    duration: "60 dakika",
    image: "/catalog/ders-basket.jpg",
    description:
      "Şut mekaniği, ayak işi ve bitiricilik. 60 dakikalık birebir ders. Yetişkin ve genç gruplar için ayrı saatler açılır.",
    includes: ["Birebir antrenör", "60 dk", "Top ve saha dahil"],
  },
  {
    slug: "plaj-voleybolu-baslangic-dersi",
    kind: "lesson",
    sport: "Voleybol",
    title: "Plaj Voleybolu Başlangıç Dersi",
    city: "İzmir",
    district: "Karşıyaka",
    price: 450,
    unit: "ders",
    duration: "60 dakika",
    image: "/catalog/ders-voleybol.jpg",
    description:
      "Manşet, parmak pas, servis ve kum sahada hareket. 2 kişilik gruplar halinde yapılır.",
    includes: ["2 kişilik grup", "Kum saha", "Temel teknikler"],
  },
  {
    slug: "bireysel-tenis-dersi",
    kind: "lesson",
    sport: "Tenis",
    title: "Bireysel Tenis Dersi",
    city: "İstanbul",
    district: "Kadıköy",
    price: 1200,
    unit: "ders",
    duration: "60 dakika",
    image: "/catalog/ders-tenis.jpg",
    description:
      "Başlangıç ve orta seviye için birebir tenis dersi. Servis, forehand ve backhand çalışması. Kort ve top dahildir.",
    includes: ["Birebir hoca", "Kort dahil", "Raket kiralama"],
  },
  {
    slug: "kaleci-antrenmani",
    kind: "lesson",
    sport: "Futbol",
    title: "Kaleci Antrenmanı",
    city: "İstanbul",
    district: "Ataşehir",
    price: 800,
    unit: "ders",
    duration: "60 dakika",
    image: "/catalog/ders-kaleci.jpg",
    description:
      "Refleks, pozisyon ve penaltı çalışması. Eldiven ve ekipman derse dahildir.",
    includes: ["Birebir çalışma", "Ekipman dahil", "Saha kullanımı"],
  },
];

export const fields = catalog.filter((i) => i.kind === "field");
export const lessons = catalog.filter((i) => i.kind === "lesson");

export function getCatalogItem(slug: string) {
  return catalog.find((i) => i.slug === slug);
}

export function formatPrice(item: CatalogItem) {
  return `${item.price.toLocaleString("tr-TR")} ₺ / ${item.unit}`;
}

export function hrefFor(item: CatalogItem) {
  return item.kind === "field" ? `/saha-kiralama/${item.slug}` : `/ozel-ders/${item.slug}`;
}
