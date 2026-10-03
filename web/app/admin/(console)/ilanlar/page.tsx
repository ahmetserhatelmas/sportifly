import { ConfirmButton } from "@/components/admin/confirm-button";
import { Pager } from "@/components/admin/pager";
import { SearchBar } from "@/components/admin/search-bar";
import { StatusPill } from "@/components/admin/status-pill";
import { formatMoney, pageFromSearch, rangeForPage, requireAdmin } from "@/lib/admin";
import { deleteListing } from "@/lib/admin-actions";
import Link from "next/link";

export const metadata = { title: "İlanlar" };

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; page?: string }>;
}) {
  const { supabase } = await requireAdmin();
  const { q = "", type = "", page: pageRaw } = await searchParams;
  const page = pageFromSearch(pageRaw);
  const { from, to } = rangeForPage(page);

  let query = supabase
    .from("listings")
    .select("id, title, type, sport, city, district, price, owner_id, created_at, profiles(username)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);
  if (type === "field" || type === "lesson") query = query.eq("type", type);
  if (q.trim()) query = query.ilike("title", `%${q.trim()}%`);
  const { data, count } = await query;

  const href = `/admin/ilanlar${type || q ? `?${new URLSearchParams({ ...(q ? { q } : {}), ...(type ? { type } : {}) }).toString()}` : ""}`;

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-ink">İlanlar</h1>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <SearchBar placeholder="İlan başlığı" defaultValue={q} />
        <Link href="/admin/ilanlar" className={`rounded-lg px-3 py-2 text-sm ${!type ? "bg-ink text-white" : "border border-line"}`}>
          Tümü
        </Link>
        <Link href="/admin/ilanlar?type=field" className={`rounded-lg px-3 py-2 text-sm ${type === "field" ? "bg-ink text-white" : "border border-line"}`}>
          Saha
        </Link>
        <Link href="/admin/ilanlar?type=lesson" className={`rounded-lg px-3 py-2 text-sm ${type === "lesson" ? "bg-ink text-white" : "border border-line"}`}>
          Ders
        </Link>
      </div>
      <div className="mt-5 overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-line bg-surface text-xs uppercase text-ink-3">
            <tr>
              <th className="px-4 py-3">İlan</th>
              <th className="px-4 py-3">Sahip</th>
              <th className="px-4 py-3">Yer</th>
              <th className="px-4 py-3">Fiyat</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {(data ?? []).map((l) => {
              const owner = Array.isArray(l.profiles) ? l.profiles[0] : l.profiles;
              return (
                <tr key={l.id}>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-ink">{l.title}</div>
                    <div className="mt-1 flex gap-1">
                      <StatusPill tone={l.type}>{l.type === "field" ? "Saha" : "Ders"}</StatusPill>
                      <span className="text-xs text-ink-3">{l.sport}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/kullanicilar/${l.owner_id}`} className="text-brand-dark hover:underline">
                      @{owner?.username ?? "?"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink-2">
                    {l.district}, {l.city}
                  </td>
                  <td className="px-4 py-3 font-semibold">{formatMoney(l.price)}</td>
                  <td className="px-4 py-3 text-right">
                    <ConfirmButton
                      action={deleteListing}
                      hidden={{ id: l.id }}
                      confirm="İlanı sil? Rezervasyonlar da silinir."
                      className="text-sm font-semibold text-rose-600"
                    >
                      Sil
                    </ConfirmButton>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pager href={href} page={page} count={count} />
    </div>
  );
}
