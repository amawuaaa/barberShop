import { NextResponse } from "next/server";
import { format } from "date-fns";
import { z } from "zod";
import { AppointmentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { dispatchStatusChangeNotifications } from "@/lib/notifications";

const patchSchema = z.object({
  status: z.enum([
    AppointmentStatus.PENDING,
    AppointmentStatus.CONFIRMED,
    AppointmentStatus.CANCELLED,
    AppointmentStatus.COMPLETED,
  ]),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * PATCH /api/admin/appointments/:id
 * Cambia el estado de una cita (PENDING → CONFIRMED, CANCELLED, etc.).
 */
export async function PATCH(request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = patchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
    }

    const previous = await prisma.appointment.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!previous) {
      return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: { status: parsed.data.status },
      include: { service: true, barber: true },
    });

    const status = parsed.data.status;
    const notifiable =
      status === "CONFIRMED" ||
      status === "CANCELLED" ||
      status === "COMPLETED";

    let notifications = undefined;
    if (notifiable && previous.status !== status) {
      notifications = await dispatchStatusChangeNotifications({
        appointmentId: appointment.id,
        customerName: appointment.name,
        customerEmail: appointment.email,
        customerPhone: appointment.phone,
        serviceName: appointment.service.name,
        barberName: appointment.barber.name,
        date: format(appointment.date, "yyyy-MM-dd"),
        time: appointment.time,
        status,
      });
    }

    return NextResponse.json({ appointment, notifications });
  } catch (error) {
    console.error("[PATCH /api/admin/appointments/:id]", error);
    return NextResponse.json(
      { error: "No se pudo actualizar la cita" },
      { status: 500 }
    );
  }
}
