import { formatPrice, type ServiceOption } from "@/types/booking";

type ServicesPreviewProps = {
  services: ServiceOption[];
};

export function ServicesPreview({ services }: ServicesPreviewProps) {
  return (
    <section
      id="servicios"
      className="scroll-mt-4 border-y border-[var(--line)] bg-[var(--paper-warm)]"
    >
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-8 sm:py-20">
        <header className="max-w-lg animate-fade-up">
          <h2 className="font-display text-2xl font-bold tracking-[0.08em] text-[var(--silver-light)] sm:text-4xl">
            Servicios
          </h2>
          <p className="mt-2 text-sm text-[var(--silver)] sm:text-base">
            Precisión y definición. Elige lo que necesitas y reserva al momento.
          </p>
        </header>

        <ul className="mt-8 divide-y divide-[var(--line)] border-y border-[var(--line)] sm:mt-10">
          {services.map((service, index) => (
            <li
              key={service.id}
              className="flex items-baseline justify-between gap-3 py-4 sm:gap-4 sm:py-5 animate-fade-up"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="min-w-0">
                <p className="text-base text-[var(--silver-light)] sm:text-lg">
                  {service.name}
                </p>
                <p className="mt-1 text-sm text-[var(--steel)]">
                  {service.duration} minutos
                </p>
              </div>
              <p className="shrink-0 font-display text-lg font-semibold text-[var(--silver)] sm:text-xl">
                {formatPrice(service.price)}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
