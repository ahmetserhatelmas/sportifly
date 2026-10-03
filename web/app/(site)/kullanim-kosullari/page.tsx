import type { Metadata } from "next";
import { LegalMarkdown } from "@/components/legal-markdown";
import { PageShell } from "@/components/page-shell";
import { readLegal } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Kullanım Koşulları",
  description: "Sportifly kullanım koşulları ve üyelik sözleşmesi.",
};

export default function TermsPage() {
  return (
    <PageShell title="Kullanım Koşulları ve Üyelik Sözleşmesi" updated="12 Eylül 2026">
      <LegalMarkdown source={readLegal("kullanim")} />
    </PageShell>
  );
}
