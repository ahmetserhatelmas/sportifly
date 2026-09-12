import Image from "next/image";

/**
 * Basit telefon çerçevesi. `src` uygulama ekran görüntüsü (dikey, 9:20).
 */
export function Phone({
  src,
  alt,
  priority = false,
  className = "",
}: {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`relative aspect-[9/19.5] w-full overflow-hidden rounded-[2.4rem] border-[8px] border-ink bg-ink shadow-2xl shadow-ink/25 ${className}`}
    >
      <div className="pointer-events-none absolute left-1/2 top-2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-ink" />
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(min-width: 768px) 320px, 70vw"
        className="object-cover"
        priority={priority}
      />
    </div>
  );
}
