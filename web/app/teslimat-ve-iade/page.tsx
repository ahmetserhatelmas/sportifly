import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Teslimat ve İade Şartları",
  description: "Sportifly üzerinden yapılan saha kiralama ve ders rezervasyonlarında hizmetin sunulması, iptal ve iade koşulları.",
};

const rows = [
  ["Hizmet saatine 24 saatten fazla", "%100 iade"],
  ["Hizmet saatine 2–24 saat", "%50 iade"],
  ["Hizmet saatine 2 saatten az / gelinmeme", "İade yok"],
  ["İlan sahibi iptal etti veya hizmet sunulamadı", "%100 iade"],
  ["İlan sahibi 24 saat içinde onaylamadı", "%100 iade (otomatik)"],
  ["Mücbir sebep (hava, arıza vb.)", "Yeni tarih veya %100 iade"],
];

export default function RefundPage() {
  return (
    <PageShell
      title="Teslimat ve İade Şartları"
      lead="Sportifly'da satın alınan hizmetler fiziksel ürün değildir; belirli bir tarih ve saatte sahada ya da ders yerinde sunulur."
      updated="1 Eylül 2026"
    >
      <div className="prose-legal">
        <h2>1. Hizmetin sunulması (teslimat)</h2>
        <ul>
          <li>Rezervasyon, ödeme tamamlandıktan sonra ilan sahibinin onayıyla kesinleşir. Onay ve ret bildirimi uygulama içi bildirim ve e-posta ile iletilir.</li>
          <li>Hizmet, sipariş özetindeki tarih, saat ve adreste sunulur. Kargo veya fiziksel teslimat yoktur.</li>
          <li>Rezervasyon detayı, adres ve iletişim bilgileri uygulamada <em>Profil → Rezervasyonlarım</em> altında görüntülenir.</li>
          <li>Alıcının hizmet saatinde hazır bulunmaması (no-show) hâlinde hizmet sunulmuş sayılır.</li>
        </ul>

        <h2>2. İptal ve iade koşulları</h2>
        <p>
          Spor sahası kiralama ve ders hizmetleri, Mesafeli Sözleşmeler Yönetmeliği m.15/1-(g) kapsamında cayma
          hakkı istisnasındadır. Sportifly buna rağmen kullanıcı lehine aşağıdaki iptal politikasını uygular:
        </p>
        <div className="not-prose my-6 overflow-hidden rounded-2xl border border-line">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left text-ink">
              <tr>
                <th className="px-4 py-3 font-semibold">İptal zamanı / durum</th>
                <th className="px-4 py-3 font-semibold">İade</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([k, v]) => (
                <tr key={k} className="border-t border-line">
                  <td className="px-4 py-3 text-ink-2">{k}</td>
                  <td className="px-4 py-3 font-semibold text-ink">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>İlan sahibi kendi ilanında daha esnek koşullar belirlemişse, kullanıcı lehine olan koşul uygulanır.</p>

        <h2>3. İptal nasıl yapılır?</h2>
        <ul>
          <li>Uygulamada <em>Profil → Rezervasyonlarım</em> ekranından ilgili rezervasyonu açıp <em>İptal et</em>&apos;e dokunun.</li>
          <li>Alternatif olarak <a href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a> adresine rezervasyon numaranızla e-posta gönderin.</li>
          <li>İptal talebi, uygulamaya düştüğü an itibarıyla değerlendirilir.</li>
        </ul>

        <h2>4. İade süreci</h2>
        <ul>
          <li>İadeler, ödemenin yapıldığı karta iyzico üzerinden yapılır; başka bir hesaba iade yapılmaz.</li>
          <li>İade onayından sonra tutar en geç 14 gün içinde kartınıza yansır. Bankanızın işlem süresine bağlı olarak ekstrenizde görünmesi farklılık gösterebilir.</li>
          <li>Taksitli ödemelerde iade, bankanız tarafından taksitli olarak yansıtılabilir.</li>
        </ul>

        <h2>5. Şikâyet ve itiraz</h2>
        <p>
          Hizmetin sunulmaması veya ilanla uyumsuz olması hâlinde hizmet saatinden itibaren 48 saat içinde
          uygulama içinden veya <a href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a> üzerinden bildirim
          yapın. Sportifly kayıtları inceler ve en geç 5 iş günü içinde sonuçlandırır. Ayrıntılı hükümler için{" "}
          <Link href="/mesafeli-satis-sozlesmesi">Mesafeli Satış Sözleşmesi</Link>&apos;ne bakın.
        </p>
      </div>
    </PageShell>
  );
}
