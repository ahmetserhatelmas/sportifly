"use client";

import Link from "next/link";
import { useState } from "react";
import { DownloadLink } from "@/components/download-link";
import { Logo } from "@/components/logo";
import { nav } from "@/lib/site";

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Logo />

        <nav className="hidden items-center gap-7 md:flex" aria-label="Ana menü">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-ink-2 transition hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:block">
          <DownloadLink className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark">
            Uygulamayı indir
          </DownloadLink>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg p-2 text-ink md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label="Menüyü aç/kapat"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {open ? (
        <div id="mobile-menu" className="border-t border-line bg-white px-5 py-4 md:hidden">
          <nav className="flex flex-col gap-3" aria-label="Mobil menü">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="text-base font-medium text-ink"
              >
                {item.label}
              </Link>
            ))}
            <DownloadLink
              onNavigate={() => setOpen(false)}
              className="mt-2 rounded-full bg-brand px-4 py-2.5 text-center text-sm font-semibold text-white"
            >
              Uygulamayı indir
            </DownloadLink>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
