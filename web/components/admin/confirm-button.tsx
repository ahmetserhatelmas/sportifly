"use client";

export function ConfirmButton({
  action,
  confirm,
  children,
  className,
  name,
  value,
  hidden,
}: {
  action: (formData: FormData) => Promise<void>;
  confirm: string;
  children: React.ReactNode;
  className?: string;
  name?: string;
  value?: string;
  hidden?: Record<string, string>;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(confirm)) e.preventDefault();
      }}
    >
      {hidden &&
        Object.entries(hidden).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <button type="submit" className={className}>
        {children}
      </button>
    </form>
  );
}
