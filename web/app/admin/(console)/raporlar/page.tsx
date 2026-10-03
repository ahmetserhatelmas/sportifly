import Link from "next/link";
import { Pager } from "@/components/admin/pager";
import { formatDate, pageFromSearch, rangeForPage, requireAdmin } from "@/lib/admin";

export const metadata = { title: "Raporlar" };

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { supabase } = await requireAdmin();
  const page = pageFromSearch((await searchParams).page);
  const { from, to } = rangeForPage(page);
  const { data, count, error } = await supabase
    .from("reports")
    .select("id, reason, created_at, reporter_id, reported_id", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  const ids = [...new Set((data ?? []).flatMap((r) => [r.reporter_id, r.reported_id]))];
  const { data: people } = ids.length
    ? await supabase.from("profiles").select("id, username").in("id", ids)
    : { data: [] as { id: string; username: string }[] };
  const nameOf = (id: string) => people?.find((p) => p.id === id)?.username ?? "?";

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-ink">Raporlar</h1>
      {error ? (
        <p className="mt-4 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
          Raporlar için <code>31_admin_web.sql</code> çalıştırılmalı. {error.message}
        </p>
      ) : (
        <div className="mt-5 overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-line bg-surface text-xs uppercase text-ink-3">
              <tr>
                <th className="px-4 py-3">Bildiren</th>
                <th className="px-4 py-3">Şikayet edilen</th>
                <th className="px-4 py-3">Sebep</th>
                <th className="px-4 py-3">Tarih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {(data ?? []).map((r) => {
                return (
                  <tr key={r.id}>
                    <td className="px-4 py-3">
                      <Link href={`/admin/kullanicilar/${r.reporter_id}`} className="text-brand-dark hover:underline">
                        @{nameOf(r.reporter_id)}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/kullanicilar/${r.reported_id}`} className="font-semibold text-ink hover:underline">
                        @{nameOf(r.reported_id)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-ink-2">{r.reason || "—"}</td>
                    <td className="px-4 py-3 text-ink-3">{formatDate(r.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <Pager href="/admin/raporlar" page={page} count={count} />
    </div>
  );
}
