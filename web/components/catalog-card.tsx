import Image from "next/image";
import Link from "next/link";
import { formatPrice, hrefFor, type CatalogItem } from "@/lib/catalog";

export function CatalogCard({ item }: { item: CatalogItem }) {
  return (
    <Link
      href={hrefFor(item)}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-ink/5"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-surface">
        <Image
          src={item.image}
          alt={item.title}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition duration-300 group-hover:scale-[1.03]"
        />
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-ink">
          {item.sport}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-base font-bold text-ink">{item.title}</h3>
        <p className="mt-1 text-sm text-ink-2">
          {item.city} / {item.district} · {item.duration}
        </p>
        <p className="mt-3 line-clamp-2 flex-1 text-sm leading-6 text-ink-2">{item.description}</p>
        <div className="mt-4 text-lg font-extrabold text-brand-dark">{formatPrice(item)}</div>
      </div>
    </Link>
  );
}
