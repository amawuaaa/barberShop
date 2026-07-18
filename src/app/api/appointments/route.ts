import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { appointmentSchema } from "@/lib/validations/appointment";
import { createAppointmentSafely } from "@/lib/availability";
import { dispatchAppointmentNotifications } from "@/lib/notifications";
import { checkRateLimit, clientIpFromRequest } from "@/lib/rate-limit";
import { buildAppointmentManageUrl } from "@/lib/appointment-token";

/**
 * POST /api/appointments
 * Valida, comprueba disponibilidad (con lock) y guarda la cita.
 * El listado del dueño vive en /api/admin/appointments (autenticado).
 */
export async function POST(request: Request) {
  const ip = clientIpFromRequest(request);
  const limited = checkRateLimit({
    key: `appointments:create:${ip}`,
    limit: 8,
    windowMs: 15 * 60 * 1000,
  });

  if (!limited.ok) {
    return NextResponse.json(
      { error: "Demasiados intentos. Espera un momento e inténtalo de nuevo." },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      }
    );
  }

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
          manageUrl: buildAppointmentManageUrl(appointment.id),
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
