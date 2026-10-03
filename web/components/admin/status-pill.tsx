const tones: Record<string, string> = {
  pending: "bg-amber-50 text-amber-800",
  accepted: "bg-emerald-50 text-emerald-800",
  rejected: "bg-rose-50 text-rose-800",
  admin: "bg-violet-50 text-violet-800",
  banned: "bg-rose-50 text-rose-800",
  owner: "bg-sky-50 text-sky-800",
  instructor: "bg-indigo-50 text-indigo-800",
  field: "bg-teal-50 text-teal-800",
  lesson: "bg-orange-50 text-orange-800",
};

export function StatusPill({
  tone,
  children,
}: {
  tone: keyof typeof tones | string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${tones[tone] ?? "bg-surface text-ink-2"}`}
    >
      {children}
    </span>
  );
}
