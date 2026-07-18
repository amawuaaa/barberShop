import { NextResponse } from "next/server";
import { format } from "date-fns";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { verifyAppointmentToken } from "@/lib/appointment-token";
import { assertSlotAvailable } from "@/lib/availability";
import { manageAppointmentSchema } from "@/lib/validations/manage-appointment";
import { dispatchStatusChangeNotifications } from "@/lib/notifications";
import { checkRateLimit, clientIpFromRequest } from "@/lib/rate-limit";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function serializeAppointment(appointment: {
  id: string;
  name: string;
  phone: string;
  email: string;
  date: Date;
  time: string;
  status: string;
  service: { id: string; name: string; duration: number };
  barber: { id: string; name: string };
}) {
  return {
    id: appointment.id,
    name: appointment.name,
    phone: appointment.phone,
    email: appointment.email,
    date: format(appointment.date, "yyyy-MM-dd"),
    time: appointment.time,
    status: appointment.status,
    service: {
      id: appointment.service.id,
      name: appointment.service.name,
      duration: appointment.service.duration,
    },
    barber: {
      id: appointment.barber.id,
      name: appointment.barber.name,
    },
  };
}

/**
 * GET /api/appointments/:id?t=token
 * Detalle de cita para el cliente (token firmado).
 */
export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const token = new URL(request.url).searchParams.get("t");

    if (!verifyAppointmentToken(id, token)) {
      return NextResponse.json({ error: "Enlace no válido" }, { status: 401 });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { service: true, barber: true },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
    }

    return NextResponse.json({
      appointment: serializeAppointment(appointment),
    });
  } catch (error) {
    console.error("[GET /api/appointments/:id]", error);
    return NextResponse.json(
      { error: "No se pudo cargar la cita" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/appointments/:id
 * Cancelar o reprogramar con token del cliente.
 */
export async function PATCH(request: Request, context: RouteContext) {
  const ip = clientIpFromRequest(request);
  const limited = checkRateLimit({
    key: `appointments:manage:${ip}`,
    limit: 20,
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
    const { id } = await context.params;
    const body = await request.json();
    const parsed = manageAppointmentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    if (!verifyAppointmentToken(id, parsed.data.token)) {
      return NextResponse.json({ error: "Enlace no válido" }, { status: 401 });
    }

    const existing = await prisma.appointment.findUnique({
      where: { id },
      include: { service: true, barber: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
    }

    if (existing.status === "CANCELLED" || existing.status === "COMPLETED") {
      return NextResponse.json(
        { error: "Esta cita ya no se puede modificar" },
        { status: 409 }
      );
    }

    if (parsed.data.action === "cancel") {
      const appointment = await prisma.appointment.update({
        where: { id },
        data: { status: "CANCELLED" },
        include: { service: true, barber: true },
      });

      const notifications = await dispatchStatusChangeNotifications({
        appointmentId: appointment.id,
        customerName: appointment.name,
        customerEmail: appointment.email,
        customerPhone: appointment.phone,
        serviceName: appointment.service.name,
        barberName: appointment.barber.name,
        date: format(appointment.date, "yyyy-MM-dd"),
        time: appointment.time,
        status: "CANCELLED",
      });

      return NextResponse.json({
        appointment: serializeAppointment(appointment),
        notifications,
      });
    }

    const { date, time } = parsed.data;

    try {
      const appointment = await prisma.$transaction(async (tx) => {
        await tx.$executeRaw`
          SELECT pg_advisory_xact_lock(
            hashtext(${existing.barberId}),
            hashtext(${date})
          )
        `;

        const availability = await assertSlotAvailable(
          {
            barberId: existing.barberId,
            serviceId: existing.serviceId,
            date,
            time,
            ignoreAppointmentId: id,
          },
          tx
        );

        if (!availability.ok) {
          throw new SlotUnavailableError(availability.error);
        }

        return tx.appointment.update({
          where: { id },
          data: {
            date: new Date(`${date}T00:00:00.000Z`),
            time,
            status: "PENDING",
            reminderSentAt: null,
          },
          include: { service: true, barber: true },
        });
      });

      const notifications = await dispatchStatusChangeNotifications({
        appointmentId: appointment.id,
        customerName: appointment.name,
        customerEmail: appointment.email,
        customerPhone: appointment.phone,
        serviceName: appointment.service.name,
        barberName: appointment.barber.name,
        date,
        time: appointment.time,
        status: "RESCHEDULED",
      });

      return NextResponse.json({
        appointment: serializeAppointment(appointment),
        notifications,
      });
    } catch (error) {
      if (error instanceof SlotUnavailableError) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
      throw error;
    }
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

    console.error("[PATCH /api/appointments/:id]", error);
    return NextResponse.json(
      { error: "No se pudo actualizar la cita" },
      { status: 500 }
    );
  }
}

class SlotUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SlotUnavailableError";
  }
}
