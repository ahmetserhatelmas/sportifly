import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "KVKK Aydınlatma Metni",
  description: "6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında Sportifly veri sorumlusu aydınlatma metni.",
};

export default function KvkkPage() {
  const c = site.company;
  return (
    <PageShell title="KVKK Aydınlatma Metni" updated="1 Eylül 2026">
      <div className="prose-legal">
        <h2>Veri sorumlusu</h2>
        <p>
          {c.legalName}, {c.address}. MERSİS: {c.mersis}. E-posta: <a href={`mailto:${c.email}`}>{c.email}</a>.
        </p>

        <h2>İşlenen kişisel veriler ve amaçları</h2>
        <ul>
          <li><strong>Kimlik ve iletişim verileri</strong> (ad, e-posta, telefon): üyelik sözleşmesinin kurulması ve ifası, bilgilendirme.</li>
          <li><strong>Konum verisi</strong>: yakın rakip/saha listeleme (açık rıza ile).</li>
          <li><strong>Görsel veriler</strong> (profil fotoğrafı, gönderiler): platform hizmetlerinin sunulması.</li>
          <li><strong>Finansal veriler</strong> (sipariş tutarı, fatura bilgisi): mesafeli satış sözleşmesinin ifası, yasal yükümlülükler.</li>
          <li><strong>İşlem güvenliği verileri</strong> (IP, cihaz, log): güvenlik ve yasal yükümlülükler.</li>
        </ul>

        <h2>Hukuki sebepler</h2>
        <p>
          KVKK m.5/2 (c) sözleşmenin kurulması ve ifası, (ç) hukuki yükümlülük, (e) hakkın tesisi, (f) meşru
          menfaat; konum ve pazarlama iletişimi için KVKK m.5/1 açık rıza.
        </p>

        <h2>Aktarım</h2>
        <p>
          Veriler, hizmetin gerektirdiği ölçüde barındırma, ödeme (iyzico), bildirim ve e-posta hizmet
          sağlayıcılarına ve talep hâlinde yetkili kamu kurumlarına aktarılır. Yurt dışında bulunan sunucu
          hizmetleri için KVKK m.9 kapsamında gerekli güvenceler sağlanır.
        </p>

        <h2>Toplama yöntemi</h2>
        <p>Mobil uygulama, web sitesi ve destek kanalları üzerinden elektronik ortamda, otomatik veya kısmen otomatik yollarla toplanır.</p>

        <h2>Haklarınız (KVKK m.11)</h2>
        <ul>
          <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme ve bilgi talep etme</li>
          <li>İşlenme amacını ve amaca uygun kullanılıp kullanılmadığını öğrenme</li>
          <li>Aktarıldığı üçüncü kişileri bilme</li>
          <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme</li>
          <li>Silinmesini veya yok edilmesini isteme</li>
          <li>Otomatik sistemlerle analiz sonucu aleyhe bir sonucun ortaya çıkmasına itiraz etme</li>
          <li>Kanuna aykırı işleme nedeniyle zararın giderilmesini talep etme</li>
        </ul>
        <p>
          Başvurularınızı <a href={`mailto:${c.email}`}>{c.email}</a> adresine veya {c.address} adresine yazılı
          olarak iletebilirsiniz. Başvurular en geç 30 gün içinde ücretsiz olarak sonuçlandırılır.
        </p>
      </div>
    </PageShell>
  );
}
