export function Hero() {
  return (
    <section className="relative isolate min-h-[100svh] overflow-hidden bg-[var(--ink)]">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 80% 55% at 70% 20%, rgba(196, 199, 204, 0.14), transparent 60%), radial-gradient(ellipse 50% 40% at 10% 90%, rgba(154, 161, 170, 0.1), transparent 55%)",
        }}
      />

      <div className="relative mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-end px-4 pb-12 pt-24 sm:px-8 sm:pb-24 sm:pt-28">
        <div className="max-w-3xl">
          <p className="font-display text-[clamp(2.4rem,12vw,5.5rem)] font-extrabold leading-[0.92] tracking-[0.08em] text-[var(--silver-light)] sm:tracking-[0.14em] animate-brand-reveal">
            SIGMABARBER
          </p>
          <div
            className="mt-4 h-px w-16 bg-[var(--silver)] sm:mt-5 sm:w-24 animate-line-draw"
            aria-hidden
          />
          <h1 className="mt-5 max-w-xl text-lg leading-snug text-[var(--silver)] sm:mt-6 sm:text-2xl animate-fade-up [animation-delay:200ms]">
            No es solo un corte — es un cambio de imagen.
          </h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--steel)] animate-fade-up [animation-delay:320ms]">
            Reserva en minutos. Confirmación por WhatsApp y email.
          </p>
          <div className="mt-8 flex w-full flex-col gap-3 sm:mt-9 sm:w-auto sm:flex-row sm:flex-wrap animate-fade-up [animation-delay:420ms]">
            <a
              href="#reservar"
              className="inline-flex min-h-12 items-center justify-center bg-[var(--silver-light)] px-6 py-3 text-sm font-medium tracking-wide text-[var(--ink)] transition-all duration-300 hover:bg-[var(--silver)]"
            >
              Reservar cita
            </a>
            <a
              href="#servicios"
              className="inline-flex min-h-12 items-center justify-center border border-[var(--silver)] px-6 py-3 text-sm text-[var(--silver-light)] transition-colors hover:bg-[var(--mist)]"
            >
              Ver servicios
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
