import Image from "next/image";
import Link from "next/link";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="Sportifly ana sayfa">
      <Image
        src="/icon.png"
        alt=""
        width={36}
        height={36}
        className="rounded-xl"
        priority
      />
      <span
        className={`text-lg font-extrabold tracking-tight ${light ? "text-white" : "text-ink"}`}
      >
        Sportifly
      </span>
    </Link>
  );
}
