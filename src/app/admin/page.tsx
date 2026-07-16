import { format } from "date-fns";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    return (
      <main className="flex min-h-full flex-1 items-center justify-center bg-[var(--ink)] px-4 py-16">
        <AdminLoginForm />
      </main>
    );
  }

  const today = format(new Date(), "yyyy-MM-dd");

  const appointments = await prisma.appointment.findMany({
    where: { date: new Date(`${today}T00:00:00.000Z`) },
    orderBy: [{ time: "asc" }],
    include: {
      service: true,
      barber: true,
    },
  });

  return (
    <main className="min-h-full flex-1 bg-[var(--ink)] text-[var(--silver)]">
      <AdminDashboard
        initialDate={today}
        appointments={appointments.map((appointment) => ({
          id: appointment.id,
          name: appointment.name,
          phone: appointment.phone,
          email: appointment.email,
          date: format(appointment.date, "yyyy-MM-dd"),
          time: appointment.time,
          status: appointment.status,
          service: {
            name: appointment.service.name,
            duration: appointment.service.duration,
            price: appointment.service.price,
          },
          barber: { name: appointment.barber.name },
        }))}
      />
    </main>
  );
}
