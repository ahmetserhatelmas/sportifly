import Link from "next/link";
import { Logo } from "@/components/logo";
import { PaymentLogos } from "@/components/payment-logos";
import { StoreBadges } from "@/components/store-badges";
import { legalLinks, nav, site } from "@/lib/site";

export function Footer() {
  const c = site.company;
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-6 text-ink-2">{site.description}</p>
          <div className="mt-5">
            <StoreBadges compact />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-ink">Sayfalar</h3>
          <ul className="mt-3 space-y-2 text-sm text-ink-2">
            {nav.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="hover:text-ink">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-ink">Yasal</h3>
          <ul className="mt-3 space-y-2 text-sm text-ink-2">
            {legalLinks.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="hover:text-ink">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div id="iletisim-bilgileri">
          <h3 className="text-sm font-semibold text-ink">İletişim</h3>
          <address className="mt-3 space-y-1.5 text-sm not-italic leading-6 text-ink-2">
            <div className="font-medium text-ink">{c.legalName}</div>
            <div>{c.kind}</div>
            <div>{c.address}</div>
            <div>
              <a href={`mailto:${c.email}`} className="hover:text-ink">
                {c.email}
              </a>
            </div>
            <div>
              <a href={`tel:${c.phone.replace(/\s/g, "")}`} className="hover:text-ink">
                {c.phone}
              </a>
            </div>
          </address>
          <Link href="/iletisim" className="mt-3 inline-block text-sm font-semibold text-brand-dark">
            Tüm iletişim bilgileri →
          </Link>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 px-5 py-6 md:flex-row">
          <p className="text-xs text-ink-3">
            © {new Date().getFullYear()} {site.company.legalName}. Tüm hakları saklıdır.
          </p>
          <PaymentLogos />
        </div>
      </div>
    </footer>
  );
}
