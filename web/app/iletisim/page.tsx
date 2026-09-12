import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "İletişim",
  description: "Sportifly iletişim bilgileri: ticaret unvanı, MERSİS/vergi numarası, adres, KEP, e-posta ve telefon.",
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-line py-4 sm:grid-cols-[200px_1fr]">
      <dt className="text-sm font-semibold text-ink">{label}</dt>
      <dd className="text-sm text-ink-2">{value}</dd>
    </div>
  );
}

export default function ContactPage() {
  const c = site.company;
  return (
    <PageShell
      title="İletişim"
      lead="Sorularınız, destek talepleriniz ve iş birlikleri için bize aşağıdaki kanallardan ulaşabilirsiniz."
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <a
          href={`mailto:${site.supportEmail}`}
          className="rounded-2xl border border-line bg-white p-6 transition hover:shadow-md"
        >
          <div className="text-sm font-semibold text-brand-dark">Destek</div>
          <div className="mt-1 text-lg font-bold text-ink">{site.supportEmail}</div>
          <p className="mt-2 text-sm text-ink-2">Uygulama, hesap, ödeme ve iade talepleri. Hafta içi 09:00–18:00 içinde yanıtlanır.</p>
        </a>
        <a
          href={`tel:${c.phone.replace(/\s/g, "")}`}
          className="rounded-2xl border border-line bg-white p-6 transition hover:shadow-md"
        >
          <div className="text-sm font-semibold text-brand-dark">Telefon</div>
          <div className="mt-1 text-lg font-bold text-ink">{c.phone}</div>
          <p className="mt-2 text-sm text-ink-2">Hafta içi 09:00–18:00.</p>
        </a>
      </div>

      <h2 className="mt-12 text-xl font-bold text-ink">Şirket / satıcı bilgileri</h2>
      <p className="mt-2 text-sm text-ink-2">
        6563 sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun ve ilgili yönetmelik gereği bilgilendirme.
      </p>
      <dl className="mt-4">
        <Row label="Ticaret unvanı" value={c.legalName} />
        <Row label="İşletme adı / marka" value={c.tradeName} />
        <Row label="MERSİS no" value={c.mersis} />
        <Row label="Vergi kimlik no" value={`${c.taxId} — ${c.taxOffice}`} />
        <Row label="Merkez adresi" value={c.address} />
        <Row label="KEP adresi" value={c.kep} />
        <Row label="E-posta" value={<a className="underline" href={`mailto:${c.email}`}>{c.email}</a>} />
        <Row label="Telefon" value={c.phone} />
        <Row
          label="Meslek odası"
          value={
            <>
              {c.chamber} —{" "}
              <a className="underline" href={c.chamberUrl} target="_blank" rel="noopener noreferrer">
                meslekî davranış kuralları
              </a>
            </>
          }
        />
      </dl>
    </PageShell>
  );
}
