import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Admin girişi" };

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div className="flex min-h-full items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-3">
          Sportifly
        </p>
        <h1 className="mt-1 text-2xl font-extrabold text-ink">Admin paneli</h1>
        <p className="mt-2 text-sm text-ink-2">
          Uygulamada admin olan hesabın e-posta ve şifresiyle gir.
        </p>
        <LoginForm
          initialError={error === "yetkisiz" ? "Bu hesap admin değil." : undefined}
        />
      </div>
    </div>
  );
}
