import { NextResponse } from "next/server";
import { z } from "zod";
import { AppointmentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";

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

    const appointment = await prisma.appointment.update({
      where: { id },
      data: { status: parsed.data.status },
      include: { service: true, barber: true },
    });

    return NextResponse.json({ appointment });
  } catch (error) {
    console.error("[PATCH /api/admin/appointments/:id]", error);
    return NextResponse.json(
      { error: "No se pudo actualizar la cita" },
      { status: 500 }
    );
  }
}
