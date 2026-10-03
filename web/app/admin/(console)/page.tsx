import Link from "next/link";
import { formatDate, requireAdmin } from "@/lib/admin";

export const metadata = { title: "Özet" };

export default async function AdminHomePage() {
  const { supabase } = await requireAdmin();

  const [
    users,
    listings,
    purchases,
    pendingPurchases,
    duels,
    posts,
    pendingRoles,
    reports,
    support,
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("listings").select("id", { count: "exact", head: true }),
    supabase.from("purchases").select("id", { count: "exact", head: true }),
    supabase.from("purchases").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("duels").select("id", { count: "exact", head: true }),
    supabase.from("posts").select("id", { count: "exact", head: true }),
    supabase.from("role_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("reports").select("id", { count: "exact", head: true }),
    supabase.from("support_messages").select("id", { count: "exact", head: true }),
  ]);

  const cards = [
    { href: "/admin/kullanicilar", label: "Kullanıcı", value: users.count ?? 0 },
    { href: "/admin/ilanlar", label: "İlan", value: listings.count ?? 0 },
    { href: "/admin/rezervasyonlar", label: "Rezervasyon", value: purchases.count ?? 0 },
    { href: "/admin/rezervasyonlar?status=pending", label: "Bekleyen rezervasyon", value: pendingPurchases.count ?? 0 },
    { href: "/admin/duellolar", label: "Düello", value: duels.count ?? 0 },
    { href: "/admin/gonderiler", label: "Gönderi", value: posts.count ?? 0 },
    { href: "/admin/basvurular", label: "Bekleyen başvuru", value: pendingRoles.count ?? 0 },
    { href: "/admin/raporlar", label: "Rapor", value: reports.count ?? 0 },
    { href: "/admin/destek", label: "Destek mesajı", value: support.count ?? 0 },
  ];

  const { data: recentUsers } = await supabase
    .from("profiles")
    .select("id, username, full_name, created_at, is_admin, is_banned")
    .order("created_at", { ascending: false })
    .limit(8);

  const { data: recentPurchases } = await supabase
    .from("purchases")
    .select("id, status, created_at, listings(title), profiles(username)")
    .order("created_at", { ascending: false })
    .limit(8);

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-ink">Özet</h1>
      <p className="mt-1 text-sm text-ink-2">Canlı veritabanındaki sayılar.</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.href + c.label}
            href={c.href}
            className="rounded-2xl border border-line bg-white p-5 hover:border-brand"
          >
            <div className="text-sm text-ink-2">{c.label}</div>
            <div className="mt-1 text-3xl font-extrabold text-ink">{c.value}</div>
          </Link>
        ))}
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-line bg-white p-5">
          <h2 className="font-bold text-ink">Son kullanıcılar</h2>
          <ul className="mt-4 divide-y divide-line">
            {(recentUsers ?? []).map((u) => (
              <li key={u.id} className="flex items-center justify-between py-2.5 text-sm">
                <Link href={`/admin/kullanicilar/${u.id}`} className="font-medium text-ink hover:underline">
                  @{u.username}
                </Link>
                <span className="text-ink-3">{formatDate(u.created_at)}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border border-line bg-white p-5">
          <h2 className="font-bold text-ink">Son rezervasyonlar</h2>
          <ul className="mt-4 divide-y divide-line">
            {(recentPurchases ?? []).map((p) => {
              const listing = Array.isArray(p.listings) ? p.listings[0] : p.listings;
              const buyer = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
              return (
                <li key={p.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="text-ink">
                    @{buyer?.username ?? "?"} · {listing?.title ?? "ilan"}
                  </span>
                  <span className="text-ink-3">{p.status}</span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
