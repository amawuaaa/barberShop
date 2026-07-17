import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { barberSchema } from "@/lib/validations/catalog";

/** Lun–sáb 09:00–19:00 con pausa 13:00–15:00 (mismo default que el seed). */
const DEFAULT_WEEKDAY_SCHEDULE = {
  startTime: "09:00",
  endTime: "19:00",
  breakStart: "13:00",
  breakEnd: "15:00",
} as const;

/**
 * GET /api/admin/barbers
 * Lista barberos con horario. `?all=1` incluye inactivos.
 */
export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("all") === "1";

    const barbers = await prisma.barber.findMany({
      where: includeInactive ? undefined : { active: true },
      orderBy: [{ active: "desc" }, { name: "asc" }],
      include: {
        availabilities: {
          orderBy: { dayOfWeek: "asc" },
        },
      },
    });

    return NextResponse.json({ barbers });
  } catch (error) {
    console.error("[GET /api/admin/barbers]", error);
    return NextResponse.json(
      { error: "No se pudieron cargar los barberos" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/barbers
 * Crea barbero con horario semanal por defecto (lun–sáb).
 */
export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = barberSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Datos de barbero inválidos",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const barber = await prisma.barber.create({
      data: {
        name: parsed.data.name,
        specialty: parsed.data.specialty,
        active: parsed.data.active ?? true,
        availabilities: {
          create: Array.from({ length: 6 }, (_, index) => ({
            dayOfWeek: index + 1,
            ...DEFAULT_WEEKDAY_SCHEDULE,
          })),
        },
      },
      include: {
        availabilities: {
          orderBy: { dayOfWeek: "asc" },
        },
      },
    });

    return NextResponse.json({ barber }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/admin/barbers]", error);
    return NextResponse.json(
      { error: "No se pudo crear el barbero" },
      { status: 500 }
    );
  }
}
