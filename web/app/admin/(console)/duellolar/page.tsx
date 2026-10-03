import Link from "next/link";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { Pager } from "@/components/admin/pager";
import { SearchBar } from "@/components/admin/search-bar";
import { pageFromSearch, rangeForPage, requireAdmin } from "@/lib/admin";
import { deleteDuel } from "@/lib/admin-actions";

export const metadata = { title: "Düellolar" };

export default async function DuelsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { supabase } = await requireAdmin();
  const { q = "", page: pageRaw } = await searchParams;
  const page = pageFromSearch(pageRaw);
  const { from, to } = rangeForPage(page);
  let query = supabase
    .from("duels")
    .select("id, title, sport, city, district, match_date, start_time, max_players, creator_id, profiles(username)", { count: "exact" })
    .order("match_date", { ascending: false })
    .range(from, to);
  if (q.trim()) query = query.ilike("title", `%${q.trim()}%`);
  const { data, count } = await query;

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-ink">Düellolar</h1>
      <div className="mt-4">
        <SearchBar placeholder="Düello başlığı" defaultValue={q} />
      </div>
      <div className="mt-5 overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-line bg-surface text-xs uppercase text-ink-3">
            <tr>
              <th className="px-4 py-3">Maç</th>
              <th className="px-4 py-3">Kurucu</th>
              <th className="px-4 py-3">Tarih</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {(data ?? []).map((d) => {
              const creator = Array.isArray(d.profiles) ? d.profiles[0] : d.profiles;
              return (
                <tr key={d.id}>
                  <td className="px-4 py-3">
                    <div className="font-semibold">{d.title}</div>
                    <div className="text-xs text-ink-3">
                      {d.sport} · {d.district}, {d.city} · {d.max_players} kişi
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/kullanicilar/${d.creator_id}`} className="text-brand-dark hover:underline">
                      @{creator?.username ?? "?"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink-2">
                    {d.match_date} {d.start_time}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ConfirmButton
                      action={deleteDuel}
                      hidden={{ id: d.id }}
                      confirm="Düelloyu sil?"
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
      <Pager href={q ? `/admin/duellolar?q=${encodeURIComponent(q)}` : "/admin/duellolar"} page={page} count={count} />
    </div>
  );
}
