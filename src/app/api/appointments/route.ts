import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { appointmentSchema } from "@/lib/validations/appointment";
import {
  sendEmailConfirmation,
  sendWhatsAppConfirmation,
} from "@/lib/notifications";

/**
 * POST /api/appointments
 * Recibe el formulario de reserva, valida con Zod y persiste en SQLite.
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

    // Verifica que servicio y barbero existan
    const [service, barber] = await Promise.all([
      prisma.service.findUnique({ where: { id: data.serviceId } }),
      prisma.barber.findUnique({ where: { id: data.barberId } }),
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

    // Guarda la cita (estado PENDING por defecto)
    // date: medianoche UTC del día seleccionado
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

    // -----------------------------------------------------------------------
    // NOTIFICACIONES (post-persistencia)
    // Aquí es donde se disparan Email (Resend) y WhatsApp (Twilio).
    // Se ejecutan en paralelo; un fallo de notificación no revierte la cita.
    // -----------------------------------------------------------------------
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

    await Promise.allSettled([
      sendEmailConfirmation(notificationPayload),
      sendWhatsAppConfirmation(notificationPayload),
    ]);

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
 * GET /api/appointments
 * Lista citas (útil para panel interno / depuración).
 */
export async function GET() {
  try {
    const appointments = await prisma.appointment.findMany({
      orderBy: [{ date: "asc" }, { time: "asc" }],
      include: {
        service: true,
        barber: true,
      },
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
