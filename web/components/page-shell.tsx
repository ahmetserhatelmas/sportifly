import type { ReactNode } from "react";

export function PageShell({
  title,
  lead,
  updated,
  children,
}: {
  title: string;
  lead?: string;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <article className="bg-white">
      <div className="border-b border-line bg-surface">
        <div className="mx-auto max-w-3xl px-5 py-14">
          <h1 className="text-3xl font-extrabold tracking-tight text-ink md:text-4xl">{title}</h1>
          {lead ? <p className="mt-4 text-lg leading-7 text-ink-2">{lead}</p> : null}
          {updated ? <p className="mt-3 text-xs text-ink-3">Son güncelleme: {updated}</p> : null}
        </div>
      </div>
      <div className="mx-auto max-w-3xl px-5 py-12">{children}</div>
    </article>
  );
}
