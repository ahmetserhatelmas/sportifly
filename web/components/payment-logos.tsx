import Image from "next/image";

/**
 * iyzico resmi logo paketi: footer şeridi Visa, Mastercard, Amex, Troy
 * ve "iyzico ile Öde" logolarını birlikte içerir.
 */
export function PaymentLogos() {
  return (
    <div className="flex flex-col gap-2" aria-label="Kabul edilen ödeme yöntemleri">
      <span className="text-xs text-ink-3">Güvenli ödeme</span>
      <Image
        src="/payment/logo-band-colored.svg"
        alt="iyzico ile Öde, Mastercard, Visa, American Express ve Troy"
        width={429}
        height={32}
        className="h-7 w-auto max-w-full sm:h-8"
        unoptimized
      />
    </div>
  );
}
