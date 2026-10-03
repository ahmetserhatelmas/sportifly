import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { StatusPill } from "@/components/admin/status-pill";
import { formatDate, formatMoney, requireAdmin, type AdminUser } from "@/lib/admin";
import { setUserFlags } from "@/lib/admin-actions";

export const metadata = { title: "Kullanıcı" };

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const { data: directory, error } = await supabase.rpc("admin_user_directory");
  const user = ((directory as AdminUser[]) ?? []).find((u) => u.id === id);
  if (error || !user) {
    const { data: fallback } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
    if (!fallback) notFound();
  }
  const row =
    user ??
    ((await supabase.from("profiles").select("*").eq("id", id).single()).data as AdminUser);

  const [{ data: listings }, { data: purchases }, { data: posts }, { data: duels }] =
    await Promise.all([
      supabase.from("listings").select("id, title, type, price, city").eq("owner_id", id).order("created_at", { ascending: false }),
      supabase.from("purchases").select("id, status, created_at, listings(title)").eq("user_id", id).order("created_at", { ascending: false }).limit(20),
      supabase.from("posts").select("id, caption, created_at").eq("user_id", id).order("created_at", { ascending: false }).limit(10),
      supabase.from("duels").select("id, title, match_date").eq("creator_id", id).order("created_at", { ascending: false }).limit(10),
    ]);

  return (
    <div>
      <Link href="/admin/kullanicilar" className="text-sm font-semibold text-brand-dark">
        ← Kullanıcılar
      </Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">@{row.username}</h1>
          <p className="mt-1 text-sm text-ink-2">
            {row.full_name ?? "—"} · {row.email ?? "e-posta yok"}
          </p>
          <p className="mt-1 text-xs text-ink-3">Kayıt: {formatDate(row.created_at)}</p>
          <div className="mt-3 flex flex-wrap gap-1">
            {row.is_admin ? <StatusPill tone="admin">Admin</StatusPill> : null}
            {row.is_field_owner ? <StatusPill tone="owner">Saha sahibi</StatusPill> : null}
            {row.is_instructor ? <StatusPill tone="instructor">Eğitmen</StatusPill> : null}
            {row.is_banned ? <StatusPill tone="banned">Yasaklı</StatusPill> : null}
          </div>
          {row.bio ? <p className="mt-3 max-w-xl text-sm text-ink-2">{row.bio}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <ConfirmButton
            action={setUserFlags}
            confirm={row.is_field_owner ? "Saha sahibi yetkisini kaldır?" : "Saha sahibi yap?"}
            hidden={{ id, is_field_owner: row.is_field_owner ? "false" : "true" }}
            className="rounded-lg border border-line px-3 py-2 text-sm font-semibold"
          >
            {row.is_field_owner ? "Saha yetkisini al" : "Saha sahibi yap"}
          </ConfirmButton>
          <ConfirmButton
            action={setUserFlags}
            confirm={row.is_instructor ? "Eğitmen yetkisini kaldır?" : "Eğitmen yap?"}
            hidden={{ id, is_instructor: row.is_instructor ? "false" : "true" }}
            className="rounded-lg border border-line px-3 py-2 text-sm font-semibold"
          >
            {row.is_instructor ? "Eğitmen yetkisini al" : "Eğitmen yap"}
          </ConfirmButton>
          {!row.is_admin ? (
            <ConfirmButton
              action={setUserFlags}
              confirm={row.is_banned ? "Yasağı kaldır?" : "Bu kullanıcıyı yasakla? Uygulamaya giremez."}
              hidden={{ id, is_banned: row.is_banned ? "false" : "true" }}
              className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white"
            >
              {row.is_banned ? "Yasağı kaldır" : "Yasakla"}
            </ConfirmButton>
          ) : null}
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Block title="İlanları">
          {(listings ?? []).length === 0 ? <Empty /> : (listings ?? []).map((l) => (
            <li key={l.id} className="flex justify-between py-2 text-sm">
              <Link href="/admin/ilanlar" className="text-ink hover:underline">{l.title}</Link>
              <span className="text-ink-3">{formatMoney(l.price)}</span>
            </li>
          ))}
        </Block>
        <Block title="Rezervasyonları">
          {(purchases ?? []).length === 0 ? <Empty /> : (purchases ?? []).map((p) => {
            const listing = Array.isArray(p.listings) ? p.listings[0] : p.listings;
            return (
              <li key={p.id} className="flex justify-between py-2 text-sm">
                <span>{listing?.title ?? "ilan"}</span>
                <StatusPill tone={p.status}>{p.status}</StatusPill>
              </li>
            );
          })}
        </Block>
        <Block title="Gönderileri">
          {(posts ?? []).length === 0 ? <Empty /> : (posts ?? []).map((p) => (
            <li key={p.id} className="py-2 text-sm text-ink-2">{p.caption || "Gönderi"} · {formatDate(p.created_at)}</li>
          ))}
        </Block>
        <Block title="Düelloları">
          {(duels ?? []).length === 0 ? <Empty /> : (duels ?? []).map((d) => (
            <li key={d.id} className="py-2 text-sm text-ink-2">{d.title}</li>
          ))}
        </Block>
      </div>
      <p className="mt-6 text-sm">
        <Link href={`/admin/destek/${id}`} className="font-semibold text-brand-dark underline">
          Destek sohbetini aç
        </Link>
      </p>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-white p-5">
      <h2 className="font-bold text-ink">{title}</h2>
      <ul className="mt-3 divide-y divide-line">{children}</ul>
    </section>
  );
}

function Empty() {
  return <li className="py-3 text-sm text-ink-3">Kayıt yok</li>;
}
