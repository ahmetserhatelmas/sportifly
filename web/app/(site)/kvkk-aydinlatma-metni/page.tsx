import type { Metadata } from "next";
import { LegalMarkdown } from "@/components/legal-markdown";
import { PageShell } from "@/components/page-shell";
import { readLegal } from "@/lib/legal";

export const metadata: Metadata = {
  title: "KVKK Aydınlatma Metni",
  description: "6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında Sportifly veri sorumlusu aydınlatma metni.",
};

export default function KvkkPage() {
  return (
    <PageShell title="KVKK Aydınlatma Metni" updated="12 Eylül 2026">
      <LegalMarkdown source={readLegal("kvkk")} />
    </PageShell>
  );
}
