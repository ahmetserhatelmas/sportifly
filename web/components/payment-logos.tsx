import Image from "next/image";

/**
 * iyzico başvurusu için "iyzico ile Öde", Visa ve Mastercard logoları.
 * Resmi logo paketi: https://www.iyzico.com/isim-icin/hesap-olustur → "Logo paketini indir".
 * İndirilen dosyaları public/payment/ altına aynı adlarla koyman yeterli.
 */
const logos = [
  { src: "/payment/iyzico-ile-ode.svg", alt: "iyzico ile Öde", width: 110, height: 28 },
  { src: "/payment/visa.svg", alt: "Visa", width: 52, height: 28 },
  { src: "/payment/mastercard.svg", alt: "Mastercard", width: 44, height: 28 },
  { src: "/payment/troy.svg", alt: "Troy", width: 52, height: 28 },
];

export function PaymentLogos() {
  return (
    <div className="flex items-center gap-3" aria-label="Kabul edilen ödeme yöntemleri">
      <span className="mr-1 text-xs text-ink-3">Güvenli ödeme</span>
      {logos.map((l) => (
        <span
          key={l.src}
          className="inline-flex h-9 items-center rounded-md border border-line bg-white px-2.5"
        >
          <Image src={l.src} alt={l.alt} width={l.width} height={l.height} className="h-5 w-auto" />
        </span>
      ))}
    </div>
  );
}
