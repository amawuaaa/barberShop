export function Hero() {
  return (
    <section className="relative isolate min-h-[100svh] bg-[var(--ink)]">
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
            className="brand-mark font-display animate-brand-reveal text-[var(--silver-light)]"
            aria-label="Tu imagen habla antes que tú"
          >
            <span className="brand-mark__line">Tu imagen habla</span>
            <span className="brand-mark__line">antes que tú</span>
          </p>
          <div
            className="mt-4 h-px w-16 bg-[var(--silver)] sm:mt-5 sm:w-24 animate-line-draw"
            aria-hidden
          />
          <h1 className="mt-5 max-w-xl text-lg leading-snug text-[var(--silver)] sm:mt-6 sm:text-2xl animate-fade-up [animation-delay:200ms]">
            Cada cita está pensada para quienes valoran su tiempo, el detalle y
            una atención personalizada.
          </h1>
          <div className="mt-8 flex w-full flex-col gap-3 sm:mt-9 sm:w-auto sm:flex-row sm:flex-wrap animate-fade-up [animation-delay:320ms]">
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
