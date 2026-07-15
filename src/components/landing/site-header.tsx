import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-4 sm:gap-3 sm:px-8 sm:py-5">
        <Link
          href="/"
          className="shrink font-display text-[0.7rem] font-bold tracking-[0.06em] text-[var(--silver-light)] transition-colors hover:text-[var(--silver)] min-[380px]:text-xs sm:text-lg sm:tracking-[0.16em]"
        >
          SIGMABARBER
        </Link>
        <nav className="flex shrink-0 items-center gap-2.5 text-sm text-[var(--silver)] sm:gap-6">
          <a
            href="#servicios"
            className="transition-colors hover:text-[var(--silver-light)]"
          >
            Servicios
          </a>
          <a
            href="#reservar"
            className="border border-[var(--silver)] px-3 py-2 text-[var(--silver-light)] transition-colors hover:bg-[var(--silver-light)] hover:text-[var(--ink)] sm:py-1.5"
          >
            Reservar
          </a>
        </nav>
      </div>
    </header>
  );
}
