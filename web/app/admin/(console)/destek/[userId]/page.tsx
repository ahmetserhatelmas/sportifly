import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate, requireAdmin } from "@/lib/admin";
import { replySupport } from "@/lib/admin-actions";

export const metadata = { title: "Destek sohbeti" };

export default async function SupportThreadPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const { supabase } = await requireAdmin();
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, full_name")
    .eq("id", userId)
    .maybeSingle();
  if (!profile) notFound();

  const { data: messages } = await supabase
    .from("support_messages")
    .select("id, content, is_from_support, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/admin/destek" className="text-sm font-semibold text-brand-dark">
        ← Destek
      </Link>
      <h1 className="mt-3 text-2xl font-extrabold text-ink">@{profile.username}</h1>
      <p className="text-sm text-ink-2">{profile.full_name}</p>
      <Link href={`/admin/kullanicilar/${userId}`} className="mt-1 inline-block text-sm text-brand-dark underline">
        Profili aç
      </Link>

      <div className="mt-6 space-y-3 rounded-2xl border border-line bg-white p-5">
        {(messages ?? []).length === 0 ? (
          <p className="text-sm text-ink-3">Mesaj yok.</p>
        ) : (
          (messages ?? []).map((m) => (
            <div
              key={m.id}
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                m.is_from_support
                  ? "ml-auto bg-brand-soft text-ink"
                  : "bg-surface text-ink"
              }`}
            >
              <p>{m.content}</p>
              <p className="mt-1 text-[11px] text-ink-3">{formatDate(m.created_at)}</p>
            </div>
          ))
        )}
      </div>

      <form action={replySupport} className="mt-4 flex gap-2">
        <input type="hidden" name="user_id" value={userId} />
        <textarea
          name="content"
          required
          rows={2}
          placeholder="Destek yanıtı yaz…"
          className="flex-1 rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-brand"
        />
        <button
          type="submit"
          className="self-end rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white"
        >
          Gönder
        </button>
      </form>
    </div>
  );
}
