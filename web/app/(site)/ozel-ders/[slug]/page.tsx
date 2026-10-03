import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PaymentLogos } from "@/components/payment-logos";
import { formatPrice, getCatalogItem, lessons } from "@/lib/catalog";
import { site } from "@/lib/site";

export function generateStaticParams() {
  return lessons.map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = getCatalogItem(slug);
  if (!item || item.kind !== "lesson") return {};
  return {
    title: item.title,
    description: `${item.title} — ${item.city} / ${item.district}. ${formatPrice(item)}. ${item.description}`,
  };
}

export default async function LessonDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = getCatalogItem(slug);
  if (!item || item.kind !== "lesson") notFound();

  return (
    <article className="bg-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <Link href="/ozel-ders" className="text-sm font-semibold text-brand-dark">
            ← Tüm dersler
          </Link>
          <div className="relative mt-4 aspect-[16/10] overflow-hidden rounded-3xl bg-surface">
            <Image src={item.image} alt={item.title} fill sizes="(min-width: 1024px) 60vw, 100vw" className="object-cover" priority />
          </div>
        </div>
        <div className="lg:pt-8">
          <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand-dark">
            {item.sport} · Özel ders
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ink">{item.title}</h1>
          <p className="mt-2 text-ink-2">
            {item.city} / {item.district} · {item.duration}
          </p>
          <div className="mt-5 text-3xl font-extrabold text-brand-dark">{formatPrice(item)}</div>
          <p className="mt-1 text-sm text-ink-3">KDV dahil. Ders başı ücret.</p>
          <p className="mt-6 leading-7 text-ink-2">{item.description}</p>
          <ul className="mt-6 space-y-2 text-sm text-ink">
            {item.includes.map((x) => (
              <li key={x}>✓ {x}</li>
            ))}
          </ul>
          <a
            href={`mailto:${site.supportEmail}?subject=${encodeURIComponent(item.title + " ders talebi")}`}
            className="mt-8 inline-flex rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Ders talebi gönder
          </a>
          <p className="mt-3 text-xs text-ink-3">
            Uygulama yayına alındığında ders satın alma uygulama içinden de yapılabilecek. Ödeme iyzico ile alınır.
          </p>
          <div className="mt-6">
            <PaymentLogos />
          </div>
          <p className="mt-4 text-sm text-ink-2">
            İptal için{" "}
            <Link href="/teslimat-ve-iade" className="underline">
              Teslimat ve İade Şartları
            </Link>
            .
          </p>
        </div>
      </div>
    </article>
  );
}
