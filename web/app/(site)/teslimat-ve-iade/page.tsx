import type { Metadata } from "next";
import { LegalMarkdown } from "@/components/legal-markdown";
import { PageShell } from "@/components/page-shell";
import { readLegal } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Teslimat ve İade Şartları",
  description: "Sportifly teslimat, iptal ve iade şartları.",
};

export default function RefundPage() {
  return (
    <PageShell
      title="Teslimat ve İade Şartları"
      lead="Sportifly'da satın alınan hizmetler fiziksel ürün değildir; belirtilen tarih, saat ve yerde sunulur."
      updated="12 Eylül 2026"
    >
      <LegalMarkdown source={readLegal("teslimat-ve-iade")} />
    </PageShell>
  );
}
