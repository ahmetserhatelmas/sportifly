import Link from "next/link";
import { formatDate, requireAdmin } from "@/lib/admin";

export const metadata = { title: "Destek" };

type Thread = {
  user_id: string;
  username: string;
  last: string;
  lastAt: string;
  count: number;
};

export default async function SupportListPage() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("support_messages")
    .select("user_id, content, created_at")
    .order("created_at", { ascending: false })
    .limit(400);

  const userIds = [...new Set((data ?? []).map((m) => m.user_id))];
  const { data: people } = userIds.length
    ? await supabase.from("profiles").select("id, username").in("id", userIds)
    : { data: [] as { id: string; username: string }[] };
  const nameOf = (id: string) => people?.find((p) => p.id === id)?.username ?? "kullanıcı";

  const map = new Map<string, Thread>();
  for (const m of data ?? []) {
    if (map.has(m.user_id)) {
      const t = map.get(m.user_id)!;
      t.count += 1;
      continue;
    }
    map.set(m.user_id, {
      user_id: m.user_id,
      username: nameOf(m.user_id),
      last: m.content,
      lastAt: m.created_at,
      count: 1,
    });
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-ink">Destek</h1>
      {error ? (
        <p className="mt-4 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
          Destek listesi için <code>31_admin_web.sql</code> çalıştırılmalı. {error.message}
        </p>
      ) : (
        <div className="mt-5 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
          {[...map.values()].length === 0 ? (
            <p className="p-8 text-sm text-ink-2">Henüz destek mesajı yok.</p>
          ) : (
            [...map.values()].map((t) => (
              <Link
                key={t.user_id}
                href={`/admin/destek/${t.user_id}`}
                className="flex items-start justify-between gap-4 px-5 py-4 hover:bg-surface"
              >
                <div>
                  <div className="font-semibold text-ink">@{t.username}</div>
                  <p className="mt-1 line-clamp-2 text-sm text-ink-2">{t.last}</p>
                </div>
                <div className="shrink-0 text-right text-xs text-ink-3">
                  <div>{formatDate(t.lastAt)}</div>
                  <div className="mt-1">{t.count} mesaj</div>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
