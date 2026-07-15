export function Hero() {
  return (
    <section className="relative isolate min-h-[100svh] overflow-x-hidden bg-[var(--ink)]">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 80% 55% at 70% 20%, rgba(196, 199, 204, 0.14), transparent 60%), radial-gradient(ellipse 50% 40% at 10% 90%, rgba(154, 161, 170, 0.1), transparent 55%)",
        }}
      />

      <div className="relative mx-auto flex min-h-[100svh] w-full max-w-6xl flex-col justify-end px-4 pb-12 pt-24 sm:px-8 sm:pb-24 sm:pt-28">
        <div className="w-full min-w-0 max-w-3xl">
          <p
            className="font-display animate-brand-reveal w-full min-w-0 font-extrabold text-[var(--silver-light)]"
            aria-label="SIGMABARBER"
          >
            <span className="block text-[clamp(2.5rem,15vw,4.5rem)] leading-[0.92] tracking-[0.02em] lg:inline lg:text-7xl lg:tracking-[0.1em] xl:text-8xl">
              SIGMA
            </span>
            <span className="block text-[clamp(2.5rem,15vw,4.5rem)] leading-[0.92] tracking-[0.02em] lg:inline lg:text-7xl lg:tracking-[0.1em] xl:text-8xl">
              BARBER
            </span>
          </p>
          <div
            className="mt-4 h-px w-16 bg-[var(--silver)] sm:mt-5 sm:w-24 animate-line-draw"
            aria-hidden
          />
          <h1 className="mt-5 max-w-xl text-lg leading-snug text-[var(--silver)] sm:mt-6 sm:text-2xl animate-fade-up [animation-delay:200ms]">
            No es solo un corte — es un cambio de imagen.
          </h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--steel)] animate-fade-up [animation-delay:320ms]">
            Reserva en minutos. Flujo interactivo de demostración.
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
