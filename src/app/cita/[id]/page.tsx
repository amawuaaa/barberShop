import { ManageAppointment } from "@/components/booking/manage-appointment";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string }>;
};

export default async function ManageAppointmentPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const { t } = await searchParams;

  if (!t) {
    return (
      <main className="min-h-full flex-1 bg-[var(--ink)] text-[var(--silver)]">
        <div className="mx-auto max-w-lg px-4 py-16 text-center">
          <h1 className="font-display text-2xl font-bold text-[var(--silver-light)]">
            Enlace incompleto
          </h1>
          <p className="mt-2 text-[var(--steel)]">
            Abre el enlace completo que recibiste por email o WhatsApp.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-full flex-1 bg-[var(--ink)] text-[var(--silver)]">
      <ManageAppointment appointmentId={id} token={t} />
    </main>
  );
}
