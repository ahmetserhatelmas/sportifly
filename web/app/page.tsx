import Link from "next/link";
import { HashScroll } from "@/components/hash-scroll";
import { Icons } from "@/components/icons";
import { Phone } from "@/components/phone";
import { PaymentLogos } from "@/components/payment-logos";
import { Section } from "@/components/section";
import { StoreBadges } from "@/components/store-badges";
import { site } from "@/lib/site";

const features = [
  {
    icon: Icons.swords,
    title: "Düello: rakibini bul",
    text: "Branşını, seviyeni ve saatini seç; yakınındaki oyuncularla eşleş. Lobi dolunca maç kesinleşir.",
  },
  {
    icon: Icons.pin,
    title: "Saha kirala",
    text: "Halı saha, basketbol ve tenis kortlarını haritada gör, boş saatleri seç, kiralama talebini anında gönder.",
  },
  {
    icon: Icons.whistle,
    title: "Eğitmenden ders al",
    text: "Onaylı eğitmenlerin ders ilanlarını incele, uygun saati ayırt ve gelişimini takip et.",
  },
  {
    icon: Icons.feed,
    title: "Sosyal akış",
    text: "Maç anlarını paylaş, takip ettiğin oyuncuların gönderilerini gör, yorum yap ve beğen.",
  },
  {
    icon: Icons.chat,
    title: "Anlık mesajlaşma",
    text: "Rakiplerin, takım arkadaşların ve saha sahipleriyle uygulama içinden güvenle konuş.",
  },
  {
    icon: Icons.trophy,
    title: "Turnuvalar",
    text: "Şehrindeki turnuvalara katıl, fikstürü takip et, puan durumunu ve istatistiklerini gör.",
    soon: true,
  },
];

const playerSteps = [
  { n: "1", title: "Profilini oluştur", text: "Branşlarını, seviyeni ve konumunu ekle." },
  { n: "2", title: "Rakip ya da saha seç", text: "Düello ilanı aç veya boş bir saha saatini seç." },
  { n: "3", title: "Sahaya çık", text: "Onay gelince bildirim alırsın; maç günü sahadasın." },
];

const ownerSteps = [
  { n: "1", title: "İşletme hesabı aç", text: "Saha sahibi veya eğitmen olarak kayıt ol, belgelerini yükle." },
  { n: "2", title: "İlanını yayınla", text: "Saatlik fiyatını, uygun saatlerini ve fotoğraflarını ekle." },
  { n: "3", title: "Talepleri yönet", text: "Kiralama ve ders taleplerini tek ekrandan onayla ya da reddet." },
];

const faqs = [
  {
    q: "Sportifly ücretli mi?",
    a: "Hayır. Uygulamayı indirmek, profil oluşturmak, rakip bulmak ve mesajlaşmak ücretsizdir. Yalnızca saha kiralama ve ders satın alırken ilanda yazan ücret ödenir.",
  },
  {
    q: "Ödemeler nasıl yapılıyor?",
    a: "Ödemeler iyzico altyapısı üzerinden, 256-bit SSL ile şifrelenerek kredi/banka kartıyla alınır. Kart bilgileriniz Sportifly sunucularında saklanmaz.",
  },
  {
    q: "Kiralamayı iptal edebilir miyim?",
    a: "Evet. İptal ve iade koşulları Teslimat ve İade Şartları sayfasında ve her ilanın detayında yazar. Belirtilen süre içinde yapılan iptallerde ücret aynı karta iade edilir.",
  },
  {
    q: "Hangi şehirlerde kullanılabilir?",
    a: "Sportifly Türkiye genelinde çalışır. Rakip ve saha sonuçları bulunduğun konuma göre listelenir.",
  },
];

export default function HomePage() {
  return (
    <>
      <HashScroll />
      {/* HERO */}
      <section className="relative overflow-hidden bg-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-40 h-[560px] bg-[radial-gradient(60%_60%_at_50%_0%,#e3f6f3_0%,rgba(227,246,243,0)_100%)]"
        />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-16 md:grid-cols-2 md:pb-28 md:pt-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand/40 bg-brand-soft px-3 py-1 text-xs font-semibold text-brand-dark">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              iOS ve Android&apos;de yakında
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight text-ink md:text-6xl">
              Rakibini bul,
              <br />
              <span className="text-brand">sahaya çık.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-7 text-ink-2">{site.description}</p>
            <div id="indir" className="mt-8 scroll-mt-28">
              <StoreBadges />
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-2">
              {["Ücretsiz üyelik", "iyzico ile güvenli ödeme", "Anlık bildirimler"].map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <Icons.check width={16} height={16} className="text-brand-dark" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mx-auto flex w-full max-w-md items-end justify-center gap-4">
            <div className="hidden w-[42%] translate-y-10 sm:block">
              <Phone src="/screens/listing-2.jpg" alt="Sportifly saha ilanı ve kiralama ekranı" />
            </div>
            <div className="w-[70%] sm:w-[50%]">
              <Phone src="/screens/feed-2.jpg" alt="Sportifly ana akış ekranı" priority />
            </div>
          </div>
        </div>
      </section>

      {/* STATS STRIP */}
      <div className="border-y border-line bg-surface">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-5 py-8 text-center md:grid-cols-4">
          {[
            ["4+", "Branş"],
            ["3", "Kullanıcı rolü"],
            ["7/24", "Rakip eşleşme"],
            ["%100", "Güvenli ödeme"],
          ].map(([v, l]) => (
            <div key={l}>
              <div className="text-3xl font-extrabold text-ink">{v}</div>
              <div className="mt-1 text-sm text-ink-2">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <Section
        id="ozellikler"
        eyebrow="Özellikler"
        title="Spor hayatın için tek uygulama"
        lead="Rakip bulmaktan saha kiralamaya, dersten turnuvaya kadar her adım Sportifly içinde."
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-line bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-ink/5"
            >
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-brand-dark">
                <f.icon />
              </div>
              <h3 className="mt-4 flex items-center gap-2 text-lg font-bold text-ink">
                {f.title}
                {"soon" in f && f.soon ? (
                  <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-semibold text-ink-2">
                    Yakında
                  </span>
                ) : null}
              </h3>
              <p className="mt-2 text-sm leading-6 text-ink-2">{f.text}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* SCREENS */}
      <section className="overflow-hidden bg-ink py-20 text-white">
        <div className="mx-auto max-w-6xl px-5">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-brand">Uygulamadan</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight md:text-4xl">
              Sade, hızlı ve sahaya odaklı
            </h2>
            <p className="mt-4 text-lg leading-7 text-white/70">
              Karmaşık menüler yok. Aradığını iki dokunuşta bul, kalan zamanını sahada geçir.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-5 md:grid-cols-4">
            {[
              ["/screens/search-2.jpg", "Düello arama", "Yakınındaki açık lobileri filtrele"],
              ["/screens/store-2.jpg", "Mağaza", "Saha ve ders ilanları, saatlik fiyatlar"],
              ["/screens/chat-2.jpg", "Mesajlar", "Rakiplerin ve saha sahipleriyle anlık sohbet"],
              ["/screens/profile-2.jpg", "Profil", "İstatistikler ve katıldığın maçlar"],
            ].map(([src, t, d]) => (
              <figure key={src}>
                <Phone src={src} alt={`${t} ekranı`} className="border-white/15 shadow-black/40" />
                <figcaption className="mt-4">
                  <div className="font-semibold">{t}</div>
                  <div className="text-sm text-white/60">{d}</div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <Section
        id="nasil-calisir"
        eyebrow="Nasıl çalışır"
        title="Üç adımda sahadasın"
        lead="Oyuncu, saha sahibi ya da eğitmen; herkes için akış aynı derecede basit."
        tone="surface"
      >
        <div className="grid gap-8 lg:grid-cols-2">
          {[
            ["Oyuncular için", playerSteps],
            ["Saha sahipleri ve eğitmenler için", ownerSteps],
          ].map(([heading, steps]) => (
            <div key={heading as string} className="rounded-3xl border border-line bg-white p-7">
              <h3 className="text-lg font-bold text-ink">{heading as string}</h3>
              <ol className="mt-6 space-y-6">
                {(steps as typeof playerSteps).map((s) => (
                  <li key={s.n} className="flex gap-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
                      {s.n}
                    </span>
                    <div>
                      <div className="font-semibold text-ink">{s.title}</div>
                      <div className="mt-1 text-sm leading-6 text-ink-2">{s.text}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </Section>

      {/* PRICING / SERVICES */}
      <Section
        id="ucretler"
        eyebrow="Hizmetler ve ücretler"
        title="Şeffaf fiyatlandırma"
        lead="Uygulama ücretsizdir. Yalnızca saha kiralama ve ders satın alımlarında, ilanda açıkça yazan tutar ödenir. Tüm fiyatlar Türk Lirası (₺) ve KDV dahildir."
      >
        <div className="grid gap-5 md:grid-cols-3">
          {site.services.map((s) => (
            <div key={s.name} className="flex flex-col rounded-2xl border border-line bg-white p-6">
              <h3 className="text-base font-bold text-ink">{s.name}</h3>
              <div className="mt-3 text-2xl font-extrabold text-brand-dark">{s.price}</div>
              <p className="mt-3 flex-1 text-sm leading-6 text-ink-2">{s.note}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-col items-start justify-between gap-5 rounded-2xl bg-brand-soft p-6 md:flex-row md:items-center">
          <div className="flex items-start gap-3">
            <Icons.card className="mt-0.5 shrink-0 text-brand-dark" />
            <p className="text-sm leading-6 text-ink">
              Ödemeler <strong>iyzico</strong> güvenli ödeme altyapısıyla, Visa, Mastercard ve Troy kartlarla
              alınır. Ödeme sonrası e-posta ile fatura/bilgi formu iletilir. İptal ve iade koşulları için{" "}
              <Link href="/teslimat-ve-iade" className="font-semibold text-brand-dark underline">
                Teslimat ve İade Şartları
              </Link>
              &apos;na bakın.
            </p>
          </div>
          <PaymentLogos />
        </div>
      </Section>

      {/* TRUST */}
      <Section
        eyebrow="Güven"
        title="Güvenli topluluk, güvenli ödeme"
        tone="surface"
      >
        <div className="grid gap-5 md:grid-cols-3">
          {[
            [Icons.shield, "Doğrulanmış işletmeler", "Saha sahipleri ve eğitmenler belge kontrolünden geçer; yalnızca onaylı ilanlar yayınlanır."],
            [Icons.chat, "Engelle & raporla", "Her sohbet ve profil için engelleme ve raporlama araçları; moderasyon ekibi 24 saat içinde inceler."],
            [Icons.bell, "Anında bilgilendirme", "Kiralama onayı, maç eşleşmesi ve mesajlar için anlık bildirim alırsın."],
          ].map(([Icon, t, d]) => {
            const I = Icon as typeof Icons.shield;
            return (
              <div key={t as string} className="rounded-2xl border border-line bg-white p-6">
                <I className="text-brand-dark" />
                <h3 className="mt-4 font-bold text-ink">{t as string}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-2">{d as string}</p>
              </div>
            );
          })}
        </div>
      </Section>

      {/* FAQ */}
      <Section id="sss" eyebrow="SSS" title="Sık sorulan sorular">
        <div className="grid gap-4 md:grid-cols-2">
          {faqs.map((f) => (
            <details key={f.q} className="group rounded-2xl border border-line bg-white p-5 open:shadow-sm">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-ink">
                {f.q}
                <span className="text-ink-3 transition group-open:rotate-45" aria-hidden>
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-6 text-ink-2">{f.a}</p>
            </details>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <section className="bg-brand">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-5 py-16 text-center text-white">
          <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">{site.tagline}</h2>
          <p className="max-w-xl text-white/90">
            Sportifly&apos;ı indir, bugün ilk düellonu aç ya da sahanı kirala.
          </p>
          <StoreBadges />
        </div>
      </section>
    </>
  );
}
