import Link from "next/link";
import { PAGE_SIZE } from "@/lib/admin";

export function Pager({
  href,
  page,
  count,
}: {
  href: string;
  page: number;
  count: number | null;
}) {
  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (pages <= 1) return null;

  const join = href.includes("?") ? "&" : "?";
  return (
    <div className="mt-4 flex items-center justify-between text-sm text-ink-2">
      <span>
        {total} kayıt · sayfa {page}/{pages}
      </span>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link href={`${href}${join}page=${page - 1}`} className="rounded-md border border-line px-3 py-1.5">
            Önceki
          </Link>
        ) : null}
        {page < pages ? (
          <Link href={`${href}${join}page=${page + 1}`} className="rounded-md border border-line px-3 py-1.5">
            Sonraki
          </Link>
        ) : null}
      </div>
    </div>
  );
}
