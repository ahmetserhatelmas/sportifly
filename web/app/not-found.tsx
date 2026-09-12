import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col items-center px-5 py-32 text-center">
      <p className="text-sm font-semibold text-brand-dark">404</p>
      <h1 className="mt-2 text-3xl font-extrabold text-ink">Sayfa bulunamadı</h1>
      <p className="mt-3 text-ink-2">Aradığın sayfa taşınmış ya da hiç var olmamış olabilir.</p>
      <Link href="/" className="mt-8 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">
        Ana sayfaya dön
      </Link>
    </div>
  );
}
