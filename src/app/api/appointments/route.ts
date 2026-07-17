import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { appointmentSchema } from "@/lib/validations/appointment";
import { createAppointmentSafely } from "@/lib/availability";
import { dispatchAppointmentNotifications } from "@/lib/notifications";

/**
 * POST /api/appointments
 * Valida, comprueba disponibilidad (con lock) y guarda la cita.
 * El listado del dueño vive en /api/admin/appointments (autenticado).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = appointmentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Datos de reserva inválidos",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const result = await createAppointmentSafely(data);

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    const { appointment } = result;

    // Notificaciones post-persistencia (Resend + Twilio).
    // Si faltan API keys o fallan, la cita igual queda guardada.
    const notifications = await dispatchAppointmentNotifications({
      appointmentId: appointment.id,
      customerName: appointment.name,
      customerEmail: appointment.email,
      customerPhone: appointment.phone,
      serviceName: appointment.service.name,
      barberName: appointment.barber.name,
      date: data.date,
      time: appointment.time,
    });

    return NextResponse.json(
      {
        ok: true,
        appointment: {
          id: appointment.id,
          status: appointment.status,
          date: data.date,
          time: appointment.time,
          service: appointment.service.name,
          barber: appointment.barber.name,
        },
        notifications,
      },
      { status: 201 }
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Ese horario acaba de ocuparse. Elige otro." },
        { status: 409 }
      );
    }

    console.error("[POST /api/appointments]", error);
    return NextResponse.json(
      { error: "No se pudo crear la cita" },
      { status: 500 }
    );
  }
}
