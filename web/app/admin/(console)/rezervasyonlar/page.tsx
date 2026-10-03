import Link from "next/link";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { Pager } from "@/components/admin/pager";
import { StatusPill } from "@/components/admin/status-pill";
import { formatDate, pageFromSearch, rangeForPage, requireAdmin } from "@/lib/admin";
import { setPurchaseStatus } from "@/lib/admin-actions";

export const metadata = { title: "Rezervasyonlar" };

export default async function PurchasesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const { supabase } = await requireAdmin();
  const { status = "", page: pageRaw } = await searchParams;
  const page = pageFromSearch(pageRaw);
  const { from, to } = rangeForPage(page);

  let query = supabase
    .from("purchases")
    .select("id, status, slot_date, slot_time, created_at, user_id, listing_id, listings(title, type), profiles(username)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);
  if (["pending", "accepted", "rejected"].includes(status)) query = query.eq("status", status);
  const { data, count } = await query;

  const href = status ? `/admin/rezervasyonlar?status=${status}` : "/admin/rezervasyonlar";

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-ink">Rezervasyonlar</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        {[
          ["", "Tümü"],
          ["pending", "Bekleyen"],
          ["accepted", "Onaylı"],
          ["rejected", "Red"],
        ].map(([v, label]) => (
          <Link
            key={v || "all"}
            href={v ? `/admin/rezervasyonlar?status=${v}` : "/admin/rezervasyonlar"}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${status === v ? "bg-ink text-white" : "border border-line"}`}
          >
            {label}
          </Link>
        ))}
      </div>
      <div className="mt-5 overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b border-line bg-surface text-xs uppercase text-ink-3">
            <tr>
              <th className="px-4 py-3">İlan</th>
              <th className="px-4 py-3">Alıcı</th>
              <th className="px-4 py-3">Saat</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {(data ?? []).map((p) => {
              const listing = Array.isArray(p.listings) ? p.listings[0] : p.listings;
              const buyer = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
              return (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-medium text-ink">{listing?.title ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/kullanicilar/${p.user_id}`} className="text-brand-dark hover:underline">
                      @{buyer?.username ?? "?"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink-2">
                    {p.slot_date ?? "—"} {p.slot_time ?? ""}
                    <div className="text-xs text-ink-3">{formatDate(p.created_at)}</div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill tone={p.status}>{p.status}</StatusPill>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {p.status !== "accepted" ? (
                        <ConfirmButton
                          action={setPurchaseStatus}
                          hidden={{ id: p.id, status: "accepted" }}
                          confirm="Rezervasyonu onayla?"
                          className="text-xs font-semibold text-emerald-700"
                        >
                          Onayla
                        </ConfirmButton>
                      ) : null}
                      {p.status !== "rejected" ? (
                        <ConfirmButton
                          action={setPurchaseStatus}
                          hidden={{ id: p.id, status: "rejected" }}
                          confirm="Rezervasyonu reddet?"
                          className="text-xs font-semibold text-rose-600"
                        >
                          Reddet
                        </ConfirmButton>
                      ) : null}
                    </div>
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
