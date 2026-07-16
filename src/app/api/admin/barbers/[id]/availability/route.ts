import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { weekScheduleSchema } from "@/lib/validations/availability";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * PUT /api/admin/barbers/:id/availability
 * Reemplaza el horario semanal del barbero.
 */
export async function PUT(request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { id: barberId } = await context.params;
    const barber = await prisma.barber.findUnique({ where: { id: barberId } });

    if (!barber) {
      return NextResponse.json({ error: "Barbero no encontrado" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = weekScheduleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Horario inválido",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const enabledDays = parsed.data.days.filter((day) => day.enabled);

    await prisma.$transaction(async (tx) => {
      await tx.barberAvailability.deleteMany({ where: { barberId } });

      if (enabledDays.length > 0) {
        await tx.barberAvailability.createMany({
          data: enabledDays.map((day) => ({
            barberId,
            dayOfWeek: day.dayOfWeek,
            startTime: day.startTime!,
            endTime: day.endTime!,
            breakStart: day.breakStart || null,
            breakEnd: day.breakEnd || null,
          })),
        });
      }
    });

    const availabilities = await prisma.barberAvailability.findMany({
      where: { barberId },
      orderBy: { dayOfWeek: "asc" },
    });

    return NextResponse.json({ ok: true, availabilities });
  } catch (error) {
    console.error("[PUT /api/admin/barbers/:id/availability]", error);
    return NextResponse.json(
      { error: "No se pudo guardar el horario" },
      { status: 500 }
    );
  }
}
