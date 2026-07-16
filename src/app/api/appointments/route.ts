import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { appointmentSchema } from "@/lib/validations/appointment";
import { assertSlotAvailable } from "@/lib/availability";
import { dispatchAppointmentNotifications } from "@/lib/notifications";

/**
 * POST /api/appointments
 * Valida, comprueba disponibilidad y guarda la cita.
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

    const [service, barber] = await Promise.all([
      prisma.service.findFirst({
        where: { id: data.serviceId, active: true },
      }),
      prisma.barber.findFirst({
        where: { id: data.barberId, active: true },
      }),
    ]);

    if (!service) {
      return NextResponse.json(
        { error: "Servicio no encontrado" },
        { status: 404 }
      );
    }

    if (!barber) {
      return NextResponse.json(
        { error: "Barbero no encontrado" },
        { status: 404 }
      );
    }

    const availability = await assertSlotAvailable({
      barberId: data.barberId,
      serviceId: data.serviceId,
      date: data.date,
      time: data.time,
    });

    if (!availability.ok) {
      return NextResponse.json({ error: availability.error }, { status: 409 });
    }

    const appointment = await prisma.appointment.create({
      data: {
        clientId: data.clientId,
        name: data.name,
        phone: data.phone,
        email: data.email,
        date: new Date(`${data.date}T00:00:00.000Z`),
        time: data.time,
        status: "PENDING",
        barberId: data.barberId,
        serviceId: data.serviceId,
      },
      include: {
        service: true,
        barber: true,
      },
    });

    // Notificaciones post-persistencia (Resend + Twilio).
    // Si faltan API keys o fallan, la cita igual queda guardada.
    const notificationPayload = {
      appointmentId: appointment.id,
      customerName: appointment.name,
      customerEmail: appointment.email,
      customerPhone: appointment.phone,
      serviceName: appointment.service.name,
      barberName: appointment.barber.name,
      date: data.date,
      time: appointment.time,
    };

    const notifications = await dispatchAppointmentNotifications(
      notificationPayload
    );

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
    console.error("[POST /api/appointments]", error);
    return NextResponse.json(
      { error: "No se pudo crear la cita" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/appointments — listado básico (depuración).
 * El panel del dueño usa /api/admin/appointments.
 */
export async function GET() {
  try {
    const appointments = await prisma.appointment.findMany({
      orderBy: [{ date: "asc" }, { time: "asc" }],
      include: { service: true, barber: true },
      take: 50,
    });

    return NextResponse.json({ appointments });
  } catch (error) {
    console.error("[GET /api/appointments]", error);
    return NextResponse.json(
      { error: "No se pudieron obtener las citas" },
      { status: 500 }
    );
  }
}
