import { SiteHeader } from "@/components/landing/site-header";
import { Hero } from "@/components/landing/hero";
import { ServicesPreview } from "@/components/landing/services-preview";
import { BookingWizard } from "@/components/booking/booking-wizard";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getCatalog() {
  const [services, barbers] = await Promise.all([
    prisma.service.findMany({
      where: { active: true },
      orderBy: { price: "asc" },
    }),
    prisma.barber.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return { services, barbers };
}

export default async function HomePage() {
  const { services, barbers } = await getCatalog();

  return (
    <main className="flex-1 overflow-x-hidden bg-[var(--ink)] text-[var(--silver)]">
      <SiteHeader />
      <Hero />
      <ServicesPreview services={services} />

      <section id="reservar" className="scroll-mt-4 bg-[var(--ink)]">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-8 sm:py-20">
          <header className="mb-6 space-y-2 text-center animate-fade-up sm:mb-8">
            <h2 className="font-display text-2xl font-bold tracking-[0.08em] text-[var(--silver-light)] sm:text-4xl">
              Reserva tu cita
            </h2>
            <p className="text-sm text-[var(--silver)] sm:text-base">
              Cuatro pasos. Horarios reales según disponibilidad del barbero.
            </p>
          </header>
          <BookingWizard services={services} barbers={barbers} />
        </div>
      </section>

      <footer className="border-t border-[var(--line)] bg-[var(--paper-warm)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-[var(--silver)] sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="font-display font-bold tracking-[0.14em] text-[var(--silver-light)] sm:tracking-[0.18em]">
            SIGMABARBER
          </p>
          <p className="text-[var(--steel)]">
            Citas en vivo ·{" "}
            <a href="/admin" className="underline-offset-2 hover:underline">
              Panel
            </a>
            {" · "}
            <a
              href="/para-barberias"
              className="underline-offset-2 hover:underline"
            >
              Para barberías
            </a>
          </p>
        </div>
      </footer>
    </main>
  );
}
