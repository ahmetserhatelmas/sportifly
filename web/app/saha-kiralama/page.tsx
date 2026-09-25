import type { Metadata } from "next";
import Link from "next/link";
import { CatalogCard } from "@/components/catalog-card";
import { fields } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Saha kiralama",
  description:
    "Halı saha, basketbol salonu, tenis kortu ve voleybol sahası kirala. Saatlik fiyatlar sitede açıkça yazılır; ödeme iyzico ile alınır.",
};

export default function FieldsPage() {
  return (
    <article className="bg-white">
      <div className="border-b border-line bg-surface">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-dark">Hizmetler</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink md:text-4xl">
            Saha kiralama
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-7 text-ink-2">
            Futbol, basketbol, tenis ve voleybol sahalarını saatlik kirala. Fiyatlar Türk Lirası ve KDV
            dahildir. Rezervasyon uygulamadan veya{" "}
            <Link href="/iletisim" className="font-semibold text-brand-dark underline">
              destek
            </Link>{" "}
            üzerinden alınır; ödeme iyzico ile yapılır.
          </p>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {fields.map((item) => (
            <CatalogCard key={item.slug} item={item} />
          ))}
        </div>
        <p className="mt-10 text-sm text-ink-2">
          Özel ders arıyorsan{" "}
          <Link href="/ozel-ders" className="font-semibold text-brand-dark underline">
            eğitmen dersleri
          </Link>{" "}
          sayfasına bak.
        </p>
      </div>
    </article>
  );
}
