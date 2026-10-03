import Link from "next/link";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { StatusPill } from "@/components/admin/status-pill";
import { formatDate, requireAdmin } from "@/lib/admin";
import { reviewRoleRequest } from "@/lib/admin-actions";

export const metadata = { title: "Rol başvuruları" };

const ROLE = { field_owner: "Saha sahibi", instructor: "Eğitmen" } as const;

export default async function RoleRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { supabase } = await requireAdmin();
  const { tab = "pending" } = await searchParams;
  let q = supabase
    .from("role_requests")
    .select("*, profiles(username, full_name)")
    .order("created_at", { ascending: false });
  if (tab !== "all") q = q.eq("status", "pending");
  const { data } = await q;

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-ink">Rol başvuruları</h1>
      <div className="mt-4 flex gap-2">
        <Link
          href="/admin/basvurular"
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${tab !== "all" ? "bg-ink text-white" : "border border-line"}`}
        >
          Bekleyen
        </Link>
        <Link
          href="/admin/basvurular?tab=all"
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${tab === "all" ? "bg-ink text-white" : "border border-line"}`}
        >
          Tümü
        </Link>
      </div>
      <div className="mt-5 space-y-4">
        {(data ?? []).length === 0 ? (
          <p className="rounded-2xl border border-line bg-white p-8 text-sm text-ink-2">
            Başvuru yok.
          </p>
        ) : (
          (data ?? []).map((r) => {
            const profile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
            return (
              <article key={r.id} className="rounded-2xl border border-line bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link href={`/admin/kullanicilar/${r.user_id}`} className="font-bold text-ink hover:underline">
                      @{profile?.username ?? "kullanıcı"}
                    </Link>
                    <div className="mt-1 flex gap-2">
                      <StatusPill tone={r.role === "field_owner" ? "owner" : "instructor"}>
                        {ROLE[r.role as keyof typeof ROLE] ?? r.role}
                      </StatusPill>
                      <StatusPill tone={r.status}>{r.status}</StatusPill>
                    </div>
                    <p className="mt-2 text-xs text-ink-3">{formatDate(r.created_at)}</p>
                  </div>
                  {r.status === "pending" ? (
                    <div className="flex gap-2">
                      <ConfirmButton
                        action={reviewRoleRequest}
                        confirm="Başvuruyu onayla?"
                        hidden={{ id: r.id, decision: "accepted" }}
                        className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white"
                      >
                        Onayla
                      </ConfirmButton>
                      <ConfirmButton
                        action={reviewRoleRequest}
                        hidden={{ id: r.id, decision: "rejected" }}
                        confirm="Başvuruyu reddet?"
                        className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white"
                      >
                        Reddet
                      </ConfirmButton>
                    </div>
                  ) : null}
                </div>
                {r.description || r.note ? (
                  <p className="mt-3 text-sm text-ink-2">{r.description || r.note}</p>
                ) : null}
                {r.attachment_url ? (
                  <a
                    href={r.attachment_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-sm font-semibold text-brand-dark underline"
                  >
                    {r.attachment_name || "Ek"}
                  </a>
                ) : null}
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
