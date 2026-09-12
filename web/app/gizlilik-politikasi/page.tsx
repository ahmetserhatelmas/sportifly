import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Gizlilik Politikası",
  description: "Sportifly'ın kişisel verileri nasıl topladığı, kullandığı ve koruduğuna ilişkin gizlilik politikası.",
};

export default function PrivacyPage() {
  const c = site.company;
  return (
    <PageShell title="Gizlilik Politikası" updated="1 Eylül 2026">
      <div className="prose-legal">
        <p>
          Bu Gizlilik Politikası, {c.legalName} (&quot;Sportifly&quot; veya &quot;Şirket&quot;) tarafından işletilen
          Sportifly mobil uygulaması ve {site.url} web sitesi (&quot;Platform&quot;) üzerinden toplanan kişisel
          verilerin hangi amaçlarla işlendiğini, kimlerle paylaşıldığını ve nasıl korunduğunu açıklar. Platformu
          kullanarak bu politikayı okuduğunuzu kabul edersiniz.
        </p>

        <h2>1. Topladığımız veriler</h2>
        <ul>
          <li><strong>Hesap bilgileri:</strong> ad-soyad, kullanıcı adı, e-posta, telefon, profil fotoğrafı, doğum tarihi.</li>
          <li><strong>Spor profili:</strong> branşlar, seviye, pozisyon, şehir/ilçe tercihi ve istatistikler.</li>
          <li><strong>Konum:</strong> izin vermeniz hâlinde yaklaşık konumunuz; yalnızca yakınınızdaki rakip, saha ve dersleri listelemek için kullanılır.</li>
          <li><strong>İçerik:</strong> gönderiler, yorumlar, mesajlar, ilanlar ve yüklediğiniz fotoğraflar.</li>
          <li><strong>İşlem bilgileri:</strong> kiralama/ders siparişleri, tutar, tarih ve fatura bilgileri. Kart bilgileriniz Sportifly tarafından saklanmaz; ödeme, PCI-DSS sertifikalı iyzico Ödeme Hizmetleri A.Ş. altyapısında gerçekleşir.</li>
          <li><strong>Teknik veriler:</strong> cihaz modeli, işletim sistemi, uygulama sürümü, IP adresi, bildirim kimliği (push token), hata ve performans kayıtları.</li>
          <li><strong>İşletme belgeleri:</strong> saha sahibi/eğitmen hesapları için vergi levhası, ruhsat vb. doğrulama belgeleri.</li>
        </ul>

        <h2>2. Verileri hangi amaçlarla kullanıyoruz?</h2>
        <ul>
          <li>Hesap oluşturma, kimlik doğrulama ve hesabın yönetimi</li>
          <li>Rakip eşleşmesi, saha/ders arama ve rezervasyon işlemlerinin yürütülmesi</li>
          <li>Ödemelerin alınması, fatura düzenlenmesi ve iade süreçleri</li>
          <li>Kullanıcılar arası mesajlaşma ve bildirim gönderimi</li>
          <li>Güvenlik, dolandırıcılık önleme, moderasyon ve şikâyet yönetimi</li>
          <li>Hizmet kalitesinin ölçülmesi ve iyileştirilmesi</li>
          <li>Yasal yükümlülüklerin yerine getirilmesi</li>
        </ul>

        <h2>3. Verilerin paylaşılması</h2>
        <p>Kişisel verileriniz yalnızca aşağıdaki hâllerde üçüncü taraflarla paylaşılır:</p>
        <ul>
          <li><strong>Diğer kullanıcılar:</strong> profilinizde herkese açık olarak belirlediğiniz bilgiler ile bir rezervasyonda karşı tarafın (saha sahibi/eğitmen) görmesi zorunlu olan ad ve iletişim bilgileri.</li>
          <li><strong>Hizmet sağlayıcılar:</strong> barındırma ve veritabanı (Supabase), ödeme (iyzico), bildirim (Expo Push / Apple / Google) ve e-posta altyapısı sağlayıcıları; yalnızca hizmetin gerektirdiği ölçüde.</li>
          <li><strong>Yetkili merciler:</strong> mevzuat gereği talep hâlinde.</li>
        </ul>
        <p>Verileriniz reklam amacıyla satılmaz veya kiralanmaz.</p>

        <h2>4. Saklama süresi</h2>
        <p>
          Hesap verileri hesabınız açık olduğu sürece; işlem ve fatura kayıtları ilgili mevzuat (6102 sayılı TTK,
          213 sayılı VUK) gereği 10 yıl; mesaj ve içerikler hesabınızı silmenizden itibaren en geç 30 gün içinde
          silinir veya anonim hâle getirilir.
        </p>

        <h2>5. Haklarınız</h2>
        <p>
          6698 sayılı KVKK&apos;nın 11. maddesi kapsamında verilerinize erişme, düzeltme, silme, işlemeye itiraz
          etme ve taşınabilirlik haklarına sahipsiniz. Uygulama içinden <em>Profil → Ayarlar → Hesabı Sil</em>{" "}
          adımıyla hesabınızı silebilir veya taleplerinizi{" "}
          <a href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a> adresine iletebilirsiniz. Ayrıntılar
          için <Link href="/kvkk-aydinlatma-metni">KVKK Aydınlatma Metni</Link>&apos;ne bakın.
        </p>

        <h2>6. Güvenlik</h2>
        <p>
          Veriler aktarım sırasında TLS ile şifrelenir, erişim rol bazlı yetkilendirme (RLS) ile sınırlandırılır ve
          düzenli olarak yedeklenir. Ödeme sayfaları SSL sertifikası ile korunur.
        </p>

        <h2>7. Çerezler</h2>
        <p>
          Web sitemiz yalnızca oturum ve temel işlevsellik için zorunlu çerezler kullanır; üçüncü taraf reklam
          çerezi kullanılmaz.
        </p>

        <h2>8. Değişiklikler</h2>
        <p>Bu politika güncellendiğinde yeni sürüm bu sayfada yayımlanır ve önemli değişiklikler uygulama içinden bildirilir.</p>

        <h2>9. İletişim</h2>
        <p>
          {c.legalName} — {c.address} — <a href={`mailto:${c.email}`}>{c.email}</a> — {c.phone}
        </p>
      </div>
    </PageShell>
  );
}
