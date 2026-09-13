import type { Metadata } from "next";
import { LegalMarkdown } from "@/components/legal-markdown";
import { PageShell } from "@/components/page-shell";
import { readLegal } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Mesafeli Satış Sözleşmesi",
  description: "Sportifly mesafeli satış sözleşmesi ve ön bilgilendirme.",
};

export default function DistanceSalesPage() {
  return (
    <PageShell
      title="Mesafeli Satış Sözleşmesi"
      lead="6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği uyarınca hazırlanmıştır."
      updated="12 Eylül 2026"
    >
      <LegalMarkdown source={readLegal("mesafeli-satis")} />
    </PageShell>
  );
}
