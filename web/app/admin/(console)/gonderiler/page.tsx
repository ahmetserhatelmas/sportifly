import Link from "next/link";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { Pager } from "@/components/admin/pager";
import { formatDate, pageFromSearch, rangeForPage, requireAdmin } from "@/lib/admin";
import { deletePost } from "@/lib/admin-actions";

export const metadata = { title: "Gönderiler" };

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { supabase } = await requireAdmin();
  const { page: pageRaw } = await searchParams;
  const page = pageFromSearch(pageRaw);
  const { from, to } = rangeForPage(page);
  const { data, count } = await supabase
    .from("posts")
    .select("id, caption, image_url, created_at, user_id, profiles(username)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-ink">Gönderiler</h1>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {(data ?? []).map((p) => {
          const author = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
          return (
            <article key={p.id} className="overflow-hidden rounded-2xl border border-line bg-white">
              {p.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.image_url} alt="" className="aspect-square w-full object-cover" />
              ) : null}
              <div className="p-4">
                <Link href={`/admin/kullanicilar/${p.user_id}`} className="text-sm font-semibold text-brand-dark">
                  @{author?.username ?? "?"}
                </Link>
                <p className="mt-1 text-sm text-ink-2">{p.caption || "—"}</p>
                <p className="mt-2 text-xs text-ink-3">{formatDate(p.created_at)}</p>
                <div className="mt-3">
                  <ConfirmButton
                    action={deletePost}
                    hidden={{ id: p.id }}
                    confirm="Gönderiyi sil?"
                    className="text-sm font-semibold text-rose-600"
                  >
                    Sil
                  </ConfirmButton>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      <Pager href="/admin/gonderiler" page={page} count={count} />
    </div>
  );
}
