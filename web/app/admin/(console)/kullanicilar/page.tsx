import Link from "next/link";
import { Pager } from "@/components/admin/pager";
import { SearchBar } from "@/components/admin/search-bar";
import { StatusPill } from "@/components/admin/status-pill";
import {
  formatDate,
  pageFromSearch,
  rangeForPage,
  requireAdmin,
  type AdminUser,
} from "@/lib/admin";

export const metadata = { title: "Kullanıcılar" };

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { supabase } = await requireAdmin();
  const { q = "", page: pageRaw } = await searchParams;
  const page = pageFromSearch(pageRaw);
  const { from, to } = rangeForPage(page);

  const { data, error } = await supabase.rpc("admin_user_directory");
  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-extrabold text-ink">Kullanıcılar</h1>
        <p className="mt-4 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
          Kullanıcı listesi için SQL migration <code>31_admin_web.sql</code> henüz
          çalıştırılmamış. Supabase SQL Editor’da bu dosyayı çalıştır.
          <br />
          <span className="mt-2 block text-rose-600">{error.message}</span>
        </p>
      </div>
    );
  }

  const query = q.trim().toLocaleLowerCase("tr");
  const all = ((data as AdminUser[]) ?? []).filter((u) => {
    if (!query) return true;
    return (
      u.username.toLocaleLowerCase("tr").includes(query) ||
      (u.full_name ?? "").toLocaleLowerCase("tr").includes(query) ||
      (u.email ?? "").toLocaleLowerCase("tr").includes(query)
    );
  });
  const rows = all.slice(from, to + 1);

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-ink">Kullanıcılar</h1>
      <p className="mt-1 text-sm text-ink-2">{all.length} hesap</p>
      <div className="mt-5">
        <SearchBar placeholder="Ad, kullanıcı adı veya e-posta" defaultValue={q} />
      </div>
      <div className="mt-5 overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-line bg-surface text-xs uppercase text-ink-3">
            <tr>
              <th className="px-4 py-3">Kullanıcı</th>
              <th className="px-4 py-3">E-posta</th>
              <th className="px-4 py-3">Roller</th>
              <th className="px-4 py-3">Kayıt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((u) => (
              <tr key={u.id} className="hover:bg-surface/60">
                <td className="px-4 py-3">
                  <Link href={`/admin/kullanicilar/${u.id}`} className="font-semibold text-ink hover:underline">
                    @{u.username}
                  </Link>
                  <div className="text-xs text-ink-3">{u.full_name}</div>
                </td>
                <td className="px-4 py-3 text-ink-2">{u.email ?? "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {u.is_admin ? <StatusPill tone="admin">Admin</StatusPill> : null}
                    {u.is_field_owner ? <StatusPill tone="owner">Saha</StatusPill> : null}
                    {u.is_instructor ? <StatusPill tone="instructor">Eğitmen</StatusPill> : null}
                    {u.is_banned ? <StatusPill tone="banned">Yasaklı</StatusPill> : null}
                  </div>
                </td>
                <td className="px-4 py-3 text-ink-3">{formatDate(u.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pager href={q ? `/admin/kullanicilar?q=${encodeURIComponent(q)}` : "/admin/kullanicilar"} page={page} count={all.length} />
    </div>
  );
}
