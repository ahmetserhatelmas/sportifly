import Link from "next/link";
import { signOutAdmin } from "@/lib/admin-actions";
import type { AdminProfile } from "@/lib/admin";

const links = [
  { href: "/admin", label: "Özet" },
  { href: "/admin/kullanicilar", label: "Kullanıcılar" },
  { href: "/admin/basvurular", label: "Rol başvuruları" },
  { href: "/admin/ilanlar", label: "İlanlar" },
  { href: "/admin/rezervasyonlar", label: "Rezervasyonlar" },
  { href: "/admin/duellolar", label: "Düellolar" },
  { href: "/admin/gonderiler", label: "Gönderiler" },
  { href: "/admin/raporlar", label: "Raporlar" },
  { href: "/admin/destek", label: "Destek" },
];

export function AdminShell({
  profile,
  pendingRoles,
  children,
}: {
  profile: AdminProfile;
  pendingRoles: number;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full bg-surface">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-white md:flex">
        <div className="border-b border-line px-5 py-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-ink-3">
            Sportifly
          </div>
          <div className="mt-1 text-lg font-extrabold text-ink">Admin</div>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 p-3">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-ink-2 hover:bg-brand-soft hover:text-ink"
            >
              {l.label}
              {l.href === "/admin/basvurular" && pendingRoles > 0 ? (
                <span className="ml-2 rounded-full bg-amber-100 px-1.5 text-xs font-bold text-amber-800">
                  {pendingRoles}
                </span>
              ) : null}
            </Link>
          ))}
        </nav>
        <div className="border-t border-line p-4 text-xs text-ink-3">
          @{profile.username}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-line bg-white px-4 py-3 md:px-8">
          <div className="flex max-w-[70%] flex-wrap gap-x-3 gap-y-1 md:hidden">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="text-xs font-semibold text-ink-2">
                {l.label}
              </Link>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-ink-2 sm:inline">
              {profile.full_name || `@${profile.username}`}
            </span>
            <form action={signOutAdmin}>
              <button
                type="submit"
                className="rounded-lg border border-line px-3 py-1.5 text-sm font-semibold text-ink-2 hover:bg-surface"
              >
                Çıkış
              </button>
            </form>
          </div>
        </header>
        <div className="flex-1 px-4 py-6 md:px-8">{children}</div>
      </div>
    </div>
  );
}
