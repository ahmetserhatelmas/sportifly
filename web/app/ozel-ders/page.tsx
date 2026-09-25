import type { Metadata } from "next";
import Link from "next/link";
import { CatalogCard } from "@/components/catalog-card";
import { lessons } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Özel ders",
  description:
    "Basketbol, tenis, voleybol ve kaleci dersleri. Ders başı fiyatlar sitede yazılır; ödeme iyzico ile alınır.",
};

export default function LessonsPage() {
  return (
    <article className="bg-white">
      <div className="border-b border-line bg-surface">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-dark">Hizmetler</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink md:text-4xl">Özel ders</h1>
          <p className="mt-4 max-w-2xl text-lg leading-7 text-ink-2">
            Onaylı eğitmenlerden birebir veya küçük grup dersi al. Süre ve ücret ilanda yazılıdır. Ödeme
            iyzico güvenli ödeme ile alınır.
          </p>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {lessons.map((item) => (
            <CatalogCard key={item.slug} item={item} />
          ))}
        </div>
        <p className="mt-10 text-sm text-ink-2">
          Saha mı arıyorsun?{" "}
          <Link href="/saha-kiralama" className="font-semibold text-brand-dark underline">
            Saha kiralama
          </Link>{" "}
          ilanlarına bak.
        </p>
      </div>
    </article>
  );
}
