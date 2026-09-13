import type { ReactNode } from "react";

function linkify(text: string): ReactNode[] {
  const re = /(destek@sportifly\.app|www\.sportifly\.app|https?:\/\/[^\s]+)/g;
  const out: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const token = m[1];
    if (token === "destek@sportifly.app") {
      out.push(
        <a key={i++} href="mailto:destek@sportifly.app">
          destek@sportifly.app
        </a>
      );
    } else {
      const href = token.startsWith("http") ? token : `https://${token}`;
      out.push(
        <a key={i++} href={href} target="_blank" rel="noopener noreferrer">
          {token}
        </a>
      );
    }
    last = m.index + token.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function LegalMarkdown({ source }: { source: string }) {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const nodes: ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const raw = lines[i];
    if (!raw.trim()) {
      i += 1;
      continue;
    }

    if (raw.startsWith("# ")) {
      nodes.push(<h2 key={key++}>{raw.slice(2).trim()}</h2>);
      i += 1;
      continue;
    }

    if (raw.startsWith("|")) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        const cells = lines[i]
          .split("|")
          .slice(1, -1)
          .map((c) => c.trim());
        if (!cells.every((c) => /^-+$/.test(c))) rows.push(cells);
        i += 1;
      }
      if (rows.length > 0) {
        const [head, ...body] = rows;
        nodes.push(
          <div key={key++} className="not-prose my-6 overflow-hidden rounded-2xl border border-line">
            <table className="w-full text-sm">
              <thead className="bg-surface text-left text-ink">
                <tr>
                  {head.map((c) => (
                    <th key={c} className="px-4 py-3 font-semibold">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {body.map((row) => (
                  <tr key={row.join("|")} className="border-t border-line">
                    {row.map((c, idx) => (
                      <td
                        key={idx}
                        className={idx === 1 ? "px-4 py-3 font-semibold text-ink" : "px-4 py-3 text-ink-2"}
                      >
                        {c}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      continue;
    }

    nodes.push(<p key={key++}>{linkify(raw)}</p>);
    i += 1;
  }

  return <div className="prose-legal">{nodes}</div>;
}
