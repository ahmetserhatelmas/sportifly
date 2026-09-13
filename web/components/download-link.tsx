"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";

export function DownloadLink({
  className,
  children,
  onNavigate,
}: {
  className?: string;
  children: ReactNode;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <Link
      href="/#indir"
      className={className}
      onClick={(e) => {
        onNavigate?.();
        if (pathname !== "/") {
          return;
        }
        e.preventDefault();
        const el = document.getElementById("indir");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          router.replace("/#indir", { scroll: false });
        }
      }}
    >
      {children}
    </Link>
  );
}
