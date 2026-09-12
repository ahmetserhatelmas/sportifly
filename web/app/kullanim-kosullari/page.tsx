import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Kullanım Koşulları",
  description: "Sportifly platformu kullanıcı sözleşmesi ve kullanım koşulları.",
};

export default function TermsPage() {
  const c = site.company;
  return (
    <PageShell title="Kullanım Koşulları ve Üyelik Sözleşmesi" updated="1 Eylül 2026">
      <div className="prose-legal">
        <h2>1. Taraflar ve konu</h2>
        <p>
          Bu sözleşme, {c.legalName} (&quot;Sportifly&quot;) ile Sportifly mobil uygulamasına üye olan gerçek veya
          tüzel kişi (&quot;Kullanıcı&quot;) arasında, Platform&apos;un kullanım şartlarını düzenlemek amacıyla
          kurulmuştur. Üye olmakla bu koşulları kabul etmiş sayılırsınız.
        </p>

        <h2>2. Hizmetin niteliği</h2>
        <p>
          Sportifly; oyuncuların rakip bulmasına, saha sahiplerinin ve eğitmenlerin hizmet ilanı yayınlamasına ve
          kullanıcıların bu hizmetleri rezerve edip ödemesine aracılık eden bir <strong>aracı hizmet
          sağlayıcı</strong>dır. Saha ve ders hizmetleri ilan sahibi tarafından sunulur; Sportifly hizmetin
          sağlayıcısı değildir. 6563 sayılı Kanun m.9 uyarınca Sportifly, ilan sahiplerinin sağladığı içerikleri
          kontrol etmekle yükümlü değildir; ancak hukuka aykırılık bildirimlerini inceler ve gerektiğinde içeriği
          kaldırır.
        </p>

        <h2>3. Üyelik</h2>
        <ul>
          <li>Üye olmak için 18 yaşını doldurmuş olmak gerekir. 13–18 yaş arası kullanıcılar yalnızca veli onayı ile üye olabilir.</li>
          <li>Kullanıcı, verdiği bilgilerin doğru ve güncel olduğunu kabul eder; hesap güvenliğinden kendisi sorumludur.</li>
          <li>Saha sahibi ve eğitmen hesapları, belge doğrulaması tamamlanmadan ilan yayınlayamaz.</li>
        </ul>

        <h2>4. Kullanıcı yükümlülükleri</h2>
        <ul>
          <li>Diğer kullanıcılara karşı saygılı davranmak; hakaret, nefret söylemi, taciz ve ayrımcılık yapmamak.</li>
          <li>Yasa dışı, müstehcen, şiddet içeren, telif hakkı ihlali oluşturan içerik paylaşmamak.</li>
          <li>Rezervasyon yaptığı maç, saha veya derse zamanında katılmak; katılamayacaksa iptal kurallarına uygun şekilde iptal etmek.</li>
          <li>Platformu ticari spam, sahte ilan veya dolandırıcılık amacıyla kullanmamak.</li>
        </ul>
        <p>Kurallara aykırılık hâlinde Sportifly içerik kaldırma, hesabı askıya alma veya kapatma hakkını saklı tutar.</p>

        <h2>5. İlan sahiplerinin yükümlülükleri</h2>
        <p>
          Saha sahibi ve eğitmenler; ilanlarındaki fiyat, saat ve nitelik bilgilerinin doğru olmasından, ilgili
          mevzuat gereği gerekli lisans ve belgelere sahip olmaktan, onayladıkları rezervasyonu eksiksiz sunmaktan
          ve fatura/fiş düzenlemekten sorumludur.
        </p>

        <h2>6. Ödeme ve ücretler</h2>
        <p>
          Üyelik ücretsizdir. Saha kiralama ve ders satın alımlarında ilanda yazılı tutar, iyzico ödeme altyapısı
          üzerinden tahsil edilir. Ödeme, iptal ve iade koşulları{" "}
          <Link href="/mesafeli-satis-sozlesmesi">Mesafeli Satış Sözleşmesi</Link> ve{" "}
          <Link href="/teslimat-ve-iade">Teslimat ve İade Şartları</Link>&apos;nda düzenlenmiştir.
        </p>

        <h2>7. Fikrî mülkiyet</h2>
        <p>
          Sportifly markası, logosu, yazılımı ve arayüz tasarımı Şirket&apos;e aittir. Kullanıcı, paylaştığı
          içeriklerin Platform&apos;da gösterilmesi için Sportifly&apos;a dünya çapında, bedelsiz ve alt
          lisanslanabilir bir kullanım lisansı verir; içeriğin mülkiyeti kullanıcıda kalır.
        </p>

        <h2>8. Sorumluluğun sınırlandırılması</h2>
        <p>
          Sportifly; kullanıcılar arası anlaşmazlıklardan, spor faaliyeti sırasında oluşabilecek yaralanma veya
          hasardan, ilan sahibinin hizmeti sunmamasından veya üçüncü taraf altyapı kesintilerinden, kanunun izin
          verdiği ölçüde sorumlu tutulamaz. Platform &quot;olduğu gibi&quot; sunulur.
        </p>

        <h2>9. Sözleşmenin feshi</h2>
        <p>
          Kullanıcı hesabını dilediği zaman uygulama içinden silebilir. Sportifly, koşullara aykırılık hâlinde
          hesabı bildirimde bulunarak kapatabilir. Devam eden rezervasyonlara ilişkin haklar saklıdır.
        </p>

        <h2>10. Uygulanacak hukuk ve yetki</h2>
        <p>
          Bu sözleşme Türkiye Cumhuriyeti hukukuna tabidir. Uyuşmazlıklarda tüketici işlemleri için Tüketici
          Hakem Heyetleri ve Tüketici Mahkemeleri; diğer hâllerde şirket merkezinin bulunduğu yer mahkemeleri ve
          icra daireleri yetkilidir.
        </p>

        <h2>11. İletişim</h2>
        <p>
          {c.legalName} — {c.address} — <a href={`mailto:${c.email}`}>{c.email}</a> — {c.phone} — KEP: {c.kep}
        </p>
      </div>
    </PageShell>
  );
}
