import { site } from "@/lib/site";

function AppleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.365 1.43c0 1.14-.417 2.212-1.226 3.124-.97 1.086-2.14 1.712-3.41 1.61a3.55 3.55 0 0 1-.03-.42c0-1.1.475-2.27 1.32-3.23.42-.49.955-.9 1.6-1.23.645-.32 1.255-.5 1.83-.53.02.23.03.45.03.68l-.114-.004zM20.6 17.32c-.36.83-.79 1.6-1.29 2.3-.68.96-1.24 1.63-1.67 2-.66.6-1.37.91-2.13.93-.55 0-1.2-.16-1.97-.47-.77-.32-1.48-.47-2.12-.47-.68 0-1.41.15-2.19.47-.78.31-1.41.48-1.89.49-.73.03-1.46-.29-2.18-.95-.46-.4-1.04-1.1-1.75-2.08-.76-1.06-1.38-2.29-1.87-3.7C1.02 14.32.75 12.84.75 11.41c0-1.63.35-3.04 1.06-4.22a6.2 6.2 0 0 1 2.22-2.25 5.98 5.98 0 0 1 3-.85c.58 0 1.34.18 2.29.53.95.35 1.56.53 1.83.53.2 0 .88-.21 2.03-.63 1.09-.39 2.01-.55 2.77-.49 2.05.17 3.59.98 4.62 2.43-1.84 1.11-2.75 2.67-2.73 4.67.02 1.56.58 2.85 1.69 3.88.5.47 1.06.84 1.68 1.1-.13.39-.28.77-.44 1.14l-.17.07z" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M3.6 2.3c-.4.2-.6.7-.6 1.2v17c0 .5.2 1 .6 1.2l9.8-9.7L3.6 2.3zm11.2 8.3 2.7-2.7L6.1 1.6l8.7 9zm0 2.8-8.7 9 11.4-6.3-2.7-2.7zm4.1-3.9-3 1.7 3 1.7 2.6-1.4c.7-.4.7-1.3 0-1.7l-2.6-1.4.0 1.1z" />
    </svg>
  );
}

export function StoreBadges({ compact = false }: { compact?: boolean }) {
  const base = compact
    ? "px-3.5 py-2 text-[13px]"
    : "px-5 py-3 text-sm";
  return (
    <div className="flex flex-wrap items-center gap-3">
      <a
        href={site.appStoreUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-2.5 rounded-xl bg-ink text-white transition hover:bg-black ${base}`}
      >
        <AppleIcon />
        <span className="leading-tight">
          <span className="block text-[10px] font-medium opacity-75">İndir</span>
          <span className="block font-semibold">App Store</span>
        </span>
      </a>
      <a
        href={site.playStoreUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-2.5 rounded-xl bg-ink text-white transition hover:bg-black ${base}`}
      >
        <PlayIcon />
        <span className="leading-tight">
          <span className="block text-[10px] font-medium opacity-75">Edinin</span>
          <span className="block font-semibold">Google Play</span>
        </span>
      </a>
    </div>
  );
}
