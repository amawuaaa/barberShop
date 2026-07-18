import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Reservas online para barberías — SIGMABARBER",
  description:
    "Tus clientes reservan solos. Confirmación por WhatsApp y email. Panel simple para el dueño.",
};

const paymentLink = process.env.PILOT_PAYMENT_LINK?.trim();
const contactEmail =
  process.env.PILOT_CONTACT_EMAIL?.trim() || "hola@sigmabarber.com";

export default function ParaBarberiasPage() {
  const ctaHref = paymentLink || `mailto:${contactEmail}?subject=Piloto%20reservas%20SIGMABARBER`;
  const ctaLabel = paymentLink ? "Empezar piloto" : "Escribir para empezar";

  return (
    <main className="min-h-full flex-1 bg-[var(--ink)] text-[var(--silver)]">
      <div className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(200,205,212,0.12),transparent_55%),radial-gradient(ellipse_at_80%_100%,rgba(120,130,140,0.08),transparent_50%)]"
        />

        <header className="relative mx-auto flex max-w-5xl items-center justify-between px-4 py-6 sm:px-8">
          <Link
            href="/"
            className="font-display text-sm font-bold tracking-[0.2em] text-[var(--silver-light)]"
          >
            SIGMABARBER
          </Link>
          <Link
            href="/"
            className="text-sm text-[var(--steel)] underline-offset-2 hover:underline"
          >
            Ver demo
          </Link>
        </header>

        <section className="relative mx-auto flex min-h-[70vh] max-w-5xl flex-col justify-center px-4 py-16 sm:px-8 sm:py-24">
          <p className="font-display text-sm font-bold tracking-[0.22em] text-[var(--silver-light)]">
            SIGMABARBER
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-bold tracking-tight text-[var(--silver-light)] sm:text-6xl">
            Tus clientes reservan solos.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-[var(--silver)] sm:text-lg">
            Sistema de citas para barberías: horarios reales, sin doble reserva,
            confirmación por WhatsApp y un panel claro para el dueño.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href={ctaHref}
              className="inline-flex min-h-12 items-center justify-center bg-[var(--silver-light)] px-6 text-sm font-semibold tracking-wide text-[var(--ink)] transition-colors hover:bg-[var(--silver)]"
            >
              {ctaLabel}
            </a>
            <p className="text-sm text-[var(--steel)]">
              Piloto desde 49€/mes · setup incluido
            </p>
          </div>
        </section>
      </div>

      <section className="border-t border-[var(--line)]">
        <div className="mx-auto max-w-5xl space-y-10 px-4 py-16 sm:px-8">
          <header className="max-w-2xl space-y-3">
            <h2 className="font-display text-2xl font-bold tracking-wide text-[var(--silver-light)] sm:text-3xl">
              Qué incluye el piloto
            </h2>
            <p className="text-[var(--silver)]">
              Todo lo necesario para dejar de perder citas en el chat.
            </p>
          </header>

          <ul className="grid gap-8 sm:grid-cols-3">
            {[
              {
                title: "Reserva online",
                body: "Wizard de 4 pasos con slots reales por barbero y servicio.",
              },
              {
                title: "WhatsApp + email",
                body: "Confirmación al cliente y aviso al dueño. Cancelar o reprogramar con un enlace.",
              },
              {
                title: "Panel del dueño",
                body: "Citas del día o semana, horarios, días libres y catálogo de servicios.",
              },
            ].map((item) => (
              <li key={item.title} className="space-y-2">
                <h3 className="font-display text-lg font-bold tracking-wide text-[var(--silver-light)]">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-[var(--steel)]">
                  {item.body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t border-[var(--line)] bg-[var(--mist)]">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-14 sm:flex-row sm:items-end sm:justify-between sm:px-8">
          <div className="max-w-lg space-y-2">
            <h2 className="font-display text-2xl font-bold tracking-wide text-[var(--silver-light)]">
              Listo para tu sillón
            </h2>
            <p className="text-sm text-[var(--silver)]">
              Montamos tu instancia, cargamos servicios y horarios, y en pocos
              días tus clientes ya pueden reservar.
            </p>
          </div>
          <a
            href={ctaHref}
            className="inline-flex min-h-12 items-center justify-center border border-[var(--silver-light)] px-6 text-sm font-semibold tracking-wide text-[var(--silver-light)] transition-colors hover:bg-[var(--silver-light)] hover:text-[var(--ink)]"
          >
            {ctaLabel}
          </a>
        </div>
      </section>

      <footer className="border-t border-[var(--line)]">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-8 text-sm text-[var(--steel)] sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="font-display font-bold tracking-[0.14em] text-[var(--silver-light)]">
            SIGMABARBER
          </p>
          <p>
            <Link href="/" className="underline-offset-2 hover:underline">
              Volver a la demo
            </Link>
          </p>
        </div>
      </footer>
    </main>
  );
}
