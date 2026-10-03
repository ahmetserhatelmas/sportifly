import type { Metadata } from "next";
import Image from "next/image";
import { PageShell } from "@/components/page-shell";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Hakkımızda",
  description: "Sportifly kimdir, ne yapar? Amatör sporcuları, saha sahiplerini ve eğitmenleri tek platformda buluşturan uygulamanın hikâyesi.",
};

export default function AboutPage() {
  return (
    <PageShell
      title="Hakkımızda"
      lead="Sportifly, amatör sporcuların rakip bulmasını, saha kiralamasını ve eğitmenlerden ders almasını tek uygulamada kolaylaştıran bir spor topluluğu platformudur."
    >
      <div className="prose-legal">
        <div className="mb-8 flex items-center gap-4 rounded-2xl border border-line bg-surface p-5">
          <Image src="/icon.png" alt="" width={56} height={56} className="rounded-2xl" />
          <div>
            <div className="font-bold text-ink">{site.company.tradeName}</div>
            <div className="text-sm text-ink-2">{site.company.legalName}</div>
          </div>
        </div>

        <h2>Neden Sportifly?</h2>
        <p>
          Halı saha maçı için eksik oyuncu bulmak, boş bir kort saati yakalamak ya da güvenilir bir eğitmene
          ulaşmak; hepsi dağınık WhatsApp grupları ve telefon trafiğiyle yürüyordu. Sportifly bu süreci tek bir
          uygulamada topluyor: konumuna göre rakip ve saha bul, saatini seç, güvenli öde, bildirimle takip et.
        </p>

        <h2>Ne sunuyoruz?</h2>
        <ul>
          <li>
            <strong>Oyunculara:</strong> düello (maç) eşleşmesi, saha kiralama, ders satın alma, sosyal akış ve
            mesajlaşma.
          </li>
          <li>
            <strong>Saha sahiplerine:</strong> saatlik ilan yönetimi, doluluk takvimi ve kiralama talep akışı.
          </li>
          <li>
            <strong>Eğitmenlere:</strong> ders ilanları, öğrenci talepleri ve takvim yönetimi.
          </li>
        </ul>

        <h2>Nasıl çalışıyoruz?</h2>
        <p>
          Sportifly bir aracı hizmet sağlayıcıdır. Saha ve ders hizmetleri, uygulamada ilan veren işletmeler ve
          eğitmenler tarafından sunulur; Sportifly rezervasyon, ödeme ve iletişim altyapısını sağlar. Ödemeler
          iyzico güvenli ödeme altyapısı üzerinden alınır.
        </p>

        <h2>Şirket bilgileri</h2>
        <ul>
          <li>Ad soyad / unvan: {site.company.legalName}</li>
          <li>İşletme türü: {site.company.kind}</li>
          <li>İşletme adı / marka: {site.company.tradeName}</li>
          <li>Adres: {site.company.address}</li>
          <li>
            E-posta:{" "}
            <a href={`mailto:${site.company.email}`}>{site.company.email}</a>
          </li>
          <li>Telefon: {site.company.phone}</li>
        </ul>
      </div>
    </PageShell>
  );
}
