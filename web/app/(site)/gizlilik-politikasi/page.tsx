import type { Metadata } from "next";
import { LegalMarkdown } from "@/components/legal-markdown";
import { PageShell } from "@/components/page-shell";
import { readLegal } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Gizlilik Politikası",
  description: "Sportifly gizlilik politikası: kişisel verilerin toplanması, kullanılması ve korunması.",
};

export default function PrivacyPage() {
  return (
    <PageShell title="Gizlilik Politikası" updated="12 Eylül 2026">
      <LegalMarkdown source={readLegal("gizlilik")} />
    </PageShell>
  );
}
