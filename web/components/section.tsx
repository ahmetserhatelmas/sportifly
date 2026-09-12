import type { ReactNode } from "react";

export function Section({
  id,
  eyebrow,
  title,
  lead,
  children,
  tone = "white",
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  lead?: string;
  children: ReactNode;
  tone?: "white" | "surface";
}) {
  return (
    <section
      id={id}
      className={`scroll-mt-20 py-20 ${tone === "surface" ? "bg-surface" : "bg-white"}`}
    >
      <div className="mx-auto max-w-6xl px-5">
        <div className="max-w-2xl">
          {eyebrow ? (
            <p className="text-sm font-semibold uppercase tracking-wider text-brand-dark">{eyebrow}</p>
          ) : null}
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-ink md:text-4xl">{title}</h2>
          {lead ? <p className="mt-4 text-lg leading-7 text-ink-2">{lead}</p> : null}
        </div>
        <div className="mt-12">{children}</div>
      </div>
    </section>
  );
}
