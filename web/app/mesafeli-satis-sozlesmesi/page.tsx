import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Mesafeli Satış Sözleşmesi",
  description: "Sportifly üzerinden saha kiralama ve ders satın alımlarına ilişkin mesafeli satış sözleşmesi ve ön bilgilendirme formu.",
};

export default function DistanceSalesPage() {
  const c = site.company;
  return (
    <PageShell
      title="Mesafeli Satış Sözleşmesi"
      lead="6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği uyarınca hazırlanmıştır. Bu metin aynı zamanda ön bilgilendirme formu niteliğindedir."
      updated="1 Eylül 2026"
    >
      <div className="prose-legal">
        <h2>Madde 1 — Taraflar</h2>
        <p>
          <strong>Aracı hizmet sağlayıcı (Platform):</strong> {c.legalName}, {c.address}, MERSİS {c.mersis}, VKN{" "}
          {c.taxId}, e-posta <a href={`mailto:${c.email}`}>{c.email}</a>, telefon {c.phone}, KEP {c.kep}.
        </p>
        <p>
          <strong>Satıcı / hizmet sağlayıcı:</strong> Rezervasyon yapılan ilanın sahibi olan saha işletmesi veya
          eğitmen. Unvan, adres ve iletişim bilgileri ilan detayında ve sipariş özetinde gösterilir.
        </p>
        <p>
          <strong>Alıcı (Tüketici):</strong> Sportifly uygulamasında rezervasyon yapan, ad-soyad, e-posta ve telefon
          bilgileri hesabında kayıtlı kullanıcı.
        </p>

        <h2>Madde 2 — Konu</h2>
        <p>
          Bu sözleşmenin konusu, Alıcı&apos;nın Sportifly uygulaması üzerinden elektronik ortamda sipariş verdiği,
          nitelikleri ve satış fiyatı ilanda belirtilen <strong>saha kiralama</strong> veya{" "}
          <strong>özel ders</strong> hizmetinin sunulması ve ödenmesine ilişkin tarafların hak ve
          yükümlülüklerinin belirlenmesidir.
        </p>

        <h2>Madde 3 — Hizmetin temel nitelikleri ve fiyat</h2>
        <ul>
          <li>Hizmetin türü (saha kiralama / ders), branş, saha veya eğitmen adı, adres, tarih ve saat aralığı ilanda ve sipariş özetinde yer alır.</li>
          <li>Fiyat, ilanda Türk Lirası (₺) olarak ve tüm vergiler dâhil gösterilir. Sportifly ayrıca bir hizmet bedeli alıyorsa sipariş özetinde ayrı satır olarak gösterilir.</li>
          <li>Ödeme; kredi kartı, banka kartı veya iyzico ile Öde seçenekleriyle, iyzico Ödeme Hizmetleri A.Ş. altyapısı üzerinden tek çekim veya kartın izin verdiği taksit seçenekleriyle yapılır.</li>
          <li>İlan fiyatları ilan sahibi tarafından güncellenebilir; Alıcı için geçerli fiyat, siparişin onaylandığı andaki fiyattır.</li>
        </ul>

        <h2>Madde 4 — Siparişin kurulması</h2>
        <p>
          Alıcı, sipariş özetini ve bu sözleşmeyi onaylayıp ödemeyi tamamladığında rezervasyon talebi oluşur.
          Rezervasyon, ilan sahibinin onayıyla kesinleşir. İlan sahibi 24 saat içinde (veya hizmet saatine 24
          saatten az kaldıysa hizmet saatinden önce) onay vermezse ödeme tamamen iade edilir.
        </p>

        <h2>Madde 5 — Hizmetin ifası (teslimat)</h2>
        <p>
          Hizmet, sipariş özetinde belirtilen tarih ve saatte, belirtilen sahada veya ders yerinde fiziksel olarak
          sunulur. Ayrıca bir kargo/teslimat söz konusu değildir. Alıcı, hizmet saatinde hazır bulunmakla
          yükümlüdür.
        </p>

        <h2>Madde 6 — Cayma hakkı</h2>
        <p>
          Mesafeli Sözleşmeler Yönetmeliği m.15/1-(g) uyarınca{" "}
          <strong>
            belirli bir tarihte veya dönemde yapılması gereken boş zamanın değerlendirilmesine ilişkin (spor,
            eğlence, konaklama vb.) hizmetlerde cayma hakkı kullanılamaz.
          </strong>{" "}
          Bununla birlikte Sportifly, Alıcı lehine aşağıdaki iptal koşullarını uygular:
        </p>
        <ul>
          <li>Hizmet saatine <strong>24 saatten fazla</strong> süre varken yapılan iptallerde ücretin <strong>%100</strong>&apos;ü iade edilir.</li>
          <li>Hizmet saatine <strong>2–24 saat</strong> kala yapılan iptallerde ücretin <strong>%50</strong>&apos;si iade edilir.</li>
          <li>Hizmet saatine <strong>2 saatten az</strong> kala yapılan iptallerde ve gelinmeyen (no-show) durumlarda iade yapılmaz.</li>
          <li>İlan sahibi hizmeti iptal ederse veya sunamazsa ücretin tamamı iade edilir.</li>
          <li>İlan sahibi kendi ilanında Alıcı lehine daha esnek koşullar belirlemişse o koşullar geçerlidir.</li>
        </ul>
        <p>
          Ayrıntılar için <Link href="/teslimat-ve-iade">Teslimat ve İade Şartları</Link> sayfasına bakın.
        </p>

        <h2>Madde 7 — İade işlemi</h2>
        <p>
          İadeler, ödemenin yapıldığı karta iyzico aracılığıyla yapılır. İade talebi onaylandıktan sonra tutar
          en geç 14 gün içinde karta yansır; bankaya göre süre değişebilir.
        </p>

        <h2>Madde 8 — Genel hükümler</h2>
        <ul>
          <li>Alıcı, bu sözleşme ve ön bilgilendirme formunu okuduğunu, hizmetin temel nitelikleri, fiyatı, ödeme ve ifa koşulları hakkında bilgilendirildiğini kabul eder.</li>
          <li>Alıcı, kullandığı kartın hamili olduğunu veya kullanma yetkisine sahip olduğunu beyan eder. Kartın yetkisiz kullanımı hâlinde bankanın ödemeyi yapmaması durumunda hizmet ifa edilmez.</li>
          <li>Mücbir sebepler (olumsuz hava koşulları nedeniyle açık sahanın kullanılamaması dâhil) hâlinde taraflar yeni bir tarih belirleyebilir veya ücret iade edilir.</li>
        </ul>

        <h2>Madde 9 — Uyuşmazlıkların çözümü</h2>
        <p>
          Uyuşmazlıklarda, Ticaret Bakanlığı&apos;nca her yıl belirlenen parasal sınırlar dâhilinde Alıcı&apos;nın
          veya Satıcı&apos;nın yerleşim yerindeki Tüketici Hakem Heyetleri, sınırı aşan uyuşmazlıklarda Tüketici
          Mahkemeleri yetkilidir.
        </p>

        <h2>Madde 10 — Yürürlük</h2>
        <p>
          Alıcı, uygulama üzerinden ödemeyi tamamladığı anda bu sözleşmenin tüm koşullarını kabul etmiş sayılır.
          Sözleşmenin bir örneği Alıcı&apos;nın e-posta adresine gönderilir ve uygulama içinden erişilebilir.
        </p>
      </div>
    </PageShell>
  );
}
